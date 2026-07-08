# Orchestrator Pattern Reference (Plan Big, Execute Small)

Adapted from the Claude Managed Agents cookbook
(`claude-cookbooks/managed_agents/CMA_plan_big_execute_small.ipynb`) for use
inside Claude Code, where Managed Agents rosters are not available and workers
are subagents instead.

## The idea

A frontier model (Fable 5) handles **planning and synthesis** only. Cheaper
models (Sonnet 5) execute the token-heavy mechanical work in **isolated
parallel contexts**. Raw material — web pages, file contents, logs — stays in
worker contexts; the orchestrator receives only distilled findings. Two wins
compound: most input tokens bill at worker rates, and the orchestrator's
context window stays small enough to plan well late into a task.

## Measured economics (cookbook benchmark, a source-verification coverage task)

| Metric | Split team | Solo Fable (same rigor) |
| --- | --- | --- |
| Cost | $1.61 | $4.00 (~2.5× more) |
| Wall clock | 194s | 608s (~3× slower) |
| Input tokens at cheap rates | 84% | 0% |

On a Claude subscription the same shape shows up as slower rate-limit burn
rather than a smaller invoice.

## Fit

**Excels:** coverage tasks — verify N facts across independent sources,
sweep/audit many files, review large documents or logs, apply the same check
across many routes or components.

**Fails:** narrow questions with little reading volume (delegation overhead
dominates); tasks where the frontier model must judge the raw material itself;
tasks the orchestrator can answer from its own knowledge (then delegation is
pure overhead).

## Orchestrator essentials (ported from the cookbook coordinator prompt)

1. Break the task into **focused, independent sub-briefs**.
2. Run several workers **in parallel** on independent briefs — in Claude Code
   that means all `Agent` calls in one message, `subagent_type:
   "vpk-agent-worker"`.
3. **Always wait for every worker before drawing any conclusion.** In the CMA
   API this is `wait_for_agents`; in Claude Code, background workers notify on
   completion — do not synthesize until all have reported.
4. Re-assign a brief to a **fresh** worker when it failed on infrastructure
   (crash, tool outage), not on the merits. A worker that came back with "not
   found" after a real search is a finding, not a failure.
5. Synthesize once sufficient evidence has accumulated; cite worker evidence
   rather than re-deriving it.

## Worker essentials (ported from the cookbook worker prompt)

- Execute **one focused brief**; do not expand scope.
- Be thorough within it: multiple query phrasings, follow promising leads,
  cross-check facts.
- Report **specific answers with evidence** — `file:line` or URLs plus quotes,
  never raw dumps.
- Always finish with an explicit result (the CMA `submit_result` analogue is
  the worker's final message: a `## Findings` summary the orchestrator can use
  verbatim).

## Brief sizing

Delegation has a fixed setup overhead per worker (spawn + cold context +
report). Over-sharding **raises** cost. Rules of thumb:

- A brief should represent minutes of reading/execution, not one lookup.
- 2–5 workers covers most tasks; go wider only when the sub-tasks are truly
  independent and each is substantial.
- Two small related checks belong in one brief, not two workers.

## A constraint worth keeping in mind

In CMA the coordinator cannot see its workers' prompts or capabilities — all
of its beliefs about workers come from its own system prompt. Claude Code has
the same failure shape: the orchestrator only knows what `vpk-agent-worker`
does from this skill and the agent's description. If you change the worker
definition, update this reference so the orchestrator's assumptions stay true.

## If you later move to Claude Managed Agents

The API equivalent (`/docs/en/managed-agents/multi-agent`), for reference:

```python
worker = client.beta.agents.create(
    name="search-worker",
    model="claude-sonnet-5",
    tools=[{
        "type": "agent_toolset_20260401",
        "default_config": {"enabled": False},
        "configs": [
            {"name": "web_search", "enabled": True},
            {"name": "web_fetch", "enabled": True},
        ],
    }],
    system="Research one focused sub-question... Always finish by calling submit_result.",
)

coordinator = client.beta.agents.create(
    name="search-coordinator",
    model="claude-fable-5",
    multiagent={"type": "coordinator", "agents": [{"type": "agent", "id": worker.id}]},
    system="Break questions into sub-questions, delegate via create_agent, "
           "run workers in parallel, ALWAYS call wait_for_agents before concluding...",
)
```

The framework auto-grants the coordinator `create_agent`, `send_to_agent`,
`wait_for_agents`, and `list_agents`; workers get `submit_result` and
`send_to_parent`. Each sub-agent keeps its own prompt cache, so repeated
delegations to the same agent do not re-pay for its context — the Claude Code
analogue is re-using a named agent via `SendMessage`.
