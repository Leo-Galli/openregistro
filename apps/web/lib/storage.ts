import type { StorageDriver } from '@openregistro/core';
import { createJsonStorageDriver, createPostgresStorageDriver } from '@openregistro/db';
import { getEnv } from './env';

/**
 * Cached on `globalThis` so Next.js dev-mode HMR reuses the same driver
 * instance (and, for Postgres, the same connection pool) across module
 * reloads instead of leaking a new one on every edit.
 */
const globalForStorage = globalThis as unknown as { storageDriver?: Promise<StorageDriver> };

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

export function getStorage(): Promise<StorageDriver> {
  if (!globalForStorage.storageDriver) {
    globalForStorage.storageDriver = connectDriver();
  }
  return globalForStorage.storageDriver;
}
