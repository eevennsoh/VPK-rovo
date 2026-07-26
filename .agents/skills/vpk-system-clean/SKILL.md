---
name: vpk-system-clean
description: "Diagnose and remediate VPK local-dev CPU, memory, and disk pressure, or manage its scheduled maintenance. Use when the user says \"vpk-system-clean\", \"next-server eating CPU / at 400%\", \"Mac is slow or loud\", \"fseventsd\", or \"clean .next caches / free space\"."
validation_command: zsh scripts/status.sh
---

# vpk-system-clean

Use this skill to diagnose and safely remediate recurring VPK development-Mac
pressure: sustained-hot or memory-bloated `next-server`/Turbopack processes,
oversized idle `.next` caches, orphaned worktree tmux sessions, sustained-hot
exact-path Atlassian `almd`, and ballooned `fseventsd`.

## When to use

Use it for live diagnosis, an immediate cleanup sweep, maintenance status or
records, scheduling, install/repair, tuning, or uninstall. For a vague "machine
is slow" request, start with status and act only on what it flags. Do not use it
for arbitrary process killing, repository cleanup, or generated-artifact removal.

## Hard invariants

- The files under `scripts/` are canonical. Run or reference them in place; do
  not substitute hand-written cleanup commands when a script owns the operation.
- Protect `artifacts/**`: never inspect, modify, or delete it in this flow. The
  only repository data eligible for scheduled deletion is a qualifying `.next`
  cache chosen by the canonical script while no dev server uses it.
- Target only exact guarded processes: the selected `next-server` and parent,
  exact `/usr/local/bin/almd`, orphaned `vpk-dev-*` sessions, and `fseventsd`
  when its sudoers guard exists. Do not broaden names or paths.
- Do not run global `portless prune`; it may kill another worktree after port
  reuse. The cleanup never touches the long-lived Portless `:443` proxy.
- The skill does not run `sudo`. Missing sudoers support is reported for the
  user to repair deliberately.

## Route the request

Run commands from this skill directory with `zsh`:

| Intent | Command |
| --- | --- |
| Diagnose a hot dev server | `scripts/doctor.sh` |
| Restart proven runaway dev servers | `scripts/doctor.sh --kill` |
| Inspect setup, processes, caches, sessions, or logs | `scripts/status.sh` |
| Run the installed scheduled sweep now | `~/.local/bin/vpk-system-clean.sh` |
| Inspect cleanup history | `scripts/records.sh` |
| Change or inspect schedule | `scripts/schedule.sh ...` |
| Install or repair launchd/sudoers guidance | `scripts/install.sh` |
| Preview or remove the setup | `scripts/uninstall.sh --dry-run` / `scripts/uninstall.sh` |

For thresholds, schedules, record formats, launchd/sudoers repair, tuning, and
uninstall details, read [maintenance.md](references/maintenance.md).

## Doctor workflow

1. Run `zsh scripts/doctor.sh`. It reports each `next-server` with CPU,
   `vmmap` physical footprint, port, and worktree; `pnpm run mem` exposes the
   same diagnostic from the repo root.
2. A sustained CPU breach is different from a bursty compile. Kill only after
   the doctor's recheck, using `zsh scripts/doctor.sh --kill` when the user asked
   for remediation.
3. The kill path stops the runaway server and its `next dev` parent so it can
   restart cleanly. Tell the user to relaunch with `pnpm run dev:tmux:start` for
   a stable worktree Portless URL, or the appropriate `pnpm run dev`/`rovo`
   command otherwise.

## Full sweep

Run the installed copy so manual and scheduled behavior match:

```bash
zsh ~/.local/bin/vpk-system-clean.sh
```

The sweep samples sustained-hot `next-server`, rechecks memory-bloated but idle
servers, deletes only oversized inactive `.next` caches, stops unattached tmux
sessions whose worktree path is gone, samples old exact-path `almd` before TERM
and guarded KILL, and restarts oversized `fseventsd` only when the least-privilege
sudoers rule exists.

Silent exit zero is a valid successful run. Do not improvise extra remediation
after it. For a script-only handoff, report status, the log path
`~/Library/Logs/vpk-system-clean.log`, and only actionable warnings. If the
command is still running quietly, wait for it rather than branching into other
cleanup.

## Safety notes

- Memory decisions use `vmmap` physical footprint, not `ps` RSS; arm64 JIT/native
  mappings make RSS undercount the observed leak dramatically.
- A busy warmup can briefly use high CPU or memory, so the scripts resample and
  require idle state where appropriate.
- The `almd` guard verifies executable path, minimum age, and sustained CPU. A
  similarly named shell or Atlassian service remains untouched.
- Orphaned tmux sessions are killed through the same socket that listed them and
  only when their worktree path is gone and the session is unattached.
- If sandbox permissions block a cache or log path, report the exact failure;
  do not attempt alternate deletion, permission repair, or schedule changes.

## Validation and proof

```bash
zsh scripts/status.sh
zsh scripts/records.sh
```

Use status for launchd/sudoers state, `fseventsd`, live Next servers, tmux
sessions, and cache sizes. Use records or the log for runs, servers restarted,
caches removed, space reclaimed, session/almd/fseventsd resets, and warnings.
Report only the operation requested and its evidence; do not widen a script-only
run into configuration changes.
