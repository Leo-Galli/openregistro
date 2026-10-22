import { promises as fs } from 'node:fs';

const POLL_INTERVAL_MS = 20;

/**
 * Cooperative, filesystem-based advisory lock. Acquiring the lock is an
 * atomic `open` with the `wx` flag (fails if the file already exists), which
 * is sufficient to serialize writes to a single JSON collection file within
 * one host - this driver is designed for a single self-hosted process, not a
 * distributed deployment.
 */
export async function withFileLock<T>(
  lockPath: string,
  fn: () => Promise<T>,
  timeoutMs = 5000,
): Promise<T> {
  const deadline = performance.timeOrigin + performance.now() + timeoutMs;

  while (true) {
    try {
      const handle = await fs.open(lockPath, 'wx');
      await handle.close();
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
      if (performance.timeOrigin + performance.now() > deadline) {
        throw new Error(`Timed out acquiring lock: ${lockPath}`);
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  try {
    return await fn();
  } finally {
    await fs.rm(lockPath, { force: true });
  }
}
