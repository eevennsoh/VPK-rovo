# Cleanup evidence

Use this walkthrough to prove a worktree or branch has landed before removing
it. Evidence must cover committed history, uncommitted files, PR ownership,
registration, and process ownership; no single signal proves all five.

## Establish repository truth

Run from the persistent main checkout:

```bash
git status --short --branch
git worktree list --porcelain
git remote show origin
git symbolic-ref refs/remotes/origin/HEAD
gh pr list --state all \
  --json number,title,headRefName,headRefOid,baseRefName,isDraft,state,mergedAt
```

Record the default branch, current worktree, candidate path, candidate branch or
detached HEAD, and candidate head SHA. A target is ineligible if it is current,
owns the default branch, or is not a registered worktree with inspectable Git
metadata.

## Prove the working tree is empty

Use porcelain with untracked files enabled:

```bash
git -C <worktree> status --short --branch --untracked-files=all
git -C <worktree> status --porcelain=v1 --untracked-files=all
```

Any output from the second command is a hard stop. Capture the exact path,
branch or detached state, and file list, then leave it alone. A merged PR proves
only committed work; it says nothing about these local files.

## Prove committed work landed

Try ancestry first:

```bash
git merge-base --is-ancestor <candidate-head> <default>
```

Exit zero proves the candidate commit is in the default branch's history. When
ancestry fails because the PR was squash-merged or commits were recreated, use
GitHub merged-PR evidence: match the candidate branch or head SHA to a closed PR,
confirm its `state`, `mergedAt`, and base branch, and verify no open PR uses the
same branch or head.

When ancestry and PR metadata are unavailable or insufficient, use
patch-equivalence only as a final fallback:

```bash
git cherry -v <default> <candidate-head>
```

Every candidate patch must be shown as equivalent on the default branch. Review
the actual diff when the result is unclear. Do not create no-op merges or fake
ancestry to turn an uncertain target into an eligible one.

## Reconcile PR and remote branch state

For a merged PR whose source branch remains:

1. Capture `headRefName`, `headRefOid`, `baseRefName`, state, and merge time.
2. Query open PRs by both branch name and candidate head SHA.
3. Delete the remote branch only when the PR is merged and neither query finds
   active ownership.
4. Check the remote directly:

   ```bash
   git ls-remote --heads origin <branch>
   ```

5. Only after the command returns no ref may a stale tracking ref be removed:

   ```bash
   git update-ref -d refs/remotes/origin/<branch>
   ```

Delete the local branch with `git branch -d` only when it is merged and unused
by every registered worktree. If Git requires `-D`, report it for deliberate
manual action rather than converting patch-equivalence into force-deletion
authority.

For an unmerged PR, do nothing from an ambiguous cleanup request. Confirm the
user wants abandonment, then inspect unpushed commits, dependent PRs, active
worktrees, and local files before `gh pr close <number> --delete-branch`.

## Prove process ownership

Inspect the exact worktree path:

```bash
lsof +D <worktree>
```

Record PID, PPID, command, and cwd. Live processes do not make a proven-landed
worktree permanently ineligible, but they must be stopped only after all Git and
PR checks pass. Prefer the repo's cwd-scoped listener helper documented in
`../SKILL.md`.

For a port-file fallback, collect candidate ports before deleting the directory:

```bash
cat <worktree>/.dev-frontend-port <worktree>/.dev-backend-port 2>/dev/null
cat <worktree>/.dev-rovo-port 2>/dev/null
grep -oE '[0-9]+' <worktree>/.dev-rovo-ports 2>/dev/null
lsof -ti:<port> -sTCP:LISTEN
lsof -a -d cwd -p <pid> -Fn
```

The `n` line must exactly equal the candidate path. Skip listeners owned by any
other cwd. Send SIGTERM, recheck ownership and liveness, and use SIGKILL only on
the same PID if it persists.

## Removal proof record

Before each removal, retain a compact evidence record:

```text
path: <absolute worktree path>
head: <branch-or-detached> <sha>
clean: yes
current/default: no/no
landed proof: ancestry | merged PR #N | patch-equivalent
open PR by branch/head: none
process proof: none | exact-path PIDs stopped
action: git worktree remove <path>
```

After removal, re-run the worktree inventory and dry-run prune. Report stale
admin metadata, tracking refs, dirty state, or any mismatch instead of widening
the cleanup scope.
