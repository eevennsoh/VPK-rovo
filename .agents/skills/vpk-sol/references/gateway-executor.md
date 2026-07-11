# Gateway Executor Reference

Use this exact routing contract for `/vpk-sol` workers. It is intentionally
self-contained and does not rely on the user's aliases, current provider,
global config, or planner login state.

## Preflight

Confirm the CLI and Gateway model before creating workers:

```bash
codex --version
curl -fsS http://localhost:29576/openai/v1/models \
  | grep -F 'gpt-5.5-2026-04-23'
```

Failure is a blocker. Do not substitute a model from the planner's OpenAI
provider, OAuth login, or API-key login.

## Canonical first run

Create one directory per worker. Never copy anything from `~/.codex` into it.

```bash
worker_root="$PWD/output/sol-codex/worker-1"
mkdir -p "$worker_root/home"

env -u OPENAI_API_KEY -u CODEX_API_KEY \
  CODEX_HOME="$worker_root/home" \
  codex exec --ignore-user-config -C "$PWD" \
  -m gpt-5.5-2026-04-23 \
  -c 'model_provider="openai-gw"' \
  -c 'model_reasoning_effort="xhigh"' \
  -c 'approval_policy="never"' \
  -c 'model_providers.openai-gw.name="AI Gateway (Proximity)"' \
  -c 'model_providers.openai-gw.base_url="http://localhost:29576/openai/v1"' \
  -c 'model_providers.openai-gw.wire_api="responses"' \
  -c 'model_providers.openai-gw.requires_openai_auth=false' \
  -c 'sandbox_workspace_write.network_access=true' \
  --sandbox workspace-write \
  --output-last-message "$worker_root/report.md" \
  - < "$worker_root/brief.md"
```

Why each isolation layer exists:

- `CODEX_HOME` keeps worker sessions and state away from the planner's Codex
  home, whether the planner is running in Desktop or CLI.
- `--ignore-user-config` prevents provider, model, plugin, or approval drift.
- Unsetting API-key variables prevents ambient credentials from changing the
  request path.
- `requires_openai_auth=false` prevents Codex from requiring or attaching the
  planner login. Proximity authenticates upstream itself.
- The exact model and xhigh effort avoid alias or default drift.
- Workspace-write contains implementation to the current worktree.

Read only the report file for synthesis. Do not stream raw worker events into
the Sol context.

## Resume a single worker

Reuse the same `CODEX_HOME` and repeat every provider, model, effort, and
sandbox override:

```bash
worker_root="$PWD/output/sol-codex/worker-1"

env -u OPENAI_API_KEY -u CODEX_API_KEY \
  CODEX_HOME="$worker_root/home" \
  codex exec --ignore-user-config \
  -m gpt-5.5-2026-04-23 \
  -c 'model_provider="openai-gw"' \
  -c 'model_reasoning_effort="xhigh"' \
  -c 'approval_policy="never"' \
  -c 'model_providers.openai-gw.name="AI Gateway (Proximity)"' \
  -c 'model_providers.openai-gw.base_url="http://localhost:29576/openai/v1"' \
  -c 'model_providers.openai-gw.wire_api="responses"' \
  -c 'model_providers.openai-gw.requires_openai_auth=false' \
  -c 'sandbox_workspace_write.network_access=true' \
  --sandbox workspace-write \
  --output-last-message "$worker_root/report.md" \
  resume --last - < "$worker_root/followup.md"
```

Exec-level flags must precede `resume`. Use `resume --last` only when this is
the sole active/recent worker in its isolated home. Never resume during
fan-out.

## Failure handling

- Missing CLI, unreachable Gateway, unavailable exact model, authentication
  prompts, or absent reports are infrastructure blockers.
- Do not retry through `openai-no-ws`, a default provider, or the planner's
  `CODEX_HOME`.
- A worker that searched its scope and reported no finding succeeded; do not
  re-dispatch it as an infrastructure failure.
