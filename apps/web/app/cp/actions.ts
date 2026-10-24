'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  updateHostingRequestStatus,
  updateHostingRequestDetails,
  deleteHostingRequest,
  generateLicenseKey,
  type HostingRequestStatus,
} from '@openregistro/db';
import { requireCpAdmin, verifyCpCredentials, sha256, CP_ADMIN_COOKIE } from '@/lib/cp-admin';
import { getHostingDb } from '@/lib/hosting-db';
import { checkRateLimit } from '@/lib/rate-limit';

export interface CpLoginState {
  error?: string;
}

export async function loginCp(_prevState: CpLoginState, formData: FormData): Promise<CpLoginState> {
  const rateLimit = checkRateLimit('cp-login', 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: 'Too many attempts. Try again shortly.' };
  }

  const username = formData.get('username');
  const password = formData.get('password');
  if (typeof username !== 'string' || typeof password !== 'string') {
    return { error: 'Enter a username and password.' };
  }

  if (!verifyCpCredentials(username, password)) {
    return { error: 'Incorrect username or password.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(CP_ADMIN_COOKIE, sha256(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/cp',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/cp');
}

export async function logoutCp(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CP_ADMIN_COOKIE);
  redirect('/cp');
}

const VALID_STATUSES: HostingRequestStatus[] = ['pending', 'contacted', 'activated', 'declined'];

export async function setHostingRequestStatus(formData: FormData): Promise<void> {
  await requireCpAdmin();

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
  revalidatePath('/cp');
}

const editFormSchema = z.object({
  id: z.string().min(1),
  schoolName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  approxStudents: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().min(1).max(100000).optional(),
  ),
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
  await requireCpAdmin();

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

  revalidatePath('/cp');
  return { ok: true };
}

export async function deleteHostingRequestAction(formData: FormData): Promise<void> {
  await requireCpAdmin();

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const db = getHostingDb();
  if (!db) return;

  await deleteHostingRequest(db, id);
  revalidatePath('/cp');
}

export async function generateLicenseAction(formData: FormData): Promise<void> {
  await requireCpAdmin();

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const db = getHostingDb();
  if (!db) return;

  await generateLicenseKey(db, id);
  revalidatePath('/cp');
}
