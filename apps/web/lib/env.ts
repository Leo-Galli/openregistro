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
  HOSTING_ADMIN_SECRET: z.string().optional(),
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
