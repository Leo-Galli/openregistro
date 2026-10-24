import { createPostgresClient, type Database } from '@openregistro/db';
import { getEnv } from './env';

/**
 * Cached on `globalThis` for the same reason as lib/storage.ts's driver
 * cache: reuse one connection pool across Next.js dev-mode HMR reloads.
 */
const globalForHostingDb = globalThis as unknown as { hostingDb?: Database };

/**
 * Returns null when HOSTING_DATABASE_URL isn't set - true for every
 * self-hosted install, and the expected state outside this project's own
 * managed deployment. Callers must treat the hosting-requests feature as
 * unavailable in that case, not throw.
 */
export function getHostingDb(): Database | null {
  const { HOSTING_DATABASE_URL } = getEnv();
  if (!HOSTING_DATABASE_URL) return null;

  if (!globalForHostingDb.hostingDb) {
    globalForHostingDb.hostingDb = createPostgresClient(HOSTING_DATABASE_URL).db;
  }
  return globalForHostingDb.hostingDb;
}
