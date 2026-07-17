---
name: vpk-sol
description: "Manual-command-only GPT-5.6 Sol planner and Proximity worker orchestrator. Activate only when the first non-whitespace token in the user's current message is the exact slash command `/vpk-sol`. Never activate from a skill-name mention, Markdown link, file path, stack trace, pasted or quoted text, prior-turn context, or an AI agent's inference or suggestion."
purpose: Keep high-judgment planning in the current GPT-5.6 Sol Codex session while routing execution to GPT-5.5 xhigh through Proximity without exposing or changing the planner's auth state.
owner: VPK
category: agent-operations
inputs: A user-authored message whose first non-whitespace token is `/vpk-sol`, optionally followed by a task.
outputs: Frozen worker briefs, isolated GPT-5.5 worker reports, reviewed implementation diffs, orchestrator-owned verification, and one synthesized result.
required_tools: Shell access to codex and curl, a running Proximity endpoint on localhost:29576, and workspace-write access to the current worktree.
validation_command: node scripts/validate-skills.js --target .agents/skills/vpk-sol
generated_artifacts: Briefs, reports, and isolated worker homes live under gitignored output/sol-codex/.
common_failure_modes: Auto-activating from a mention or link instead of a manual slash command, running from a non-Sol planner session, inheriting the planner's CODEX_HOME or auth environment, using a global provider-switch helper, falling back to the planner provider when Proximity fails, overlapping parallel write scopes, resuming the wrong worker, trusting a worker's self-verification, or letting Sol take over implementation after repeated worker failures.
---

# VPK Sol — Personal Planner, Gateway Workers

Use the current GPT-5.6 Sol Codex session for planning, review, and synthesis.
That planner can be in Codex Desktop or the Codex CLI, and Desktop can be
logged in with OAuth or API-key auth. The routing rule is surface-agnostic:
Sol plans, reviews, and synthesizes; implementation and token-heavy exploration
go to isolated GPT-5.5 xhigh `codex exec` workers whose requests go only to
Proximity's localhost AI Gateway endpoint.

This is the Codex counterpart to the proven `/vpk-fable` split. It is an
orchestrator workflow only; it has no advisor mode or Claude-worker fallback.

## Manual invocation gate

Use this skill only when the first non-whitespace token in the user's current
message is exactly `/vpk-sol`. Treat every other occurrence as inert text,
including skill mentions, Markdown links, file paths, stack traces, pasted or
quoted prompts, earlier messages, and agent-authored suggestions.

If that manual command is absent, do not run preflight checks, read the worker
references, create artifacts, or dispatch workers. Continue with the user's
task without this skill.

## Invocation

| Invocation | Behavior |
| --- | --- |
| `/vpk-sol <task>` | Plan the task, delegate execution, verify the result, and synthesize |
| `/vpk-sol` | Explain the account split and ask for a task |

## Hard preconditions

Before planning:

1. Confirm the current main session reports model `gpt-5.6-sol`. If it does
   not, stop and ask the user to switch the planner session to Sol.
2. Confirm `codex --version` succeeds.
3. Confirm Proximity is reachable and its unauthenticated model catalog
   contains `gpt-5.5-2026-04-23`.

If any worker precondition fails, report the blocker. Never fall back to the
planner's OpenAI provider, OAuth login, or API-key login for implementation;
that defeats the budget and account boundary this skill exists to preserve.

## Account boundary

- **Planner:** the current Codex session, Desktop or CLI, running
  `gpt-5.6-sol` with the user's intended planner auth.
- **Worker:** a `codex exec` process with its own ignored `CODEX_HOME`, no
  copied `auth.json`, and explicit Proximity provider settings.
- **Upstream credential:** owned by Proximity. Do not put it in briefs,
  environment overrides, worker homes, reports, or repository files.

Do not invoke `vpk-codex`, `vpk-codex-gw`, `codex-gw`,
`codex-use-openai`, or `codex-use-gw` from this workflow. The canonical worker
command is self-contained so an alias or global config change cannot redirect
billing. Read [references/gateway-executor.md](references/gateway-executor.md)
before dispatching any worker.

## Orchestration procedure

1. **Ground.** Read only enough primary repo context to identify the real
   owner, constraints, success criteria, and proof commands. Sol should judge
   the plan, not consume its scarce context on mechanical coverage.
2. **Freeze the plan.** Choose the worker shape and write self-contained
   briefs before dispatch. Each brief names its goal, exact scope,
   constraints, non-goals, proof, and report format.
3. **Delegate.** Use one persistent worker for implementation. Use 2–5
   parallel workers only when every brief is substantial and independent.
4. **Collect all reports.** Never synthesize from a partial fan-out. Missing
   or empty report files are infrastructure failures; a supported "not found"
   result is a valid finding.
5. **Review as Sol.** Read the reports, inspect the actual diff, and run the
   final proof commands yourself. A worker never self-certifies completion.
6. **Correct once or twice.** Send focused follow-ups to the same single
   implementation worker so it retains context. After two unsuccessful
   correction cycles, stop and report the blocker; Sol does not silently take
   over implementation.
7. **Synthesize.** Return the outcome, proof, and any genuine blockers. Keep
   raw worker material in worker contexts and report files.

Full shape, brief, and report rules:
[references/orchestration-pattern.md](references/orchestration-pattern.md).

## Worker shapes

### Single implementation worker

Use one worker home for the full implementation loop. Resume it only when no
other worker for this worktree is active. Inspect the diff after every run,
then write a narrow follow-up for anything incomplete.

### Parallel coverage workers

Fan out only for independent research, audits, or truly disjoint write scopes.
Give each process a unique worker directory and `CODEX_HOME`. Never use
`resume --last` during or immediately after fan-out because the selected
session is ambiguous.

## Boundaries

- Sol owns decisions, worker briefs, review, final proof, and synthesis.
- Workers own repo mutation and token-heavy exploration.
- Worker homes and reports stay under `output/sol-codex/`.
- Workspace sandboxing is the default. Do not bypass approvals or the sandbox.
- Never copy, link, or read the planner's `~/.codex/auth.json` into a worker.
- Never change `~/.codex/config.toml` or automation model pins as part of a
  `/vpk-sol` run.
