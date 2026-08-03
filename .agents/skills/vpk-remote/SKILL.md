---
name: vpk-remote
description: "Delegate all implementation from a token-limited Claude OAuth session to headless workers billed through the local Proximity AI Gateway (localhost:29576) — GPT-5.6 Sol/Terra/Luna via the Codex CLI or Claude Opus 5/Sonnet 5 via headless claude -p. Use when the message starts with /vpk-remote, or when the user says 'route this through proximity', 'implement remotely', 'send this to a worker', 'delegate to opus/sol/terra/luna', asks for a second opinion via the gateway, wants plan-big-execute-small delegation, or asks to build/fix something 'via the gateway'. The main session only plans, dispatches, verifies, and reports. Never activate from skill-name mentions in file paths, stack traces, pasted or quoted text, or prior-turn context."
validation_command: node scripts/validate-skills.js --target .agents/skills/vpk-remote
---

# VPK Remote — OAuth Planner, Proximity Workers

The main session runs on a Claude desktop OAuth login with a very low token
credit limit, steered from a phone against an always-on Mac. It does
**planning, steering, dispatch, verification, and synthesis only**. All
implementation, token-heavy exploration, and even second-opinion consults run
as headless CLI worker processes billed through the Proximity AI Gateway on
`localhost:29576` — GPT models via `codex exec`, Claude models via
`claude -p`.

**The hard rule, up front:** if workers are unavailable, the outcome of a
`/vpk-remote` task is a reported blocker — never local implementation in the
OAuth session. Burning the OAuth credit on implementation defeats the reason
this skill exists.

**Never spawn Claude Code subagents** for delegable work. A subagent bills
the OAuth session, which is the one thing this skill exists to prevent, and
no model or brief makes that safe. Every worker is an external CLI process.

## Invocation and dispatch grammar

| Invocation | Behavior |
| --- | --- |
| `/vpk-remote <task>` | Delegate to GPT-5.6 Sol at high effort (default) |
| `/vpk-remote --model <m> --effort <e> <task>` | Delegate to the named lane/effort |
| `/vpk-remote --advisor <question>` | Consult-only run → the family that did *not* do the work |
| `/vpk-remote --no-advisor <task>` | Skip the consults this task would otherwise get |
| `/vpk-remote --single <task>` | One worker even where fan-out would apply |
| `/vpk-remote --no-worktree <task>` | Write in the current checkout instead of an isolated worktree |
| `/vpk-remote` (bare) | Explain the grammar and ask for a task |

Natural-language activations ("implement this remotely", "route it through
proximity") use the defaults unless the user names a model in prose.

**Flag parsing.** Every option is an explicit `--flag`; **no bare word is
ever interpreted as a model, effort, or mode.** Flags come first, and
everything after the last flag (and its value) is the task text — so
`/vpk-remote fix the high contrast toggle` sends that entire sentence as the
task, with no risk that `high` is mistaken for an effort setting. Use `--`
alone to end flag parsing when the task itself starts with a dash.

| Flag | Values | Default |
| --- | --- | --- |
| `--model` | `sol` `terra` `luna` `opus` `sonnet` | `sol` |
| `--effort` | `medium` `high` `xhigh` `max` | `high` |
| `--advisor` / `--no-advisor` | *(no value)* | **on** |
| `--fanout` / `--single` | *(no value)* | **auto** (see *Worker shapes*) |
| `--worktree` / `--no-worktree` | *(no value)* | **on for briefs that write** (see *Worktree isolation*) |

All three behavioral defaults are **on**: the planner isolates writing work in
a worktree, consults an advisor, and fans out read-only work without being
asked. `--no-worktree`, `--no-advisor`, and `--single` are the escape hatches,
and `--worktree` / `--advisor` / `--fanout` force the behavior in cases the
planner would otherwise judge too small for it.

| `--model` | Lane | Model ID |
| --- | --- | --- |
| `sol` *(default)* | GPT (codex) | `gpt-5.6-sol` |
| `terra` | GPT (codex) | `gpt-5.6-terra` |
| `luna` | GPT (codex) | `gpt-5.6-luna` |
| `opus` | Claude (`claude -p`) | `claude-opus-5[1m]` |
| `sonnet` | Claude (`claude -p`) | `claude-sonnet-5` |

An unrecognized flag or flag value is an **error**: report it and ask, never
guess a near match and never silently fold it into the task text. A typo'd
`--effort xhigh` that quietly becomes part of the brief is exactly the
failure this syntax exists to prevent.

Every lane defaults to `--effort high`; `medium` `high` `xhigh` `max` are all
valid on both lanes (`max` verified through Proximity on 2026-08-03 with
Luna and Sonnet; earlier values probed working on 2026-07-31). `medium` is the
floor — the CLIs also accept `low`, but
this skill does not offer it: the planner's credit is the scarce resource,
not the worker's, and a worker that under-thinks buys a correction round that
costs a brief-write and a report-read on the expensive side of the boundary.

### Choosing effort

Do not coast on the default — pick from the task's shape. Effort and
verification are substitutes only where a proof command exists; where it
doesn't, effort is the sole quality lever.

| Task shape | Effort | Why |
| --- | --- | --- |
| Advisor consults, and genuine design ambiguity — unruled-out failure modes, a call the brief cannot settle | `xhigh` | Nothing verifies judgment. No proof command backstops a wrong call, so thinking is the only lever. |
| Explicit request for the deepest reasoning, or an exceptional judgment call where `xhigh` proved insufficient | `max` | This is opt-in because it trades the most worker time and tokens for one more reasoning tier. |
| Implementation against a clear spec — the common case | `high` | The proof command backstops mistakes, so effort and verification share the load. |
| Mechanical sweeps — renames, mass migrations, formatting, "apply this same edit to these 9 files" | `medium` | The brief fully determines the answer. Higher effort here buys scope creep, not correctness: a maximally-thinking worker starts finding adjacent improvements nobody asked for. |

Before reaching for the effort knob on a task that failed once, re-read the
brief first. Round-trips come far more often from an underspecified brief
than an under-thinking worker, and raising effort on a vague brief just
produces a confident wrong answer sooner.

Examples:

```text
/vpk-remote --effort medium rename useFoo to useBar across components/
/vpk-remote --model terra --effort xhigh <task>
/vpk-remote --model luna --effort max <task>
/vpk-remote --advisor --model sol is this reducer the right owner for X?
```

## Hard preflight (blocking)

Run before writing any brief; every check must pass or the task ends as a
reported blocker.

```bash
curl -fsS --max-time 5 http://localhost:29576/openai/v1/models >/dev/null
```

- Gateway health only. Proximity's model catalog is **stale** (it lists
  models older than what the gateway actually serves — verified: the catalog
  tops out at gpt-5.5 while `gpt-5.6-sol`, `gpt-5.6-terra`, and
  `gpt-5.6-luna` work).
  **Never grep the catalog for the target model**; a model rejection at
  dispatch time is itself a blocker to report.
- GPT lane: `codex --version` succeeds.
- Claude lane: `"$HOME/.local/bin/claude" --version` succeeds and
  `test -f "$HOME/.claude/settings-gw.json"` passes.

On failure: report which check failed and stop. Never fall back to
implementing in the OAuth session, never substitute the planner's own model,
never retry through a shell alias.

## Billing boundary

- **Planner:** this Claude session (OAuth, low credit). Owns decisions,
  briefs, review, final proof, synthesis.
- **Workers:** external CLI processes whose requests go only to Proximity.
  Own repo mutation and token-heavy reading.
- **Upstream credential:** owned by Proximity. Never appears in briefs,
  reports, worker homes, or repo files.
- **Never spawn Claude Code subagents** (Agent tool) for delegable work —
  they bill the OAuth session.
- **Never invoke shell wrappers** — `claude-gw`, `codex-gw`, `vpk-codex*`,
  `codex-use-*`. They are zsh functions/aliases that do not resolve in
  non-interactive shells, and an alias change could silently redirect
  billing. The canonical commands in the references are fully inlined; their
  `env …` prefix also bypasses same-name shell functions by construction.
- Always unset ambient credentials in worker env: `OPENAI_API_KEY` /
  `CODEX_API_KEY` (GPT lane) and `ANTHROPIC_AUTH_TOKEN` /
  `CLAUDE_CODE_OAUTH_TOKEN` / `CLAUDE_EFFORT` (Claude lane). The parent
  session exports its own `ANTHROPIC_BASE_URL` and `CLAUDE_EFFORT`, so the
  Claude-lane recipe sets both explicitly rather than trusting inheritance.

## Worktree isolation

**Every brief that writes files gets its own git worktree, by default.** This
skill is steered from a phone, so several tasks on unrelated problems are
routinely in flight at once. Workers sharing one checkout do not error when
they collide — the later write simply wins, and you get two confident reports
describing a diff that matches neither. That is the same mechanical hazard the
*Worker shapes* fan-out rule guards against, at the scale of concurrent tasks
rather than concurrent workers, and it is invisible from a phone.

Two further reasons the default is on, not merely available:

- **`main` is protected.** Direct pushes are blocked and a PR plus passing
  checks is required, so the work becomes a branch regardless. Writing in the
  checkout only defers branching; it never avoids it.
- **Every other agent surface already does this.** Codex, Cursor, and Claude
  Code each create a per-task worktree. Writing in place makes this skill the
  lone outlier.

| Brief | Worktree |
| --- | --- |
| Writes files (implementation, refactor, migration) | **yes** — default on |
| Read-only (advisor consults, audits, research, fan-out) | **no** |

Read-only briefs are dispatched `--sandbox read-only` (GPT) or
`--permission-mode plan` (Claude), so they *cannot* write. Isolation buys
nothing there and costs setup, which is why the default is keyed to the same
"does this brief write?" predicate that already picks the worker shape.

### Creating the worktree

Branch from the current `main` and place it under the repo's ignored
`.claude/worktrees/`, one per task:

```bash
branch="remote/<short-task-slug>"
tree="$PWD/.claude/worktrees/<short-task-slug>"
git worktree add -b "$branch" "$tree" main
```

Then **warm it up before dispatching** — a fresh worktree has no
`node_modules` and no `.env*`, and the brief's proof command is usually
`pnpm run lint` / `pnpm run typecheck`, which cannot run without them:

```bash
cp "$PWD"/.env.local "$tree"/.env.local 2>/dev/null || true
(cd "$tree" && CI=true pnpm install --prefer-offline)
```

Per repo guidance, do **not** run parallel pnpm validations until warmup
completes. Dispatch the worker with `-C "$tree"` (GPT lane) or from `$tree`
(Claude lane), and write the brief's *Exact repo paths* relative to that
worktree. `output/` artifacts stay under the **main** checkout so reports from
concurrent tasks remain readable in one place.

### Landing

The worker commits its work to the task branch inside the worktree; the
planner verifies the diff there and reports. **Stop at a verified diff** —
pushing the branch and opening a PR is `/vpk-git-ship`, run only when the user
asks. Nothing outward-facing happens on the strength of a passing proof
command alone.

Leave the worktree in place after reporting so the user can inspect it.
Cleanup of landed branches is `/vpk-git-clean`, never an automatic step of
this skill — and never `tmux kill-server` or `portless prune`, which cascade
across every worktree.

### When `--no-worktree` is right

Writing in the current checkout is correct when the task *is* the checkout's
uncommitted state — amending work already in progress there, or a change the
user is actively watching in a running dev server. Say which one applies when
the flag is used, and check `git status` first so the worker is not handed a
dirty tree it will silently fold into its diff.

## Procedure

1. **Ground.** Read only enough repo context to identify the owner, the
   constraints, and the proof command. The planner judges; it does not spend
   its scarce context on mechanical coverage. Part of grounding is the
   **reading-volume test**: every handoff bills the brief and the report
   twice (written by one side, read by the other), so delegation must clearly
   dominate that overhead — for tiny read-only questions, just answer;
   any non-trivial mutation still goes to a worker.
2. **Isolate.** If the brief writes files, create and warm the task worktree
   per *Worktree isolation* above, and confirm warmup finished before
   dispatch. Skip for read-only briefs and under `--no-worktree`.
3. **Freeze the brief** to a file — Goal / Exact repo paths / Constraints /
   Non-goals / Proof expected / Output shape, per
   [references/dispatch-patterns.md](references/dispatch-patterns.md). Never
   inline a brief into a shell command.
4. **Dispatch** via background Bash using the lane's canonical command:
   [references/gpt-executor.md](references/gpt-executor.md) or
   [references/claude-executor.md](references/claude-executor.md).
5. **Read only the report file.** Never stream or parse raw worker output —
   raw material stays in worker contexts; that is where the credit and
   context-window savings come from. An absent or empty report does **not**
   imply an absent diff: a worker killed mid-run may have already written
   every file. Always check `git status` in the task worktree before
   re-dispatching.
6. **Verify.** Inspect `git status` and `git diff` **in the task worktree**,
   run the brief's proof command if cheap (targeted `node --test`, a single
   grep). Delegate heavy verification (full `pnpm run lint &&
   pnpm run typecheck`, suites) as its own follow-up brief. A worker never
   self-certifies.
7. **Correct at most twice.** Send focused follow-ups to the same worker
   (GPT lane: `resume`; Claude lane: re-brief with the prior report + diff
   summary). After two failed correction cycles, stop and report the
   blocker — the planner does not silently take over implementation.
8. **Verify with an advisor** (default-on; see *Mode: advisor*). Send the
   diff and the original goal to the other family for an independent read
   before reporting done. Skip only for a trivial diff or under
   `--no-advisor`.
9. **Synthesize.** Outcome, proof, what the advisor confirmed or flagged,
   which branch and worktree hold the diff, and genuine blockers. Cite worker
   evidence rather than re-deriving it.

## Mode: advisor

A second opinion at high judgment moments, billed to Proximity: a
**read-only** consult brief, dispatched with the same lane commands as any
other worker.

**Consults are on by default.** The planner runs them without being asked,
stating that it is consulting and why. `--advisor` on its own makes a consult
the entire task; `--no-advisor` suppresses them for a run.

**Standing consult — every task that produces a diff:**

- **Pre-completion verify.** Before reporting work as done, send the diff and
  the original goal to the other family for an independent read. This is the
  verifier shape, and it is the one that pays off when you are steering from
  a phone: it is a second pair of eyes you did not have to ask for, and it
  costs you one line in the summary.

**Additional consults, on judgment:**

1. **Stuck** — after roughly two failed correction cycles on the same
   problem, before dispatching a third variation of the same idea.
2. **Before committing to an approach** whose design decision the brief
   cannot settle and where a wrong call means discarding the worker's output
   rather than amending it.

**Where consults are skipped** — the default is on, not unconditional. Skip
the verify for a trivial diff (a copy change, a one-line fix, a mechanical
rename a proof command already covers), because a consult spends planner
tokens on both sides — writing the brief and reading the advice — while the
thinking itself bills Proximity. When a wrong call would cost less than that
handoff, decide and move. Never consult on single-step questions or an
obvious plan.

**Default to the family that did not do the work.** Cost no longer picks the
advisor — every lane bills Proximity — so what a consult buys is
*independence*, not a capability tier. A GPT worker's blind spots are found
most cheaply by a Claude reviewer and vice versa; asking the same family to
audit its own reasoning re-runs the same priors.

| Work under review | Advisor default |
| --- | --- |
| GPT-lane worker output (`sol` / `terra` / `luna`) | `claude-opus-5[1m]` at xhigh |
| Claude-lane worker output (`opus` / `sonnet`) | `gpt-5.6-sol` at xhigh |
| A plan this planner wrote, or nothing dispatched yet | `gpt-5.6-sol` at xhigh |

The third row follows from the second: **this planner is Claude**, so
anything it authored is Claude-family work and a Claude advisor would review
its own priors. GPT is the independent reviewer by default, and Opus is
reached for only when GPT actually did the work.

All rows are `xhigh` for the reason in *Choosing effort* above: advice is
unverifiable, so effort is the only quality lever a consult has.

Explicit flags always win: `/vpk-remote --advisor --model sol <question>`
forces a GPT consult regardless of what ran before it.

Consult moments, packaging checklist, and advice shape:
[references/advisor-pattern.md](references/advisor-pattern.md). The advisor
never edits files; after advice returns, state in a sentence what you adopt
or reject, then continue.

## Worker shapes

Shape is chosen automatically from the brief, not requested:

| Brief | Shape |
| --- | --- |
| Writes files (implementation, refactor, migration) | **Single worker**, always |
| Read-only and splits into 2+ independent reading scopes | **Fan-out**, 2–5 workers |
| Read-only, one scope | Single worker |

**Fan-out is the default for read-only work** — research, audits, sweeps,
"check X across these areas" — dispatched in one message with disjoint
reading scopes, every brief carrying an explicit "make no edits" constraint.
Lanes may mix (e.g. sonnet + sol in parallel). Wait for every report before
synthesizing; never conclude from a partial fan-out.

**Fan-out can never be the default for briefs that write.** This is a
mechanical constraint, not a preference: parallel workers share one worktree
and will overwrite each other's edits, leaving a diff no report describes.
`--fanout` on a writing brief is therefore an **error** — report it and ask
whether to split the task into provably disjoint write scopes (which then
runs as a fan-out of narrower briefs) or to run it single. Implementation
otherwise stays one worker iterated via follow-ups.

Worktree isolation is **per task, not per worker**, so it does not soften this
rule — every worker on one task shares that task's worktree and collides there
exactly as described. What it prevents is the same collision *between*
concurrently dispatched tasks; see *Worktree isolation*.

Full shape, sizing, and completion rules:
[references/dispatch-patterns.md](references/dispatch-patterns.md).

## Artifacts

Everything lives under gitignored `output/`:

```text
output/remote-gpt/worker-<n>/      # home/ (CODEX_HOME), brief.md, report.md, followup-<k>.md
output/remote-claude/worker-<n>/   # brief.md, report.md, stderr.log, followup-<k>.md
output/remote-<lane>/advisor-<n>/  # advisor consults, same layout as that lane's workers
```

One directory per worker; never reuse a directory across concurrent workers.

Artifacts stay under the **main checkout's** `output/`, never inside a task
worktree, so reports from concurrently dispatched tasks stay readable in one
place and survive worktree cleanup. Name the worker directory after the task
when several are in flight (`output/remote-gpt/<task-slug>-worker-1/`).

## Boundaries

- The planner never edits repo files during a `/vpk-remote` task; workers own
  mutation. (Exception: none. Even one-line fixes are a worker brief or an
  honest "this is too small to delegate — want me to spend OAuth credit on
  it?" question to the user.)
- The advisor cannot edit files, and this is **enforced by the dispatch flags**
  — `--permission-mode plan` on the Claude lane, `--sandbox read-only` on the
  GPT lane — never by the brief alone. It matters most for the pre-completion
  verify, where the worker's diff is uncommitted and a post-consult
  `git status` could not distinguish an advisor's edit from the worker's.
- Workspace-write sandboxing is the GPT-lane default; do not escalate to
  bypass mode. The Claude lane runs with permissions skipped, so the brief's
  scope boundaries are its only guardrail — write them explicitly.
- Never copy, link, or read `~/.codex/auth.json` or any OAuth credential
  into a worker home.
- Never modify `~/.codex/config.toml`, `~/.claude/settings-gw.json`, or
  model pins as part of a run.
- A missing or empty report after worker exit is an infrastructure failure —
  **check `git status` in the task worktree first**, since a worker killed
  mid-run may have completed every edit and died before emitting its report.
  Re-dispatch that brief once to a fresh worker only if no diff landed. A
  well-supported "not found" is a valid finding, not a failure.
- Advisor consults are on by default and the planner runs them unasked, but
  they are not unconditional — skip the verify on a trivial diff, and honor
  `--no-advisor`. Always say when a consult ran and what it concluded.
- Worktree isolation is on by default for briefs that write, and the planner
  creates the worktree unasked. It never pushes, opens a PR, or removes a
  worktree on its own: shipping is `/vpk-git-ship` and cleanup is
  `/vpk-git-clean`, both only when the user asks. Always report which branch
  and worktree hold the diff.

## Known infrastructure hazard

Proximity's **`/openai/*` route intermittently returns HTTP 400** —
`CloudID is invalid or not provisioned in the staging environment` — on
roughly 10% of requests (measured 2026-08-01: 18/20 small identical calls
passed, and an 8KB request failed while a 400KB one succeeded, so it is
neither size nor config). `codex exec` treats 400 as non-retryable and aborts
the whole session, so a long GPT-lane run is likely to die partway.

The single-request preflight cannot detect this — most requests succeed. When
a GPT-lane worker dies with that message, it is **not** a brief or model
problem: check `git status` for a landed diff, then prefer the Claude lane
(`--model opus` / `--model sonnet`, routed via `/vertex/claude`, 12/12 clean
in the same window) rather than re-dispatching to GPT. The upstream fix
belongs to whoever provisions the staging CloudID.
