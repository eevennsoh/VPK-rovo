---
name: vpk-fable
description: "Run Fable 5 cost-tiering patterns inside Claude Code / Claude desktop without Managed Agents or the raw API: consult a Fable 5 advisor subagent from a cheaper executor session (advisor pattern), or have Fable 5 plan and delegate execution to GPT-5.6 Sol medium via the Codex CLI (default) or parallel Sonnet 5 worker subagents with --claude (orchestrator pattern). Use when the user says vpk-fable, asks for a Fable second opinion at lower cost, wants plan-big-execute-small delegation, wants Fable to plan while codex/ChatGPT executes, or asks how to use Fable 5 economically."
---

# VPK Fable — Advisor and Orchestrator Patterns

Two cost-tiering topologies for Fable 5, adapted from Anthropic's
[advisor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool)
and the Claude Managed Agents
[plan-big-execute-small cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_plan_big_execute_small.ipynb),
rebuilt on plain Claude Code subagents because neither the beta `advisor_20260301`
server tool nor Managed Agents exist in the desktop app / CLI.

Two executor mechanisms exist:

- **Claude subagents** with per-agent `model:` overrides:
  - `vpk-agent-advisor` (`.claude/agents/vpk-agent-advisor.md`) — `model: fable`, read-only.
  - `vpk-agent-worker` (`.claude/agents/vpk-agent-worker.md`) — `model: sonnet`, full tools.
- **Codex CLI processes** (`codex exec`, GPT-5.6 Sol at medium reasoning effort) —
  the default executor for orchestrate mode, run via background Bash rather
  than the Agent tool. See
  [references/codex-executor.md](references/codex-executor.md).

A named subagent keeps its own context and prompt cache across `SendMessage`
calls, which mirrors the "each sub-agent keeps its own cache" property of
Managed Agents.

**Agent availability fallback.** Subagent definitions load at session start,
and some clients do not expose project agents as named `subagent_type`s at
all. If `vpk-agent-advisor` / `vpk-agent-worker` are not in the available
agent list, spawn `subagent_type: "general-purpose"` with the explicit
`model` parameter instead (`model: "fable"` for the advisor, `model:
"sonnet"` for workers — both verified working in this harness) and begin the
prompt with: "First read `.agents/agents/vpk-agent-advisor.md` (or
`vpk-agent-worker.md`) and adopt its `## Instructions` as your role, then:".
Everything else in this skill applies unchanged.

## Mode dispatch

| Invocation | Mode |
| --- | --- |
| `/vpk-fable advisor [question]` | Consult the Fable 5 advisor about the current work |
| `/vpk-fable orchestrate <task>` | Plan big, execute small: delegate to the **codex executor** (GPT-5.6 Sol medium, default) |
| `/vpk-fable orchestrate --claude <task>` | Same pattern, Sonnet 5 subagent workers instead |
| `/vpk-fable` (bare) | Explain both patterns and help the user pick |

`--claude` and `--codex` (the explicit form of the default) may appear
anywhere in the invocation text; strip the flag before reading the task.

## Mode: advisor

Intended shape: the **main session is the executor** on a cheaper model
(Sonnet 5 via `/model`; Opus 4.8 if Sonnet 5 is unavailable), and Fable 5 is
consulted only at high-judgment moments. If the main session is already
running Fable 5, tell the user the advisor adds nothing (Fable advising
Fable) and either continue solo or suggest switching the session to Sonnet 5.

### When to consult (and when not to)

Consult the advisor at these moments — ported from the advisor-tool guidance:

1. **Before committing to an approach** on a task with a non-obvious design
   decision or an unruled-out failure mode.
2. **When stuck** — after roughly two failed attempts at the same problem,
   before trying a third variation of the same idea.
3. **Before declaring a complex task done** — a final plan/diff sanity review.
   This is also the skill's **verifier** shape: Fable checking cheaper work
   rather than producing it.
4. **At scheduled checkpoints on long exploratory loops** — N-iteration
   experiment/tuning tasks where each result reshapes what is worth trying
   next. Agree the cadence up front (initial plan + 2–3 checkpoints spread
   across the run) and consult for **re-ranking and steering**, not new
   ideas. This counters the cheap-executor failure mode of hill-climbing on
   marginal gains without ever stepping back to re-prioritize.

On exploratory tasks, treat the advisor's *initial* plan as weakly
predictive — in Lance Martin's Parameter Golf test Fable's upfront ranking
was anti-correlated with what worked; the checkpoints carried the value
(see [references/advisor-pattern.md](references/advisor-pattern.md)).

Reserve it for genuine uncertainty. Do not consult for single-step questions,
mechanical edits, or anything the executor can verify cheaply by running code.
Typical good advice is a 400–700 token course-correction, not an essay.

### How to consult

A Claude Code subagent starts **cold** — unlike the API advisor tool, it does
not see your transcript. You must package context into the prompt. Include
every item of this checklist:

1. **Task** — what the user asked for, verbatim where it matters.
2. **Constraints** — repo rules, API contracts, non-negotiables.
3. **Pointers** — exact file paths (the advisor has Read/Grep/Glob and will
   read them itself; don't paste whole files, do name the load-bearing ones).
4. **History** — approaches already tried and how each failed.
5. **The question** — the specific decision you want made, not "any thoughts?".

First consult in a session — spawn it named so it can be re-used:

```
Agent(
  subagent_type: "vpk-agent-advisor",
  name: "fable-advisor",
  run_in_background: false,
  description: "Consult Fable advisor",
  prompt: <packaged context per checklist above>
)
```

Later consults in the same session — message the same agent so it keeps its
warm context and cache instead of re-deriving everything:

```
SendMessage(to: "fable-advisor", message: <delta since last consult + new question>)
```

After advice returns: state in one or two sentences what you are adopting or
rejecting and why, then continue executing. The advisor recommends; the
executor decides and does.

Full escalation rules, the pairing table, and the raw-API equivalent:
[references/advisor-pattern.md](references/advisor-pattern.md).

## Mode: orchestrate

Intended shape: the **main session is Fable 5** (check with the user or
suggest `/model` → Fable) and does only planning, review, and synthesis;
token-heavy mechanical work runs on a cheaper executor. The pattern still
works from a Sonnet main session — planning quality is just lower.

### Fit check first

Good fit: coverage tasks — verify N facts across sources, sweep many files,
review large docs/logs, run the same check across many routes — and
well-specified implementation tasks the orchestrator can spec precisely and
verify cheaply. Poor fit: narrow tasks with little reading, or tasks where
the frontier model must judge the raw material itself. For a poor fit, say so
and just do the task solo.

Part of the fit check is a **reading-volume test**: estimate how many tokens
the workers would actually absorb. Every handoff carries a roughly fixed
coordination cost — the brief and the report are each billed twice (written
by one side, read by the other) — and Fable 5 is often more *token-efficient*
than cheaper models, so $/token alone overstates the savings. Delegation only
pays when worker reading volume clearly dwarfs that overhead; the BrowseComp
threshold data is in
[references/orchestrator-pattern.md](references/orchestrator-pattern.md).

### Pick the executor

- **codex (default)** — `codex exec` CLI processes running GPT-5.6 Sol at medium
  reasoning effort, launched via background Bash. Full mechanics, canonical
  command, and brief template:
  [references/codex-executor.md](references/codex-executor.md).
- **claude (`--claude`)** — parallel `vpk-agent-worker` Sonnet 5 subagents via
  the Agent tool, as below.
- If the codex CLI is missing from PATH or a run reports auth errors, fall
  back to Claude workers and tell the user you did.

### Pick the shape

- **Fan-out** (coverage/research): several parallel executors, each with an
  independent brief.
- **Single executor** (implementation): one executor run that Fable reviews
  and iterates. Parallel executors share this worktree, so briefs that edit
  overlapping files must never fan out — with codex, iterate one session via
  `codex exec resume --last` instead (see the codex reference).

### Procedure

1. **Plan.** Decompose the task into focused, **independent** sub-briefs.
   Right-size them: each worker spawn has fixed overhead, so a brief should be
   worth minutes of reading, not one fact. 2–5 workers is the usual sweet spot.
2. **Fan out.** Dispatch all workers in **one message** (parallel tool calls),
   each with a self-contained brief: objective, scope boundaries, exact
   paths/URLs, and the required output shape (distilled findings with
   `file:line` or URL evidence — never raw dumps). Keep parallel briefs'
   **reading scopes** disjoint too, not just write scopes — workers cannot
   see each other, so overlapping briefs pay for the same research twice.
   - codex: one background Bash `codex exec` per brief, report read from its
     `--output-last-message` file (canonical command in the codex reference).
   - claude: one `subagent_type: "vpk-agent-worker"` per brief;
     `run_in_background: true` for long briefs. If follow-up briefs in the
     same area are plausible, pass a `name:` at spawn and send the follow-up
     via `SendMessage` to that warm worker — its context and prompt cache
     persist, so you skip re-paying the cold-start reading (codex analogue:
     `resume` the same session, per the codex reference).
3. **Wait for all workers before concluding.** Never synthesize from a partial
   set. If a worker fails on infrastructure (not on the merits), re-dispatch
   that brief to a fresh worker.
4. **Synthesize.** Combine distilled findings into the final answer or edit
   plan. For implementation briefs, review the diff and run the proof command
   yourself — no executor self-certifies. Raw material stays in worker
   contexts; only conclusions reach the main context — that is where both the
   cost and context-window savings come from.

Economics, prompt essentials, and the Managed Agents equivalent:
[references/orchestrator-pattern.md](references/orchestrator-pattern.md).
Codex invocation details: [references/codex-executor.md](references/codex-executor.md).

## Mode: bare (`/vpk-fable`)

Explain, briefly and concretely. The triage question is **where the judgment
lives in the task**: judgment *scattered across* the task (each result
reshapes the next step) → advisor; judgment *upfront* (decompose, spec) or
*at review* → orchestrator, with the review end of that spectrum being the
**verifier** shape — Fable checking cheap work, covered here by advisor
consult moment 3 and the orchestrator's own-the-verification rule.

- **Advisor** — cheap executor loop, Fable consulted on demand. Best when the
  work is mostly mechanical but a few decisions are hard, or when a long
  exploratory loop needs periodic re-ranking checkpoints. Executor Sonnet 5
  (Opus 4.8 fallback), advisor Fable 5.
- **Orchestrator** — Fable plans/synthesizes, cheaper executors grind. Best
  for coverage tasks with lots of reading, or implementation tasks Fable can
  spec and verify. In the cookbook's benchmark the split was ~2.5× cheaper and
  ~3× faster than a solo frontier agent, with 84% of input tokens billed at
  worker rates.
- **Executor choice** — orchestrate defaults to the codex executor (GPT-5.6 Sol
  medium via `codex exec`); pass `--claude` to use Sonnet 5 subagent workers
  instead. Codex tokens bill to the user's ChatGPT/Codex plan, not the Claude
  quota, so the codex default also spreads load across subscriptions.
- **Cost framing** — on the API these are per-token savings; on a Claude
  subscription the win is rate-limit burn: Sonnet tokens consume the usage
  quota far more slowly than Fable/Opus tokens, so sessions stretch further.
- Then ask which pattern fits their current task, or infer it from context and
  proceed in that mode.

## Boundaries

- The advisor never edits files; only the executor (or workers) do.
- Codex runs use `--dangerously-bypass-approvals-and-sandbox` (no sandbox, no
  prompts), so every codex brief must carry explicit scope boundaries and
  non-goals — the brief is the only guardrail.
- The orchestrator owns verification: review the diff and run the proof
  command after every implementation run; never accept an executor's own
  "done" as evidence.
- Do not stack patterns by default (a Fable orchestrator does not also need a
  Fable advisor). Escalate a *worker* to the advisor only if it hits a genuine
  design wall.
- Do not spawn either agent for tasks the current session can finish in a few
  turns — subagent overhead would exceed the savings.
- Model overrides live in the agent definitions; if `model: fable` is ever
  rejected by a client, fall back to editing the advisor definition to
  `model: opus`, not to inventing per-call workarounds.
