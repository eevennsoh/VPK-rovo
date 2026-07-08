# Symphony Lifecycle

Use this reference when executing or updating the VPK-rovo Symphony workflow.

## Ad-Hoc Request Bootstrap

Use this before the state flow when `vpk-symphony` is invoked without an
existing Linear issue identifier or URL.

- If the user request is task-like, first try to create a Linear issue in the
  configured Symphony project and put it in `Todo` so Symphony can claim it.
  Task-like requests include implementation, docs, investigation, review, audit,
  triage, operational guidance, codebase tours, and answer-only explanations.
- Do not hardcode prompt examples. Derive a concise imperative title and a
  scoped description from the actual request, including any explicit validation
  or acceptance criteria the user provided.
- If the user provides an existing issue key or URL, skip creation and fetch
  that issue fresh.
- If the user explicitly says not to create a ticket, or is asking a meta
  support question about how to use/debug Symphony in the current conversation,
  answer directly without creating a new issue.
- If Linear access, the `linear_graphql` tool, or the configured project cannot
  be resolved, report the exact missing capability. For repo-changing tasks, do
  not continue as Symphony-managed work without a ticket unless the user
  explicitly redirects to normal local work. For answer-only support, you may
  answer directly after saying ticket creation could not be completed.
- After creating the ticket, report the issue identifier/URL and follow the
  normal issue flow from fresh issue details. If the same agent will execute the
  ticket immediately, move through the `Todo` kickoff sequence; if the
  orchestrator should pick it up, leave it in `Todo`.
- During active issue execution, do not create follow-up issues for discovered
  adjacent work. Record those notes in the workpad instead.

## States

- `Backlog`: not routed for implementation.
- `Todo`: move to `In Progress`, create or update the workpad, then start.
- `In Progress`: continue from the current workpad.
- `Agent Review`: fresh read-only adversarial code review against the issue,
  workpad, PR diff, validation proof, evidence, comments, and checks. The
  reviewer may run read-only verification commands that leave tracked files
  unchanged. Passing work moves to `Merging`; gaps move back to `In Progress`;
  super-risk moves to `Human Review`.
- `Human Review`: wait for human action only on security/privacy exposure, data
  loss, irreversible schema or migration changes, destructive production
  behavior, or missing permissions/secrets.
- `Merging`: follow `references/git/land.md`; move to `Done` only after a
  current-head passing Symphony Agent Review, green checks, clean mergeability,
  and GitHub-reported merge.
- `Done`, `Closed`, `Cancelled`, `Canceled`, `Duplicate`: terminal.

## Execution Rules

1. Bootstrap a Linear issue first for task-like ad-hoc requests that do not
   already name an issue.
2. Fetch fresh Linear issue details before planning.
3. Reuse the active `## Codex Workpad` comment if it exists.
4. Classify answer-only issues before creating branches or PRs; write the
   answer to the workpad and move them to `Done`.
5. Keep project-specific context in issue descriptions and comments, not in the
   shared workflow files.
6. Do not advance dependent work until the previous PR is actually merged to the
   default branch.
7. If an issue becomes terminal while a run is active, stop implementation work
   and let cleanup/landing logic respect the terminal state.

## Phase Prompts

- `Todo`: kickoff worker; move to `In Progress`, create/reuse the workpad, and
  derive plan, acceptance criteria, and validation before code edits.
- `In Progress`: implementer; sync, implement, validate, push the same PR, and
  move to `Agent Review` only when the completion bar is satisfied.
- `Agent Review`: fresh adversarial code reviewer; read-only against tracked
  files, verify the PR against the issue/workpad/diff/proof, post the
  standardized review comment, then route by status.
- `Human Review`: narrow waiting gate; do not code, only react to super-risk or
  blocked-access decision updates when explicitly routed.
- `Merging`: landing worker; follow `references/git/land.md`, merge only after
  the current-head review/check/feedback gates pass, then move to `Done`.
- Terminal states: do nothing and shut down.

## Merging Rule

`Merging` is a merge-only state. Verify the attached PR has a current-head
passing Symphony Agent Review, green checks, clean mergeability, resolved review
feedback, branch divergence is understood, and GitHub reports the merge commit
before moving the issue to `Done`.
