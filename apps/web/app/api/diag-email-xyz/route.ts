import { NextResponse, type NextRequest } from 'next/server';
import { getEnv, platformSmtpConfigured } from '@/lib/env';
import { sendEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

/**
 * Temporary diagnostic endpoint - token-gated, same pattern as the migration
 * runner. Calls sendPlatformEmail for real and reports exactly what
 * happened, since the platform's own error logging isn't easily inspectable
 * through `vercel logs` for a specific past invocation. Delete once the
 * actual email-sending failure is understood.
 */
export async function POST(request: NextRequest) {
  const token = process.env.DIAG_TOKEN;
  if (!token || request.headers.get('x-diag-token') !== token) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const env = getEnv();
  const configured = platformSmtpConfigured(env);
  const to = request.nextUrl.searchParams.get('to');
  if (!to) {
    return NextResponse.json({
      ok: false,
      configured,
      smtpHost: env.SMTP_HOST ?? null,
      smtpPort: env.SMTP_PORT ?? null,
      smtpFrom: env.SMTP_FROM ?? null,
      hasUser: Boolean(env.SMTP_USER),
      hasPassword: Boolean(env.SMTP_PASSWORD),
      error: 'pass ?to=<email> to actually attempt a send',
    });
  }

  if (!configured) {
    return NextResponse.json({ ok: false, configured, error: 'SMTP not configured' });
  }

  try {
    await sendEmail(
      {
        host: env.SMTP_HOST as string,
        port: env.SMTP_PORT as number,
        user: env.SMTP_USER ?? null,
        password: env.SMTP_PASSWORD ?? null,
        from: env.SMTP_FROM as string,
      },
      { to, subject: 'OpenRegistro diagnostic test', text: 'This is a diagnostic test email.' },
    );
    return NextResponse.json({ ok: true, configured });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      configured,
      error:
        error instanceof Error
          ? `${error.name}: ${error.message}${'code' in error ? ` (code: ${(error as { code?: unknown }).code})` : ''}`
          : String(error),
    });
  }
}
