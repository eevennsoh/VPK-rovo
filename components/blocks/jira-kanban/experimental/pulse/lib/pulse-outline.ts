import type { PulseSnapshot, PulseTimeline } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * The reading outline — one model behind both the ruler and the article.
 *
 * Pulse reads as a single continuous document: every insight is on the page,
 * one after another, and scrolling moves through them the way it moves through
 * an article. The ruler on the left is that document's outline, so the two can
 * never disagree — the marks are generated from the same entries the page is
 * built from, and every mark is a real scroll anchor.
 *
 * Two ranks of mark:
 *
 * - **Insight** (major). One per snapshot, evenly spaced. Spacing counts
 *   insights rather than elapsed time: a work item can run for a quarter or
 *   close in an afternoon, and an insight is captured whenever there is
 *   something worth saying, so real timestamps cluster four marks into a
 *   morning and leave a weekend of empty rail. Even steps make every insight
 *   the same size target; *when* it happened is carried by the pill and the
 *   mark's label, which is where a date belongs.
 * - **Section** (minor). The parts within an insight that are worth jumping to
 *   — artifacts, what needs attention, the next best actions — spread evenly
 *   through the gap their insight owns. They give the ruler its texture and
 *   make it a table of contents rather than decoration.
 */

export type PulseOutlineKind = "insight" | "section";

export interface PulseOutlineEntry {
	/** Anchor id — set on the rendered element and used to scroll to it. */
	id: string;
	kind: PulseOutlineKind;
	/** Which insight this belongs to; a section carries its parent's index. */
	snapshotIndex: number;
	/** Spoken and shown on hover, e.g. "Kickoff — Needs attention". */
	label: string;
	/** Position on the rail, 0 (top) to 1 (bottom). */
	offset: number;
}

/** Sections in the order the article lays them out. */
const SECTION_ORDER = [
	{ key: "artifacts", label: "Artifacts" },
	{ key: "attention", label: "Needs attention" },
	{ key: "actions", label: "Next best actions" },
] as const;

export type PulseSectionKey = (typeof SECTION_ORDER)[number]["key"];

/** The anchor id for one section of one insight. Stable across renders. */
export function toPulseAnchorId(snapshotId: string, section?: PulseSectionKey): string {
	return section === undefined ? `pulse-${snapshotId}` : `pulse-${snapshotId}-${section}`;
}

/** Which sections a snapshot actually renders — an empty one earns no mark. */
export function toPulseSections(snapshot: PulseSnapshot): readonly PulseSectionKey[] {
	const present: PulseSectionKey[] = [];
	if (snapshot.artifacts.length > 0) {
		present.push("artifacts");
	}
	if (snapshot.attention.length > 0) {
		present.push("attention");
	}
	if (snapshot.nextActions.length > 0) {
		present.push("actions");
	}
	return present;
}

/**
 * The whole outline, in reading order.
 *
 * Every insight owns an equal slice of the rail, including the last one — the
 * step is `1 / count`, not `1 / (count - 1)`. Dividing by the gaps instead of
 * the insights pins the final insight to `offset: 1`, and since its sections
 * can only be clamped to the same place, the bottom of the rail collapses into
 * a stack of marks at one pixel where only the top one is clickable. Giving the
 * last insight a real slice leaves its sections somewhere to go.
 *
 * Sections spread through their insight's slice and never land on the next
 * mark: two sections sit at a third and two thirds of the way across it.
 */
export function buildPulseOutline(timeline: PulseTimeline): PulseOutlineEntry[] {
	const { snapshots } = timeline;
	if (snapshots.length === 0) {
		return [];
	}
	const step = 1 / snapshots.length;
	const entries: PulseOutlineEntry[] = [];

	snapshots.forEach((snapshot, index) => {
		const offset = index * step;
		entries.push({
			id: toPulseAnchorId(snapshot.id),
			kind: "insight",
			label: snapshot.chapterLabel,
			offset,
			snapshotIndex: index,
		});

		const sections = toPulseSections(snapshot);
		sections.forEach((section, sectionIndex) => {
			const share = (sectionIndex + 1) / (sections.length + 1);
			entries.push({
				id: toPulseAnchorId(snapshot.id, section),
				kind: "section",
				label: `${snapshot.chapterLabel} — ${SECTION_ORDER.find((entry) => entry.key === section)?.label ?? section}`,
				offset: offset + step * share,
				snapshotIndex: index,
			});
		});
	});

	return entries;
}

/** Just the insight marks, for anything that navigates snapshot to snapshot. */
export function toPulseInsightEntries(outline: readonly PulseOutlineEntry[]): readonly PulseOutlineEntry[] {
	return outline.filter((entry) => entry.kind === "insight");
}

/**
 * The entry a reading position is inside.
 *
 * Anchors are reported with their distance from the reading line; the active
 * one is the last that has passed it. Before the first has, the first entry is
 * active — a reader at the very top of the document is reading the first
 * insight, not nothing.
 *
 * The default threshold is a pixel rather than zero because a jump parks its
 * anchor *exactly* on the line, and browser scroll rounding then leaves it a
 * hundredth of a pixel short — measured at +0.005px, which was enough to light
 * the mark above the one just clicked. A pixel of tolerance is imperceptible
 * against a ~197px reading line and puts a jump unambiguously on its own entry.
 */
export function toActiveOutlineIndex(
	positions: readonly number[],
	threshold = 1,
): number {
	let active = 0;
	for (let index = 0; index < positions.length; index += 1) {
		if (positions[index] <= threshold) {
			active = index;
		}
	}
	return active;
}
