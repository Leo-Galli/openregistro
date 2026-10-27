import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

/**
 * `postgres-js` directly (not drizzle's own `migrate()` from
 * `drizzle-orm/postgres-js/migrator`) because that helper resolves its
 * migrations folder via `import.meta.url`, which only works when the file
 * runs from its own real location - true for `tsx src/postgres/migrate.ts`,
 * false here: `@openregistro/db` is in next.config.ts's `transpilePackages`,
 * so this code is webpack-bundled into a `.next/server/chunks/*` file whose
 * runtime `import.meta.url` points at that chunk, not at
 * `packages/db/src/postgres/`, and the `./drizzle` migrations folder doesn't
 * exist relative to it. Resolving via `process.cwd()` instead (same pattern
 * already proven for the vercel CLI itself) finds the real files on disk.
 *
 * No need to replicate drizzle's own migration-tracking table: every call
 * site here targets a brand-new, guaranteed-empty database (one Neon
 * database per newly provisioned school), so every migration always needs
 * to run, in order, exactly once - there is no "already applied" state to
 * track.
 */
function resolveMigrationsDir(): string {
  const dir = path.join(
    process.cwd(),
    'node_modules',
    '@openregistro',
    'db',
    'src',
    'postgres',
    'drizzle',
  );
  if (!existsSync(dir)) {
    throw new Error(
      `Migrations folder not found at ${dir} - check next.config.ts's outputFileTracingIncludes.`,
    );
  }
  return dir;
}

/**
 * Applies every drizzle migration file, in filename order, to a fresh
 * database. Each file is split on `--> statement-breakpoint` (drizzle-kit's
 * own marker, not standard SQL) since postgres-js's `unsafe()` runs one
 * statement at a time - confirmed against a real throwaway Neon database
 * provisioned the same way production does, not assumed.
 */
export async function applyMigrations(connectionString: string): Promise<void> {
  const migrationsDir = resolveMigrationsDir();
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const sql = postgres(connectionString, { max: 1 });
  try {
    for (const file of files) {
      const content = readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = content
        .split('--> statement-breakpoint')
        .map((statement) => statement.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await sql.unsafe(statement);
      }
    }
  } finally {
    await sql.end();
  }
}

/**
 * Reads a single key out of a dotenv-formatted file (as written by
 * `vercel env pull`) - values may or may not be double-quoted.
 */
export function readEnvValue(filePath: string, key: string): string {
  const content = readFileSync(filePath, 'utf8');
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match?.[1]) {
    throw new Error(`${key} not found in ${filePath}`);
  }
  return match[1].trim().replace(/^"|"$/g, '');
}
