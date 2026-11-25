# Style guide

Hard limits are also enforced by `scripts/validate.mjs`; the rest is checked by reviewers.

## Lesson

- One learning goal per lesson, 5–8 minutes (or the input's `style.lessonMinutes`).
- 4–8 steps (or `style.stepsPerLesson`). Exactly 3 quiz questions.
- Order of notions: never use a notion before it is introduced, in this lesson or in a prerequisite lesson of the plan.
- Go from concrete (an observation, a mental image) to the named notion, then to the formal notation.

## Step

| Field | Rule |
|---|---|
| `tag` | `concept` new idea · `observe` look at the diagram · `calculate` worked computation · `try` the learner acts (widget or activity) · `caution` frequent mistake · `imagine` thought experiment |
| `title` | 3–7 words, ≤ 60 characters |
| `text` | **≤ 90 words**, one new idea. Math inline as `$…$` |
| `callout` | Optional, at most one: `analogy`, `pitfall`, `order-of-magnitude`, `tip`. Must add something the text does not say |
| `sceneDescription` | 1–2 sentences: what appears, moves or is highlighted. Reuse the same objects from step to step |
| `notationLine` | Index of the notation line this step is about, or `null` |
| `counters` | Quantities that matter at this step (`key` stable across steps, `label`, `value`, `unit`). Set `changed: true` on the ones that changed |
| `widget` | Only when manipulating teaches better than reading |
| `sourceIds` | Ids from `lesson.sources` backing every number or fact in the step |

## Notation panel

1–7 LaTeX lines, in the referential's official notation. Examples: nuclide `{}^{A}_{Z}\mathrm{X}`, units upright `\mathrm{kg}`, a thin space between number and unit `1{,}67 \times 10^{-27}\,\mathrm{kg}`.

## Quiz

- 3 questions, 3–4 options, **exactly one** correct; every distractor is false in all readings, not just "less good".
- Distractors come from the plan's `misconceptions`.
- `explanation`: why the answer is right **and** why the main trap is tempting.
- Only test what the lesson taught. No giveaway (correct option always longest, grammatical clue, etc.).

## Sources

- Every number (constant, order of magnitude, date) comes from a source fetched in this run, listed in `lesson.sources` with `accessed` date.
- Preferred: official bodies and reference databases (e.g. NIST/CODATA for constants, IUPAC, the official syllabus text). Wikipedia is not a primary source for numbers.
- Round only as the source allows, and say "about" / "environ" when rounding.

## Typography by language

### French (`fr`)
- Non-breaking space before `; : ! ?` (U+202F narrow no-break space, or U+00A0) and inside `« »` (U+00A0).
- Guillemets « … », never `"…"`.
- Decimal comma: `0,1 nm`; in LaTeX write `1{,}6`.
- Space between number and unit, non-breaking: `10⁻¹⁰ m` → `$10^{-10}\,\mathrm{m}$`.
- Capitals keep their accents (`À`, `É`).

### English (`en`)
- Decimal point, `"…"` quotes, thin space between number and unit.

Add a section here before forging a course in another language.
