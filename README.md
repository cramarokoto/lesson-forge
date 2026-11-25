# lesson-forge

A Claude Code project that turns an official syllabus into an interactive micro-lesson website, for any subject.

Quality rests on one rule: **those who write do not validate.** Every plan and lesson is checked by independent reviewer subagents that see only the artifact, the plan and the referential.

## Use

1. Copy `inputs/example-physics-chemistry-fr.yaml` and fill it in.
2. `npm ci`
3. In Claude Code at the repo root: `/forge-course inputs/<your-file>.yaml lessons=first`
4. Approve the plan, review the first lesson, then run with `lessons=all`.
5. Check `work/<slug>/report.md` and the built site. Nothing is published without your explicit yes.

## Pipeline

| Step | Agent | Sees |
|---|---|---|
| Framing | `framer` → gate `syllabus-checker` | input, referential |
| Writing | `writer` (one per lesson) | approved plan |
| Staging | `stager` | lesson |
| Review, in parallel | `fact-checker`, `syllabus-checker`, `pedagogy-reviewer`, `quiz-reviewer`, `safety-reviewer` | lesson, plan, referential |
| Arbitration | orchestrator (max 3 rounds, then escalation) | findings |
| QA | `qa` | build |
| Validation | the owner | site + report |

See `CLAUDE.md` for rules and layout, and `.claude/skills/forge-course/` for the full pipeline.
