<div align="center">
  <img src="./docs/assets/readme/banner.svg" alt="OpenRegistro - a school register you run yourself, not one you rent." width="100%" />
</div>

<div align="center">

<p>
  <a href="https://github.com/Leo-Galli/openregistro/actions/workflows/ci.yml"><img src="https://github.com/Leo-Galli/openregistro/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-2350E7?style=for-the-badge&labelColor=151B32" alt="License: AGPL-3.0" /></a>
  <a href="./docs/installation.md"><img src="https://img.shields.io/badge/Self--hosted-Docker%20%2F%20Node-EF5478?style=for-the-badge&labelColor=151B32" alt="Self-hosted" /></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-2350E7?style=for-the-badge&labelColor=151B32" alt="PRs welcome" /></a>
</p>

<p>
  <a href="https://openregistro-demo.vercel.app"><img src="https://img.shields.io/badge/-Try%20the%20live%20demo-2350E7?style=for-the-badge" alt="Try the live demo" /></a>
  <a href="https://openregistro.vercel.app/host"><img src="https://img.shields.io/badge/-Get%20free%20hosting-151B32?style=for-the-badge" alt="Get free hosting" /></a>
  <a href="https://openregistro.vercel.app/docs"><img src="https://img.shields.io/badge/-Docs-EF5478?style=for-the-badge" alt="Docs" /></a>
</p>

</div>

Open source, self-hosted school electronic register (gradebook) for K-12 schools - roles for
staff, students and families, a daily class register, a weighted gradebook, and an online
absence-justification workflow. Install it on your own server or a single container; your
students' data never leaves your infrastructure.

> Status: core feature set complete (school records, register, gradebook, absence
> justifications, homework, announcements, report cards, audit log, timetable, disciplinary
> notes, calendar, and parent-teacher meeting booking) and running behind CI. See `docs/`
> for installation and architecture, and [CHANGELOG.md](./CHANGELOG.md) for what's shipped
> so far and what's deliberately still a gap.

## How it works

<table>
<tr>
<td align="center" width="33%">
  <img src="./docs/assets/readme/icon-download.svg" width="56" height="56" alt="" /><br />
  <strong>Install, or get hosted free</strong><br />
  <sub>One Docker command on your own server, or a dedicated instance we host for you at no cost.</sub>
</td>
<td align="center" width="33%">
  <img src="./docs/assets/readme/icon-school.svg" width="56" height="56" alt="" /><br />
  <strong>Set up your school</strong><br />
  <sub>A first-run wizard walks you through classes, subjects, staff, and student accounts.</sub>
</td>
<td align="center" width="33%">
  <img src="./docs/assets/readme/icon-calendar-check.svg" width="56" height="56" alt="" /><br />
  <strong>Run your register</strong><br />
  <sub>Teachers take attendance and grade; families see progress in real time, on your infrastructure.</sub>
</td>
</tr>
</table>

## Screenshots

<div align="center">
  <img src="./docs/assets/readme/website-hero.png" alt="OpenRegistro marketing site hero section" width="100%" />
  <p><sub>Marketing site - <a href="https://openregistro.vercel.app">openregistro.vercel.app</a></sub></p>
  <br />
  <img src="./docs/assets/readme/dashboard.png" alt="OpenRegistro dashboard overview" width="100%" />
  <p><sub>Dashboard overview on the live demo - <a href="https://openregistro-demo.vercel.app">openregistro-demo.vercel.app</a></sub></p>
</div>

The entire app - not just the marketing site - uses the same light-only "Pop Ledger" design
system (`packages/ui`): hard offset shadows, thick ink borders, and one base theme that any
school can accent with its own brand color from `/dashboard/school/branding`. Additional base
themes are welcome as pull requests - see [`docs/theming.md`](./docs/theming.md).

## Features

<table>
<tr>
<td width="56"><img src="./docs/assets/readme/icon-roles.svg" width="44" height="44" alt="" /></td>
<td><strong>Role-based access</strong><br />School admins, secretary staff, principals, teachers, students, and guardians - enforced server-side on every action, not just hidden in the UI.</td>
</tr>
<tr>
<td width="56"><img src="./docs/assets/readme/icon-register.svg" width="44" height="44" alt="" /></td>
<td><strong>Class register</strong><br />Lesson logs with sign-off, attendance tracking (present / absent / late / early leave), and online absence justifications.</td>
</tr>
<tr>
<td width="56"><img src="./docs/assets/readme/icon-gradebook.svg" width="44" height="44" alt="" /></td>
<td><strong>Gradebook &amp; report cards</strong><br />Weighted grade averages, separate end-of-term evaluations, and PDF report card generation.</td>
</tr>
<tr>
<td width="56"><img src="./docs/assets/readme/icon-calendar.svg" width="44" height="44" alt="" /></td>
<td><strong>Homework, announcements &amp; calendar</strong><br />Read receipts on announcements, a weekly timetable, disciplinary notes, a shared calendar, and parent-teacher meeting booking.</td>
</tr>
<tr>
<td width="56"><img src="./docs/assets/readme/icon-shield.svg" width="44" height="44" alt="" /></td>
<td><strong>Audit log, 2FA &amp; data export</strong><br />An audit log for sensitive changes, TOTP two-factor authentication, and a self-service personal data export.</td>
</tr>
<tr>
<td width="56"><img src="./docs/assets/readme/icon-database.svg" width="44" height="44" alt="" /></td>
<td><strong>Your choice of storage</strong><br />JSON files with zero infrastructure, or PostgreSQL when you need to scale - same application, same data model, selected at install time.</td>
</tr>
</table>

## Monorepo layout

<table>
<tr><td><code>apps/web</code></td><td>the register application (self-hosted by schools)</td></tr>
<tr><td><code>apps/website</code></td><td>marketing and documentation site</td></tr>
<tr><td><code>packages/ui</code></td><td>design system - tokens, components, base themes</td></tr>
<tr><td><code>packages/core</code></td><td>domain types, validation, RBAC, storage driver interface</td></tr>
<tr><td><code>packages/db</code></td><td>storage drivers (<code>json</code>, <code>postgres</code>)</td></tr>
<tr><td><code>docker/</code>, <code>scripts/</code>, <code>docs/</code></td><td>deployment, operations, documentation</td></tr>
</table>

## Quick start

```bash
pnpm install
pnpm dev:json
```

No database required for `dev:json` - data is stored as JSON files under `data/`.

For a production-like stack with PostgreSQL:

```bash
docker compose up
```

Or a database-free Docker setup using the JSON driver:

```bash
docker compose -f docker-compose.json.yml up
```

## Documentation

Rendered at [openregistro.vercel.app/docs](https://openregistro.vercel.app/docs), straight from
the markdown files below - pick whichever is more convenient to read.

<table>
<tr><td><a href="https://openregistro.vercel.app/docs/installation">Installation</a></td><td><a href="./docs/installation.md"><code>docs/installation.md</code></a></td><td>self-hosting from scratch, Docker or Node</td></tr>
<tr><td><a href="https://openregistro.vercel.app/docs/configuration">Configuration</a></td><td><a href="./docs/configuration.md"><code>docs/configuration.md</code></a></td><td>environment variables and the setup wizard</td></tr>
<tr><td><a href="https://openregistro.vercel.app/docs/architecture">Architecture</a></td><td><a href="./docs/architecture.md"><code>docs/architecture.md</code></a></td><td>monorepo layout, the StorageDriver abstraction</td></tr>
<tr><td><a href="https://openregistro.vercel.app/docs/theming">Theming</a></td><td><a href="./docs/theming.md"><code>docs/theming.md</code></a></td><td>the base theme system and how to contribute one</td></tr>
<tr><td><a href="https://openregistro.vercel.app/docs/backups">Backups</a></td><td><a href="./docs/backups.md"><code>docs/backups.md</code></a></td><td>backing up and restoring both storage drivers</td></tr>
<tr><td><a href="https://openregistro.vercel.app/docs/gdpr">GDPR / data protection</a></td><td><a href="./docs/gdpr.md"><code>docs/gdpr.md</code></a></td><td>what personal data is stored and how to export or erase it</td></tr>
<tr><td><a href="https://openregistro.vercel.app/docs/api-reference">Server actions reference</a></td><td><a href="./docs/api-reference.md"><code>docs/api-reference.md</code></a></td><td>every mutating server action, by feature area</td></tr>
</table>

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) - including [`docs/theming.md`](./docs/theming.md) if
you want to contribute a new base theme.

<div align="center">
  <sub>Built with Next.js, Tailwind CSS, and Drizzle ORM - no telemetry, no vendor lock-in.</sub>
</div>
