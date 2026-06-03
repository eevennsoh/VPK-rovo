---
name: jira-issue-triage
description: This skill should be used when the user asks to "triage Jira issues",
  "triage the backlog", "label these tickets", "set priority on this issue",
  "find duplicate issues", "route this bug", "clean up the backlog",
  "what should we work on next", "groom the backlog", or pastes a Jira issue,
  bug report, or support escalation that needs classification, prioritization,
  routing, or duplicate detection.
---

# Jira Issue Triage

> Turn raw, unsorted issues into a clean, prioritized, routable backlog. Classify
> work type, set priority from impact and urgency, detect duplicates, and assign
> to the right team — every issue handled the same way, every time.

## Quick Start

| Input | Action |
| --- | --- |
| One issue (title + body) | Classify → prioritize → detect duplicates → recommend assignee |
| A list of issues | Batch triage, group duplicates, output a ranked table |
| "Groom the backlog" | Surface stale, unestimated, and unassigned issues with next actions |

```
/jira-issue-triage "Login page 500s after SSO redirect for ~5% of users"
```

## Why This Matters

Untriaged backlogs are the #1 source of dropped customer problems: critical bugs
sit unlabeled, duplicates fragment effort, and the wrong team owns the work.
Consistent triage shortens time-to-first-response and makes prioritization
defensible.

## Triage Workflow

1. **Classify the work type** — `Bug`, `Story`, `Task`, `Incident`,
   `Spike`, or `Support`. Use the body, not just the title.
2. **Score impact and urgency** — combine them into a priority using the matrix
   in `references/priority-matrix.md`. Always state the reasoning.
3. **Detect duplicates** — compare against provided/known issues by symptom,
   component, and root cause. Link, do not re-file, true duplicates.
4. **Route** — map component + work type to an owning team (see
   `references/component-routing.md`).
5. **Fill the gaps** — flag missing repro steps, environment, version, or
   acceptance criteria. Draft the clarifying comment.
6. **Emit a structured result** — see Output Format.

## Priority Matrix (summary)

| Impact \ Urgency | Low | Medium | High |
| --- | --- | --- | --- |
| **Low** | P4 | P4 | P3 |
| **Medium** | P3 | P3 | P2 |
| **High** | P2 | P2 | P1 |
| **Critical (data loss / outage / security)** | P1 | P1 | P0 |

P0 = page on-call now. See `references/priority-matrix.md` for full definitions.

## Duplicate Detection Heuristics

- Same error signature or stack frame → likely duplicate.
- Same component + same user-facing symptom within a release window → review.
- Different root cause but same symptom → **related**, not duplicate. Link only.

## Output Format

Always return this block so the result is machine-readable and reviewable:

```yaml
triage:
  summary: One-line restatement of the problem
  type: Bug | Story | Task | Incident | Spike | Support
  priority: P0 | P1 | P2 | P3 | P4
  priority_reason: Impact + urgency justification
  component: best-guess component
  suggested_team: owning team
  labels: [list, of, labels]
  duplicate_of: ISSUE-KEY or null
  related: [ISSUE-KEY, ...]
  missing_info: [repro steps, version, ...]
  draft_comment: Clarifying question(s) to post on the issue, or null
  recommended_next_action: e.g. "Assign to Platform, request HAR file"
```

## Boundaries

- Do not close, delete, or reassign issues without explicit confirmation.
- Do not invent issue keys; only reference keys provided in context.
- When impact is uncertain, choose the higher priority and say why.

## References

- `references/priority-matrix.md` — full impact/urgency definitions and SLAs.
- `references/component-routing.md` — component → owning team map and labels.
