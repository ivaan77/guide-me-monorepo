#!/usr/bin/env bash
# One-time setup: points git at the committed .githooks/ directory so the
# repo's pre-commit checks run automatically. Idempotent — safe to re-run.
#
# Run this once per fresh clone:
#   yarn hooks:install
#
# Or the underlying command directly:
#   git config core.hooksPath .githooks

set -euo pipefail

# Skip silently if there's no .git dir (fresh CI checkout, tarball
# install, etc). The postinstall wire-up in root package.json also
# tolerates non-zero exits so the install itself never breaks.
if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Not a git repo — skipping hook install."
  exit 0
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Also skip if hooks are already pointed at .githooks — idempotent
# postinstall shouldn't spam the same message on every yarn install.
CURRENT=$(git config --get core.hooksPath 2>/dev/null || true)
if [ "$CURRENT" = ".githooks" ]; then
  exit 0
fi

git config core.hooksPath .githooks
echo "Git hooks path set to .githooks"
echo "Pre-commit checks will now run automatically before each commit."
