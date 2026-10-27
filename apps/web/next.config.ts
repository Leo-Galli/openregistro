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
  // optional dependency.
  //
  // Two prior attempts both failed in production, confirmed by actually
  // inspecting .next/server/app/cp/page.js.nft.json (the real file-trace
  // manifest Next writes for this route) rather than guessing:
  //   1. `node_modules/@vercel/**/*` (relative to apps/web) - wrong, because
  //      pnpm's strict isolation keeps vercel's own dependencies private
  //      inside its own .pnpm store entry; `apps/web/node_modules/@vercel/`
  //      only ever held this app's own direct dependency (`@vercel/
  //      analytics`), never vercel's.
  //   2. `node_modules/.pnpm/vercel@*/node_modules/**/*` (targeting that
  //      .pnpm store entry directly) - also wrong: confirmed via the nft.json
  //      that Next's include-glob matcher silently skips dot-prefixed path
  //      segments like `.pnpm`, so nothing under it can ever be force-included
  //      this way no matter how the pattern is phrased.
  // The actual fix has two parts: the root `.npmrc`'s `public-hoist-pattern`
  // entries make pnpm additionally place every `@vercel/*` package, plus
  // vercel's plain (non-scoped) dependencies (chokidar, esbuild, jose,
  // jsonc-parser, luxon, sandbox, smol-toml, undici, uuid, zod), at the
  // WORKSPACE ROOT's `node_modules/<pkg>` (an ordinary, non-dot, glob-
  // reachable path) - confirmed by re-running `pnpm install` and finding
  // `node_modules/@vercel/cli-auth` really there, as a symlink, at the repo
  // root (not inside `apps/web/node_modules/`, which pnpm hoisting never
  // duplicates into per-package trees). Node's own module resolution walks
  // every ancestor directory looking for a `node_modules` folder with a
  // match, all the way up to the filesystem root, not just the nearest one -
  // so a copy at the workspace root still gets found by vercel's deeply
  // nested files once the (missing, dot-path, uncopyable) nearer one inside
  // `.pnpm/vercel@.../node_modules/` simply doesn't exist in the deployed
  // bundle to shadow it. The `../../` below reaches that workspace root from
  // apps/web, and `node_modules/vercel/**/*` (unprefixed) is also still
  // required, since the vercel package's own entrypoint file still only
  // lives via its normal pnpm symlink in apps/web's own node_modules.
  outputFileTracingIncludes: {
    '/cp': [
      'node_modules/vercel/**/*',
      '../../node_modules/@vercel/**/*',
      '../../node_modules/chokidar/**/*',
      '../../node_modules/esbuild/**/*',
      '../../node_modules/jose/**/*',
      '../../node_modules/jsonc-parser/**/*',
      '../../node_modules/luxon/**/*',
      '../../node_modules/sandbox/**/*',
      '../../node_modules/smol-toml/**/*',
      '../../node_modules/undici/**/*',
      '../../node_modules/uuid/**/*',
      '../../node_modules/zod/**/*',
    ],
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
