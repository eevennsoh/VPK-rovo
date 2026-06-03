# Severity Levels

| Sev | Definition | Examples | Notify |
| --- | --- | --- | --- |
| SEV-1 | Critical: full outage, data loss, or security breach. | Site down, customer data exposed. | Page on-call + incident commander + leadership now. |
| SEV-2 | Major: core feature broken for many users, no workaround. | Checkout failing, auth degraded. | Page on-call + IC; status page update. |
| SEV-3 | Minor: degraded or broken for some users, workaround exists. | One region slow, non-critical feature down. | On-call during business hours. |
| SEV-4 | Low: cosmetic or very limited impact. | Typo in UI, minor log noise. | Normal backlog. |

## Roles During an Incident

- **Incident Commander (IC):** owns coordination and decisions, not the fix.
- **Comms lead:** owns status page and stakeholder updates.
- **Ops/Subject expert:** drives the technical mitigation.
- **Scribe:** captures the timeline in real time.

## Key Timestamps To Capture

- Change/trigger time (deploy, config, traffic event).
- Detection time (alert fired or human noticed).
- Acknowledge / escalation time.
- Mitigation time (impact reduced).
- Resolution time (fully restored).

TTD = detection − trigger. TTR = resolution − detection.
