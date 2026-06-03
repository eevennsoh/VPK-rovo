# Triage Taxonomy

Project-specific classification the agent uses. Edit these to match your project.

## Work Types

| Type | Use when |
| --- | --- |
| Bug | Existing behavior is wrong. |
| Story | New user-facing capability. |
| Task | Internal/engineering work with no direct user story. |
| Incident | Active or recent production impact. |
| Spike | Time-boxed investigation/research. |
| Support | Customer request; may convert to Bug/Story after confirmation. |

## Priority Definitions (mirror of the skill matrix)

- P0 — page on-call now (outage, data loss, security).
- P1 — high impact, fix within a day.
- P2 — handle this sprint.
- P3 — schedule soon.
- P4 — backlog / best effort.

## Standard Labels

`needs-triage`, `area/auth`, `area/billing`, `area/api`, `area/frontend`,
`area/mobile`, `area/search`, `area/data`, `area/infra`, `area/docs`,
`triage/support`, `customer-reported`, `regression`, `good-first-issue`.

## Component → Team (keep in sync with the project)

| Component | Team |
| --- | --- |
| auth / sso | Platform / Identity |
| billing / payments | Payments |
| api / gateway | Platform / API |
| web-ui / frontend | Web |
| mobile | Mobile |
| infra / ci / deploy | DevOps / SRE |
| docs | Content |
