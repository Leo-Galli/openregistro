import type { NextRequest } from 'next/server';

/**
 * The public-API project (api.openregistro.another-horizon.eu) runs this
 * exact same codebase but deliberately has no HOSTING_DATABASE_URL of its
 * own - duplicating that connection string into a second project is a
 * second place it could leak, for no benefit. When API_PROXY_TARGET (a
 * plain URL, not a secret) is set only on that project, this forwards the
 * request to the demo project's already-connected copy of the same route
 * instead of handling it locally.
 *
 * Deliberately NOT a next.config.ts rewrite: Next.js only applies a rewrite
 * when no local page/route already matches that path, and this codebase
 * already has these exact routes defined locally on every project it's
 * deployed to - the local (database-less) handler would always win.
 * Proxying inside the route handler itself has no such precedence problem.
 */
export async function proxyToTargetIfConfigured(request: NextRequest): Promise<Response | null> {
  const target = process.env.API_PROXY_TARGET;
  if (!target) return null;

  const url = new URL(request.url);
  const targetUrl = `${target}${url.pathname}${url.search}`;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      Origin: request.headers.get('origin') ?? '',
      // Forwarded explicitly, not via a blanket header passthrough, so the
      // destination's rate limiter sees the real client's IP rather than
      // this proxy hop's own address.
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
    },
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
  });

  const body = await response.text();

  // Copying response.headers wholesale would carry over content-length and
  // content-encoding from the upstream fetch, which no longer match once
  // the body has been re-read as text here - only the handful this caller
  // actually needs are forwarded.
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  for (const name of [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
  ]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(body, { status: response.status, headers });
}
