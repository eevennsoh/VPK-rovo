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
 *   the same size target; *when* it happened stays on the insight eyebrow.
 *   The pill names whichever outline entry is being read.
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
	/** Spoken name, e.g. "Kickoff — Needs attention". */
	label: string;
	/** Visible ruler text: the insight name, or the subsection heading. */
	heading: string;
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

function toSectionHeading(section: PulseSectionKey): string {
	return SECTION_ORDER.find((entry) => entry.key === section)?.label ?? section;
}

/**
 * The short name the ruler paints: "Kickoff" on a parent, "Artifacts" on a child.
 *
 * Insight headings are the chapter name. Section headings are the article's
 * subsection titles — never a clock, and never a name the story does not render.
 */
export function toRulerHeading(entry: PulseOutlineEntry): string {
	if (typeof entry.heading === "string" && entry.heading.trim().length > 0) {
		return entry.heading;
	}
	if (entry.kind === "insight") {
		return entry.label;
	}
	const separator = " — ";
	const index = entry.label.lastIndexOf(separator);
	return index === -1 ? entry.label : entry.label.slice(index + separator.length);
}

/**
 * The parent insight mark for the entry being read.
 *
 * Used when a caller needs the insight that owns a section. Missing parents
 * (an outline that somehow lost its insight) return null rather than a ghost.
 */
export function toActiveInsightEntry(
	entries: readonly PulseOutlineEntry[],
	activeEntry: PulseOutlineEntry | null,
): PulseOutlineEntry | null {
	if (activeEntry === null) {
		return null;
	}
	if (activeEntry.kind === "insight") {
		return activeEntry;
	}
	return entries.find((entry) => (
		entry.kind === "insight" && entry.snapshotIndex === activeEntry.snapshotIndex
	)) ?? null;
}

/** The anchor id for one section of one insight. Stable across renders. */
export function toPulseAnchorId(snapshotId: string, section?: PulseSectionKey): string {
	return section === undefined ? `pulse-${snapshotId}` : `pulse-${snapshotId}-${section}`;
}

export type PulseInsightNavDirection = "previous" | "next";
export type PulseScrollAlignment = "reading-line" | "start";

export interface PulseScrollOptions {
	align?: PulseScrollAlignment;
}

interface PulseScrollOffsetOptions {
	alignment: PulseScrollAlignment;
	anchorTop: number;
	readingLine: number;
	scrollportHeight: number;
	scrollportTop: number;
	startInset?: number;
}

/**
 * The scroll delta that places an anchor at the requested article line.
 *
 * Ruler jumps retain the established reading line. Header chevrons use `start`
 * so each destination nav row lands at the true top of the scroller; the inset
 * is only the scrollport's content padding, never a reserved fade band.
 */
export function toPulseScrollOffset({
	alignment,
	anchorTop,
	readingLine,
	scrollportHeight,
	scrollportTop,
	startInset = 0,
}: Readonly<PulseScrollOffsetOptions>): number {
	switch (alignment) {
		case "reading-line":
			return anchorTop - scrollportTop - scrollportHeight * readingLine;
		case "start":
			return anchorTop - scrollportTop - startInset;
		default: {
			const _exhaustive: never = alignment;
			return _exhaustive;
		}
	}
}

/**
 * The adjacent insight in the article, or `null` at that end.
 *
 * The header chevrons jump by whole insights — not by outline sections, and
 * not by "was this member active" — so a reader can page the narrative without
 * scrolling. Ends return `null` so the control can disable rather than wrap.
 */
export function toAdjacentInsightIndex(
	insightIndex: number,
	insightCount: number,
	direction: PulseInsightNavDirection,
): number | null {
	if (!Number.isFinite(insightIndex) || insightCount <= 0) {
		return null;
	}
	switch (direction) {
		case "previous":
			return insightIndex <= 0 ? null : insightIndex - 1;
		case "next":
			return insightIndex >= insightCount - 1 ? null : insightIndex + 1;
		default: {
			const _exhaustive: never = direction;
			return _exhaustive;
		}
	}
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
			heading: snapshot.chapterLabel,
			label: snapshot.chapterLabel,
			offset,
			snapshotIndex: index,
		});

		const sections = toPulseSections(snapshot);
		sections.forEach((section, sectionIndex) => {
			const heading = toSectionHeading(section);
			const share = (sectionIndex + 1) / (sections.length + 1);
			entries.push({
				id: toPulseAnchorId(snapshot.id, section),
				kind: "section",
				heading,
				label: `${snapshot.chapterLabel} — ${heading}`,
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
