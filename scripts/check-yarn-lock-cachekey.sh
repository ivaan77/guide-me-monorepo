#!/usr/bin/env bash
# Verifies yarn.lock's cacheKey matches the format the pinned yarn version
# writes. Called from BOTH the CI workflows AND the local pre-commit hook,
# so bumping yarn only requires editing ONE file — this one.
#
# Why this exists:
#   yarn.lock stores a `cacheKey` at the top ("cacheKey: 10c0" for yarn
#   4.16.0). Older 4.x point releases wrote `cacheKey: 10`. `yarn install
#   --immutable` reads the old format leniently outside CI but strictly
#   under --immutable, so a stale lockfile runs fine locally and blows up
#   on CI with a generic "would have been modified" error.
#
#   Rather than diagnose that every few weeks, we fail fast with the
#   exact fix commands. Guarded in CI so drift never wastes a full run;
#   guarded in the pre-commit hook so drift can't even be committed.
#
# Bumping yarn:
#   1. Update EXPECTED_CACHEKEY below.
#   2. Update `packageManager` in the root package.json.
#   3. Update `corepack prepare yarn@X.Y.Z --activate` in all workflows.
#   4. Run `yarn install` locally, commit the lockfile with everything else.

set -euo pipefail

# The expected cacheKey for the pinned yarn version. Update this when
# bumping yarn (see comment above). To find the new value, bump yarn
# locally, run `yarn install`, then `grep "^  cacheKey:" yarn.lock`.
EXPECTED_CACHEKEY="10c0"
EXPECTED_YARN_VERSION="4.16.0"

# Resolve the repo root so this script works whether called from CI's
# working directory or from a git hook (git may cd into .git/).
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
LOCKFILE="$REPO_ROOT/yarn.lock"

if [ ! -f "$LOCKFILE" ]; then
  echo "::error::yarn.lock not found at $LOCKFILE"
  exit 1
fi

ACTUAL_CACHEKEY=$(grep -E '^  cacheKey:' "$LOCKFILE" | head -1 | awk '{print $2}')

if [ "$ACTUAL_CACHEKEY" != "$EXPECTED_CACHEKEY" ]; then
  # ::error:: prefix makes GitHub Actions surface this as a failure
  # annotation; local shells just show it as normal text.
  echo "::error::yarn.lock cacheKey drift detected."
  echo ""
  echo "  Expected: $EXPECTED_CACHEKEY (yarn $EXPECTED_YARN_VERSION format)"
  echo "  Found:    $ACTUAL_CACHEKEY"
  echo ""
  echo "Fix locally, then commit yarn.lock:"
  echo "  corepack prepare yarn@$EXPECTED_YARN_VERSION --activate"
  echo "  yarn install"
  echo "  git add yarn.lock && git commit"
  echo ""
  exit 1
fi

echo "yarn.lock cacheKey OK: $ACTUAL_CACHEKEY"
