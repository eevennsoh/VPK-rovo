/**
 * The rail's entry model, and the one rule that positions marks.
 *
 * Spacing counts entries, not elapsed time. A real timeline clusters four marks
 * into one morning and then leaves a weekend of dead rail, and the dense marks
 * become unhittable while most of the control does nothing. Even steps make
 * every entry the same size target; the label, not the position, carries when
 * something happened.
 *
 * Free of React and of any relative value import, so the contract suite can
 * load it straight under Node's type stripping.
 */

export type ScrubberEntryKind = "major" | "minor";

export interface ScrubberEntry {
	id: string;
	kind: ScrubberEntryKind;
	/** 0–1 along the rail. */
	offset: number;
	/** Spoken name. */
	label: string;
	/** Text the sliding pill shows while this entry is active. */
	heading: string;
	/** Dims the mark without changing its position (filtered-out state). */
	muted?: boolean;
}

/** A minor mark, subdividing the gap its parent major owns. */
export interface ScrubberChild {
	id: string;
	heading: string;
	label: string;
}

/** A major mark, plus the minors that share its slice of the rail. */
export interface ScrubberGroup {
	id: string;
	heading: string;
	label: string;
	muted?: boolean;
	children?: readonly ScrubberChild[];
}

/**
 * The whole rail, in reading order.
 *
 * Every major owns an equal slice, including the last one — the step is
 * `1 / count`, not `1 / (count - 1)`. Dividing by the gaps instead of the
 * majors pins the final major to `offset: 1`, and since its minors can only be
 * clamped to the same place, the end of the rail collapses into a stack of
 * marks on one pixel where only the last-painted one is clickable. Giving the
 * last major a real slice leaves its minors somewhere to go, at the cost of the
 * rail ending slightly short of 1 — which is the right trade.
 *
 * Minors spread through their major's slice and never land on a neighbour:
 * dividing by `length + 1` keeps every share strictly between 0 and 1, so one
 * minor sits halfway across the gap and two sit at a third and two thirds.
 *
 * Entries come back already ascending, each major immediately followed by its
 * own minors, so the flat array needs no sort.
 */
export function buildScrubberEntries(groups: readonly ScrubberGroup[]): ScrubberEntry[] {
	if (groups.length === 0) {
		return [];
	}
	const step = 1 / groups.length;
	const entries: ScrubberEntry[] = [];

	groups.forEach((group, index) => {
		const offset = index * step;
		entries.push({
			id: group.id,
			kind: "major",
			heading: group.heading,
			label: group.label,
			offset,
			muted: group.muted,
		});

		const children = group.children ?? [];
		children.forEach((child, childIndex) => {
			const share = (childIndex + 1) / (children.length + 1);
			entries.push({
				id: child.id,
				kind: "minor",
				heading: child.heading,
				label: child.label,
				offset: offset + step * share,
				// A minor inherits its major's filtered state: hiding the parent
				// while its parts stay bright would read as a contradiction.
				muted: group.muted,
			});
		});
	});

	return entries;
}
