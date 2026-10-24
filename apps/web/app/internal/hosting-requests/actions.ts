'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  updateHostingRequestStatus,
  updateHostingRequestDetails,
  deleteHostingRequest,
  type HostingRequestStatus,
} from '@openregistro/db';
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

const editFormSchema = z.object({
  id: z.string().min(1),
  schoolName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  approxStudents: z.coerce.number().int().min(1).max(100000).optional(),
  message: z.string().max(2000).optional(),
});

export interface EditHostingRequestState {
  ok: boolean;
  error?: string;
}

export async function editHostingRequest(
  _prevState: EditHostingRequestState,
  formData: FormData,
): Promise<EditHostingRequestState> {
  await requireHostingAdmin();

  const parsed = editFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: 'Please fill in every required field correctly.' };
  }

  const db = getHostingDb();
  if (!db) return { ok: false, error: 'Hosting requests are not available on this instance.' };

  const { id, ...patch } = parsed.data;
  await updateHostingRequestDetails(db, id, {
    schoolName: patch.schoolName,
    contactName: patch.contactName,
    contactEmail: patch.contactEmail,
    approxStudents: patch.approxStudents ?? null,
    message: patch.message || null,
  });

  revalidatePath('/internal/hosting-requests');
  return { ok: true };
}

export async function deleteHostingRequestAction(formData: FormData): Promise<void> {
  await requireHostingAdmin();

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const db = getHostingDb();
  if (!db) return;

  await deleteHostingRequest(db, id);
  revalidatePath('/internal/hosting-requests');
}

export async function logoutInternal(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(HOSTING_ADMIN_COOKIE);
  redirect('/internal/login');
}
