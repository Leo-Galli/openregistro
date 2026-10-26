import { z } from 'zod';

const envSchema = z.object({
  STORAGE_DRIVER: z.enum(['json', 'postgres']).default('json'),
  DATA_DIR: z.string().default('./data'),
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  /*
   * Deliberately separate from DATABASE_URL (the per-school StorageDriver
   * connection): hosting-request leads are the operator's own business data,
   * not a school's data, and must stay available (and the hidden admin page
   * reachable) independently of what storage driver any given self-hosted
   * install happens to run. Unset on every self-hosted install by design -
   * only this project's own managed deployment sets these two.
   */
  HOSTING_DATABASE_URL: z.string().optional(),
  /*
   * The /cp control panel's own operator login - deliberately separate from
   * auth.ts's per-school credentials system (Argon2id-hashed, stored in the
   * school's own StorageDriver). This is a single hardcoded operator
   * account with no per-school meaning, so a SHA-256 hash of one fixed
   * password compared on every request is enough; there is no signup, no
   * rotation UI, and no reason to carry the heavier Argon2id machinery for
   * it. Unset on every self-hosted install by design.
   */
  CP_ADMIN_USERNAME: z.string().default('admin'),
  CP_ADMIN_PASSWORD_SHA256: z.string().optional(),
  /*
   * A Vercel Deploy Hook URL for the managed demo project (Project Settings
   * -> Git -> Deploy Hooks). Optional and unset on every self-hosted install
   * by design - when set, the /cp "Redeploy latest" button becomes a real
   * POST to this URL instead of only showing manual update instructions.
   */
  CP_DEMO_DEPLOY_HOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Parsed once and cached: Next.js loads this module in multiple server
 * contexts (route handlers, server actions, middleware) and re-validating
 * `process.env` on every call would be wasted work.
 */
export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}

export function smtpConfigured(env: Env): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);
}
