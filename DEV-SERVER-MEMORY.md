# VPK Dev-Server Memory: Analysis & Scaling Strategy

> Investigation into why the local dev stack consumes ~11 GB RAM, why it will
> keep hurting as VPK grows, how large Next.js codebases solve it, and the
> recommended fix. Written 2026-07-11.

## Context

The Superset resource panel showed VPK-rovo consuming ~13 GB RAM, blamed on
`portless run`. That was misleading. This document captures what was actually
measured, the root cause, how large Next.js codebases handle this, and the
recommended fix — especially relevant since VPK keeps growing as prototypes are
added.

**Intended outcome:** a dev server that stays in the low-GB range instead of
pinning ~11 GB per warmed worktree, without sacrificing Turbopack's fast HMR.

## What was explored & measured

- **portless is not the consumer.** proxy + run wrappers total <150 MB. The
  Superset figure was a process-tree rollup crediting `portless run` for the
  child dev server it spawned.
- **The real consumer is the Turbopack dev server** (`next-server`, one process
  for the whole app). `ps` RSS was misleading (counts shared/mmap pages), so it
  was cross-checked with macOS `vmmap` **Physical footprint = 11.1 GB, steady,
  peak 11.3 GB** — genuine, non-reclaimable memory.
- **It's immediate, not gradual.** A *fresh* server hit 11 GB within seconds of
  one page load — not multi-day accumulation.
- **It's native (Rust/JIT) memory, not V8 heap.** No `max-old-space-size` on the
  process; the number never came back down until the process was killed.

### Root cause (version + platform, not "app too big")

VPK's exact profile — Next **16.2.9** + Turbopack + **Apple Silicon** +
agent **browser automation** hammering routes across worktrees — matches a known
bug: the `@next/swc-darwin-arm64` **MAP_JIT leak** (vercel/next.js
[#92052](https://github.com/vercel/next.js/issues/92052),
[#93896](https://github.com/vercel/next.js/issues/93896)). JIT executable memory
allocated during Turbopack compilation is not released until the process dies
(reported ~13.9 GB on a 27-page app). This is compounded by Turbopack's
long-standing "cache every visited route in memory, never evict" design
([discussion #93451](https://github.com/vercel/next.js/discussions/93451)), and
by long-running dev servers being repeatedly navigated by browser automation.

### Why the "obvious" fixes don't move dev memory

- **Lazy loading is already done well and does not help dev RAM.** ~218 demos
  sit behind `next/dynamic({ ssr:false })` in `components/website/registry/*`,
  guarded by `scripts/verify-lazy-load-boundaries.js`. But `dynamic()` only
  splits *client bundles*; Turbopack's dev server still graphs and watches the
  **entire** tree, so dev RAM tracks total repo size regardless.
- **Sharding is premature.** VPK is one monolithic App Router app (~56 pages,
  heavy shared cores: `components/projects/rovo-core` 1.8M, `shared` 1.2M,
  `studio` 868K). Projects are NOT independent — they lean on those shared
  buckets, so splitting is costly and buys little today.

## How large Next.js codebases / Vercel actually solve this

- **The makers fixed it in the framework, they did not shard.** Vercel's own
  vercel.com dashboard dev server dropped **21.5 GB → ~2 GB** (~90%) and
  nextjs.org **4.6 GB → 840 MB** via **Next.js 16.3 memory eviction** (evicts the
  in-memory cache to the 16.1 filesystem cache; default-on, no config). Refs:
  [Next 16.3 Turbopack blog](https://nextjs.org/blog/next-16-3-turbopack),
  [byteiota summary](https://byteiota.com/nextjs-16-3-turbopack-memory-build-cache/).
- **Otherwise: modular monolith + Turborepo** remote caching is the recommended
  sweet spot for ~90% of teams; **Multi-Zones** (native Next micro-frontends,
  each dev runs only their zone) or Module Federation are reserved for org-scale
  pain (50+ engineers, 30+ min CI). Refs:
  [Next Multi-Zones guide](https://nextjs.org/docs/app/guides/multi-zones),
  [Multi-Zones vs federation 2026](https://dotpingdesign.com/micro-frontends-2026-module-federation-multi-zones/).
- **VPK already has the escape hatch** for when one prototype must go
  independent: the `vpk-build` skill extracts a single route into a standalone
  sibling Next app (`.agents/skills/vpk-build/SKILL.md`). It's per-route and
  manual — correct as a last resort, not the day-to-day answer.

### What the skills/resources say

- The `/next` skill is **`@json-render/next`** (a JSON-spec renderer) — irrelevant
  to this problem.
- The relevant skill is **`vercel:turbopack`**: confirms filesystem cache is the
  foundation 16.3 eviction builds on, the `bundler: 'webpack'` opt-out, and
  `NEXT_TURBOPACK_TRACING=1` + `experimental.bundleAnalyzer` for diagnosis.
- `vercel:microfrontends` / Next Multi-Zones docs cover the sharding path if ever
  needed.

## Recommended approach: adopt Next.js 16.3

16.3's memory eviction is the *actual* fix. It is currently **preview only**
(`latest` = 16.2.10; fix ships as `16.3.0-preview.5`), and `next` is a **Locked
exact dep** under VPK's pinning policy — so this is done deliberately, on a
branch, fully validated, and reverted if it regresses. Turbopack dev is kept
(eviction is a Turbopack feature); no `next.config.ts` change is required
(eviction + filesystem cache are default-on in 16.3).

### Implementation steps

1. Branch from `main` (do not edit `main` directly).
2. In `package.json`, bump the Locked pair **in lockstep** to the same preview:
   - `"next": "16.3.0-preview.5"`
   - `"eslint-config-next": "16.3.0-preview.5"`
   (React stays `19.2.7`.) Then `pnpm install`.
3. No config change needed. Optionally document the escape hatch
   `experimental.turbopackMemoryEviction: false` in `next.config.ts` as a comment
   only (leave default `'full'`).
4. Restart the main dev stack fresh: `pnpm run dev:tmux:stop` then
   `pnpm run dev:tmux:start`.

### Verification (must confirm the drop on THIS arm64 machine)

The leak has an arm64-specific component, so measure — do not assume:

1. Warm the app (load `/`, then browse ~10–15 routes incl. `/rovo`, `/studio`).
2. `vmmap -summary <next-server-pid> | grep 'Physical footprint'` — expect
   **low single-digit GB**, not ~11 GB. This is the pass/fail gate.
3. `pnpm run lint` and `pnpm run typecheck` — must pass.
4. `pnpm run build` — VPK prod build is `next build --webpack`; confirm the
   preview doesn't break it. Then `pnpm run perf:budget:warn` for bundle sanity.
5. Smoke-test HMR: edit a component, confirm fast refresh still works.

### Rollback

If footprint doesn't drop, or lint/typecheck/build/HMR regress: revert
`package.json` to `next`/`eslint-config-next` `16.2.9`, `pnpm install`, restart.
No other files change, so rollback is a one-line revert.

### Fallbacks if the preview is unacceptable

- **`next dev --webpack` toggle** (add `dev:webpack` script): ~3 GB vs ~11 GB, no
  arm64 leak, matches VPK's prod webpack build; cost is slower HMR.
- Try `experimental.webpackMemoryOptimizations: true` +
  `preloadEntriesOnStart: false` (reported to help the M-series case).
- Then wait for **16.3 stable** and bump off preview.

## Operational hygiene (keep doing)

- Run dev servers only in worktrees you're actively browsing; each warmed stack
  can climb toward 11 GB and parallel stacks cause swap.
- Reap with `pnpm run dev:tmux:stop` per worktree (raw `tmux kill-session` leaves
  `portless`-spawned orphans — verified). Never `tmux kill-server` /
  `portless prune` (cascade across worktrees).
- Use the `vpk-system-clean` skill for runaway `next-server` + oversized `.next`
  cleanup.

## Follow-up (not part of the fix)

- Track 16.3 stable; move off the preview pin when released.
- Consider a lightweight dev-RAM check (current `perf:*` tooling only measures
  shipped-JS/build time, not dev-server RSS).
- Reserve `vpk-build` extraction / Multi-Zones for if a single prototype ever
  genuinely needs to run independently — not as a general memory fix.

## Sources

- [Turbopack: What's New in Next.js 16.3](https://nextjs.org/blog/next-16-3-turbopack)
- [Next.js 16.3 Turbopack: 90% Less Memory (byteiota)](https://byteiota.com/nextjs-16-3-turbopack-memory-build-cache/)
- [Issue #93896 — Turbopack CPU/memory on M-series Macs](https://github.com/vercel/next.js/issues/93896)
- [Issue #92052 — @next/swc-darwin-arm64 MAP_JIT leak](https://github.com/vercel/next.js/issues/92052)
- [Discussion #93451 — Turbopack excessive memory vs Webpack](https://github.com/vercel/next.js/discussions/93451)
- [Next.js Multi-Zones guide](https://nextjs.org/docs/app/guides/multi-zones)
- [Micro-frontends 2026: federation vs Multi-Zones](https://dotpingdesign.com/micro-frontends-2026-module-federation-multi-zones/)
- [Next.js Turbopack config reference](https://nextjs.org/docs/app/api-reference/turbopack)
