import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
   * /cp is also reachable at openregistro.vercel.app/cp via a vercel.json
   * rewrite on the marketing site (apps/website), proxying to this app so
   * the control panel appears on the main domain without duplicating its
   * auth/DB logic there. Both apps are separate Next.js builds that would
   * otherwise both serve their own, unrelated bundles from the same
   * "/_next/static" path - CP_ASSET_PREFIX (set only on this project's own
   * Vercel deployment, never on a self-hosted install) moves this app's
   * assets to a path the marketing site's rewrite can forward unambiguously.
   */
  assetPrefix: process.env.CP_ASSET_PREFIX,
  // Required for docker/Dockerfile's runtime stage, which copies
  // .next/standalone rather than shipping the full node_modules tree.
  output: 'standalone',
  // The dev-mode route indicator overlay renders as a fixed-position portal
  // that can sit on top of real UI (e.g. a tall dialog's lowest field) and
  // intercept pointer events - confirmed via a real Playwright run blocked
  // on exactly this. It has no effect in production builds either way.
  devIndicators: false,
  transpilePackages: ['@openregistro/core', '@openregistro/db', '@openregistro/ui'],
  async headers() {
    // Content-Security-Policy is set per-request in middleware.ts instead,
    // since it needs a fresh nonce on every request for script-src.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
