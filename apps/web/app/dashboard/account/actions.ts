'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { userIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { generateQrCodeDataUrl, generateTotpEnrollment, verifyTotpToken } from '@/lib/totp';

export interface TotpEnrollmentData {
  secret: string;
  qrDataUrl: string;
}

export async function startTotpEnrollment(): Promise<TotpEnrollmentData> {
  const session = await auth();
  if (!session) throw new Error('Not signed in.');

  const { secret, otpauthUrl } = generateTotpEnrollment(session.user.email ?? session.user.id);
  const qrDataUrl = await generateQrCodeDataUrl(otpauthUrl);
  return { secret, qrDataUrl };
}

const confirmSchema = z.object({
  secret: z.string().min(1),
  code: z.string().min(6).max(6),
});

export interface ConfirmTotpState {
  ok: boolean;
  formError?: string;
}

export async function confirmTotpEnrollment(
  _prevState: ConfirmTotpState,
  formData: FormData,
): Promise<ConfirmTotpState> {
  const session = await auth();
  if (!session) return { ok: false, formError: 'Not signed in.' };

  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, formError: 'Enter the 6-digit code from your authenticator app.' };
  }

  if (!verifyTotpToken(parsed.data.secret, parsed.data.code)) {
    return {
      ok: false,
      formError: 'That code did not match. Check your authenticator app and try again.',
    };
  }

  const storage = await getStorage();
  await storage.users.update(userIdOf(session), { totpSecret: parsed.data.secret });

  revalidatePath('/dashboard/account');
  return { ok: true };
}

export async function disableTotp(): Promise<void> {
  const session = await auth();
  if (!session) return;

  const storage = await getStorage();
  await storage.users.update(userIdOf(session), { totpSecret: null });
  revalidatePath('/dashboard/account');
}
