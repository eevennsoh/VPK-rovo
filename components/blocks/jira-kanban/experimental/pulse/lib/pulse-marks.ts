import {
	toRulerHeading,
	type PulseOutlineEntry,
	type PulseOutlineKind,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";
import type { PulseSnapshot } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * The ruler's pure geometry, weights and labelling.
 *
 * Split out of `pulse-scrubber.tsx` because a component file that also exports
 * helpers defeats Fast Refresh: React can no longer preserve component state
 * across an edit, so every keystroke in the scrubber full-reloads the page.
 * These are also the functions the suite executes, so they belong somewhere a
 * test can import without pulling a React tree behind it.
 */

export function toWeekdayLabel(dateLabel: string): string {
	return dateLabel.split(" ")[0] ?? dateLabel;
}

/**
 * What a mark may write on hover.
 *
 * Child ticks stay unlabeled — the sliding pill is the only painted name.
 * Inactive insight marks may reveal their chapter on hover so the rail still
 * reads as a TOC. The active mark stays quiet because the pill already says it.
 */
export function toMarkHint(
	entry: PulseOutlineEntry,
	activeEntryId: string | null,
): string | null {
	if (entry.kind === "section") {
		return null;
	}
	if (entry.kind === "insight") {
		if (entry.id === activeEntryId) {
			return null;
		}
		return toRulerHeading(entry);
	}
	const _exhaustive: never = entry.kind;
	return _exhaustive;
}

/**
 * Whether an article block should recede while a ruler mark is previewed.
 *
 * The insight intro uses its insight anchor id and each child section uses its
 * own anchor id, so one equality check covers both ranks. With no preview the
 * scroll-linked reading treatment remains the only opacity owner.
 */
export function isPulseSectionDimmed(
	previewEntryId: string | null,
	sectionId: string,
): boolean {
	return previewEntryId !== null && previewEntryId !== sectionId;
}

export type PulseMarkState = "muted" | "current" | "resting";

/**
 * Which treatment a mark draws.
 *
 * `muted` wins over `current` deliberately: the rule encodes whether the
 * filtered member was moving, the pill encodes where the reader is. If the
 * current-position emphasis were allowed to override the muting, reading into a
 * window the member sat out would make that absence the darkest mark on the
 * ruler — the ruler would invert its own signal.
 */
export function toMarkState(isMuted: boolean, isActive: boolean): PulseMarkState {
	if (isMuted) {
		return "muted";
	}
	return isActive ? "current" : "resting";
}

/**
 * A mark's accessible name.
 *
 * The rank is spoken, because the two ranks mean different things and the
 * difference is otherwise carried by rule length alone. An insight also gets its
 * timestamp; a section's label already names its parent insight, so it does not
 * repeat one. A muted mark means the filtered member was absent from that
 * window, which is the whole point of the muting and is otherwise visual-only.
 */
export function toMarkLabel(
	entry: PulseOutlineEntry,
	snapshot: PulseSnapshot | undefined,
	isMuted: boolean,
	memberName?: string | null,
): string {
	const stamp = snapshot === undefined ? "" : ` — ${snapshot.dateLabel}, ${snapshot.timeLabel}`;
	const base = entry.kind === "insight" ? `Insight: ${entry.label}${stamp}` : `Section: ${entry.label}`;
	if (!isMuted) {
		return base;
	}
	return `${base} — no activity from ${memberName ?? "the selected member"}`;
}

/** Rest and peak rule length in px, plus the opacity either end of the swell. */
export interface PulseRuleWeight {
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
 * A section never swells to an insight's length, or the two ranks would trade
 * places under the pointer and the outline would stop reading as a hierarchy. A
 * muted rule swells far less again and stays quiet even at the peak:
 * magnification is a pointer affordance and must not undo the filter's signal,
 * or sweeping the ruler would repaint a member's absence as presence.
 */
export const RULE_WEIGHT: Record<PulseOutlineKind, Record<PulseMarkState, PulseRuleWeight>> = {
	insight: {
		current: { rest: 14, peak: 46, restOpacity: 1, peakOpacity: 1 },
		muted: { rest: 6, peak: 18, restOpacity: 0.2, peakOpacity: 0.45 },
		resting: { rest: 14, peak: 46, restOpacity: 0.72, peakOpacity: 1 },
	},
	section: {
		current: { rest: 8, peak: 26, restOpacity: 0.9, peakOpacity: 1 },
		muted: { rest: 4, peak: 12, restOpacity: 0.14, peakOpacity: 0.32 },
		resting: { rest: 6, peak: 26, restOpacity: 0.28, peakOpacity: 0.7 },
	},
};

/**
 * Dock falloff: 1 under the pointer, 0 at the radius, smooth at both ends.
 *
 * Distance is measured in PIXELS, never in entry index. Sections subdivide their
 * insight's gap by however many parts that insight happens to have, so index
 * distance and visual distance diverge exactly where the marks bunch up — an
 * index-based falloff would bulge unevenly across the densest insights.
 */
export function toMagnification(distance: number, radius: number = MAGNIFY_RADIUS): number {
	if (!Number.isFinite(distance) || radius <= 0) {
		return 0;
	}
	const normalized = Math.min(Math.abs(distance) / radius, 1);
	const eased = 1 - normalized * normalized;
	return eased * eased;
}

/**
 * The outline entry a pointer at `offset` (0–1 along the rail) is scrubbing to.
 *
 * Every entry is a target now, majors and minors alike, so there are no dead
 * zones and no filler to skip past: the nearest mark is simply the nearest mark.
 */
export function toNearestEntryIndex(entries: readonly PulseOutlineEntry[], offset: number): number | null {
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

/** Parked well outside the rail, and finite: see `usePointerScrub`. */
export const POINTER_AWAY = -1;
