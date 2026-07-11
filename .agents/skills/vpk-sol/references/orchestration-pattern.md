# Sol Orchestration Pattern

Sol spends scarce tokens on decisions. Gateway workers spend plentiful tokens
on reading, implementation, and repetitive verification. The separation only
works when worker briefs are frozen before dispatch and reports are distilled
before returning to Sol.

## Fit and shape

Use a **single worker** for implementation, especially when files or tests
overlap. Resume it for focused corrections so it retains task context.

Use **2–5 parallel workers** for substantial independent coverage work such as
auditing separate directories, checking independent claims, or researching
unrelated sources. Parallel implementation is allowed only when write scopes
are provably disjoint.

Answer tiny read-only questions directly when delegation overhead dominates.
Any non-trivial repo mutation still belongs to a worker.

## Frozen brief

Every brief contains these sections in order:

1. **Goal** — one concrete outcome.
2. **Scope** — exact worktree and allowed paths.
3. **Constraints** — relevant repo rules and public contracts.
4. **Non-goals** — adjacent work the worker must not perform.
5. **Proof** — exact targeted commands and observable success criteria.
6. **Report contract** — the required distilled final message.

For implementation briefs, state that existing unrelated worktree changes
belong to the user and must be preserved. For parallel briefs, explicitly say
whether the worker is read-only or list its exclusive write scope.

## Worker report contract

Require every worker final message to end with:

```text
## Findings
- [conclusion or change — evidence: file:line or command output]

## Not determined
- [requested fact that could not be established, plus where it was checked]

## Blockers
- [only infrastructure or scope blockers]
```

Omit empty optional sections. `## Findings` is always present. Reports contain
conclusions and minimal evidence, never raw file dumps or long command logs.

## Orchestrator review

After each implementation report, Sol must:

1. Inspect the real worktree status and diff.
2. Trace the change to the requested owner and behavior.
3. Run the proof command independently.
4. Check for unrelated edits, dead compatibility paths, or incomplete cleanup.
5. Write a narrow follow-up if correction is needed.

The worker's test claim is evidence to inspect, not final verification. After
two failed correction cycles, stop and report the concrete blocker rather than
implementing directly with Sol.

## Parallel completion rule

Wait for every dispatched worker to produce a report or explicit
infrastructure failure. Re-dispatch only infrastructure failures. Synthesize
once all independent scopes are accounted for.
