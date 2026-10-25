import type { NextConfig } from 'next';
import { withMicrofrontends } from '@vercel/microfrontends/next/config';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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

export default withMicrofrontends(nextConfig);
