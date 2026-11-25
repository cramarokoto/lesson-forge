#!/usr/bin/env bash
# The project's verification gate. Run by the Stop hook and by the qa agent.
#   1. schema + rule validation of inputs, plans, lessons, review reports
#   2. build of every course into dist/ (lessons not staged yet are skipped)
#   3. Playwright tests on every built page
#   The engine fixture (tests/fixtures/demo) is always built and tested.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "check: node_modules missing, run: npm ci" >&2
  exit 1
fi

echo "== validate"
node scripts/validate.mjs "$@"

echo "== engine fixture"
node scripts/validate.mjs --root tests/fixtures/demo --require-scenes
node scripts/build.mjs --root tests/fixtures/demo --out tests/.build

echo "== build"
rm -rf dist
node scripts/build.mjs

echo "== playwright"
npx playwright test --trace off --reporter=line

echo "check: OK"
