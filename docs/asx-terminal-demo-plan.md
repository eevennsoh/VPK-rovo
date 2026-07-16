# ASX Terminal Stage — dual-pane tmux demo (Jira CLI × Claude Code)

> Implementation plan as approved and executed. See
> [asx-terminal-demo-script.md](./asx-terminal-demo-script.md) for the
> presenter-facing walkthrough of the shipped result.

## Context

The ASX project (`/asx`) is a gallery of agent-sessions design patterns. Its "Terminal" card currently falls through to a title placeholder in `components/projects/asx/page.tsx`. We're building a presentation-only demo under that card: a single tmux-style terminal window telling the story *"monitor your Jira work and code at the same time."* The right pane is a Claude Code session where the developer types prompts; the left pane is an invented **Jira CLI** sessions dashboard (modeled on Claude Code's agent view — sections, state glyphs, dispatch line, shortcut hints — but Jira-branded, never Claude/Rovo-branded) that live-updates as Claude creates work items, picks up backlog, runs tasks in parallel, asks for input, and lands PRs.

Confirmed decisions from the interview:
- **Presenter-paced**: → / Space advances each beat; the initial pane split is triggered by *clicking* the terminal; typing/output animations auto-play within a beat; `R` + top-bar button restart. Forward + restart only (no back-step — a backwards jump renders mid-story text fully materialized and reads as a glitch on stage).
- **One continuous story**, opening with the Claude pane full-width → click to split → `jira connect` boots the dashboard.
- **Left pane**: "Jira CLI" identity, **sectioned list** layout (Needs input / Working / Backlog / Done), not TUI kanban columns.
- **Fixtures**: new dev-flavored software project (WEB-xxx keys), not the ASX RFP set.
- **Must show multiple parallel tasks** running with the board updating.
- Demo quality, not production — but follows repo conventions (tabs, `@/` imports, React 19, ternary rendering, motion tokens + reduced-motion, pure logic in `lib/` with tests, files well under 1000 lines).
- **Implementation runs via `/vpk-fable`** (orchestrator pattern) per the user's request.

## Architecture

Pure script data → pure fold/reducer → timer-driving controller hook → plain React monospace markup. **No ANSI strings and no `components/ui-custom/terminal.tsx`** — the sectioned dashboard needs animated glyphs, colored PR chips, and truncating flex rows that a single ANSI `output` string can't express. Raw zinc/hex palette on `font-mono` divs is accepted prior art for terminal surfaces (`terminal.tsx`, `blocks/terminal-switch`).

Key design point — **state commits atomically, animation is presentational**: the reducer only applies a step's *final* effect (`commit-step`). In-flight partial reveal (chars typed, lines shown) is hook-local view state (`revealCount`) layered over committed state. This makes the reducer trivially testable and gives fast-forward and the reduced-motion path for free (`finish-beat` = commit remaining steps).

## New files (all under `components/projects/asx/`)

| File | Responsibility |
|---|---|
| `data/terminal-demo-script.ts` | WEB-xxx fixtures, Jira CLI copy constants, and `TERMINAL_DEMO_BEATS` — the whole story as data |
| `lib/terminal-demo-state.ts` | Types, `createInitialTerminalDemoState`, `applyBoardEvent`, `applyStep`, `createTerminalDemoReducer`, `foldBeats`, selectors `getBoardSections`/`getBoardCounts`. Pure, no React |
| `lib/terminal-demo-state.test.js` | Colocated `node --test` (esbuild harness pattern from `lib/queue-session-state.test.js`) |
| `hooks/use-terminal-demo.ts` | Controller: reducer + step timers, keyboard, click-to-split, fast-forward, reduced-motion, cleanup |
| `components/terminal-stage.tsx` | Stage shell: viewport breakout, tmux frame, CSS-grid split, wires panes + status bar; exports `TerminalStage`, `TerminalControls` |
| `components/terminal-stage-jira-pane.tsx` | Left pane: shell → boot → Jira CLI dashboard (header, counts, sections, dispatch line, footer hints) |
| `components/terminal-stage-claude-pane.tsx` | Right pane: pixel logo (inline SVG), Claude Code welcome box, transcript, prompt box |
| `components/terminal-stage-chrome.tsx` | Shared atoms: `TerminalLineView` (tone spans), `StateGlyph` (animated ✽/✻), `BlinkCursor`, `PrLabel`, `TmuxStatusBar` |

Modified: `components/projects/asx/page.tsx` only. (`data/gallery-items.ts` already had the `terminal` landscape card; `app/asx/page.tsx` and `index.ts` needed no change.)

## Data model

```ts
// data — styled line = tone spans, never ANSI
interface TerminalSpan { text: string; tone?: "dim" | "accent" | "success" | "warning" | "error" | "bold" | "brand" }
type TerminalLine = readonly TerminalSpan[];

type TerminalBoardStatus = "backlog" | "needs-input" | "working" | "done";
interface TerminalWorkItem {
	key: string; title: string; status: TerminalBoardStatus;
	summary: string;                       // one-line activity
	age: string;                           // static strings ("now", "3m", "2d") — no clocks
	pr?: { number: number; state: "open" | "merged" };
}

type TerminalBoardEvent =
	| { type: "add-item"; item: TerminalWorkItem }
	| { type: "move-item"; key: string; to: TerminalBoardStatus }
	| { type: "set-summary"; key: string; summary: string; age?: string }
	| { type: "set-pr"; key: string; number: number; state: "open" | "merged" };

type TerminalBeatStep =
	| { kind: "split" }                                         // beat 1 only
	| { kind: "type"; pane: "left" | "right"; text: string }    // char-by-char into pane's prompt
	| { kind: "submit"; pane: "left" | "right" }                // prompt → transcript
	| { kind: "output"; pane: "left" | "right"; lines: TerminalLine[] }  // staggered line reveal
	| { kind: "show-dashboard" }                                // left pane flips shell → dashboard
	| { kind: "board"; events: TerminalBoardEvent[] }           // staggered board mutations
	| { kind: "pause"; ms: number };

interface TerminalBeat { id: string; trigger: "key" | "click"; hint: string; steps: readonly TerminalBeatStep[] }
```

```ts
// lib — reducer state
interface TerminalDemoState {
	split: boolean; dashboardVisible: boolean;
	beatIndex: number; stepIndex: number; settled: boolean; finished: boolean;
	left: TerminalPaneState; right: TerminalPaneState;   // { transcript: TerminalLine[]; promptDraft: string }
	items: TerminalWorkItem[];                            // sections derived via selector
}
type TerminalDemoAction = { type: "begin-beat" } | { type: "commit-step" } | { type: "finish-beat" } | { type: "restart" };
```

`foldBeats(beats, throughIndex)` folds beats fully settled — used by tests (equivalence property) and keeps back-stepping cheap to add later.

## Controller hook (`useTerminalDemo(enabled)`)

Hoisted in `AsxGallery` with `enabled = selectedId === "terminal"` (same pattern as `useWorkItemStageController`), shared by `TerminalControls` (top bar) and `TerminalStage`.

- **Step driver** keyed on `(beatIndex, stepIndex, settled)`: `type` ≈ 28ms/char; `output` ≈ 120ms/line (300ms "thinking" delay before Claude's first line); `board` events ≈ 350ms apart; `split`/`show-dashboard`/`submit` commit immediately (CSS carries the visual); `pause` = setTimeout. When steps run out → `settled: true`. Reveal progress is time-based (derived from elapsed `performance.now()`, not tick count) so throttled timers (hidden tabs, busy main thread) drop frames instead of stretching the animation out.
- **Fast-forward**: `advance()` while animating dispatches `finish-beat` (clear timers) instead of starting the next beat — presenters can always skip; a second press starts the next beat.
- **Keyboard** (window listener only while enabled): `ArrowRight`/Space → `advance()` (preventDefault so Space doesn't scroll; ignore modifier keys and editable targets); `r`/`R` → `restart()`. Keyboard may also trigger the click beat (a11y fallback).
- **Click-to-split**: `handleFrameClick` advances only while `awaitingClick`; clicks are inert afterward so stray clicks never advance beats.
- **Reduced motion** (`useReducedMotion` from `motion/react`): `advance()` = `begin-beat` + `finish-beat` synchronously; no intervals ever start.
- **Cleanup**: all timer handles in a Set ref; cleared on step change, restart, `enabled → false`, unmount (discipline mirrors `hooks/use-kanban-lifecycle.ts`).
- Exposes `{ state, activeStep, revealCount, beatCount, awaitingClick, statusHint, advance, handleFrameClick, restart }`. `statusHint`: animating → dim `✽ running…`; settled → the beat's hint (e.g. `→ next: pick up the backlog`); finished → `demo complete · R to restart`.

## Rendering

- **Frame**: stage wrapper reserves dock space below the gallery tiles (matches the Queue stage's `pb-56` pattern); inside, one frame `max-w-6xl`, flexible height capped at `70vh`, `rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-[13px] shadow-2xl overflow-hidden flex flex-col`.
- **Split**: body is CSS grid, `gridTemplateColumns: split ? "minmax(0,1fr) 1px minmax(0,1fr)" : "0fr 0px 1fr"` — track count stays 3 so the property interpolates; `transition: grid-template-columns var(--duration-slower) var(--ease-in-out)` + `motion-reduce:transition-none`. Left cell `min-w-0 overflow-hidden`; divider `w-px bg-zinc-800`. Pre-split the frame is a button-semantics click target (`aria-label="Split the terminal to open Jira"`), inert after.
- **Tmux status bar**: bottom `h-6 bg-zinc-900 border-t border-zinc-800 text-xs`; left `[asx]` green + window list `0:claude*` → `0:jira 1:claude*`; right = `statusHint` (gentle `animate-pulse` on a leading `→`/`✽` glyph only, `motion-reduce:animate-none`) + static clock string.
- **Jira pane**: shell prompt `~/dev/webstore $` + typed `jira connect` + boot lines → dashboard fades in (`duration-medium ease-out`, reduced-motion gated). Header `Jira CLI v0.4.2` (Jira blue) · `Webstore (WEB) · acme.atlassian.net` (dim) · counts line `1 awaiting input · 3 working · 2 completed` (toned per count). Sections ordered Needs input / Working / Backlog / Done (hidden when empty). Row = `StateGlyph` + bold key + title + dim truncating summary (`min-w-0`, metadata `shrink-0` per flex-truncation gotcha) + optional `PrLabel` (open=blue, merged=purple) + dim age. Bottom: bordered dispatch line (placeholder or typed reply + cursor) + footer hints `enter to open · space to reply · ctrl+x to delete · ? for shortcuts`. Rows keyed by item key wrapped in `motion.div layout` + fade (`duration-normal`, `ease-out-practical` resolved array `[0.4, 1, 0.6, 1]`, `willChange: "transform, opacity"`, gated by `useReducedMotion`) so Backlog→Working reads as movement.
- **StateGlyph**: working = frames `["✽","✻","✢","·"]` ~140ms interval, amber; needs-input = static yellow `✻`; done = static green `✻`; backlog = dim `○`. Static first frame under reduced motion.
- **Claude pane**: small inline-SVG pixel-grid logo in coral `#D97757`; welcome box (`✻ Welcome to Claude Code!`, model + cwd lines, dim); transcript with `> prompt` echoes and `⏺ jira start WEB-231` / `  ⎿ Session started` tool idiom; bordered prompt box with typed draft + blinking cursor (`animate-pulse motion-reduce:animate-none`). Panes scroll independently; instant `scrollTop` autoscroll on transcript growth.

## Story script (10 beats, seeded board)

Seed at connect: Backlog = WEB-231 "Fix flaky checkout Cypress test", WEB-198 "Add dark mode toggle to settings", WEB-244 "Compress hero images on landing page", WEB-217 "Migrate date-picker to design system"; Done = WEB-190 "Bump Node 22 in CI" (PR #482 merged, 2d).

0. *(initial render)* Full-width Claude pane; hint `click the terminal to open Jira`.
1. **split** *(click)* — grid animates 50/50; left shows shell prompt; window list updates.
2. **connect** — left types `jira connect --space webstore`; boot output; dashboard appears with seeded items.
3. **create-item** — right prompt: *"Create a Jira work item for the price rounding bug on the cart page, then start on it."* → `⏺ jira create …` / `⎿ Created WEB-247` / `⏺ jira start WEB-247`; board adds **WEB-247** under Working (`Reproducing rounding error in cart totals…`, age `now`).
4. **pickup-backlog** — right prompt: *"Pick up WEB-231 — the flaky checkout test — and figure out the flake."* → WEB-231 moves Backlog→Working.
5. **parallel-dispatch** — right prompt: *"Kick off the rest of the backlog in parallel."* → three staggered moves to Working with distinct summaries; counts `0 awaiting · 5 working · 1 completed`.
6. **needs-input** *(board-only)* — WEB-198 → Needs input, summary *"Should dark mode follow system preference by default?"*; dispatch line flips to `space to reply to WEB-198`.
7. **reply** — left dispatch line types `WEB-198: yes — follow system preference, add a manual override`; WEB-198 → Working.
8. **first-completions** *(board-only)* — WEB-247 → Done PR #512 open; WEB-244 → Done PR #513.
9. **second-completions** *(board-only)* — WEB-231, WEB-217, WEB-198 → Done with PRs #514–516; counts `0 awaiting · 0 working · 6 completed`.
10. **summary** — right prompt *"Summarize today's sessions."* → `6 sessions run · 6 PRs opened · backlog cleared.`; sets `finished`.

Board-only beats (6, 8, 9) deliberately sell "the Jira pane monitors live work" without presenter typing.

## Registration (`components/projects/asx/page.tsx`)

- `const terminalController = useTerminalDemo(selectedId === "terminal")` in `AsxGallery`.
- `renderAsxItem`: `if (item.id === "terminal") return <TerminalStage controller={terminalController} />;` (threaded through the signature like `workItemController`).
- `handleSelectedChange`: `terminalController.restart()` when entering the terminal card (mirrors `restartCardKanban`).
- `topBarCenter` ternary: `selectedId === "terminal" ? <TerminalControls controller={terminalController} /> : …` — a dim `Beat N / M` label + compact outline Restart button (matches `WorkItemControls` styling). Advance affordance stays inside the terminal (status-bar hint + keyboard) to preserve the illusion.

## Tests (`lib/terminal-demo-state.test.js`, node --test via esbuild harness like `queue-session-state.test.js`)

- `applyBoardEvent`: add appends; move changes only that item; set-pr attaches label; unknown key no-ops.
- **Fold equivalence**: stepping the reducer through the entire script deep-equals `foldBeats(TERMINAL_DEMO_BEATS, last)` — proves fast-forward/reduced-motion end states are identical.
- **Script integrity**: every event key exists when applied; exactly one `click`-trigger beat and it's the split; final counts `{ awaiting: 0, working: 0, completed: 6 }`; every done item has a PR.
- Reducer control flow: commit past last step sets `settled`; `restart` equals initial state; `begin-beat` while unsettled no-ops.
- Result: 12/12 passing.

## Verification performed

1. `pnpm run lint` and `pnpm run typecheck` — clean (3 pre-existing warnings elsewhere, 0 errors).
2. `node --test components/projects/asx/lib/terminal-demo-state.test.js` — 12/12 pass. `pnpm run verify:file-size` — within budget.
3. Browser walkthrough via the worktree dev stack: opened `/asx` → Terminal card; clicked to split; stepped every beat with →; confirmed fast-forward mid-animation, `R` restart, and switch-away/back auto-restart. Fixed two issues found during this pass: the frame was hiding behind the gallery dock (added dock-space reservation matching the Queue stage) and the reveal-timer loop used tick-count instead of elapsed time (made it throttle-proof for backgrounded/hidden tabs).

## Execution note

Implemented via the **`/vpk-fable`** orchestrator pattern (`--claude`, Sonnet 5 subagent workers): one worker built the pure state/data/test layer, a second built the controller hook, panes, tmux frame, and page.tsx registration, in parallel against a pinned export contract. The orchestrating session then reviewed both diffs, ran all proof commands itself, and fixed the two issues found during live browser verification.

## Follow-up changes (round 2)

Requested after the first build; all shipped and verified. (Story keys are now `ASX-###` and beats read as ASX product work — see the beat list above for the original `WEB-###` framing, which was rethemed 1:1.)

- **Backspace = instant beat rollback.** New `step-back` reducer action folds to the previous beat's settled state via `foldBeats(beats, beatIndex - 1)` (initial state when the target `< 0`), discarding any in-flight animation. `useTerminalDemo` exposes `stepBack()`, wired to `Backspace` (with `preventDefault` so it doesn't trigger browser back-nav). Covered by new reducer tests; the earlier "restart-only, no back-step" decision is superseded.
- **Up/down Jira row navigation with a highlight.** The controller tracks `selectedKey`; `↑`/`↓` move it over the on-screen row order. Order is a single source of truth in the lib — `TERMINAL_SECTION_ORDER` + `getOrderedItemKeys(items)` — consumed by both the pane (render order) and the controller (navigation) so they can't drift. The selected row renders a full-bleed `bg-zinc-800` bar with brightened text (a real TUI list cursor, k9s/lazygit reverse-video, fully terminal-representable). `Enter` on a selected row is a `preventDefault`-only no-op: opening the issue in real Jira is narrated by the presenter, per the request.
- **ASX rebrand of the fixtures.** Workspace `Agent Sessions Experience (ASX) · asx.atlassian.net`; shell prompt `~/dev/asx $`; Claude cwd `~/dev/asx`; connect command `jira connect --space asx`. Issue keys `ASX-###`, tasks rethemed to fit the project (flaky gallery snapshot test, compress illustration assets, card overflow on the Kanban stage, date-picker migration, dark-mode toggle) so the board reads as "Claude building ASX itself."
- **Claude Code mascot logo.** `ClaudeLogo` is now a coral pixel-art critter (grid sprite with two dark eyes) — a "terminal-doable" block sprite matching the CLI splash mascot, replacing the plain asterisk.
- **Model line** shows `claude-fable · /help for help`; **footer hint** updated to `↑↓ to move · enter to open · space to reply · ctrl+x to delete · ? for shortcuts`.
- **Tests**: 15/15 passing (added `step-back` rollback coverage and a `getOrderedItemKeys` ordering assertion).

Verification note: the in-app automation browser runs the tab backgrounded (`visibilityState: hidden`), which pauses `requestAnimationFrame` and stalls the shared Gallery block's Motion `mode="wait"` stage-swap — so selecting the Terminal card from another card doesn't complete in that browser (round 1 worked only because the tab was foreground then). That's an environment limitation of the shared Gallery transition, not the terminal stage. Verified end-to-end by temporarily defaulting the gallery to the terminal card (mounts on initial render via `initial={false}`, no rAF transition needed): split, connect, ASX dashboard, create + Backspace rollback, row highlight via `↑`/`↓`, mascot logo, `claude-fable`, and `~/dev/asx` all confirmed; the temporary default was reverted. Lint (0 errors), typecheck, `verify:file-size`, and 15/15 `node --test` all green.
