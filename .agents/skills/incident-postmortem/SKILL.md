---
name: incident-postmortem
description: This skill should be used when the user asks to "write a postmortem",
  "incident review", "root cause analysis", "RCA", "blameless postmortem",
  "PIR", "what happened in the incident", "build the incident timeline",
  "draft the incident report", or pastes an incident channel transcript,
  alert history, or timeline that needs to become a structured, blameless
  postmortem with action items.
---

# Incident Postmortem

> Turn the chaos of an incident into a calm, blameless, actionable record.
> Reconstruct the timeline, find contributing causes (not a single scapegoat),
> quantify impact, and produce trackable action items.

## Quick Start

| Input | Action |
| --- | --- |
| Incident chat transcript | Extract timeline + decisions → draft postmortem |
| Alert/deploy history | Build timeline with detection & recovery points |
| "RCA for INC-123" | Full blameless postmortem with action items |

```
/incident-postmortem "Paste #inc-123 channel log + the deploy timeline"
```

## Principles

- **Blameless.** Describe what the system allowed to happen, not who "messed up."
  Replace names with roles where it adds blame, keep them where it adds clarity.
- **Multiple contributing causes**, not one root cause. Most incidents are a
  chain of conditions.
- **Action items must be specific, owned, and trackable** — each becomes a Jira
  issue.

## Workflow

1. **Severity** — classify using `references/severity-levels.md`.
2. **Timeline** — reconstruct in UTC: change → detection → escalation →
   mitigation → resolution. Mark Time-To-Detect (TTD) and Time-To-Recover (TTR).
3. **Impact** — users affected, duration, revenue/SLA, data integrity.
4. **Contributing causes** — technical, process, and detection gaps.
5. **What went well / what was hard** — keep the learning balanced.
6. **Action items** — preventive, detective, and process. Owner + priority each.

## Output Format

```markdown
# Postmortem: <title> (<INC-key>)

**Severity:** SEV-n  **Status:** Resolved  **Authors:** ...
**Detected:** <UTC>  **Resolved:** <UTC>  **TTD:** ...  **TTR:** ...

## Summary
2-4 sentences a VP could read.

## Impact
- Users / scope / duration / SLA / revenue / data.

## Timeline (UTC)
| Time | Event |
| --- | --- |
| ... | ... |

## Contributing Causes
1. ...

## What Went Well
- ...

## What Made It Harder
- ...

## Action Items
| Action | Type (prevent/detect/process) | Owner | Priority | Issue |
| --- | --- | --- | --- | --- |
| ... | ... | ... | P? | NEW |
```

## Boundaries

- Do not assign individual blame or speculate beyond evidence in context.
- Mark any inference as "hypothesis" until confirmed.
- Every action item needs an owner placeholder and a priority; never leave both
  blank.

## References

- `references/severity-levels.md` — SEV definitions and notification rules.
