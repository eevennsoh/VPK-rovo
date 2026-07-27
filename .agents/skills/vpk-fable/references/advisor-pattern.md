# Advisor Pattern Reference

Adapted from Anthropic's advisor tool documentation
(`https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool`,
beta `advisor-tool-2026-03-01`) for use inside Claude Code, where the server
tool is not available and the advisor is a subagent instead.

## The idea

A faster, lower-cost **executor** model runs the main loop. A
higher-intelligence **advisor** model is consulted mid-task for strategic
guidance: it reads the situation, produces a plan or course-correction, and
the executor continues. You get close to advisor-solo quality while the bulk
of token generation happens at executor rates. The advisor does not generate
your final output — that is exactly where the savings come from.

## When the pattern fits

| Situation | Fit |
| --- | --- |
| Long-horizon agentic work (coding, multi-step research) where most turns are mechanical but the plan matters | Strong |
| You run Sonnet today and want a quality lift at similar or lower total cost | Strong (the canonical configuration) |
| You run Haiku and want a step up without switching the executor | Good — costs more than Haiku solo, less than upgrading the executor |
| Single-turn Q&A | Poor — nothing to plan |
| Every turn genuinely needs frontier capability | Poor — just run the frontier model |

## Pairing rules

The advisor must be at least as capable as the executor. VPK defaults:

| Role | Model | Notes |
| --- | --- | --- |
| Executor | Sonnet 5 (main session, `/model`) | Opus 5 if Sonnet 5 is unavailable |
| Advisor | Fable 5 (`vpk-agent-advisor`, `model: fable`) | Fall back to `model: opus` if a client rejects `fable` |

Fable advising Fable is valid on the API but pointless here — skip the
pattern when the main session already runs Fable 5.

## Call-timing guidance (ported from Anthropic's evals)

- The highest-value consult usually lands **after** the executor has oriented
  on the task (read the problem, gathered context) but **before** it commits
  to an approach. A consult before orientation is low-context and displaces a
  better-timed later call.
- Nudging: if a hard task is underway and no consult has happened by the time
  an approach is being committed to, that is the moment to consult. Anthropic
  measured a ~7pp pass-rate lift from a turn-2 nudge on Haiku executors, no
  effect on Sonnet, and a slight *drop* on Opus — so with a Sonnet/Opus
  executor rely on the three escalation triggers in SKILL.md, not reflexive
  early consults.
- Restraint language and nudges conflict; this skill uses restraint
  ("reserve for genuine uncertainty"), so do not add automatic nudging on top.

## Distributed judgment on exploratory tasks

The "consult after orientation, before committing" rule above is for
**decision-shaped** tasks — one hard choice, then mechanical execution.
**Exploration-shaped** tasks (iterative experiment loops where each result
reshapes what is worth trying next) need judgment *scattered* across the run
instead, per Lance Martin's Parameter Golf test
(`https://x.com/RLanceMartin/status/2075641284635799865`, July 2026):

- A Sonnet 5 executor consulting a Fable 5 advisor (initial plan + 2
  checkpoints over 20 ML-tuning experiments) reached **~90% of Fable-solo's
  improvement at ~34% of the token cost**.
- The upfront advising step was *not* the primary benefit — Fable's initial
  ranking of approaches was **anti-correlated** with what actually worked.
- The value came from the **checkpoints**: the cheap executor hill-climbed on
  marginal gains with no tendency to step back, and the advisor's periodic
  re-ranking steered it toward more promising directions.

Practical consequences for this skill: on an exploratory loop, agree a
checkpoint cadence with the executor up front (SKILL.md consult moment 4),
frame checkpoint consults as "re-rank the live options given these results"
rather than "produce a plan", and hold the advisor's initial plan loosely —
it is a starting orientation, not the payload.

## Context packaging (the big difference from the API tool)

The API advisor receives the executor's **full transcript** server-side —
system prompt, tool definitions, prior turns, tool results. A Claude Code
subagent receives **only your prompt**. Compensate with the five-part
checklist in SKILL.md (task, constraints, file pointers, tried-and-failed
history, the specific question). The advisor has `Read`/`Glob`/`Grep`, so
prefer naming exact paths over pasting file contents: it reads what it needs
and your prompt stays small.

For repeat consults, `SendMessage` to the same named agent. Its context
persists, so send only the delta: what changed since last time plus the new
question. This is the Claude Code analogue of advisor-side prompt caching.

## Advice shape

Expect (and hold the advisor to) a 400–700 token response:

1. A **decision** (which option, or the diagnosis).
2. A **plan** — the 3–7 concrete steps or the correction to the current plan.
3. **Risks / failure modes** the executor should verify.

The executor then states what it adopts or rejects and continues. Advice is
input, not command; if the advice conflicts with something the advisor could
not see, say so and decide.

## If you later move to the raw API

The server-side equivalent needs no subagent plumbing — one tool entry plus a
beta header, and the transcript injection is automatic:

```python
response = client.beta.messages.create(
    model="claude-sonnet-5",                    # executor
    max_tokens=4096,
    betas=["advisor-tool-2026-03-01"],
    tools=[{
        "type": "advisor_20260301",
        "name": "advisor",
        "model": "claude-fable-5",              # advisor
        # optional: "max_uses": 3, "max_tokens": 2048,
        # optional: "caching": {"type": "ephemeral", "ttl": "5m"},
    }],
    messages=[{"role": "user", "content": task}],
)
```

Notes that matter when porting:

- The executor emits `server_tool_use` with empty `input`; the server builds
  the advisor's view. Advice returns as an `advisor_tool_result` block.
- Fable/Mythos advisors return `advisor_redacted_result` (encrypted; the
  server decrypts it into the executor's prompt next turn) — round-trip it
  verbatim.
- Advisor tokens bill at the advisor model's rates and appear in
  `usage.iterations[]` with `type: "advisor_message"`; top-level usage is
  executor-only.
- Keep the advisor tool in `tools` on every follow-up turn while
  `advisor_tool_result` blocks remain in history, or the API returns 400.
