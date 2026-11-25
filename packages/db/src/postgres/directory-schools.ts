import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import type { Database } from './client';
import { directorySchoolsTable, hostingRequestsTable } from './schema';
import { normalizeTimestamps } from './repository-factory';

const HOSTED_BASE_DOMAIN = 'openregistro.another-horizon.eu';
const DEMO_SCHOOL = {
  id: 'demo',
  name: 'OpenRegistro Demo',
  baseUrl: 'https://demo.openregistro.another-horizon.eu',
  kind: 'demo' as const,
};

export type DirectorySchoolKind = 'demo' | 'hosted' | 'self_hosted';

export interface DirectorySchoolPublic {
  id: string;
  name: string;
  baseUrl: string;
  kind: DirectorySchoolKind;
}

export interface DirectorySchoolRecord {
  id: string;
  name: string;
  baseUrl: string;
  listedInApp: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDirectorySchoolInput {
  name: string;
  baseUrl: string;
  notes?: string | null;
  listedInApp?: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeDirectoryBaseUrl(raw: string): string {
  let trimmed = raw.trim();
  while (trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1);
  }
  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('baseUrl must be http or https');
  }
  return `${url.protocol}//${url.host}`;
}

export async function listDirectorySchools(db: Database): Promise<DirectorySchoolRecord[]> {
  const rows = await db
    .select()
    .from(directorySchoolsTable)
    .orderBy(asc(directorySchoolsTable.name));
  return rows.map((row) => normalizeTimestamps(row) as DirectorySchoolRecord);
}

export async function createDirectorySchool(
  db: Database,
  input: CreateDirectorySchoolInput,
): Promise<DirectorySchoolRecord> {
  const now = nowIso();
  const [row] = await db
    .insert(directorySchoolsTable)
    .values({
      id: randomUUID(),
      name: input.name.trim(),
      baseUrl: normalizeDirectoryBaseUrl(input.baseUrl),
      notes: input.notes?.trim() || null,
      listedInApp: input.listedInApp ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return normalizeTimestamps(row) as DirectorySchoolRecord;
}

export async function setDirectorySchoolListed(
  db: Database,
  id: string,
  listedInApp: boolean,
): Promise<DirectorySchoolRecord | null> {
  const [row] = await db
    .update(directorySchoolsTable)
    .set({ listedInApp, updatedAt: nowIso() })
    .where(eq(directorySchoolsTable.id, id))
    .returning();
  return row ? (normalizeTimestamps(row) as DirectorySchoolRecord) : null;
}

export async function deleteDirectorySchool(db: Database, id: string): Promise<void> {
  await db.delete(directorySchoolsTable).where(eq(directorySchoolsTable.id, id));
}

export async function setHostingListedInApp(
  db: Database,
  id: string,
  listedInApp: boolean,
): Promise<void> {
  await db
    .update(hostingRequestsTable)
    .set({ listedInApp, updatedAt: nowIso() })
    .where(eq(hostingRequestsTable.id, id));
}

/**
 * Public mobile-app directory: always includes the shared demo, then every
 * ready hosted school still listed, then every listed self-hosted entry.
 */
export async function listPublicDirectorySchools(db: Database): Promise<DirectorySchoolPublic[]> {
  const [hostedRows, selfHosted] = await Promise.all([
    db
      .select({
        id: hostingRequestsTable.id,
        name: hostingRequestsTable.schoolName,
        subdomain: hostingRequestsTable.subdomain,
        listedInApp: hostingRequestsTable.listedInApp,
        provisioningStatus: hostingRequestsTable.provisioningStatus,
      })
      .from(hostingRequestsTable),
    db
      .select()
      .from(directorySchoolsTable)
      .where(eq(directorySchoolsTable.listedInApp, true))
      .orderBy(asc(directorySchoolsTable.name)),
  ]);

  const hosted: DirectorySchoolPublic[] = hostedRows
    .filter(
      (row) =>
        row.listedInApp &&
        row.provisioningStatus === 'ready' &&
        typeof row.subdomain === 'string' &&
        row.subdomain.length > 0,
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      baseUrl: `https://${row.subdomain}.${HOSTED_BASE_DOMAIN}`,
      kind: 'hosted' as const,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const selfHostedPublic: DirectorySchoolPublic[] = selfHosted.map((row) => ({
    id: row.id,
    name: row.name,
    baseUrl: row.baseUrl,
    kind: 'self_hosted' as const,
  }));

  return [DEMO_SCHOOL, ...hosted, ...selfHostedPublic];
}
