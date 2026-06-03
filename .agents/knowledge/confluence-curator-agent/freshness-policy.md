# Documentation Freshness Policy

## Review cadence by page type

| Page type | Review every | Owner required |
| --- | --- | --- |
| Runbook / on-call | 90 days | Yes |
| How-to / guide | 180 days | Yes |
| Architecture / decision record | On change | Yes |
| FAQ | 180 days | Yes |
| Meeting notes / temporary | Never (archive after 1 year) | No |

## Staleness flags

- Past its review-by date.
- No owner / owner has left the team.
- Not updated since a relevant product or process change.
- Links to deprecated tools, repos, or pages.
- No labels (hurts findability).
- Orphan page: no inbound links.

## Actions (recommend, never auto-delete)

- `update` — content is right space, needs refresh; assign to owner.
- `merge` — overlaps a canonical page; redirect and archive the rest.
- `archive` — obsolete; archive with a pointer to the replacement.
- `assign-owner` — content is fine but ownerless.
- `relabel` — add labels / fix title for findability.

Every finding must include: page, problem, recommended action, suggested owner.
