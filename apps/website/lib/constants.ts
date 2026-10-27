export const REPO_URL = 'https://github.com/Leo-Galli/openregistro';
export const DEMO_URL = 'https://demo.openregistro.another-horizon.eu';

/**
 * The marketing site is a static export with no server of its own (see
 * CLAUDE.md's stack decisions), so public, unauthenticated API calls (the
 * "request hosting" form, subdomain availability checks) go cross-origin to
 * this dedicated API domain instead of the demo/dashboard app's own domain -
 * same underlying deployment (apps/web), different Vercel project/domain so
 * the two concerns stay addressable separately.
 */
export const API_URL = 'https://api.openregistro.another-horizon.eu';
export const HOSTING_REQUEST_API_URL = `${API_URL}/api/hosting-requests`;
export const CHECK_SUBDOMAIN_API_URL = `${API_URL}/api/hosting-requests/check-subdomain`;
