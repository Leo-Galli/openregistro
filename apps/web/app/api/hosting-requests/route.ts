import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createHostingRequest, isSubdomainTaken, getPlatformSettings } from '@openregistro/db';
import { getHostingDb } from '@/lib/hosting-db';
import { checkRateLimit } from '@/lib/rate-limit';
import { publicApiCorsHeaders } from '@/lib/public-api-cors';
import { validateSubdomainFormat } from '@/lib/subdomain-slug';
import { proxyToTargetIfConfigured } from '@/lib/public-api-proxy';
import { sendPlatformEmail } from '@/lib/platform-mailer';
import { renderBrandedEmail } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

const hostingRequestSchema = z.object({
  schoolName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  approxStudents: z.number().int().min(1).max(100000).nullable(),
  message: z.string().max(2000).nullable(),
  requestedSubdomain: z.string().min(1).max(30).nullable().optional(),
});

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: publicApiCorsHeaders(request.headers.get('origin')),
  });
}

export async function POST(request: NextRequest) {
  const proxied = await proxyToTargetIfConfigured(request);
  if (proxied) return proxied;

  const headers = publicApiCorsHeaders(request.headers.get('origin'));

  const db = getHostingDb();
  if (!db) {
    return NextResponse.json(
      { error: 'Hosting requests are not available on this instance.' },
      { status: 503, headers },
    );
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = checkRateLimit(`hosting-request:${ip}`, 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers });
  }

  const parsed = hostingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers });
  }

  const { requestedSubdomain: rawRequestedSubdomain, ...rest } = parsed.data;

  // Re-validate and re-check availability server-side even though the form
  // already did both client-side - the client's check is a UX convenience,
  // never the source of truth for what actually gets stored.
  let requestedSubdomain: string | null = null;
  if (rawRequestedSubdomain) {
    const normalized = rawRequestedSubdomain.toLowerCase().trim();
    const formatError = validateSubdomainFormat(normalized);
    if (formatError) {
      return NextResponse.json({ error: formatError.message }, { status: 400, headers });
    }
    if (await isSubdomainTaken(db, normalized)) {
      return NextResponse.json(
        { error: 'That subdomain was just taken - please choose another.' },
        { status: 409, headers },
      );
    }
    requestedSubdomain = normalized;
  }

  await createHostingRequest(db, { ...rest, requestedSubdomain });
  await Promise.all([
    notifyOperatorsOfNewRequest(db, { ...rest, requestedSubdomain }),
    sendRequestReceivedEmail(rest),
  ]);
  return NextResponse.json({ ok: true }, { status: 201, headers });
}

/**
 * Best-effort: a misconfigured/absent platform SMTP (true on every
 * self-hosted install) must never fail the public submission itself -
 * sendPlatformEmail already swallows its own errors and returns a boolean.
 */
async function notifyOperatorsOfNewRequest(
  db: NonNullable<ReturnType<typeof getHostingDb>>,
  request: {
    schoolName: string;
    contactName: string;
    contactEmail: string;
    approxStudents: number | null;
    message: string | null;
    requestedSubdomain: string | null;
  },
): Promise<void> {
  const { notificationEmails } = await getPlatformSettings(db);
  if (notificationEmails.length === 0) return;

  const { html, text } = renderBrandedEmail({
    preheader: `New hosting request from ${request.schoolName}.`,
    eyebrow: 'New hosting request',
    heading: request.schoolName,
    bodyLines: [
      `${request.schoolName} just requested free hosting.`,
      ...(request.message ? [`Message: "${request.message}"`] : []),
    ],
    facts: [
      { label: 'Contact', value: `${request.contactName} <${request.contactEmail}>` },
      ...(request.approxStudents
        ? [{ label: 'Students', value: String(request.approxStudents) }]
        : []),
      ...(request.requestedSubdomain
        ? [{ label: 'Requested subdomain', value: request.requestedSubdomain }]
        : []),
    ],
    cta: {
      label: 'Review in the control panel',
      url: 'https://openregistro.another-horizon.eu/cp',
    },
    footnote: 'You are receiving this because your address is on the notification list in /cp.',
  });

  await Promise.all(
    notificationEmails.map((to) =>
      sendPlatformEmail({
        to,
        subject: `New hosting request: ${request.schoolName}`,
        text,
        html,
      }),
    ),
  );
}

/**
 * The requester's own confirmation - separate from the operator alert above,
 * sent to the school's contactEmail rather than the notification list, so
 * they know their submission actually went through even before anyone on the
 * operator side has looked at it.
 */
async function sendRequestReceivedEmail(request: {
  schoolName: string;
  contactName: string;
  contactEmail: string;
}): Promise<void> {
  const { html, text } = renderBrandedEmail({
    preheader: 'Thanks - your free hosting request is in.',
    eyebrow: 'Request received',
    heading: `Thanks for requesting hosting, ${request.contactName.split(' ')[0]}`,
    bodyLines: [
      `We've received ${request.schoolName}'s request for a free, self-hosted OpenRegistro instance.`,
      "A real person reviews every request - we'll email this address as soon as it's set up, usually within a few days.",
      'No action is needed from you in the meantime.',
    ],
    cta: { label: 'See what OpenRegistro can do', url: 'https://openregistro.another-horizon.eu' },
    footnote:
      "You're receiving this because this address submitted a hosting request at openregistro.another-horizon.eu/host.",
  });

  await sendPlatformEmail({
    to: request.contactEmail,
    subject: `We've got your OpenRegistro hosting request, ${request.schoolName}`,
    text,
    html,
  });
}
