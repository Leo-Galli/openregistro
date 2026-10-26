import { sendEmail, type SendEmailInput } from './mailer';
import { getEnv, platformSmtpConfigured } from './env';

/**
 * Sends an email through the platform's own mailbox (Tophost SMTP, see
 * env.ts) - used for hosting-request confirmations and, when a school opts
 * in via usePlatformEmail on a platform-hosted instance, notification
 * emails. Never throws: a missing/misconfigured platform SMTP setup (true on
 * every self-hosted install, and possible here too if env vars are absent)
 * should not break the server action that triggered the send - it logs and
 * returns false instead so callers can decide whether to surface that.
 */
export async function sendPlatformEmail(input: SendEmailInput): Promise<boolean> {
  const env = getEnv();

  if (!platformSmtpConfigured(env)) {
    console.error('sendPlatformEmail: platform SMTP is not configured, skipping send.');
    return false;
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
      input,
    );
    return true;
  } catch (error) {
    console.error('sendPlatformEmail: send failed.', error);
    return false;
  }
}

/**
 * Whether a school's "send notifications via the platform mailbox" setting
 * can actually take effect right now. Both halves matter: usePlatformEmail
 * is data that can ride along in a database export/import, and PLATFORM_HOSTED
 * is the instance-level guarantee that a shared mailbox actually exists here
 * to send through - self-hosted installs must never honor the former without
 * the latter.
 */
export function platformEmailEnabledFor(usePlatformEmail: boolean): boolean {
  return usePlatformEmail && getEnv().PLATFORM_HOSTED;
}
