import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEnv } from './env';

export const HOSTING_ADMIN_COOKIE = 'hosting_admin';

/**
 * A single shared-secret cookie, not a real session - deliberately simple
 * for a hidden, low-stakes internal tool (pre-sales lead tracking, no
 * student data ever touches it) rather than building out a second RBAC
 * system alongside the per-school one in auth.ts. httpOnly keeps it out of
 * reach of any XSS in this app; there is no "forgot password" or rotation
 * flow by design - change HOSTING_ADMIN_SECRET and every session drops.
 */
export async function requireHostingAdmin(): Promise<void> {
  const { HOSTING_ADMIN_SECRET } = getEnv();
  if (!HOSTING_ADMIN_SECRET) redirect('/forbidden');

  const cookieStore = await cookies();
  const value = cookieStore.get(HOSTING_ADMIN_COOKIE)?.value;
  if (value !== HOSTING_ADMIN_SECRET) redirect('/internal/login');
}

export async function isHostingAdmin(): Promise<boolean> {
  const { HOSTING_ADMIN_SECRET } = getEnv();
  if (!HOSTING_ADMIN_SECRET) return false;
  const cookieStore = await cookies();
  return cookieStore.get(HOSTING_ADMIN_COOKIE)?.value === HOSTING_ADMIN_SECRET;
}
