# Engine

Static renderer: `node scripts/build.mjs` turns `inputs/<file>.yaml` + `courses/<slug>/` into `dist/<slug>/index.html`, one self-contained page (inline CSS, JS and data; no CDN, no web fonts, no runtime math library).

| File | Role |
|---|---|
| `app.js` | Runtime: course tree, isometric SVG scene, step card, notation, counters, quiz, progress, theme |
| `style.css` | Original design, system fonts, light/dark, `prefers-reduced-motion` |
| `palette.json` | Scene roles → colors. **The only roles a stager may use** (checked by `validate.mjs`) |
| `i18n.json` | UI strings per course language |

## Contract

Scene objects follow `.claude/skills/forge-course/references/scene-contract.md`, implemented as written:
- isometric projection of `[x, y, z]` grid units; the camera frames all objects of a lesson once, so it does not move between steps;
- same `key` = same object, animated (position, opacity, color); new keys fade in, missing keys fade out;
- `group` offsets its children (`parent`); `arrow` needs `pos` and `to`; `label` draws a dot, a leader and its text above the point;
- `accent` outlines the object (or colors the text) with the UI accent.

Formulas: `$…$` in text and every `notation` line are rendered by KaTeX to MathML at build time. A formula error fails the build.

Widgets (any other type is rejected by `validate.mjs`):
- `atom-builder` — params `protons`, `neutrons`, `electrons`, optional `max` `{p, n, e}`, optional `nucleusOnly: true` (hides the electrons row and the charge, for lessons before ions). Shows Z, A, charge and the nuclide notation for Z ≤ 20.

Progress, quiz answers and theme are kept in `localStorage` when available; the page works without it.

## Tests

`tests/engine.spec.mjs` runs on `tests/.build/demo` (fixture in `tests/fixtures/demo`, always built) and on every `dist/*/index.html`, at 1280×850 and 390×844: every step and quiz renders, no console error, no horizontal overflow, no overlapping labels, keyboard, theme, reduced motion.
