import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_SCHOOL, listPublicDirectorySchools } from '@openregistro/db';
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
 * Never 500s for the picker: falls back to the shared demo school.
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

  try {
    const schools = await listPublicDirectorySchools(db);
    return NextResponse.json({ schools }, { headers });
  } catch (error) {
    console.error('GET /api/directory/schools failed', error);
    return NextResponse.json({ schools: [DEMO_SCHOOL] }, { headers });
  }
}
