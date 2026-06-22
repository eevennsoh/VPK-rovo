# Thermo-Nuclear Code Quality Review - 2026-06-21

## Scope

- Review window: merged PRs targeting `main` from 2026-06-14 through 2026-06-21.
- Audit set: 112 merged PRs across the #896-#1008 range, with `#1007` verified against the final persistent `main` head.
- Stable evidence checkout: `/Users/esoh/Documents/Labs/vpk-rovo` at `e5de0ebed615d08f808f5baf3f657e4360f5178a`.
- Report location: `/Users/esoh/.codex/worktrees/90ba/vpk-rovo/docs/thermo-nuclear-code-quality-review-2026-06-21.md`.
- Requested standard: `thermo-nuclear-code-quality-review`, focused on structural simplification, file-size crossings, spaghetti growth, boundary leaks, duplication, and canonical ownership.

The original Codex worktree path was available when this report was written, but it was detached and one merge behind the persistent checkout. Current line evidence below therefore references the stable persistent checkout on `main`.

## Method

- Spawned six read-only review agents and split the week by PR/topic bands.
- Completed agent slices:
  - Early visual/composer/agent-card changes.
  - Agent 2 and Studio automation discovery.
  - Directories, Agent Browser, chat provider, realtime voice, entity cards.
  - Studio generated-agent, onboarding, skill config, and replay-card flows.
- Two agents were shut down before producing final findings; their later-scope coverage was supplemented by the parent pass.
- Local parent checks included GitHub PR metadata, merge-log verification, high-risk file inspection, and a 1k-line crossing scan.

## Executive Summary

The week delivered a large volume of UI and Studio iteration, but the strongest maintainability risks cluster around a few repeat patterns:

1. New feature work repeatedly landed inside already-busy, general-purpose files instead of creating narrow feature owners.
2. Several PRs crossed or reinforced 1k-line file boundaries without a strong structural reason.
3. Studio-specific demo, generated-agent, onboarding, and replay semantics leaked into shared chat, trace, and shell surfaces.
4. Multiple UI directory/card abstractions were introduced or extended while old duplicate implementations remained active.
5. Shared protocol/data-normalization logic was copied between routes or layers instead of being made canonical.

The highest-value cleanup path is not a broad rewrite. It is a sequence of focused ownership extractions that reduce future branching pressure: decompose Agent 2, isolate Studio automation/generated-agent flows, move composer tracing out of `PromptInputTextarea`, and consolidate duplicated directory/realtime/entity-card contracts.

## Highest Priority Findings

### 1. Agent 2 became a 5k-line owner of unrelated contracts

- PRs: `#934` and `#936`
- Evidence: `components/blocks/agent-2/components/agent-2.tsx:1`, `:1057`, `:1186`, `:1766`, `:1918`
- Current size: 5,127 lines.

`#934` introduced `agent-2.tsx` as a 4,719-line component. It now owns config data models, mention mapping, disabled-item policy, compact menu behavior, avatar/profile editing, reasoning and memory selectors, instructions editing, automation dialog orchestration, and final panel rendering. The top-level lint disables are a symptom of a component absorbing too many contracts.

`#936` then added DOM-level focus redirection, global `pointerdown`/`keydown` listeners, timeouts, keep-open refs, and stable-key tricks for multi-select menu behavior inside that same file. This is brittle UI primitive behavior embedded directly in feature code.

Suggested simplification:

- Split model and mapping logic into `agent-config-model.ts` and `agent-reference-mapping.ts`.
- Extract compact nav/menu behavior into a reusable picker or menu adapter with tests.
- Move profile/avatar, mode selectors, instructions composer, and automation dialog orchestration into focused components/hooks.
- Leave `agent-2.tsx` as a shallow composition layer.

### 2. Studio automation discovery leaked into central chat and shared trace rendering

- PR: `#935`
- Evidence: `backend/server.js:6247`, `backend/server.js:7018`, `components/projects/shared/components/assistant-thinking-trace.tsx:125`, `:726`

Demo-specific automation discovery routing and UI-message streaming were bolted into `backend/server.js`, including pre-route branches for follow-up, initial continuation, and prompt detection inside the central chat handler. This turns the handler into a feature switchboard.

The same PR pushed `assistant-thinking-trace.tsx` from 837 to 1,020 lines and added Studio automation-specific tool names, source maps, TwgTool rendering, and default-open behavior into a shared renderer.

Suggested simplification:

- Move automation-discovery chat turns into a dedicated route strategy/module.
- Keep `backend/server.js` as a small ordered resolver/delegator.
- Let Studio pass a scoped trace renderer/registry, or encode display hints in backend trace data.
- Keep the shared trace component generic.

### 3. PromptInputTextarea absorbed composer voice tracing and auto-tag behavior

- PR: `#911`
- Evidence: `components/ui-custom/prompt-input.tsx:1028`, `:1192`, `:1519`, `:1634`
- Growth: 2,091 to 2,630 lines in the PR; current size 2,949 lines.

`PromptInputTextarea` is a generic UI primitive, but this change moved Rovo/composer-specific trace decorations, Tiptap document mapping, auto-tag matching, undo snapshots, timers, and conversion orchestration into it. This makes every future prompt-input change reason about composer-specific behavior.

Suggested simplification:

- Move auto-tag matching, trace decorations, undo snapshots, and timeout orchestration into a composer-owned hook or Tiptap extension under `rich-text-editor/`.
- Keep `PromptInputTextarea` focused on editor creation, value publishing, and controller props.

### 4. Border Beam landed as one giant generated/style module

- PR: `#900`
- Evidence: `components/visual/border-beam/styles.ts:53`, `:1136`
- Current size: 2,284 lines.

This PR added a 2,179-line `styles.ts` that owns theme presets, palettes, pulse geometry, animation constants, and all CSS generators. The dispatcher fans out into five large variant generators in the same file.

Suggested simplification:

- Split `palettes.ts`, `pulse-geometry.ts`, and `generators/{small,border,line,pulse-inner,pulse-outer}.ts`.
- Keep `generateBeamCSS` as a small typed dispatcher.
- If this is vendor-style generated code, quarantine it under a vendor path and expose a thin local wrapper.

### 5. AgentCard crossed the 1k-line threshold while mixing variants and measurement logic

- PR: `#915`
- Evidence: `components/blocks/agent-card/components/agent-card.tsx:128`, `:512`, `:570`, `:664`, `:905`
- Growth: 904 to 1,023 lines in the PR; current size 1,037 lines.

The file now mixes shared prop normalization, multiple full-card variants, ticket mask constants, ResizeObserver seam measurement, and click-forwarding behavior.

Suggested simplification:

- Extract `AgentCardExpandedTicket`, `AgentCardTemplate`, `AgentCardExperimental`, and `AgentCardProfile`.
- Move ticket mask/seam constants into a small ticket-style module.
- Leave `AgentCard` as a shallow dispatcher with shared derived values.

### 6. Studio shell reset/generation/onboarding orchestration is non-atomic and too centralized

- PRs: `#966`, `#970`, `#977`, `#981`, `#983`
- Evidence:
  - `components/projects/studio/components/rovo-app-shell.tsx:2653`
  - `components/projects/studio/lib/studio-screen-assistant.ts:289`
  - `backend/lib/studio-automation-discovery-demo.js:695`
  - `components/projects/sidebar-chat/page.tsx:173`, `:112`, `:1630`
  - `components/projects/studio/components/rovo-app-shell.tsx:2389`

`handleResetStudioDemo` now coordinates backend reset, two thread stores, session-agent deletion/reseed, localStorage writes, URL navigation, and 20+ local UI state resets inside the 5.7k-line Studio shell. The screen-assistant adapter parses loose model input, resolves catalog ids, constructs subagent prompts, builds automation rules, casts through `unknown`, and encodes whole-array replacement semantics.

Generated-agent fixtures pushed `backend/lib/studio-automation-discovery-demo.js` from 918 to 1,031 lines. Onboarding added a `scriptedConversation` mode directly into shared `ChatPanel`, and replay-card suppression introduced a Studio-specific tri-state card policy where `undefined`, `null`, and `string` all have different semantics.

Suggested simplification:

- Move reset behind `useStudioDemoReset` or `resetStudioDemoState`, ideally with a reducer/keyed-remount model for UI-local reset.
- Create a typed draft-patch parser in the Studio agent-config/domain layer.
- Extract generated-agent demo fixture data into a demo-data module and fixture factories.
- Keep tour transcript/voice command loops in a Studio-owned wrapper or hook.
- Keep replay suppression in Studio ownership, or pass a generic render/filter callback instead of encoding Studio source-message semantics in `ChatPanel`.

## Medium Priority Findings

### 7. App-token conversion is duplicated across frontend and backend

- PR: `#907`
- Evidence: `app/data/directory/resolve-ids.ts:626`, `:683`, `backend/lib/studio-agent-result.js:992`, `:1035`

The same bare `@name` / `/name` to `@[app:id]` conversion exists twice, with comments saying the backend mirrors the frontend. The copies use different catalogs and independently maintain slugging, regex boundaries, and code-region skipping.

Suggested simplification:

- Make one canonical converter shared by both paths, or move conversion to one boundary only.
- If backend cannot import the TypeScript helper directly, generate a shared data table or small CJS helper instead of duplicating regex logic.

### 8. Experimental directory variants duplicated the same shell in apps and skills

- PR: `#944`
- Evidence: `components/blocks/apps-directory/components/apps-directory.tsx:887`, `components/blocks/skills-directory/components/skills-directory.tsx:1435`

The apps and skills directories now duplicate the same experimental shell: filter state, active-facet hiding, reset behavior, pinned search/filter chrome, scroll masking, section splitting, and popover dropdown mechanics. The PR added roughly 463 lines to apps and 502 lines to skills.

Suggested simplification:

- Extract `ExperimentalDirectoryView`, `FacetFilterDropdown`, and a section renderer.
- Let apps/skills supply filter definitions, option renderers, item renderers, and empty-state copy.

### 9. Agent Browser template build progress belongs in its own flow

- PR: `#952`
- Evidence: `components/blocks/agent-browser/components/agent-browser.tsx:1159`
- Growth: 1,832 to 2,225 lines.

The Agent Browser file now owns carousel scrolling, setup-card tracking, source-logo resolution, a timed build-progress state machine, app selection, cancel handling, and setup card UI. This orchestration is independent of browsing.

Suggested simplification:

- Extract `template-build-flow.tsx` or `template-setup-card.tsx`.
- Move timed progress state into `useTemplateBuildFlow`.
- Keep `ExperimentalTemplateMode` responsible for carousel layout and expanded template selection.

### 10. Studio generation transcript adoption leaked into the shared chat provider

- PR: `#956`
- Evidence: `app/contexts/context-rovo-chat.tsx:814`, `:3430`, `:3647`, `components/projects/studio/components/rovo-app-shell.tsx:1935`

The shared Rovo chat provider exposes `adoptThreadMessages` and resets provider internals so Studio can force-adopt generation transcripts from a separate chat store. The comment explicitly documents the API exists because Studio generation uses another store.

Suggested simplification:

- Make thread adoption a canonical chat-store operation, or route generation through the same provider-backed thread model.
- If snapshot hydration remains necessary, keep it reducer-owned and generic so callers do not depend on provider persistence internals.

### 11. Realtime assistant state is duplicated between Studio and Rovo

- PR: `#959`
- Evidence:
  - `components/projects/rovo/lib/rovo-app-realtime-assistant-state.ts:1`
  - `components/projects/studio/lib/rovo-app-realtime-assistant-state.ts:1`
  - `components/projects/rovo/lib/rovo-app-realtime-assistant-state.test.js:15`

The Studio and Rovo realtime assistant transcript reducers are byte-identical. The test works around this by running the same assertions against both copies. This is a shared protocol boundary, not route-specific code.

Suggested simplification:

- Move the reducer and types to `components/projects/shared/lib/realtime-assistant-state.ts`.
- Import the shared reducer from both routes.
- Test the shared reducer directly.

### 12. Selectable EntityCard abstraction was added while the old Skills card copy remained

- PR: `#965`
- Evidence:
  - `components/ui-custom/entity-card/variants.tsx:153`
  - `components/ui-custom/entity-card/parts.tsx:160`
  - `components/blocks/skills-directory/components/skills-directory.tsx:757`

`#965` added a canonical selectable card path and shared checkbox behavior, but `SkillsDirectoryEntityCard` still hand-rolls the same selectable skill card: local checkbox swap, propagation guard, header, footer, publisher avatar, and stats.

Suggested simplification:

- Replace `SkillsDirectoryEntityCard` with `EntityCardSkillCard`.
- Pass `selected`, `onSelect`, `added`, publisher/logo metadata, stats, and `moreAction`.
- Delete the local checkbox/header/footer copy.

### 13. Skill config normalization is scattered across UI modules

- PR: `#982`
- Evidence:
  - `components/blocks/agent-2/components/agent-2.tsx:359`
  - `components/projects/studio/components/rovo-app-agent-config-panel.tsx:109`
  - `components/blocks/editor-palette/page.tsx:190`

Skill config normalization is implemented through local `getSkillConfigLabel` helpers and `field === "skills"` branches. The invariant is important enough to live at the data boundary instead of being rediscovered by each picker, chip, and mention surface.

Suggested simplification:

- Export a canonical `normalizeAgentConfigListValue(field, value)` or skill config resolver from the shared agent-config/directory layer.
- Prefer normalizing skill ids once when drafts enter persistence, with display-name compatibility handled as load/repair.

### 14. Third-party logo package migration left a manual mirror surface

- PRs: `#1000`, `#1001`, `#1006`
- Evidence:
  - `components/ui/data/logo-third-party-data.ts`
  - `components/ui/data/logo-third-party-icons.ts`
  - `components/ui/logo-third-party.tsx`

The logo migration moved assets into a package but left a manual mirror of the upstream surface: ids, labels, fallback ids, deep imports, icon maps, and named wrapper exports. This is not currently the largest risk, but it creates a maintenance trap for every future logo addition.

Suggested simplification:

- Generate the registry/icon map from package metadata or entrypoints plus a small local fallback manifest.
- Reduce named wrapper exports if most consumers can use the canonical `LogoThirdParty` entrypoint.

## File Size Crossing Evidence

The review treated sub-1k to over-1k file growth as a strong smell. The local scan found these crossings during the merge window:

```text
    0 ->  5127 components/blocks/agent-2/components/agent-2.tsx
    0 ->  2284 components/visual/border-beam/styles.ts
  837 ->  1049 components/projects/shared/components/assistant-thinking-trace.tsx
  904 ->  1037 components/blocks/agent-card/components/agent-card.tsx
    0 ->  1031 backend/lib/studio-automation-discovery-demo.js
```

Largest current files observed in the stable checkout included:

```text
16745 backend/server.js
 8859 components/website/registry.ts
 6467 app/data/details/ui.ts
 5759 components/projects/studio/components/rovo-app-shell.tsx
 5374 components/projects/studio/hooks/use-rovo-app.ts
 5127 components/blocks/agent-2/components/agent-2.tsx
 5114 components/projects/rovo/hooks/use-rovo-app.ts
 2949 components/ui-custom/prompt-input.tsx
```

## Recommended Simplification Roadmap

1. Decompose Agent 2 before adding more feature behavior.
   - First extract model/mapping/menu behavior.
   - Add focused tests around compact menu keep-open behavior.

2. Pull Studio automation discovery out of `backend/server.js` and shared trace rendering.
   - Create a demo route strategy/module.
   - Keep trace presentation generic or registry-driven.

3. Move composer tracing and auto-tagging out of `PromptInputTextarea`.
   - Target a composer hook plus Tiptap extension modules.

4. Extract `AgentCard` variants and ticket styling.
   - This is a contained UI decomposition with low behavioral risk.

5. Split or quarantine Border Beam style generation.
   - Decide whether it is first-party maintainable code or vendor-like generated code.

6. Share experimental directory filtering/layout.
   - Apps and skills should parameterize one shell instead of drifting in parallel.

7. Consolidate realtime assistant state and skill config normalization.
   - Both are clear shared contracts with duplicated implementations.

8. Generate or reduce the third-party logo registry mirror.
   - Lower priority, but worthwhile before the package surface grows further.

## Reviewed With No High-Conviction Structural Finding

The following PRs were reviewed by agents or the parent pass without a high-confidence maintainability finding under the requested standard:

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

Notes:

- `#978` was specifically a successful simplification and did not raise a new structural concern.
- `#994` / `#996` payload-limit hardening looked appropriately shared through `app/api/_utils/read-json-body.ts` with route-specific limits.
- `#1005` was a large `vpk-html` skill rebuild. No high-confidence structural finding was recorded from the available evidence; it appears data/asset-heavy rather than a clear abstraction regression.
- `#1007` was a narrow performance-audit date-formatter cache change.

## Agent Coverage Record

```text
019eea24-e7c1-76f3-93a0-58f33d863a14 completed
019eea25-1654-7b70-b549-5398392a287c completed
019eea25-48da-75e1-bcbd-6146ce0d37f9 completed
019eea25-784f-71e0-9aff-2d92280a9a4d completed
019eea25-a894-7080-a7b8-51d2e4db287f shut down before final findings
019eea25-ba00-7f92-9277-5f56788c976e shut down before final findings
```

## Appendix: Commands And Evidence Sources

Representative evidence commands used during the audit:

```bash
gh api graphql --paginate --field query='repo:eevennsoh/vpk-rovo is:pr is:merged base:main merged:2026-06-14..2026-06-21' ...
git -C /Users/esoh/Documents/Labs/vpk-rovo log --oneline --merges --since=2026-06-14 --until=2026-06-22 --max-count=20
git -C /Users/esoh/Documents/Labs/vpk-rovo rev-parse HEAD
git -C /Users/esoh/Documents/Labs/vpk-rovo status --short --branch
```

1k-line crossing scan:

```bash
for f in $(git -C /Users/esoh/Documents/Labs/vpk-rovo ls-files '*.ts' '*.tsx' '*.js' '*.jsx'); do
  cur=$(wc -l < "/Users/esoh/Documents/Labs/vpk-rovo/$f")
  if [ "$cur" -ge 1000 ]; then
    base=$(git -C /Users/esoh/Documents/Labs/vpk-rovo show ce8f9be1ca6b8883ad7464a3c5569ce935b9fb02^1:"$f" 2>/dev/null | wc -l | tr -d ' ')
    if [ -z "$base" ]; then base=0; fi
    if [ "$base" -lt 1000 ]; then
      printf "%5s -> %5s %s\n" "$base" "$cur" "$f"
    fi
  fi
done | sort -k3,3nr
```
