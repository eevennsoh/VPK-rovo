import { useCallback, useMemo, useState } from "react";

import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import type {
	PulseContribution,
	PulseLooseWork,
	PulseMember,
	PulseSnapshot,
	PulseTimeline,
	PulseWorkItem,
} from "../types";

/**
 * Pulse state model.
 *
 * Pulse is one continuous article: every insight is on the page and the reader
 * scrolls through them, so there is no "current snapshot" to own here any more.
 * `usePulseReading` owns the reading position and hands the index in; this hook
 * is pure derivation on top of it, and the only state left in Pulse's model is
 * the member filter, which lives in `usePulseMemberFilter` below.
 *
 * Splitting the filter out is also what lets the shell order its hooks: the
 * reading position resets when the filter re-keys the article, so the filter has
 * to be resolved before the reading position, which is resolved before these
 * derivations.
 *
 * Every derivation below is a module-scope pure function so it can be asserted
 * directly in `pulse.test.js` without rendering, and the article reuses the same
 * functions to scope all seven insights rather than growing a second definition
 * of what "scoped" means.
 */

/** Clamp any index (including `NaN`) into `[0, total - 1]`, or 0 when empty. */
export function clampSnapshotIndex(index: number, total: number): number {
	if (total <= 0 || !Number.isFinite(index)) {
		return 0;
	}
	return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

/** The member's contribution in this snapshot, or `null` when they were quiet. */
export function findContribution(
	snapshot: PulseSnapshot | null,
	memberId: string | null,
): PulseContribution | null {
	if (snapshot === null || memberId === null) {
		return null;
	}
	return snapshot.contributions.find((entry) => entry.memberId === memberId) ?? null;
}

/** Resolve snapshot work-item keys against the timeline, keeping snapshot order. */
export function resolveWorkItems(
	allWorkItems: readonly PulseWorkItem[],
	keys: readonly string[],
	scope: ReadonlySet<string> | null,
): readonly PulseWorkItem[] {
	const scopedKeys = scope === null ? keys : keys.filter((key) => scope.has(key));
	return scopedKeys
		.map((key) => allWorkItems.find((workItem) => workItem.key === key))
		.filter((workItem) => workItem !== undefined);
}

/** Resolve snapshot loose-work ids against the timeline, keeping snapshot order. */
export function resolveLooseWork(
	allLooseWork: readonly PulseLooseWork[],
	ids: readonly string[],
	scope: ReadonlySet<string> | null,
): readonly PulseLooseWork[] {
	const scopedIds = scope === null ? ids : ids.filter((id) => scope.has(id));
	return scopedIds
		.map((id) => allLooseWork.find((item) => item.id === id))
		.filter((item) => item !== undefined);
}

/** Artifact ids are snapshot-local, so this only ever filters within one snapshot. */
export function scopeArtifacts(
	artifacts: readonly ArtifactListItem[],
	scope: ReadonlySet<string> | null,
): readonly ArtifactListItem[] {
	if (scope === null) {
		return artifacts;
	}
	return artifacts.filter((artifact) => scope.has(artifact.id));
}

/**
 * Signals and actions are scoped by the work item they hang off. While a member
 * filter is on, anything without a work item the member touched is not theirs
 * to answer for, so it drops out of the scoped view.
 */
export function scopeByWorkItem<T extends { readonly workItemKey?: string }>(
	entries: readonly T[],
	scope: ReadonlySet<string> | null,
): readonly T[] {
	if (scope === null) {
		return entries;
	}
	return entries.filter((entry) => entry.workItemKey !== undefined && scope.has(entry.workItemKey));
}

/**
 * Narrow a whole timeline to one epic's or one sprint's work items.
 *
 * Scope composes *underneath* the member filter rather than beside it: this
 * returns a timeline, so every derivation downstream — the member filter, the
 * outline, the rail — keeps working on the narrowed one without knowing scope
 * exists. Reusing `scopeByWorkItem` here is deliberate; "scoped" must mean the
 * same thing for a sprint as it does for a person.
 *
 * Snapshots are never dropped, only narrowed. An insight whose work all sits
 * outside the scope still happened, and removing it would renumber the ruler
 * under a reader mid-article — a scope filter is not an edit to the week.
 */
export function scopeTimelineToWorkItemKeys(
	timeline: PulseTimeline,
	keys: ReadonlySet<string> | null,
): PulseTimeline {
	if (keys === null) {
		return timeline;
	}
	return {
		...timeline,
		workItems: timeline.workItems.filter((workItem) => keys.has(workItem.key)),
		snapshots: timeline.snapshots.map((snapshot) => ({
			...snapshot,
			workItemKeys: snapshot.workItemKeys.filter((key) => keys.has(key)),
			attention: scopeByWorkItem(snapshot.attention, keys),
			nextActions: scopeByWorkItem(snapshot.nextActions, keys),
			contributions: snapshot.contributions.map((contribution) => ({
				...contribution,
				workItemKeys: contribution.workItemKeys.filter((key) => keys.has(key)),
			})),
		})),
	};
}

/** Snapshot indexes where the member was active. Unfiltered means every index. */
export function computeHighlightedIndexes(
	snapshots: readonly PulseSnapshot[],
	memberId: string | null,
): ReadonlySet<number> {
	const indexes = new Set<number>();
	snapshots.forEach((snapshot, index) => {
		if (memberId === null || snapshot.memberIds.includes(memberId)) {
			indexes.add(index);
		}
	});
	return indexes;
}

/**
 * What one member did across the whole timeline.
 *
 * The per-window numbers answer "what happened here"; a lead scoping the view
 * to one person is asking "what has this person done this week", which no
 * single window can answer. Computed across every snapshot so the rail can
 * swap the window block for the week block while the filter is on.
 */
export interface PulseMemberWeek {
	windowsActive: number;
	totalWindows: number;
	/** Distinct work items the member touched anywhere in the timeline. */
	workItems: number;
	artifacts: number;
	looseWork: number;
}

export function computeMemberWeek(
	snapshots: readonly PulseSnapshot[],
	memberId: string | null,
): PulseMemberWeek | null {
	if (memberId === null) {
		return null;
	}
	const workItemKeys = new Set<string>();
	const looseWorkIds = new Set<string>();
	let windowsActive = 0;
	let artifacts = 0;
	for (const snapshot of snapshots) {
		const contribution = snapshot.contributions.find((entry) => entry.memberId === memberId);
		if (contribution === undefined) {
			continue;
		}
		windowsActive += 1;
		artifacts += contribution.artifactIds.length;
		contribution.workItemKeys.forEach((key) => workItemKeys.add(key));
		contribution.looseWorkIds.forEach((id) => looseWorkIds.add(id));
	}
	return {
		artifacts,
		looseWork: looseWorkIds.size,
		totalWindows: snapshots.length,
		windowsActive,
		workItems: workItemKeys.size,
	};
}

/**
 * The nearest window on either side of `index` where the member was active, so
 * a no-activity view can offer a way out instead of dead-ending.
 */
export function findAdjacentActiveIndexes(
	snapshots: readonly PulseSnapshot[],
	memberId: string | null,
	index: number,
): { previous: number | null; next: number | null } {
	if (memberId === null) {
		return { next: null, previous: null };
	}
	let previous: number | null = null;
	let next: number | null = null;
	snapshots.forEach((snapshot, candidate) => {
		if (!snapshot.memberIds.includes(memberId)) {
			return;
		}
		if (candidate < index) {
			previous = candidate;
			return;
		}
		if (candidate > index && next === null) {
			next = candidate;
		}
	});
	return { next, previous };
}

/** `null` on a scope means "no member filter is on" — pass everything through. */
interface PulseScopes {
	looseWorkIds: ReadonlySet<string> | null;
	workItemKeys: ReadonlySet<string> | null;
}

/**
 * Lets an owning surface drive the member filter.
 *
 * The filter used to live only in the rail, so the hook could own it. It is now
 * also driven by the board header's facepile, which sits outside Pulse
 * entirely — so it accepts control and falls back to its own state when nobody
 * takes it.
 */
export interface PulseMemberFilterOptions {
	selectedMemberId?: string | null;
	onSelectedMemberIdChange?: (memberId: string | null) => void;
}

export interface PulseMemberFilter {
	selectedMemberId: string | null;
	selectMember: (memberId: string | null) => void;
}

export function usePulseMemberFilter({
	onSelectedMemberIdChange,
	selectedMemberId,
}: PulseMemberFilterOptions = {}): PulseMemberFilter {
	const [uncontrolledMemberId, setUncontrolledMemberId] = useState<string | null>(null);
	const isControlled = selectedMemberId !== undefined;

	const selectMember = useCallback((memberId: string | null) => {
		// Always tell the owner, even while uncontrolled: the header facepile
		// mirrors this selection and would otherwise drift out of sync when the
		// filter is cleared from inside Pulse.
		onSelectedMemberIdChange?.(memberId);
		if (!isControlled) {
			setUncontrolledMemberId(memberId);
		}
	}, [isControlled, onSelectedMemberIdChange]);

	return {
		selectMember,
		selectedMemberId: isControlled ? selectedMemberId ?? null : uncontrolledMemberId,
	};
}

/**
 * What the shell needs about the insight the reader is on.
 *
 * The article derives its own per-insight scoping — it has to, because it
 * renders all of them at once — so this is deliberately narrow: the two work
 * columns beside the article, the ruler's muting, and the empty state.
 */
export interface PulseTimelineModel {
	/** The reading position, clamped into the timeline. */
	activeIndex: number;
	activeSnapshot: PulseSnapshot | null;
	total: number;
	members: readonly PulseMember[];
	selectedMember: PulseMember | null;
	isFiltered: boolean;
	/** Snapshot indexes where the selected member was active; the rest mute. */
	highlightedIndexes: ReadonlySet<number>;
	workItems: readonly PulseWorkItem[];
	looseWork: readonly PulseLooseWork[];
}

export interface PulseTimelineOptions {
	/** The insight being read — `usePulseReading().activeSnapshotIndex`. */
	activeIndex: number;
	/** `usePulseMemberFilter().selectedMemberId`; `null` is the team view. */
	selectedMemberId: string | null;
}

export function usePulseTimeline(
	timeline: PulseTimeline,
	{ activeIndex: readingIndex, selectedMemberId }: PulseTimelineOptions,
): PulseTimelineModel {
	const { looseWork: allLooseWork, members, snapshots, workItems: allWorkItems } = timeline;
	const total = snapshots.length;
	const activeIndex = clampSnapshotIndex(readingIndex, total);
	const activeSnapshot = snapshots[activeIndex] ?? null;

	const selectedMember = useMemo(
		() => members.find((member) => member.id === selectedMemberId) ?? null,
		[members, selectedMemberId],
	);
	const isFiltered = selectedMember !== null;
	const contribution = useMemo(
		() => findContribution(activeSnapshot, selectedMember?.id ?? null),
		[activeSnapshot, selectedMember],
	);

	const scopes = useMemo((): PulseScopes => {
		if (!isFiltered) {
			return { looseWorkIds: null, workItemKeys: null };
		}
		return {
			looseWorkIds: new Set(contribution?.looseWorkIds ?? []),
			workItemKeys: new Set(contribution?.workItemKeys ?? []),
		};
	}, [contribution, isFiltered]);

	const workItems = useMemo(
		() => resolveWorkItems(allWorkItems, activeSnapshot?.workItemKeys ?? [], scopes.workItemKeys),
		[activeSnapshot, allWorkItems, scopes.workItemKeys],
	);
	const looseWork = useMemo(
		() => resolveLooseWork(allLooseWork, activeSnapshot?.looseWorkIds ?? [], scopes.looseWorkIds),
		[activeSnapshot, allLooseWork, scopes.looseWorkIds],
	);
	const highlightedIndexes = useMemo(
		() => computeHighlightedIndexes(snapshots, selectedMember?.id ?? null),
		[selectedMember, snapshots],
	);

	return {
		activeIndex,
		activeSnapshot,
		highlightedIndexes,
		isFiltered,
		looseWork,
		members,
		selectedMember,
		total,
		workItems,
	};
}
