"use client";

import { useCallback, useMemo, type ReactNode, type RefCallback } from "react";

import type { AgentListItem } from "@/components/blocks/agent-list";
import {
	MEASURE,
	PulseStory,
	type PulseStoryJump,
	type PulseStoryViewProps,
} from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-story";
import {
	findAdjacentActiveIndexes,
	findContribution,
	scopeArtifacts,
	scopeByWorkItem,
} from "@/components/blocks/jira-kanban/experimental/pulse/hooks/use-pulse-timeline";
import { resolveAttentionWorkItem } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-attention";
import type {
	PulseOutlineEntry,
	PulseScrollOptions,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";
import type {
	PulseAction,
	PulseMember,
	PulseSnapshot,
	PulseTimeline,
	PulseWorkItem,
} from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { cn } from "@/lib/utils";

/**
 * Pulse stream — the whole timeline as one continuous article.
 *
 * Every insight is on the page, in order, and the reader scrolls through them
 * the way they scroll through a long piece of writing. Nothing mounts or
 * unmounts as the reading position moves, so there is no transition to fake and
 * no gesture to intercept: the ruler follows the reader rather than driving a
 * swap. Each insight is separated by a hairline and a generous band of space so
 * a boundary reads as the end of one page and the start of the next, and the
 * insight being read sits at full strength while its neighbours drop a little
 * quieter — enough to locate yourself, not enough to stop you reading ahead.
 */

/**
 * 64px of air, a hairline, then 64px again. The rule is capped to the reading
 * measure rather than the column so it ends where the prose ends.
 */
const SNAPSHOT_SEPARATOR = "mt-16 border-t border-border pt-16";

/**
 * The read/unread treatment. 0.8 is deliberately shallow: ADS body text on the
 * page surface clears AAA with room to spare at that level, so a reader can
 * still read the insight below the one they are in — this marks position, it
 * does not gate content.
 */
const SNAPSHOT_READING = "opacity-100";
const SNAPSHOT_QUIET = "opacity-80";

/**
 * Enough runway for the last insight to reach the reading line. Without it the
 * bottom of the document is the one mark on the ruler that can never light.
 */
const RUNWAY = "h-[50svh] shrink-0";

/** Everything one insight needs, derived once per snapshot from the timeline. */
// The commitments are omitted alongside the callbacks: they are the reader's,
// owned by the page, and identical for every insight — derivation must not
// produce a per-snapshot copy of them.
type PulseStreamEntry = Omit<
	PulseStoryViewProps,
	| "anchorRef"
	| "insightCount"
	| "insightIndex"
	| "onGoToEntry"
	| "onGoToIndex"
	| "onRequestAction"
	| "onSelectMember"
	| "onViewAttention"
	| "previewEntryId"
	| "requestedActionIds"
>;

/**
 * Why a window came up empty for somebody, in the timeline's own clock. The
 * fixture's labels are one shared wall clock rather than seven local ones, so
 * this describes the window instead of converting it into a local time it
 * cannot honestly claim.
 */
function toQuietNote(snapshot: PulseSnapshot): string {
	const hour = Number.parseInt(snapshot.timeLabel.slice(0, 2), 10);
	const isOvernight = Number.isFinite(hour) ? hour >= 22 || hour < 6 : false;
	return isOvernight
		? `The window ran ${snapshot.rangeLabel} and closed overnight.`
		: `The window ran ${snapshot.rangeLabel}.`;
}

function toJump(snapshots: readonly PulseSnapshot[], index: number | null): PulseStoryJump | null {
	if (index === null) {
		return null;
	}
	const snapshot = snapshots[index];
	if (snapshot === undefined) {
		return null;
	}
	return { index, label: `${snapshot.dateLabel} ${snapshot.timeLabel}` };
}

/**
 * Scope the whole timeline to the filtered member, one insight at a time.
 *
 * The timeline hook scopes the active snapshot; a continuous article needs the
 * same derivation for all of them, so it reuses that hook's pure helpers rather
 * than growing a second definition of what "scoped" means.
 */
function toStreamEntries(timeline: PulseTimeline, member: PulseMember | null): readonly PulseStreamEntry[] {
	const memberId = member?.id ?? null;
	return timeline.snapshots.map((snapshot, index) => {
		const contribution = findContribution(snapshot, memberId);
		const workItemScope = member === null ? null : new Set(contribution?.workItemKeys ?? []);
		const artifactScope = member === null ? null : new Set(contribution?.artifactIds ?? []);
		const adjacent = findAdjacentActiveIndexes(timeline.snapshots, memberId, index);
		return {
			artifacts: scopeArtifacts(snapshot.artifacts, artifactScope),
			attention: scopeByWorkItem(snapshot.attention, workItemScope),
			contribution,
			// Roster order, so the faces do not reshuffle from insight to insight.
			contributors: timeline.members.filter((candidate) => snapshot.memberIds.includes(candidate.id)),
			member,
			nextActions: scopeByWorkItem(snapshot.nextActions, workItemScope),
			nextActive: toJump(timeline.snapshots, adjacent.next),
			previousActive: toJump(timeline.snapshots, adjacent.previous),
			quietNote: toQuietNote(snapshot),
			snapshot,
			unscopedCounts: {
				artifacts: snapshot.artifacts.length,
				attention: snapshot.attention.length,
				nextActions: snapshot.nextActions.length,
			},
		};
	});
}

export interface PulseStreamProps {
	/**
	 * Commitments the reader has made, owned by the page so they survive both
	 * scrolling to another insight and toggling Pulse off and back on.
	 */
	requestedActionIds: ReadonlySet<string>;
	onRequestAction: (action: PulseAction) => void;
	/**
	 * Opens the work item a Needs input row is waiting on. Optional so a
	 * catalog surface can still show Reply / Give input without a destination.
	 */
	onWorkItemClick?: (workItem: PulseWorkItem) => void;
	timeline: PulseTimeline;
	/** Scopes every insight to one member; `null` is the team view. */
	selectedMemberId: string | null;
	onSelectMember: (memberId: string | null) => void;
	/** The insight being read — `usePulseReading().activeSnapshotIndex`. */
	activeSnapshotIndex: number;
	/** `usePulseReading().registerAnchor`, handed down to every anchored part. */
	anchorRef: (id: string) => RefCallback<HTMLElement>;
	/** `usePulseReading().scrollToSnapshot`, for the filtered "way out" jumps. */
	onGoToSnapshot: (snapshotIndex: number, options?: PulseScrollOptions) => void;
	/** `usePulseReading().scrollToEntry`, for the story's subsection TOC. */
	onGoToEntry: (id: string) => void;
	/** Ruler entry currently previewed by pointer or keyboard focus. */
	previewEntry: PulseOutlineEntry | null;
	/**
	 * The scope brief, when the article is narrowed to an epic or a sprint, and
	 * the answers section, once the reader has asked something.
	 *
	 * Both arrive as nodes rather than as scope and answer data, so the stream
	 * stays what it is: the thing that lays insights end to end. It has no
	 * opinion about epics, sprints or questions, and adding a third bracketing
	 * block will not make it grow a third import.
	 */
	scopeBrief?: ReactNode;
	answers?: ReactNode;
}

export function PulseStream({
	timeline,
	selectedMemberId,
	onSelectMember,
	activeSnapshotIndex,
	anchorRef,
	onGoToSnapshot,
	onGoToEntry,
	onRequestAction,
	onWorkItemClick,
	previewEntry,
	requestedActionIds,
	scopeBrief,
	answers,
}: Readonly<PulseStreamProps>) {
	const member = useMemo(
		() => timeline.members.find((candidate) => candidate.id === selectedMemberId) ?? null,
		[selectedMemberId, timeline.members],
	);
	const entries = useMemo(() => toStreamEntries(timeline, member), [member, timeline]);
	const reading = timeline.snapshots[activeSnapshotIndex] ?? null;
	const handleViewAttention = useCallback((item: AgentListItem) => {
		for (const snapshot of timeline.snapshots) {
			const workItem = resolveAttentionWorkItem(
				item.id,
				snapshot.attention,
				timeline.workItems,
			);
			if (workItem === undefined) {
				continue;
			}
			onWorkItemClick?.(workItem);
			return;
		}
	}, [onWorkItemClick, timeline]);

	if (entries.length === 0) {
		return null;
	}

	return (
		<div className={cn("mx-auto flex min-w-0 flex-col", MEASURE)}>
			{/* The brief is the masthead, so it is exempt from the read/unread
			    treatment: dimming the page the reader just asked for, because the
			    reading line has not reached it yet, would be the article arguing
			    with them. */}
			{scopeBrief ? <div className={cn("min-w-0", MEASURE)}>{scopeBrief}</div> : null}

			{entries.map((entry, index) => (
				<div
					className={cn(
						"min-w-0 transition-opacity duration-medium ease-out-practical motion-reduce:transition-none",
						MEASURE,
						index === 0 && scopeBrief === undefined ? null : SNAPSHOT_SEPARATOR,
						index === activeSnapshotIndex || index === previewEntry?.snapshotIndex
							? SNAPSHOT_READING
							: SNAPSHOT_QUIET,
					)}
					data-pulse-insight={index}
					data-reading={index === activeSnapshotIndex}
					key={entry.snapshot.id}
				>
					<PulseStory
						{...entry}
						anchorRef={anchorRef}
						insightCount={entries.length}
						insightIndex={index}
						onRequestAction={onRequestAction}
						onViewAttention={handleViewAttention}
						previewEntryId={previewEntry?.id ?? null}
						requestedActionIds={requestedActionIds}
						onGoToEntry={onGoToEntry}
						onGoToIndex={onGoToSnapshot}
						onSelectMember={onSelectMember}
					/>
				</div>
			))}

			{answers ? <div className={cn("min-w-0", MEASURE, SNAPSHOT_SEPARATOR)}>{answers}</div> : null}

			{/* Scroll position is not a focus change, so the one thing that tells a
			    screen reader the reading position moved is a single polite status
			    for the whole document — one region, not one per insight. */}
			<p aria-live="polite" className="sr-only" role="status">
				{reading === null
					? ""
					: `Insight ${activeSnapshotIndex + 1} of ${entries.length}. ${reading.chapterLabel}. ${reading.title}.`}
			</p>

			<div aria-hidden className={RUNWAY} />
		</div>
	);
}
