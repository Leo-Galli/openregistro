import { seedDemoData } from '../lib/seed-demo';
import { getWritableStorage } from '../lib/storage';

async function main(): Promise<void> {
  const storage = await getWritableStorage();
  await seedDemoData(storage);
  console.warn('Demo data seeded.');
}

main().catch((error: unknown) => {
  console.error('Failed to seed demo data:', error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
