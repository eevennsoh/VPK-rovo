# Merge and sync

Use this reference after the review gate is clear. It covers the wait/merge
mechanics, batch behavior, conflicts and failed checks, and synchronization of
the persistent `main` checkout.

## Queue and monitor auto-merge

For the full ship sequence, queue merge without bypass flags:

```bash
gh pr merge <number> --merge --auto --delete-branch
```

`--auto` lets GitHub merge when required `CI / PR checks` pass. If all gates are
already clear, GitHub may merge immediately. `--delete-branch` deletes the
remote source branch; local worktrees and branches remain cleanup work.

Poll after roughly 10 seconds, then every 30 seconds, for at most 15 minutes:

```bash
gh pr view <number> \
  --json state,mergedAt,mergeCommit,mergeStateStatus,statusCheckRollup,url
```

Report only meaningful transitions. Stop and preserve the PR when a required
check fails, the state becomes `DIRTY`, or the poll times out. Do not retry a
failed check or resolve a conflict unless the user asked for remediation.

If `BLOCKED` appears while checks look green, repeat the review-gate GraphQL and
REST reconciliation once. Re-queue auto-merge only after every surfaced thread
is resolved. When sources agree that conversations are clear, report the actual
remaining rule (for example CODEOWNERS or a required human review); do not use
`--admin`.

For merge-back of a PR that is already ready, use:

```bash
gh pr merge <number> --merge --delete-branch
```

Prefer merge commits unless the user explicitly asks for squash or rebase.

## Conflict and failed-check handling

- Resolve conflicts only in the PR branch or its owning worktree, never by
  overwriting persistent-main edits.
- Inspect both sides and preserve unrelated changes. Push the conflict fix, then
  rerun checks and the full review gate because the PR head changed.
- If a required check fails, report its name and URL. Fix it only when the user
  asked to finish the PR; otherwise leave the branch and PR intact.
- If review is re-requested or approval is dismissed after a push, wait for the
  current-head policy result. Old-head approval is not reusable proof.
- Treat Codex review timeout or unavailability as non-blocking once recorded;
  treat unresolved conversations and protected checks as blocking.

## Sync persistent main

After GitHub confirms `state: MERGED`, identify the worktree that owns local
`main` with `git worktree list --porcelain`.

From the persistent main checkout:

```bash
git switch main
git pull --ff-only origin main
```

From a secondary worktree, do not try to check out `main`; it is already owned
elsewhere. Sync out of place:

```bash
git -C <main-checkout> fetch origin
git -C <main-checkout> pull --ff-only origin main
```

Before syncing, inspect the persistent checkout's status. If unrelated edits
would be affected, preserve them with the narrowest safe mechanism and restore
them unstaged afterward. If there is no safe preservation path, stop and report
the blocker rather than forcing a sync.

Only switch to `main` and delete the local feature branch when running in the
persistent checkout and its tree is clean. In a secondary worktree, or whenever
local edits exist, stay put. Never remove the current worktree or delete the
branch it is using. Defer that to `vpk-git-clean` from the main checkout.

Verify synchronization:

```bash
git -C <main-checkout> status --short --branch
git -C <main-checkout> rev-parse main
git -C <main-checkout> rev-parse origin/main
```

The two revisions should match after a successful fast-forward. If they do not,
report whether local `main` diverged or dirty files prevented the update. Do not
reset, force, or discard the local state.

## Batch merge-back

For multiple PRs, branches, or worktrees:

1. Parse and echo the full ordered target list before changing state.
2. Inspect every target once and group it as ready, conflict/rebase needed, or
   blocked by checks, draft state, review, or ownership ambiguity.
3. Run the review gate independently for every ready target.
4. Preserve unrelated persistent-main edits once, not once per PR.
5. Merge ready PRs sequentially in user order, or ascending PR number when no
   order was given.
6. After each merge, fetch and fast-forward persistent `main` before evaluating
   the next target. A later PR may conflict with the new base.
7. If a later target becomes conflicted, stop on that target and leave remaining
   state intact; do not invent cross-PR conflict resolutions.
8. Restore preserved edits unstaged, run one final sync verification, and report
   one status line per target: merged, skipped with reason, or failed.

Branch deletion is limited to the remote source branches of PRs merged in this
flow. Do not bulk-delete local branches or worktrees; `vpk-git-clean` proves and
performs those removals separately.

## Edge cases

- A remote merge can succeed even when local branch deletion fails because a
  worktree still owns the branch. Verify the PR and merge commit, sync `main`,
  and defer local deletion.
- A merge helper may complain that `main` is already checked out elsewhere.
  Use the owning worktree with `git -C`; do not attach `main` twice.
- If the persistent checkout is intentionally on another branch, preserve that
  branch and report that local `main` was not switched. Sync only when it is safe.
- If the merge command returns an error after GitHub may have accepted it,
  re-read `state`, `mergedAt`, and `mergeCommit` before retrying. Never create a
  duplicate PR or duplicate merge because the local cleanup portion failed.

## Final evidence

Report the PR URL, current-head check result, review-gate result, merge commit,
remote branch deletion, persistent-main revision, preserved local edits, and a
one-line instruction to run `vpk-git-clean` later for landed worktree cleanup.
