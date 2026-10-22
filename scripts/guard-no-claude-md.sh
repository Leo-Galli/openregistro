#!/usr/bin/env bash
# Pre-commit guard: fail the commit if CLAUDE.md is staged.
set -euo pipefail

if git diff --cached --name-only | grep -qx "CLAUDE.md"; then
  echo "error: CLAUDE.md must never be committed. Run: git restore --staged CLAUDE.md" >&2
  exit 1
fi
