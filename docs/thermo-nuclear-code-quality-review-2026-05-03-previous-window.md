# Thermo-Nuclear Code Quality Review - 2026-05-03 Previous Window

## Scope

- Existing report files read first:
  - `docs/thermo-nuclear-code-quality-review-2026-06-21.md`
  - `docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-31-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-24-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-17-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-10-previous-window.md`
- Prior covered windows:
  - `2026-06-14` through `2026-06-21`
  - `2026-06-07` through `2026-06-13`
  - `2026-05-31` through `2026-06-06`
  - `2026-05-24` through `2026-05-30`
  - `2026-05-17` through `2026-05-23`
  - `2026-05-10` through `2026-05-16`
- Oldest covered `mergedAt` extracted from existing reviewed tables: `2026-05-10T01:01:38Z` (`#139`).
- This non-overlapping review window: merged PRs targeting `main` from `2026-05-03` through `2026-05-09`.
- Baseline before this report's remediation edit: `/Users/esoh/Documents/Labs/vpk-rovo` at `5ef6dc8d6bcbdde850451b27cd8c6aae09416b98` (`origin/main`).
- Requested standard: `thermo-nuclear-code-quality-review`, focused on structural simplification, file-size crossings, spaghetti growth, boundary leaks, duplicated contracts, and canonical ownership.

## Prior Report Extraction

All PR numbers already reviewed in explicit `Reviewed PRs` sections:

```text
#137-#139, #141-#153, #155-#164, #166-#188, #190-#227,
#229-#247, #249-#262, #264-#271, #273-#283, #285-#327,
#329-#419, #421-#526, #529-#708, #710-#775, #777-#780,
#782-#876, #878-#895, #897
```

All PR numbers already listed anywhere in the existing reports, including high-priority findings, skipped/fixed notes, and remediation references:

```text
#137-#227, #229-#876, #878-#986, #990, #994, #996,
#1000-#1001, #1005-#1008, #1019
```

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- Existing reports mark Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, Agent Card ticket-style extraction, Markdown trailing-newline source formatting, screen-assistant geometry CI gating, SVG Tracing parser CI gating, and UserInvalidSync fallback behavior as remediated or shipped.
- Existing reports also supersede older card-directory/AgentCard findings, Contacts route findings after route removal, later PromptInput/floating composer findings, and Personal Graph summary/vpk-html test-gate gaps from the later `2026-05-10` report.

## Method

- Queried GitHub for merged PRs targeting `main` with `merged:2026-05-03..2026-05-09`.
- The query returned 43 merged PRs: `#93` through `#136`, excluding PRs not returned as merged into `main` in this window.
- Excluded every PR already listed in the existing report set; none of `#93..#136` were already listed.
- Inspected merged diff stats, current `main` file state, focused tests, and whether later reports or current source already fixed the issue.
- Kept findings only when current code still shows a maintainability, simplification, correctness, or test-coverage problem.

## Executive Summary

This earlier window was the Personal Graph / visual graph build-out week, plus several small API-contract audits. Most API findings from the window are now guarded by `app/` or `backend/` tests that the JS unit gate already runs. The still-valid issues are concentrated in the Personal Graph visual stack and one root-level installer test:

1. Pure tests for the Personal Graph neural graph and root TWG installer are stable and pass directly, but `pnpm run test:unit:js` still excludes them.
2. The Personal Graph visual/TWG surface still has three 1k+ line owner files that mix graph data, renderer state, sound, layout, controls, and route-level TWG/vault orchestration.
3. Scribbles and Graph demo source-contract tests remain outside the unit gate, but those tests are source-grep heavy; they are not the right first remediation compared with the pure neural graph and installer tests.

## Highest Priority Findings

### 1. Stable neural graph and TWG installer tests are outside the JS unit gate

- PRs: `#96`, `#101`, `#104`, `#105`, `#108`, `#111`, `#116`, `#122`, `#132`
- Current evidence:
  - `scripts/run-js-unit-tests.mjs:12` through `:18` include only `app/`, `backend/`, `lib/`, `rovo/`, and `scripts/` by prefix.
  - `scripts/run-js-unit-tests.mjs:26` starts the explicit `INCLUDED_TEST_FILES` allowlist for selected files outside those prefixes.
  - `components/arts/personal-graph/lib/neural-graph/neural-graph.test.js` is a pure `node:test` suite under `components/arts/`, so it is excluded unless explicitly allowlisted.
  - `twg-install.test.js` lives at the repo root, so it is also excluded unless explicitly allowlisted.
  - Direct validation passed before remediation: `pnpm exec node --test components/arts/personal-graph/lib/neural-graph/neural-graph.test.js` ran 65 passing tests, and `pnpm exec node --test twg-install.test.js` ran 1 passing test.

This is the smallest high-value remediation from the window. The neural graph test covers renderer/store/sound/layout behavior introduced and modified across the visual graph PRs, while the TWG installer test covers a root script that the prefix gate misses by construction.

Smallest remediation batch:

- Add `components/arts/personal-graph/lib/neural-graph/neural-graph.test.js` to `INCLUDED_TEST_FILES`.
- Add `twg-install.test.js` to `INCLUDED_TEST_FILES`.
- Run the focused tests, `pnpm run test:unit:js`, `pnpm run lint`, and `pnpm run typecheck`.

### 2. Personal Graph visual/TWG ownership is still too concentrated

- PRs: `#104`, `#105`, `#111`, `#125`, `#136`
- Current size:
  - `components/arts/personal-graph/personal-graph-neural-canvas.tsx`: 1,228 lines.
  - `components/arts/personal-graph/personal-graph-surface.tsx`: 1,204 lines.
  - `components/website/demos/visual/graph.tsx`: 1,025 lines.
- Current evidence:
  - `components/arts/personal-graph/personal-graph-neural-canvas.tsx:330` starts a component that owns camera refs, drag/wheel state, focus springs, label springs, ray elasticity springs, interaction smoothing, sound trigger state, viewport measurement, render-loop scheduling, hit testing, and overlay updates.
  - `components/arts/personal-graph/personal-graph-neural-canvas.tsx:466` starts the canvas render loop and recomputes layout, camera fitting, drawing, and overlay state in one effect.
  - `components/arts/personal-graph/personal-graph-surface.tsx:457` starts a route surface that owns vault source state, TWG source state, TWG chat-filtered graph state, node expansion state, intro phase, theme toggling, source switching, reset choreography, graph stats, and flyout actions.
  - `components/website/demos/visual/graph.tsx:107` defines the demo default parameter model in the same file that also owns fixture graph data, details panel UI, controls, and the exported visual component.

The pure neural graph library files are already relatively well split (`camera`, `camera-fit`, `interaction`, `layout`, `params`, `ray-sound`, `renderer`, `store`). The debt is the composition layer above them: visual demo data/control ownership and live Personal Graph orchestration both stayed in oversized files. This is still valid, but it is a broader follow-up than the selected test-gate batch.

Smallest follow-up batch:

- Extract `GraphControls` and `VISUAL_GRAPH_EXPLORER` fixture data out of `components/website/demos/visual/graph.tsx`.
- Extract a `usePersonalGraphSourceController` hook from `personal-graph-surface.tsx` that owns vault/TWG source switching, refresh/reset, chat-filtered explorers, and expansion state.
- Extract a canvas render-controller hook from `personal-graph-neural-canvas.tsx` only after the smaller Graph/Surface splits land, so the render-loop risk stays isolated.

## Skipped Because Already Reviewed Or Fixed

- `#137` and later PRs are outside this non-overlapping window and already listed in existing reports.
- `#107` introduced the old `/api/rovo-app/cancel-deferred-tool` JSON handling; current `main` uses `app/api/rovo/cancel-deferred-tool/route.ts` with an `app/`-prefix test, so there is no separate current gap.
- `#112`, `#119`, `#121`, and `#133` are API JSON-body/proxy helper work whose current tests live under `app/` and are already included by prefix.
- `#123` chat SDK text-error handling is currently covered by `app/api/chat-sdk/route.test.js`, and the route now returns `text/plain` errors for AI SDK transport failures.
- `#100`, `#102`, `#114`, `#124`, and `#134` were removal/cleanup PRs with no remaining tracked implementation surface.
- `#126` and `#131` added Scribbles and its SVG-upload source test. The remaining test is mostly source-grep demo wiring, so it was intentionally not selected for the unit-gate remediation batch.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #93 | [Automation] UI design quality audit: hide cramped flyout labels | 2026-05-03T10:18:19Z | Reviewed, no high-conviction current finding |
| #94 | [Automation] Code simplification: vault config reset | 2026-05-03T10:26:08Z | Current backend test is included by prefix |
| #95 | [Automation] Test coverage: Personal Graph vault reset | 2026-05-03T10:22:52Z | Current app/backend tests are included by prefix |
| #96 | [Automation] Test coverage: neural graph ray color | 2026-05-04T16:13:06Z | Finding: neural graph test outside JS unit gate |
| #97 | [Automation] Code simplification: neural graph color params | 2026-05-04T16:16:43Z | Covered by neural graph test-gate finding |
| #98 | [Automation] Interface contract audit: sprint board JSON errors | 2026-05-04T16:19:15Z | Current app route test is included by prefix |
| #99 | [Automation] Frontend runtime audit: hidden fallback focus stop | 2026-05-04T16:24:49Z | Reviewed, no high-conviction current finding |
| #100 | [Automation] Deprecation audit: stale third-party logo artifacts | 2026-05-04T16:26:35Z | Removal only, no current code finding |
| #101 | [Automation] Performance audit: avoid neural kind-group copies | 2026-05-05T03:50:42Z | Finding: neural graph test outside JS unit gate |
| #102 | [Automation] Deprecation audit: remove unused loading assets | 2026-05-05T07:31:31Z | Removal only, no current code finding |
| #103 | [Automation] Code simplification: liquid glass fallback branch | 2026-05-05T10:43:12Z | Reviewed, no high-conviction current finding |
| #104 | feat(graph): add elastic ray hover interactions | 2026-05-05T10:40:03Z | Findings: neural graph test gate; Personal Graph visual ownership |
| #105 | feat(graph): add dynamic ray hover sound | 2026-05-05T13:16:18Z | Findings: neural graph test gate; Personal Graph visual ownership |
| #106 | [Automation] Bug scan: Liquid Glass fallback guard | 2026-05-05T13:05:21Z | Reviewed, no high-conviction current finding |
| #107 | [Automation] Interface contract audit: deferred tool JSON errors | 2026-05-05T13:07:02Z | Fixed/current route test is included by prefix |
| #108 | [Automation] Performance audit: cache renderer color resolution | 2026-05-05T13:09:07Z | Finding: neural graph test outside JS unit gate |
| #109 | [Automation] Frontend runtime audit: title accessible name | 2026-05-05T13:11:12Z | Current app source test is included by prefix |
| #110 | [Automation] Update AGENTS.md: document PR CI gate | 2026-05-05T22:38:32Z | Docs-only, no code finding |
| #111 | Add living graph hover interaction | 2026-05-05T22:37:27Z | Findings: neural graph test gate; Personal Graph visual ownership |
| #112 | [Automation] Interface contract audit: wiki sync JSON errors | 2026-05-06T09:43:48Z | Current helper/route tests are included by prefix |
| #113 | [Automation] Frontend runtime audit: hidden composer focus | 2026-05-06T09:50:33Z | Current app source test is included by prefix |
| #114 | [Automation] Deprecation audit: unused nested badge demos | 2026-05-06T09:53:12Z | Removal only, no current code finding |
| #115 | Update Liquid Glass with interactive button support | 2026-05-06T12:24:50Z | Reviewed, no high-conviction current finding |
| #116 | [Automation] Performance audit: selected edge draw order | 2026-05-06T12:18:42Z | Finding: neural graph test outside JS unit gate |
| #117 | [Automation] Test coverage: sprint-board null payload | 2026-05-06T12:55:09Z | Current app route test is included by prefix |
| #118 | [Automation] Update AGENTS.md: include website demos | 2026-05-07T02:41:58Z | Docs-only, no code finding |
| #119 | [Automation] Engineering improvement map: guard memory explorer JSON contracts | 2026-05-07T02:13:28Z | Current app route tests are included by prefix |
| #120 | [Automation] UI design quality audit: GUI disclosure state | 2026-05-07T01:55:25Z | Current GUI test is explicitly included |
| #121 | [Automation] Code simplification: memory explorer proxy posts | 2026-05-07T05:34:45Z | Current app route tests are included by prefix |
| #122 | [Automation] Test coverage: twg installer skip-download | 2026-05-07T05:32:16Z | Finding: root installer test outside JS unit gate |
| #123 | [Automation] Interface contract audit: chat SDK text errors | 2026-05-07T05:29:43Z | Fixed/current chat SDK route test is included by prefix |
| #124 | [Automation] Deprecation audit: remove unused agent-browser wrapper | 2026-05-07T11:03:16Z | Superseded/removal, no current code finding |
| #125 | [Automation] Performance audit: reuse neural graph store | 2026-05-07T13:03:19Z | Finding: Personal Graph visual ownership |
| #126 | Add Scribbles visual demo with SVG upload support | 2026-05-07T13:11:05Z | Reviewed, source-grep-heavy demo test not selected |
| #127 | [Automation] Update AGENTS.md: clarify Symphony browser evidence | 2026-05-08T12:48:52Z | Docs-only, no code finding |
| #128 | [Automation] Engineering improvement map: API proxy contracts | 2026-05-08T12:45:25Z | Rules-only, no code finding |
| #130 | docs: add Cursor Cloud specific instructions to AGENTS.md | 2026-05-08T14:04:27Z | Docs-only, no code finding |
| #131 | [Automation] Test coverage: Scribbles SVG upload | 2026-05-08T12:42:55Z | Reviewed, source-grep-heavy demo test not selected |
| #132 | [Automation] Code simplification: neural store construction | 2026-05-08T12:41:05Z | Finding: neural graph test outside JS unit gate |
| #133 | [Automation] Interface contract audit: job action JSON bodies | 2026-05-08T12:39:23Z | Current app route test is included by prefix |
| #134 | [Automation] Deprecation audit: tracked local artifacts | 2026-05-08T12:37:19Z | Cleanup only, no current code finding |
| #135 | Tokenize parallax utility transition durations/easing | 2026-05-08T14:01:18Z | CSS token cleanup, no current code finding |
| #136 | feat(personal-graph): add TWG source and summaries | 2026-05-08T14:17:47Z | Finding: Personal Graph visual/TWG ownership |

## Remediation Plan

Highest-value small batch selected for implementation: graduate the stable neural graph and root TWG installer tests into the JS unit gate.

Why this batch:

- It directly addresses still-valid coverage gaps from the reviewed window.
- It avoids a broad Personal Graph decomposition while still protecting the highest-risk graph renderer/store code.
- Both tests pass directly and are stable `node:test` contracts, unlike the source-grep-heavy Scribbles/Graph demo tests.
- The change is one small allowlist edit in the repo-owned JS unit runner.

## Remediation Applied

Implemented after the report review pass:

- Added `twg-install.test.js` to `scripts/run-js-unit-tests.mjs` `INCLUDED_TEST_FILES`.
- Added `components/arts/personal-graph/lib/neural-graph/neural-graph.test.js` to `INCLUDED_TEST_FILES`.
- Updated the allowlist comment so root-level explicit test files fit the documented selection model.

Focused validation:

```text
pnpm exec node --test components/arts/personal-graph/lib/neural-graph/neural-graph.test.js twg-install.test.js
```

Result: 66 tests passed.

Inclusion proof:

```text
twg-install.test.js { included: true, reason: 'included-file' }
components/arts/personal-graph/lib/neural-graph/neural-graph.test.js { included: true, reason: 'included-file' }
```

Full validation:

```text
pnpm run test:unit:js
pnpm run lint
pnpm run typecheck
```

Result: all passed. The JS unit runner reported `32 included, 239 excluded` component `node:test` files, with `components/arts/personal-graph/lib/neural-graph/neural-graph.test.js` now included.
