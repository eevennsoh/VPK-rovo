/**
 * Motion signatures shared by more than one floating Rovo button surface.
 *
 * Only hoist a value here when two surfaces are meant to move as one gesture —
 * the button morph and the nudge unfurl deliberately share a single spring so
 * the pill looks like it is being pushed out of the button it is anchored to.
 * Anything used by a single surface stays with that surface.
 */
export const FLOATING_ROVO_BUTTON_MORPH_SPRING = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.28,
} as const;
