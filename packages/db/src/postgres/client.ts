import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export interface PostgresClient {
  db: Database;
  close: () => Promise<void>;
}

export function createPostgresClient(connectionString: string): PostgresClient {
  const queryClient = postgres(connectionString, { max: 10 });
  const db = drizzle(queryClient, { schema });
  return {
    db,
    close: () => queryClient.end({ timeout: 5 }),
  };
}
