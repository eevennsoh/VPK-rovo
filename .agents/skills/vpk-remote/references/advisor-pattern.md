# Advisor Pattern Reference (Proximity-billed consults)

Adapted from Anthropic's advisor-tool guidance and the retired `/vpk-fable`
advisor mode. The difference here: the advisor is **not a subagent** (a
subagent would bill the OAuth session). It is a one-shot, read-only
`claude -p` consult through the Proximity Claude lane — Opus 5 at high effort
by default — per [claude-executor.md](claude-executor.md), under
`output/remote-claude/advisor-<n>/`.

## The idea

The token-limited OAuth session runs the loop. A high-judgment model is
consulted mid-task for strategic guidance: it reads the situation, produces a
decision or course-correction, and the planner continues. The advisor never
generates the final output and never edits files — that is where the savings
come from.

## When to consult (and when not to)

1. **Before committing to an approach** on a task with a non-obvious design
   decision or an unruled-out failure mode.
2. **When stuck** — after roughly two failed attempts at the same problem,
   before trying a third variation of the same idea.
3. **Before declaring a complex task done** — a final plan/diff sanity
   review. This is the **verifier** shape: the advisor checks worker output
   rather than producing it.
4. **At scheduled checkpoints on long exploratory loops** — agree the cadence
   up front (initial plan + 2–3 checkpoints) and consult for **re-ranking
   and steering**, not new ideas. On exploratory tasks, hold the advisor's
   *initial* plan loosely: in Lance Martin's Parameter Golf test the upfront
   ranking was anti-correlated with what worked — the checkpoints carried
   the value.

Reserve consults for genuine uncertainty. Do not consult for single-step
questions, mechanical edits, or anything verifiable cheaply by running code.
Good advice is a 400–700 token course-correction, not an essay.

## Context packaging (the consult starts cold)

A one-shot `claude -p` worker sees only its brief — no transcript. Package
all five items:

1. **Task** — what the user asked for, verbatim where it matters.
2. **Constraints** — repo rules, API contracts, non-negotiables.
3. **Pointers** — exact file paths. The worker runs in this worktree and can
   read them itself; name the load-bearing files instead of pasting them.
4. **History** — approaches already tried and how each failed.
5. **The question** — the specific decision to make, not "any thoughts?".

Plus the advisor-specific constraints, verbatim in every consult brief:

```text
You are advising only. Make no edits of any kind. Reply with:
1. A decision (which option, or the diagnosis).
2. A plan — 3–7 concrete steps or the correction to the current plan.
3. Risks / failure modes the planner should verify.
Keep it under ~700 tokens.
```

Because the lane is stateless, a repeat consult re-sends context as a fresh
brief: prior advice, what was adopted, what changed, and the new question.
Keep the delta tight.

## After advice returns

Verify `git status` is clean (the advisor must not have edited anything),
state in one or two sentences what you adopt or reject and why, then
continue. Advice is input, not command — if it conflicts with something the
advisor could not see, say so and decide.
