<div align="center">

<a href="https://github.com/Leo-Galli/openregistro"><img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0:151b32,45:2350e7,100:ffcd29&text=OpenRegistro&fontColor=fffbeb&fontSize=54&fontAlignY=45&animation=twinkling" alt="OpenRegistro" width="100%" /></a>

<img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=500&size=16&color=2350E7&center=true&vCenter=true&width=640&height=34&duration=2800&pause=1200&lines=A+school+register+you+run+yourself;Self-hosted.+Open+source.+AGPL-3.0;Grades.+Attendance.+Families.+One+app;No+ads.+No+paywall.+No+vendor+lock-in." alt="A school register you run yourself" />

<p>
  <a href="https://github.com/Leo-Galli/openregistro/tree/main/apps/web"><img src="https://skillicons.dev/icons?i=next&theme=light" width="44" height="44" alt="web" /></a>&nbsp;
  <a href="https://github.com/Leo-Galli/openregistro/tree/main/apps/website"><img src="https://skillicons.dev/icons?i=ts&theme=light" width="44" height="44" alt="website" /></a>&nbsp;
  <a href="https://github.com/Leo-Galli/openregistro/tree/main/packages/db"><img src="https://skillicons.dev/icons?i=postgres&theme=light" width="44" height="44" alt="db" /></a>&nbsp;
  <a href="https://github.com/Leo-Galli/openregistro/tree/main/docker"><img src="https://skillicons.dev/icons?i=docker&theme=light" width="44" height="44" alt="docker" /></a>&nbsp;
  <a href="https://github.com/Leo-Galli/openregistro"><img src="https://skillicons.dev/icons?i=github&theme=light" width="44" height="44" alt="GitHub" /></a>
</p>

<p>
  <a href="https://github.com/Leo-Galli/openregistro/actions/workflows/ci.yml"><img src="https://github.com/Leo-Galli/openregistro/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-2350E7?style=for-the-badge&labelColor=151B32" alt="License: AGPL-3.0" /></a>
  <a href="./docs/installation.md"><img src="https://img.shields.io/badge/Self--hosted-Docker%20%2F%20Node-EF5478?style=for-the-badge&labelColor=151B32" alt="Self-hosted" /></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-2350E7?style=for-the-badge&labelColor=151B32" alt="PRs welcome" /></a>
</p>

<p>
  <a href="https://demo.openregistro.another-horizon.eu"><img src="https://img.shields.io/badge/-Try%20the%20live%20demo-2350E7?style=for-the-badge" alt="Try the live demo" /></a>
  <a href="https://openregistro.another-horizon.eu/host"><img src="https://img.shields.io/badge/-Get%20free%20hosting-151B32?style=for-the-badge" alt="Get free hosting" /></a>
  <a href="https://openregistro.another-horizon.eu/docs"><img src="https://img.shields.io/badge/-Docs-EF5478?style=for-the-badge" alt="Docs" /></a>
</p>

</div>

<br/>

OpenRegistro is a free, open source, self-hosted school electronic register for K-12 schools: roles for staff, students and families, a daily class register, a weighted gradebook, absence justifications, homework, announcements, report cards, timetable, and parent-teacher meetings. Install it on your own server - student data never leaves your infrastructure.

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:151b32,35:2350e7,70:ffcd29,100:151b32" width="100%" alt="" />

<br/>

<div align="center">
  <img src="./docs/assets/readme/banner.svg" alt="OpenRegistro - a school register you run yourself, not one you rent." width="100%" />
</div>

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:151b32,35:2350e7,70:ffcd29,100:151b32" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=2350E7&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=PACKAGES" alt="Packages" /></p>

| Package                          | Role                                               |
| -------------------------------- | -------------------------------------------------- |
| [apps/web](./apps/web)           | Register application (self-hosted by schools)      |
| [apps/website](./apps/website)   | Marketing site and rendered docs                   |
| [packages/ui](./packages/ui)     | Design system: tokens, components, base themes     |
| [packages/core](./packages/core) | Domain types, Zod schemas, RBAC, storage interface |
| [packages/db](./packages/db)     | Storage drivers: JSON files and PostgreSQL         |
| [docker/](./docker)              | Dockerfile and compose stacks                      |
| [scripts/](./scripts)            | Setup, seed, backup, restore, migrate              |
| [docs/](./docs)                  | Installation, architecture, GDPR, API reference    |

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:151b32,35:2350e7,70:ffcd29,100:151b32" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=2350E7&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=FEATURES" alt="Features" /></p>

|                              |                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| **Role-based access**        | Admin, secretary, principal, teacher, student, guardian - enforced server-side         |
| **Class register**           | Lesson logs, attendance (present / absent / late / early leave), online justifications |
| **Gradebook & report cards** | Weighted averages, term evaluations, PDF export                                        |
| **Homework & announcements** | Due dates for classes; school-wide or class-scoped posts with read receipts            |
| **Timetable & calendar**     | Weekly schedule, school events, parent-teacher meeting booking                         |
| **Discipline & audit**       | Immutable disciplinary notes; audit log for sensitive mutations                        |
| **Security & GDPR**          | TOTP 2FA, personal data export, account deactivation                                   |
| **Your storage**             | JSON (zero infra) or PostgreSQL - same app, same model                                 |

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:151b32,35:2350e7,70:ffcd29,100:151b32" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=2350E7&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=QUICK+START" alt="Quick start" /></p>

```bash
pnpm install
pnpm dev:json
```

No database required - data lives under `data/`. Production-like with Postgres:

```bash
docker compose up
```

JSON-only Docker:

```bash
docker compose -f docker-compose.json.yml up
```

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:151b32,35:2350e7,70:ffcd29,100:151b32" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=2350E7&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=DOCS" alt="Docs" /></p>

| Guide                                                                        | Source                                             |
| ---------------------------------------------------------------------------- | -------------------------------------------------- |
| [Installation](https://openregistro.another-horizon.eu/docs/installation)    | [`docs/installation.md`](./docs/installation.md)   |
| [Configuration](https://openregistro.another-horizon.eu/docs/configuration)  | [`docs/configuration.md`](./docs/configuration.md) |
| [Architecture](https://openregistro.another-horizon.eu/docs/architecture)    | [`docs/architecture.md`](./docs/architecture.md)   |
| [Theming](https://openregistro.another-horizon.eu/docs/theming)              | [`docs/theming.md`](./docs/theming.md)             |
| [Backups](https://openregistro.another-horizon.eu/docs/backups)              | [`docs/backups.md`](./docs/backups.md)             |
| [GDPR](https://openregistro.another-horizon.eu/docs/gdpr)                    | [`docs/gdpr.md`](./docs/gdpr.md)                   |
| [Server actions](https://openregistro.another-horizon.eu/docs/api-reference) | [`docs/api-reference.md`](./docs/api-reference.md) |

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:151b32,35:2350e7,70:ffcd29,100:151b32" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=2350E7&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=PRINCIPLES" alt="Principles" /></p>

- Self-hosted by default: your school, your server, your data
- Free forever: no ads, no paywall, no per-student SaaS fee
- Open source under AGPL-3.0: run it, fork it, contribute back
- Privacy by design: no trackers, export and deactivation built in
- Same app for demo and production: JSON or Postgres, one codebase

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:151b32,35:2350e7,70:ffcd29,100:151b32" width="100%" alt="" />

<br/>

<p align="center">
  <a href="./CONTRIBUTING.md"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=14&color=FFFBEB&center=true&vCenter=true&width=220&height=40&duration=1&pause=1000000&background=2350E7&lines=Contributing" alt="Contributing" /></a>&nbsp;
  <a href="./SECURITY.md"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=14&color=151B32&center=true&vCenter=true&width=220&height=40&duration=1&pause=1000000&background=FFCD29&lines=Security" alt="Security" /></a>
</p>

<p align="center"><sub><i>A register you run yourself, not one you rent.</i></sub></p>

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).

<img src="https://capsule-render.vercel.app/api?type=waving&section=footer&height=110&color=0:151b32,45:2350e7,100:ffcd29" alt="" width="100%" />
