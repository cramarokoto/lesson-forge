# Handover — lesson-forge

Read this file first. It holds everything a fresh Claude Code session needs to continue the work.

## 1. Goal

Build **lesson-forge**: a reusable, domain-agnostic Claude Code project.

- **Input:** a subject, an audience, a language, an official syllabus/referential, and a list of chapters.
- **Output:** an interactive micro-lesson website. The format is modeled on Algo Lab (see §3).
- **Quality model:** a multi-agent pipeline. Writers produce content, and independent reviewer subagents check it in fresh contexts before anything ships.
- **First pilot:** French high-school physics-chemistry (seconde, 2026-2027), module **"L'atome"** (6 lessons). The content of each course is in that course's own language; the repo, prompts and code are in **English only**.

The owner is Christelle, a senior full-stack developer. GitHub account: `cramarokoto`.

## 2. Working rules (non-negotiable)

1. **No unverified claims.** Every factual statement in a lesson must be traceable to a source or to the referential. If something cannot be verified, say so; never invent.
2. **Do not validate the owner's claims without checking them.** Prefer evidence and contradict her clearly when she is wrong.
3. **Reviewer independence.** Reviewers run as subagents in a fresh context and never see the writer's reasoning, only the artifact and the referential.
4. **The referential prevails.** Scope comes from the official syllabus, not from the model's taste.
5. **External links only after a real fetch** that returned the expected content.
6. **No copying of protected designs or text.** Algo Lab is an inspiration for format only: no code, assets, colors or wording copied.
7. **Show before publishing.** Build and show the result to the owner; never deploy or publish without her explicit yes.
8. Use correct typography for the target language (for French: non-breaking spaces before `; : ! ?`, « guillemets », decimal comma).

## 3. Reference format: Algo Lab

- Site: https://byte-sized-algorithms.vercel.app/#/memory/1 by Dilum Sanjaya. It was built with Claude, but the prompt is marked "Not shared yet" on promptshipped.com, and no process write-up exists on dilum.dev (checked 2026-11-25).
- The live site was not reachable from the cloud sandbox. It was studied through a public Persian-language clone on GitHub, rendered locally.

**Layout (3 columns):**

- **Left:** course tree with chapters, lessons and progress, plus search.
- **Center:** an isometric diagram that animates step by step, with a step timeline under it.
- **Right:**
  - a step card: tag, short text, callout, Prev/Next;
  - a "notation" panel (for Algo Lab it shows pseudocode with the current line highlighted);
  - a state panel showing "who holds what".

**Scale:** 86 lessons, 14 chapters, 529 steps. That makes about 6 steps per lesson, each step a few sentences.

**Look and feel:** beige paper background, one coral accent, light/dark mode, progress kept in `localStorage`, smooth transitions between steps.

**Mapping for physics-chemistry:**

| Algo Lab | lesson-forge (science) |
|---|---|
| Pseudocode panel | Notation panel: formulas, equations, nuclide notation, with the current line highlighted |
| Variables panel | Counters panel: protons, neutrons, electrons, charge, mass… |
| — (new) | Small interactive widgets (e.g. build an atom, fill electron shells) |
| — (new) | A 3-question quiz at the end of each lesson |

## 4. Pilot content plan: "L'atome" (seconde, BO spécial n°1 du 22 janvier 2019)

1. Scales: the atom vs the nucleus (orders of magnitude, powers of ten).
2. The nucleus: nucleons, the notation ^A_Z X, Z and A.
3. Mass of the atom: why it is concentrated in the nucleus.
4. Element, isotopes, monatomic ions.
5. Electron configuration from 1s to 3p, and valence electrons.
6. The periodic table, first 3 rows: families, stability (duet/octet rules).

Every numeric value must be checked against a source (e.g. CODATA/NIST for constants, the official BO text for scope).

## 5. Target architecture (Claude Code best practices, checked 2026-11-25 on code.claude.com)

```
lesson-forge/
  CLAUDE.md                         # short: purpose, rules of §2, commands. Keep it pruned.
  .claude/
    skills/forge-course/SKILL.md    # orchestrator, user-invoked: /forge-course inputs/<file>.yaml
    skills/forge-course/references/ # pipeline details, rubrics, style guide (progressive disclosure)
    agents/*.md                     # one subagent per role (below)
    settings.json                   # permissions + Stop hook running scripts/check.sh
    workflows/                      # optional: a saved dynamic workflow for large fan-outs
  schema/course.schema.json         # JSON Schema for plan, lesson, step, scene object, quiz
  inputs/example-physics-chemistry-fr.yaml
  engine/                           # static site engine (template + renderer), built from the pilot
  scripts/validate.mjs build.mjs check.sh
  courses/<slug>/                   # generated content (JSON) per course
  dist/<slug>/index.html            # built site
  work/<slug>/report.md             # review log, open issues, sources
```

**Doc findings to apply:**

- **Skills replace custom commands** for new work: `.claude/skills/<name>/SKILL.md`.
  - Useful frontmatter: `name`, `description`, `argument-hint`, `disable-model-invocation: true` (the orchestrator should only run when the user calls it), `allowed-tools`, `effort`.
  - Keep SKILL.md under 500 lines and link supporting files. `$ARGUMENTS` / `$0` take the input path.
- **Subagents** live in `.claude/agents/*.md` and start with a fresh context.
  - Frontmatter: `name`, `description` (short, say when to use it), `tools` (restrict it: reviewers get read-only tools plus WebFetch/WebSearch), `model`, `effort`, `maxTurns`, `skills`, `isolation: worktree` if needed.
- **Model and effort:**
  - Opus 5.5 is the default model; its default effort is `medium`.
  - Docs guidance: `high` when verification matters, `xhigh` for deeper reasoning, and `max` can overthink, so test it first.
  - Suggested settings:
    - writers: `model: opus`, `effort: high`;
    - fact-checker and referential checker: `model: opus`, `effort: xhigh`;
    - QA/build: `model: sonnet`, `effort: medium`.
  - A `fable` alias exists for the hardest tasks, if the account has it.
- **Verification gate:** give Claude a runnable check. `scripts/check.sh` runs schema validation, the build, link checks and Playwright tests. A **Stop hook** in `.claude/settings.json` runs it, so a turn cannot end while the check fails.
- **Adversarial review:** reviewer prompts flag only correctness, scope and requirement gaps, with evidence. They do not flag style preferences; this avoids over-engineering loops.
- **Scale-out options:**
  - **Dynamic workflows**: a JS script with `agent()`, `pipeline()`, `parallel()`. They are resumable and can be saved to `.claude/workflows/`. Trigger one with "use a workflow" or `ultracode`. This fits "one writer per lesson, then N reviewers per lesson, then cross-check."
  - **Agent teams** are experimental (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) and cost more; mention them only as an optional mode.
- **Headless:** `claude -p "/forge-course inputs/x.yaml" --output-format json` for CI.

## 6. Pipeline (from the French draft, to translate and modernize)

1. **Framing:**
   - The `framer` turns the input YAML into a plan: lessons, learning goals, prerequisites and referential anchors.
   - Gate: `syllabus-checker` confirms that the plan matches the referential (nothing missing, nothing out of scope).
2. **Writing:** one `writer` per lesson produces lesson JSON that follows the schema:
   - 4–8 steps, each with text of 90 words or less;
   - notation of 1–7 lines;
   - counters;
   - exactly 3 quiz questions;
   - sources.
3. **Staging:** the `stager` (scene designer) adds isometric scene objects and animation keys for each step.
4. **Independent review**, run in parallel, each reviewer in a fresh context:
   - `fact-checker`: claims, numbers and units against sources;
   - `syllabus-checker`: scope and level;
   - `pedagogy-reviewer`: progression, one idea per step, cognitive load;
   - `quiz-reviewer`: one correct answer, plausible distractors, explanations;
   - `safety-reviewer`: lab-safety statements, age-appropriateness.
5. **Arbitration:**
   - The orchestrator merges the findings and sends fixes back to the writer.
   - At most 3 rounds. If an issue is still unresolved, escalate it to the human and log it in `work/<slug>/report.md`.
6. **QA:** `qa` runs `scripts/check.sh` (validate, build, Playwright: every step renders, no console errors, light/dark mode, mobile width).
7. **Human validation:** show the built site to the owner. Publishing happens only after her explicit yes.

The French draft of all of this is in `docs/fr-draft/` (orchestrator command, 9 agents, schema, example input). Translate and modernize it; do not keep French in the repo except inside French course content.

## 7. Status (2026-11-25)

- **Done:**
  - Format research.
  - Claude Code docs research (§5).
  - French draft prompt pack.
  - Local `git init` with this handover and the French draft.
- **Not done:**
  - GitHub repo. Christelle chose the name `cramarokoto/lesson-forge`, **private**. She must create it empty (no README) on github.com, because the previous cloud session had no valid GitHub token. Then: `git remote add origin git@github.com:cramarokoto/lesson-forge.git && git push -u origin main`.
  - English rewrite of the prompt pack, schema, `CLAUDE.md` and scripts.
  - The engine.
  - The pilot "L'atome".

## 8. Next steps, in order

1. Create the English skeleton from §5:
   - `CLAUDE.md` (under ~60 lines);
   - the `forge-course` skill and its references;
   - the 9 subagents;
   - the English schema and example input;
   - `scripts/check.sh` and the Stop hook.
   Commit.
2. Build the engine as a single self-contained static page per course, with no runtime CDN. Pre-render formulas (KaTeX at build time). Add Playwright tests. Use system or locally bundled fonts.
3. Run `/forge-course inputs/example-physics-chemistry-fr.yaml` on **lesson 1 only** first, to calibrate cost and quality. Then run the 6 lessons.
4. Show the result to Christelle. Iterate. Publish only on her explicit yes.
5. Later: test generality with a second, non-science domain.
