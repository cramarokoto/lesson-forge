#!/usr/bin/env bash
# The project's verification gate. Run by the Stop hook and by the qa agent.
#   1. schema + rule validation of inputs, plans, lessons, review reports
#   2. build of every course            (once scripts/build.mjs exists)
#   3. Playwright tests on the built site (once tests/ exists)
# Steps 2-3 are reported as SKIPPED until the engine is built (HANDOVER §8 step 2).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "check: node_modules missing, run: npm ci" >&2
  exit 1
fi

echo "== validate"
node scripts/validate.mjs "$@"

echo "== build"
if [ -f scripts/build.mjs ]; then
  node scripts/build.mjs
else
  echo "SKIPPED: scripts/build.mjs does not exist yet"
fi

echo "== playwright"
if [ -d tests ] && ls tests/*.spec.* >/dev/null 2>&1; then
  npx playwright test --trace off
else
  echo "SKIPPED: no tests/*.spec.* yet"
fi

echo "check: OK"
