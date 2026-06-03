# Component → Team Routing

Map the affected component and work type to an owning team. This is a starter
map; replace component names and teams with your project's real values.

| Component | Owning team | Default labels |
| --- | --- | --- |
| auth, sso, login | Platform / Identity | `area/auth` |
| billing, payments, invoices | Payments | `area/billing` |
| api, gateway, webhooks | Platform / API | `area/api` |
| web-ui, frontend, design-system | Web | `area/frontend` |
| mobile, ios, android | Mobile | `area/mobile` |
| search, indexing | Search | `area/search` |
| notifications, email | Messaging | `area/notifications` |
| data, etl, reporting, analytics | Data | `area/data` |
| infra, ci, deploy, kubernetes | DevOps / SRE | `area/infra` |
| docs, help-center | Content | `area/docs` |

## Routing Rules

- `Incident` + customer-facing → also notify the on-call channel for that team.
- `Support` items get `triage/support` and stay with the support queue until a
  product bug is confirmed, then convert to `Bug` and route by component.
- If no component matches, label `needs-triage` and route to the team lead
  rotation rather than guessing.
