import { NextResponse, type NextRequest } from 'next/server';
import { isSubdomainTaken } from '@openregistro/db';
import { getHostingDb } from '@/lib/hosting-db';
import { checkRateLimit } from '@/lib/rate-limit';
import { publicApiCorsHeaders } from '@/lib/public-api-cors';
import { validateSubdomainFormat } from '@/lib/subdomain-slug';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: publicApiCorsHeaders(request.headers.get('origin')),
  });
}

/**
 * Live availability check for the "request hosting" form's subdomain field.
 * Read-only and public by design, same CORS/rate-limit posture as the
 * hosting-requests endpoint it sits alongside - the actual submission
 * re-validates and re-checks availability itself regardless of what this
 * returned, since a slot can be claimed between the check and the submit.
 */
export async function GET(request: NextRequest) {
  const headers = publicApiCorsHeaders(request.headers.get('origin'));

  const raw = request.nextUrl.searchParams.get('subdomain') ?? '';
  const subdomain = raw.toLowerCase().trim();

  const formatError = validateSubdomainFormat(subdomain);
  if (formatError) {
    return NextResponse.json({ available: false, reason: formatError.message }, { headers });
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = checkRateLimit(`check-subdomain:${ip}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { available: false, reason: 'Too many checks - try again shortly.' },
      { status: 429, headers },
    );
  }

  const db = getHostingDb();
  if (!db) {
    return NextResponse.json(
      { available: false, reason: 'Not available on this instance.' },
      { status: 503, headers },
    );
  }

  const taken = await isSubdomainTaken(db, subdomain);
  return NextResponse.json({ available: !taken }, { headers });
}
