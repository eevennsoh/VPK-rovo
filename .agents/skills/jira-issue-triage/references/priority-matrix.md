# Priority Matrix & SLAs

Priority is a function of **impact** (how bad) and **urgency** (how soon).
Score each independently, then read the priority off the matrix.

## Impact

| Level | Definition |
| --- | --- |
| Critical | Data loss, security breach, full outage, or legal/compliance exposure. |
| High | Core workflow broken for many users; no reasonable workaround. |
| Medium | Feature degraded or broken for some users; workaround exists. |
| Low | Cosmetic, minor, or affects very few users. |

## Urgency

| Level | Definition |
| --- | --- |
| High | Actively harming users/revenue right now, or hard external deadline. |
| Medium | Should be handled this sprint. |
| Low | Can wait; schedule into a future sprint. |

## Matrix

| Impact \ Urgency | Low | Medium | High |
| --- | --- | --- | --- |
| Low | P4 | P4 | P3 |
| Medium | P3 | P3 | P2 |
| High | P2 | P2 | P1 |
| Critical | P1 | P1 | P0 |

## Response & Resolution Targets (defaults — tune per team)

| Priority | First response | Target resolution |
| --- | --- | --- |
| P0 | 15 min, page on-call | 4 hours |
| P1 | 1 hour | 1 business day |
| P2 | 1 business day | 1 sprint |
| P3 | 3 business days | 2 sprints |
| P4 | Best effort | Backlog |

## Escalation Rules

- P0/P1 must be linked to an incident if customer-facing.
- If impact is ambiguous between two levels, choose the higher and note the
  assumption in `priority_reason`.
