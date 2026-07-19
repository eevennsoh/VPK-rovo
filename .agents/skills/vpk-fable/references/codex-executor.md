# Codex Executor Reference (GPT-5.6 Sol via Codex CLI)

The non-Claude executor backend for `/vpk-fable orchestrate`, adapted from
steipete's `codex-first` skill (`agent-scripts/skills/codex-first/SKILL.md`).
Workers are **CLI processes**, not subagents: each run is `codex exec` in a
background Bash call, pinned to GPT-5.6 Sol at medium reasoning effort. Flags below
are verified against **codex-cli 0.143.0** — re-run `codex exec --help` and
update this doc if a newer CLI drifts (notably: `--yolo` does **not** exist in
0.143.0; only the long form does).

## Canonical invocation

Write the brief to a file first (never inline a long prompt into the shell
command), then:

```bash
mkdir -p output/fable-codex
codex exec --dangerously-bypass-approvals-and-sandbox -C "$PWD" \
  -m gpt-5.6-sol -c model_reasoning_effort="medium" \
  --output-last-message output/fable-codex/worker-<n>.md \
  - < output/fable-codex/brief-<n>.md
```

- Run via Bash with `run_in_background: true`; the harness notifies on exit.
  Fan-out = several of these in one message, one per brief.
- `-` reads the brief from stdin. `-C "$PWD"` pins the working root to this
  worktree.
- Read **only** the `--output-last-message` file afterwards. Never parse the
  stdout/JSONL stream — that is raw worker material and belongs outside the
  orchestrator's context.
- Model and effort are pinned explicitly so the skill's behavior does not
  silently change when `~/.codex/config.toml` changes.
- Artifacts (briefs + worker reports) live under gitignored `output/fable-codex/`.
- Bypass mode means codex runs unsandboxed with no approval prompts — the
  brief's scope boundaries are the only guardrail, so write them explicitly.

## Brief contents (freeze before dispatch)

Every brief carries, in order:

1. **Goal** — one paragraph, no ambiguity.
2. **Exact repo/paths** — files and directories in scope.
3. **Constraints** — repo rules that apply (tabs, `@/` imports, token classes,
   pnpm; name the specific ones relevant to the brief).
4. **Non-goals** — what it must not touch or expand into.
5. **Proof expected** — the exact command that must pass (e.g.
   `pnpm run lint && pnpm run typecheck`, or a targeted `node --test`).
6. **Output shape** — require the same report contract Claude workers use, so
   codex output files slot into the same synthesis step:

```text
End your final message with:
## Findings
- [conclusion — evidence: file:line or command output]
## Not determined
- [what could not be established, and where you looked]
## Blockers
- [only if something prevented execution]
```

## Shape 1: fan-out (coverage tasks)

Same rules as the Sonnet-worker fan-out (`orchestrator-pattern.md`), plus
process-specific ones:

- 2–5 parallel runs; each brief worth minutes of work, not one lookup.
- **Disjoint write scopes.** Parallel codex processes share this worktree —
  unlike subagents they really do race on files. Research/audit briefs must say
  "make no edits"; implementation briefs must never overlap paths. If briefs
  cannot be made disjoint, use the single-executor shape instead.
- Wait for every output file before synthesizing. An empty or missing output
  file after exit means the run failed on infrastructure — re-dispatch that
  brief as a fresh run.
- **Never `resume` in fan-out** — `resume --last` picks one "most recent"
  session and is ambiguous while several runs are live or just finished.

## Shape 2: single executor (implementation tasks)

The codex-first loop — Fable plans and reviews, one codex session implements:

1. Freeze the spec into a brief (all six items above) and dispatch one run.
2. When it exits, review as the orchestrator: read the report file, inspect
   `git diff`, and run the proof command yourself. Codex never self-certifies.
3. Iterate on the **same session** so codex keeps its context — this is the
   prompt-cache-reuse rule: resuming keeps the session's cache warm, while a
   fresh `codex exec` re-pays the whole cold-start context read:

```bash
codex exec --dangerously-bypass-approvals-and-sandbox \
  --output-last-message output/fable-codex/worker-1.md \
  resume --last - < output/fable-codex/followup-1.md
```

On **codex-cli 0.143.0**, exec-level flags (`--dangerously-bypass-approvals-and-sandbox`,
`--sandbox`, `-c`, `-m`, `--output-last-message`) must come **before** the
`resume` subcommand — `codex exec resume --last --dangerously-bypass-approvals-and-sandbox ...`
fails with `error: unexpected argument '--sandbox' found` (and the equivalent
for other exec flags) once `resume` has already been parsed. This applies to
every `resume` invocation, not just this one.

If a harness's permission classifier denies the bypass flag outright, fall
back to a sandboxed resume instead of dropping to Claude workers:

```bash
codex exec --sandbox workspace-write -c sandbox_workspace_write.network_access=true \
  -m gpt-5.6-sol -c model_reasoning_effort="medium" \
  --output-last-message output/fable-codex/worker-1.md \
  resume --last - < output/fable-codex/followup-1.md
```

`resume --last` filters sessions by cwd by default, so it is safe per
worktree as long as only one codex session is active here.

4. After ~2 failed iterations on the same problem, stop delegating: implement
   directly, or escalate per the advisor rules in SKILL.md.

## Failure handling and fallback

Fall back to Claude workers (`vpk-agent-worker` subagents) and say so to the
user when:

- `codex --version` fails (CLI not on PATH), or
- a run's output shows auth/login errors, or
- runs repeatedly die on infrastructure (not on the merits).

A codex report of "not found after searching X, Y, Z" is a finding, not a
failure — do not re-dispatch it.
