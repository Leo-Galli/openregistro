import { NextResponse, type NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { getHostingDb } from '@/lib/hosting-db';

export const dynamic = 'force-dynamic';

/**
 * Temporary, one-time migration runner - gated on its own dedicated
 * MIGRATION_RUNNER_TOKEN env var (not a browser session, and deliberately
 * not an existing secret) because this must be triggerable from outside a
 * logged-in /cp session. Applies exactly the one pending migration (0008:
 * platform_settings table) directly, since this route's whole purpose is a
 * single emergency run, not a general migration mechanism - delete this
 * file (and the env var) once confirmed applied.
 */
export async function POST(request: NextRequest) {
  const token = process.env.MIGRATION_RUNNER_TOKEN;
  if (!token || request.headers.get('x-migration-token') !== token) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const db = getHostingDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: 'no hosting db configured' }, { status: 503 });
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
        "notification_emails" text,
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
    return NextResponse.json({ ok: true, applied: ['platform_settings table'] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
