<div align="center">
  <a href="./README.md"><img src="./docs/assets/readme/banner.svg" alt="OpenRegistro" width="420" /></a>
</div>

# Security Policy

## Supported Versions

OpenRegistro is in early development (pre-1.0). Security fixes are made against the `main`
branch; there is no long-term support branch yet. Once the project reaches a tagged 1.0
release, this section will be updated with a supported-versions table.

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Instead, use GitHub's private vulnerability reporting for this repository: go to the
[Security tab](https://github.com/Leo-Galli/openregistro/security/advisories) and click
"Report a vulnerability" to open a private advisory visible only to the maintainers.

If private reporting is not available on the repository when you go to use it, open a
regular issue asking a maintainer to enable it, without including any vulnerability details,
and a maintainer will follow up with a private channel.

We aim to acknowledge reports within 5 business days and to provide a timeline for a fix
once the report is triaged.

## Scope

This policy covers the OpenRegistro codebase itself (`apps/`, `packages/`, `docker/`,
`scripts/`). It does not cover vulnerabilities in third-party dependencies - please report
those upstream, though we are happy to hear about ones that affect a default OpenRegistro
deployment.
