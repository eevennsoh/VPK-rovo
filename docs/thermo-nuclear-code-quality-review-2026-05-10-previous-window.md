# Thermo-Nuclear Code Quality Review - 2026-05-10 Previous Window

## Scope

- Existing report files read first:
  - `docs/thermo-nuclear-code-quality-review-2026-06-21.md`
  - `docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-31-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-24-previous-window.md`
  - `docs/thermo-nuclear-code-quality-review-2026-05-17-previous-window.md`
- Prior covered windows:
  - `2026-06-14` through `2026-06-21`
  - `2026-06-07` through `2026-06-13`
  - `2026-05-31` through `2026-06-06`
  - `2026-05-24` through `2026-05-30`
  - `2026-05-17` through `2026-05-23`
- Oldest covered `mergedAt` extracted from the existing reports: `2026-05-17T01:15:57Z`.
- This non-overlapping review window: merged PRs targeting `main` from `2026-05-10` through `2026-05-16`.
- Baseline before this report's remediation edit: `/Users/esoh/Documents/Labs/vpk-rovo` at `ddcd973a84a7d0f205c2369ff8bc2c01dcb6d0a1` (`origin/main`).
- Requested standard: `thermo-nuclear-code-quality-review`, focused on structural simplification, file-size crossings, spaghetti growth, boundary leaks, duplicated contracts, and canonical ownership.

## Prior Report Extraction

All PR numbers already reviewed in explicit `Reviewed PRs` sections:

```text
#238-#247, #249-#262, #264-#271, #273-#283, #285-#327, #329-#419,
#421-#526, #529-#708, #710-#775, #777-#780, #782-#876, #878-#895, #897
```

All PR numbers already listed anywhere in the existing reports, including high-priority findings, skipped/fixed notes, and remediation references:

```text
#238-#876, #878-#986, #990, #994, #996, #1000-#1001, #1005-#1008, #1019
```

Findings already remediated or shipped:

- PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z`, shipped the remediation from the `2026-06-14..2026-06-21` report.
- Existing reports mark Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, Agent Card ticket-style extraction, Markdown trailing-newline source formatting, screen-assistant geometry CI gating, SVG Tracing parser CI gating, and UserInvalidSync fallback behavior as remediated or shipped.
- Existing reports also supersede older card-directory/AgentCard findings, Contacts route findings after route removal, and later PromptInput/floating composer findings.

## Method

- Queried GitHub for merged PRs targeting `main` with `merged:2026-05-10..2026-05-16`.
- Excluded PRs already listed in the existing report set; none of the 96 returned PRs were already listed.
- Split the window across read-only explorer agents and a parent audit pass:
  - `#137` through `#170`
  - `#171` through `#205`
  - `#206` through `#237`
- Inspected merged diffs, diff stats, current `main` state, and existing later-report coverage.
- Ignored issues already fixed by later PRs or already recorded in later reports.

## Executive Summary

This earlier window is the first week where the current chat/reporting and local skill surfaces started to harden. The still-valid issues cluster around owner boundaries and CI gates, not visual polish:

1. Work Item HTML report generation crossed multiple boundaries: `/agents` text context, global chat prompt mutation, central backend chat routing, vpk-html template filling, deterministic fallback field construction, and skill validation.
2. `RovoChatProvider` absorbed thread history, message editing, follow-up suggestions, deferred plan/question continuation, and stream/persistence behavior into one 3.6k-line provider.
3. Stable pure tests exist for Personal Graph summaries and repo-owned `vpk-html` scripts, but `pnpm run test:unit:js` does not run them.
4. Several scary-looking diffs from this period are no longer current problems: the `.claude/worktrees/rovo-button` snapshot from `#187` is gone, Contacts was removed by `#182`, and assistant-trace/PromptInput/Canvas issues are already captured in later reports.

## Highest Priority Findings

### 1. Work Item report generation crossed too many chat/reporting boundaries

- PRs: `#199`, `#201`, `#203`, `#204`
- Baseline evidence before remediation:
  - `components/projects/agents/data/rfp-work-items.ts:611` emitted `[Active Jira Work Item Context]` as a plain string protocol.
  - `app/contexts/context-rovo-chat.tsx:245` mutated normal send options when a prompt looked like a report request.
  - `lib/work-item-report-intent.js:19` owned broad regex intent detection and prompt-injected routing instructions.
  - `backend/server.js:6474` resolved that report request inside the main chat handler, then streamed the artifact route from the same flow at `backend/server.js:6525`.
  - `backend/lib/work-item-vpk-html-report-generator.js` was 1,119 lines and mixed active-context parsing, deterministic fallback report fields, DACI policy, template filling, AI distillation, skill harness calls, validation, and public generator exports.

The remaining broad issue is a text-protocol route boundary: model-facing context doubles as machine-readable Work Item metadata, and the central chat route owns artifact response behavior. The smallest implemented slice was the most isolated part of that problem: split deterministic field parsing/fallback ownership out of the generator so the generator becomes orchestration and template filling.

Smallest remaining remediation batch:

- Introduce a typed `WorkItemReportRequest` boundary for active work item metadata and requested report kind.
- Move backend chat artifact routing into a `work-item-report-chat-route` helper.
- Keep `contextDescription` as LLM context only; pass report intent and active Work Item data as structured request metadata.
- Leave `backend/server.js` as a delegator instead of the owner of missing-context response text, Hermes skill injection, artifact request construction, and response piping.

### 2. `RovoChatProvider` still owns unrelated runtime policies

- PRs: `#207`, `#212`, `#213`, `#221`, `#223`, `#225`
- Current size: `app/contexts/context-rovo-chat.tsx` is 3,648 lines.
- Current evidence:
  - `app/contexts/context-rovo-chat.tsx:797` through `:814` expose message editing and thread-history mutation methods on the same shared context contract.
  - `app/contexts/context-rovo-chat.tsx:2332` starts thread refresh logic inside the provider.
  - `app/contexts/context-rovo-chat.tsx:2765` starts message-edit resend orchestration inside the provider.
  - `app/contexts/context-rovo-chat.tsx:2974`, `:2997`, and `:3015` own select/delete/delete-all thread mutations inline.
  - `app/contexts/context-rovo-chat.tsx:3493` through `:3510` export all of those policies as one provider value.

`#207` unified chat history, then follow-up suggestions, message editing, compact message contracts, history UI state, and AI Gateway deferred tools layered more policy into the shared provider. This is not a narrow correctness bug, but it is still-valid structural debt: each chat feature has to reason about thread persistence, stream detachment, edit/resend state, plan/question continuation, and UI history in one owner.

Smallest remediation batch:

- Extract `useRovoThreadHistory` or a thread-controller module that owns `threads`, `activeThreadId`, refresh/open/select/delete/delete-all, compact message persistence, title generation, detach/cancel, and thread-list upserts.
- Keep the provider API stable initially by delegating to the hook.
- Add focused tests around create/persist/select/delete.
- After that lands, pull plan approval and edit-message resend into smaller command helpers.

### 3. Personal Graph summary tests are stable but outside the JS unit gate

- PRs: `#155`, `#167`
- Current evidence:
  - `package.json:12` defines `test:unit:js` as the PR unit gate.
  - `scripts/run-js-unit-tests.mjs:13` through `:17` include `app/`, `backend/`, `lib/`, `rovo/`, and `scripts/` by prefix.
  - `scripts/run-js-unit-tests.mjs:26` starts the explicit component-test allowlist.
  - `components/arts/personal-graph/personal-graph-summary-html.test.js` covers HTML escaping/link/context contracts.
  - `components/arts/personal-graph/personal-graph-summary-markdown.test.js` covers parser fallback behavior.

The tests are pure and direct, but they live under `components/arts/`, so the current JS-unit runner does not execute them unless they are explicitly allowlisted.

Smallest remediation batch:

- Add `components/arts/personal-graph/personal-graph-summary-html.test.js` and `components/arts/personal-graph/personal-graph-summary-markdown.test.js` to `INCLUDED_TEST_FILES`.
- Leave source-grep hook/panel tests out unless they are rewritten around stable helper contracts.

### 4. Repo-owned `vpk-html` script tests are stable but outside the JS unit gate

- PRs: `#156`, `#158`
- Current evidence:
  - `.agents/skills/vpk-html/scripts/build.test.js` covers landmark insertion/idempotence and color mapping.
  - `.agents/skills/vpk-html/scripts/landing-links.test.js` covers landing/demo validation.
  - `scripts/run-js-unit-tests.mjs:13` through `:17` exclude `.agents/` from prefix coverage.

The repo ships `vpk-html` as an owned skill, but its script tests are not part of the PR unit gate. This is a test-coverage gap rather than an implementation bug.

Smallest remediation batch:

- Add the two `vpk-html` test files to the explicit JS-unit allowlist, or add a narrow `.agents/skills/vpk-html/scripts/` included prefix if the intent is to gate that skill's script contracts as one unit.

## Skipped Because Already Reviewed Or Fixed

- `#140`, `#154`, and `#165` had no resolvable merged PRs in `eevennsoh/vpk-rovo`.
- `#189` was not a merged PR targeting `main` in this window.
- `#175` was superseded by `#182`, which removed the Contacts route.
- `#181` and `#185` overlap with later Rovo/Agents/RFP surfaces already covered in existing reports.
- `#187` added `.claude/worktrees/rovo-button/*` in its merge diff, but current `main` tracks zero files under `.claude/worktrees`; the real `rovo-button` project now lives under `components/projects/rovo-button`.
- `#210` and `#216` overlap with assistant-thinking/trace-state work already captured in later reports.
- `#214` Canvas readiness is already recorded in the `2026-05-17` report against `#240` / `#246`.
- `#219` and `#220` PromptInput/floating composer concerns are already covered by later reports.
- Generated media/cache removals, docs/rules/spec-only PRs, and removal-only PRs were reviewed but not repeated as findings.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #139 | [Automation] Deprecation audit: Personal Graph gateway summarizer | 2026-05-10T01:01:38Z | Removal, no finding |
| #141 | Tokenize liquid glass highlight timing | 2026-05-10T01:09:30Z | Reviewed, no high-conviction finding |
| #137 | [Automation] Update AGENTS.md: clarify dev startup | 2026-05-10T04:08:37Z | Docs-only, no finding |
| #138 | [Automation] Engineering improvement map: Personal Graph run safety | 2026-05-10T04:09:58Z | Reviewed, no high-conviction finding |
| #143 | [Automation] Deprecation audit: generated video cache | 2026-05-10T09:59:54Z | Removed generated cache, no finding |
| #142 | [Automation] Interface contract audit: Personal Graph TWG expand JSON | 2026-05-10T10:03:30Z | Reviewed, no high-conviction finding |
| #145 | [Automation] Code simplification: radial camera fit origin | 2026-05-10T10:18:20Z | Reviewed, no high-conviction finding |
| #144 | [Automation] Test coverage: proxy query forwarding | 2026-05-10T10:20:21Z | Reviewed, no high-conviction finding |
| #146 | [Automation] Bug scan: TWG hydration aborts | 2026-05-10T23:34:37Z | Reviewed, no high-conviction finding |
| #147 | [Automation] Performance audit: reuse settled focus layout | 2026-05-10T23:36:13Z | Reviewed, no high-conviction finding |
| #148 | [Automation] Interface contract audit: Personal Graph source JSON | 2026-05-10T23:37:52Z | Reviewed, no high-conviction finding |
| #149 | [Automation] Engineering improvement map: proxy contract coverage | 2026-05-10T23:40:39Z | Rules-only, no finding |
| #150 | [Automation] Update AGENTS.md: clarify API routes | 2026-05-10T23:43:32Z | Docs-only, no finding |
| #151 | docs(personal-graph): add editorial node summary spec | 2026-05-10T23:45:15Z | Spec-only, no finding |
| #152 | [Automation] UI design quality audit: inert closed flyout actions | 2026-05-10T23:47:05Z | Reviewed, no high-conviction finding |
| #156 | feat(vpk-html): add offline HTML artifact skill | 2026-05-11T07:12:33Z | Finding: vpk-html skill tests outside CI gate |
| #157 | Fix Personal Graph flyout Button expanded state | 2026-05-11T08:05:10Z | Reviewed, no high-conviction finding |
| #153 | [Automation] Engineering improvement map: hidden UI focus rule | 2026-05-11T08:36:32Z | Rule-only, no finding |
| #155 | Add Personal Graph editorial summaries | 2026-05-11T09:07:51Z | Finding: Personal Graph summary tests outside CI gate |
| #158 | [Automation] Test coverage: vpk-html output paths | 2026-05-11T10:43:32Z | Covered by vpk-html gate finding |
| #159 | [Automation] Code simplification: summary HTML parse reuse | 2026-05-11T10:44:03Z | Reviewed, no separate finding |
| #161 | [Automation] Deprecation audit: unused grid visual demo | 2026-05-11T20:05:31Z | Removal, no finding |
| #162 | [Automation] Performance audit: cache display date formatters | 2026-05-11T20:05:57Z | Reviewed, no high-conviction finding |
| #160 | [Automation] Interface contract audit: vpk-html production commands | 2026-05-11T20:08:07Z | Docs/config, no separate finding |
| #163 | [Automation] Update AGENTS.md: index vpk-html artifacts | 2026-05-12T01:04:58Z | Docs-only, no finding |
| #164 | [Automation] Engineering improvement map: sync vpk-html llms metadata | 2026-05-12T01:05:31Z | Metadata-only, no finding |
| #166 | Reimplement Symphony around the upstream Elixir runtime | 2026-05-12T11:07:54Z | Superseded by current vpk-symphony skill |
| #167 | [Automation] Test coverage: Personal Graph summary HTML | 2026-05-12T11:51:08Z | Finding: Personal Graph summary tests outside CI gate |
| #168 | [Automation] Code simplification: date invalid fallback | 2026-05-12T11:51:49Z | Reviewed, no high-conviction finding |
| #169 | [Automation] Interface contract audit: Symphony logs root | 2026-05-12T21:32:13Z | Reviewed, current test is gated via scripts/ |
| #172 | Fix design heuristic lint blocker | 2026-05-12T22:59:44Z | Reviewed, no high-conviction finding |
| #171 | [Automation] Bug scan: restore weather redirect | 2026-05-12T23:06:31Z | Reviewed, no high-conviction finding |
| #170 | [Automation] Performance audit: avoid waveform signal clones | 2026-05-12T23:07:28Z | Reviewed, current test is explicitly gated |
| #173 | Rebrand vpk-html to the Atlassian deck identity | 2026-05-13T00:01:26Z | Reviewed, no new current finding |
| #176 | [Automation] Code simplification: waveform sampler denominator | 2026-05-13T11:19:37Z | Reviewed, no high-conviction finding |
| #175 | [Automation] UI design quality audit: keyboard contacts rows | 2026-05-13T11:22:49Z | Superseded by #182 contacts removal |
| #177 | [Automation] Test coverage: Symphony upstream dir guard | 2026-05-13T11:23:14Z | Reviewed, no high-conviction finding |
| #178 | [Automation] Interface contract audit: design-md lint path | 2026-05-13T20:03:36Z | Reviewed, no high-conviction finding |
| #179 | [Automation] Frontend runtime audit: dev route discovery | 2026-05-13T20:03:57Z | Reviewed, no high-conviction finding |
| #180 | [Automation] Performance audit: cache response gradient samples | 2026-05-13T20:04:15Z | Reviewed, no high-conviction finding |
| #183 | [Automation] Update AGENTS.md: align rule guidance | 2026-05-14T00:31:44Z | Docs/rules only |
| #182 | Remove the generated /contacts route | 2026-05-14T00:32:12Z | Removal PR, no finding |
| #174 | [Automation] Engineering improvement map: land review freshness | 2026-05-14T00:34:56Z | Reviewed, no high-conviction finding |
| #184 | Port Admin into Projects and add direct /admin routing | 2026-05-14T00:35:39Z | Reviewed, no high-conviction finding |
| #181 | Rename the Rovo App project surface to Rovo | 2026-05-14T01:05:04Z | Later Rovo-surface debt already covered in existing reports |
| #185 | Add Agents project placeholder and navigation entry | 2026-05-14T03:20:32Z | Later Agents/RFP issues already covered |
| #186 | chore: pin pnpm@11.1.1 and migrate build-script policy | 2026-05-14T04:04:52Z | Dependency/config only |
| #187 | feat(projects): add rovo-button project | 2026-05-14T05:57:36Z | Superseded; tracked worktree snapshot no longer exists |
| #188 | [Automation] UI design quality audit: disclosure expanded state | 2026-05-14T07:19:45Z | Reviewed, no high-conviction finding |
| #190 | feat(top-nav): show Ask Rovo button as selected when sidebar chat is open | 2026-05-14T08:14:35Z | Reviewed, no high-conviction finding |
| #191 | fix(chat): remove L/R padding from ChatPanel ConversationContent | 2026-05-14T08:15:34Z | Reviewed, no high-conviction finding |
| #192 | feat(projects): flush sidebar chat in /agents and /jira | 2026-05-14T08:15:44Z | Reviewed, no high-conviction finding |
| #193 | [Automation] Test coverage: top nav Rovo pressed state | 2026-05-14T11:24:09Z | Coverage only |
| #194 | [Automation] Code simplification: prompt option merge helper | 2026-05-14T11:24:48Z | Reviewed, no high-conviction finding |
| #195 | Switch Jira work items from modal to inline side panel | 2026-05-14T11:47:16Z | Reviewed, no high-conviction finding |
| #197 | Fix Personal Graph button expanded state | 2026-05-14T12:02:00Z | Reviewed, no high-conviction finding |
| #196 | Keep floating Rovo chat in its own surface | 2026-05-14T12:19:38Z | Reviewed, no high-conviction finding |
| #198 | [Automation] Interface contract audit: wiki capture browser workspace route | 2026-05-14T13:37:12Z | Reviewed, no high-conviction finding |
| #199 | Inject active Jira RFP context into Rovo on /agents | 2026-05-14T14:06:12Z | Finding: Work Item report route boundary |
| #200 | [Automation] Deprecation audit: retired wiki control surface | 2026-05-14T14:30:16Z | Removal PR, no finding |
| #201 | Add chat-driven HTML reports for Jira work items | 2026-05-14T17:02:05Z | Finding/remediated: Work Item report generator ownership; route boundary remains |
| #202 | [Automation] Performance audit: reuse Hermes ranking | 2026-05-14T20:02:09Z | Reviewed, no high-conviction finding |
| #203 | Execute vpk-html skill bundle for Work Item report generation | 2026-05-14T20:25:28Z | Finding/remediated: Work Item report generator ownership; route boundary remains |
| #204 | Broaden vpk-html artifact intent detection | 2026-05-14T20:51:47Z | Finding: Work Item report route boundary |
| #205 | [Automation] Update AGENTS.md: align Rovo route guidance | 2026-05-15T03:22:19Z | Docs only |
| #206 | [Automation] Engineering improvement map: additive chat context | 2026-05-15T03:22:30Z | Reviewed, no high-conviction finding |
| #208 | Add repo-local agent-creator skill and validator | 2026-05-15T03:22:41Z | Reviewed, no high-conviction finding |
| #209 | Add local column agent assignment dropdown to /agents | 2026-05-15T03:22:55Z | Reviewed, no high-conviction finding |
| #207 | Unify chat history logic | 2026-05-15T03:23:37Z | Finding: shared chat provider monolith |
| #210 | Unify Rovo thinking traces across /rovo and chat surfaces | 2026-05-15T06:01:44Z | Skipped, assistant trace/thinking already covered later |
| #212 | Add follow-up suggestions to compact Rovo chat | 2026-05-15T08:17:12Z | Finding: shared chat provider monolith |
| #214 | Add reusable Rovo Canvas block to the component catalog | 2026-05-15T09:18:42Z | Skipped, Canvas readiness already recorded later |
| #215 | Make question card responsive on smaller viewports | 2026-05-15T09:18:59Z | Reviewed, no high-conviction finding |
| #213 | Implement message editing functionality in Rovo chat | 2026-05-15T09:27:13Z | Finding: shared chat provider monolith |
| #211 | [Automation] UI design quality audit: menu select handlers | 2026-05-15T09:27:21Z | Reviewed, no high-conviction finding |
| #216 | Refactor chat components and enhance thinking status logic | 2026-05-15T09:51:36Z | Skipped, assistant trace/thinking overlap |
| #217 | [Automation] Code simplification: conversation follow target | 2026-05-15T10:16:24Z | Reviewed, no high-conviction finding |
| #218 | [Automation] Test coverage: question-card option labels | 2026-05-15T10:16:44Z | Reviewed, no high-conviction finding |
| #219 | Update Customize button and label popover content | 2026-05-15T16:31:22Z | Skipped, PromptInput/floating composer covered later |
| #221 | [Automation] Interface contract audit: compact message parts | 2026-05-15T16:34:17Z | Finding: shared chat provider monolith |
| #222 | [Automation] Deprecation audit: hidden lozenge bold demo | 2026-05-15T16:35:01Z | Reviewed, no high-conviction finding |
| #223 | Align chat history drawer with Figma and contain it inside floating chat | 2026-05-15T16:35:36Z | Finding: shared chat provider monolith |
| #220 | Match sidebar chat send controls to Voice Vision Figma | 2026-05-15T16:36:41Z | Skipped, PromptInput/floating composer covered later |
| #224 | [Automation] Performance audit: stop fallback payload scans | 2026-05-15T19:51:46Z | Reviewed, no high-conviction finding |
| #225 | Implement AI Gateway deferred tools across all chat surfaces | 2026-05-15T22:01:18Z | Finding: shared chat provider monolith |
| #226 | [Automation] Update AGENTS.md: Align chat runtime guidance | 2026-05-16T01:14:46Z | Reviewed, docs-only |
| #227 | [Automation] Engineering improvement map: plan status marker | 2026-05-16T01:17:13Z | Reviewed, docs-only |
| #229 | [Automation] Test coverage: pending plan approval | 2026-05-16T15:40:57Z | Reviewed, no high-conviction finding |
| #230 | [Automation] Code simplification: RFP person labels | 2026-05-16T15:41:17Z | Reviewed, no high-conviction finding |
| #231 | [Automation] Interface contract audit: embedded project previews | 2026-05-16T15:41:34Z | Reviewed, no high-conviction finding |
| #232 | [Automation] Dependency sweep: Next.js security patch | 2026-05-16T15:42:15Z | Reviewed, dependency-only |
| #233 | [Automation] Deprecation audit: Liquid Glass blur filter id | 2026-05-16T15:42:32Z | Reviewed, no high-conviction finding |
| #234 | fix(agents): use motion duration token in agent panel | 2026-05-16T15:52:18Z | Reviewed, no high-conviction finding |
| #235 | Update VPK skill docs for compatibility and workflow clarity | 2026-05-16T20:05:01Z | Reviewed, no high-conviction finding |
| #236 | [Automation] Performance audit: hoist context number formatters | 2026-05-16T20:06:23Z | Reviewed, no high-conviction finding |
| #237 | [Automation] Bug scan: agent panel motion guard | 2026-05-16T20:06:58Z | Reviewed, no high-conviction finding |

## Remediation Plan

Highest-value small batch selected for implementation: split deterministic Work Item vpk-html field parsing and fallback field construction out of `backend/lib/work-item-vpk-html-report-generator.js`.

Why this batch:

- It is inside the Work Item boundary finding from `#201` / `#203`, but avoids a broad chat-provider or route-protocol rewrite.
- It has focused existing tests.
- It reduces one 1k+ mixed-owner file into two narrower owners while preserving public exports and backend call sites.

## Remediation Applied

Implemented after the report review pass:

- Added `backend/lib/work-item-vpk-html-report-fields.js` to own:
  - active Work Item context field/section parsing
  - deterministic status-report fallback fields
  - deterministic RFP qualification DACI fallback fields
  - report-kind resolution
  - shared field formatting helpers
- Trimmed `backend/lib/work-item-vpk-html-report-generator.js` from 1,119 lines to 597 lines.
- Kept compatibility exports from `work-item-vpk-html-report-generator.js` for existing tests/call sites:
  - `buildFallbackDaciReportFields`
  - `buildFallbackReportFields`
  - `parseContextFieldSections`
- Left the larger typed `WorkItemReportRequest` / backend route-boundary extraction as the next remediation batch.

Focused validation run:

```text
pnpm exec node --test backend/lib/work-item-vpk-html-report-generator.test.js backend/lib/work-item-report-route-integration.test.js
```

Result: 13 tests passed.

Additional static validation:

```text
pnpm run lint
pnpm run typecheck
```

Result: both passed.
