import { randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { NotFoundError } from '@openregistro/core';
import { JsonCollection } from './json-collection';

export interface CreateContext {
  id: string;
  now: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

interface WithId {
  id: string;
}

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
 * mapCreate/mapUpdate intentionally return `unknown`: the candidate they
 * build still has unbranded ids and unvalidated shape. `schema.parse()` is
 * the single place that turns it into a fully-typed, branded `T` - this is
 * what both drivers rely on to reject invalid data identically.
 */
export function createJsonCrudRepository<T extends WithId, CreateInput, UpdateInput>(options: {
  collection: JsonCollection<T>;
  schema: SchemaFor<T>;
  mapCreate: (input: CreateInput, ctx: CreateContext) => unknown;
  mapUpdate?: (existing: T, patch: UpdateInput, now: string) => unknown;
}) {
  const { collection, schema, mapCreate, mapUpdate } = options;

  return {
    async findById(id: string): Promise<T | null> {
      return collection.findById(id);
    },
    async findMany(filter?: Partial<T>): Promise<T[]> {
      return collection.findMany(filter);
    },
    async create(input: CreateInput): Promise<T> {
      const candidate = mapCreate(input, { id: randomUUID(), now: nowIso() });
      const entity = schema.parse(candidate);
      return collection.create(entity);
    },
    async update(id: string, patch: UpdateInput): Promise<T> {
      const existing = await collection.findById(id);
      if (!existing) throw new NotFoundError(collection.name, id);
      const now = nowIso();
      const merged = mapUpdate
        ? mapUpdate(existing, patch, now)
        : { ...existing, ...patch, updatedAt: now };
      const entity = schema.parse(merged);
      return collection.replace(id, entity);
    },
    async delete(id: string): Promise<void> {
      return collection.delete(id);
    },
  };
}

export function createJsonCreateOnlyRepository<T extends WithId, CreateInput>(options: {
  collection: JsonCollection<T>;
  schema: SchemaFor<T>;
  mapCreate: (input: CreateInput, ctx: CreateContext) => unknown;
}) {
  const { collection, schema, mapCreate } = options;

  return {
    async findById(id: string): Promise<T | null> {
      return collection.findById(id);
    },
    async findMany(filter?: Partial<T>): Promise<T[]> {
      return collection.findMany(filter);
    },
    async create(input: CreateInput): Promise<T> {
      const candidate = mapCreate(input, { id: randomUUID(), now: nowIso() });
      const entity = schema.parse(candidate);
      return collection.create(entity);
    },
  };
}

export function createJsonCreateDeleteRepository<T extends WithId, CreateInput>(options: {
  collection: JsonCollection<T>;
  schema: SchemaFor<T>;
  mapCreate: (input: CreateInput, ctx: CreateContext) => unknown;
}) {
  const base = createJsonCreateOnlyRepository(options);
  return {
    ...base,
    async delete(id: string): Promise<void> {
      return options.collection.delete(id);
    },
  };
}

export const createJsonAppendOnlyRepository = createJsonCreateOnlyRepository;
