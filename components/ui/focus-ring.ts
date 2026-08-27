/**
 * Shared focus treatment for controls that should read like a focused `Input`:
 * a 1px solid focus line with a 3px translucent halo outside it.
 *
 * `Input` / `Textarea` / `SelectTrigger` get that look from a real border plus
 * `ring-3 ring-ring/50`. Borderless controls (bare buttons, row wrappers) can't
 * add a border without changing their box, so these constants draw the same two
 * bands purely with `ring` + `ring-offset` — Tailwind compiles those to two
 * stacked box-shadows with the offset painted over the ring, giving 1px solid
 * then 3px at 50%. Box-shadows don't affect layout, so geometry is untouched.
 *
 * Tailwind only sees literal class strings, so each trigger modifier needs its
 * own constant rather than a composed prefix.
 */

/** Keyboard focus on the control itself. */
export const FOCUS_RING_VISIBLE =
	"outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-ring";

/**
 * Keyboard focus on a descendant, for a wrapper that owns the focus surface on
 * behalf of its child control.
 *
 * Deliberately `:has(:focus-visible)` and not `:focus-within` — `:focus-within`
 * matches pointer focus too, so a popover that restores focus to its trigger on
 * close would leave the ring stuck on after a click-outside dismissal.
 */
export const FOCUS_RING_HAS_VISIBLE =
	"has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-ring";

/** Held open while a descendant button trigger's popover/menu is showing. */
export const FOCUS_RING_POPUP_OPEN =
	"has-[button[data-popup-open]]:ring-3 has-[button[data-popup-open]]:ring-ring/50 has-[button[data-popup-open]]:ring-offset-1 has-[button[data-popup-open]]:ring-offset-ring";

/**
 * Four pixels of compensated clearance for an outward focus indicator inside
 * a clip or scroll owner. Matching negative margin keeps surrounding geometry
 * unchanged while the padding moves the clipping boundary beyond the ring.
 */
export const FOCUS_RING_CLIP_GUTTER = "-m-1 p-1";

/** Top-edge-only form for vertical scrollports whose other edges already clear the ring. */
export const FOCUS_RING_TOP_CLIP_GUTTER = "-mt-1 pt-1";
