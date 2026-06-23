# Thermo-Nuclear Code Quality Review - 2026-04-12 Previous Window

## Scope

- Existing report files read first:
  - `docs/thermo-nuclear-code-quality-review-2026-06-21.md`
  - `docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-06-23-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-31-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-24-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-17-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-10-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-03-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-04-19-previous-window.md`
- Prior covered windows:
  - `2026-06-14` through `2026-06-21`
  - `2026-06-07` through `2026-06-13`
  - `2026-05-31` through `2026-06-06`
  - `2026-05-24` through `2026-05-30`
  - `2026-05-17` through `2026-05-23`
  - `2026-05-10` through `2026-05-16`
  - `2026-05-03` through `2026-05-09`
  - `2026-04-26` through `2026-05-02`
  - `2026-04-19` through `2026-04-25`
- Oldest covered `mergedAt` extracted from existing reviewed tables: `2026-04-19T07:24:20Z` (`#12`).
- This non-overlapping review window: merged PRs targeting `main` from `2026-04-12` through `2026-04-18`.
- Current evidence checkout: `/Users/esoh/.codex/worktrees/81f2/vpk-rovo` at `0bd2248cb80dd312bc6ab54d27c0f35c9622cfe6` (`origin/main`).
- Query: `repo:eevennsoh/vpk-rovo is:pr is:merged base:main merged:2026-04-12..2026-04-18`.
- The query returned 11 merged PRs: `#1` through `#11`.

## Prior Report Extraction

All PR numbers already reviewed in explicit `Reviewed PRs` sections:

```text
#12-#78, #80-#128, #130-#139, #141-#153, #155-#164,
#166-#188, #190-#227, #229-#247, #249-#262, #264-#271,
#273-#283, #285-#327, #329-#419, #421-#526, #529-#708,
#710-#775, #777-#780, #782-#876, #878-#895, #897
```

All PR numbers already listed anywhere in the existing reports, including high-priority findings, skipped/fixed notes, and remediation references:

```text
#12-#128, #130-#227, #229-#876, #878-#986, #990, #994,
#996, #1000-#1001, #1005-#1008, #1019
```

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- PR `#1032` (`Gate previous-window test contracts`), merged at `2026-06-23T06:48:55Z`, shipped the focused test-gate remediation from the `2026-04-19..2026-04-25` report.
- Existing reports mark Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, Agent Card ticket-style extraction, Markdown trailing-newline source formatting, screen-assistant geometry CI gating, SVG Tracing parser CI gating, UserInvalidSync fallback behavior, Work Item vpk-html field parsing extraction, neural graph/root TWG installer test gating, ASCII control-model extraction, Awake city-persistence test gating, Liquid Glass utility test gating, website-preview visibility test gating, and vpk-build scaffold test gating as remediated or shipped.
- Existing reports already list `#12` and later. Those PRs were not reviewed again for this report.

## Method

- Queried GitHub for merged PRs targeting `main` with `merged:2026-04-12..2026-04-18`.
- Excluded every PR already listed in the existing report set; none of `#1..#11` were listed in prior reports.
- Split the review into read-only slices: `#1..#4`, `#5..#8`, and `#9..#11`, then reconciled the slice findings against current `origin/main`.
- Inspected current source, merged diff path ownership, current test coverage, and whether later reports or current source already fixed the issue.
- Ignored deleted `.rovodev` and legacy browser-mode surfaces, issues already fixed by later PRs, and broad decomposition opportunities where a smaller first batch was available.

## Executive Summary

This first window is the initial Hermes/wiki/browser/Clicky/Liquid Glass build-out. Much of the original surface has been renamed, migrated, or heavily evolved. Current `main` still has several valid cleanup opportunities, but only one combines a real correctness issue with a small, well-scoped remediation:

1. The backend supports generating wiki memory briefs/decks from the full filtered explorer view, but the current UI always falls back to a node selection and therefore cannot reach that mode.
2. The browser runtime default helper from the live-canary removal now returns a constant no-op result, leaving dead branches in startup code.
3. Several component-side Liquid Glass/header tests pass directly but are source-shape heavy or already partly covered by the previous window's utility gate.

The highest-value small remediation is the wiki memory artifact selection fix from `#4`.

## Highest Priority Findings

### 1. Full-view memory brief/deck generation is unreachable from the UI

- PR: `#4`
- Current evidence:
  - `backend/lib/wiki-memory-explorer.js` intentionally treats an empty `selectedNodeIds` array as "use all visible nodes" for derived briefs/decks.
  - `components/projects/control-plane/memories-surface.tsx` always derived `selectedNodeIds` from `selectedNode`, and `selectedNode` fell back to the first visible node.
  - The UI copy says the derived brief is generated from "the selected node or current filtered explorer view", but the "current filtered explorer view" path could not be sent.

Smallest remediation batch:

- Keep `selectedNodeId` as `null` when no explicit selection survives refresh.
- Extract a pure memory artifact selection helper that returns an empty `selectedNodeIds` array for the full filtered view and a one-item array only for an explicit selected node.
- Gate the helper contract in `pnpm run test:unit:js` without decomposing the full `memories-surface.tsx` owner.

### 2. Browser runtime defaulting path is now a no-op abstraction

- PR: `#8`
- Current evidence:
  - `backend/lib/browser-runtime-config.js` always returns `DEFAULT_BROWSER_MODE = "isolated"`.
  - `ensureBrowserRuntimeEnvDefaults()` always returns `changed: false`.
  - `backend/server.js` and `scripts/lib/rovo-runtime.js` still call the helper and branch on `changed`, even though that branch can never run.

Smallest follow-up batch:

- Delete the no-op defaulting function and collapse callers to the single runtime metadata constant.
- Preserve `DEFAULT_BROWSER_MODE` where browser runtime state still reports `isolated`.

### 3. Shared catalog sorting remains embedded in the client section

- PR: `#7`
- Current evidence:
  - `app/home-catalog-section.tsx` owns the last-updated/name comparator inline inside the client component.
  - Both Projects and Arts use the same section and therefore depend on identical ordering behavior.

Smallest follow-up batch:

- Extract a pure comparator helper for `last-updated` and `name` ordering.
- Cover valid dates, missing dates, invalid dates, and name fallback.

### 4. Clicky presentation is duplicated across Rovo and Studio

- PR: `#3`
- Current evidence:
  - Rovo and Studio Clicky presentational components are nearly identical.
  - Route-specific voice hooks differ, so the right boundary is presentation/state types only.

Smallest follow-up batch:

- Extract shared Clicky presentation components and shared point/state types.
- Leave route-specific voice behavior in place.

## Skipped Because Already Reviewed Or Fixed

- `#12` and later PRs are already listed in existing thermo reports and were not re-reviewed.
- `#1`: the large `.rovodev` skill/vendor surface from the first Hermes import is deleted or superseded by current `.rovo`, `.agents`, and vendored Hermes skill flows.
- `#2`: browser-workspace route ownership remains broad in `backend/server.js`, but current runtime-security and browser-workspace tests cover the critical behavior; this is not the smallest first-batch correctness fix.
- `#5`: live-canary binding was superseded by `#8`, which removed legacy canary browser mode.
- `#6` and `#10`: docs-only, and current `AGENTS.md` has later build/test guidance.
- `#7`: Liquid Glass utility coverage was partly gated by the `2026-04-19..2026-04-25` remediation; the remaining broad Liquid Glass tests are source-shape-heavy and not the first batch.
- `#9`: the custom arts empty-state route shape was superseded; current `HomeArtsSection` delegates through `HomeCatalogSection`.
- `#11`: `components/website/website-header.test.js` still passes directly, but its CategoryTabs half is source-regex-heavy; it is lower value than the full-view memory artifact correctness fix.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #1 | feat(hermes): multi-source skills hub, wiki tooling, and control plane | 2026-04-12T01:09:05Z | Reviewed, no still-valid first-batch finding |
| #2 | feat(rovo-app): add browser workspaces and wiki memories | 2026-04-13T06:36:00Z | Broad browser-workspace route ownership remains, not first-batch |
| #3 | feat: Clicky AI cursor companion with Claude vision | 2026-04-14T02:29:26Z | Finding: duplicated Clicky presentation across Rovo and Studio |
| #4 | feat: wiki memory management and explorer | 2026-04-14T17:48:50Z | Finding: full filtered memory brief/deck generation unreachable from UI |
| #5 | Fix live-canary browser preview binding | 2026-04-17T23:43:21Z | Skipped, superseded by #8 live-canary removal |
| #6 | Update AGENTS build and deploy workflow notes | 2026-04-18T00:55:17Z | Docs-only |
| #7 | Add Liquid Glass visual demo and arts catalog | 2026-04-18T16:51:56Z | Finding: catalog sort helper/test opportunity; Liquid Glass utility gate already partly remediated |
| #8 | [Automation] Daily bug scan: remove legacy canary browser mode | 2026-04-18T22:18:20Z | Finding: no-op browser runtime defaulting abstraction remains |
| #9 | [Automation] Performance audit: trim arts route client bundle | 2026-04-18T22:04:23Z | Skipped, current arts section delegates to shared catalog section |
| #10 | [Automation] Update AGENTS.md: document current test runners | 2026-04-18T22:18:23Z | Docs-only |
| #11 | Fix liquid glass header stacking | 2026-04-18T22:53:25Z | Finding: focused header/category tabs test outside JS unit gate, lower priority |

## Remediation Plan

Highest-value still-valid batch selected for implementation: restore full filtered-view wiki memory brief/deck generation from the control-plane UI.

Why this batch:

- It fixes a current user-facing correctness gap from the first wiki memory explorer window.
- The backend contract already exists; the UI was collapsing the boundary by treating fallback display state as explicit selection.
- The implementation is a small helper plus one call-site adjustment, with focused unit coverage.
- It avoids broad decomposition of `memories-surface.tsx`, duplicated Clicky presentation, or the 16k-line browser-workspace route owner in the same batch.
