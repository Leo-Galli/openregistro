import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPassword } from './password';
import { getEnv } from './env';

export const CP_ADMIN_COOKIE = 'cp_admin';

/**
 * A single shared operator account for the hidden /cp control panel, not a
 * real multi-user session system - see env.ts for why one shared account is
 * enough here. The password is stored as an Argon2id hash
 * (CP_ADMIN_PASSWORD_HASH, generated with scripts/hash-cp-password.ts), the
 * same algorithm used for real user accounts - never a fast hash, and never
 * the plaintext. The session cookie holds that same hash string as an
 * opaque "logged in" marker, so there is nothing to leak beyond what
 * credential-stuffing against the hash would already need.
 */
export async function verifyCpCredentials(username: string, password: string): Promise<boolean> {
  const { CP_ADMIN_USERNAME, CP_ADMIN_PASSWORD_HASH } = getEnv();
  if (!CP_ADMIN_PASSWORD_HASH || username !== CP_ADMIN_USERNAME) return false;
  return verifyPassword(CP_ADMIN_PASSWORD_HASH, password);
}

export async function requireCpAdmin(): Promise<void> {
  if (!(await isCpAdmin())) redirect('/cp');
}

export async function isCpAdmin(): Promise<boolean> {
  const { CP_ADMIN_PASSWORD_HASH } = getEnv();
  if (!CP_ADMIN_PASSWORD_HASH) return false;
  const cookieStore = await cookies();
  return cookieStore.get(CP_ADMIN_COOKIE)?.value === CP_ADMIN_PASSWORD_HASH;
}
