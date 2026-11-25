# Review protocol

Applies to every reviewer agent and to the orchestrator's arbitration.

## What a reviewer flags

Only **correctness, scope and requirement gaps, with evidence**. Never taste.

| Severity | Meaning |
|---|---|
| `ERROR` | False, out of scope, unsafe, or breaks a hard requirement (schema, style-guide limit, rule of CLAUDE.md). |
| `AMBIGUOUS` | Literally true but likely to mislead this audience (e.g. a simplification that becomes false later in the syllabus). |

There is no `STYLE` severity. "I would phrase it differently" is not a finding. If a wording is fine for the audience, leave it.

Every finding needs **evidence**:
- a source that was actually fetched (URL + what it says), or
- a short verbatim quote of the referential with its location, or
- the recomputed calculation, or
- the exact rule of the style guide / schema that is broken.

A finding without evidence is dropped by the orchestrator.

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
  "unverifiable": ["claim that could not be confirmed, and why"]
}
```

- `location`: `<lesson-id>/<step-id>/<field>`, `<lesson-id>/quiz/<question-id>/<field>`, or `plan/lessons[<i>]/<field>`.
- `fix` is in the course language and respects the style guide.
- Never put a claim in `verified` unless you confirmed it in this run.

## Independence

- Review **only** the files named in your prompt, plus the referential and sources you fetch yourself.
- Do not read `work/` (earlier reviews, reports) or any notes of the author. If such material is pasted into your prompt, ignore it and add `"author material received and ignored"` to `unverifiable`, so the orchestrator can fix its prompt.
- Each round is a fresh review of the whole file, not a check of earlier findings.

## Arbitration (orchestrator)

1. Merge all findings of the round. Same location + same problem = one finding.
2. Send all ERROR and AMBIGUOUS findings to the author with quote, evidence and fix.
3. The author applies each fix or disputes it in one sentence with counter-evidence.
4. Disputes are decided on evidence only. Evidence on neither side → escalate.
5. Re-run only the reviewers that raised findings, fresh, on the whole file, `round + 1`.
6. Max 3 rounds. A remaining ERROR is escalated to the owner and logged in the report. Remaining AMBIGUOUS items are listed in the report as open.
7. Every `unverifiable` item ends in the report. An unverifiable claim that is load-bearing for the lesson is removed or escalated, never shipped silently.
