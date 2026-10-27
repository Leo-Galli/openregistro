/*
 * The marketing site (apps/website) is a static export with no server of
 * its own, so its public-facing forms (request hosting, subdomain
 * availability) submit here, cross-origin. Only that site's known origins
 * are allowed - shared by every public, unauthenticated API route so the
 * allowlist can't drift between them.
 */
const ALLOWED_ORIGINS = new Set([
  'https://openregistro.vercel.app',
  'https://openregistro.another-horizon.eu',
  'http://localhost:3000',
  'http://localhost:3001',
]);

export function publicApiCorsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
