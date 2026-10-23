import { getStorage } from '../lib/storage';
import { getEnv } from '../lib/env';

/**
 * Marks the first-run installer wizard as complete without going through the
 * UI - used by scripts/demo-reset.sh after it wipes storage and reseeds demo
 * data, so a reset demo instance is immediately usable instead of falling
 * back to the setup wizard (the wizard's own "finish setup" step does the
 * same thing after seeding; see app/setup/demo/actions.ts).
 */
async function main(): Promise<void> {
  const storage = await getStorage();
  const env = getEnv();
  const state = await storage.installer.get();
  if (state.completed) {
    console.warn('Installer already marked complete.');
    return;
  }
  await storage.installer.complete(env.STORAGE_DRIVER);
  console.warn('Installer marked complete.');
}

main().catch((error: unknown) => {
  console.error('Failed to complete the installer:', error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
