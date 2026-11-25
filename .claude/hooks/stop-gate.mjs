#!/usr/bin/env node
// Stop hook: Claude may not end a turn while scripts/check.sh fails.
// Docs: https://code.claude.com/docs/en/hooks#stop-decision-control
//
// - check passes            -> allow stop (exit 0, no output)
// - check fails, first time -> {"decision":"block","reason":...}: Claude must fix it
// - check fails again while already continuing because of this hook
//   (stop_hook_active=true) -> allow stop, but show the owner a warning.
//   This avoids an endless loop on a failure Claude cannot fix alone.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* no input */ }

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = spawnSync('bash', [join(root, 'scripts/check.sh')], { cwd: root, encoding: 'utf8' });
if (run.status === 0) process.exit(0);

const out = `${run.stdout || ''}${run.stderr || ''}`.trim().split('\n').slice(-40).join('\n');

if (input.stop_hook_active) {
  console.log(JSON.stringify({
    systemMessage: `scripts/check.sh still fails after a fix attempt. Do not trust this turn's output until it passes.\n${out}`,
  }));
  process.exit(0);
}

console.log(JSON.stringify({
  decision: 'block',
  reason: `scripts/check.sh failed. Fix the cause (do not weaken the check), then run it again.\n${out}`,
}));
