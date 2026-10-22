'use server';

import { getEnv } from '@/lib/env';
import { getStorage } from '@/lib/storage';

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export async function testStorageConnection(): Promise<ConnectionTestResult> {
  const env = getEnv();
  try {
    const storage = await getStorage();
    const healthy = await storage.healthCheck();
    if (!healthy) {
      return { ok: false, message: 'The storage driver reported itself as unhealthy.' };
    }
    if (env.STORAGE_DRIVER === 'postgres') {
      return { ok: true, message: 'Connected to Postgres and migrations are applied.' };
    }
    return { ok: true, message: `Data directory "${env.DATA_DIR}" is writable.` };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    if (env.STORAGE_DRIVER === 'postgres') {
      return {
        ok: false,
        message: `Could not reach Postgres: ${detail}. Make sure DATABASE_URL is correct and that migrations have been applied (pnpm --filter @openregistro/db db:migrate).`,
      };
    }
    return { ok: false, message: `Could not access the data directory: ${detail}` };
  }
}
