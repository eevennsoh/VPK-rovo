# StrictMode double-invoke race audit

Context: [`components/utils/theme-wrapper.tsx`](components/utils/theme-wrapper.tsx) had a bug where a `useRef` "has run once" flag survived React 19 StrictMode's dev-only mount → cleanup → mount double-invoke, while a `queueMicrotask`-deferred state update guarded by a local `isUnmounted` closure flag did not. On the second (simulated remount) invocation, the ref gate was already flipped, so the one-time logic was skipped — and the microtask that would have applied the deferred state update had already been cancelled by the first invocation's cleanup. Net effect: the update was silently dropped, only in dev StrictMode.

This audit searched `components/`, `app/contexts/`, and `hooks/` for the same shape: (a) a `useRef` flag gating "run once" logic inside a `useEffect`, combined with (b) a `setTimeout`/`queueMicrotask`-deferred call to a state setter guarded by an unmount-style flag in its own closure. No fixes were applied — findings only.

## Confirmed matches

### 1. `app/contexts/context-rovo-chat.tsx:410-437`

`hasInitializedSessionAgentsRef` (declared `useRef(false)` at line 298):

```js
if (!hasInitializedSessionAgentsRef.current) {
    hasInitializedSessionAgentsRef.current = true;
    return;               // no cleanup registered on this branch
}
// ...schedules a debounced setTimeout that eventually calls
// setSessionAgentSaveStatus / setSessionAgentSavedAt
```

Under StrictMode: invocation A hits the early-return branch, flips the ref, and registers **no cleanup** (nothing for React to undo). Invocation B then sees the ref already `true` and falls through to the real branch — scheduling an actual debounced persist plus `setSessionAgentSaveStatus("saved")` on what is really still the component's first mount.

This is the mirror image of the theme-wrapper bug: instead of silently dropping a legitimate update, it fires a **spurious extra save** (and a "Saving…/Saved" status flash) on initial mount, in dev only.

### 2. `components/projects/shared/hooks/use-reasoning-phase.ts:91-158`

Transition-tracking refs (`prevStreamingRef`, `prevResponseKeyRef`, etc.) gate a `setTimeout(bumpTick, 0)` used solely to force a re-render after ref mutations (the file's own comment at line 54 notes this exists to dodge the `set-state-in-effect` lint rule).

Here the cancellation is a *correct* `clearTimeout`, not a checked boolean — but the vulnerability is structurally the same: the effect body mutates `prevStreamingRef.current = isStreaming` (and sibling refs) **synchronously, before** scheduling the timeout.

- Invocation A mutates the refs and schedules `bumpTick`.
- Cleanup A cancels that timeout via `clearTimeout`.
- Invocation B re-reads the *already-mutated* refs, sees no transition to react to, and schedules nothing.

Net result: if `isStreaming` is already `true` on first mount, the tick that's supposed to force the phase re-render is silently dropped in dev StrictMode. The refs end up correct, but nothing tells React to re-render, so the UI can stay stuck on the initial `"idle"` phase until an unrelated prop change forces a re-render.

## Checked, not vulnerable (for contrast)

- **`components/projects/page.tsx:58-98`** (`useIsEmbedded`) — looks identical at a glance (`queueMicrotask` + `cancelled` flag), but there's no ref-gate: every invocation recomputes `nextAuto` and reschedules its own microtask, so invocation B's microtask isn't blocked by A's.
- **`components/ui-custom/prompt-input.tsx:1587-1641`** — `pendingMentionPrefillKeyRef` looks like a latch, but its cleanup actively resets it back to the "unlocked" value on unmount, so invocation B's guard reopens correctly.
- **`components/ui-custom/reasoning.tsx:297-378`** — timers mutate their "done" refs *inside* the timeout callback (not eagerly in the effect body), so a cancelled invocation-A timer never mutates shared state, and invocation B reschedules cleanly.
- **`hermesSurfaceMountedRef`** in both `rovo-app-shell.tsx` files ([rovo](components/projects/rovo/components/rovo-app-shell.tsx:463), [studio](components/projects/studio/components/rovo-app-shell.tsx:474)) — the mount flag gets flipped back to `true` by invocation B before invocation A's in-flight fetch resolves, so it degrades to a harmless double-fetch rather than a dropped update.
- **`hasQueuedAgentOnboardingTourPreviewRef` / `hasStartedAgentOnboardingTourPreviewRef`** in `components/projects/studio/components/rovo-app-shell.tsx:3113-3152` — same shape, but cleanup explicitly re-opens the gate before the `requestAnimationFrame` chain completes, so it's a double-fire-of-side-effects risk (dev-only preview feature, guarded by `NODE_ENV`/URL param), not a dropped update.

## Takeaway

The distinguishing signal isn't "does a ref exist" — nearly every effect-heavy file in this codebase has one. It's **when the ref gets mutated relative to the deferred call**:

- If the "done" flag is set *inside* the deferred callback (`reasoning.tsx`, `prompt-input.tsx`'s key-reset), StrictMode's synchronous double-invoke can't corrupt it, because the callback hasn't run yet when invocation B starts.
- If the flag is set *eagerly in the effect body* (theme-wrapper's original bug, `context-rovo-chat.tsx`, `use-reasoning-phase.ts`), invocation A poisons the shared ref before invocation B ever gets to inspect it, and the two invocations end up disagreeing about what already happened.
