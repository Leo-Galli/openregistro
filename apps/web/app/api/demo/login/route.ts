import { NextResponse } from 'next/server';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { DEMO_PASSWORD, getDemoAccount, isDemoMode } from '@/lib/demo';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * One-click demo entry from the marketing site.
 * GET /api/demo/login?as=teacher (admin | teacher | student | guardian)
 * Only available when DEMO_MODE=true.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const loginUrl = new URL('/login', url.origin);

  if (!isDemoMode()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const account = getDemoAccount(url.searchParams.get('as'));
  if (!account) {
    loginUrl.searchParams.set('error', 'unknown-demo-role');
    return NextResponse.redirect(loginUrl);
  }

  const rate = checkRateLimit(`demo-login:${account.key}`, 20, 60_000);
  if (!rate.allowed) {
    loginUrl.searchParams.set('error', 'rate-limited');
    return NextResponse.redirect(loginUrl);
  }

  try {
    await signIn('credentials', {
      email: account.email,
      password: DEMO_PASSWORD,
      redirectTo: '/dashboard',
    });
    return NextResponse.redirect(new URL('/dashboard', url.origin));
  } catch (error) {
    // Auth.js throws a redirect on successful sign-in - rethrow so Next handles it.
    if (error instanceof AuthError) {
      loginUrl.searchParams.set('error', 'demo-login-failed');
      return NextResponse.redirect(loginUrl);
    }
    throw error;
  }
}
