# Thermo-Nuclear Code Quality Review - 2026-06-22 Previous Window

## Scope

- Previous report reviewed merged PRs targeting `main` from `2026-06-14` through `2026-06-21`.
- Previous report file read first: `docs/thermo-nuclear-code-quality-review-2026-06-21.md`.
- Oldest covered date extracted from that report: `2026-06-14`.
- This non-overlapping review window: merged PRs targeting `main` from `2026-06-07` through `2026-06-13`.
- Current evidence checkout: `/Users/esoh/Documents/Labs/vpk-rovo` on clean `main` at `544261acb56d4689796488178d3c33c7a3f082a1` (`origin/main`, merge commit for PR `#1019`).
- Report artifact location: `/Users/esoh/.codex/worktrees/90ba/vpk-rovo/docs/thermo-nuclear-code-quality-review-2026-06-22-previous-window.md`.
- Requested standard: `thermo-nuclear-code-quality-review`, focused on structural simplification, file-size crossings, spaghetti growth, boundary leaks, duplicated contracts, and canonical ownership.

## Prior Report Extraction

The prior report explicitly covered the `#896` through `#1008` range, with `#1007` verified against final persistent `main`. It listed high-priority findings tied to:

```text
#900, #907, #911, #915, #934, #935, #936, #944, #952, #956,
#959, #965, #966, #970, #977, #981, #982, #983, #1000, #1001,
#1006
```

It also listed these PRs as reviewed with no high-conviction structural finding:

```text
#896, #898, #899, #901, #902, #903, #904, #905, #906, #908,
#909, #910, #912, #913, #914, #916, #917, #918, #919, #920,
#921, #922, #923, #924, #925, #926, #927, #928, #929, #930,
#931, #932, #933, #937, #938, #939, #940, #941, #942, #943,
#945, #946, #947, #948, #949, #950, #951, #953, #954, #955,
#957, #958, #960, #961, #962, #963, #964, #967, #968, #969,
#971, #972, #973, #974, #975, #976, #978, #979, #980, #984,
#985, #986, #990, #994, #996, #1005, #1007
```

Findings from that report were remediated and shipped in PR `#1019` (`Fix thermo review findings`), merged at `2026-06-22T08:49:26Z` with merge commit `544261acb56d4689796488178d3c33c7a3f082a1`.

## Method

- Queried GitHub for merged PRs targeting `main` with `merged:2026-06-07..2026-06-13`.
- Split the window across read-only explorer agents and a parent audit pass:
  - `#783`, `#797` through `#824`
  - `#825` through `#848`
  - `#849` through `#873`
  - `#874` through `#897`
- Inspected merged diffs and current `main` state.
- Ignored issues already fixed by later PRs, especially PR `#1019`.
- Kept findings only when the current code still shows a maintainability, simplification, correctness, test-coverage, or ownership problem.

## Executive Summary

The earlier window shows the same pattern that the later report found, but in older owners:

1. The agent and Studio config surfaces repeatedly absorbed new behavior instead of extracting field-policy or workflow owners.
2. Several PRs pushed files past the 1k-line threshold and later cleanup did not fully pull those responsibilities back out.
3. Multiple shared/editor components still carry route-specific policy: prompt autocomplete, rich-text suggestion positioning, Ask Rovo slash-menu behavior, and Studio template setup metadata.
4. Demo and fallback code became semi-canonical: deterministic Studio agent-building and backend fallback extraction now hold domain logic used outside their demo/fallback origin.
5. Some visually rich components were split well enough to keep, but Ink Wash still shipped as a single first-party WebGL engine file with shaders, GL resources, pointer physics, script playback, and render orchestration together.

## Highest Priority Findings

### 1. Skill Config is still a 4.5k-line owner, with dead-general row policy after `#890`

- PRs: `#882`, `#890`
- Current size: `components/blocks/skill-config/components/skill-config.tsx` is 4,554 lines.
- Evidence:
  - `components/blocks/skill-config/components/skill-config.tsx:1939` defines empty-config nav items for the whole agent config surface.
  - `components/blocks/skill-config/components/skill-config.tsx:1986` filters that general model down to `item.agentFieldName === "apps"`.
  - `components/blocks/skill-config/components/skill-config.tsx:2920` builds filled rows for triggers, apps, skills, subagents, starters, memory, and reasoning.
  - `components/blocks/skill-config/components/skill-config.tsx:3104` filters those rows down to `row.key === "apps"`.
  - `components/blocks/skill-config/components/skill-config.tsx:3584` starts `AgentInstructionsComposer`, which owns rich-text mention sources, directory insertion, frontmatter mode, and reference removal.
  - `components/blocks/skill-config/components/skill-config.tsx:4230` starts `AgentConfigFields`, which still owns text/list updates, mention removal requests, trigger editor state, manage-trigger modal state, automation reorder/toggle/delete, profile composition, compact toolbar, and editor wiring.

This is the strongest current-window structural smell. `#882` introduced the block as a 4k+ line component. `#890` reduced some visible baseline/demo surface, but current `main` still carries a general config implementation whose comments describe a broad field model while the implementation hard-codes an apps-only view. That is worse than just a big file: it means readers must understand the generic model and the special-case filter.

Smallest remediation batch:

- Extract a pure row/nav model helper for config fields.
- Decide whether Skill Config is intentionally apps-only.
- If apps-only is intentional, delete the dead generic row builders and keep a focused Apps config component.
- If it should remain general, restore the generic hidden-field filter instead of hard-coding apps.
- Add one source-contract test for row visibility/order so this does not regress silently.

### 2. Studio config panel still owns publish workflow and app-facet reconciliation

- PRs: `#831`, `#832`, `#855`
- Current size: `components/projects/studio/components/rovo-app-agent-config-panel.tsx` is 1,823 lines.
- Evidence:
  - `components/projects/studio/components/rovo-app-agent-config-panel.tsx:388` starts the publish dropdown/change-list surface introduced by versioning work.
  - `components/projects/studio/components/rovo-app-agent-config-panel.tsx:1030` starts `handleDirectoryAppIdsChange`.
  - `components/projects/studio/components/rovo-app-agent-config-panel.tsx:1080` adds canonical app, tool, and knowledge facets through sequential `appendListValues` calls.
  - `components/projects/studio/components/rovo-app-agent-config-panel.tsx:1094` starts `handleAddApp`, which repeats the same facet fan-out for the dialog payload.
  - `components/projects/studio/lib/studio-agent-versioning.ts:125` already exports comparison logic, but the panel still keeps local publish comparison glue.

The Studio panel now owns config editing, app membership repair, per-app knowledge mode, publish dropdown view state, change-list rendering, toast orchestration, and header actions. The app selection issue is particularly brittle because one logical app add is spread across `apps`, `tools`, and `knowledge` updates instead of one atomic facet reconciliation operation.

Smallest remediation batch:

- Extract `applyAppFacetSelection(config, change)` near the directory/app model and use it from Studio add/remove flows and repair/generation paths.
- Extract `AgentPublishDropdown` plus change-list rendering into a Studio publish component.
- Move publish/restore/preview action glue into a small `useStudioAgentPublishActions` hook.
- Replace local JSON comparison with `areStudioAgentResultsEqual`.
- Add focused tests for add/remove, all/custom/none knowledge modes, no duplicate facet chips, and draft/published equality.

### 3. Deterministic Studio agent builder became a mixed domain owner

- PRs: `#872`, `#887`
- Current size: `components/projects/studio/lib/demo-agent-builder.ts` is 1,480 lines.
- Evidence:
  - `components/projects/studio/lib/demo-agent-builder.ts:93` starts prompt-classification regex policy.
  - `components/projects/studio/lib/demo-agent-builder.ts:302` embeds the curated RFP summary trigger spec.
  - `components/projects/studio/lib/demo-agent-builder.ts:577` classifies build intent.
  - `components/projects/studio/lib/demo-agent-builder.ts:717` builds live agent update patches.
  - `components/projects/studio/lib/demo-agent-builder.ts:822` merges generic trigger phrases into drafts.
  - `components/projects/studio/lib/demo-agent-builder.ts:1062` starts scripted thinking-trace event construction.
  - `components/projects/studio/lib/studio-agent-draft-patch.ts:14` imports trigger merging back out of this demo module.

The file started as a deterministic demo responder, but it now owns classifier lexicons, app/skill/subagent extraction, trigger id generation, draft patching, curated RFP script data, assistant reply text, and staged thinking events. The fact that non-demo draft-patch code imports from it is the clearest sign that the boundary is inverted.

Smallest remediation batch:

- Split `demo-agent-build-intent.ts`, `studio-agent-trigger-merge.ts`, `agent-patch-builder.ts`, `rfp-demo-spec.ts`, and `demo-agent-trace-parts.ts`.
- Move generic trigger merging either into `studio-agent-draft-patch.ts` or a Studio domain helper, not the demo module.
- Keep one `buildDeterministicAgentEditResponse` adapter so shell call sites consume a staged response plan instead of recreating stage arrays.
- Preserve the current exported planner API during the split.

### 4. Rich-text suggestion menu owns composer-specific positioning and Ask Rovo policy

- PRs: `#892`, `#897`
- Current size: `components/ui-custom/rich-text-editor/suggestion-menu.tsx` is 2,173 lines.
- Evidence:
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:984` hard-codes chat-composer positioning.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1019` climbs rounded composer ancestors.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1070` attaches resize/scroll observers inside the generic rich-text menu module.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1333` threads Ask Rovo state into the slash renderer.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1358` and `:1945` duplicate flat-surface decision logic for slash and mention modes.
  - `components/ui-custom/rich-text-editor/suggestion-menu.tsx:1432` suppresses rows based on Ask Rovo policy.

The generic rich-text menu now contains route/composer geometry and slash-menu product policy. It also has parallel flat/nested state-machine logic for `/` and `@` surfaces. This makes a shared editor primitive harder to reason about each time a composer-only placement issue appears.

Smallest remediation batch:

- Extract tested popup geometry into `suggestion-menu-positioning.ts`.
- Pass a `positionStrategy` into renderers so chat composers own their anchoring.
- Extract a shared flat/nested surface controller for slash and mention menus.
- Move Ask Rovo header/row suppression behind a slash-menu extension instead of generic renderer state.

### 5. PromptInput still owns directory autocomplete policy

- PRs: `#783`, `#798`
- Current size: `components/ui-custom/prompt-input.tsx` is 2,215 lines after PR `#1019`.
- Evidence:
  - `components/ui-custom/prompt-input.tsx:1033` exposes `enableDirectoryAutocomplete`.
  - `components/ui-custom/prompt-input.tsx:1041` exposes external autocomplete state.
  - `components/ui-custom/prompt-input.tsx:1105` defaults `mentionSources` to the editor palette catalog.
  - `components/ui-custom/prompt-input.tsx:1143` stores directory autocomplete state refs inside the generic prompt primitive.
  - `components/ui-custom/prompt-input.tsx:1151` exposes imperative autocomplete selection/acceptance.

`#1019` correctly removed the newer visual-trace bulk from `PromptInputTextarea`, but the older directory autocomplete surface still lives in the generic prompt primitive. It imports directory/editor-palette concepts and handles ghost text, external list selection, and match insertion from inside the primitive.

Smallest remediation batch:

- Move autocomplete state, controller, and Tiptap insertion logic into `useComposerDirectoryAutocomplete` under `rich-text-editor/` or a composer-owned module.
- Keep `PromptInputTextarea` focused on editor creation, value publishing, and controller bridging.
- Preserve the existing prop API through a compatibility wrapper while the callers move.

### 6. Agent config add/dropdown behavior is embedded in the 4.8k-line Agent block

- PRs: `#803`, `#805`, `#807`, `#822`, with later related changes.
- Current size: `components/blocks/agent/components/agent.tsx` is 4,800 lines.
- Evidence:
  - `components/blocks/agent/components/agent.tsx:1654` and nearby compact nav functions still own field-specific menu behavior.
  - `components/blocks/agent/components/agent.tsx:2567` adds `renderAddControl` to filled rows.
  - `components/blocks/agent/components/agent.tsx:2594` resolves inline add affordances from dropdown-backed controls.
  - `components/blocks/agent/components/agent.tsx:3021` wires Apps inline add to the collapsed-nav dropdown.
  - `components/blocks/agent/components/agent.tsx:3057` and `:3094` repeat similar field-specific add-control wiring for Skills and Subagents.

The UX goal is sound: expanded row add controls should open the same flyouts as the collapsed nav. The implementation keeps the field dispatcher, add/search/browse/remove/toggle wiring, row summary rendering, and compact nav menu behavior in one giant component.

Smallest remediation batch:

- Extract `agent-config-add-menu` or `useAgentConfigAddControls`.
- Let that module own field-specific add/search/browse/remove/toggle wiring.
- Keep `AgentFilledSummaryRow` and compact nav buttons presentational.
- Add focused tests for already-added exclusion, Browse opening the directory, and selecting an item keeping the flyout usable.

### 7. Apps Directory remains a large shell/detail/sidebar owner

- PR: `#824`, with later #1019 partial remediation of shared experimental directory duplication.
- Current size: `components/blocks/apps-directory/components/apps-directory.tsx` is 1,690 lines.
- Evidence:
  - `components/blocks/apps-directory/components/apps-directory.tsx:372` starts `AppsDirectoryDialog` and owns dialog state, category/search, experimental filters, selected detail, added/disabled state, permissions, and knowledge selection.
  - `components/blocks/apps-directory/components/apps-directory.tsx:1105` starts `AppsDirectorySidebar`.
  - `components/blocks/apps-directory/components/apps-directory.tsx:1274` starts `ToolDetailView`, which owns permission groups and knowledge mode/content selection.

`#1019` reduced duplicated experimental shell behavior, but Apps Directory still mixes list filtering, card rendering, sidebar grouping, detail view, permission groups, add/disable state, and knowledge facet selection.

Smallest remediation batch:

- Split `AppsDirectoryDialog` state orchestration from list/sidebar/detail components.
- Extract detail permissions and knowledge selection into focused panels/helpers.
- Keep the current top-level export as a shallow shell.

### 8. Agent Browser experimental mode still depends on fixed measured height and owns too much state

- PRs: `#834`, `#845`, `#875`, `#880`
- Current size: `components/blocks/agent-browser/components/agent-browser.tsx` is 1,924 lines.
- Evidence:
  - `components/blocks/agent-browser/components/agent-browser.tsx:444` documents a hand-measured `727px` dialog height.
  - `components/blocks/agent-browser/components/agent-browser.tsx:463` pins the experimental dialog to `h-[min(727px,calc(100svh-2rem))]`.
  - `components/blocks/agent-browser/components/agent-browser.tsx:661` starts `ExperimentalAgentBrowser`.
  - `components/blocks/agent-browser/components/agent-browser.tsx:671` through `:680` owns query, four filter state lists, template mode, active category, motion direction, and overflow behavior.

Later work extracted the template build-progress flow and got Agent Card back under 1k lines, so those older concerns are not re-raised. The still-valid issue is the active experimental browser path: layout stability depends on a comment telling maintainers to re-measure after changes, and filter/template/list state remains inside one file.

Smallest remediation batch:

- Extract `ExperimentalAgentBrowser` and `useExperimentalAgentBrowserFilters`.
- Replace fixed-height arithmetic with an intrinsic grid/flex layout or a measured CSS variable owned by the template row.
- Add one viewport regression check around tab switching.

### 9. Template setup metadata is still transported through model prompt text

- PR: `#858`
- Evidence:
  - `components/projects/studio/lib/studio-agent-creation-context.ts:682` emits machine-readable setup narration lines.
  - `components/projects/studio/lib/studio-agent-creation-context.ts:685` through `:695` includes setup display names and trigger phrases in prompt text.
  - `backend/lib/studio-agent-trace.js:97` reparses those lines.
  - `backend/lib/studio-agent-trace.js:112` through `:123` extracts setup metadata with regexes.

This is brittle because text meant for the model doubles as a backend metadata protocol. Any copy edit to the model-facing prompt can break trace setup extraction.

Smallest remediation batch:

- Define a typed `StudioTraceSetup` metadata object beside `StudioCreationTemplateContext`.
- Pass it as sidecar submit metadata to backend trace building.
- Delete `parseTemplateSetupFromContext` and the special prompt lines.

### 10. Ink Wash shipped as one first-party WebGL engine file

- PR: `#895`
- Current size: `components/visual/ink-wash/engine.ts` is 1,331 lines.
- Evidence:
  - `components/visual/ink-wash/engine.ts:87` starts hundreds of lines of shader strings.
  - `components/visual/ink-wash/engine.ts:521` owns GL target/program plumbing.
  - `components/visual/ink-wash/engine.ts:632` starts the runtime class.
  - `components/visual/ink-wash/engine.ts:1044` owns brush physics.
  - `components/visual/ink-wash/engine.ts:1185` owns the render pipeline.

This is not a correctness issue and the public component wrapper is clean. The maintainability problem is that the engine is first-party code, not quarantined vendor code, but shaders, GL resources, pointer state, scripted strokes, and render passes are all in one file.

Smallest remediation batch:

- Split shader sources into `shaders.ts`.
- Split GL target/program helpers into `gl-targets.ts`.
- Split pointer/script stroke state into `brush.ts` or `input.ts`.
- Keep `InkWashEngine` as the orchestrator and preserve the public `InkWash` API.

### 11. Backend Studio agent result still mixes extraction, tolerant parsing, fallback generation, and prompt prefix policy

- PRs: `#802`, `#831`, `#884`, with later related additions.
- Current size: `backend/lib/studio-agent-result.js` is 1,241 lines.
- Evidence:
  - `backend/lib/studio-agent-result.js:281` starts JSON escape handling for the tolerant parser.
  - `backend/lib/studio-agent-result.js:328` starts a backtracking JSON-object parser.
  - `backend/lib/studio-agent-result.js:578` starts marker extraction.
  - `backend/lib/studio-agent-result.js:626` starts fenced JSON extraction.
  - `backend/lib/studio-agent-result.js:938` starts fallback tool detection.
  - `backend/lib/studio-agent-result.js:963` keeps fallback app regex patterns.
  - `backend/lib/studio-agent-result.js:1040` starts deterministic fallback agent result construction.

This overlaps conceptually with the later report's Studio automation findings, but the still-valid issue here is the older backend module ownership: parsing/extraction, fallback generation, creation prompt prefix, and missing-result failure policy all live together. Some of the app-token duplication was fixed by `#1019`, so this finding is narrower than the prior report's app-token item.

Smallest remediation batch:

- Extract tolerant parsing and marker/fence/bare JSON extraction into `studio-agent-result-extraction.js`.
- Extract deterministic fallback generation into `studio-agent-result-fallback.js`.
- Keep `backend/lib/studio-agent-result.js` as a facade for current exports.

### 12. Entity/agent banner color ownership is duplicated

- PR: `#828`
- Evidence:
  - `components/ui-custom/entity-card/parts.tsx:341` says the banner styling is mirrored from Agent and duplicated.
  - `components/ui-custom/entity-card/parts.tsx:347` defines `BANNER_COVER_COLORS`.
  - `components/blocks/agent/components/agent.tsx:195` defines `AGENT_AVATAR_PROFILE_COVER_COLORS`.
  - `components/ui-custom/entity-card/agent-profile.tsx:26` defines another agent category color map.

This is not as urgent as the oversized owners, but it is a clear canonical-boundary leak: avatar category parsing and banner color lookup should not be copied across Agent, EntityCard, and AgentProfile.

Smallest remediation batch:

- Move avatar category parsing and banner color lookup to `lib/agent-avatars`.
- Import the helper from Agent, EntityCard, and AgentCard/profile surfaces.

## Skipped Because Already Reviewed Or Fixed

- `#896` merged on `2026-06-14`, outside this non-overlapping previous window, and was already listed in the prior report.
- `#827` was superseded by `#828`; current `components/ui-custom/card-directory/` no longer exists.
- `#809` / `#816` card-directory/entity-card duplication was superseded by later entity-card consolidation.
- `#842` / `#843` / `#846` Agent Card file-size and variant concerns were remediated by `#1019`; current `components/blocks/agent-card/components/agent-card.tsx` is below 1k lines.
- `#873` bare app-token conversion duplication was remediated by `#1019` through `lib/bare-app-mention-tokens.*`.
- `#875` / `#880` overlap with Agent Browser and PromptInput cleanup already handled in part by `#1019`; only the still-valid experimental layout contract remains above.
- `#851` Heatmap was reviewed and not flagged: it is split across focused files, and `#857` added utility-contract tests.
- `#894` frontmatter work was not flagged: the current codec and editor node use `app/data/directory/skill-frontmatter.ts`, and the custom YAML subset is isolated and tested.
- `#884` trigger dialog duplication exists nearby, but the current duplicate half appears to come from later non-target trigger-config work, so this report does not attribute it to the previous-window slice.
- All later-window findings already remediated by `#1019` are not repeated here: Agent 2 decomposition, PromptInput visual-trace bulk, bare app-token converter duplication, Studio automation chat routing, realtime reducer duplication, shared experimental directory shell duplication, Agent Browser template-build-flow sprawl, and Agent Card ticket-style extraction.

## Reviewed PRs

| PR | Title | mergedAt | Status |
|---:|---|---|---|
| #783 | feat: universal composer palette + centralized directory data layer (Phases 1-3) | 2026-06-07T11:54:38Z | Finding: PromptInput directory autocomplete policy |
| #787 | [Automation] Interface contract audit: remove duplicate-named subagent by id | 2026-06-07T00:00:10Z | No high-conviction finding |
| #788 | [Automation] Test coverage: profit/loss segment crossings | 2026-06-07T00:18:12Z | Test-only, no finding |
| #789 | [Automation] Code simplification: subagent delete prompt filter | 2026-06-07T00:37:43Z | No high-conviction finding |
| #790 | [Automation] Deprecation audit: PatternArea animate prop | 2026-06-07T00:51:09Z | No high-conviction finding |
| #791 | [Automation] UI design quality audit: remove agent action wrapper | 2026-06-07T01:12:19Z | No high-conviction finding |
| #792 | [Automation] Performance audit: optimize GenUI export orphan scan | 2026-06-07T19:18:31Z | No high-conviction finding |
| #793 | [Automation] Bug scan: restore compact toolbar guard coverage | 2026-06-07T19:57:35Z | No high-conviction finding |
| #794 | [Automation] Interface contract audit: subagent prompt identity | 2026-06-07T20:13:09Z | No high-conviction finding |
| #795 | [Automation] Update AGENTS.md: document Rovo skills repair | 2026-06-07T20:28:13Z | No high-conviction finding |
| #796 | [Automation] Engineering improvement map: harden git ship status refresh | 2026-06-07T21:01:02Z | No high-conviction finding |
| #797 | Expand directory data catalog and skill source taxonomy | 2026-06-08T00:10:22Z | No high-conviction finding |
| #798 | Add directory autocomplete UI | 2026-06-08T06:32:56Z | Finding: PromptInput directory autocomplete policy |
| #799 | perf: Vercel React best-practices + migrate spun loaders to vpk-spinner | 2026-06-08T06:08:15Z | No high-conviction finding |
| #800 | Align prompt flyout menu | 2026-06-08T06:30:43Z | No high-conviction finding |
| #801 | Fix font-size scaling and agent surface spacing | 2026-06-08T08:36:10Z | No high-conviction finding |
| #802 | Add generation-driven agent config population + body lozenges | 2026-06-08T12:13:13Z | Finding: backend Studio agent result ownership |
| #803 | Add editor palette search picker | 2026-06-08T12:44:52Z | Finding: Agent add/search behavior embedded |
| #804 | Polish editor palette search picker | 2026-06-08T14:09:55Z | No high-conviction finding |
| #805 | Enhance agent component functionality and layout | 2026-06-08T14:20:52Z | Finding: Agent add/search behavior embedded |
| #806 | Scale editor-palette front-slot visuals to 24px | 2026-06-09T00:47:39Z | No high-conviction finding |
| #807 | Pin compact config dropdown footers | 2026-06-09T00:53:51Z | Finding: Agent add/search behavior embedded |
| #808 | Add smart link block | 2026-06-09T01:47:17Z | No high-conviction finding |
| #809 | Unify entity card components | 2026-06-09T02:06:52Z | Already fixed/superseded |
| #810 | Expose Smart Link in website nav | 2026-06-09T02:32:39Z | No high-conviction finding |
| #811 | Rename entity card catalog entry | 2026-06-09T03:06:24Z | No high-conviction finding |
| #812 | Standardize menu item styling | 2026-06-09T03:11:45Z | No high-conviction finding |
| #813 | Add Memory block (Rovo memory modal) | 2026-06-09T03:17:20Z | No high-conviction finding |
| #814 | Wire activity timeline into custom-agent Activity tab | 2026-06-09T04:25:58Z | No high-conviction finding |
| #815 | Wire agent memory modal | 2026-06-09T04:53:01Z | No high-conviction finding |
| #816 | Align entity card directory cards | 2026-06-09T05:24:46Z | Already fixed/superseded |
| #817 | [Automation] Bug scan: remove root screenshot artifacts | 2026-06-10T01:38:01Z | No high-conviction finding |
| #818 | [Automation] Performance audit: reuse session search match | 2026-06-10T01:23:18Z | No high-conviction finding |
| #819 | [Automation] UI design quality audit: fix hover reveal row motion drift | 2026-06-10T01:29:10Z | No high-conviction finding |
| #820 | Use transparent IconTile for mention chip icons | 2026-06-10T01:16:02Z | No high-conviction finding |
| #821 | Add missing getSkillIconColor import in skills-directory | 2026-06-10T01:12:04Z | No high-conviction finding |
| #822 | Open shared collapsed-nav dropdown from expanded agent config Add buttons | 2026-06-10T01:25:56Z | Finding: Agent add/search behavior embedded |
| #823 | Render background-less 1P tag logos in transparent IconTile | 2026-06-10T01:57:13Z | No high-conviction finding |
| #824 | Add apps directory | 2026-06-10T06:33:03Z | Finding: Apps Directory ownership |
| #825 | Add PR review remediation to git ship | 2026-06-10T07:00:21Z | No high-conviction finding |
| #826 | Add dynamic editor palette search | 2026-06-10T09:20:54Z | Finding: source-regex coverage / Agent add search |
| #827 | Revert card-directory/entity-card consolidation | 2026-06-10T09:39:18Z | Superseded by #828 |
| #828 | Consolidate card-directory into entity-card; split out standalone agent-card | 2026-06-10T09:51:27Z | Finding: duplicated banner color ownership |
| #829 | Add agent reference hover previews | 2026-06-10T10:12:09Z | No high-conviction finding |
| #830 | Add Text Morphing visual component (Calligraph port) | 2026-06-10T14:26:10Z | No high-conviction finding |
| #831 | Unify tools + knowledge into Apps in /studio | 2026-06-10T17:11:19Z | Finding: app facet reconciliation |
| #832 | Address Codex review on #831: app removal + per-app knowledge selection | 2026-06-10T18:05:20Z | Finding: app facet reconciliation |
| #833 | vpk-git-ship: universal pre-merge Codex/review gate | 2026-06-10T18:39:57Z | No high-conviction finding |
| #834 | Add experimental agents directory variant | 2026-06-10T18:55:25Z | Finding: Agent Browser experimental layout |
| #835 | Fix agents directory dimension assertion | 2026-06-10T19:03:27Z | No high-conviction finding |
| #836 | Open a dropdown for the compact Apps nav instead of the directory | 2026-06-10T19:54:12Z | Finding: source-regex coverage / Agent add search |
| #837 | [Automation] Interface contract audit: json-render Lozenge metric | 2026-06-11T00:08:05Z | No high-conviction finding |
| #838 | Fix editor palette search bylines | 2026-06-10T20:25:12Z | No high-conviction finding |
| #839 | Fix Studio reference chip hover previews | 2026-06-10T21:10:16Z | No high-conviction finding |
| #840 | Render editor palette menu logos at native 24px | 2026-06-10T21:11:10Z | No high-conviction finding |
| #841 | Restore front-slot icon on collapsed agent config rows | 2026-06-10T21:58:18Z | No high-conviction finding |
| #842 | Add experimental agent card variants | 2026-06-10T21:40:07Z | Remediated by #1019 |
| #843 | Fix agent card more action contrast | 2026-06-10T22:47:10Z | Fixed follow-up / remediated by #1019 |
| #844 | [Automation] Code simplification: trigger row delete button | 2026-06-11T00:09:16Z | No high-conviction finding |
| #845 | Use latest experimental agent card in agents directory | 2026-06-11T01:59:11Z | Finding: Agent Browser experimental layout; card bloat remediated |
| #846 | Restyle experimental-profile agent card as entity card | 2026-06-11T03:39:20Z | Card bloat remediated |
| #847 | Exclude already-added items from inline Add search | 2026-06-11T03:54:39Z | Finding: source-regex coverage / Agent add search |
| #848 | Triggers Edit button opens the collapsed-nav flyout | 2026-06-11T03:38:11Z | Finding: source-regex coverage / Agent add search |
| #849 | Fix subagents navigator spacing | 2026-06-11T16:52:14Z | No high-conviction finding |
| #850 | fix: stop forcing a border tile on solid-fill 3P logos in directory autocomplete | 2026-06-11T16:57:36Z | Skipped, later logo surface changed |
| #851 | Add heatmap chart component | 2026-06-11T17:07:25Z | Reviewed, no structural finding |
| #852 | Refine studio agent landing controls | 2026-06-11T17:34:54Z | No high-conviction finding |
| #853 | Fix subagents navigator open-panel bottom spacing | 2026-06-11T17:46:56Z | No high-conviction finding |
| #854 | Refine agent template layout | 2026-06-11T18:52:30Z | Skipped, later refactors overlap |
| #855 | Add Studio agent publish versioning | 2026-06-11T19:37:29Z | Finding: Studio publish workflow in config panel |
| #856 | Align subagent selector modes | 2026-06-11T19:35:04Z | No high-conviction finding |
| #857 | [Automation] Test coverage: heatmap utility contracts | 2026-06-12T20:40:15Z | Test-only, no finding |
| #858 | Story-rich agent templates: bodies, triggers, connect flow, nested subagents | 2026-06-11T21:29:23Z | Finding: template setup string protocol |
| #859 | Hide greeting hero while composing + ghost autocomplete | 2026-06-11T21:12:17Z | No high-conviction finding |
| #860 | Add Artifact List block | 2026-06-11T21:20:02Z | No high-conviction finding |
| #861 | Harden wiki runtime security | 2026-06-11T21:19:44Z | No high-conviction finding |
| #862 | Defer rich text setContent to a microtask to avoid flushSync error | 2026-06-11T21:48:28Z | Narrow workaround, no finding |
| #863 | Move artifact catalog sections | 2026-06-11T21:56:01Z | No high-conviction finding |
| #864 | Polish agent card template UI and directory layouts | 2026-06-11T23:22:02Z | Skipped, later refactors overlap |
| #865 | Keep single-question card title and dismiss in one row | 2026-06-11T22:21:15Z | No high-conviction finding |
| #866 | Fill tag front slot with solid-background 1P logos | 2026-06-11T22:41:25Z | Skipped, later logo surface changed |
| #867 | Standardize subagent icon tiles | 2026-06-11T23:12:23Z | No high-conviction finding |
| #868 | Fix agent compact menu focus | 2026-06-11T23:27:19Z | No high-conviction finding |
| #869 | Fix chat greeting motion | 2026-06-11T23:36:21Z | No high-conviction finding |
| #870 | Pin subagents navigator to first instruction line | 2026-06-11T23:54:13Z | No high-conviction finding |
| #871 | Add TWG agent card block | 2026-06-11T23:43:12Z | No high-conviction finding |
| #872 | Add deterministic agent-builder for /studio demo chat | 2026-06-12T03:26:02Z | Finding: deterministic demo builder ownership |
| #873 | Migrate agent templates to unified @[app:id] mention tokens | 2026-06-12T00:19:12Z | Skipped, #1019 remediated conversion duplication |
| #874 | [Automation] Engineering improvement map: UI truncation geometry rules | 2026-06-12T20:17:28Z | No high-conviction finding |
| #875 | Polish experimental agent browser dialog and inputs | 2026-06-12T00:59:10Z | Already fixed overlap |
| #876 | Auto-fade studio agent save confirmation | 2026-06-12T01:26:22Z | No high-conviction finding |
| #878 | Balance agent directory avatar colors | 2026-06-12T02:01:37Z | No high-conviction finding |
| #879 | Brighten subagents minimap on cursor proximity | 2026-06-12T02:00:10Z | No high-conviction finding |
| #880 | Polish studio agent browser, publish UX, and add private-to-you badge | 2026-06-12T02:30:22Z | Already fixed overlap |
| #881 | Show tile sizes demo with border variations | 2026-06-12T02:36:34Z | No high-conviction finding |
| #882 | Add Skill Config block and skill-card attribution | 2026-06-12T02:54:13Z | Finding: Skill Config monolith |
| #883 | Add staggered agent nav reveal and overlay save indicator | 2026-06-12T03:20:02Z | No high-conviction finding |
| #884 | Add Studio automation rules | 2026-06-12T04:01:19Z | No PR-owned finding |
| #885 | Fix React Doctor diagnostics | 2026-06-12T04:45:21Z | No focused finding |
| #886 | Restore Studio agent questions | 2026-06-12T05:37:14Z | No high-conviction finding |
| #887 | Add Studio RFP agent demo | 2026-06-12T08:30:11Z | Finding: deterministic demo builder ownership |
| #888 | [Automation] Frontend runtime audit: triggers manage picker handoff | 2026-06-12T20:18:22Z | No high-conviction finding |
| #889 | [Automation] Deprecation audit: unused copy brand icon | 2026-06-12T20:20:22Z | No high-conviction finding |
| #890 | Refine Skill Config baseline surface | 2026-06-12T22:29:10Z | Finding: Skill Config apps-only row policy |
| #891 | [Automation] UI design quality audit: fix settings nav labels | 2026-06-13T10:46:57Z | No high-conviction finding |
| #892 | Hide Ask Rovo in composer slash menus | 2026-06-12T22:52:58Z | Finding: suggestion-menu policy leak |
| #893 | Anchor Rovo home autocomplete rows | 2026-06-12T23:02:22Z | No high-conviction finding |
| #894 | Add SKILL.md skill-config screen with in-editor frontmatter card | 2026-06-13T16:26:12Z | No high-conviction finding |
| #895 | Add Ink Wash visual component | 2026-06-13T16:45:25Z | Finding: Ink Wash engine ownership |
| #897 | Fix composer / + @ palette to sit outside the prompt input | 2026-06-13T22:12:23Z | Finding: suggestion-menu positioning leak |

## Recommended Smallest Refactor

Start with the Skill Config cleanup from `#882` / `#890`.

Why this batch first:

- It is the clearest file-size violation in this earlier window: 4,554 lines remain in one block component.
- It has an obvious code-judo move: either Skill Config is apps-only, in which case the generic row/nav machinery can be deleted, or it is general, in which case the hard-coded apps-only filters should become a real hidden-field policy.
- The first remediation can be small and testable without touching runtime backend flows or visual rendering.
- It reduces future branching pressure in the same config surfaces that later findings kept hitting.

Smallest implementation plan:

1. Add a pure helper that returns visible Skill Config rows/nav items from the config, hidden fields, and intended mode.
2. Replace the `item.agentFieldName === "apps"` and `row.key === "apps"` filters with that helper.
3. If product intent is apps-only, delete the unused row builders from the Skill Config path instead of keeping a fake-general config surface.
4. Add a focused source-contract test for visible rows and ordering.
5. Run `pnpm run lint`, `pnpm run typecheck`, and the relevant `components/blocks/skill-config` / `components/blocks/agent` unit test allowlist if touched.

Do not begin the refactor until explicitly confirmed.
