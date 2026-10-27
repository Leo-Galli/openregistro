import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createHostingRequest, isSubdomainTaken } from '@openregistro/db';
import { getHostingDb } from '@/lib/hosting-db';
import { checkRateLimit } from '@/lib/rate-limit';
import { publicApiCorsHeaders } from '@/lib/public-api-cors';
import { validateSubdomainFormat } from '@/lib/subdomain-slug';
import { proxyToTargetIfConfigured } from '@/lib/public-api-proxy';

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
  return NextResponse.json({ ok: true }, { status: 201, headers });
}
