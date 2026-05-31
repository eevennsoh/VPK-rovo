---
name: vpk-system-clean
description: >-
  Diagnose and fix high local-dev CPU/RAM on this Mac, and run/schedule the
  cleanup that prevents it. The #1 cause is a runaway `next-server` (Turbopack
  dev server) pegged at hundreds of percent CPU — a watch/recompile thrash loop;
  the skill detects and restarts it. It also deletes runaway Next.js `.next`
  caches across all vpk-rovo worktrees and restarts a ballooned `fseventsd`. USE
  THIS whenever the user says Next.js / next-server / node / the dev server is
  "eating CPU" / "at 400%" / "spiking", the Mac "feels slow" or "fans are loud"
  or "load is high", `fseventsd` is using lots of CPU/RAM, disk is filling from
  `.next`, or they want to "clean my system / free up space", "kill the runaway
  dev server", "fix the CPU problem", "set a timer / schedule the cleanup",
  "see cleanup records / history / how much was freed", "check the maintenance
  job/log", "change thresholds", or "reinstall / repair the cleanup or sudoers
  rule". Trigger on `vpk-system-clean` or the agent `com.<user>.vpk-system-clean`
  even if the skill is not named.
---

# vpk-system-clean

A 24/7 Mac running Next.js dev (Turbopack) hits three linked CPU/RAM problems:

1. **Runaway dev server (the big one).** `next-server` gets stuck in a
   watch → recompile → write → FSEvent → re-watch feedback loop and pegs the CPU
   (observed: **477%**). A healthy compile is *bursty*; a runaway stays hot. The
   only reliable live fix is to restart that dev server.
2. **Runaway `.next` caches.** Turbopack's `.next/dev` grows unbounded (15 GB /
   39k files seen). Every file feeds macOS FSEvents and *amplifies* the loop in
   (1). Keeping it small is the prevention.
3. **`fseventsd` leak.** macOS's FS-events daemon leaks CPU/RAM over long uptimes
   (22 GB / 100%+ seen). It auto-respawns clean when killed.

They reinforce each other, so the skill addresses all three: it **fixes** a live
runaway by restarting it, and **prevents** recurrence by clearing the bloat that
drives the loop.

The setup: a guard **script** (`scripts/vpk-system-clean.sh`) run on a schedule
by a per-user **launchd agent** (`com.<user>.vpk-system-clean`). The skill is the
**source of truth** — `scripts/` is canonical; install copies the script to
`~/.local/bin/` and *generates* the launchd plist for the current user.

## Decide what the user wants, then act

| User intent | Operation | Command (`zsh`, from this skill dir) |
| --- | --- | --- |
| "next-server is at 400%", "dev server spiking", "fan loud", "fix the CPU now" | **Doctor** | `scripts/doctor.sh` then `scripts/doctor.sh --kill` |
| "is it set up?", "why's it slow", "how big are caches", "check the log" | **Status** | `scripts/status.sh` |
| "run the full cleanup now", "free up space", "clear .next" | **Run now** | `~/.local/bin/vpk-system-clean.sh` |
| "set a timer", "run at 3am", "every 6 hours", "change schedule" | **Schedule** | `scripts/schedule.sh ...` |
| "show records / history", "how much was freed" | **Records** | `scripts/records.sh` |
| "reinstall", "repair", "agent isn't running", "set up sudoers" | **Install / repair** | `scripts/install.sh` |
| "clean more/less aggressively", "change the CPU/size threshold" | **Tune** | edit `scripts/vpk-system-clean.sh`, then re-run install |
| "remove this", "uninstall", "remove all the cleanup setup" | **Uninstall** | `scripts/uninstall.sh` (`--dry-run` to preview) |

Vague request ("machine is slow")? Start with **Status** (it lists hot dev
servers, fseventsd, and cache sizes), then act on whatever it flags.

## Doctor — fix a runaway dev server (the CPU spike)

`scripts/doctor.sh` lists every `next-server` with its CPU%, RSS, port, and
worktree, flagging any **sustained** above `NEXT_CPU_HOT` (150%). `--kill`
re-checks they're still hot, then kills each runaway *and its `next dev` parent*
so it can be restarted clean:

```
zsh scripts/doctor.sh          # inspect
zsh scripts/doctor.sh --kill   # restart the runaways
```

After killing, tell the user to restart the dev server (`pnpm run dev` / `rovo`)
and that clearing `.next` first helps (it regenerates). The scheduled job also
does this automatically (see below).

## Run now (full sweep, has side effects)

Run the **installed** copy so it matches the scheduled job exactly:

```
zsh ~/.local/bin/vpk-system-clean.sh
```

Order: (1) detect a *sustained*-hot `next-server` (sampled twice so a normal
burst isn't killed) and restart it if `KILL_RUNAWAY_NEXT=1`; (2) delete `.next`
caches over `NEXT_MAX_GB` **only when no dev server is running** — it never
deletes a live build's cache; (3) restart `fseventsd` if over `FSEVENTS_MAX_MB`
*and* the sudoers rule exists. Afterward show `scripts/records.sh` or the log.

If `fseventsd` is bloated but the sudoers rule is missing, the script logs that
it skipped. The user can fix the current balloon now with `sudo pkill -x
fseventsd` (password; auto-respawns) and add the rule (Install) for automation.

## Schedule (set the timer)

`scripts/schedule.sh` sets when the job runs, persists to
`~/.config/vpk-system-clean/schedule.env`, and re-applies via install so it
survives repairs:

```
zsh scripts/schedule.sh 03:30      # daily at 03:30
zsh scripts/schedule.sh every 6h   # every 6 hours (min 10m)
zsh scripts/schedule.sh show       # print configured + live schedule
```

Tip: if runaway dev servers are the recurring pain, a more frequent interval
(e.g. `every 2h`) catches them sooner than once-nightly.

## Records (cleanup history)

`scripts/records.sh` aggregates the log: total runs, servers killed, caches
removed, ~GB reclaimed, fseventsd resets, and the last 8 runs. `--removed` lists
every removed cache; `--raw` dumps the full log.

## Install / repair

`scripts/install.sh` is idempotent: copies the script, generates + validates the
plist (honoring any saved schedule), reloads the agent, and checks the sudoers
rule — printing the three commands to add it if missing. The skill never runs
`sudo`; the rule whitelists exactly `/usr/bin/pkill -x fseventsd` (least
privilege). Confirm with Status afterward.

## Tune

Top of `scripts/vpk-system-clean.sh`:
- `NEXT_CPU_HOT` (150) — %CPU above which a sustained `next-server` is a runaway.
- `KILL_RUNAWAY_NEXT` (1) — set 0 to only report runaways, never kill them.
- `NEXT_MAX_GB` (3) — delete a `.next` cache only past this size.
- `FSEVENTS_MAX_MB` (2048) — restart `fseventsd` only past this RSS.

Edit the canonical copy, then re-run **Install**.

## Uninstall

`scripts/uninstall.sh` removes everything the setup created — the launchd agent,
its plist, the installed `~/.local/bin` script, and the schedule config — in one
pass, reporting each location as it goes. Preview with `--dry-run`; add `--logs`
to also delete the run logs (kept by default as records).

```
zsh scripts/uninstall.sh --dry-run   # show exactly what would be removed
zsh scripts/uninstall.sh             # remove the live automation (keeps logs)
zsh scripts/uninstall.sh --logs      # also delete the logs
```

Two things it does not remove automatically:
- **the root-owned sudoers rule** — it prints the command for you:
  `sudo rm -f /etc/sudoers.d/vpk-system-clean && sudo visudo -c`
- **the skill source dir** (the uninstaller runs from it) — to delete the skill
  itself: `rm -rf .agents/skills/vpk-system-clean` (commit if tracked).

## Notes

- Paths assume vpk-rovo at `~/Documents/Labs/vpk-rovo` plus `~/.codex/worktrees/*`
  and `.../.claude/worktrees/*`. Adjust `NEXT_DIRS` if your layout differs.
- `KILL_RUNAWAY_NEXT=1` can, in principle, kill a genuinely-busy build that
  sustains >150% for the ~4s sample window. That is rare (compiles are bursty),
  but if a user reports a killed build mid-work, lower the aggressiveness by
  raising `NEXT_CPU_HOT` or setting `KILL_RUNAWAY_NEXT=0` (then rely on Doctor).
- Scripts use `setopt NULL_GLOB` (zsh aborts on unmatched globs otherwise).
