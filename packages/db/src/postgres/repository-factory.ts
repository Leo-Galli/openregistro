import { randomUUID } from 'node:crypto';
import { and, eq, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import { NotFoundError } from '@openregistro/core';
import type { Database } from './client';

/**
 * Zod's second type parameter is the schema's pre-validation input shape.
 * Entity ids are branded only on output (via `.brand()`), so the input shape
 * never matches T exactly; `any` here intentionally opts out of checking just
 * that parameter, while the output type T is still fully enforced by
 * `.parse()`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaFor<T> = z.ZodType<T, any>;

/**
 * Columns are looked up dynamically by string key (both here and in
 * findMany's filter), which drizzle's generated per-table column types
 * cannot express generically. `any` is intentional: `eq()`'s own typings
 * accept it for every column kind, and the actual row shape returned from
 * any query is always re-validated by the Zod schema before it reaches the
 * caller, so this loss of static checking never reaches application code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumn = any;

function column(table: PgTable, key: string): AnyColumn {
  return (table as unknown as Record<string, AnyColumn>)[key];
}

function idColumn(table: PgTable): AnyColumn {
  return column(table, 'id');
}

export interface CreateContext {
  id: string;
  now: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * postgres.js (via Drizzle's `mode: 'string'` timestamp columns) returns
 * Postgres's own text format for timestamp(tz) - e.g.
 * "2026-10-23 15:05:36.832+00" (space separator, short offset) - not strict
 * ISO 8601. The shared StorageDriver contract validates every timestamp with
 * Zod's `z.string().datetime({ offset: true })`, which requires a "T"
 * separator and a full "+HH:MM"/"Z" offset and rejects Postgres's format
 * outright. This normalizes any row read back from the database before it
 * reaches that validation - the JSON driver never needs this since it always
 * stores the exact ISO string it was given.
 */
const POSTGRES_TIMESTAMP_PATTERN =
  /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2}(?::?\d{2})?)?$/;

function toIsoTimestamp(value: string): string {
  const match = POSTGRES_TIMESTAMP_PATTERN.exec(value);
  if (!match) return value;
  const [, date, time, rawOffset] = match;
  const offset = rawOffset ? (rawOffset.length === 3 ? `${rawOffset}:00` : rawOffset) : 'Z';
  return `${date}T${time}${offset}`;
}

export function normalizeTimestamps<R>(row: R): R {
  if (row === null || typeof row !== 'object') return row;
  const normalized: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const [key, value] of Object.entries(normalized)) {
    if (typeof value === 'string') normalized[key] = toIsoTimestamp(value);
  }
  return normalized as R;
}

interface WithId {
  id: string;
}

function buildWhere<T extends WithId>(table: PgTable, filter?: Partial<T>): SQL | undefined {
  if (!filter) return undefined;
  const entries = Object.entries(filter).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return undefined;
  const conditions = entries.map(([key, value]) => eq(column(table, key), value));
  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export function createPgCrudRepository<T extends WithId, CreateInput, UpdateInput>(options: {
  db: Database;
  table: PgTable;
  schema: SchemaFor<T>;
  entityName: string;
  mapCreate: (input: CreateInput, ctx: CreateContext) => unknown;
  mapUpdate?: (existing: T, patch: UpdateInput, now: string) => unknown;
}) {
  const { db, table, schema, entityName, mapCreate, mapUpdate } = options;

  return {
    async findById(id: string): Promise<T | null> {
      const rows = await db
        .select()
        .from(table)
        .where(eq(idColumn(table), id))
        .limit(1);
      return rows[0] ? schema.parse(normalizeTimestamps(rows[0])) : null;
    },
    async findMany(filter?: Partial<T>): Promise<T[]> {
      const where = buildWhere(table, filter);
      const query = db.select().from(table);
      const rows = where ? await query.where(where) : await query;
      return rows.map((row) => schema.parse(normalizeTimestamps(row)));
    },
    async create(input: CreateInput): Promise<T> {
      const candidate = mapCreate(input, { id: randomUUID(), now: nowIso() });
      const entity = schema.parse(candidate);
      const [row] = await db
        .insert(table)
        .values(entity as Record<string, unknown>)
        .returning();
      return schema.parse(normalizeTimestamps(row));
    },
    async update(id: string, patch: UpdateInput): Promise<T> {
      const existingRows = await db
        .select()
        .from(table)
        .where(eq(idColumn(table), id))
        .limit(1);
      const existing = existingRows[0] ? schema.parse(normalizeTimestamps(existingRows[0])) : null;
      if (!existing) throw new NotFoundError(entityName, id);
      const now = nowIso();
      const merged = mapUpdate
        ? mapUpdate(existing, patch, now)
        : { ...existing, ...patch, updatedAt: now };
      const entity = schema.parse(merged);
      const [row] = await db
        .update(table)
        .set(entity as Record<string, unknown>)
        .where(eq(idColumn(table), id))
        .returning();
      return schema.parse(normalizeTimestamps(row));
    },
    async delete(id: string): Promise<void> {
      await db.delete(table).where(eq(idColumn(table), id));
    },
  };
}

export function createPgCreateOnlyRepository<T extends WithId, CreateInput>(options: {
  db: Database;
  table: PgTable;
  schema: SchemaFor<T>;
  mapCreate: (input: CreateInput, ctx: CreateContext) => unknown;
}) {
  const { db, table, schema, mapCreate } = options;

  return {
    async findById(id: string): Promise<T | null> {
      const rows = await db
        .select()
        .from(table)
        .where(eq(idColumn(table), id))
        .limit(1);
      return rows[0] ? schema.parse(normalizeTimestamps(rows[0])) : null;
    },
    async findMany(filter?: Partial<T>): Promise<T[]> {
      const where = buildWhere(table, filter);
      const query = db.select().from(table);
      const rows = where ? await query.where(where) : await query;
      return rows.map((row) => schema.parse(normalizeTimestamps(row)));
    },
    async create(input: CreateInput): Promise<T> {
      const candidate = mapCreate(input, { id: randomUUID(), now: nowIso() });
      const entity = schema.parse(candidate);
      const [row] = await db
        .insert(table)
        .values(entity as Record<string, unknown>)
        .returning();
      return schema.parse(normalizeTimestamps(row));
    },
  };
}

export function createPgCreateDeleteRepository<T extends WithId, CreateInput>(options: {
  db: Database;
  table: PgTable;
  schema: SchemaFor<T>;
  mapCreate: (input: CreateInput, ctx: CreateContext) => unknown;
}) {
  const base = createPgCreateOnlyRepository(options);
  return {
    ...base,
    async delete(id: string): Promise<void> {
      await options.db.delete(options.table).where(eq(idColumn(options.table), id));
    },
  };
}

export const createPgAppendOnlyRepository = createPgCreateOnlyRepository;
