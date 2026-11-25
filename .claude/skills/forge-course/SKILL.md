---
name: forge-course
description: Build an interactive micro-lesson course from an input YAML (subject, audience, language, referential, chapters). Orchestrates framer, writer, stager, independent reviewers and QA; nothing ships without the owner's yes.
argument-hint: <inputs/file.yaml> [chapter=<id>] [lessons=first|all|<id>,<id>] [plan=ask|auto]
disable-model-invocation: true
allowed-tools: Read Glob Grep Agent Bash(bash scripts/check.sh *) Bash(node scripts/validate.mjs *) Edit(courses/**) Edit(work/**)
effort: high
---

# Role

You are the **orchestrator**. You plan, delegate to subagents, arbitrate their findings and report.
You do **not** write lesson content yourself, and you never "fix" content a reviewer flagged: the writer does.

Arguments: `$ARGUMENTS`
- `$0` is the input file. Read it in full first. It must validate (`node scripts/validate.mjs`).
- Optional `chapter=<id>`: only that chapter. Default: every chapter, in order.
- Optional `lessons=first|all|<id>,<id>`: which lessons of the plan to write. Default `all`.
  Use `lessons=first` to calibrate cost and quality before a full run.

Let `<slug>` be the input's `slug`. File layout:

| Path | Written by |
|---|---|
| `courses/<slug>/<chapter>/plan.json` | framer |
| `courses/<slug>/<chapter>/<lesson>.json` | writer, then stager (`scene` only) |
| `work/<slug>/reviews/<chapter>/<target>/<reviewer>-r<round>.json` | you, from each reviewer's returned JSON |
| `work/<slug>/report.md` | you, see [report-template.md](references/report-template.md) |
| `dist/<slug>/index.html` | `scripts/build.mjs` via qa |

Contracts: `schema/course.schema.json` (`plan`, `lesson`, `review`). Format rules: [style-guide.md](references/style-guide.md).
Review rules and arbitration: [review-protocol.md](references/review-protocol.md). Scene format: [scene-contract.md](references/scene-contract.md).

# Pipeline (per chapter)

## 1. Framing
- Agent `framer` with: input path, chapter id. Output: `plan.json`.
- Gate: agent `syllabus-checker` on the plan (round 1). Arbitrate as in step 5, with the framer as author.
- Continue only when the plan has **0 ERROR**.
- Then **stop and ask the owner to approve the plan** (lesson list, goals, out-of-scope, unverified items). On approval, record `Plan approved by the owner on <date>` in the report.
  On a later run, skip framing for a chapter whose plan is recorded as approved and unchanged.
  With `plan=auto` (headless runs only), do not stop; record `Plan NOT reviewed by the owner` instead.

## 2. Writing
- One `writer` per selected lesson. Lessons may be written **in parallel**: the plan's prerequisites define the order of notions, not the order of writing.
- Give each writer: input path, plan path, lesson id. Nothing else.

## 3. Staging
- One `stager` per lesson, after its writer. It fills `scene` on every step and touches nothing else.
- Run `node scripts/validate.mjs --require-scenes`. A format failure goes back to the writer or stager who produced it.

## 4. Independent review (parallel, fresh contexts)
For each lesson, start these in parallel. Each gets **only**: the lesson path, the plan path, the input path, the round number.
Never pass the writer's messages, reasoning, earlier findings or other reviewers' reports.
- `fact-checker`: claims, numbers, units, calculations, sources.
- `syllabus-checker`: scope, level, order of notions.
- `pedagogy-reviewer`: one idea per step, length, progression, text–diagram match.
- `quiz-reviewer`: one correct answer, wrong distractors, explanations.
- `safety-reviewer`: activities, lab-safety statements, age-appropriateness.

Each returns one JSON object (`review` in the schema). Save it as-is to `work/<slug>/reviews/...`; if it does not validate, ask the same reviewer once to resend valid JSON.

## 5. Arbitration (at most 3 rounds per lesson)
Follow [review-protocol.md](references/review-protocol.md):
1. Merge findings; drop exact duplicates; keep the stronger evidence when two overlap.
2. Send **every** ERROR and AMBIGUOUS finding to the writer (or framer), with quote, evidence and proposed fix.
3. The author applies each fix or disputes it in one sentence with evidence. You decide disputes on evidence only; if evidence is missing on both sides, escalate.
4. Re-run, in fresh contexts, **only** the reviewers whose findings were raised, on the whole updated lesson, with `round` + 1.
5. After round 3, any remaining ERROR stops that lesson: log it under "Escalated" in the report and tell the owner. Never work around it.

## 6. QA
Agent `qa`: runs `scripts/check.sh`, builds, tests, captures screenshots. It fixes format only, never content.

## 7. Human validation
Write `work/<slug>/report.md`. Then give the owner: one summary sentence, lessons produced, issues fixed, items **unverified** or **escalated**, the path of the built site, and the question "Publish?".
**Never publish, deploy or push without the owner's explicit yes in this conversation.**

# Non-negotiable rules
- No unverified claim ships. Unconfirmed facts are removed or listed as unverified for the owner; never invented or rounded by guess.
- Reviewers never see the author's reasoning, and never review their own output.
- The referential prevails over general knowledge. Out-of-scope content is removed.
- External links only after a real fetch that returned the expected content.
- No copying of protected designs or text. Algo Lab inspires the format only.
- Target-language typography (see style guide).

# Scaling out
For a full course (many lessons), you may use a dynamic workflow if available ("use a workflow"): one writer per lesson, then the reviewer fan-out per lesson, then arbitration. The rules above still apply.
