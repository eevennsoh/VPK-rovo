# Thermo-Nuclear Code Quality Review - 2026-05-31 Previous Window

## Scope

- Existing report files read first:
  - `docs/thermo-nuclear-code-quality-review-2026-06-21.md`
  - `docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`
- Prior covered windows:
  - `2026-06-14` through `2026-06-21` in the original report.
  - `2026-06-07` through `2026-06-13` in the first previous-window report.
- Oldest covered `mergedAt` date extracted from existing reports: `2026-06-07`.
- This non-overlapping review window: merged PRs targeting `main` from `2026-05-31` through `2026-06-06`.
- Current-main evidence baseline before this report's local remediation edits: `/Users/esoh/Documents/Labs/vpk-rovo` at `feedf4ee5e868ef1460c82ef37297767639c7452` (`origin/main`).
- Requested standard: `thermo-nuclear-code-quality-review`, focused on structural simplification, file-size crossings, spaghetti growth, boundary leaks, duplicated contracts, and canonical ownership.

## Prior Report Extraction

The existing reports already list later merged PRs from `#783` and `#787` through `#1008`, with `#783` merged on `2026-06-07` and `#896` through `#1008` covered by the original `2026-06-21` report. Those PRs were not re-reviewed here.

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- Existing report notes mark the Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, and Agent Card ticket-style extraction as remediated by `#1019`.
- The first previous-window report also records fixes/supersessions for the old `card-directory` path, Agent Card bloat, bare app-token conversion duplication, and several later Agent Browser / PromptInput overlaps.

## Method

- Queried GitHub for merged PRs targeting `main` in `merged:2026-05-31..2026-06-06`.
- The broader GitHub range query missed the high-volume `2026-05-31` day in the first compact output, so `merged:2026-05-31..2026-05-31` was queried separately and folded into the window.
- Split the review into read-only slices across `#517..#632`, `#633..#686`, `#687..#738`, and `#739..#786`, then reconciled those results against current `main`.
- Inspected merged diff stats and current owner files before keeping findings.
- Ignored issues already fixed by later PRs and every PR already listed in the existing reports.

## Executive Summary

This earlier window is mostly the birth of surfaces that later reports saw at full size. The current still-valid problems are not May 31 button-polish nits; they are correctness, ownership, and test-gate gaps that survived into `main`:

1. Markdown source-mode block formatting included the next line when a non-collapsed selection ended exactly on a newline.
2. Stable component tests exist for some real contracts, but the repo JS-unit gate still excludes them unless they are explicitly allowlisted.
3. The original compact Agent work grew into the current 4.8k-line `Agent` owner file.
4. The editor toolbar and rich-text suggestion menu keep duplicate or parallel action/menu models instead of one typed source of truth.
5. RovoCursor still injects identical keyframes once per rendered cursor instance.
6. Studio and trace surfaces still contain route-specific orchestration or render-time state changes that should live behind smaller owners.

## Highest Priority Findings

### 1. Markdown source block formatting includes the next line at trailing-newline selections

- PR: `#541`
- Evidence:
  - `components/ui-custom/rich-text-editor/markdown-format.ts:125` computed block bounds by searching for the next newline from the raw `selectionEnd`.
  - `components/ui-custom/rich-text-editor/markdown-format.test.ts` covered multi-line selections, but not the edge where the selected range ends exactly on `\n`.

Current-main repro before this remediation: applying `bulletList` to `value = "one\ntwo"` with `selectionStart = 0` and `selectionEnd = 4` rewrote both lines to `"- one\n- two"`. The selection visually covers only the first line plus its trailing newline, so formatting the second line is a correctness bug in source mode.

Smallest remediation batch:

- Treat non-collapsed selections ending on `\n` as ending at the previous character for line-bound lookup.
- Add bullet and ordered-list regression tests for trailing-newline selections.

### 2. Stable component contract tests are still outside the JS unit gate

- PRs: `#616`, `#758`, `#764`, `#777`, `#778`, `#786`
- Evidence:
  - `scripts/run-js-unit-tests.mjs:19` documents that `components/` is not included wholesale.
  - `scripts/run-js-unit-tests.mjs:26` defines the explicit component allowlist.
  - `components/screen-assistant/screen-assistant-geometry.test.js:1` is a focused pure helper test for `viewportPointFromTarget`.
  - `components/screen-assistant/use-screen-assistant.ts:255` uses that geometry path for `point_at_target`.

The broad component-test tree is intentionally not CI-gated, but this window added stable tests for pure contracts. Letting those stay excluded weakens the exact regression net the automation PRs were trying to add. The smallest useful remediation is to graduate the pure screen-assistant geometry test into `INCLUDED_TEST_FILES` and leave broad source-grep UI tests out until they are rewritten around stable helpers.

Smallest remediation batch:

- Add `components/screen-assistant/screen-assistant-geometry.test.js` to `INCLUDED_TEST_FILES`.
- Run `node --test components/screen-assistant/screen-assistant-geometry.test.js`.
- Run `pnpm run test:unit:js`, plus lint/typecheck for the repo change.

### 3. The compact Agent work became a 4.8k-line owner file

- PRs: `#615`, `#664`, `#684`, `#777`, `#778`, `#782`
- Current size: `components/blocks/agent/components/agent.tsx` is 4,800 lines.
- Evidence:
  - `components/blocks/agent/components/agent.tsx:207` defines compact nav model data.
  - `components/blocks/agent/components/agent.tsx:315` starts config/reference mapping.
  - `components/blocks/agent/components/agent.tsx:1971` starts `AgentCompactEmptyConfigNav`.
  - `components/blocks/agent/components/agent.tsx:2874` starts `AgentFilledConfigSummary`.
  - `components/blocks/agent/components/agent.tsx:3855` starts the instructions composer path.
  - `components/blocks/agent/components/agent.tsx:4485` starts the exported `AgentConfigFields` owner.

The old `components/ui-custom/agent.tsx` path was later moved, so stale path-only findings are ignored. The current descendant still owns compact nav, filled summaries, rich-text instructions, disabled items, trigger dialog orchestration, reference mapping, tag/chip color policy, and route-facing config fields in one module.

Smallest remediation batch:

- Extract pure config/reference/automation helpers into `components/blocks/agent/lib/config.ts` with focused tests.
- Then extract `AgentCompactEmptyConfigNav` and `AgentFilledConfigSummary` into sibling component modules.
- Keep `components/blocks/agent/index.ts` and the public block API stable.

### 4. Editor toolbar keeps two representations of one action model

- PRs: `#538`, `#541`, `#570`, `#636`, `#646`, `#653`, `#659`, `#661`, `#668`, `#679`
- Current size: `components/blocks/editor-toolbar/components/editor-toolbar.tsx` is 1,084 lines.
- Evidence:
  - `components/blocks/editor-toolbar/components/editor-toolbar.tsx:345` computes responsive folding.
  - `components/blocks/editor-toolbar/components/editor-toolbar.tsx:512` renders folded dropdown actions manually.
  - `components/blocks/editor-toolbar/components/editor-toolbar.tsx:719`, `:821`, and `:1026` render inline groups with repeated labels, icons, handlers, and disabled rules.

The toolbar grew from rich-text markdown/source work and then from the reusable toolbar block. It now has two parallel representations: folded menu actions and inline toolbar groups. That makes every new toolbar action require duplicated behavior and duplicated source-contract expectations.

Smallest remediation batch:

- Introduce typed toolbar action/group descriptors.
- Render inline controls and folded dropdown items from those descriptors.
- Keep layout wrappers and overflow measurement separate from action definition.

### 5. Rich-text suggestion-menu still mixes renderer state machines, positioning, data merging, and row UI

- PRs: `#595`, `#639`, `#666`, `#669`, `#714`, `#717`, `#727`
- Current size: `components/ui-custom/rich-text-editor/suggestion-menu.tsx` is 2,173 lines.
- Evidence:
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:967` starts popup positioning.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1202` builds flat surface rows.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1333` starts the slash renderer state machine.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1720` merges static and caller-provided mention sources.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1931` starts a second mention renderer with parallel active-category and expanded-section state.

This is a shared editor primitive but still owns composer positioning, source merging, flat/nested row construction, Ask Rovo policy, and two similar renderer state machines. The current tests mostly lock source shape rather than exercising a pure model.

Smallest remediation batch:

- Split positioning into `suggestion-menu-positioning.ts`.
- Split pure item/source builders into `suggestion-menu-items.ts`.
- Add node tests for flat/nested item resolution before touching renderer behavior.

### 6. Studio shell absorbed home-starter UI/data and realtime adapter ownership

- PR: `#775`
- Current size: `components/projects/studio/components/rovo-app-shell.tsx` is 5,667 lines.
- Evidence:
  - `components/projects/studio/components/rovo-app-shell.tsx:433` starts `HOME_STARTER_*` data/style policy.
  - `components/projects/studio/components/rovo-app-shell.tsx:1071` starts `HomeStarterBento` state and animation logic.
  - `components/projects/studio/components/rovo-app-shell.tsx:1517` starts realtime adapter types.
  - `components/projects/studio/components/rovo-app-shell.tsx:1721` starts the route shell state/orchestration.

The Studio shell should remain the route orchestrator, but starter data/UI and realtime adapter contracts are independent owners. Keeping them in the shell makes later route changes reason about too much unrelated state.

Smallest remediation batch:

- Move `HOME_STARTER_*` data and `HomeStarterBento` into sibling `home-starters.ts` / `home-starter-bento.tsx` modules.
- Move realtime shell adapter types/helpers into a hook/module.
- Leave shell routing and high-level orchestration in place.

### 7. Assistant thinking trace still mutates state during render

- PRs: `#719`, `#722`, `#734`
- Evidence:
  - `components/projects/shared/components/assistant-thinking-trace.tsx:367` resets override state during render.
  - `components/projects/shared/components/assistant-thinking-trace.tsx:411` updates override state on phase change during render.
  - `components/projects/shared/components/assistant-thinking-trace.tsx:739` prunes manually opened tool-call state during render.

This is correctness and maintainability debt in a React 19 app. The component is projecting trace UI while also changing local state as a render side effect.

Smallest remediation batch:

- Move message-id resets, phase-collapse effects, and stale tool-call pruning into `useEffect` blocks keyed by message id, phase, and tool-call ids.
- Prefer a reducer if the state transitions need to stay atomic.

### 8. Backend Studio agent result mixes tolerant JSON parsing with Studio fallback policy

- PRs: `#723`, `#768`
- Current size: `backend/lib/studio-agent-result.js` is 1,241 lines.
- Evidence:
  - `backend/lib/studio-agent-result.js:277` through `:555` implement tolerant/backtracking JSON parsing.
  - `backend/lib/studio-agent-result.js:578` starts marker/fenced/bare extraction.
  - `backend/lib/studio-agent-result.js:695` starts fallback clarification/prompt policy.
  - `backend/lib/studio-agent-result.js:1139` starts creation-mode prompt prefix handling.

The parser is a generic boundary tool, but it lives inside a Studio product-policy module. Parser changes and fallback-agent behavior should not share the same owner file.

Smallest remediation batch:

- Extract tolerant parser/object-boundary helpers into `backend/lib/tolerant-json-object.js` with focused tests.
- Keep compatibility exports in `studio-agent-result.js`.
- Defer fallback-policy extraction unless the parser split stays clean.

### 9. Floating Rovo button geometry is trapped in a large React owner and tested by source shape

- PR: `#697`
- Evidence:
  - `components/projects/shared/components/floating-rovo-button.tsx:161` starts pure geometry.
  - `components/projects/shared/components/floating-rovo-button.tsx:786` starts the React state-machine surface.
  - `components/projects/page.test.js:182` checks implementation text rather than numeric positioning behavior.

The geometry is small enough to extract and test deterministically without touching the visual component.

Smallest remediation batch:

- Extract `floating-rovo-button-positioning.ts` for snap/clamp/container math.
- Replace source-shape assertions with numeric `node:test` cases.

### 10. RovoCursor injects identical keyframes per instance

- PR: `#549`
- Evidence:
  - `components/ui-custom/rovo-cursor.tsx:56` defines the shared `KEYFRAMES` string.
  - `components/ui-custom/rovo-cursor.tsx:186` renders that string through `<style dangerouslySetInnerHTML=...>` inside every `RovoCursor`.
  - Current callsites include `components/projects/studio/components/clicky/clicky-cursor.tsx:72` and `components/projects/studio/components/rovo-cursor-onboarding-tour.tsx:515`.

This is not a correctness bug, but it is still-valid maintainability debt in a shared primitive. Animation definitions should live once in global CSS or an owned utility layer, not be injected repeatedly by each visual instance.

Smallest remediation batch:

- Move the cursor keyframes to the global CSS/Tailwind utility layer.
- Keep `RovoCursor` responsible only for state-to-markup rendering.
- Add a focused source contract that rejects `dangerouslySetInnerHTML` in this primitive.

## Skipped Because Already Reviewed Or Fixed

- `#783` merged on `2026-06-07`, outside this non-overlapping window, and is already listed in `docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`.
- `#527` and `#528` were closed/unmerged, so they are not part of the merged-main window.
- `#776` and `#781` were closed/unmerged or stacked outside the merged-main window, so they are not part of this review.
- `#709` was not returned as a merged PR targeting `main` in this date window.
- `#613` introduced a `text-box-trim` risk that `#619` already reverted; current `app/globals.css` no longer contains `text-box-trim` or `text-box-edge`.
- `#603` / `#612` Skills Directory growth was later reduced; current `components/blocks/skills-directory/components/skills-directory.tsx` is below the earlier peak and uses `EntityCardSkillCard`.
- `#649` / `#663` Knowledge Directory growth was later absorbed; current `components/blocks/knowledge-directory/components/knowledge-directory.tsx` is 594 lines.
- Old findings against `components/ui-custom/agent.tsx` were ignored because the file was removed/moved; only the current `components/blocks/agent/components/agent.tsx` owner remains in findings.
- `#759` and `#786` fixed their immediate compact-nav hidden-field guard regressions; the remaining issue is the broader component-test CI allowlist gap.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #517 | Add scratch scribble trace to studio composer | 2026-05-31T00:05:57Z | Reviewed, no high-conviction finding |
| #518 | Refine scratch scribble trace and hover state | 2026-05-31T00:20:07Z | Reviewed, no high-conviction finding |
| #519 | Polish agent template cards | 2026-05-31T00:20:52Z | Reviewed, no high-conviction finding |
| #520 | Shrink scratch scribble and tuck under word | 2026-05-31T00:34:40Z | Reviewed, no high-conviction finding |
| #521 | Darken studio composer submit button | 2026-05-31T00:35:41Z | Reviewed, no high-conviction finding |
| #522 | Trigger scratch reveal on hover with grace delay | 2026-05-31T01:10:28Z | Reviewed, no high-conviction finding |
| #523 | Fix nav button label growth animation on refresh | 2026-05-31T01:11:02Z | Reviewed, no high-conviction finding |
| #524 | Animate agent template tab changes | 2026-05-31T02:06:31Z | Reviewed, no high-conviction finding |
| #525 | Remove card directory selected hover border | 2026-05-31T02:06:52Z | Reviewed, no high-conviction finding |
| #526 | Add responsive overflow menu to top navigation | 2026-05-31T05:41:49Z | Reviewed, no high-conviction finding |
| #529 | Add Avatar company/project creator badges with hexagon overlay fix | 2026-05-31T08:17:42Z | Reviewed, no high-conviction finding |
| #530 | [Automation] Bug scan: unclip agent avatar overlays | 2026-05-31T20:57:15Z | Reviewed, no high-conviction finding |
| #531 | Sequence agent template tab swaps with exit-then-enter | 2026-05-31T16:22:11Z | Reviewed, no high-conviction finding |
| #532 | Update Studio agent templates | 2026-05-31T16:56:29Z | Reviewed, no high-conviction finding |
| #533 | Crossfade agent template tab swaps to remove blank gap | 2026-05-31T16:59:18Z | Reviewed, no high-conviction finding |
| #534 | Make agent templates carousel cards full-bleed on scroll | 2026-05-31T17:10:01Z | Reviewed, no high-conviction finding |
| #535 | Polish Studio agent config | 2026-05-31T18:48:43Z | Reviewed, no high-conviction finding |
| #536 | Polish Studio agent config controls | 2026-05-31T19:25:36Z | Reviewed, no high-conviction finding |
| #537 | Remove gap between nested sidebar nav items | 2026-05-31T18:52:32Z | Reviewed, no high-conviction finding |
| #538 | Add Markdown source toggle to rich text editor | 2026-05-31T19:10:34Z | Finding: editor toolbar action model |
| #539 | Keep more-actions button visible while its menu is open | 2026-05-31T19:21:23Z | Reviewed, no high-conviction finding |
| #540 | Fix navigation menu dropdown layout | 2026-05-31T19:53:11Z | Reviewed, no high-conviction finding |
| #541 | Apply Markdown syntax from toolbar in source mode | 2026-05-31T19:50:36Z | Finding/remediated: Markdown trailing-newline formatting; toolbar action model remains |
| #542 | Polish menu component styling | 2026-05-31T20:04:33Z | Reviewed, no high-conviction finding |
| #543 | Add accordion behavior to studio Agents sidebar item | 2026-05-31T20:07:26Z | Reviewed, no high-conviction finding |
| #544 | [Automation] Interface contract audit: agent URL origin preservation | 2026-05-31T20:59:17Z | Reviewed, no high-conviction finding |
| #545 | Register Context Bar component in docs site | 2026-05-31T20:16:45Z | Reviewed, no high-conviction finding |
| #546 | Stagger agent template tab card entrance | 2026-05-31T20:16:33Z | Reviewed, no high-conviction finding |
| #547 | Fix menubar item layout | 2026-05-31T20:24:38Z | Reviewed, no high-conviction finding |
| #548 | Update agent template cards | 2026-05-31T21:01:19Z | Reviewed, no high-conviction finding |
| #549 | Refresh RovoCursor with rainbow stroke + reusable spinner variant | 2026-05-31T20:55:29Z | Finding: RovoCursor keyframes per instance |
| #550 | Fix card directory hover shadow clipping and hexagon avatar border | 2026-05-31T21:30:20Z | Reviewed, no high-conviction finding |
| #551 | Fix RovoCursor stroke clipping, drop caret, harden spinner stops | 2026-05-31T21:32:28Z | Reviewed, no high-conviction finding |
| #552 | Fix sidebar nav item leading icon size and row gap | 2026-05-31T21:38:47Z | Reviewed, no high-conviction finding |
| #553 | Fix Speaking bars radius by flooring animated height at bar width | 2026-05-31T21:43:53Z | Reviewed, no high-conviction finding |
| #554 | Restore static caret stick beneath the typing microphone badge | 2026-05-31T21:50:14Z | Reviewed, no high-conviction finding |
| #555 | Shrink Typing badge so the ring hugs the microphone icon | 2026-05-31T21:56:00Z | Reviewed, no high-conviction finding |
| #556 | Apply size=small to agents accordion chevron | 2026-05-31T21:57:47Z | Reviewed, no high-conviction finding |
| #557 | Default RovoCursor demo to 16px | 2026-05-31T22:00:58Z | Reviewed, no high-conviction finding |
| #558 | Render RovoCursor loading state at the full size prop | 2026-05-31T22:05:42Z | Reviewed, no high-conviction finding |
| #559 | Center Speaking bars in a 16x16 box | 2026-05-31T22:11:03Z | Reviewed, no high-conviction finding |
| #560 | Fix Typing caret stick to a constant 1x16 | 2026-05-31T22:15:41Z | Reviewed, no high-conviction finding |
| #561 | Use project avatar badge fallback | 2026-05-31T22:16:35Z | Reviewed, no high-conviction finding |
| #562 | Size Typing mic via atlaskit size=small and grow badge to 16u | 2026-05-31T22:21:23Z | Reviewed, no high-conviction finding |
| #563 | Use equal 25% bands for the rainbow spinner gradient | 2026-05-31T22:26:04Z | Reviewed, no high-conviction finding |
| #564 | Bump remotion from 4.0.468 to 4.0.470 in the npm-minor-and-patch group | 2026-06-03T09:02:53Z | Reviewed, no high-conviction finding |
| #565 | Grow Typing badge to 20u with 4u padding around the 12px mic | 2026-05-31T23:00:17Z | Reviewed, no high-conviction finding |
| #566 | Collapse overflowing skill tags | 2026-05-31T23:01:44Z | Reviewed, no high-conviction finding |
| #567 | Match strategy-agents banner to avatar accent color | 2026-05-31T23:01:26Z | Reviewed, no high-conviction finding |
| #568 | Fix weird hexagon avatar border in card directory banner | 2026-05-31T23:02:02Z | Reviewed, no high-conviction finding |
| #569 | Align studio bento tile content with agent template directory | 2026-05-31T23:02:19Z | Reviewed, no high-conviction finding |
| #570 | Polish rich text toolbar | 2026-05-31T23:13:37Z | Finding: editor toolbar action model |
| #571 | Resize Studio agent avatar | 2026-05-31T23:21:32Z | Reviewed, no high-conviction finding |
| #572 | Sit card banner hexagon ring on the avatar edge | 2026-05-31T23:23:07Z | Reviewed, no high-conviction finding |
| #573 | Diversify capability icons across agent template tiles | 2026-05-31T23:42:02Z | Reviewed, no high-conviction finding |
| #574 | Randomize template collaborator stacks | 2026-06-01T00:05:25Z | Reviewed, no high-conviction finding |
| #575 | Use VPK tag pills and hover add CTA in agent config | 2026-05-31T23:49:48Z | Reviewed, no high-conviction finding |
| #576 | Randomize project avatar badge fallbacks | 2026-05-31T23:54:26Z | Reviewed, no high-conviction finding |
| #577 | Polish studio agent fields and hero source display | 2026-06-01T02:05:27Z | Reviewed, no high-conviction finding |
| #578 | Use flexbox for agent config layout spacing | 2026-06-01T02:21:31Z | Reviewed, no high-conviction finding |
| #579 | Hug agent template card height to its content | 2026-06-01T02:12:42Z | Reviewed, no high-conviction finding |
| #580 | Hide agent config chat header | 2026-06-01T02:27:34Z | Reviewed, no high-conviction finding |
| #581 | Add animated collapse and overflow to context bar | 2026-06-01T02:42:45Z | Reviewed, no high-conviction finding |
| #582 | Fix agent template dialog carousel spacing | 2026-06-01T02:54:59Z | Reviewed, no high-conviction finding |
| #583 | Limit home tile skills to 2 rows with overflow | 2026-06-01T03:22:45Z | Reviewed, no high-conviction finding |
| #584 | Fix context bar morph distortion and add blur | 2026-06-01T03:46:14Z | Reviewed, no high-conviction finding |
| #585 | Add agent config test tabs | 2026-06-01T03:50:47Z | Later flow changes supersede |
| #586 | Reveal agent chip remove button on hover | 2026-06-01T04:18:47Z | Reviewed, no high-conviction finding |
| #587 | Fix studio bento tab-transition leak through gradient fade | 2026-06-01T04:19:36Z | Reviewed, no high-conviction finding |
| #588 | Add compact agent layout variation | 2026-06-01T04:35:53Z | Reviewed, no separate current issue |
| #589 | Align template skill rows | 2026-06-01T04:26:47Z | Reviewed, no high-conviction finding |
| #590 | Gate conversation bottom fade on scroll position | 2026-06-01T04:35:37Z | Reviewed, no high-conviction finding |
| #591 | Add overlay remove variant to Tag | 2026-06-01T04:48:38Z | Reviewed, no high-conviction finding |
| #592 | Refine context bar hover transition and overflow menu | 2026-06-01T04:49:47Z | Reviewed, no high-conviction finding |
| #593 | Fix Tag overlay remove gradient using opaque surface token | 2026-06-01T05:18:42Z | Reviewed, no high-conviction finding |
| #594 | Fix directory card hover border with fading pseudo-border | 2026-06-01T05:22:53Z | Reviewed, no high-conviction finding |
| #595 | Add editor palette block with mention sources | 2026-06-01T05:22:34Z | Finding: suggestion-menu ownership |
| #596 | Square context bar overflow button and align menu | 2026-06-01T05:23:31Z | Reviewed, no high-conviction finding |
| #597 | Separate agent test panel | 2026-06-01T05:38:25Z | Reviewed, no high-conviction finding |
| #598 | Add compact agent demo states | 2026-06-01T05:52:00Z | Reviewed, no separate current issue |
| #599 | Align Tag overlay remove button right gap with top/bottom | 2026-06-01T05:52:57Z | Reviewed, no high-conviction finding |
| #600 | Fix invalid OpenAI Realtime model name | 2026-06-01T05:59:54Z | Reviewed, no high-conviction finding |
| #601 | Fix stray horizontal scrollbar in context bar overflow | 2026-06-01T06:01:04Z | Reviewed, no high-conviction finding |
| #602 | Register editor-palette block in component manifest | 2026-06-01T06:17:38Z | Reviewed, no high-conviction finding |
| #603 | Redesign skills directory as Browse skills dialog | 2026-06-01T06:34:29Z | Later reduced/refactored |
| #604 | Fix expanded directory card skill-tag clipping | 2026-06-01T07:12:34Z | Reviewed, no high-conviction finding |
| #605 | Refresh tools and agents directories | 2026-06-01T07:28:31Z | Reviewed, no high-conviction finding |
| #606 | Animate agent inline edit hover padding | 2026-06-01T07:29:41Z | Reviewed, no high-conviction finding |
| #607 | Fill studio bento tile descriptions to available space | 2026-06-01T10:51:30Z | Reviewed, no high-conviction finding |
| #608 | Restyle command menu shortcuts as muted hints | 2026-06-01T10:52:28Z | Reviewed, no high-conviction finding |
| #609 | Polish menubar menu spacing and label styles | 2026-06-01T10:52:50Z | Reviewed, no high-conviction finding |
| #610 | Add Rovo chat launcher to studio agent config screen | 2026-06-01T12:43:45Z | Reviewed, no high-conviction finding |
| #611 | Add isolated screen-assistant sandbox utils | 2026-06-01T12:45:31Z | Partly fixed by #616 |
| #612 | Refresh skills directory modal | 2026-06-01T12:49:22Z | Later reduced/refactored |
| #613 | Adopt modern CSS properties for UI polish | 2026-06-01T14:37:42Z | Fixed by #619 |
| #614 | Add smart, template-aware questions to Studio agent creation | 2026-06-01T14:42:07Z | Reviewed, no high-conviction finding |
| #615 | Add compact agent experience | 2026-06-01T16:56:52Z | Finding: Agent owner file |
| #616 | [Automation] Test coverage: screen assistant target geometry | 2026-06-02T02:45:26Z | Finding: JS unit gate gap |
| #617 | Migrate button size variants | 2026-06-01T22:20:41Z | Mechanical migration, no finding |
| #618 | Use compact Studio agent config | 2026-06-01T22:09:14Z | Reviewed, no high-conviction finding |
| #619 | Revert text-box-trim to fix clipped descenders | 2026-06-01T22:36:51Z | Fix confirmed current |
| #620 | Hide empty config rows in compact agent toolbar | 2026-06-01T22:40:33Z | Reviewed, no separate current issue |
| #621 | Stop pinning selected agent to top of recent nav list | 2026-06-01T22:41:30Z | Reviewed, no high-conviction finding |
| #622 | Fix Studio Agents sidebar collapse | 2026-06-01T23:02:42Z | Reviewed, no high-conviction finding |
| #623 | Remove Awake card corner dots | 2026-06-01T23:18:35Z | Reviewed, no high-conviction finding |
| #624 | Improve Studio Ask Rovo agent-edit flow | 2026-06-01T23:27:49Z | Reviewed, no high-conviction finding |
| #625 | Animate Edit agent pill close back to greeting | 2026-06-01T23:49:02Z | Reviewed, no high-conviction finding |
| #626 | Fit blank agent config and align hero bento tile | 2026-06-01T23:50:20Z | Reviewed, no high-conviction finding |
| #627 | Sync Studio agent display names | 2026-06-01T23:54:05Z | Reviewed, no high-conviction finding |
| #628 | Replace capability icon tile with plain 16px icon | 2026-06-02T00:14:44Z | Reviewed, no high-conviction finding |
| #629 | Shorten agent-edit greeting heading copy | 2026-06-02T00:18:36Z | Reviewed, no high-conviction finding |
| #630 | Switch AgentHeader actions to Configure/Test tabs | 2026-06-02T00:22:48Z | Reviewed, no high-conviction finding |
| #631 | Keep Personal Graph source actions visible | 2026-06-02T00:29:36Z | Reviewed, no high-conviction finding |
| #632 | Anchor blank agent bento to bottom and fit the viewport | 2026-06-02T00:38:34Z | Reviewed, no high-conviction finding |
| #633 | Use size=small prop and subtlest tone for capability icons | 2026-06-02T00:40:53Z | Reviewed, no high-conviction finding |
| #634 | Open agent config pane when restoring agent from URL | 2026-06-02T00:42:36Z | Reviewed, no high-conviction finding |
| #635 | Release pinned sidebar at small viewports | 2026-06-02T00:56:42Z | Reviewed, no high-conviction finding |
| #636 | Add reusable editor toolbar block | 2026-06-02T00:59:51Z | Finding: editor toolbar action model |
| #637 | Reveal full capability label in tooltip on hover | 2026-06-02T01:16:18Z | Reviewed, no high-conviction finding |
| #638 | Add traced templates hint above the agent bento | 2026-06-02T01:31:21Z | Reviewed, no high-conviction finding |
| #639 | Enhance editor palette menus | 2026-06-02T01:38:00Z | Finding: suggestion-menu ownership |
| #640 | Stop a worktree's dev servers via canonical helper in vpk-git-clean | 2026-06-02T01:39:46Z | Reviewed, no high-conviction finding |
| #641 | Use Rovo rainbow SVG tracing for the bento templates hint arrow | 2026-06-02T02:03:05Z | Reviewed, no high-conviction finding |
| #642 | Hide agent editor composer controls | 2026-06-02T02:51:38Z | Reviewed, no high-conviction finding |
| #643 | Swap AgentHeader default tabs for compact ToggleGroup | 2026-06-02T02:51:53Z | Reviewed, no high-conviction finding |
| #644 | Anchor capability tooltip to the right side | 2026-06-02T02:52:31Z | Reviewed, no high-conviction finding |
| #645 | Remove agent partial banner | 2026-06-02T02:53:17Z | Reviewed, no high-conviction finding |
| #646 | Include editor toolbar markdown toggle | 2026-06-02T03:03:45Z | Finding: editor toolbar action model |
| #647 | Hide edit agent Rovo controls | 2026-06-02T03:12:35Z | Reviewed, no high-conviction finding |
| #648 | Use Studio scribble underline for the bento templates hint | 2026-06-02T03:13:26Z | Reviewed, no high-conviction finding |
| #649 | Add knowledge directory block | 2026-06-02T03:29:48Z | Fixed/absorbed later |
| #650 | Add experimental dark composer CTAs | 2026-06-02T03:47:52Z | Reviewed, no high-conviction finding |
| #651 | Add dismissible "Not now" link to the bento templates hint | 2026-06-02T03:54:31Z | Reviewed, no high-conviction finding |
| #652 | Swap Studio agent config header to compact ToggleGroup | 2026-06-02T04:43:31Z | Reviewed, no high-conviction finding |
| #653 | Add editor toolbar plus control | 2026-06-02T04:47:22Z | Finding: editor toolbar action model |
| #654 | Hide custom agent edit context bar | 2026-06-02T04:48:39Z | Reviewed, no high-conviction finding |
| #655 | Move Update next to Configure/Test toggle in Studio header | 2026-06-02T05:12:30Z | Reviewed, no high-conviction finding |
| #656 | Use small icons in ToggleGroup sort demo | 2026-06-02T05:14:07Z | Reviewed, no high-conviction finding |
| #657 | Fix top navigation responsive layout and alignment | 2026-06-02T05:14:29Z | Reviewed, no high-conviction finding |
| #658 | Stop studio sidebar chrome animating on page load | 2026-06-02T05:24:52Z | Reviewed, no high-conviction finding |
| #659 | Move editor toolbar mode switch to tabs | 2026-06-02T05:31:49Z | Finding: editor toolbar action model |
| #660 | Style Tiptap editor as GitHub-flavored markdown | 2026-06-02T05:40:11Z | Reviewed, no high-conviction finding |
| #661 | Make editor toolbar mode tabs icon-only | 2026-06-02T05:53:35Z | Finding: editor toolbar action model |
| #662 | Stop top-nav controls sliding on page load | 2026-06-02T05:54:59Z | Reviewed, no high-conviction finding |
| #663 | Redesign knowledge directory flow | 2026-06-02T05:58:08Z | Fixed/absorbed later |
| #664 | Redesign agent compact config toolbar | 2026-06-02T06:42:58Z | Finding: Agent owner file |
| #665 | Use ADS text normal icon glyph | 2026-06-02T06:09:33Z | Reviewed, no high-conviction finding |
| #666 | Expand markdown options in editor toolbar and palette | 2026-06-02T06:14:51Z | Findings: toolbar and suggestion menu |
| #667 | Fix search header layout in Rovo and Studio shells | 2026-06-02T06:21:33Z | Reviewed, no high-conviction finding |
| #668 | Complete editor toolbar markdown coverage | 2026-06-02T06:39:45Z | Finding: editor toolbar action model |
| #669 | Restructure editor @ and / command menus | 2026-06-02T06:57:56Z | Finding: suggestion-menu ownership |
| #670 | Use compact header nav in Studio agent config | 2026-06-02T06:44:59Z | Reviewed, no high-conviction finding |
| #671 | Polish Studio agent trace | 2026-06-02T06:56:31Z | Reviewed, no high-conviction finding |
| #672 | Drop Update button; add Publish to AgentHeader default | 2026-06-02T08:15:33Z | Reviewed, no high-conviction finding |
| #673 | Fix bento tile truncation and add small-screen carousel | 2026-06-02T08:18:37Z | Reviewed, no high-conviction finding |
| #674 | Fix Studio/Rovo nav refresh flashes and search gap | 2026-06-02T12:48:01Z | Reviewed, no high-conviction finding |
| #675 | Lay out agent config bento tiles in a single row | 2026-06-02T12:47:41Z | Reviewed, no high-conviction finding |
| #676 | Add bottom fade to small-screen bento carousel | 2026-06-02T13:03:36Z | Reviewed, no high-conviction finding |
| #677 | Expand empty agent config panel | 2026-06-02T13:12:04Z | Reviewed, no high-conviction finding |
| #678 | Let shell search fill freed width instead of capping at 762px | 2026-06-02T13:38:46Z | Reviewed, no high-conviction finding |
| #679 | Expose code block, horizontal rule, table in editor toolbar; repurpose + menu for reference inserts | 2026-06-02T13:46:30Z | Finding: editor toolbar action model |
| #680 | Inline colored Rovo logo, drop public svg asset | 2026-06-02T13:54:39Z | Reviewed, no high-conviction finding |
| #681 | Polish agent template panel | 2026-06-02T14:21:38Z | Reviewed, no high-conviction finding |
| #682 | Fit collapsed nav chrome so search fills the empty space | 2026-06-02T14:23:56Z | Reviewed, no high-conviction finding |
| #683 | Join Studio Configure/Test toggle when Test is disabled | 2026-06-02T14:34:45Z | Reviewed, no high-conviction finding |
| #684 | Give agent memory its own config row | 2026-06-02T14:45:29Z | Finding: Agent owner file |
| #685 | [Automation] Bug scan: Fix bento carousel listener remount | 2026-06-02T17:41:32Z | Reviewed, no high-conviction finding |
| #686 | Reveal agent compact bento tile descriptions | 2026-06-02T15:14:44Z | Reviewed, no high-conviction finding |
| #687 | Order agent config rows by canonical sequence | 2026-06-02T15:45:43Z | Fixed later: old `components/ui-custom/agent.tsx` removed |
| #688 | Replace atlassian.svg with ADS Atlassian logo component | 2026-06-02T15:59:55Z | Reviewed, no high-conviction finding |
| #689 | Refine editor toolbar icons and add Memory reference | 2026-06-02T16:03:44Z | Reviewed, no high-conviction finding |
| #690 | Add Marketplace partner logos to public/2p | 2026-06-02T16:20:00Z | Reviewed, no high-conviction finding |
| #691 | Hide agent bento tile bottom border on hover | 2026-06-02T16:20:42Z | Fixed later: old agent surface removed |
| #692 | Refine directory cards and sidebars | 2026-06-02T16:56:42Z | Reviewed, no high-conviction finding |
| #693 | Show clarification step in Studio agent-creation trace | 2026-06-02T16:46:51Z | Reviewed, no high-conviction finding |
| #694 | Ignore Rovo worktrees under .rovo/worktrees | 2026-06-02T16:54:41Z | Reviewed, no high-conviction finding |
| #695 | Move Memory to the bottom of the + reference menu | 2026-06-02T17:00:49Z | Reviewed, no high-conviction finding |
| #696 | Stop agent bento wrapper collapsing so tile descriptions stay visible | 2026-06-02T17:03:42Z | Fixed later: old agent surface removed |
| #697 | Fix Rovo button drag snap | 2026-06-02T17:21:50Z | Finding: Floating Rovo geometry |
| #698 | Add subagents config switcher | 2026-06-02T17:20:45Z | Fixed later: subagent delete flow simplified |
| #699 | Reserve bento section height so config toolbar no longer overlaps tiles | 2026-06-02T17:29:25Z | Fixed later: old agent surface removed |
| #700 | Remove Hermes memory activity card from chat shells | 2026-06-02T17:39:32Z | Reviewed, no high-conviction finding |
| #701 | [Automation] Performance audit: map Personal Graph neighbors | 2026-06-02T17:43:26Z | Reviewed, no high-conviction finding |
| #702 | Shrink empty-state instructions box so agent config fits without viewport scroll | 2026-06-02T17:53:10Z | Fixed later: old agent surface removed |
| #703 | Fix directory UI: dropdown width, avatar sizing, company logos, tile text sizes | 2026-06-02T18:07:36Z | Reviewed, no high-conviction finding |
| #704 | Polish directory sidebar logo size and card metadata | 2026-06-02T18:24:47Z | Reviewed, no high-conviction finding |
| #705 | Add brainstorm Rovo illustration | 2026-06-02T19:34:34Z | Reviewed, no high-conviction finding |
| #706 | Polish Studio agent config | 2026-06-02T20:09:53Z | Reviewed, later-heavy surface, no slice finding |
| #707 | Render table statuses with lozenges | 2026-06-02T20:18:42Z | Reviewed, no high-conviction finding |
| #708 | Polish table previews and widths | 2026-06-02T21:39:22Z | Reviewed, no high-conviction finding |
| #710 | Polish Studio agent config | 2026-06-02T21:43:50Z | Reviewed, later-heavy surface, no slice finding |
| #711 | Add Studio custom agents table | 2026-06-02T21:50:01Z | Reviewed, no high-conviction finding |
| #712 | Align custom agents table width | 2026-06-02T22:19:57Z | Reviewed, no high-conviction finding |
| #713 | Keep compact agent footer sticky | 2026-06-02T22:20:52Z | Fixed later: old agent surface removed |
| #714 | Nest slash format commands | 2026-06-02T22:22:46Z | Finding: suggestion-menu ownership |
| #715 | Polish generated agent flow | 2026-06-02T22:25:49Z | Reviewed, no high-conviction finding |
| #716 | Polish studio agents landing: table, scroll, carousel | 2026-06-02T23:04:46Z | Reviewed, no high-conviction finding |
| #717 | Polish editor palette menus | 2026-06-02T23:40:40Z | Finding: suggestion-menu ownership |
| #718 | Preserve Studio agent creation mode | 2026-06-03T06:07:37Z | Reviewed, no high-conviction finding |
| #719 | Fix Studio agent clarification reloads | 2026-06-03T08:24:41Z | Finding: assistant trace render state |
| #720 | Fix sidebar action label truncation | 2026-06-03T08:27:30Z | Reviewed, no high-conviction finding |
| #721 | Fix Studio agent table selection | 2026-06-03T09:42:03Z | Reviewed, no high-conviction finding |
| #722 | Overlap chain-of-thought tool step transitions | 2026-06-03T10:23:58Z | Finding: assistant trace render state |
| #723 | Recover malformed AGENT_RESULT JSON in Studio agent creation | 2026-06-03T10:25:40Z | Finding: backend parser ownership |
| #724 | Show agent tabs in Studio Ask Rovo sidebar chat | 2026-06-03T12:30:46Z | Reviewed, no high-conviction finding |
| #725 | Add Triggers block and progress-tracker activity demo | 2026-06-03T12:46:34Z | Later trigger rewrites dominate; no PR-owned finding |
| #726 | Center agent test chat | 2026-06-03T12:58:44Z | Reviewed, no high-conviction finding |
| #727 | Sync agent reference mentions | 2026-06-03T18:59:50Z | Finding: suggestion-menu ownership |
| #728 | Add agent data flow diagram tab | 2026-06-03T17:08:45Z | Reviewed, no high-conviction finding |
| #729 | Add conversation starters block and wire into agent config | 2026-06-03T18:34:43Z | Reviewed, no high-conviction finding |
| #730 | Reclaim .next per-worktree in vpk-system-clean sweep | 2026-06-03T19:36:51Z | Reviewed, no high-conviction finding |
| #731 | [Automation] Interface contract audit: Studio data-flow config | 2026-06-03T20:36:30Z | Reviewed, no high-conviction finding |
| #732 | Fix top nav sidebar offset | 2026-06-03T20:18:00Z | Reviewed, no high-conviction finding |
| #733 | Fix empty project shell: render TopNavigation as header, not full studio shell | 2026-06-03T20:35:49Z | Reviewed, no high-conviction finding |
| #734 | Show studio agent-creation progression as per-row accordions | 2026-06-03T20:29:14Z | Finding: assistant trace render state |
| #735 | Add tag front logo demo | 2026-06-03T20:33:04Z | Reviewed, no high-conviction finding |
| #736 | Add Tag component demos and variant wiring | 2026-06-03T20:38:00Z | Reviewed, no high-conviction finding |
| #737 | Fix studio agent delete linger and scope composer CTA | 2026-06-03T22:15:43Z | Reviewed, no high-conviction finding |
| #738 | Retry AI Gateway calls on transient 429/503 so Studio agent creation survives quota breaches | 2026-06-03T22:17:37Z | Reviewed, no high-conviction finding |
| #739 | Fix Tiptap toolbar collapse | 2026-06-03T22:19:45Z | Reviewed, no high-conviction finding |
| #740 | Flatten agent data-flow diagram to one container; vertical mermaid | 2026-06-03T22:24:03Z | Reviewed, no high-conviction finding |
| #741 | Align directory mention tags | 2026-06-03T22:34:47Z | Reviewed, no high-conviction finding |
| #742 | [Automation] Code simplification: agent data-flow dedupe helper | 2026-06-04T06:48:56Z | Reviewed, no high-conviction finding |
| #743 | Add telepointer cursor state and tooltip-style bubble | 2026-06-04T00:25:49Z | Reviewed, no high-conviction finding |
| #744 | Align skill menu icon tiles | 2026-06-04T00:25:14Z | Reviewed, no high-conviction finding |
| #745 | Size and center agent data-flow diagram; align refining label | 2026-06-04T01:00:38Z | Reviewed, no high-conviction finding |
| #746 | Size tag avatars to 12px and neutralize context-bar tag | 2026-06-04T01:01:41Z | Reviewed, no high-conviction finding |
| #747 | fix(test-chat): narrow agent greeting to 600px and align last prompt | 2026-06-04T01:14:32Z | Reviewed, no high-conviction finding |
| #748 | Correct subagents prompt model | 2026-06-04T01:22:17Z | Reviewed, no high-conviction finding |
| #749 | Polish agent config labels, chips, and composer placeholder | 2026-06-04T02:57:34Z | Reviewed, no high-conviction finding |
| #750 | feat(studio): split agent creation into two-turn thinking traces | 2026-06-04T03:10:48Z | Reviewed, no high-conviction finding |
| #751 | Polish directory detail controls | 2026-06-04T03:13:50Z | Reviewed, no high-conviction finding |
| #752 | Fix Rovo button demo positioning | 2026-06-04T03:14:09Z | Reviewed, no high-conviction finding |
| #753 | Extract presentational List ui-custom component | 2026-06-04T04:24:31Z | Reviewed, no high-conviction finding |
| #754 | Refine studio agent UI and extract subagent prompt fields | 2026-06-04T04:35:59Z | Reviewed, no high-conviction finding |
| #755 | Show Studio agent cards | 2026-06-04T06:44:46Z | Reviewed, no high-conviction finding |
| #756 | Add Ask Rovo slash entry | 2026-06-04T05:32:48Z | Reviewed, no high-conviction finding |
| #757 | Fix lingering 'Agent creation' ghost on delete + clarify backend-down error | 2026-06-04T06:43:36Z | Reviewed, no high-conviction finding |
| #758 | Extend agent trigger editor | 2026-06-04T13:45:20Z | Finding: component-test gate gap |
| #759 | [Automation] Bug scan: Fix compact nav hidden-field guard | 2026-06-04T15:16:15Z | Immediate fix kept; residual test-gate gap |
| #760 | Add agent Evaluation screen (datasets + evaluations) | 2026-06-04T18:15:48Z | Reviewed, no high-conviction finding |
| #761 | Add agent Users screen block | 2026-06-04T18:20:39Z | Reviewed, no high-conviction finding |
| #762 | Add compact agent surfaces screen | 2026-06-04T18:43:06Z | Reviewed, no high-conviction finding |
| #763 | Add agent insights dashboard | 2026-06-05T00:54:49Z | Reviewed, no high-conviction finding |
| #764 | [Automation] Test coverage: Agent access permissions | 2026-06-05T05:13:15Z | Finding: component-test gate gap |
| #765 | Wire Users tab to render the Users screen in agent config | 2026-06-05T03:27:35Z | Reviewed, no high-conviction finding |
| #766 | Wire Evaluation compact-nav tab to the Evaluation screen | 2026-06-05T03:38:52Z | Reviewed, no high-conviction finding |
| #767 | Fix duplicate agent selector command values | 2026-06-05T05:13:31Z | Reviewed, no high-conviction finding |
| #768 | Add agent triggers rule-builder dialog and knowledge component | 2026-06-05T05:16:18Z | Finding: backend parser ownership |
| #769 | Fix CardDirectory nested-interactive a11y (role=button overlay) | 2026-06-05T05:31:51Z | Reviewed, no high-conviction finding |
| #770 | Add mined recurring-correction rules to AGENTS.md | 2026-06-05T05:50:06Z | Reviewed, no high-conviction finding |
| #771 | Move subagents to slash menu | 2026-06-06T09:38:40Z | Reviewed, no high-conviction finding |
| #772 | Fix Rovo gallery preview | 2026-06-06T09:54:06Z | Reviewed, no high-conviction finding |
| #773 | Unify tag front slot and avatar slot styling | 2026-06-06T10:07:33Z | Reviewed, no high-conviction finding |
| #774 | Remove onboarding bento from Studio agent-creation flow | 2026-06-06T10:07:53Z | Superseded by #775 for current state |
| #775 | Restore Studio landing bento; remove from-scratch agent-config template tiles | 2026-06-06T10:47:08Z | Finding: Studio shell ownership |
| #777 | Add agent section blocks | 2026-06-06T17:00:52Z | Finding: Agent owner file and component-test gate gap |
| #778 | Move agent component to blocks | 2026-06-06T17:40:36Z | Finding: Agent owner file and component-test gate gap |
| #779 | [Automation] Performance audit: index memory explorer filters | 2026-06-06T19:58:26Z | Reviewed, no high-conviction finding |
| #780 | Restore agent block preview | 2026-06-06T18:01:19Z | Reviewed, no high-conviction finding |
| #782 | Restore agent block demo experience | 2026-06-06T19:46:36Z | Finding: Agent owner file and component-test gate gap |
| #784 | Add Bklit UI charts catalog | 2026-06-06T20:32:01Z | Reviewed, no high-conviction finding |
| #785 | [Automation] Code simplification: original brief loop | 2026-06-06T22:50:17Z | Reviewed, no high-conviction finding |
| #786 | [Automation] Bug scan: fix subagents compact control guard | 2026-06-06T23:31:45Z | Immediate fix kept; residual test-gate gap |

## Recommended Smallest Refactor

Start with the Markdown source formatter correctness bug, then include the one-line JS-unit allowlist hardening while the review branch is already touching test gates.

Why this batch first:

- The Markdown issue is a concrete correctness bug with a tiny owner function and a deterministic repro.
- The CI allowlist change is a still-valid test-coverage gap and is one focused entry, not broad component-test expansion.
- Both fixes have much smaller blast radius than splitting the 4.8k-line Agent component, 2.1k-line suggestion menu, or 5.6k-line Studio shell.
- The batch matches the repo preference for minimum useful tests: fix the exposed edge and graduate one deterministic helper test.

Smallest implementation plan:

1. Adjust `getLineBounds()` so non-collapsed selections ending on a newline do not include the next line.
2. Add bullet-list and ordered-list regression tests for that boundary.
3. Add `components/screen-assistant/screen-assistant-geometry.test.js` to `INCLUDED_TEST_FILES` in `scripts/run-js-unit-tests.mjs`.
4. Run the targeted node tests, `pnpm run test:unit:js`, `pnpm run lint`, and `pnpm run typecheck`.
