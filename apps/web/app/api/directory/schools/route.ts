import { NextResponse, type NextRequest } from 'next/server';
import { listPublicDirectorySchools } from '@openregistro/db';
import { getHostingDb } from '@/lib/hosting-db';
import { publicApiCorsHeaders } from '@/lib/public-api-cors';
import { proxyToTargetIfConfigured } from '@/lib/public-api-proxy';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: publicApiCorsHeaders(request.headers.get('origin')),
  });
}

/**
 * Public school directory for the mobile app picker. Always available when
 * this deployment has HOSTING_DATABASE_URL (demo/api projects); otherwise 503.
 */
export async function GET(request: NextRequest) {
  const proxied = await proxyToTargetIfConfigured(request);
  if (proxied) return proxied;

  const headers = publicApiCorsHeaders(request.headers.get('origin'));
  const db = getHostingDb();
  if (!db) {
    return NextResponse.json(
      { error: 'School directory is not available on this instance.' },
      { status: 503, headers },
    );
  }

  const schools = await listPublicDirectorySchools(db);
  return NextResponse.json({ schools }, { headers });
}
