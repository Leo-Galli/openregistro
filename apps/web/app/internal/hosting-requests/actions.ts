'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateHostingRequestStatus, type HostingRequestStatus } from '@openregistro/db';
import { requireHostingAdmin, HOSTING_ADMIN_COOKIE } from '@/lib/hosting-admin';
import { getHostingDb } from '@/lib/hosting-db';

const VALID_STATUSES: HostingRequestStatus[] = ['pending', 'contacted', 'activated', 'declined'];

export async function setHostingRequestStatus(formData: FormData): Promise<void> {
  await requireHostingAdmin();

  const id = formData.get('id');
  const status = formData.get('status');
  if (
    typeof id !== 'string' ||
    typeof status !== 'string' ||
    !VALID_STATUSES.includes(status as HostingRequestStatus)
  ) {
    return;
  }

  const db = getHostingDb();
  if (!db) return;

  await updateHostingRequestStatus(db, id, status as HostingRequestStatus);
  revalidatePath('/internal/hosting-requests');
}

export async function logoutInternal(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(HOSTING_ADMIN_COOKIE);
  redirect('/internal/login');
}
