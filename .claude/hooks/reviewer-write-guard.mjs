#!/usr/bin/env node
// PreToolUse hook (Write|Edit|NotebookEdit). Reviewers are read-only, but the
// subagent `memory` field auto-enables Write/Edit for them. This keeps their
// writes inside their own memory directory.
// Docs: https://code.claude.com/docs/en/hooks#pretooluse-decision-control

import { readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';

const REVIEWERS = new Set([
  'syllabus-checker', 'fact-checker', 'pedagogy-reviewer', 'quiz-reviewer', 'safety-reviewer',
]);

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
if (!REVIEWERS.has(input.agent_type)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const target = input.tool_input?.file_path || input.tool_input?.notebook_path || '';
const own = resolve(root, '.claude/agent-memory', input.agent_type);
const rel = relative(own, resolve(root, target));
const inside = target && rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
if (inside) process.exit(0);

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: `${input.agent_type} is a read-only reviewer: it may only write under .claude/agent-memory/${input.agent_type}/. Report findings in your JSON review instead.`,
  },
}));
