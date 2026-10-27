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
  /*
   * Next.js Server Actions reject any POST whose Origin header doesn't match
   * the server's own host, as CSRF protection - correct by default, but it
   * also rejects every /cp button when the page is reached through the
   * apps/website vercel.json rewrite (openregistro.another-horizon.eu/cp),
   * since the browser's Origin is the marketing site's domain, not this
   * deployment's own. Confirmed as the actual cause of "every button 404s"
   * via a real click-through, not guessed - every /cp form POST failed only
   * when reached via the proxy domain, never via demo.openregistro... direct.
   * This is exactly the documented use case for allowedOrigins ("helpful when
   * you have a reverse proxy in front of your app").
   */
  experimental: {
    serverActions: {
      allowedOrigins: ['openregistro.another-horizon.eu', 'openregistro.vercel.app'],
    },
  },
  // Required for docker/Dockerfile's runtime stage, which copies
  // .next/standalone rather than shipping the full node_modules tree.
  output: 'standalone',
  // The dev-mode route indicator overlay renders as a fixed-position portal
  // that can sit on top of real UI (e.g. a tall dialog's lowest field) and
  // intercept pointer events - confirmed via a real Playwright run blocked
  // on exactly this. It has no effect in production builds either way.
  devIndicators: false,
  transpilePackages: ['@openregistro/core', '@openregistro/db', '@openregistro/ui'],
  // The `vercel` CLI (used by lib/provisioning to shell out for automated
  // school provisioning) has its own complex internals not meant to be
  // webpack-bundled - this keeps it as a real node_modules dependency at
  // runtime instead.
  serverExternalPackages: ['vercel'],
  // serverExternalPackages alone does not make the deploy-time file tracer
  // include `vercel`'s files in /cp's function bundle - lib/provisioning
  // deliberately resolves its CLI path via a non-statically-analyzable
  // expression (to dodge a separate webpack ESM-resolution build failure),
  // which also makes it invisible to the tracer's static analysis. This
  // forces inclusion explicitly instead.
  //
  // `node_modules/vercel/**/*` alone is NOT enough: lib/provisioning/
  // vercel-cli.ts runs vercel's CLI entrypoint as a genuine child process
  // (`node node_modules/vercel/dist/vc.js ...`), and that process does its
  // own plain Node `require()` resolution from the deployed function's own
  // filesystem - nothing about webpack bundling applies to it at all. The
  // `vercel` package's own package.json lists dozens of `@vercel/*` packages
  // as real (non-optional) dependencies (`@vercel/cli-auth`, `@vercel/build-
  // utils`, one per framework builder, etc.), plus a platform-specific native
  // binary (`@vercel/vc-native-linux-x64` on Vercel's own runtime) as an
  // optional dependency - every one of those lives as a SIBLING package under
  // `node_modules/@vercel/*`, not nested inside `node_modules/vercel/`, so
  // the original glob silently missed all of them. Confirmed as the actual
  // cause of a real production failure ("Cannot find package '@vercel/cli-
  // auth'", "native Vercel CLI package ... is not installed") when clicking
  // "Create project" in /cp, not guessed.
  outputFileTracingIncludes: {
    '/cp': ['node_modules/vercel/**/*', 'node_modules/@vercel/**/*'],
  },
  // This same codebase is deployed to multiple Vercel projects under
  // multiple domains (the demo/control-panel project, the public-API
  // project, and one more per auto-provisioned school) - redirect each
  // project's own default *.vercel.app URL to its real branded domain, but
  // only for these two specific hosts. A blanket "any *.vercel.app" rule
  // would also catch every per-school instance's own fallback URL, which
  // must keep working as-is, not bounce to the demo's domain.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: 'openregistro-demo.vercel.app' }],
        destination: 'https://demo.openregistro.another-horizon.eu/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: 'openregistro-api.vercel.app' }],
        destination: 'https://api.openregistro.another-horizon.eu/:path*',
        permanent: true,
      },
    ];
  },
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
