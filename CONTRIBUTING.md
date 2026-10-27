<div align="center">
  <a href="./README.md"><img src="./docs/assets/readme/banner.svg" alt="OpenRegistro" width="420" /></a>
</div>

# Contributing to OpenRegistro

Thanks for considering a contribution. This document covers how to get a development
environment running and the conventions the codebase follows.

## Development setup

Requirements: Node.js >= 20.9, pnpm >= 9 (the repo pins pnpm 10.29.3 via `packageManager`
in `package.json` - `corepack enable` will pick it up automatically).

```bash
pnpm install
pnpm dev:json
```

`dev:json` runs the register app with the JSON storage driver, so no database is required
to start developing. Open `http://localhost:3000` and complete the setup wizard (you can
load fictional demo data from the last wizard step).

To develop against PostgreSQL instead:

```bash
docker compose up postgres -d
DATABASE_URL=postgres://openregistro:openregistro@localhost:5432/openregistro \
  pnpm --filter @openregistro/db db:migrate
STORAGE_DRIVER=postgres DATABASE_URL=postgres://openregistro:openregistro@localhost:5432/openregistro \
  pnpm --filter @openregistro/web dev
```

## Project structure

See the "Monorepo layout" section in `README.md`. The short version: `apps/web` is the
register application, `apps/website` is the marketing site, and `packages/*` holds shared
domain types/validation (`core`), storage drivers (`db`), the design system (`ui`), and
shared tooling config (`config`).

## Coding conventions

- TypeScript strict mode everywhere; avoid `any` unless there is a documented reason (see
  the existing `SchemaFor<T>` casts in `packages/db` for the house style of documenting one).
- Every external input (form submission, server action argument, route handler body) is
  validated with a Zod schema from `packages/core` before use. Never trust client-side
  validation alone - every mutating server action re-checks permissions and re-validates
  input server-side.
- Named exports only for React components (no default exports) - it keeps renames and
  grep-based navigation reliable.
- kebab-case file names, PascalCase components/types, camelCase functions/variables.
- Tests live next to the code they cover (`*.test.ts` for unit/logic tests); Playwright specs
  live under `apps/web/e2e/`.
- No TODOs or placeholder implementations in committed code. If something is out of scope,
  leave it out entirely rather than stubbing it.

## Contributing a theme

See `docs/theming.md` for the full guide. The short version: add a `ThemeDefinition` file
under `packages/ui/src/themes/` and register it in that folder's `THEMES` array - no other
code needs to change for it to show up in every school's branding settings.

## Commit messages

This repository uses [Conventional Commits](https://www.conventionalcommits.org/), enforced
by commitlint on every commit (`.husky/commit-msg`). Examples:

```
feat(web): add absence justification review
fix(rbac): grant students the ability to justify their own absences
docs: add architecture overview
chore(deps): bump next to 16.4.3
```

## Before opening a pull request

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four must pass. If you changed a dialog-driven UI flow in `apps/web`, also run the e2e
suite:

```bash
pnpm --filter @openregistro/web test:e2e
```

Then open a pull request against `main` using the PR template. Keep PRs focused - a bug fix
doesn't need an unrelated refactor riding along with it.

## Reporting security issues

Do not open a public issue for a security vulnerability - see `SECURITY.md`.
