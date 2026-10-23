import { NextResponse, type NextRequest } from 'next/server';

/**
 * This is intentionally the only proxy (formerly "middleware") in the app,
 * and it intentionally does nothing but generate a per-request CSP nonce -
 * no auth/installer guards here (those stay in server layouts, see
 * lib/guards.ts) because the storage drivers use Node-only APIs that are not
 * guaranteed to be available wherever a proxy actually executes. A nonce
 * generator has no such dependency, so it does not carry that risk.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV !== 'production';

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Radix UI primitives position themselves via inline `style` attributes;
    // there is no nonce mechanism for style attributes (only style elements),
    // so this stays a documented exception rather than a strict policy.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
    },
  ],
};
