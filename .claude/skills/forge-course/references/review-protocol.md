# Review protocol

Applies to every reviewer agent and to the orchestrator's arbitration.

## What a reviewer flags

Only **correctness, scope and requirement gaps, with evidence**. Never taste.

| Severity | Meaning |
|---|---|
| `ERROR` | False, out of scope, unsafe, or breaks a hard requirement (schema, style-guide limit, rule of CLAUDE.md). |
| `AMBIGUOUS` | Literally true but likely to mislead this audience (e.g. a simplification that becomes false later in the syllabus). |

**By round:** round 1 reports ERROR and AMBIGUOUS. Rounds 2 and 3 report **ERROR only**: fresh reviewers always find new nuances, and chasing them never converges.

There is no `STYLE` severity. "I would phrase it differently" is not a finding. If a wording is fine for the audience, leave it.

Every finding needs **evidence**:
- a source that was actually fetched (URL + what it says), or
- a short verbatim quote of the referential with its location, or
- the recomputed calculation, or
- the exact rule of the style guide / schema that is broken.

A finding without evidence is dropped by the orchestrator.

## Scope of each reviewer

Stay in your lane; another reviewer covers the rest. Duplicate findings cost a full review each.

| Reviewer | Checks | Does not check |
|---|---|---|
| fact-checker | facts, numbers, units, calculations, sources, `furtherReading` links load and match | pedagogy, scope, wording |
| syllabus-checker | scope, level, order of notions vs the referential | facts, numbers, quiz mechanics |
| pedagogy-reviewer | one idea per step, progression, text–diagram match, words used before defined | facts, numbers, scope |
| quiz-reviewer | the quiz only: one correct answer, distractors, explanations | the steps |
| safety-reviewer | activities, safety statements, age-appropriateness, `furtherReading` suitability (ads, accounts, age) | everything else |

Checks done by `scripts/validate.mjs` (word counts, typography, non-breaking spaces before units, notion order in the plan, sentence count of `sceneDescription`) are not reviewer findings: do not spend tokens on them.

## Output

Return **one JSON object and nothing else**, matching `review` in `schema/course.schema.json`:

```json
{
  "reviewer": "fact-checker",
  "target": "courses/<slug>/<chapter>/<lesson>.json",
  "round": 1,
  "findings": [
    {
      "id": "fc-1",
      "severity": "ERROR",
      "category": "fact",
      "location": "<lesson>/<step-id>/text",
      "quote": "exact text at fault",
      "problem": "what is wrong, in one or two sentences",
      "evidence": "URL + what it says / referential quote + location / calculation",
      "fix": "replacement text, word for word"
    }
  ],
  "verified": ["claim -> source id or URL"],
  "sourcesChecked": [{ "url": "https://…", "accessed": "2026-11-25", "supports": "exact value or claim confirmed" }],
  "unverifiable": ["claim that could not be confirmed, and why"]
}
```

- `location`: `<lesson-id>/<step-id>/<field>`, `<lesson-id>/quiz/<question-id>/<field>`, or `plan/lessons[<i>]/<field>`.
- `fix` is in the course language and respects the style guide.
- Never put a claim in `verified` unless you confirmed it in this run, or it is in `work/<slug>/verified-sources.json` with the same `supports`, confirmed 30 days ago or less (say « cache, <date> »).
- `sourcesChecked`: every page you fetched and confirmed, with the exact value. The orchestrator merges them into the cache.

## Independence

- Review **only** the files named in your prompt, plus the referential and sources you fetch yourself.
- Do not read `work/` (earlier reviews, reports) or any notes of the author. If such material is pasted into your prompt, ignore it and add `"author material received and ignored"` to `unverifiable`, so the orchestrator can fix its prompt.
- Each round is a fresh review of the whole file, not a check of earlier findings.

## Arbitration (orchestrator)

1. Merge all findings of the round. Same location + same problem = one finding.
2. Send all ERROR and AMBIGUOUS findings to the author with quote, evidence and the **exact replacement text**. Resolve conflicts between reviewers first (e.g. one fix reintroducing what another ruled out) and say which rule wins.
3. The author applies each fix **word for word** or disputes it in one sentence with counter-evidence. Never paraphrase a fix: a reworded fix is new, unreviewed text.
4. Disputes are decided on evidence only. Evidence on neither side → escalate.
5. Re-run only the reviewers that raised findings, fresh, on the whole file, `round + 1` (ERROR only). Also re-run any reviewer whose lane the fixes touched.
6. Max 3 rounds. A remaining ERROR is escalated to the owner and logged in the report. Remaining AMBIGUOUS items are listed in the report as open.
7. Every `unverifiable` item ends in the report. An unverifiable claim that is load-bearing for the lesson is removed or escalated, never shipped silently.
