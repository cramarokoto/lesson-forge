# Style guide

Hard limits are also enforced by `scripts/validate.mjs`; the rest is checked by reviewers.

## Lesson

- One learning goal per lesson, 5–8 minutes (or the input's `style.lessonMinutes`).
- 4–8 steps (or `style.stepsPerLesson`). Exactly 3 quiz questions.
- Order of notions: never use a notion before it is introduced, in this lesson or in a prerequisite lesson of the plan.
- Go from concrete (an observation, a mental image) to the named notion, then to the formal notation.

## Message first (applies to every step)

1. **Takeaway first.** Write `takeaway` before anything else: the one sentence a learner must remember, in plain words, ≤ 160 characters. If you cannot write it, the step has no point: merge or cut it.
2. **Dual coding.** The diagram must show the takeaway on its own, by what it *draws*, not by what it labels: size, length, count, position, direction, change from the previous step. A student who reads no text should still guess the point.
3. **Concrete, then named, then formal.** Start from what the learner can picture; name the notion once it is felt; write the formula last.
4. **Teach-back test.** Read the step as a 15-year-old, then say its point in your own words. If that sentence differs from `takeaway`, rewrite the text, not the takeaway.
5. **No unexplained word.** Any term not in the plan's prior knowledge or earlier steps is either explained in the same sentence or removed.
6. **One thing moves.** Between two steps, the diagram changes in one way that matches the new idea; everything that does not serve the step fades or disappears.

## Step

| Field | Rule |
|---|---|
| `tag` | `concept` new idea · `observe` look at the diagram · `calculate` worked computation · `try` the learner acts (widget or activity) · `caution` frequent mistake · `imagine` thought experiment |
| `takeaway` | **Required.** One sentence, ≤ 160 characters, shown as « À retenir ». See "Message first" |
| `title` | 3–7 words, ≤ 60 characters |
| `text` | **≤ 90 words**, one new idea. Math inline as `$…$` |
| `callout` | Optional, at most one: `analogy`, `pitfall`, `order-of-magnitude`, `tip`. Must add something the text does not say |
| `sceneDescription` | 1–2 sentences: what appears, moves or is highlighted. The writer drafts it; the stager rewrites it to match exactly what is drawn (it is also the diagram's screen-reader text) |
| `notationLine` | Index of the notation line this step is about, or `null` |
| `counters` | Quantities that matter at this step (`key` stable across steps, `label`, `value`, `unit`). Set `changed: true` on the ones that changed |
| `widget` | Only when manipulating teaches better than reading |
| `sourceIds` | Ids from `lesson.sources` backing every number or fact in the step. Not shown to learners: production sources appear only in the course annex |

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

## Learner resources (`furtherReading`)

Distinct from production sources. Chosen by the resource-curator for **this audience**, following the input's `learnerResources`: course language, free, no account if required, level-appropriate, no aggressive ads, durable providers (public broadcasters, institutions, non-profits) first. At most `maxPerLesson` (default 3). Each has a one-sentence `why` in the course language. A link only after a real fetch showing content that matches the lesson.

## Typography by language

### French (`fr`)
- Non-breaking space before `; : ! ?` (U+202F narrow no-break space, or U+00A0) and inside `« »` (U+00A0).
- Guillemets « … », never `"…"`.
- Decimal comma: `0,1 nm`; in LaTeX write `1{,}6`.
- Space between number and unit, non-breaking (U+00A0), also in counters and scene labels: `10⁻¹⁰ m` → `$10^{-10}\,\mathrm{m}$`.
- Capitals keep their accents (`À`, `É`).

### English (`en`)
- Decimal point, `"…"` quotes, thin space between number and unit.

Add a section here before forging a course in another language.
