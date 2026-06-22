# Thermo-Nuclear Code Quality Review - 2026-05-17 Previous Window

## Scope

- Existing report files read first:
  - `docs/thermo-nuclear-code-quality-review-2026-06-21.md`
  - `docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-31-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-24-previous-window.md`
- Prior covered windows:
  - `2026-06-14` through `2026-06-21` in the original report.
  - `2026-06-07` through `2026-06-13` in the first previous-window report.
  - `2026-05-31` through `2026-06-06` in the second previous-window report.
  - `2026-05-24` through `2026-05-30` in the third previous-window report.
- Oldest covered `mergedAt` extracted from the existing reviewed tables: `2026-05-24T09:11:57Z` (`#297`).
- This non-overlapping review window: merged PRs targeting `main` from `2026-05-17` through `2026-05-23`.
- Current-main evidence baseline before this report's remediation edit: `/Users/esoh/Documents/Labs/vpk-rovo` at `a8f4b7d8a7d30dbe0a48f8b3b370235531f3df60` (`origin/main`).
- Requested standard: `thermo-nuclear-code-quality-review`, focused on structural simplification, file-size crossings, spaghetti growth, boundary leaks, duplicated contracts, and canonical ownership.

## Prior Report Extraction

Existing reviewed-table rows cover PRs `#297` through `#876`, excluding unmerged/missing `#328`, `#420`, `#527`, `#528`, `#709`, `#776`, and `#781`, plus later reviewed PRs `#878` through `#986`, `#990`, `#994`, `#996`, `#1000`, `#1001`, and `#1005` through `#1008`.

All PR numbers already listed anywhere in the existing reports, including high-priority findings, skipped/fixed notes, and remediation references:

```text
#297-#876, #878-#986, #990, #994, #996, #1000-#1001, #1005-#1008, #1019
```

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- Existing report notes mark Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, Agent Card ticket-style extraction, Markdown trailing-newline source formatting, screen-assistant geometry CI gating, and SVG Tracing parser CI gating as remediated or shipped.
- Existing reports already captured or skipped later-owned Studio shell bloat, Agent Browser ownership, Agent Card/CardDirectory churn, RovoCursor keyframe injection, assistant trace state, PromptInput/floating composer behavior, backend Studio result parsing, and old `card-directory` paths.

## Method

- Queried GitHub for merged PRs targeting `main` with `merged:2026-05-17..2026-05-23`.
- The query returned 55 merged PRs: `#238` through `#296`, excluding PRs not returned as merged into `main` in this window (`#248`, `#263`, `#272`, and `#284`).
- Split the review into read-only slices across `#238..#254`, `#255..#271`, and `#273..#296`, then reconciled agent results against current `main`.
- Inspected merged diff stats for high-risk PRs and compared current owner files against later report exclusions.
- Ignored issues already fixed by later PRs and every PR already listed in the existing report set.

## Executive Summary

This window is the first large RFP demo and modern-web-audit slice. Most visible UI churn was either superseded by later Studio/Agent reports or is too broad to remediate safely in one pass. The still-valid problems cluster around smaller correctness and ownership boundaries:

1. `UserInvalidSync` mirrors `:user-invalid` too broadly and can overwrite explicit validation state.
2. RFP Canvas can attach a generated report before its HTML preview is ready.
3. The RFP demo backend and frontend still duplicate a large state model, and generic job reads can advance demo state as a side effect.
4. Multi-card RFP board moves are applied as serialized single-card backend mutations.
5. Shared browser/runtime policies from the May 22 audit remain inline or duplicated instead of living behind focused helpers.

The highest-value cleanup is the `UserInvalidSync` fix: it is a concrete accessibility correctness bug with a small owner file and a deterministic unit test path.

## Highest Priority Findings

### 1. `UserInvalidSync` can overwrite explicit validation state

- PR: `#287`
- Evidence:
  - `components/utils/user-invalid-sync.tsx:18` syncs any blurred `Element`.
  - `components/utils/user-invalid-sync.tsx:22` writes `aria-invalid`.
  - `components/utils/user-invalid-sync.tsx:23` maps every non-`:user-invalid` target to `aria-invalid="false"`.
  - Many demo and primitive call sites intentionally pass explicit `aria-invalid`, including `components/website/demos/ui/forms-demo.tsx` and `components/ui/inline-edit.tsx`.

The current bridge does not distinguish native constraint-validation controls from arbitrary focus targets. It also treats a false pseudo-class match as an instruction to write `aria-invalid="false"`, which can add ARIA state to unrelated elements and can override form-library or server-driven `aria-invalid="true"` before that explicit state clears.

Smallest remediation batch:

- Only sync native constraint controls (`input`, `textarea`, and `select`).
- Track bridge-owned state with a private marker.
- Set `aria-invalid="true"` only when the bridge owns the attribute and `:user-invalid` currently matches.
- Remove the bridge-owned attribute when the control becomes valid.
- Leave existing explicit `aria-invalid` values untouched.
- Add focused tests for explicit invalid state, untouched valid fields, bridge-owned invalid state cleanup, and non-control targets.

### 2. RFP Canvas can attach before the HTML preview is ready

- PRs: `#240`, `#246`
- Evidence:
  - `components/projects/agents/components/rfp-report-canvas.tsx:89` maps every non-error preview state to Rovo Canvas `ready`.
  - `components/projects/agents/components/rfp-report-canvas.tsx:303` renders the primary action regardless of preview readiness.
  - `components/projects/agents/components/rfp-report-canvas.tsx:304` calls attach with `reportPreview.html ?? undefined`.
  - `components/projects/agents/page.test.js:163` currently pins the fallback-to-undefined behavior.

The current UI can create an attached/PDF state before the HTML preview document exists. The later vpk-html and report-preview route work made the preview pipeline stronger, but the Canvas action still has no readiness guard.

Smallest remediation batch:

- Add a disabled/pending primary-action contract to `RovoCanvas`.
- Disable `Add PDF to RFP-101` until `reportPreview.status === "ready"` and `reportPreview.html` is present.
- Replace the current source assertion with a guard assertion.

### 3. RFP demo backend needs a real service boundary

- PR: `#257`
- Evidence:
  - `backend/lib/agents-rfp-demo-state.js:248` starts the default backend state owner; current file size is 1,589 lines.
  - `backend/lib/agents-rfp-demo-state.js:643` starts backend normalization.
  - `backend/lib/agents-rfp-demo-state.js:1127` starts `runRfpDraftingAgent`.
  - `backend/lib/agents-rfp-demo-state.js:1350` starts `advanceRfpDraftingAgentProcessing`.
  - `backend/server.js:15415` through `:15489` keeps route handling inline.
  - `backend/server.js:15505` and `:15552` call demo advancement during generic job reads.

The RFP demo state module owns seed data, default state, normalization, execution, advancement, event mutation, thread metadata, generated HTML fallback behavior, and disk persistence. Separately, `backend/server.js` still owns Hermes job metadata, thread persistence, report generation, chat streaming, and API route glue. The most surprising current behavior is that reading generic job endpoints can advance demo state, generate output, and persist changes.

Smallest remediation batch:

- Extract an `agents-rfp-demo-service` wrapper around state manager, job runner, route actions, and cleanup.
- Keep generic job reads side-effect-free, or move advancement behind explicit RFP demo routes/scheduler behavior.
- Add tests around read-only job calls and explicit advancement.

### 4. RFP demo state contracts are duplicated across frontend and backend

- PRs: `#240`, `#257`, `#277`
- Evidence:
  - `components/projects/agents/lib/rfp-demo-state.ts:425` starts frontend default state construction.
  - `components/projects/agents/lib/rfp-demo-state.ts:468` starts frontend report-version normalization.
  - `components/projects/agents/lib/rfp-demo-state.ts:562` starts frontend local-state parsing.
  - `backend/lib/agents-rfp-demo-state.js:551` starts backend report-version normalization.
  - `backend/lib/agents-rfp-demo-state.js:643` starts backend full-state normalization.
  - `components/projects/agents/lib/rfp-demo-state.test.js` is a focused pure test but is not currently admitted into `scripts/run-js-unit-tests.mjs`.

The backend is now the source of truth, but the frontend still carries a parallel model with its own defaults, parsing, movement, agent creation, report stages, and Review-column sorting. That creates drift risk at exactly the UI/server boundary. The immediate small gap is test coverage: the focused frontend state contract test passes directly, but it lives under `components/` and is not included in the JS-unit allowlist.

Smallest remediation batch:

- Add `components/projects/agents/lib/rfp-demo-state.test.js` to the explicit component test allowlist.
- Longer term, move shared defaults/normalization into a canonical shared contract or reduce the frontend module to selectors and optimistic-only helpers.

### 5. Multi-card board moves are persisted as serialized single-card mutations

- PR: `#266`
- Evidence:
  - `components/projects/agents/hooks/use-agents-rfp-demo-state.ts:135` starts `postStateMutation`.
  - `components/projects/agents/hooks/use-agents-rfp-demo-state.ts:201` loops through moved card codes and awaits one backend event call per card.
  - `backend/server.js:15473` accepts one ticket event payload.
  - `backend/server.js:1335` already supports running an RFP job with multiple ticket codes.
  - `components/projects/agents/hooks/use-agents-rfp-demo-state.test.js:20` source-checks the sequential loop.

The frontend applies the bulk move locally, then posts one ticket event at a time. Each backend response replaces state, so partial failure or response ordering can leave the persisted board behind the UI's atomic local move.

Smallest remediation batch:

- Let the event endpoint accept `ticketCodes`.
- Update board state once and run one RFP job with the whole set.
- Replace the source-shape test with a batch-mutation contract.

## Medium Priority Findings

### 6. Theme iframe sync has multiple theme-apply paths

- PR: `#296`
- Evidence:
  - `components/utils/theme-wrapper.tsx:83` hydrates stored theme through raw state.
  - `components/utils/theme-wrapper.tsx:160` handles messages/storage through another path.
  - `components/utils/theme-wrapper.tsx:177` is the only path that broadcasts theme changes.

Theme storage, local state, and iframe broadcast should be one atomic operation with explicit `persist`, `broadcast`, and `source` options. Current code can let nested or already-mounted frames miss relayed theme updates.

### 7. `PatternTile` has a demo-directory owner while shared surfaces import it

- PR: `#241`
- Evidence:
  - `components/ui-custom/twg-tool.tsx:18`
  - `components/blocks/twg-agent-card/components/twg-agent-card.tsx:10`
  - `components/arts/awake/widget-card.tsx:8`
  - `components/arts/personal-graph/personal-graph-backdrop.tsx:4`
  - `app/data/components.ts:483`

Reusable UI, block, and art surfaces import a general visual primitive from `components/website/demos/visual/pattern-tile`. The primitive should live in a canonical non-demo owner, with the website demo importing it.

### 8. Animation visibility/reduced-motion logic is copied across components

- PR: `#293`
- Evidence:
  - `components/ui-audio/waveform.tsx:25`
  - `components/ui-audio/bar-visualizer.tsx:390`
  - `components/ui-custom/animated-rovo.tsx:125`
  - `components/website/demos/visual/shaders/logo-spectrum.tsx:408`

The May 22 audit paused many off-screen animations, but the implementation kept repeated `prefers-reduced-motion`, `IntersectionObserver`, and `visibilitychange` logic in many components. A shared `useAnimationVisibility` helper would reduce future drift.

### 9. HTTP security policy and preload discovery still live inline in `backend/server.js`

- PR: `#294`
- Evidence:
  - `backend/server.js:1394` configures Helmet/CSP inline.
  - `backend/server.js:1435` configures CORS allowlist inline.
  - `backend/server.js:15937` owns static preload filesystem discovery.

The policy is not wrong, but it is hidden inside a 16k-line server file with limited focused test coverage. Extracting `http-security` and `static-preload-links` helpers would make allowed origins, denied origins, CSP shape, and CSS/JS asset selection directly testable.

## Skipped Because Already Reviewed Or Fixed

- `#297` and later PRs are outside this non-overlapping window and already listed in existing reports.
- `#238`, `#239`, `#260`, `#261`, `#274`, `#281`, `#282`, and `#295` are docs/rule/reference-only changes in this slice.
- `#245` and `#247` are GitHub Actions/Dependabot config changes with no still-valid code-quality finding.
- `#242` overlaps with assistant-trace/thinking-state ownership already captured by later reports.
- `#243` and `#253` have later current-main Portless helper coverage and no separate still-valid issue.
- `#262` introduced a custom-agent switching surface that has materially changed on current `main`; the original `components/projects/rovo/data/agent-profiles.ts` path no longer exists.
- `#268` and `#269` were reviewed as intentional `vpk-html` / `generate-pdf` naming and label work; current tests cover visible generate-pdf labels while the repo-local skill path and generator metadata remain `vpk-html`.
- `#278` removed generated RFP media assets; current `main` has no remaining references.
- `#292` top-layer animation class split remains lower-priority and overlaps the broader animation-helper finding above.
- `#283` memoized one broad chat context but did not create a narrow re-render boundary. This remains true, but it is a broad standalone refactor and not the smallest useful remediation for this window.
- `#290`, `#291`, and `#288` were broad audit polish bundles; no additional still-valid issue was kept beyond the specific animation, validation, and backend policy findings above.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #238 | [Automation] Update AGENTS.md: refresh provider appendix | 2026-05-17T01:28:29Z | Docs-only, no code finding |
| #239 | [Automation] Engineering improvement map: skill script validation | 2026-05-17T01:28:38Z | Docs/rules-only, no code finding |
| #240 | Implement the Rovo RFP demo plan | 2026-05-17T01:24:35Z | Findings: RFP Canvas readiness, RFP state duplication |
| #241 | Add TWG Tool UI-AI component and demos | 2026-05-17T01:15:57Z | Finding: PatternTile owner |
| #242 | Refine Chain of Thought labels and thinking-state visuals | 2026-05-17T01:16:23Z | Skipped, assistant trace/thinking already covered later |
| #243 | Add portless dev routes for frontend and RovoDev | 2026-05-17T03:01:28Z | Reviewed, no new still-valid finding |
| #244 | Adopt explicit Portless routing and reuse the TWG pattern tile banner | 2026-05-17T04:26:32Z | Finding: PatternTile owner |
| #245 | Enable Dependabot for GitHub Actions | 2026-05-17T04:51:34Z | Config-only, no finding |
| #246 | Add HTML preview support for RFP report attachments | 2026-05-17T04:52:06Z | Finding: RFP Canvas readiness |
| #247 | Bump the github-actions group with 3 updates | 2026-05-17T04:56:24Z | Dependency/config-only, no finding |
| #249 | [Automation] Test coverage: RFP HTML preview route | 2026-05-17T11:22:31Z | Useful coverage, RFP Canvas readiness gap remains |
| #250 | [Automation] Code simplification: RFP agent name reuse | 2026-05-17T11:22:38Z | Reviewed, no high-conviction finding |
| #251 | Add a small size variant to CodeBlock | 2026-05-17T11:14:13Z | Reviewed, no high-conviction finding |
| #252 | Fix Rovo Generation stop behavior and linear motion sweep | 2026-05-17T11:14:26Z | Reviewed, no high-conviction finding |
| #253 | Slim pnpm ports output, add watch mode and Portless URLs | 2026-05-17T11:28:20Z | Reviewed, no new still-valid finding |
| #254 | Tokenize UI custom motion durations | 2026-05-17T11:29:11Z | Reviewed, no high-conviction finding |
| #255 | [Automation] Interface contract audit: RovoDev pool ports | 2026-05-17T18:12:44Z | Reviewed, no high-conviction finding |
| #256 | [Automation] Deprecation audit: vpk icon aliases | 2026-05-17T18:13:18Z | Reviewed, no high-conviction finding |
| #257 | Implement backend-persisted event-driven RFP drafting flow | 2026-05-17T18:15:08Z | Findings: RFP backend service boundary, duplicated state model, non-atomic bulk moves |
| #258 | [Automation] Performance audit: reuse Rovo timeline formatter | 2026-05-17T20:02:43Z | Reviewed, no high-conviction finding |
| #259 | [Automation] Bug scan: remove Rovo Canvas translucent overlay | 2026-05-17T20:03:20Z | Reviewed, no high-conviction finding |
| #260 | [Automation] Update AGENTS.md: mention pnpm ports watch | 2026-05-18T02:56:08Z | Docs-only, no code finding |
| #261 | [Automation] Engineering improvement map: shared route gates | 2026-05-18T02:56:25Z | Docs/rules-only, no code finding |
| #262 | Add consistent custom agent switching across Rovo chat surfaces | 2026-05-18T03:54:17Z | Skipped, original surface changed on current main |
| #264 | Refresh RFP trigger editor | 2026-05-18T08:17:01Z | Covered by broader RFP state/backend findings |
| #265 | Refine RFP agent activity timeline | 2026-05-18T11:35:21Z | Covered by broader RFP state/backend findings |
| #266 | Add multi-select and bulk move to RFP kanban board | 2026-05-18T08:16:03Z | Finding: non-atomic persisted bulk moves |
| #267 | Tokenize RovoGeneration rainbow stops | 2026-05-18T08:22:02Z | Reviewed, no high-conviction finding |
| #268 | Add <main> landmark to HTML templates and rename vpk-html -> generate-pdf | 2026-05-18T12:02:00Z | Reviewed, intentional naming split remains |
| #269 | [Automation] Interface contract audit: generate-pdf thinking labels | 2026-05-18T16:46:24Z | Reviewed, no high-conviction finding |
| #270 | [Automation] Frontend runtime audit: kanban drag payload | 2026-05-18T16:46:31Z | Reviewed, no high-conviction finding |
| #271 | [Automation] Deprecation audit: RovoDev generated config | 2026-05-18T16:46:39Z | Reviewed, no high-conviction finding |
| #273 | [Automation] Performance audit: shrink Venn avatar asset | 2026-05-18T20:02:13Z | Reviewed, no high-conviction finding |
| #274 | [Automation] Update AGENTS.md: align workflow guidance | 2026-05-19T11:45:25Z | Docs-only, no code finding |
| #275 | [Automation] Engineering improvement map: template landmark guard | 2026-05-19T11:45:34Z | Reviewed, no high-conviction finding |
| #276 | [Automation] Code simplification: Atlassian logo anchors | 2026-05-19T11:45:42Z | Reviewed, no high-conviction finding |
| #277 | [Automation] Interface contract audit: RFP report versions | 2026-05-19T20:09:33Z | Finding: duplicated RFP report normalization |
| #278 | [Automation] Deprecation audit: unused RFP media assets | 2026-05-19T20:07:58Z | Fixed/removed, no current references |
| #279 | [Automation] Performance audit: precompute session recency | 2026-05-19T20:08:08Z | Reviewed, no high-conviction finding |
| #280 | [Automation] Bug scan: RFP context harness | 2026-05-19T20:08:17Z | Reviewed, no high-conviction finding |
| #281 | [Automation] Update AGENTS.md: document Hermes guidance | 2026-05-21T01:55:59Z | Docs-only, no code finding |
| #282 | [Automation] Engineering improvement map: editor state guard | 2026-05-21T01:56:16Z | Docs/rules-only, no code finding |
| #283 | contexts: memoize 3 inline context values (Theme E) | 2026-05-22T20:33:28Z | Broad context split remains, not selected for this batch |
| #285 | images: mark LCP heroes with priority (Finding 19) | 2026-05-22T20:34:10Z | Reviewed, no high-conviction finding |
| #286 | a11y: 4 quick wins (F14+12+25+27) | 2026-05-22T20:34:20Z | Reviewed, no high-conviction finding |
| #287 | forms: adopt :user-invalid across 9 primitives | 2026-05-22T20:34:29Z | Finding: UserInvalidSync overwrites validation state |
| #288 | layout/css: a11y + LCP polish (F21+22+23+26+31+32) | 2026-05-22T20:35:50Z | Reviewed, no high-conviction finding |
| #289 | audit: F11 - kanban-board cleanup (4 issues in one file) | 2026-05-22T20:34:37Z | Reviewed, no high-conviction finding |
| #290 | audit: Theme B (cv-auto sweep) + F24 (font-face overrides) + CLAUDE Browser-support policy | 2026-05-22T20:36:40Z | Reviewed, no separate current finding |
| #291 | audit: polish bundle (F3 + F16 + F17/F18 + F29 + F30) | 2026-05-22T20:34:48Z | Reviewed, no separate current finding |
| #292 | audit: Theme D - consolidate top-layer animations (7 primitives) | 2026-05-22T20:35:08Z | Lower-priority motion split remains |
| #293 | Audit: pause decorative animations off-screen, on hidden tab, with reduced motion | 2026-05-22T20:35:19Z | Finding: duplicated animation visibility logic |
| #294 | backend: security headers + CORS allowlist + LCP preload headers | 2026-05-22T21:12:01Z | Finding: inline HTTP policy/preload discovery |
| #295 | docs: add Modern Web Audit reference document | 2026-05-23T00:08:18Z | Docs-only, no code finding |
| #296 | theme-wrapper: sync theme to nested iframes via postMessage | 2026-05-23T00:14:25Z | Finding: multiple theme apply paths |

## Recommended Smallest Refactor

Start with the `UserInvalidSync` remediation from `#287`.

Why this batch first:

- It is a concrete correctness and accessibility issue, not just structural taste.
- The owner is one small utility file.
- The current behavior can interfere with explicit `aria-invalid` values supplied by form libraries and app code.
- The fix is testable with a focused component utility test and does not require browser or route-level changes.

Implementation plan:

1. Export a small `syncUserInvalidAriaState` helper from `components/utils/user-invalid-sync.tsx`.
2. Restrict syncing to native input, textarea, and select controls.
3. Track bridge-owned `aria-invalid` with a private data attribute.
4. Leave explicit `aria-invalid` values untouched.
5. Add `components/utils/user-invalid-sync.test.js` and admit it into `scripts/run-js-unit-tests.mjs`.
6. Run the focused test, `pnpm run test:unit:js`, `pnpm run lint`, and `pnpm run typecheck`.

## Remediation Applied

- `components/utils/user-invalid-sync.tsx` now exports small bridge helpers, syncs only native `input`, `textarea`, and `select` controls, and tracks bridge-owned `aria-invalid` state with `data-user-invalid-sync`.
- Explicit `aria-invalid` values are left untouched; untouched valid controls no longer receive `aria-invalid="false"`; bridge-owned invalid state is removed when the control no longer matches `:user-invalid`; and external `aria-invalid` mutations can take ownership before bridge cleanup.
- Added `components/utils/user-invalid-sync.test.js` and admitted it into the explicit `components/` JS-unit allowlist in `scripts/run-js-unit-tests.mjs`.
- Verified with `pnpm exec node --test components/utils/user-invalid-sync.test.js`, `pnpm run test:unit:js`, `pnpm run lint`, and `pnpm run typecheck`.
