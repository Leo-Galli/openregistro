import { getStorage } from '../lib/storage';
import { seedDemoData } from '../lib/seed-demo';

async function main(): Promise<void> {
  const storage = await getStorage();
  await seedDemoData(storage);
  console.warn('Demo data seeded.');
}

main().catch((error: unknown) => {
  console.error('Failed to seed demo data:', error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
