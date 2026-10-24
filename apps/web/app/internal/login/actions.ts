'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEnv } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';
import { HOSTING_ADMIN_COOKIE } from '@/lib/hosting-admin';

export interface InternalLoginState {
  error?: string;
}

export async function loginInternal(
  _prevState: InternalLoginState,
  formData: FormData,
): Promise<InternalLoginState> {
  const { HOSTING_ADMIN_SECRET } = getEnv();
  if (!HOSTING_ADMIN_SECRET) {
    return { error: 'This instance has no hosting admin configured.' };
  }

  const rateLimit = checkRateLimit('internal-login', 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: 'Too many attempts. Try again shortly.' };
  }

  const secret = formData.get('secret');
  if (typeof secret !== 'string' || secret !== HOSTING_ADMIN_SECRET) {
    return { error: 'Incorrect secret.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(HOSTING_ADMIN_COOKIE, HOSTING_ADMIN_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/internal',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect('/internal/hosting-requests');
}
