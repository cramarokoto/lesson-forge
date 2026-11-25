# Report template

`work/<slug>/report.md`, written and kept up to date by the orchestrator. English, except quotes from the course.

```markdown
# <course title> — report

Input: inputs/<file>.yaml · Referential: <citation> (<url>, fetched <date>)

## <chapter id> — <chapter title>
Plan: approved by the owner on <date> | NOT reviewed by the owner (plan=auto)

### <lesson id> — <lesson title>
Status: shipped | escalated | not written
Rounds: <n>

| Round | Reviewer | Finding | Severity | Outcome |
|---|---|---|---|---|
| 1 | fact-checker | fc-1: <one line> | ERROR | fixed: <one line> |

Unverified: <claim> — <why>
Open AMBIGUOUS: <finding id> — <one line>
Sources: <id> <url> (<accessed>)

## Escalated
- <lesson>/<location>: <problem>, <what was tried>, <decision needed from the owner>

## QA
check.sh: pass | fail (<summary>) · Screenshots: work/<slug>/captures/
```
