/**
 * The rail's geometry — everything that turns a pointer position into a shape.
 *
 * Deliberately free of React and of any relative value import, so the contract
 * suite can load it straight under Node's type stripping. Every number here is
 * ported from the Pulse ruler
 * (`components/blocks/jira-kanban/experimental/pulse/lib/pulse-marks.ts`), which
 * is the reference behaviour this block generalises. Pulse keeps its own copy
 * because its suite asserts the literal source text of those declarations; the
 * duplication is named debt, not an oversight.
 */

import type { ScrubberEntryKind } from "./scrubber-entries";

export type { ScrubberEntryKind };

export type ScrubberMarkState = "muted" | "current" | "resting";

/**
 * Which treatment a mark draws.
 *
 * `muted` wins over `current` deliberately: the rule length encodes whether the
 * entry survived the current filter, while the pill encodes where you are. If
 * the current-position emphasis were allowed to override the muting, scrubbing
 * onto a filtered-out mark would make that absence the darkest thing on the
 * rail — the control would invert its own signal.
 */
export function toMarkState(isMuted: boolean, isActive: boolean): ScrubberMarkState {
	if (isMuted) {
		return "muted";
	}
	return isActive ? "current" : "resting";
}

/** Rest and peak rule length in px, plus the opacity either end of the swell. */
export interface ScrubberRuleWeight {
	rest: number;
	peak: number;
	restOpacity: number;
	peakOpacity: number;
}

/**
 * How far from the pointer a rule still answers, in px. Sized so roughly five
 * neighbours either side move — enough to read as one connected surface being
 * pushed, rather than a single mark lighting up.
 */
export const MAGNIFY_RADIUS = 76;

/**
 * Rule weights per rank and state.
 *
 * A minor never swells to a major's length, or the two ranks would trade places
 * under the pointer and the rail would stop reading as a hierarchy. The
 * invariant is an *ordering* one and holds at both ends of the swell —
 * `minor.rest < major.rest` and `minor.peak < major.peak` — not a separation
 * one: a swollen minor at 26px does out-reach a resting major at 14px, which is
 * exactly what makes the swell read as the pointer pushing the rail. A muted
 * rule swells far less again and stays quiet even at its peak: magnification is
 * a pointer affordance and must not undo the filter's signal, or sweeping the
 * rail would repaint an absence as presence.
 */
export const RULE_WEIGHT: Record<ScrubberEntryKind, Record<ScrubberMarkState, ScrubberRuleWeight>> = {
	major: {
		current: { rest: 14, peak: 46, restOpacity: 1, peakOpacity: 1 },
		muted: { rest: 6, peak: 18, restOpacity: 0.2, peakOpacity: 0.45 },
		resting: { rest: 14, peak: 46, restOpacity: 0.72, peakOpacity: 1 },
	},
	minor: {
		current: { rest: 8, peak: 26, restOpacity: 0.9, peakOpacity: 1 },
		muted: { rest: 4, peak: 12, restOpacity: 0.14, peakOpacity: 0.32 },
		resting: { rest: 6, peak: 26, restOpacity: 0.28, peakOpacity: 0.7 },
	},
};

/**
 * Dock falloff: 1 under the pointer, 0 at the radius, smooth at both ends.
 *
 * Distance is measured in PIXELS, never in entry index. Minors subdivide their
 * major's gap by however many parts that major happens to have, so index
 * distance and visual distance diverge exactly where the marks bunch up — an
 * index-based falloff would bulge unevenly across the densest majors.
 *
 * The support is compact on purpose: past the radius the answer is exactly 0,
 * so the far half of the rail stays perfectly still while the near half swells.
 * An exponential falloff would leave the whole row breathing faintly, which
 * reads as drift rather than as a response to the pointer.
 */
export function toMagnification(distance: number, radius: number = MAGNIFY_RADIUS): number {
	// The radius is guarded as tightly as the distance: it comes off a live
	// `getBoundingClientRect()` measurement, and `radius <= 0` alone lets `NaN`
	// through (every comparison against NaN is false) and lets `Infinity` answer
	// a full 1 for every mark on the rail. Either result reaches a motion value.
	if (!Number.isFinite(distance) || !Number.isFinite(radius) || radius <= 0) {
		return 0;
	}
	const normalized = Math.min(Math.abs(distance) / radius, 1);
	const eased = 1 - normalized * normalized;
	return eased * eased;
}

/**
 * The entry a pointer at `offset` (0–1 along the rail) is scrubbing to.
 *
 * Every entry is a target, majors and minors alike, so there are no dead zones
 * and no filler to skip past: the nearest mark is simply the nearest mark.
 * Out-of-range offsets clamp to an end rather than returning `null`, so a sweep
 * that runs off the rail has no hole in it. The comparison is strict, so ties
 * keep the incumbent and two marks stacked on one pixel cannot oscillate. An
 * empty rail resolves to `null` and therefore commits nothing.
 */
export function toNearestEntryIndex(entries: readonly { offset: number }[], offset: number): number | null {
	if (!Number.isFinite(offset)) {
		return null;
	}
	let nearest: number | null = null;
	let shortest = Number.POSITIVE_INFINITY;
	for (let index = 0; index < entries.length; index += 1) {
		const distance = Math.abs(entries[index].offset - offset);
		if (distance < shortest) {
			shortest = distance;
			nearest = index;
		}
	}
	return nearest;
}

/**
 * The committed index the rail should actually draw.
 *
 * `activeIndex` is a prop, so a consumer can hand the rail an index that a
 * shortened `entries` array no longer contains — filtering a timeline down does
 * exactly that. Left raw, three things break at once: `entries[index]` is
 * `undefined` so the pill vanishes, no option carries `aria-selected` so the
 * listbox reports nothing selected, and the pointer hook's "has the nearest
 * entry changed?" test can never be false, so a sweep re-commits on every
 * single pointermove. Overflow therefore clamps to the last entry.
 *
 * A negative index is deliberately left alone: it is the "nothing committed
 * yet" sentinel, and clamping it to 0 would fake a selection nobody made.
 */
export function toResolvedIndex(activeIndex: number, entryCount: number): number {
	if (!Number.isFinite(activeIndex)) {
		return -1;
	}
	return activeIndex >= entryCount ? entryCount - 1 : activeIndex;
}

/**
 * Where the pointer parks once it leaves the rail.
 *
 * Outside 0–1 so `pointer < 0` reads as "away", and finite on purpose: an
 * `Infinity` or `NaN` written into a motion value poisons it permanently —
 * every later `Math.abs(offset - pointer)` stays `Infinity` and the rail never
 * recovers for the life of the component.
 */
export const POINTER_AWAY = -1;
