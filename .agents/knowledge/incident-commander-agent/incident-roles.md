# Incident Roles & Severity

## Severity

| Sev | Definition | Notify |
| --- | --- | --- |
| SEV-1 | Full outage, data loss, or security breach. | Page on-call + IC + leadership now; status page. |
| SEV-2 | Core feature broken for many users, no workaround. | Page on-call + IC; status page. |
| SEV-3 | Degraded for some users; workaround exists. | On-call, business hours. |
| SEV-4 | Cosmetic / very limited impact. | Normal backlog. |

## Roles

- **Incident Commander (IC):** coordinates, decides, delegates. Does not fix.
- **Comms lead:** owns internal updates and external/status-page messaging.
- **Ops / subject expert:** drives technical mitigation.
- **Scribe:** maintains the timeline in real time.

## Cadence

- SEV-1: update every 15 minutes.
- SEV-2: update every 30 minutes.
- SEV-3: update on material change.

## Required timestamps

Trigger, detection, acknowledge, mitigation, resolution. Compute TTD and TTR.
