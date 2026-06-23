# Thermo-Nuclear Code Quality Review - 2026-06-23 Previous Window

## Scope

- Previous non-overlapping window: merged PRs targeting `main` from `2026-04-26T00:00:00Z` through `2026-05-02T23:59:59Z`.
- Prior coverage anchor: the oldest `mergedAt` in existing reviewed tables is `2026-05-03T10:18:19Z` (`#93`) from `docs/thermo-nuclear-code-quality-review-2026-05-03-previous-window.md`.
- Current evidence checkout: `/Users/esoh/.codex/worktrees/e8a4/vpk-rovo` at `58a132e111a5a1dd72da53ab5f0d703a37bc190b` (`origin/main`).
- Query: `repo:eevennsoh/vpk-rovo is:pr is:merged base:main merged:2026-04-26..2026-05-02`.
- The query returned 50 merged PRs: `#42` through `#92`, excluding `#79` because it was closed unmerged.

## Prior Report Extraction

All PR numbers already reviewed in explicit `Reviewed PRs` sections:

```text
#93-#128, #130-#139, #141-#153, #155-#164, #166-#188,
#190-#227, #229-#247, #249-#262, #264-#271, #273-#283,
#285-#327, #329-#419, #421-#526, #529-#708, #710-#775,
#777-#780, #782-#876, #878-#899, #901-#906, #908-#910,
#912-#914, #916-#933, #937-#943, #945-#951, #953-#955,
#957-#958, #960-#964, #967-#969, #971-#976, #978-#980,
#984-#986, #990, #994, #996, #1005, #1007, #1019
```

All PR numbers already listed anywhere in existing thermo reports, including findings, skipped/fixed notes, and remediation references:

```text
#93-#128, #130-#227, #229-#876, #878-#986, #990, #994,
#996, #1000-#1001, #1005-#1008, #1019
```

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- Existing reports mark Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, Agent Card ticket-style extraction, Markdown trailing-newline source formatting, screen-assistant geometry CI gating, SVG Tracing parser CI gating, UserInvalidSync fallback behavior, Work Item vpk-html field parsing extraction, and neural graph/root TWG installer test gating as remediated or shipped.

## Method

- Excluded every PR already listed in existing thermo reports. None of `#42..#92` were already listed in those reports.
- Split the review into read-only slices: `#42..#55`, `#56..#70`, `#71..#82`, and `#83..#92`.
- For each PR, checked the merged diff or merge/squash commit, then reconciled against current `origin/main`.
- Ignored issues already fixed by later PRs, deleted current surfaces, and findings already captured in later reports.

## Executive Summary

The previous window is mostly early scaffold work, cleanup, and Personal Graph/visual-demo iteration. Three still-valid opportunities remain after filtering:

1. `#82` left ASCII as two oversized owner files with shader source, demo state, control metadata, WebGL lifecycle, texture helpers, and uniform syncing still fused together.
2. `#51` added focused Awake clock coverage that still passes but is excluded from `pnpm run test:unit:js`.
3. `#88` added focused Personal Graph intro-phase coverage that still passes but is excluded from `pnpm run test:unit:js`.

The highest-value small remediation batch is the ASCII control-model extraction: it reduces one live oversized owner file and creates a stable testable data boundary without touching shader math or behavior.

## Highest Priority Findings

### 1. ASCII still has shader, control, and uniform ownership fused into oversized files

- PR: `#82`
- Current files:
  - `components/website/demos/visual/ascii-demo.tsx`
  - `components/website/demos/visual/shaders/ascii.tsx`
  - `components/website/demos/visual/ascii-demo.test.js`

`#82` expanded the ASCII visual into a broad shader-lab surface. Current `ascii-demo.tsx` is 1,340 lines and owns option lists, defaults, image aspect helpers, dozens of independent state fields, a mirrored `config` object, prop fan-out into `<Ascii />`, and all control rendering. Current `shaders/ascii.tsx` is 1,688 lines and still owns exported public constants, GLSL strings, prop normalization, atlas creation, texture loading, WebGL lifecycle, uniform lookup, and per-frame uniform updates.

The current test is mostly source-shape regex coverage. That preserves labels and import strings, but it does not create a stable control model or uniform boundary that can be tested as data.

Smallest coherent remediation batch:

1. Keep shader math and rendering behavior intact.
2. Extract ASCII constants/types that are shared between the shader and demo into a pure shader core module.
3. Extract demo defaults, option lists, and small helpers into a pure control-model module.
4. Add focused tests over the extracted control model and admit that test into the explicit JS-unit component allowlist.

The larger follow-up should split shader source and uniform syncing out of `shaders/ascii.tsx`; that is intentionally not included in this first batch.

### 2. Awake location-clock coverage is live but outside the JS unit gate

- PR: `#51`
- Current files:
  - `components/arts/awake/use-location-clock.ts`
  - `components/arts/awake/use-location-clock.test.js`
  - `scripts/run-js-unit-tests.mjs`

`components/arts/awake/use-location-clock.test.js` directly guards the formatter-cache and invalid-timezone fallback contract from `#51`, and the focused test passes directly. It is still excluded from `pnpm run test:unit:js` because `components/` tests are only run when explicitly allowlisted.

Smallest remediation batch: add `components/arts/awake/use-location-clock.test.js` to `INCLUDED_TEST_FILES`.

### 3. Personal Graph intro-phase coverage is live but outside the JS unit gate

- PR: `#88`
- Current files:
  - `components/arts/personal-graph/hooks/intro-phase.ts`
  - `components/arts/personal-graph/hooks/use-personal-graph-intro.test.js`
  - `scripts/run-js-unit-tests.mjs`

`components/arts/personal-graph/hooks/use-personal-graph-intro.test.js` is a direct `node:test` suite over the pure intro timeline helper. The neural graph test-gate gap from nearby PRs is already fixed in current `scripts/run-js-unit-tests.mjs`, but this smaller intro-phase test remains excluded.

Smallest remediation batch: add `components/arts/personal-graph/hooks/use-personal-graph-intro.test.js` to `INCLUDED_TEST_FILES`.

## Skipped Because Already Reviewed Or Fixed

- `#79` was closed unmerged and was not reviewed as a merged PR.
- `#42`, `#43`, `#47`: old dynamic favicon/theme helper paths are gone; current root layout uses static favicon links and `app/layout.test.js` is covered by the `app/` test prefix.
- `#53`, `#54`, `#55`, `#56`, `#59`, `#61`: old JS Symphony/backend surfaces were deleted or superseded by the current `vpk-symphony` wrapper and docs.
- `#57`, `#58`, `#60`, `#64`, `#65`, `#66`: current backend/app Personal Graph tests remain covered by broad `backend/` or `app/` prefixes.
- `#70`, `#83`, `#87`, `#91`: the neural graph test-gate concern is already recorded and remediated in `docs/thermo-nuclear-code-quality-review-2026-05-03-previous-window.md`; current `scripts/run-js-unit-tests.mjs` explicitly includes `components/arts/personal-graph/lib/neural-graph/neural-graph.test.js`.
- `#73`: Pattern Tile has already been split into `pattern-tile-core.ts` plus focused tests.
- `#76`: GUI copied-value filtering already owns a focused pure helper and allowlisted tests under `components/utils/gui-values.test.js`.
- `#89`: Graph demo source-grep tests are already intentionally left outside the unit-gate remediation path in the `2026-05-03` report.

## Reviewed PRs

| PR | Title | mergedAt | Status |
| --- | --- | --- | --- |
| #42 | [Automation] Bug scan: preserve favicon fallback | 2026-04-26T21:37:55Z | Fixed/superseded by current static favicon path |
| #43 | [Automation] Performance audit: gate favicon head cleanup | 2026-04-26T21:40:56Z | Fixed/superseded by current static favicon path |
| #44 | [Automation] Test coverage: cover root favicon links | 2026-04-27T18:24:30Z | Current `app/layout.test.js` is gated by `app/` prefix |
| #45 | [Automation] Code simplification: simplify root layout constants | 2026-04-27T18:22:04Z | Reviewed, no high-conviction current finding |
| #46 | [Automation] Performance audit: omit dev guard from production script | 2026-04-27T22:55:20Z | Current dev guard tests are gated |
| #47 | [Automation] Bug scan: restore root favicon fallback | 2026-04-27T22:49:44Z | Current fallback is covered |
| #48 | [Automation] Update AGENTS.md: clarify provider dirs | 2026-04-27T22:46:03Z | Docs-only |
| #49 | [Automation] Test coverage: dev stylesheet guard | 2026-04-29T05:16:19Z | Current test is gated |
| #50 | [Automation] Code simplification: extract dev stylesheet guard | 2026-04-29T05:13:05Z | Reviewed, no high-conviction current finding |
| #51 | [Automation] Performance audit: cache awake timezone formatters | 2026-04-29T05:11:22Z | Finding: live focused test outside JS unit gate |
| #52 | VEN-10: New art page | 2026-04-29T06:52:40Z | Later Personal Graph debt already recorded |
| #53 | VEN-11: Agent harness | 2026-04-29T08:24:11Z | Fixed/superseded; old backend Symphony tree deleted |
| #54 | [Automation] Code simplification: app-server client tests | 2026-04-29T10:45:28Z | Fixed/superseded with old backend Symphony tree |
| #55 | [Automation] Test coverage: Linear comment prompt bounds | 2026-04-29T10:43:30Z | Fixed/superseded with old backend Symphony tree |
| #56 | refactor(symphony): replace JS Symphony with Elixir variant | 2026-04-29T11:29:57Z | Superseded by current `vpk-symphony` wrapper/docs |
| #57 | Add personal graph vault read adapter | 2026-04-29T14:26:38Z | Current backend test covered by prefix |
| #58 | test(personal-graph): cover vault reads | 2026-04-29T14:57:37Z | Current backend test covered by prefix |
| #59 | [Automation] Performance audit: parallelize merge guard PR checks | 2026-04-29T23:25:09Z | Superseded; changed files no longer exist |
| #60 | Fix Personal Graph API route fallback | 2026-04-30T00:13:53Z | Current route/proxy tests covered |
| #61 | fix(personal-graph): remove backdrop grid | 2026-04-30T00:50:37Z | Superseded; old Sigma path gone |
| #62 | Add Personal Graph theme toggle | 2026-04-30T00:51:06Z | Related surface debt already recorded later |
| #63 | VEN-69: Use mapped design token utilities | 2026-04-30T00:50:33Z | Reviewed, no high-conviction current finding |
| #64 | [Automation] Code simplification: Personal Graph route test env setup | 2026-04-30T11:56:48Z | Test-only simplification still covered |
| #65 | [Automation] Test coverage: Personal Graph raw uploads | 2026-04-30T11:54:19Z | Backend test covered by prefix |
| #66 | [Automation] Interface contract audit: normalize Personal Graph search limit | 2026-04-30T13:01:27Z | Route behavior covered in current backend tests |
| #67 | [Automation] UI runtime audit: clear mobile sidebar rail | 2026-04-30T12:55:47Z | Reviewed, no high-conviction current finding |
| #68 | [Automation] Deprecation audit: remove stale shadcn backup | 2026-04-30T18:09:18Z | Cleanup-only |
| #69 | [Automation] Dependency sweep: path-to-regexp | 2026-04-30T19:44:53Z | Lockfile-only |
| #70 | [Automation] Performance audit: pause static graph render loop | 2026-04-30T19:49:51Z | Neural graph gate already fixed later |
| #71 | [Automation] Update AGENTS.md: remove stale Codelassian refs | 2026-04-30T23:50:13Z | Docs-only |
| #72 | fix(personal-graph): remove gradient backdrop | 2026-05-01T02:07:04Z | Reviewed, no high-conviction current finding |
| #73 | Add dashed grid stroke controls to pattern tile | 2026-05-01T02:13:58Z | Current helper/test split exists |
| #74 | [Automation] Code simplification: clarify neural layout edges | 2026-05-01T12:40:10Z | Reviewed, no high-conviction current finding |
| #75 | [Automation] Test coverage: transparent graph rendering | 2026-05-01T12:45:14Z | Test-only, no current finding |
| #76 | [Automation] Interface contract audit: filter GUI copied values | 2026-05-01T12:51:49Z | Current helper/test split exists |
| #77 | [Automation] Deprecation audit: remove ChatMessages compatibility API | 2026-05-01T15:06:56Z | Removal/current API surface fine |
| #78 | [Automation] Performance audit: cache neural node ranking | 2026-05-02T06:27:54Z | Reviewed, no high-conviction current finding |
| #79 | [Automation] Bug scan: restore Personal Graph backdrop grid contrast | - | Skipped, closed unmerged |
| #80 | [Automation] Dependency sweep: postcss | 2026-05-02T06:27:41Z | Dependency-only |
| #81 | [Automation] Update AGENTS.md: include arts frontend surface | 2026-05-02T06:27:19Z | Docs-only |
| #82 | feat(visual): expand ASCII shader controls | 2026-05-02T06:28:05Z | Finding: oversized ASCII shader/control ownership |
| #83 | Expose 14 neural graph render knobs as editable params | 2026-05-02T06:28:12Z | Neural graph gate already fixed later |
| #84 | Lock CSS layer cascade order and migrate unlayered overrides | 2026-05-02T08:43:29Z | Reviewed, no high-conviction current finding |
| #85 | Migrate utility-shaped classes to @utility (Tailwind v4 idiom) | 2026-05-02T09:48:33Z | Reviewed, no high-conviction current finding |
| #86 | AGENTS.md: capture @utility idiom + cascade-order invariant | 2026-05-02T09:57:04Z | Docs-only |
| #87 | [Automation] Code simplification: neural graph node drawing | 2026-05-02T10:44:38Z | Reviewed, no new neural graph ownership finding |
| #88 | [Automation] Test coverage: Personal Graph intro phases | 2026-05-02T10:42:32Z | Finding: pure intro-phase test outside JS unit gate |
| #89 | [Automation] Interface contract audit: document Graph embed props | 2026-05-02T20:07:26Z | Graph demo source-grep gate already intentionally skipped |
| #90 | [Automation] Deprecation audit: remove PlanTabContent compatibility props | 2026-05-02T19:51:15Z | Removal/current API surface fine |
| #91 | [Automation] Performance audit: reuse neural render relationships | 2026-05-02T19:49:03Z | Neural graph gate already fixed later |
| #92 | [Automation] Update AGENTS.md: clarify worktree env seeding | 2026-05-02T22:38:44Z | Docs-only |

## Remediation Plan

Highest-value still-valid batch selected for implementation: extract the ASCII control/default model out of `ascii-demo.tsx` and add focused pure tests.

Why this batch:

- It addresses the strongest structural finding from this window without a broad shader rewrite.
- It makes the demo's defaults/options/helper behavior testable as data instead of source regex.
- It shrinks an oversized owner file and establishes the seam needed for a later shader-source/uniform split.

Implementation plan:

1. Add `components/website/demos/visual/shaders/ascii-core.ts` for shared ASCII constants/types.
2. Re-export those constants/types from `shaders/ascii.tsx` to keep existing import compatibility.
3. Add `components/website/demos/visual/ascii-control-model.ts` for demo options, defaults, and pure helpers.
4. Update `ascii-demo.tsx` to import the extracted control model.
5. Add focused `ascii-control-model.test.js` and admit it into `scripts/run-js-unit-tests.mjs`.
6. Update the existing ASCII demo source-shape test so it tracks the new control-model owner.

## Remediation Applied

- Added `components/website/demos/visual/shaders/ascii-core.ts` to own shared ASCII constants and type aliases.
- Re-exported those constants/types from `components/website/demos/visual/shaders/ascii.tsx` so existing import compatibility is preserved.
- Added `components/website/demos/visual/ascii-control-model.ts` to own demo source-mode options, animation/background/color option labels, default values, image-background defaults, preview aspect ratio resolution, and animation cycle-speed math.
- Updated `components/website/demos/visual/ascii-demo.tsx` to consume the extracted control model.
- Added `components/website/demos/visual/ascii-control-model.test.js` with focused pure coverage for the extracted model.
- Added that focused test to `scripts/run-js-unit-tests.mjs`; the full JS-unit report now lists `components/website/demos/visual/ascii-control-model.test.js` as included.
- Updated `components/website/demos/visual/ascii-demo.test.js` so existing source-shape coverage tracks the new control-model and core owners.

Line-count impact:

```text
components/website/demos/visual/ascii-demo.tsx: 1279 lines
components/website/demos/visual/ascii-control-model.ts: 134 lines
components/website/demos/visual/shaders/ascii.tsx: 1697 lines
components/website/demos/visual/shaders/ascii-core.ts: 61 lines
```

Focused validation:

```text
pnpm exec node --test components/website/demos/visual/ascii-control-model.test.js components/website/demos/visual/ascii-demo.test.js
```

Result: 11 tests passed.

Full validation:

```text
pnpm run test:unit:js
pnpm run lint
pnpm run typecheck
```

Result: all passed.
