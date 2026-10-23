import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createPostgresClient } from './client';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set to run migrations');
  }

  const client = createPostgresClient(connectionString);
  try {
    await migrate(client.db, {
      migrationsFolder: fileURLToPath(new URL('./drizzle', import.meta.url)),
    });
    console.warn('Migrations applied successfully.');
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
