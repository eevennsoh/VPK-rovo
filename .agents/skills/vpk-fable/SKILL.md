---
name: vpk-fable
description: "Run Fable 5 cost-tiering patterns inside Claude Code / Claude desktop without Managed Agents or the raw API: consult a Fable 5 advisor subagent from a cheaper executor session (advisor pattern), or have Fable 5 plan and fan out parallel Sonnet 5 worker subagents (orchestrator pattern). Use when the user says vpk-fable, asks for a Fable second opinion at lower cost, wants plan-big-execute-small delegation, or asks how to use Fable 5 economically."
purpose: Reproduce Anthropic's advisor-tool and plan-big/execute-small patterns with Claude Code subagents and per-agent model overrides, so most tokens burn at Sonnet 5 rates while Fable 5 handles only high-judgment moments.
owner: VPK
category: agent-operations
inputs: The user's mode choice (advisor, orchestrate, or bare), the current task context, and for advisor mode the specific decision or blocker to escalate.
outputs: Advisor consultations (decision + plan + risks) fed back into the executor loop, or a Fable-planned fan-out of Sonnet worker results synthesized into one answer.
required_tools: Agent tool (subagent spawn with model override), SendMessage (re-consult a warm advisor)
validation_command: node scripts/validate-skills.js
generated_artifacts: None on disk by default; advisor advice and worker findings live in conversation. Workers may edit files when the brief asks for implementation.
common_failure_modes: Spawning the advisor cold without packaged context, consulting the advisor on trivial turns, over-sharding orchestration briefs so delegation overhead exceeds savings, concluding before all workers return, and running the advisor pattern when the main session is already Fable 5.
---

# VPK Fable — Advisor and Orchestrator Patterns

Two cost-tiering topologies for Fable 5, adapted from Anthropic's
[advisor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool)
and the Claude Managed Agents
[plan-big-execute-small cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_plan_big_execute_small.ipynb),
rebuilt on plain Claude Code subagents because neither the beta `advisor_20260301`
server tool nor Managed Agents exist in the desktop app / CLI.

The mechanism here is per-agent `model:` overrides:

- `vpk-agent-advisor` (`.claude/agents/vpk-agent-advisor.md`) — `model: fable`, read-only.
- `vpk-agent-worker` (`.claude/agents/vpk-agent-worker.md`) — `model: sonnet`, full tools.

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
| `/vpk-fable orchestrate <task>` | Plan big, execute small: fan out Sonnet 5 workers |
| `/vpk-fable` (bare) | Explain both patterns and help the user pick |

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
suggest `/model` → Fable) and does only planning and synthesis; token-heavy
mechanical work runs in parallel Sonnet 5 workers. The pattern still works
from a Sonnet main session — planning quality is just lower.

### Fit check first

Good fit: coverage tasks — verify N facts across sources, sweep many files,
review large docs/logs, run the same check across many routes. Poor fit:
narrow tasks with little reading, or tasks where the frontier model must judge
the raw material itself. For a poor fit, say so and just do the task solo.

### Procedure

1. **Plan.** Decompose the task into focused, **independent** sub-briefs.
   Right-size them: each worker spawn has fixed overhead, so a brief should be
   worth minutes of reading, not one fact. 2–5 workers is the usual sweet spot.
2. **Fan out.** Spawn all workers in **one message** (parallel tool calls),
   each `subagent_type: "vpk-agent-worker"` with a self-contained brief:
   objective, scope boundaries, exact paths/URLs, and the required output
   shape (distilled findings with `file:line` or URL evidence — never raw dumps).
   Use `run_in_background: true` for long briefs; the harness notifies on completion.
3. **Wait for all workers before concluding.** Never synthesize from a partial
   set. If a worker fails on infrastructure (not on the merits), re-dispatch
   that brief to a fresh worker.
4. **Synthesize.** Combine distilled findings into the final answer or edit
   plan. Raw material stays in worker contexts; only conclusions reach the
   main context — that is where both the cost and context-window savings come from.

Economics, prompt essentials, and the Managed Agents equivalent:
[references/orchestrator-pattern.md](references/orchestrator-pattern.md).

## Mode: bare (`/vpk-fable`)

Explain, briefly and concretely:

- **Advisor** — cheap executor loop, Fable consulted on demand. Best when the
  work is mostly mechanical but a few decisions are hard. Executor Sonnet 5
  (Opus 4.8 fallback), advisor Fable 5.
- **Orchestrator** — Fable plans/synthesizes, Sonnet workers grind. Best for
  coverage tasks with lots of reading. In the cookbook's benchmark the split
  was ~2.5× cheaper and ~3× faster than a solo frontier agent, with 84% of
  input tokens billed at worker rates.
- **Cost framing** — on the API these are per-token savings; on a Claude
  subscription the win is rate-limit burn: Sonnet tokens consume the usage
  quota far more slowly than Fable/Opus tokens, so sessions stretch further.
- Then ask which pattern fits their current task, or infer it from context and
  proceed in that mode.

## Boundaries

- The advisor never edits files; only the executor (or workers) do.
- Do not stack patterns by default (a Fable orchestrator does not also need a
  Fable advisor). Escalate a *worker* to the advisor only if it hits a genuine
  design wall.
- Do not spawn either agent for tasks the current session can finish in a few
  turns — subagent overhead would exceed the savings.
- Model overrides live in the agent definitions; if `model: fable` is ever
  rejected by a client, fall back to editing the advisor definition to
  `model: opus`, not to inventing per-call workarounds.
