import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { getStorage } from './storage';

/**
 * These checks run in server components/layouts rather than `middleware.ts`:
 * both storage drivers use Node-only APIs (`fs`, native Postgres bindings),
 * which are not guaranteed to be available wherever a given deployment runs
 * middleware. Layout-level guards are just as effective for an App Router
 * project and avoid that runtime mismatch entirely.
 */

export async function isInstallerComplete(): Promise<boolean> {
  const storage = await getStorage();
  const state = await storage.installer.get();
  return state.completed;
}

export async function requireInstallerIncomplete(): Promise<void> {
  if (await isInstallerComplete()) {
    redirect('/');
  }
}

export async function requireInstallerComplete(): Promise<void> {
  if (!(await isInstallerComplete())) {
    redirect('/setup');
  }
}

export async function requireSession(): Promise<Session> {
  await requireInstallerComplete();
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  return session;
}
