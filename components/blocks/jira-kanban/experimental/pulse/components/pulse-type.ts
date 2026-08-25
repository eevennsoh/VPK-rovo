/**
 * Pulse type scale.
 *
 * Section labels and the story eyebrow share the work-item Activity heading
 * treatment — 12px semibold, sentence case, no tracking — so Pulse does not
 * invent a second micro-label rung. Item titles stay on their own 14px rung.
 *
 * - `PULSE_EYEBROW` — the one eyebrow above the display headline.
 * - `PULSE_SECTION_LABEL` — every section heading (`PulseSectionLabel`).
 * - `PULSE_ITEM_TITLE` / `PULSE_ITEM_BODY` — the row rung shared by signals,
 *   actions and uncaptured work, so 14px means exactly one thing.
 */

export const PULSE_EYEBROW =
	"text-xs leading-4 font-semibold text-text-subtlest";

export const PULSE_SECTION_LABEL =
	"text-xs leading-4 font-semibold text-text-subtlest";

export const PULSE_ITEM_TITLE = "text-sm font-medium leading-5 tracking-[-0.006em] text-text";

export const PULSE_ITEM_BODY = "text-sm leading-5 tracking-[-0.006em] text-text-subtle";

/** Row-level data that is not a label: quiet markers, group names, counters. */
export const PULSE_ROW_META = "text-xs leading-4 text-text-subtlest";

/**
 * Reserved tracks shared by every signal and action row, so the work-item key
 * and the trailing control hang off the same two x positions in every row
 * instead of being re-derived from each row's own button width.
 */
export const PULSE_ROW_KEY_TRACK =
	"mt-0.5 w-16 shrink-0 text-right text-xs font-medium leading-4 tabular-nums text-text-subtlest";

export const PULSE_ROW_ACTION_TRACK = "flex w-36 shrink-0 justify-end";

/** Ruled row rhythm, identical in both signal sections. */
export const PULSE_ROW =
	"flex items-start gap-4 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0";
