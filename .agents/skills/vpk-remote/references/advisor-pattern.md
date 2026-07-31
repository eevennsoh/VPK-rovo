# Advisor Pattern Reference (Proximity-billed consults)

Adapted from Anthropic's advisor-tool guidance and the retired `/vpk-fable`
advisor mode. Two things changed in the port: the advisor is **not a
subagent** (a subagent would bill the OAuth session), and it is **not pinned
to one model**. It is a one-shot, read-only worker on either lane —
[gpt-executor.md](gpt-executor.md) or
[claude-executor.md](claude-executor.md) — writing to
`output/remote-<lane>/advisor-<n>/`.

## The idea

The token-limited OAuth session runs the loop. A high-judgment model is
consulted mid-task for strategic guidance: it reads the situation, produces a
decision or course-correction, and the planner continues. The advisor never
generates the final output and never edits files — that is where the savings
come from.

## Picking the advisor: independence, not tier

In `/vpk-fable` the advisor was pinned to the strongest model because it was
the *expensive* one, consulted sparingly while a cheaper executor did the
grinding. That rationale is dead here: every lane bills Proximity at the same
boundary, so there is no cost gradient to arbitrage.

What remains is **perspective diversity**. A model reviewing its own family's
output re-runs largely the same priors and tends to ratify; a different family
fails differently and is far likelier to surface the thing that was missed. So
default the consult to the family that did *not* do the work — Opus 5 high
when reviewing GPT-lane work or when nothing has been dispatched yet, Sol
xhigh when reviewing Claude-lane work. Explicit `--model` / `--effort` flags
override.

Two corollaries worth remembering:

- **Reviewing your own planner counts too.** When the consult is about a plan
  the OAuth Claude session wrote, the GPT lane is the independent reviewer,
  even though no worker has run yet.
- **Do not stack same-family consults.** A second opinion from the same
  family as the first advisor adds cost without adding independence; if the
  first consult was inconclusive, sharpen the question instead.

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

Moments 1–3 fire **autonomously** — the planner consults without being asked,
stating that it is doing so and why. They are the list in SKILL.md. Moment 4
is opt-in per task: agree the checkpoint cadence with the user up front,
because a cadence the user did not ask for spends planner tokens on a
schedule rather than on a trigger.

Reserve consults for genuine uncertainty. Do not consult for single-step
questions, mechanical edits, or anything verifiable cheaply by running code.
The bar is a cost comparison you can actually run: a consult spends planner
tokens (one brief written, one piece of advice read) while the thinking bills
Proximity — so consult when a wrong call would cost more than that, and
decide unaided when it would not. Good advice is a 400–700 token
course-correction, not an essay.

## Context packaging (the consult starts cold)

A one-shot worker on either lane sees only its brief — no transcript, and on
the GPT lane no CLAUDE.md either. Package all five items:

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

Treat consults as stateless and re-send context as a fresh brief on repeat:
prior advice, what was adopted, what changed, and the new question. Keep the
delta tight. (The GPT lane could technically `resume` a consult session, but
a re-brief keeps both lanes on one contract and consults are short.)

## After advice returns

Verify `git status` is clean (the advisor must not have edited anything),
state in one or two sentences what you adopt or reject and why, then
continue. Advice is input, not command — if it conflicts with something the
advisor could not see, say so and decide.
