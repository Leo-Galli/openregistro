# Multi-stage build for apps/web, using Turborepo's prune to ship only the
# workspace slice @openregistro/web actually needs (its own source plus the
# packages/* it depends on), not the whole monorepo (apps/website, e2e specs,
# other packages' devDependencies, etc).

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# --- Prune: compute the minimal workspace subset for @openregistro/web ---
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo prune @openregistro/web --docker

# --- Install dependencies for the pruned workspace ---
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
# A real AUTH_SECRET is required at runtime, but `next build` only needs any
# non-empty value to satisfy Auth.js's config validation at build time.
ENV AUTH_SECRET=build-time-placeholder-not-used-at-runtime
RUN pnpm turbo run build --filter=@openregistro/web

# --- Runtime ---
FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Pre-create the JSON driver's data directory so a named volume mounted here
# (see docker-compose.json.yml) inherits nextjs ownership on first creation
# instead of defaulting to root, which would block writes from this
# non-root container.
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000)).then(r => process.exit(r.status < 500 ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/web/server.js"]
