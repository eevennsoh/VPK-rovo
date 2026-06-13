---
name: vpk-git-ship-fast
description: "Use for VPK-rovo fast direct-to-main shipping: commit ALL uncommitted changes and push straight to remote main with an auto-generated commit message — NO PR, NO branch, NO review gate. The fast counterpart to vpk-git-ship. Use for \"vpk-git-ship-fast\", \"commit and push to main\", \"commit everything and sync to main\", \"quick commit to main\", \"push straight to main no PR\", \"just commit and sync\", or \"land this directly\". For the gated PR + Codex-review + auto-merge flow use vpk-git-ship; for worktree/branch cleanup use vpk-git-clean."
disable-model-invocation: true
model: haiku
effort: low
allowed-tools: Bash(git *)
---

# VPK Git Ship Fast

Commit every uncommitted change and push it straight to remote `main`, with a commit message you generate from the diff. No PR, no new branch, no review gate. This is the deliberately ungated, low-ceremony counterpart to `vpk-git-ship`; the user invokes it manually when they want speed over process.

`model: haiku` + `effort: low` are intentional — this is mechanical git work. Those fields are Claude Code extensions; other AI tools ignore them and run on their own selected model, which is fine.

## When NOT to use this

- Want a PR, Codex review, or CI gate before code lands → use `vpk-git-ship`.
- Removing worktrees / deleting branches / pruning refs → use `vpk-git-clean`.
- This skill never calls `gh`, never opens a PR, never creates a branch.

## Why direct push to `main` works here

`main` has branch protection with a required `PR checks` status check, but `enforce_admins` is **false**, so the repo owner/admin can push directly. CI still runs on the push — it just does not *gate* it, and can go red after the fact. Force-pushes are disabled, so every push must be a fast-forward.

## Sandbox: remote git ops run unsandboxed by default

The remote uses an SSH URL (`git@github.com:...`). Under a sandboxed harness, the sandbox denies access to `~/.ssh/known_hosts`, so `git fetch` and `git push` fail with:

```
hostkeys_foreach failed for ~/.ssh/known_hosts: Operation not permitted
Host key verification failed.
fatal: Could not read from remote repository.
```

**So in Step 6, run `git fetch` and `git push` unsandboxed from the first attempt** (Claude Code: `dangerouslyDisableSandbox: true`) — don't waste a failed sandboxed attempt first. Keep everything else sandboxed: `git add`, `git commit`, `git status`, `git update-index`, and `git merge-base` all work fine inside the sandbox and touch no SSH/network. Only the two ops that hit the remote need the bypass.

Two other benign sandbox artifacts you'll see and should ignore: `.env.local.example: Operation not permitted` in `git status` (the sandbox denies reading `.env*`; it is *not* a real change — confirm it never stages), and `git update-index --refresh` exiting non-zero with "needs update" (a harmless stat refresh).

## Pre-loaded working-tree state

Branch: !`git rev-parse --abbrev-ref HEAD`
Upstream: !`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "(none)"`

Status (porcelain, `??` = untracked):
```!
git -c color.ui=never status --short --branch
```

Changed files:
```!
git -c color.ui=never diff HEAD --stat
```

Full diff of tracked changes (use this to write the commit message; if it is very large, lean on the stat above):
```!
git -c color.ui=never diff HEAD
```

## Steps

1. **Refresh and decide if there's anything to do.** Run `git update-index --refresh` then re-read `git status --short`. If the working tree is clean **and** `git log --oneline origin/main..HEAD` is empty (nothing uncommitted, nothing ahead of `origin/main`), report "nothing to commit or push" and stop.

2. **Branch warning (do not stop).** Look at `Branch` above:
   - If it is `main`: proceed silently.
   - If it is any other branch, or `HEAD` (detached): emit one clear warning line and continue — e.g. `⚠️ On '<branch>', not main. Landing these changes directly on main.` The user has opted into always landing on `main`; warn, then proceed. Do **not** ask for confirmation.

3. **Unrelated-change warning (do not stop).** This skill sweeps the *entire* working tree with `git add -A`, so it will commit changes you did not make. Before staging, compare the changed files above against what was actually touched in this session/conversation. For every changed (or untracked) path that does **not** trace to your own work this session, emit a warning listing them — e.g. `⚠️ Also committing changes not made in this session: components/blocks/triggers/page.tsx, lib/foo.ts. These look concurrent/unrelated — landing them on main too.` The user has opted into landing everything, so **warn, then proceed** — do not ask for confirmation and do not drop them. If every changed file traces to this session's work, say nothing. When unsure whether a file is yours, treat it as unrelated and warn (false positives are cheap; silently shipping someone else's in-progress edit is not).

4. **Stage everything, minus secrets.** Prefer `git add -A`. Scan the status above first: if it includes `.env`, `.env.*`, `*.pem`, `*.key`, or anything clearly secret/out-of-scope, stage selectively instead and list the skipped paths in the report. Never commit secrets to `main`.

5. **Write the commit message** from the diff:
   - Imperative subject, ~50 chars, describing *what the change does* (e.g. `Fix Hermes panel overflow`, not `update code`).
   - Optional short body only when the change spans multiple distinct concerns.
   - Match repo log style: **no `Co-Authored-By` footer** unless the user explicitly asks.
   - Commit: `git commit -m "<subject>"` (add `-m "<body>"` only if you wrote a body).

6. **Fast-forward-safe push to `main`.** Force-push is forbidden, so confirm the push is a fast-forward of remote `main`. **Run the `git fetch`/`git push` commands here unsandboxed by default** (see "Sandbox" above — SSH remote ops fail sandboxed); `git merge-base` stays sandboxed.
   - `git fetch origin main` (unsandboxed)
   - `git merge-base --is-ancestor origin/main HEAD` (exit 0 = `origin/main` is an ancestor of your commit → the push will fast-forward).
     - **Exit 0 → push (unsandboxed):** `git push origin HEAD:main`. If you are on `main`, that also advances local `main`. If you are on a feature branch, also bring local `main` along when it is safe: `git fetch origin main:main` (fails harmlessly if `main` is checked out elsewhere — ignore and report).
     - **Non-zero → STOP, do not force.** `origin/main` has commits you don't have; a direct push would be rejected and force-pushing is blocked by protection. Report: "origin/main has advanced — integrate first (`git merge origin/main` or rebase onto it, resolve conflicts), then re-run `/vpk-git-ship-fast`." Leave the local commit in place.

7. **Report concisely:**
   - Branch warning emitted (if any).
   - Unrelated-change warning emitted (if any), with the file list.
   - Files committed; any secret/out-of-scope paths skipped.
   - Commit hash + subject.
   - Push result: pushed to `origin/main` (fast-forward), or stopped because `origin/main` diverged.
   - One line: "CI `PR checks` runs on `main` post-push; it does not gate this push and may report status afterward."

## Stop rules

- Nothing to commit and nothing ahead of `origin/main`.
- `origin/main` diverged (push would not be a fast-forward) — never reach for `--force`; ask the user to integrate first.
- Staging would include `.env*`/keys/secrets you cannot confidently exclude.
- `git push` fails for any non-fast-forward, auth, or network reason — report the exact git error, leave the commit intact, do not retry blindly. **Exception:** an SSH `known_hosts: Operation not permitted` / `Host key verification failed` error is the sandbox, not a real failure — retry that one command unsandboxed (per "Sandbox" above) before reporting.
