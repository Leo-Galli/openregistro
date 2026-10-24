import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createHostingRequest } from '@openregistro/db';
import { getHostingDb } from '@/lib/hosting-db';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/*
 * The marketing site (apps/website) is a static export with no server of
 * its own, so its "request hosting" form submits here, cross-origin. Only
 * that site's known origins are allowed - this is a public, unauthenticated,
 * write-only endpoint (a lead-capture form), so CORS is the only thing
 * standing between it and being spammed from an arbitrary page.
 */
const ALLOWED_ORIGINS = new Set([
  'https://openregistro-website.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
]);

const hostingRequestSchema = z.object({
  schoolName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  approxStudents: z.number().int().min(1).max(100000).nullable(),
  message: z.string().max(2000).nullable(),
});

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));

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

  await createHostingRequest(db, parsed.data);
  return NextResponse.json({ ok: true }, { status: 201, headers });
}
