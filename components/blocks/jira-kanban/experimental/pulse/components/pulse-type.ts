/**
 * Pulse type scale.
 *
 * Section labels and the story eyebrow share the work-item Activity heading
 * treatment — 12px semibold, sentence case, no tracking — so Pulse does not
 * invent a second micro-label rung. Item titles stay on their own 14px rung.
 *
 * - `PULSE_EYEBROW` — the one eyebrow above the display headline.
 * - `PULSE_SECTION_LABEL` — every section heading (`PulseSectionLabel`).
 * - `PULSE_ITEM_TITLE` / `PULSE_ITEM_BODY` — the row rung shared by the scope
 *   brief, stats, and empty notes, so 14px means exactly one thing.
 * - `HEADLINE_STYLE` — the one display rung, shared by an insight headline and
 *   the scope brief that opens the article.
 */

/**
 * 40px → 54px display size, tracked tight the way the reference sets it.
 *
 * A composite `font`-shorthand rung has no Tailwind utility, so it is an
 * inline style object rather than a class. It lives here rather than on
 * `pulse-story.tsx` because two files need it and a component file that also
 * exports constants stops being Fast-Refresh-safe — the same reason the
 * ruler's geometry was split out of the scrubber.
 */
export const HEADLINE_STYLE = {
	fontSize: "clamp(2.5rem, 0.575rem + 2.8vw, 3.375rem)",
	fontWeight: 400,
	letterSpacing: "-0.045em",
	lineHeight: 1.03,
} as const;

export const PULSE_EYEBROW =
	"text-xs leading-4 font-semibold text-text-subtlest";

export const PULSE_SECTION_LABEL =
	"text-xs leading-4 font-semibold text-text-subtlest";

export const PULSE_ITEM_TITLE = "text-sm font-medium leading-5 tracking-[-0.006em] text-text";

export const PULSE_ITEM_BODY = "text-sm leading-5 tracking-[-0.006em] text-text-subtle";

/** Row-level data that is not a label: quiet markers, group names, counters. */
export const PULSE_ROW_META = "text-xs leading-4 text-text-subtlest";

/**
 * Reserved key track for the epic brief, so every child name hangs off the same
 * x instead of being re-derived from each row's own key width.
 */
export const PULSE_ROW_KEY_TRACK =
	"mt-0.5 w-16 shrink-0 text-right text-xs font-medium leading-4 tabular-nums text-text-subtlest";

/** Ruled row rhythm for the epic brief stream. */
export const PULSE_ROW =
	"flex items-start gap-4 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0";
