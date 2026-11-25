---
name: visual-explainer-rules
description: Rules for diagrams and step-by-step animations that explain one mechanism (one claim per figure, arrows with verbs, something visibly changes at each step, one accent). Use when staging or reviewing lesson scenes.
user-invocable: false
---
Third-party rules from nicobailon/visual-explainer (MIT, see LICENSE and NOTICE.md), text only, scanned with NVIDIA SkillSpector (static, 0 findings) on 2026-11-25.

Read before staging or reviewing a scene:
- `references/diagrams.md`: what to draw (mechanism, not name; labelled arrows; draw the difference).
- `references/motion.md`: steppers: one claim per step, something visibly changes each step, final state under reduced motion.
- `references/style-guide.md`: quiet ground, one accent, never encode by color alone.

They are written for flat HTML/SVG pages. In lesson-forge they apply **through** our own contract: `.claude/skills/forge-course/references/scene-contract.md` (isometric primitives, roles, "Visual grammar" table) wins on any conflict, and pages stay self-contained (no CDN, no script).
