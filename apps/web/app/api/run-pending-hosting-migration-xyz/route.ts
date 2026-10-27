import { NextResponse, type NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { getHostingDb } from '@/lib/hosting-db';
import { getEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Temporary, one-time migration runner - gated on the provisioning token
 * (not a browser session) because this must be triggerable from outside a
 * logged-in /cp session. Applies exactly the one pending hosting_requests
 * migration (0007: requested_subdomain column) directly, since this route's
 * whole purpose is a single emergency run, not a general migration
 * mechanism - delete this file once confirmed applied.
 */
export async function POST(request: NextRequest) {
  const { VERCEL_PROVISIONING_TOKEN } = getEnv();
  if (
    !VERCEL_PROVISIONING_TOKEN ||
    request.headers.get('x-migration-token') !== VERCEL_PROVISIONING_TOKEN
  ) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const db = getHostingDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: 'no hosting db configured' }, { status: 503 });
  }

  try {
    await db.execute(
      sql`ALTER TABLE "hosting_requests" ADD COLUMN IF NOT EXISTS "requested_subdomain" text`,
    );
    return NextResponse.json({ ok: true, applied: ['requested_subdomain column'] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
