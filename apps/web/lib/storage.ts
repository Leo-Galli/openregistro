import type { StorageDriver } from '@openregistro/core';
import { createJsonStorageDriver, createPostgresStorageDriver } from '@openregistro/db';
import { isDemoMode } from './demo';
import { createDemoReadOnlyStorage } from './demo-read-only-storage';
import { getEnv } from './env';

/**
 * Cached on `globalThis` so Next.js dev-mode HMR reuses the same driver
 * instance (and, for Postgres, the same connection pool) across module
 * reloads instead of leaking a new one on every edit.
 */
const globalForStorage = globalThis as unknown as {
  storageDriver?: Promise<StorageDriver>;
  writableStorageDriver?: Promise<StorageDriver>;
};

function createDriver(): StorageDriver {
  const env = getEnv();
  if (env.STORAGE_DRIVER === 'postgres') {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set when STORAGE_DRIVER=postgres');
    }
    return createPostgresStorageDriver({ connectionString: env.DATABASE_URL });
  }
  return createJsonStorageDriver({ dataDir: env.DATA_DIR });
}

async function connectDriver(): Promise<StorageDriver> {
  const driver = createDriver();
  await driver.connect();
  return driver;
}

/**
 * App-facing storage. When DEMO_MODE=true, mutations are no-ops so the shared
 * public demo never persists visitor edits.
 */
export function getStorage(): Promise<StorageDriver> {
  if (!globalForStorage.storageDriver) {
    globalForStorage.storageDriver = connectDriver().then((driver) =>
      isDemoMode() ? createDemoReadOnlyStorage(driver) : driver,
    );
  }
  return globalForStorage.storageDriver;
}

/**
 * Unwrapped driver for operational scripts (seed, installer complete, migrate).
 * Always writes for real, even when DEMO_MODE=true on the running app.
 */
export function getWritableStorage(): Promise<StorageDriver> {
  if (!globalForStorage.writableStorageDriver) {
    globalForStorage.writableStorageDriver = connectDriver();
  }
  return globalForStorage.writableStorageDriver;
}
