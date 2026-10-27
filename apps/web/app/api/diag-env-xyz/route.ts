import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/** Temporary diagnostic - token-gated, same pattern as earlier ones. Delete once understood. */
export async function GET(request: NextRequest) {
  const token = process.env.DIAG_TOKEN;
  if (!token || request.headers.get('x-diag-token') !== token) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const vercelVars = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith('VERCEL')),
  );
  return NextResponse.json({ vercelVars });
}
