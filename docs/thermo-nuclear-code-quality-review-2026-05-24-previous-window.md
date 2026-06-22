# Thermo-Nuclear Code Quality Review - 2026-05-24 Previous Window

## Scope

- Existing report files read first:
  - `docs/thermo-nuclear-code-quality-review-2026-06-21.md`
  - `docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-31-previous-window.md`
- Prior covered windows:
  - `2026-06-14` through `2026-06-21` in the original report.
  - `2026-06-07` through `2026-06-13` in the first previous-window report.
  - `2026-05-31` through `2026-06-06` in the second previous-window report.
- Oldest covered `mergedAt` extracted from the existing reviewed tables: `2026-05-31T00:05:57Z` (`#517`).
- This non-overlapping review window: merged PRs targeting `main` from `2026-05-24` through `2026-05-30`.
- Current-main evidence baseline before this report's remediation edit: `/Users/esoh/Documents/Labs/vpk-rovo` at `bd289329cc120d0e8e3f6e02e1d5a5c54d9161b2` (`origin/main`).
- Requested standard: `thermo-nuclear-code-quality-review`, focused on structural simplification, file-size crossings, spaghetti growth, boundary leaks, duplicated contracts, and canonical ownership.

## Prior Report Extraction

Existing reviewed-table rows cover 374 PRs:

```text
#517-#526, #529-#708, #710-#775, #777-#780, #782-#876, #878-#895, #897
```

All PR numbers already listed anywhere in the existing reports, including high-priority findings, skipped/fixed notes, and remediation references:

```text
#517-#876, #878-#986, #990, #994, #996, #1000-#1001, #1005-#1008, #1019
```

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- Existing report notes mark Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, and Agent Card ticket-style extraction as remediated by `#1019`.
- The `2026-05-31` previous-window report also records fixes/supersessions for Markdown trailing-newline source formatting, the screen-assistant geometry/unit-gate gap, old `card-directory`, Agent Card bloat, bare app-token conversion duplication, and several later Agent Browser / PromptInput overlaps.

## Method

- Queried GitHub for merged PRs targeting `main` with `merged:2026-05-24..2026-05-30`.
- The query returned 218 merged PRs: `#297` through `#516`, excluding unmerged/missing `#328` and `#420`.
- Inspected merged diff stats for high-risk PRs and compared them with the current `main` state.
- Ignored issues already fixed by later PRs or already recorded in the existing report set.
- Kept findings only when the current code still shows a maintainability, simplification, correctness, or test-coverage problem not already captured by the existing reports.

## Executive Summary

Most of this earlier window is the origin of debt already captured in later reports: Studio shell bloat, Agent Browser ownership, Agent Card/CardDirectory churn, RovoCursor keyframe injection, assistant trace state, PromptInput/floating composer behavior, and backend Studio result parsing. Those are not repeated as new findings here.

The strongest not-yet-captured issue is small but real: PR `#509` added a pure SVG tracing parser/sanitizer and a colocated `node:test` suite, but because it lives under `components/`, the repo's JS unit gate does not run it unless it is explicitly allowlisted. This parser accepts pasted SVG/path input before render, rejects unsupported path data, and clamps visual parameters. The test already exists; it just was not admitted into the CI gate.

## Highest Priority Finding

### 1. SVG Tracing parser coverage is still outside the JS unit gate

- PR: `#509`
- Evidence:
  - `components/visual/svg-tracing/lib.ts:90` parses pasted SVG/path input.
  - `components/visual/svg-tracing/lib.ts:62` rejects unsupported path data before render.
  - `components/visual/svg-tracing/lib.test.js:8` covers sanitized SVG parsing.
  - `components/visual/svg-tracing/lib.test.js:34` covers rejecting unsupported path data.
  - `scripts/run-js-unit-tests.mjs` explicitly allowlists selected `components/` tests, but did not include `components/visual/svg-tracing/lib.test.js`.

The component-tree exclusion is intentional, but this is a focused pure helper test, not source-grep UI drift. Leaving it outside the gate means the parser/sanitizer can regress while `pnpm run test:unit:js` stays green.

Smallest remediation batch:

- Add `components/visual/svg-tracing/lib.test.js` to `INCLUDED_TEST_FILES`.
- Run the focused test directly.
- Run `pnpm run test:unit:js`, plus lint/typecheck for the repo change.

## Skipped Because Already Reviewed Or Fixed

- `#517` and later PRs are outside this non-overlapping window and already listed in existing reports.
- `#319` Agent Browser ownership was already captured by later reports against `#834`, `#845`, `#875`, `#880`, and template-build-flow follow-ups.
- `#321` Studio agent-creation/backend-result ownership was already captured by later reports against `#723`, `#768`, `#831`, `#872`, `#887`, `#966`, `#970`, `#977`, `#981`, and `#983`.
- `#324` assistant thinking trace state was already captured by the `2026-05-31` previous-window report.
- `#335`, `#340`, `#351`, `#483`, `#494`, `#500`, `#502`, `#504`, and related Agent Card/CardDirectory work was already superseded by later EntityCard/AgentCard cleanup, including `#1019`.
- `#384`, `#385`, `#388`, and `#389` introduced or exposed `CreateInput`; `#393` removed it in the same window.
- `#434` and `#446` introduced the old `components/ui-custom/card-directory` path; current `main` no longer has that component, and later reports already skipped the stale path.
- `#445`, `#449`, `#461`, and `#489` overlap with Clicky/screen-assistant/realtime voice work that later reports already captured or remediated through focused source contracts and shared realtime reducer cleanup.
- `#516` introduced `RovoCursor`; the current repeated keyframe-injection debt was already recorded in the `2026-05-31` previous-window report against later PR `#549`, so it is not re-raised here.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #297 | feat: update Rovo runtime and Symphony workflow | 2026-05-24T09:11:57Z | Reviewed, no new still-valid finding |
| #298 | chore: install deps in Symphony workspaces | 2026-05-24T09:57:16Z | Reviewed, no new still-valid finding |
| #299 | chore: auto-bootstrap Claude Code worktrees with env + deps | 2026-05-24T10:09:19Z | Reviewed, no new still-valid finding |
| #300 | chore: add WorktreeCreate hook for sub-agent worktree bootstrap | 2026-05-24T10:31:56Z | Reviewed, no new still-valid finding |
| #301 | [Automation] Update AGENTS.md: document worktree bootstrap | 2026-05-24T12:54:12Z | Reviewed, no new still-valid finding |
| #302 | [Automation] Performance audit: precompute artifact sort timestamps | 2026-05-24T13:21:56Z | Reviewed, no new still-valid finding |
| #303 | [Automation] Code simplification: simplify artifact fixtures | 2026-05-24T22:33:59Z | Reviewed, no new still-valid finding |
| #304 | [Automation] Test coverage: Claude worktree hook contract | 2026-05-24T22:34:19Z | Reviewed, no new still-valid finding |
| #305 | [Automation] Engineering improvement map: lockfile registry guard | 2026-05-24T22:35:00Z | Reviewed, no new still-valid finding |
| #306 | [Automation] Bug scan: Claude worktree branch fallback | 2026-05-25T04:01:28Z | Reviewed, no new still-valid finding |
| #307 | fix(runtime): allow browser socket token requests | 2026-05-25T02:00:52Z | Reviewed, no new still-valid finding |
| #308 | chore(deps): bump helmet from 8.1.0 to 8.2.0 in /backend in the backend-npm-minor-and-patch group | 2026-05-25T04:05:19Z | Reviewed, no new still-valid finding |
| #309 | chore(deps): bump the npm-minor-and-patch group with 56 updates | 2026-05-25T06:31:30Z | Reviewed, no new still-valid finding |
| #310 | chore(deps): bump @atlaskit/icon from 34.3.0 to 35.0.0 | 2026-05-25T05:35:54Z | Reviewed, no new still-valid finding |
| #311 | chore(deps): bump react-day-picker from 9.14.0 to 10.0.1 | 2026-05-25T05:57:22Z | Reviewed, no new still-valid finding |
| #312 | [Automation] Dependency sweep: security overrides | 2026-05-25T06:22:08Z | Reviewed, no new still-valid finding |
| #313 | [Automation] Code simplification: shader lab prop type formatting | 2026-05-25T08:04:13Z | Reviewed, no new still-valid finding |
| #314 | [Automation] Interface contract audit: Shader Lab voxel route | 2026-05-25T08:50:08Z | Reviewed, no new still-valid finding |
| #315 | [Automation] Interface contract audit: Rovo port pool parsing | 2026-05-25T11:30:47Z | Reviewed, no new still-valid finding |
| #316 | feat(projects): add Studio project template | 2026-05-25T12:16:33Z | Reviewed, later Studio ownership captured in existing reports |
| #317 | Refresh Studio home starters and simplify the sidebar | 2026-05-25T13:31:16Z | Reviewed, later Studio ownership captured in existing reports |
| #318 | feat: probe port liveness in ports CLI, swap bento icons to agents | 2026-05-25T15:24:19Z | Reviewed, no new still-valid finding |
| #319 | feat: add reusable agent-browser block + wire studio Browse all to modal | 2026-05-25T18:01:16Z | Skipped, Agent Browser ownership already captured later |
| #320 | feat(studio): refine starter bento layouts | 2026-05-25T17:48:13Z | Reviewed, later Studio ownership captured in existing reports |
| #321 | feat(studio): add agent creation flow | 2026-05-25T18:26:30Z | Skipped, Studio/backend ownership already captured later |
| #322 | Show active agent creation thread in sidebar | 2026-05-26T01:15:37Z | Reviewed, no new still-valid finding |
| #323 | fix(studio): restore RovoAppHeader in Rovo App shell | 2026-05-26T01:15:09Z | Reviewed, no new still-valid finding |
| #324 | Add Studio agent creation thinking trace | 2026-05-26T01:16:04Z | Skipped, assistant trace ownership already captured later |
| #325 | chore(studio): quiet passive Rovo app thread refresh | 2026-05-26T04:18:05Z | Reviewed, no new still-valid finding |
| #326 | feat(studio): hide Rovo app chat header until a chat is active | 2026-05-26T04:18:32Z | Reviewed, no new still-valid finding |
| #327 | test(studio): align guarded-registration assertion with extracted unmark helper | 2026-05-26T04:19:07Z | Reviewed, no new still-valid finding |
| #329 | Studio: polish home view animations (stagger, hover, tab morph) | 2026-05-26T05:19:05Z | Reviewed, no new still-valid finding |
| #330 | fix(studio): use duration token for message enters | 2026-05-26T05:39:27Z | Reviewed, no new still-valid finding |
| #331 | fix(studio): mask bento bottom to stop tile-border leak | 2026-05-26T06:39:00Z | Reviewed, no new still-valid finding |
| #332 | Fix nested sub-subchild handling in Rovo studio flows | 2026-05-26T15:47:14Z | Reviewed, no new still-valid finding |
| #333 | [Automation] Interface contract audit: Studio thread refresh cache | 2026-05-27T01:33:02Z | Reviewed, no new still-valid finding |
| #334 | Update shared agent config design | 2026-05-27T01:34:13Z | Reviewed, later config ownership captured in existing reports |
| #335 | Add Figma-matched agent card | 2026-05-27T01:33:26Z | Skipped, Agent Card concerns already remediated later |
| #336 | Remove redundant Edit button from AgentProfileCover | 2026-05-27T02:24:26Z | Reviewed, no new still-valid finding |
| #337 | Use agent card for generated agents | 2026-05-27T04:11:19Z | Skipped, Agent Card concerns already remediated later |
| #338 | Fix studio sidebar indentation | 2026-05-27T04:23:33Z | Reviewed, no new still-valid finding |
| #339 | vpk-git: auto-derive branch on detached HEAD | 2026-05-27T04:02:53Z | Reviewed, no new still-valid finding |
| #340 | Swap sidebar agent result to shared AgentCard block | 2026-05-27T04:28:16Z | Skipped, Agent Card concerns already remediated later |
| #341 | vpk-git: auto-derive contextual branch names from diff | 2026-05-27T04:18:08Z | Reviewed, no new still-valid finding |
| #342 | [Automation] Code simplification: inline agent header avatar | 2026-05-27T05:13:08Z | Reviewed, no new still-valid finding |
| #343 | Add shared Tiptap agent editor | 2026-05-27T04:53:46Z | Reviewed, later editor ownership captured in existing reports |
| #344 | vpk-git: harden detached HEAD guidance in Create PR | 2026-05-27T05:00:10Z | Reviewed, no new still-valid finding |
| #345 | Persist draft studio agents in localStorage | 2026-05-27T08:20:14Z | Reviewed, later Studio ownership captured in existing reports |
| #346 | Update Studio agent starters | 2026-05-27T06:07:16Z | Reviewed, no new still-valid finding |
| #347 | Add agents directory block | 2026-05-27T06:08:15Z | Reviewed, no new still-valid finding |
| #348 | Remove pl-1 from sidebar nav item label wrapper | 2026-05-27T06:23:19Z | Reviewed, no new still-valid finding |
| #349 | Fix agent creation artifact routing | 2026-05-27T06:32:12Z | Reviewed, no new still-valid finding |
| #350 | Add Studio screen assistant | 2026-05-27T11:49:32Z | Skipped, current screen-assistant contracts already gated later |
| #351 | Polish agent card banner and actions | 2026-05-27T12:02:07Z | Skipped, Agent Card concerns already remediated later |
| #352 | Polish agent config panel and refresh Teamwork Graph icons | 2026-05-27T12:22:01Z | Reviewed, later config ownership captured in existing reports |
| #353 | Refine model selector dropdown | 2026-05-27T14:03:20Z | Reviewed, no new still-valid finding |
| #354 | Recategorize Studio home starters and add hero tile per tab | 2026-05-27T15:39:31Z | Reviewed, later Studio home ownership captured in existing reports |
| #355 | Restructure Studio home bento tiles and fix focus clipping | 2026-05-27T21:54:25Z | Reviewed, later Studio home ownership captured in existing reports |
| #356 | [Automation] Test coverage: screen assistant draft patch sanitizer | 2026-05-28T04:30:49Z | Reviewed, already gated in current JS unit allowlist |
| #357 | [Automation] Engineering improvement map: export guard and CI route fix | 2026-05-28T05:26:55Z | Reviewed, no new still-valid finding |
| #358 | Consolidate agent config panel into AgentHeader | 2026-05-28T05:28:14Z | Reviewed, later config ownership captured in existing reports |
| #359 | Reveal Ask Rovo in Studio top nav on agent config | 2026-05-28T05:00:46Z | Reviewed, no new still-valid finding |
| #360 | Close gap in Studio agent config panel | 2026-05-28T05:36:17Z | Reviewed, no new still-valid finding |
| #361 | Mount Ask Rovo sidebar chat in Studio agent config | 2026-05-28T05:39:38Z | Reviewed, no new still-valid finding |
| #362 | Hide close button on studio agent config panel | 2026-05-28T06:02:33Z | Reviewed, no new still-valid finding |
| #363 | Remove inline Config/Test chat tabs from Studio agent config | 2026-05-28T06:07:40Z | Reviewed, no new still-valid finding |
| #364 | Drop redundant create/update lozenge from Studio agent config header | 2026-05-28T06:11:03Z | Reviewed, no new still-valid finding |
| #365 | Anchor Studio test-chat empty state to top when testing an agent | 2026-05-28T06:13:38Z | Reviewed, no new still-valid finding |
| #366 | Use ModelSelector in agent instructions RTE toolbar | 2026-05-28T06:18:01Z | Reviewed, no new still-valid finding |
| #367 | Drop max-width on Studio agent config body so it fills the panel | 2026-05-28T06:27:29Z | Reviewed, no new still-valid finding |
| #368 | Use reasoning modes selector in agent instructions toolbar | 2026-05-28T06:30:10Z | Reviewed, no new still-valid finding |
| #369 | Wrap agent header avatar in 24x24 Avatar hexagon | 2026-05-28T06:57:30Z | Reviewed, no new still-valid finding |
| #370 | Drop redundant AgentContent wrapper in agent config panel | 2026-05-28T06:58:02Z | Reviewed, no new still-valid finding |
| #371 | Fix AgentProfileCover avatar stroke in dark mode | 2026-05-28T06:59:07Z | Reviewed, no new still-valid finding |
| #372 | Theme TWG knowledge icon stroke with ADS icon token | 2026-05-28T07:00:16Z | Reviewed, no new still-valid finding |
| #373 | Open agents directory from Studio sidebar Agents row | 2026-05-28T07:03:03Z | Reviewed, no new still-valid finding |
| #374 | Fix hover and cursor on ModelSelector items | 2026-05-28T07:03:26Z | Reviewed, no new still-valid finding |
| #375 | Lock agent profile cover blue to match avatar hex | 2026-05-28T07:04:42Z | Reviewed, no new still-valid finding |
| #376 | Drop Studio main horizontal padding when agent config pane is active | 2026-05-28T07:28:01Z | Reviewed, no new still-valid finding |
| #377 | Land Studio sidebar Agents row on agent-builder home | 2026-05-28T07:35:50Z | Reviewed, no new still-valid finding |
| #378 | Point Studio Writing tile to illustrations rich icon | 2026-05-28T10:19:39Z | Reviewed, no new still-valid finding |
| #379 | Shrink agent hero tile avatar and title to match bento | 2026-05-28T10:28:13Z | Reviewed, no new still-valid finding |
| #380 | Swap Confluence for JPD in Theme Analyzer source stack | 2026-05-28T10:38:04Z | Reviewed, no new still-valid finding |
| #381 | Resume Studio home bento category auto-cycle with progress bar | 2026-05-28T10:38:20Z | Reviewed, no new still-valid finding |
| #382 | Unclamp tall HomeStarterBento tile descriptions | 2026-05-28T10:40:21Z | Reviewed, no new still-valid finding |
| #383 | Fix Teamwork Graph icon scaling in knowledge panel | 2026-05-28T10:57:23Z | Reviewed, no new still-valid finding |
| #384 | Add CreateInput as duplicate of PromptInput | 2026-05-28T11:00:09Z | Skipped, CreateInput removed by #393 |
| #385 | Expose CreateInput in the components website | 2026-05-28T11:13:18Z | Skipped, CreateInput removed by #393 |
| #386 | Brighten Studio home bento auto-cycle progress bar | 2026-05-28T11:19:44Z | Reviewed, no new still-valid finding |
| #387 | Re-clamp HomeStarterBento descriptions at lg breakpoint | 2026-05-28T11:34:01Z | Reviewed, no new still-valid finding |
| #388 | Mirror prompt-input docs page into create-input | 2026-05-28T11:46:05Z | Skipped, CreateInput removed by #393 |
| #389 | Trim Create Input docs to composer and floating examples | 2026-05-28T12:11:00Z | Skipped, CreateInput removed by #393 |
| #390 | Polish agents directory cards | 2026-05-28T12:12:13Z | Reviewed, no new still-valid finding |
| #391 | Add Card Glow visual demo | 2026-05-28T12:17:25Z | Reviewed, no new still-valid finding |
| #392 | Trim prompt-input docs to composer + floating examples | 2026-05-28T12:24:59Z | Reviewed, no new still-valid finding |
| #393 | Remove Create Input component and docs page | 2026-05-28T12:29:29Z | Fixed same-window CreateInput duplication |
| #394 | Optically scale Writing icon to match peer category icons | 2026-05-28T12:30:33Z | Reviewed, no new still-valid finding |
| #395 | Lead Studio home tabs with Planning | 2026-05-28T12:38:25Z | Reviewed, no new still-valid finding |
| #396 | Pause Studio home bento auto-cycle on hover | 2026-05-28T12:41:45Z | Reviewed, no new still-valid finding |
| #397 | Unclamp HomeStarterBento descriptions at lg breakpoint | 2026-05-28T12:45:00Z | Reviewed, no new still-valid finding |
| #398 | Fix Customer Insights tile description overflow at lg | 2026-05-28T12:45:28Z | Reviewed, no new still-valid finding |
| #399 | Stop studio composer shadow from being clipped on home view | 2026-05-28T12:59:54Z | Reviewed, no new still-valid finding |
| #400 | Add + button and center text in floating prompt input demo | 2026-05-28T13:00:55Z | Reviewed, no new still-valid finding |
| #401 | Bump Writing icon scale to 1.4 for visual parity | 2026-05-28T13:02:55Z | Reviewed, no new still-valid finding |
| #402 | Pause home starter bento cycle on hover | 2026-05-28T13:26:45Z | Reviewed, no new still-valid finding |
| #403 | Use default Atlassian Sans for Confluence document title | 2026-05-28T13:48:38Z | Reviewed, no new still-valid finding |
| #404 | Vertically center input group textarea content | 2026-05-28T15:49:26Z | Reviewed, no new still-valid finding |
| #405 | Force block display so input-group textarea content-center vertically centers text | 2026-05-28T16:07:09Z | Reviewed, no new still-valid finding |
| #406 | Balance Studio Writing icon | 2026-05-28T16:16:35Z | Reviewed, no new still-valid finding |
| #407 | Center floating prompt placeholder | 2026-05-28T16:21:33Z | Reviewed, no new still-valid finding |
| #408 | Upgrade agent instructions editor | 2026-05-28T19:43:06Z | Reviewed, later editor ownership captured in existing reports |
| #409 | Add live-voice/submit toggle to floating prompt bar | 2026-05-28T20:31:44Z | Reviewed, later composer/voice concerns captured in existing reports |
| #410 | Fix agent card disappearing on hover | 2026-05-28T20:32:15Z | Reviewed, no new still-valid finding |
| #411 | Shrink Studio Writing starter icon | 2026-05-28T20:40:32Z | Reviewed, no new still-valid finding |
| #412 | Stack floating prompt controls under textarea for multi-line | 2026-05-28T20:55:36Z | Reviewed, later composer concerns captured in existing reports |
| #413 | Bump AgentDirectoryCard heading to ADS font.heading.xsmall (14px) | 2026-05-28T20:55:53Z | Reviewed, no new still-valid finding |
| #414 | Extend agents directory tiles to full bleed | 2026-05-28T20:56:28Z | Reviewed, no new still-valid finding |
| #415 | Switch studio composer to floating minimal variant | 2026-05-28T20:57:02Z | Reviewed, later composer concerns captured in existing reports |
| #416 | Pad agent browser scroll viewport so hover shadow isn't clipped | 2026-05-28T20:58:56Z | Skipped, Agent Browser concerns already captured later |
| #417 | Fix agent browser card hover-shadow clipping | 2026-05-28T21:25:50Z | Skipped, Agent Browser concerns already captured later |
| #418 | Add Atlassian company and team to agents directory | 2026-05-28T21:27:17Z | Reviewed, no new still-valid finding |
| #419 | Align agents directory search box top to All tab | 2026-05-28T21:32:19Z | Reviewed, no new still-valid finding |
| #421 | Verify company agents and replace Rovo directory card | 2026-05-28T21:37:30Z | Reviewed, no new still-valid finding |
| #422 | Make floating composer inline until multi-line | 2026-05-28T21:37:29Z | Reviewed, later composer concerns captured in existing reports |
| #423 | Add Atlassian company to studio agents directory | 2026-05-28T22:15:37Z | Reviewed, no new still-valid finding |
| #424 | Diversify agent directory avatar colors and fix attribution bylines | 2026-05-28T22:15:58Z | Reviewed, no new still-valid finding |
| #425 | Dock Studio Ask Rovo chat flush, remove inset border | 2026-05-29T01:10:13Z | Reviewed, no new still-valid finding |
| #426 | [Automation] Performance audit: cache backend reserved port lookup | 2026-05-29T21:05:40Z | Reviewed, no new still-valid finding |
| #427 | Nudge Writing bento icon up for optical centering | 2026-05-29T02:42:58Z | Reviewed, no new still-valid finding |
| #428 | Match agent config avatar to sidebar nav avatar | 2026-05-29T02:43:29Z | Reviewed, no new still-valid finding |
| #429 | Shimmer studio sidebar agent-creation nav item | 2026-05-29T02:43:24Z | Reviewed, no new still-valid finding |
| #430 | Open sidebar chat when Studio agent finishes building | 2026-05-29T02:43:52Z | Reviewed, no new still-valid finding |
| #431 | Extract shared FloatingComposer for studio + prompt-input demo | 2026-05-29T02:55:57Z | Reviewed, later composer concerns captured in existing reports |
| #432 | Align Studio card glow stroke | 2026-05-29T03:19:04Z | Reviewed, no new still-valid finding |
| #433 | Add skills directory block | 2026-05-29T03:53:36Z | Reviewed, no new still-valid finding |
| #434 | Add CardDirectory ui-custom component | 2026-05-29T04:00:56Z | Skipped, old CardDirectory path removed later |
| #435 | Add Visual Tracing component with GUI controls | 2026-05-29T04:00:37Z | Reviewed, no new still-valid finding |
| #436 | Stack floating composer actions into bottom strip when multi-line | 2026-05-29T04:01:27Z | Reviewed, later composer concerns captured in existing reports |
| #437 | Match agent profile cover accent | 2026-05-29T04:01:45Z | Reviewed, no new still-valid finding |
| #438 | [Automation] Deprecation audit: unused ARK-ES font variants | 2026-05-29T21:07:21Z | Reviewed, no new still-valid finding |
| #439 | Add tools directory block | 2026-05-29T04:46:44Z | Reviewed, no new still-valid finding |
| #440 | Register CardDirectory in component docs site | 2026-05-29T04:45:32Z | Skipped, old CardDirectory path removed later |
| #441 | Add agent templates block | 2026-05-29T05:11:20Z | Reviewed, no new still-valid finding |
| #442 | Fix Studio bento tile stroke to coexist with avatar glow | 2026-05-29T05:10:28Z | Reviewed, no new still-valid finding |
| #443 | [Automation] Update AGENTS.md: refresh workflow guidance | 2026-05-29T21:08:12Z | Reviewed, no new still-valid finding |
| #444 | Add Start from scratch reveal to studio composer | 2026-05-29T05:30:12Z | Reviewed, no new still-valid finding |
| #445 | Add AI cursor (Clicky) to sidebar and floating chat | 2026-05-29T05:34:41Z | Skipped, later Clicky/screen-assistant work already captured |
| #446 | Add CardDirectory skill/tool/template variants | 2026-05-29T05:50:05Z | Skipped, old CardDirectory path removed later |
| #447 | Resize agent config header buttons to 32px | 2026-05-29T06:18:23Z | Reviewed, no new still-valid finding |
| #448 | Center collapsed-sidebar search bar in studio top nav | 2026-05-29T06:18:53Z | Reviewed, no new still-valid finding |
| #449 | Add screen assistant skill and AI cursor composer toggle | 2026-05-29T06:19:50Z | Skipped, later Clicky/screen-assistant work already captured |
| #450 | Fix Visual Tracing line mode and blend colors | 2026-05-29T06:24:05Z | Reviewed, no new still-valid finding |
| #451 | Add collapsible Edit agent context bar to studio sidebar chat | 2026-05-29T06:40:55Z | Reviewed, no new still-valid finding |
| #452 | Fix doubled border on studio chat panel divider | 2026-05-29T06:58:57Z | Reviewed, no new still-valid finding |
| #453 | Hide partial-generation banner on empty agent draft | 2026-05-29T07:10:18Z | Reviewed, no new still-valid finding |
| #454 | Return to agent home from studio Agents sidebar tab | 2026-05-29T07:10:47Z | Reviewed, no new still-valid finding |
| #455 | Float Start from scratch reveal without shifting layout | 2026-05-29T07:12:12Z | Reviewed, no new still-valid finding |
| #456 | Align icon tile scaling | 2026-05-29T23:20:41Z | Reviewed, no new still-valid finding |
| #457 | Add TWG icon to source picker | 2026-05-30T00:02:40Z | Reviewed, no new still-valid finding |
| #458 | Align tile scaling | 2026-05-30T00:08:44Z | Reviewed, no new still-valid finding |
| #459 | Update dependencies and add pnpm catalog pinning tiers | 2026-05-30T01:09:56Z | Reviewed, no new still-valid finding |
| #460 | Refine queue component styling | 2026-05-30T01:18:44Z | Reviewed, no new still-valid finding |
| #461 | Rebuild Clicky screen assistant on app-owned realtime tools | 2026-05-30T01:20:56Z | Skipped, later Clicky/screen-assistant work already captured |
| #462 | Sync selected agent to URL via ?agent= query param | 2026-05-30T01:30:33Z | Reviewed, no new still-valid finding |
| #463 | Split git cleanup into vpk-clean skill | 2026-05-30T01:55:10Z | Reviewed, no new still-valid finding |
| #464 | Align ws specifier to its security-override floor | 2026-05-30T02:14:37Z | Reviewed, no new still-valid finding |
| #465 | Add deps:check / deps:update scripts with explicit status | 2026-05-30T02:25:33Z | Reviewed, no new still-valid finding |
| #466 | Accept bleeding-edge core versions in peer rules | 2026-05-30T02:31:31Z | Reviewed, no new still-valid finding |
| #467 | Theme TWG loader mask dots via CSS currentColor | 2026-05-30T03:16:09Z | Reviewed, no new still-valid finding |
| #468 | Use animated TWG loader as graph connect button icon | 2026-05-30T03:34:13Z | Reviewed, no new still-valid finding |
| #469 | Keep TWG loader mask on inherited surface color | 2026-05-30T03:58:52Z | Reviewed, no new still-valid finding |
| #470 | Add rainbow hover shimmer to TWG connect button | 2026-05-30T04:16:01Z | Reviewed, no new still-valid finding |
| #471 | Add Text Effects visual component and flatten demo shadows | 2026-05-30T04:40:50Z | Reviewed, no new still-valid finding |
| #472 | Give source-picker buttons an opaque surface background | 2026-05-30T04:41:46Z | Reviewed, no new still-valid finding |
| #473 | Migrate custom UI components | 2026-05-30T04:46:47Z | Reviewed, net simplification / no new still-valid finding |
| #474 | Add rainbow soft-blur hover reveal to TWG picker button | 2026-05-30T05:25:09Z | Reviewed, no new still-valid finding |
| #475 | Add optional color stops to text-effects | 2026-05-30T05:28:19Z | Reviewed, no new still-valid finding |
| #476 | Use elevation surface-hover color on source-picker buttons | 2026-05-30T05:44:54Z | Reviewed, no new still-valid finding |
| #477 | Blend text-effects gradient over neutral text | 2026-05-30T05:46:12Z | Reviewed, no new still-valid finding |
| #478 | Smooth TWG rainbow hover-out with a persistent overlay | 2026-05-30T05:46:47Z | Reviewed, no new still-valid finding |
| #479 | Dim card directory section label to text-subtlest | 2026-05-30T05:58:22Z | Skipped, old CardDirectory path removed later |
| #480 | Add edit/delete hover menu to studio sidebar agents | 2026-05-30T06:12:21Z | Reviewed, no new still-valid finding |
| #481 | Make text-effects rainbow overlay fully opaque | 2026-05-30T06:28:06Z | Reviewed, no new still-valid finding |
| #482 | Smooth TWG rainbow label hover-out onto a shared leave clock | 2026-05-30T06:28:25Z | Reviewed, no new still-valid finding |
| #483 | Add expanded agent card-directory variant with cover banner and capabilities list | 2026-05-30T06:34:50Z | Skipped, old CardDirectory/AgentCard concerns already superseded |
| #484 | Fix flickering rainbow hover on TWG picker button | 2026-05-30T07:21:03Z | Reviewed, no new still-valid finding |
| #485 | Add Works with sources and Skills tags to expanded agent card | 2026-05-30T08:59:09Z | Skipped, Agent Card concerns already remediated later |
| #486 | Clip overflowing rainbow label on TWG picker button | 2026-05-30T09:01:30Z | Reviewed, no new still-valid finding |
| #487 | Show pointer cursor on dropdown and context menu items | 2026-05-30T09:01:53Z | Reviewed, no new still-valid finding |
| #488 | Blur TWG rainbow label exit out in place | 2026-05-30T09:04:50Z | Reviewed, no new still-valid finding |
| #489 | Add Studio voice dedup and send modes | 2026-05-30T09:06:26Z | Skipped, later voice/realtime concerns already captured |
| #490 | Speed up TWG rainbow blur reveal | 2026-05-30T09:10:28Z | Reviewed, no new still-valid finding |
| #491 | Show filled agent docs state | 2026-05-30T09:11:21Z | Reviewed, no new still-valid finding |
| #492 | Add 1px border to TWG source stack tiles for separation | 2026-05-30T10:21:22Z | Reviewed, no new still-valid finding |
| #493 | Remove TWG rainbow y-offset; slow the blur fade-out | 2026-05-30T10:21:44Z | Reviewed, no new still-valid finding |
| #494 | Restyle expanded agent card with metadata footer and feature list | 2026-05-30T10:41:37Z | Skipped, Agent Card concerns already remediated later |
| #495 | Add optional hasBorder prop to vpk-logo | 2026-05-30T10:59:26Z | Reviewed, no new still-valid finding |
| #496 | Use animatable transparent border color for card hover | 2026-05-30T11:01:18Z | Reviewed, no new still-valid finding |
| #497 | Update agent templates strategy layout | 2026-05-30T11:09:47Z | Reviewed, no new still-valid finding |
| #498 | Fix vpk-logo border visibility and 3p double border | 2026-05-30T11:33:20Z | Reviewed, no new still-valid finding |
| #499 | Fix React Doctor diagnostics | 2026-05-30T12:00:47Z | Reviewed, no new still-valid finding |
| #500 | Make expanded agent card footer sticky over a scrollable body | 2026-05-30T12:04:57Z | Skipped, Agent Card concerns already remediated later |
| #501 | Add Scroll Mask visual component | 2026-05-30T12:39:13Z | Reviewed, no new still-valid finding |
| #502 | Bleed expanded agent card footer to full width | 2026-05-30T13:06:26Z | Skipped, Agent Card concerns already remediated later |
| #503 | Refine Scroll Mask demo bars | 2026-05-30T13:08:21Z | Reviewed, no new still-valid finding |
| #504 | Fix expanded agent card footer | 2026-05-30T13:42:27Z | Skipped, Agent Card concerns already remediated later |
| #505 | Open agent templates from Browse all | 2026-05-30T14:29:30Z | Reviewed, later directory/Agent Browser concerns captured in existing reports |
| #506 | Use card-directory expanded card in agent templates | 2026-05-30T14:30:03Z | Skipped, old CardDirectory path removed later |
| #507 | Animate TWG source stack | 2026-05-30T14:59:19Z | Reviewed, no new still-valid finding |
| #508 | Refine agent templates dialog header and categories | 2026-05-30T15:00:04Z | Reviewed, no new still-valid finding |
| #509 | Add SVG tracing visual | 2026-05-30T15:01:12Z | Finding/remediated: SVG parser test outside JS unit gate |
| #510 | Fit agent templates dialog header to content | 2026-05-30T18:56:27Z | Reviewed, no new still-valid finding |
| #511 | Tidy agent templates dialog spacing | 2026-05-30T20:40:48Z | Reviewed, no new still-valid finding |
| #512 | Detect programmatic multi-line in floating composer | 2026-05-30T21:46:38Z | Reviewed, later composer concerns captured in existing reports |
| #513 | Refine card directory app stack | 2026-05-30T23:06:20Z | Skipped, old CardDirectory path removed later |
| #514 | Sync agent template directory tabs | 2026-05-30T23:30:17Z | Reviewed, no new still-valid finding |
| #515 | Add skill tag count overflow variant | 2026-05-30T23:43:33Z | Reviewed, no new still-valid finding |
| #516 | Add RovoCursor ui-custom component | 2026-05-30T23:58:09Z | Skipped, RovoCursor keyframe debt already captured in prior report |

## Remediation Plan

Highest-value still-valid batch: gate the existing SVG Tracing parser/sanitizer test.

Implementation plan:

1. Add `components/visual/svg-tracing/lib.test.js` to `scripts/run-js-unit-tests.mjs` `INCLUDED_TEST_FILES`.
2. Run `pnpm exec node --test components/visual/svg-tracing/lib.test.js`.
3. Run `pnpm run test:unit:js`.
4. Run `pnpm run lint` and `pnpm run typecheck`.

## Remediation Applied

- Added `components/visual/svg-tracing/lib.test.js` to the explicit `components/` JS unit allowlist.
- Verified the focused SVG tracing test in the persistent checkout.
- Verified the full JS unit gate, lint, and typecheck in the same-HEAD writable worktree before copying the finished files into `/Users/esoh/Documents/Labs/vpk-rovo`.
