# Thermo-Nuclear Code Quality Review - 2026-04-19 Previous Window

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
- Prior covered windows:
  - `2026-06-14` through `2026-06-21`
  - `2026-06-07` through `2026-06-13`
  - `2026-05-31` through `2026-06-06`
  - `2026-05-24` through `2026-05-30`
  - `2026-05-17` through `2026-05-23`
  - `2026-05-10` through `2026-05-16`
  - `2026-05-03` through `2026-05-09`
  - `2026-04-26` through `2026-05-02`
- Oldest covered `mergedAt` extracted from existing reviewed tables: `2026-04-26T21:37:55Z` (`#42`).
- This non-overlapping review window: merged PRs targeting `main` from `2026-04-19` through `2026-04-25`.
- Current evidence checkout: `/Users/esoh/.codex/worktrees/81f2/vpk-rovo` at `2e937113e3bb8596f588e313ac5bf8231d8eb31b` (`origin/main`).
- Query: `repo:eevennsoh/vpk-rovo is:pr is:merged base:main merged:2026-04-19..2026-04-25`.
- The query returned 30 merged PRs: `#12` through `#41`.

## Prior Report Extraction

All PR numbers already reviewed in explicit `Reviewed PRs` sections:

```text
#42-#128, #130-#139, #141-#153, #155-#164, #166-#188,
#190-#227, #229-#247, #249-#262, #264-#271, #273-#283,
#285-#327, #329-#419, #421-#526, #529-#708, #710-#775,
#777-#780, #782-#876, #878-#895, #897
```

All PR numbers already listed anywhere in the existing reports, including high-priority findings, skipped/fixed notes, and remediation references:

```text
#42-#128, #130-#227, #229-#876, #878-#986, #990, #994,
#996, #1000-#1001, #1005-#1008, #1019
```

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- Existing reports mark Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, Agent Card ticket-style extraction, Markdown trailing-newline source formatting, screen-assistant geometry CI gating, SVG Tracing parser CI gating, UserInvalidSync fallback behavior, Work Item vpk-html field parsing extraction, neural graph/root TWG installer test gating, and ASCII control-model extraction as remediated or shipped.
- Existing reports already list `#42` and later. Those PRs were not reviewed again for this report.

## Method

- Queried GitHub for merged PRs targeting `main` with `merged:2026-04-19..2026-04-25`.
- Excluded every PR already listed in the existing report set; none of `#12..#41` were listed in prior reports.
- Split the review into read-only slices: `#12..#21`, `#22..#31`, and `#32..#41`, then reconciled the slice findings against current `origin/main`.
- Inspected current source, merged diff path ownership, direct test stability, and `scripts/run-js-unit-tests.mjs` inclusion behavior.
- Ignored issues already fixed by later PRs, deleted current surfaces, and source-grep-heavy tests that are not good first-batch CI candidates.

## Executive Summary

This earlier window is the original arts/weather build-out week. Current `main` has already renamed and heavily evolved the route into Awake, but two still-valid themes remain:

1. Several focused tests from this window are live and pass directly, but are excluded from `pnpm run test:unit:js` because they live under `components/` or `.agents/`.
2. The Awake route still has a serious ownership problem: `components/arts/awake/index.tsx` is above 2k lines, and `city-popover.tsx` is near 1k lines.

The highest-value small remediation batch is to graduate the focused, stable contracts into the JS unit gate. The broader Awake decomposition is valid but should be a separate structural refactor.

## Highest Priority Findings

### 1. Focused tests from the window are outside the JS unit gate

- PRs: `#18`, `#23`, `#25`, `#26`, `#32`, `#34`, `#36`, `#39`
- Current evidence:
  - `scripts/run-js-unit-tests.mjs` includes broad prefixes for `app/`, `backend/`, `lib/`, `rovo/`, and `scripts/`, then relies on `INCLUDED_TEST_FILES` for focused tests outside those prefixes.
  - `components/arts/awake/city-storage.test.js` covers localStorage migration, invalid payload filtering, and legacy fallback behavior from the saved-weather-cities work.
  - `components/arts/awake/use-cities.test.js` covers stored-state fallback, current-vs-legacy precedence, removal selection, and debounced city-selection persistence.
  - `components/website/website-preview-visibility.test.js` covers deferred offscreen catalog previews.
  - `components/website/demos/visual/shaders/liquid-glass-utils.test.js` covers Liquid Glass displacement, dispersion, channel offset, and embedded SVG blur utility behavior.
  - `.agents/skills/vpk-build/scripts/scaffold-target.test.js` covers repo-owned extraction scaffold output, including the layout, feature-flag shim, config, fonts, copied assets, and route promotion.
  - Direct validation passed before remediation: `pnpm exec node --test components/arts/awake/city-storage.test.js components/arts/awake/use-cities.test.js components/website/website-preview-visibility.test.js components/website/demos/visual/shaders/liquid-glass-utils.test.js .agents/skills/vpk-build/scripts/scaffold-target.test.js` ran 15 passing tests.

Smallest remediation batch:

- Add those five focused tests to `INCLUDED_TEST_FILES`.
- Do not gate `components/arts/awake/index.test.js`, `components/arts/awake/selected-weather-clock.test.js`, or `components/visual/glass-tabs.test.js` in this batch; they include broad source-shape assertions better handled by later extraction or targeted split.

### 2. Awake route ownership is still too concentrated

- PRs: `#13`, `#18`, `#22`, `#27`, `#28`, `#30`, `#41`
- Current files:
  - `components/arts/awake/index.tsx`: 2,066 lines.
  - `components/arts/awake/city-popover.tsx`: 950 lines.
- Current evidence:
  - `components/arts/awake/index.tsx` keeps file-wide complexity suppressions, route-level theme control, GlassTabs wake-lock coupling, fluid layout measurement, selected weather clock rendering, shader config, current-weather fetching, global keyboard shortcuts, and awake-session timers in one owner.
  - `components/arts/awake/city-popover.tsx` mixes audio unlocking, popover state, search, keyboard handling, slider rendering, glass styling, and floating controls.

Smallest follow-up batch:

- Extract an Awake city-persistence controller or hook facade first, because `city-storage.test.js` and `use-cities.test.js` already provide behavioral guardrails.
- Then extract wake-lock elapsed/session timing out of `index.tsx`.
- Leave visual layout and shader choreography for a later pass once the state contracts are smaller.

## Skipped Because Already Reviewed Or Fixed

- `#42` and later PRs are already listed in existing thermo reports and were not re-reviewed.
- `#13`: tracked `--output`, `.codex/environments/environment-3.toml`, `.tmp-agent-browser-home`, and the old `components/arts/sydney-lockscreen/*` path are gone from current `main`; only the broader evolved Awake ownership issue remains.
- `#14`, `#16`, `#19`, and `#21`: current tests live under `lib/`, `app/`, or `scripts/`, so they are already included by broad JS-unit prefixes.
- `#15`: `components/website/component-doc/components/demo-preview-shell.test.js` is already explicitly allowlisted.
- `#17`, `#24`, and `#40`: docs-only.
- `#20`: no current changed-file finding.
- `#29`: duplicate/superseded by the `#28` wake-lock/GlassTabs path.
- `#33`: `/weather` compatibility redirect lives under `app/`, so its test is already covered by the `app/` prefix.
- `#35`: current nav helper state has no high-conviction finding beyond the vpk-build scaffold test from `#36`.
- `#37`: current standalone glass demos wrap with theme context.
- `#38`: dependency/lockfile-only.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #12 | [Automation] Code simplification: simplify demo registry loader caching | 2026-04-19T07:24:20Z | Reviewed, no high-conviction current finding |
| #13 | Add arts catalog and simplify demo loading | 2026-04-19T07:24:26Z | Finding: evolved Awake ownership still concentrated |
| #14 | [Automation] Test coverage: cover component timestamp paths | 2026-04-19T22:38:02Z | Current `lib/` test included by prefix |
| #15 | [Automation] Bug scan: restore demo preview shell surface | 2026-04-19T22:38:14Z | Current component test explicitly allowlisted |
| #16 | [Automation] Performance audit: restore arts route split | 2026-04-19T22:38:35Z | Current `app/` test included by prefix |
| #17 | [Automation] Update AGENTS.md: fix quick start command | 2026-04-19T22:38:45Z | Docs-only |
| #18 | [codex] refresh weather art and visual demos | 2026-04-20T06:29:56Z | Findings: Liquid Glass utility gate, Awake ownership |
| #19 | [Automation] Code simplification: simplify worktree port helpers | 2026-04-20T09:39:08Z | Current `scripts/` test included by prefix |
| #20 | [Automation] Code simplification: simplify city rail slider props | 2026-04-20T14:22:10Z | Reviewed, no high-conviction current finding |
| #21 | [Automation] Test coverage: harden worktree port helper coverage | 2026-04-20T14:22:24Z | Current `scripts/` test included by prefix |
| #22 | [Automation] Performance audit: isolate weather clock rerenders | 2026-04-20T21:37:08Z | Finding: Awake owner file still concentrated |
| #23 | [Automation] Bug scan: preserve saved weather cities | 2026-04-20T21:37:17Z | Finding: focused city persistence tests outside JS unit gate |
| #24 | [Automation] Update AGENTS.md: include backend/lib API surface | 2026-04-21T06:53:52Z | Docs-only |
| #25 | [Automation] Test coverage: harden weather city storage parsing | 2026-04-21T10:50:10Z | Finding: focused storage parser test outside JS unit gate |
| #26 | [Automation] Code simplification: simplify weather city hook initialization | 2026-04-21T10:53:52Z | Finding: focused hook behavior test outside JS unit gate |
| #27 | [Automation] Performance audit: share selected weather clock | 2026-04-22T00:58:48Z | Finding: Awake owner file still concentrated |
| #28 | Attach and restyle wake-lock control to GlassTabs shell motion | 2026-04-22T03:58:26Z | Contributes to current Awake/GlassTabs owner coupling |
| #29 | Attach and restyle wake-lock control to GlassTabs shell motion | 2026-04-22T03:58:33Z | Skipped, duplicate/superseded by #28 path |
| #30 | Fix weather slider layering without breaking liquid-glass refraction | 2026-04-22T03:58:39Z | Reviewed, no separate finding beyond Awake ownership |
| #31 | [Automation] Code simplification: simplify glass tabs edge follower helpers | 2026-04-22T13:38:33Z | Mixed GlassTabs test left out of first remediation batch |
| #32 | [Automation] Test coverage: weather city removal selection | 2026-04-22T13:40:35Z | Finding: focused `use-cities` test outside JS unit gate |
| #33 | [Automation] Bug scan: restore /weather route compatibility | 2026-04-23T04:03:52Z | Current `app/` test included by prefix |
| #34 | [Automation] Performance audit: defer offscreen catalog previews | 2026-04-23T04:04:23Z | Finding: focused website preview visibility test outside JS unit gate |
| #35 | [Automation] Code simplification: simplify nav item helpers | 2026-04-23T13:11:41Z | Reviewed, no high-conviction current finding |
| #36 | [Automation] Test coverage: harden vpk-build scaffold generation | 2026-04-23T13:12:00Z | Finding: focused vpk-build scaffold test outside JS unit gate |
| #37 | [Automation] Bug scan: restore standalone glass demo theme context | 2026-04-24T02:28:34Z | Fixed/current behavior present |
| #38 | [Automation] Dependency sweep: dotenv | 2026-04-24T02:29:04Z | Dependency-only |
| #39 | [Automation] Performance audit: debounce weather city persistence | 2026-04-24T02:29:09Z | Finding: focused `use-cities` test outside JS unit gate |
| #40 | [Automation] Update AGENTS.md: refresh first-run setup | 2026-04-24T02:29:15Z | Docs-only |
| #41 | [Automation] Performance audit: share selected weather clock | 2026-04-25T23:07:57Z | Source-grep test left out of first remediation batch |

## Remediation Plan

Highest-value still-valid batch selected for implementation: graduate focused tests from this window into the JS unit gate.

Why this batch:

- It directly addresses still-valid CI coverage gaps from the reviewed window.
- The selected tests pass directly and cover stable helper/runtime contracts.
- It avoids broad Awake decomposition and avoids source-grep-heavy UI suites that are more likely to drift.
- The code change is one explicit allowlist edit in the repo-owned JS unit runner.
