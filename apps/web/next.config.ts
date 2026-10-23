import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for docker/Dockerfile's runtime stage, which copies
  // .next/standalone rather than shipping the full node_modules tree.
  output: 'standalone',
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
