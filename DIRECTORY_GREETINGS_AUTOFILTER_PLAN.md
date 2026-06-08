<!-- session: 08d0671b-c5b2-4d6e-9d13-f8adf09f146c -->

# Directory-backed chat greetings + free-text auto-filter

> Status: **DRAFT — not yet approved.** Captured for later implementation.

## Decisions captured

- **Source of truth:** static directory files (no real DB). Unify all greetings into
  the directory using the **JSON + loader** convention (`DirectoryVisual` icon keys;
  loader rehydrates icons/prompts).
- **Single shared source:** default greetings + agent starters both resolve from the
  directory; `lib/rovo-suggestions.ts` becomes a thin adapter (keeps `RovoSuggestion`
  type + non-serializable prompt/context strings loader-side).
- **Auto-filter:** as the user types plain text, **re-rank the empty-state greeting
  list in place**, matching **skills + tools only** (`DEFAULT_SKILLS` + `DEMO_TOOLS`).
- **Match/rank:** reuse existing `filterItems` substring-on-label+description;
  **cap at 9**.
- **Select action:** clicking a filtered skill/tool **inserts an @mention chip**
  (rich-editor surfaces only).
- **Edge cases:** no match → hide the list; `@`/`/` active → suppress greeting filter
  (defer to existing mention/slash menus).
- **Scope:** ALL greeting consumers read from the unified directory source; the
  **live filter + @mention insert ships only on rich-editor surfaces**
  (sidebar-chat, studio). Plain-textarea surfaces (blocks/chat, terminal-switch)
  keep the static unified greeting.

## Implementation steps

### 1. Directory greeting data (new)

- Add `app/data/directory/prompts.json` + `prompts.ts` loader: `GreetingPrompt` shape
  (id, label, description, visual via `DirectoryVisual`, prompt/context keys, type).
  Migrate the 6 `defaultSuggestions` and the default agent-starter generator here.
- Export from `app/data/directory/index.ts`.

### 2. rovo-suggestions adapter

- `lib/rovo-suggestions.ts`: `defaultSuggestions` derives from the directory loader;
  rehydrate icons via existing `resolveDirectoryVisual` / `getSkillIcon`. Keep
  prompt/context constants loader-side. `agents.ts` `createDefaultStarters` reads
  from the directory.

### 3. Free-text filter (sidebar-chat first, then studio)

- Page already owns composer text via `prompt` / `onPromptChange` — feed it to
  `ChatGreeting`.
- New helper `lib/greeting-filter.ts`: given query, return top-9 skill/tool matches
  via `filterItems`; empty query → curated greeting prompts; `@`/`/` prefix → return
  null (suppressed); no match → empty (list hidden).
- `ChatGreeting` renders filtered skill/tool rows through the existing
  `GreetingPromptRow`.

### 4. @mention insert on select

- Wire skill/tool row click to the rich-text composer's existing mention-insert path
  (reuse `getMentionSources` / suggestion-menu tokens). Sidebar-chat + studio only.

### 5. Tests + validation

- Unit: greeting-filter (substring, cap=9, empty-query fallback, `@`//suppression,
  no-match hide).
- Update `chat-greeting.test.js` + `agents.test.js` for the new source.
- `pnpm run lint`, `pnpm run typecheck`, targeted `node --test`, and `/agent-browser`
  live check of type-to-filter + chip insert on sidebar-chat.

## Open risk to watch

- Non-serializable prompt/context (e.g. `LAST_7_DAYS_SITE_SCOPE_CONTEXT`) stays
  loader-side; JSON holds a context key the loader maps to the string.

## Key code references (as of capture)

- Greeting source: `lib/rovo-suggestions.ts` (`defaultSuggestions`, `RovoSuggestion`)
- Agent starters: `app/data/directory/agents.ts` (`createDefaultStarters`, `starters`)
- Directory verticals: `app/data/directory/{skills,tools,knowledge}.ts`, `types.ts`,
  `index.ts`, `visual.tsx`
- Existing filter/typeahead: `components/ui-custom/rich-text-editor/suggestion-menu.tsx`
  (`filterItems`, `getMentionSources`, `RichTextSuggestionMenu`, `FLAT_SECTION_LIMIT`)
- Greeting render gate (empty state only): `components/projects/sidebar-chat/page.tsx`
  (`messages.length === 0`, `ChatGreeting`, `handleGreetingSuggestionClick`)
- Composer value lift: `components/projects/sidebar-chat/components/chat-composer.tsx`
  (`prompt`, `onPromptChange`)
- Greeting row component: `components/projects/shared/components/greeting-prompt-row.tsx`
- Greeting consumers: sidebar-chat, blocks/chat, projects/agents, studio,
  blocks/terminal-switch, rovo-floating-chat
