import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEnv } from './env';

export const CP_ADMIN_COOKIE = 'cp_admin';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * A single shared operator account for the hidden /cp control panel, not a
 * real multi-user session system - see env.ts for why SHA-256 (not
 * Argon2id) is enough here. The cookie stores the password's hash, never
 * the plaintext, so there is nothing to leak beyond what credential-stuffing
 * against the hash would already need.
 */
export function verifyCpCredentials(username: string, password: string): boolean {
  const { CP_ADMIN_USERNAME, CP_ADMIN_PASSWORD_SHA256 } = getEnv();
  if (!CP_ADMIN_PASSWORD_SHA256) return false;
  return username === CP_ADMIN_USERNAME && sha256(password) === CP_ADMIN_PASSWORD_SHA256;
}

export async function requireCpAdmin(): Promise<void> {
  if (!(await isCpAdmin())) redirect('/cp');
}

export async function isCpAdmin(): Promise<boolean> {
  const { CP_ADMIN_PASSWORD_SHA256 } = getEnv();
  if (!CP_ADMIN_PASSWORD_SHA256) return false;
  const cookieStore = await cookies();
  return cookieStore.get(CP_ADMIN_COOKIE)?.value === CP_ADMIN_PASSWORD_SHA256;
}
