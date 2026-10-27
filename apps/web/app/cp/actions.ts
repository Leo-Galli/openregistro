'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  listHostingRequests,
  updateHostingRequestStatus,
  updateHostingRequestDetails,
  deleteHostingRequest,
  generateLicenseKey,
  assignSubdomain,
  isSubdomainTaken,
  setProvisioningState,
  setNotificationEmails,
  type HostingRequestStatus,
} from '@openregistro/db';
import { requireCpAdmin, verifyCpCredentials, CP_ADMIN_COOKIE } from '@/lib/cp-admin';
import { getHostingDb } from '@/lib/hosting-db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getEnv } from '@/lib/env';
import { generateUniqueSubdomain } from '@/lib/subdomain-slug';
import { sendPlatformEmail } from '@/lib/platform-mailer';
import { renderBrandedEmail } from '@/lib/email-templates';
import { provisionSchoolInstance } from '@/lib/provisioning/provision-school';

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

  if (!(await verifyCpCredentials(username, password))) {
    return { error: 'Incorrect username or password.' };
  }

  // Safe to assert: verifyCpCredentials only returns true when this is set.
  const { CP_ADMIN_PASSWORD_HASH } = getEnv();
  const cookieStore = await cookies();
  cookieStore.set(CP_ADMIN_COOKIE, CP_ADMIN_PASSWORD_HASH as string, {
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

  const request = await updateHostingRequestStatus(db, id, status as HostingRequestStatus);
  if (!request || request.status !== 'activated' || request.subdomain) {
    revalidatePath('/cp');
    return;
  }

  // Assign a subdomain exactly once, the first time a request is marked "set
  // up" - honor what the requester chose at submission time if it's still
  // free (someone else could have claimed it since), otherwise auto-generate
  // one from the school name. Creating the actual Vercel project/database and
  // notifying the school are deliberate, separate operator actions
  // (provisionRequestAction / notifyReadyAction below), not automatic side
  // effects of this status change - the operator decides when each happens.
  const requested = request.requestedSubdomain;
  const subdomain =
    requested && !(await isSubdomainTaken(db, requested))
      ? requested
      : await generateUniqueSubdomain(request.schoolName, (candidate) =>
          isSubdomainTaken(db, candidate),
        );
  await assignSubdomain(db, id, subdomain);

  revalidatePath('/cp');
}

/**
 * Creates the dedicated Vercel project + database for a request that already
 * has a subdomain assigned - triggered explicitly by the operator (not as a
 * side effect of changing status), so they can review the request before
 * committing a real resource to it.
 */
export async function provisionRequestAction(formData: FormData): Promise<void> {
  await requireCpAdmin();

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const db = getHostingDb();
  if (!db) return;

  const requests = await listHostingRequests(db);
  const request = requests.find((candidate) => candidate.id === id);
  if (!request || !request.subdomain) return;
  if (request.provisioningStatus === 'ready' || request.provisioningStatus === 'provisioning') {
    return;
  }

  const { VERCEL_PROVISIONING_TOKEN } = getEnv();
  if (!VERCEL_PROVISIONING_TOKEN) return;

  await setProvisioningState(db, id, { provisioningStatus: 'provisioning' });
  try {
    const { vercelProjectId } = await provisionSchoolInstance(
      request.schoolName,
      request.subdomain,
    );
    await setProvisioningState(db, id, {
      provisioningStatus: 'ready',
      vercelProjectId,
      provisioningError: null,
    });
  } catch (error) {
    await setProvisioningState(db, id, {
      provisioningStatus: 'failed',
      provisioningError: error instanceof Error ? error.message : 'Unknown provisioning error.',
    });
  }

  revalidatePath('/cp');
}

export interface NotifyReadyState {
  ok: boolean;
  error?: string;
}

/**
 * Sends the "your instance is ready" email on demand, with an operator-
 * editable note - deliberately separate from provisioning so the operator
 * can proofread/customize the message (or re-send it) rather than it firing
 * automatically the moment the project is created.
 */
export async function notifyReadyAction(
  _prevState: NotifyReadyState,
  formData: FormData,
): Promise<NotifyReadyState> {
  await requireCpAdmin();

  const id = formData.get('id');
  const note = formData.get('note');
  if (typeof id !== 'string') return { ok: false, error: 'Missing request id.' };

  const db = getHostingDb();
  if (!db) return { ok: false, error: 'Hosting requests are not available on this instance.' };

  const requests = await listHostingRequests(db);
  const request = requests.find((candidate) => candidate.id === id);
  if (!request || !request.subdomain) {
    return { ok: false, error: 'This request has no subdomain assigned yet.' };
  }

  try {
    await sendHostingActivatedEmail(request.contactEmail, {
      schoolName: request.schoolName,
      subdomain: request.subdomain,
      licenseKey: request.licenseKey,
      note: typeof note === 'string' && note.trim() ? note.trim() : null,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not send the email.',
    };
  }

  revalidatePath('/cp');
  return { ok: true };
}

async function sendHostingActivatedEmail(
  contactEmail: string,
  details: {
    schoolName: string;
    subdomain: string;
    licenseKey: string | null;
    note?: string | null;
  },
): Promise<void> {
  const instanceUrl = `https://${details.subdomain}.openregistro.another-horizon.eu`;
  const { html, text } = renderBrandedEmail({
    preheader: `${details.schoolName} is ready on OpenRegistro.`,
    heading: 'Your hosted instance is ready',
    bodyLines: [
      `Hi, great news - ${details.schoolName}'s free hosted OpenRegistro instance is now live.`,
      `Your address: ${instanceUrl}`,
      "Open that link and follow the first-run setup wizard to create your school's admin account, classes, and staff.",
      ...(details.licenseKey
        ? [`Your reference code (keep this for support requests): ${details.licenseKey}`]
        : []),
      'This instance has its own dedicated database - nothing is shared with any other school.',
      ...(details.note ? [details.note] : []),
    ],
    cta: { label: 'Open your instance', url: instanceUrl },
    footnote:
      "You're receiving this because a hosting request was submitted for this school at openregistro.another-horizon.eu/host.",
  });

  await sendPlatformEmail({
    to: contactEmail,
    subject: `${details.schoolName} is ready on OpenRegistro`,
    text,
    html,
  });
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

export interface RedeployState {
  ok: boolean;
  error?: string;
}

/**
 * POSTs to the demo project's Vercel Deploy Hook, which redeploys from the
 * current tip of `main` - the same thing `git push` + a manual `vercel
 * deploy --prod` would do, just one click instead of a terminal. Returns an
 * error instead of throwing so the button can show it inline rather than
 * tripping a full error boundary.
 */
export async function redeployDemo(_prevState: RedeployState): Promise<RedeployState> {
  await requireCpAdmin();

  const { CP_DEMO_DEPLOY_HOOK_URL } = getEnv();
  if (!CP_DEMO_DEPLOY_HOOK_URL) {
    return { ok: false, error: 'No deploy hook configured on this instance.' };
  }

  try {
    const response = await fetch(CP_DEMO_DEPLOY_HOOK_URL, { method: 'POST' });
    if (!response.ok) {
      return { ok: false, error: `Vercel rejected the deploy hook (HTTP ${response.status}).` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not reach Vercel.',
    };
  }
}

export interface NotificationEmailsState {
  ok: boolean;
  error?: string;
}

/**
 * Splits on commas and newlines so either "a@x.com, b@y.com" or one address
 * per line works - whichever the operator happens to type.
 */
function parseEmailsInput(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

const emailListSchema = z.array(z.string().email());

export async function updateNotificationEmailsAction(
  _prevState: NotificationEmailsState,
  formData: FormData,
): Promise<NotificationEmailsState> {
  await requireCpAdmin();

  const raw = formData.get('emails');
  if (typeof raw !== 'string') return { ok: false, error: 'Missing emails field.' };

  const parsed = emailListSchema.safeParse(parseEmailsInput(raw));
  if (!parsed.success) {
    return { ok: false, error: 'One or more addresses are not valid emails.' };
  }

  const db = getHostingDb();
  if (!db) return { ok: false, error: 'Hosting requests are not available on this instance.' };

  await setNotificationEmails(db, parsed.data);
  revalidatePath('/cp');
  return { ok: true };
}
