# Screen Assistant (Clicky) — Architecture Map & Plan Reconciliation

This is the verified ground truth for the Clicky / web screen-assistant feature,
reconciled against `CLICKY_SCREEN_ASSISTANT_PLAN.md`. Read this before editing so
you build from what the code actually does, not from the plan's aspirational
naming.

> **Last verified: 2026-06-04.** The two surfaces use *different sensing
> strategies* (see "How each surface sees the screen" below). There is **no
> Claude-vision Clicky path** in the current code — an earlier version of this
> doc described one; it has been removed. Re-verify against the cited files
> before trusting any line here.

## How each surface sees the screen (TL;DR)

The most important divergence is not line counts — it is *how the model
perceives the UI*:

- **rovo = screenshot vision.** `hooks/use-clicky-voice.ts` captures the viewport
  with html2canvas (`lib/clicky-screen-capture.ts`), downscales to a JPEG, and
  sends it to the OpenAI Realtime model as an `input_image` once per voice turn
  (on the `processing` state). The model is told it can "see screenshots" and
  points back with a text tag `[POINT:x,y:label]` in pixel coordinates. Pointing
  is approximate; html2canvas mis-renders cross-origin/canvas/WebGL content.
- **studio = structured DOM via tools (screenshot-free).** `hooks/use-clicky-voice.ts`
  injects a prompt that explicitly says the model **CANNOT see images**; to read
  the screen it calls the `get_screen_state` tool (active route/panel, composer
  text, pointer-over, and a DOM-scanned list of visible targets with id/label/
  role). Pointing is *grounded* via `point_at_target` → real element rect, and it
  can act through `set_composer_text` / `submit_composer` /
  `apply_agent_draft_patch` / `delegate_to_rovo`. No screenshot is ever captured
  or sent on this path.

These are two different theories of perception (pixels-in-an-image vs
structured-DOM-via-tools), and they exist because the trees are a half-finished
migration — not because two designs were chosen on purpose. The plan's intent is
to converge rovo onto studio's structured model behind a shared module + route
adapters. Studio's model is the better foundation (accuracy, hallucination risk,
cost, privacy, ability to act); the screenshot path's only edge is purely-visual
questions not represented in the DOM, which argues for an *optional* screenshot
fallback rather than two engines.

## Feature names

- The user-facing feature is **Clicky** — an AI cursor companion / screen
  assistant. Identifiers use `clicky*`.
- "Screen assistant" is the **studio-only** structured model name
  (`Studio*`-prefixed types, `screen_assistant_result` payloads).
- There is **no** `visualCursorEnabled` or `screenAssistantEnabled` flag. The
  only gate is `isClickyActive` (`= state !== "off"`).

## Critical structural fact: two diverged copies

Clicky exists as **two parallel trees** that began as copies and have diverged.
`studio` is the newer, richer copy; `rovo` is the older `[POINT:...]` copy. The
backend relay is shared and already serves both.

| Concern | `components/projects/rovo/...` | `components/projects/studio/...` | Divergence |
| --- | --- | --- | --- |
| State machine | `hooks/use-clicky.ts` | `hooks/use-clicky.ts` | import path only |
| Sensing strategy | screenshot vision (`input_image` per turn) | structured DOM via `get_screen_state` tool; **no screenshot** | fundamental — different perception models |
| Voice bridge | `hooks/use-clicky-voice.ts` (screenshot system prompt, captures on `processing`) | `hooks/use-clicky-voice.ts` (tool-based prompt: "you CANNOT see images") | divergent intent, not just length |
| Realtime transport | `hooks/use-realtime-voice.ts` | `hooks/use-realtime-voice.ts` | studio adds `screen_assistant_result` (~60 lines) |
| POINT parser | `lib/clicky-point-parser.ts` | `lib/clicky-point-parser.ts` | identical |
| Screen capture | `lib/clicky-screen-capture.ts` (USED) | `lib/clicky-screen-capture.ts` (present but UNUSED — studio never captures) | studio's tool path bypasses it |
| Cursor/overlay/bubble/history | `components/clicky/*` | `components/clicky/*` | identical → ~12 lines |
| Shell wiring | `components/rovo-app-shell.tsx` | `components/rovo-app-shell.tsx` | heavily diverged (~2000 lines; studio holds the grounding + agent-draft pipeline) |

The structured model lives **only** in studio:
`components/projects/studio/lib/studio-screen-assistant.ts` (+ `.test.js`).
It defines `SCREEN_ASSISTANT_TARGET_ATTR` (`data-screen-assistant-target`),
`SCREEN_ASSISTANT_AGENT_FIELD_ATTR` (`data-agent-field`),
`StudioScreenAssistantPoint`/`Target`/`Snapshot`, and the functions
`getStudioScreenAssistantPointerContext`,
`getStudioScreenAssistantVisibleTargets` (DOM scan, limit 40),
`groundStudioScreenAssistantTarget` (id → fieldId → label → pointer),
`normalizeAgentDraftPatch`, and `createStudioScreenAssistantSnapshot`.
**Rovo has no grounding model** — there is no `rovo-screen-assistant.ts`.

## Genuinely shared pieces (already consolidated)

- `components/projects/shared/components/rovo-composer-send-controls.tsx` —
  emits `data-screen-assistant-target` via `screenAssistantTargetPrefix`.
- `components/ui-custom/agent.tsx` — emits `data-screen-assistant-target` via
  `screenAssistantTargetId`.
- `lib/rovo-ui-messages.ts` (`RovoUIMessage`, `RovoDataParts`) and
  `lib/rovo-app-types.ts` — `studio-screen-assistant.ts` depends on
  `RovoDataParts["agent-result"]`.

The studio composer passes `screenAssistantTargetPrefix="studio-composer"`; the
studio agent-config panel passes `"studio-agent-config"`. **The rovo composer
passes no prefix** — so rovo emits no visible targets today.

## Backend relay (shared)

- `backend/lib/openai-realtime.js` — `class RealtimeSession` opens
  `Browser ──WS──> Express ──WS──> OpenAI Realtime API`. Dual auth (direct
  OpenAI key or AI Gateway ASAP JWT). Model/URL come from `getRealtimeConfig()`
  in `backend/lib/ai-gateway-helpers.js` — **not hardcoded** to `gpt-realtime`.
  Session config uses `semantic_vad` + `gpt-4o-mini-transcribe`.
- `backend/server.js` only **wires** it: `require("./lib/openai-realtime")`,
  WS upgrade handler for `/api/realtime/audio-conversation` (token-gated via
  `verifyRuntimeSocketUpgrade`, scope `realtime:audio-conversation`).
- Token route: `app/api/realtime/audio-conversation-token/route.ts` +
  backend `GET /api/realtime/audio-conversation-token`.
- Tests: `backend/lib/openai-realtime.test.js`,
  `backend/lib/runtime-socket-security.test.js`.

### Image input (server-side) — NO Claude vision path

- There is **no** `_handleClickyVision`, no `streamBedrockGatewayManualSse` call
  for Clicky, no `parseScreenAssistantVisionResponse`, and no
  `_clickyTtsResponseId` in the relay. An earlier version of this doc described a
  Claude-via-AI-Gateway vision detour with structured-JSON parsing; **that code
  does not exist.** (`streamBedrockGatewayManualSse` exists in
  `ai-gateway-helpers.js` but is used by the general gateway provider, not Clicky.)
- rovo's screenshot is handled by `RealtimeSession._handleImageMessageFromUser`
  (`backend/lib/openai-realtime.js`, ~line 950): it forwards the JPEG **directly
  to the OpenAI Realtime model** as a `conversation.item.create` with an
  `input_image` content part (default `detail: "low"`; rovo sends `"auto"`) plus
  an optional `input_text`, then issues `response.create`. No separate vision
  model, no transcript suppression.
- Pointing for rovo is parsed **client-side** from the model's spoken text via
  `lib/clicky-point-parser.ts` (`[POINT:x,y:label]`). studio receives structured
  `screen_assistant_result` over the realtime transport instead.

### Tools / function calls (already present)

- `SESSION_TOOLS` (in `openai-realtime.js`) currently includes: `end_voice_session`,
  `delegate_to_rovo`, **and the studio screen tools** `get_screen_state`,
  `point_at_target`, `set_composer_text`, `submit_composer`,
  `apply_agent_draft_patch`. (These are session-wide; rovo's prompt simply does
  not instruct the model to use the screen tools, so its turns rely on the
  screenshot instead.)
- `RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE` sends `function_call_output` back to
  OpenAI and forwards `{ type: "function_call", name, arguments, callId }` to
  the client, which executes the app-owned tool and returns the result. Client
  handles it in `use-realtime-voice.ts`.

## Composer API (both routes)

There is **no imperative `setComposer`/`submitComposer`**. Text is set via the
controlled `prefillText` prop (`controller.textInput.setInput(prefillText)`);
submission is the shell's `onSubmit` callback (which also calls
`clickyStartProcessing`). To "set composer text" Clicky uses the shell's
`setPrefillText`; to submit, it invokes the shell submit path.

## Plan claims — verdicts

ACCURATE: duplication across routes; relay in `backend/lib`; studio structured
vs rovo legacy POINT; `delegate_to_rovo` / `end_voice_session` +
`function_call_output`; no imperative composer API.

WRONG — do not build on these:
- "Claude vision + OpenAI TTS for Clicky" — **no such path exists.** rovo sends
  its screenshot straight to the OpenAI Realtime model via
  `_handleImageMessageFromUser`; studio sends no screenshot at all and reads the
  DOM through `get_screen_state`. There is no separate vision model and no TTS
  transcript-suppression machinery.

CORRECT BEFORE BUILDING:
- "Decouple `visualCursorEnabled` from `screenAssistantEnabled`" — those flags
  do not exist. The real task is: formalize the single `isClickyActive` gate
  into cursor-visibility vs voice/screen-context concerns, and bring rovo up to
  studio's partial decoupling (studio's `use-clicky-voice.ts` already keeps a
  separately-started voice session alive on cursor deactivate via
  `connectedForClickyRef`; **rovo still unconditionally disconnects**).
- "Preserve `clicky_text_completed`" — it is **dead client code**; the backend
  emits `screen_assistant_result` / `response_done`, never
  `clicky_text_completed`. Don't build new behavior on it; treat removal as
  cleanup, not a compatibility surface.
- "Move Studio's model into shared types" — there is no shared module yet.
  Promote `studio-screen-assistant.ts` (`Studio*` types) into a shared,
  route-neutral module with adapters; do not assume one exists.
- Don't hardcode `gpt-realtime`; the model is config-driven via
  `getRealtimeConfig()`.

## Target shared interfaces (from the plan, validated as new work)

- `ScreenAssistantSnapshot`, `ScreenAssistantRegion`, `ScreenAssistantTarget`,
  `ScreenAssistantAction` (whitelisted app actions only — never raw DOM
  click/type), `ScreenAssistantAdapter` (`getSnapshot()`, `groundTarget()`,
  `executeAction()`).
- Protocol additions: client→server `function_call_output` (extend beyond
  delegate-only), server→client route-safe screen-assistant tool calls;
  keep legacy `[POINT]` parsing temporarily during migration.
- New app-owned Realtime tools: `show_screen_cue`, `set_composer_text`,
  `submit_composer`, `apply_agent_draft_patch` (where supported),
  `delegate_to_rovo` (exists).
- Paint-region UX: a paint/region button beside the AI cursor control;
  next drag paints a freeform region storing path points, viewport rect,
  screenshot-relative rect, and target hints; region persists until next
  region, Escape, or a voice/tool clear.
