export const REPO_URL = 'https://github.com/Leo-Galli/openregistro';
export const DEMO_URL = 'https://openregistro-demo.vercel.app';

/**
 * The marketing site is a static export with no server of its own (see
 * CLAUDE.md's stack decisions), so the "request hosting" form submits here
 * cross-origin, to the one deployed Next.js server this project has.
 */
export const HOSTING_REQUEST_API_URL = `${DEMO_URL}/api/hosting-requests`;
