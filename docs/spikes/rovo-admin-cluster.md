# Rovo administration cluster

## Supported administrator decisions

The cluster stays deliberately narrow: it connects the existing Rovo settings view with focused MCP connectivity and Rovo insights views.

- Settings: decide whether the local Administration prototype should show Rovo Chat and whether simulated AI/Rovo feature toggles are on for review. These controls are browser-local and do not alter organization configuration.
- MCP connectivity: decide whether Rovo has enough simulated MCP source health to support work graph, knowledge, and ownership lookups. The view shows connector status, tool availability, and follow-up decisions; it does not store credentials or test real endpoints.
- Usage insights: decide where enablement, quality review, or rollout pauses should be considered from deterministic local usage examples. The view labels values as fixture data and makes no telemetry claims.

## Fixture model

Both promoted views use typed local fixtures with the same state names.

- `configured`: ready sources, complete insight examples, and passing checks.
- `empty`: first-run state with no configured source or usage rows.
- `loading`: deterministic skeleton state; no request is made.
- `degraded`: partial data with warning or danger statuses plus follow-up decisions.

The fixture selector is visible in each promoted view so reviewers can inspect every state without backend dependencies.

## Explicit deferrals

- Rovo access and Agents remain placeholders.
- No access-policy controls are introduced.
- No real organization APIs, telemetry pipelines, MCP health checks, credentials, backend routes, deployment behavior, or tests are added.
