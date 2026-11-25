# lesson-forge

Turns a syllabus into a reviewed, interactive micro-lesson website.
Input: `inputs/<file>.yaml` (subject, audience, language, official referential, chapters).
Output: `dist/<slug>/index.html`, one self-contained static page per course.
Format inspired by Algo Lab (step-by-step animated diagram, notation panel, counters panel), plus widgets and a 3-question quiz per lesson.

## Rules (non-negotiable)

1. **No unverified claims.** Every fact in a lesson traces to a fetched source or to the referential. If it cannot be verified, say so; never invent.
2. **Do not validate the owner's claims without checking them.** Prefer evidence; contradict clearly when she is wrong.
3. **Reviewer independence.** Reviewers are subagents in a fresh context. They get the artifact, the plan and the referential, never the author's reasoning or earlier reviews.
4. **The referential prevails.** Scope comes from the official syllabus, not from taste.
5. **External links only after a real fetch** that returned the expected content.
6. **No copying of protected designs or text.** Algo Lab inspires the format only: no code, assets, colors or wording.
7. **Show before publishing.** Build and show the result; never deploy or publish a course, merge, or push to a shared branch without the owner's explicit yes. Committing and pushing to the session's own working branch is allowed: it is a backup, not a publication.
8. **Target-language typography** (French: non-breaking space before `; : ! ?`, « guillemets », decimal comma).
9. **Scan every third-party skill before installing it** with NVIDIA SkillSpector (`scripts/scan-skill.sh <dir>`), read every HIGH finding, install text-only parts when the rest runs code. Record the scan in the skill's NOTICE.md.

Repo, prompts and code are in **English**. Course content is in the course's language.

## Commands

```bash
npm ci                                   # once
bash scripts/check.sh                    # the gate: validate, build, Playwright
node scripts/validate.mjs [--require-scenes]
node scripts/snapshot.mjs <slug> <chapter> <lesson>   # step screenshots for the stager
node scripts/sources-cache.mjs <slug>                  # merge confirmed sources into the cache
node scripts/review-page.mjs <slug>                    # owner review page in work/<slug>/review/
```

In Claude Code: `/forge-course inputs/<file>.yaml [chapter=<id>] [lessons=first|all|<ids>] [plan=ask|auto]`
Headless: `claude -p "/forge-course inputs/<file>.yaml plan=auto" --output-format json`

A **Stop hook** runs `scripts/check.sh`: a turn cannot end while it fails (one fix attempt, then the owner is warned).
Never weaken a check to make it pass.

## Layout

- `.claude/skills/forge-course/`: orchestrator `SKILL.md` + `references/` (style guide, review protocol, scene contract, report template)
- `.claude/agents/`: framer, writer, stager, resource-curator · reviewers: syllabus-checker, fact-checker, pedagogy-reviewer, quiz-reviewer, safety-reviewer · qa
- `schema/course.schema.json`: contracts for input, plan, lesson, review. `scripts/validate.mjs` adds the rules JSON Schema cannot express.
- `courses/<slug>/<chapter>/`: plan and lesson JSON (generated)
- `work/<slug>/`: review reports, `report.md`, `verified-sources.json` (fact-check cache), screenshots
- `engine/`: static renderer (`app.js`, `style.css`, `palette.json` roles, `i18n.json`); see `engine/README.md`
- `tests/`: Playwright suite + engine fixture course

## Status

See `HANDOVER.md` §7–8. Pilot: French seconde physics-chemistry, chapter "L'atome".

# Compact instructions

Keep: the current course slug, chapter and lesson ids, the review round, open ERROR/AMBIGUOUS findings with their ids, unverified items, and the owner's decisions. Drop: fetched page contents and full tool output.
