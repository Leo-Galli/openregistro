#!/usr/bin/env bash
# Bump the project version, record it in CHANGELOG.md, and tag the release.
# Does not push, publish, or build anything - this only prepares a release
# commit and tag locally for the maintainer to review and push.
#
# Usage: scripts/release.sh <patch|minor|major|X.Y.Z>
set -euo pipefail

BUMP="${1:-}"
if [ -z "$BUMP" ]; then
  echo "usage: scripts/release.sh <patch|minor|major|X.Y.Z>" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: working tree is not clean. Commit or stash changes before releasing." >&2
  exit 1
fi

CURRENT_VERSION="$(node -p "require('./package.json').version")"

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP" in
  patch)
    NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
    ;;
  minor)
    NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
    ;;
  major)
    NEW_VERSION="$((MAJOR + 1)).0.0"
    ;;
  [0-9]*.[0-9]*.[0-9]*)
    NEW_VERSION="$BUMP"
    ;;
  *)
    echo "error: unrecognized bump '$BUMP' (expected patch, minor, major, or X.Y.Z)." >&2
    exit 1
    ;;
esac

echo "Releasing v$NEW_VERSION (was v$CURRENT_VERSION)..."

node -e "
  const fs = require('node:fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

RELEASE_DATE="$(date -u +%Y-%m-%d)"
if [ -f CHANGELOG.md ] && grep -q "^## \[Unreleased\]" CHANGELOG.md; then
  TMP_FILE="$(mktemp)"
  awk -v version="$NEW_VERSION" -v date="$RELEASE_DATE" '
    /^## \[Unreleased\]/ { print; print ""; print "## [" version "] - " date; next }
    { print }
  ' CHANGELOG.md > "$TMP_FILE"
  mv "$TMP_FILE" CHANGELOG.md
else
  echo "warning: CHANGELOG.md has no '## [Unreleased]' section - skipping changelog update." >&2
fi

git add package.json CHANGELOG.md
git commit -m "chore(release): v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "v$NEW_VERSION"

echo "Release v$NEW_VERSION prepared. Review with 'git show HEAD' then push with:"
echo "  git push origin main --tags"
