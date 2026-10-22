# OpenRegistro

Open source, self-hosted school electronic register (gradebook).

> Status: early development. See `docs/` for installation and architecture once the first
> installable release is tagged.

## Monorepo layout

- `apps/web` — the register application (self-hosted by schools)
- `apps/website` — marketing and documentation site
- `packages/ui` — design system
- `packages/core` — domain types, validation, RBAC, storage driver interface
- `packages/db` — storage drivers (`json`, `postgres`)
- `docker/`, `scripts/`, `docs/` — deployment, operations, documentation

## Quick start

```bash
pnpm install
pnpm dev:json
```

No database required for `dev:json` — data is stored as JSON files under `data/`.

For a production-like stack with PostgreSQL:

```bash
docker compose up
```

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
