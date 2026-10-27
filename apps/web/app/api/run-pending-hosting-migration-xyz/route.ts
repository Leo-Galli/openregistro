import { NextResponse, type NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { getHostingDb } from '@/lib/hosting-db';
import { getEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Temporary, one-time migration runner - gated on the provisioning token
 * (not a browser session) because this must be triggerable from outside a
 * logged-in /cp session. Applies exactly the two pending hosting_requests
 * migrations (0005: subdomain column; 0006: provisioning tracking columns)
 * directly, since this route's whole purpose is a single emergency run, not
 * a general migration mechanism - delete this file once confirmed applied.
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

  const applied: string[] = [];
  try {
    await db.execute(sql`ALTER TABLE "hosting_requests" ADD COLUMN IF NOT EXISTS "subdomain" text`);
    applied.push('subdomain column');

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "hosting_requests" ADD CONSTRAINT "hosting_requests_subdomain_unique" UNIQUE("subdomain");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    applied.push('subdomain unique constraint');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."provisioning_status" AS ENUM('not_started', 'provisioning', 'ready', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    applied.push('provisioning_status enum');

    await db.execute(
      sql`ALTER TABLE "hosting_requests" ADD COLUMN IF NOT EXISTS "vercel_project_id" text`,
    );
    applied.push('vercel_project_id column');

    await db.execute(sql`
      ALTER TABLE "hosting_requests" ADD COLUMN IF NOT EXISTS "provisioning_status" "provisioning_status" DEFAULT 'not_started' NOT NULL
    `);
    applied.push('provisioning_status column');

    await db.execute(
      sql`ALTER TABLE "hosting_requests" ADD COLUMN IF NOT EXISTS "provisioning_error" text`,
    );
    applied.push('provisioning_error column');

    return NextResponse.json({ ok: true, applied });
  } catch (error) {
    return NextResponse.json(
      { ok: false, applied, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
