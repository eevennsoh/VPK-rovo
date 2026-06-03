---
name: sprint-health-report
description: This skill should be used when the user asks to "generate a sprint
  report", "how is the sprint going", "sprint health", "are we on track",
  "burndown summary", "velocity report", "what's at risk this sprint",
  "summarize the sprint for stakeholders", "standup summary", or "retro prep".
  It turns raw sprint/board data into an executive-ready health summary with
  risks, scope changes, and recommended actions.
---

# Sprint Health Report

> Answer "are we on track?" in one screen. Summarize progress, flag at-risk
> items, quantify scope creep, and recommend concrete actions — for both the
> daily standup and the stakeholder update.

## Quick Start

| Input | Action |
| --- | --- |
| Sprint issue list + statuses | Compute completion %, risks, scope changes |
| Velocity history | Forecast likely sprint outcome |
| "Standup summary" | Short blockers-first digest |
| "Stakeholder update" | Narrative summary with confidence call |

```
/sprint-health-report "Sprint 42 ends Friday; here is the board export"
```

## What "Healthy" Means

A sprint is healthy when scope is stable, work-in-progress is bounded, blockers
are being cleared, and the burndown trend lands at or before the end date.
Report the signal, not just the numbers.

## Metrics To Compute

| Metric | How | Why it matters |
| --- | --- | --- |
| Completion % | done points / committed points | Headline progress |
| Scope change | (added − removed) points vs. commit | Detects scope creep |
| WIP | issues `In Progress` per assignee | Detects overload / context-switching |
| Blocked | issues with `blocked`/flag | Throughput risk |
| Stale | no status change > 3 days | Hidden stuck work |
| Forecast | trend vs. days remaining | Will it land? |

## Risk Signals (flag these explicitly)

- Completion % well below elapsed-time % (behind burndown).
- Scope added after day 2 of the sprint.
- One assignee holding most of the remaining points (bus factor / overload).
- High-priority issues still `To Do` with few days left.
- Blocked items with no owner on the blocker.

## Output Format

```yaml
sprint_report:
  sprint: name/number
  window: start → end (days remaining: N)
  headline: One sentence — on track / at risk / off track + confidence
  completion: { committed: X, done: Y, percent: Z }
  scope_change: { added: A, removed: R, net: N }
  at_risk:
    - issue: KEY
      reason: why
      action: recommended next step
  blockers:
    - issue: KEY
      blocked_by: what/who
  recommendations:
    - Concrete, owner-assignable action
  retro_seeds:
    - Observation worth discussing in retro
```

## Two Voices

- **Standup mode**: terse, blockers and today's-critical-path first.
- **Stakeholder mode**: narrative, leads with the on-track/at-risk call and the
  decision being asked for (if any). No internal jargon.

## Boundaries

- Never fabricate metrics; if data is missing, list it under `missing_data`.
- Do not assign blame; frame risks as system/process observations.
