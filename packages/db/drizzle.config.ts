import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/postgres/schema.ts',
  out: './src/postgres/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/openregistro',
  },
  strict: true,
  verbose: true,
});
