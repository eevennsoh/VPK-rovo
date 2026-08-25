"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties, type RefCallback, type UIEvent } from "react";

import { PulseWorkRail } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-rail";
import {
	PulseScrubber,
	PulseScrubberCompact,
} from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-scrubber";
import { PulseStream } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-stream";
import { PULSE_TIMELINE } from "@/components/blocks/jira-kanban/experimental/pulse/data/pulse-timeline";
import { usePulseReading } from "@/components/blocks/jira-kanban/experimental/pulse/hooks/use-pulse-reading";
import {
	usePulseMemberFilter,
	usePulseTimeline,
} from "@/components/blocks/jira-kanban/experimental/pulse/hooks/use-pulse-timeline";
import {
	buildPulseOutline,
	isPulseScrollTowardTop,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";
import type {
	PulseAction,
	PulseLooseWork,
	PulseTimeline,
} from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { ScrollMaskEdgeOverlay } from "@/components/visual/scroll-mask";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import { cn } from "@/lib/utils";

/**
 * Pulse — the experimental Kanban's timeline mode.
 *
 * One continuous article. Every insight is on the page, one after another, read
 * by scrolling the way any long piece of writing is read; the ruler on the left
 * is that document's outline and follows the reading position, and the work
 * rail on the right shows what the reader is currently reading about. Nothing
 * mounts or unmounts as the position moves, so there is no gesture to intercept
 * — the overscroll state machine that used to fake continuity between separately
 * mounted snapshots is gone, along with its accumulator, dwell gate and momentum
 * lock.
 *
 * The shell only composes: the member filter resolves first because the reading
 * position re-keys on it, the reading position resolves next because the model
 * derives from it, and everything else is derivation. Below `lg` the columns
 * stack and the same outline is laid horizontally in the pinned meta bar.
 */

/**
 * Pulse runs full-bleed. The insight column takes whatever the three-column row
 * does not: 144px of ruler (enough for "Next best actions"), then the article,
 * then one work rail — a two-track grid at a fixed 320 and 300 with a 40px
 * gutter between the tracks. Capping the assembly would strand the rail against
 * the right edge on a wide screen, and the article is the one thing here that
 * earns extra width — its own prose measure is capped separately, inside
 * `PulseStory`.
 */
const SHELL_MEASURE = "w-full min-w-0";

/**
 * Below `lg` the epic line heads the ruler band. From `lg` up the board header
 * carries it instead: two stacked all-caps eyebrows read as one blurry block,
 * and the outer one never changes.
 */
const PROJECT_LABEL = "min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-text-subtlest";

/** Matches the reference's ~5% fade band on this column's ~630px viewport. */
const PULSE_FADE_SIZE = "3rem";

export interface ExperimentalPulseProps {
	/**
	 * Commitments the reader has made — actions requested, loose work captured.
	 * Owned by the page rather than in here, so toggling Pulse off and back on
	 * cannot silently discard them along with this subtree.
	 */
	capturedLooseWorkIds: ReadonlySet<string>;
	onCaptureLooseWork: (item: PulseLooseWork) => void;
	requestedActionIds: ReadonlySet<string>;
	onRequestAction: (action: PulseAction) => void;
	timeline?: PulseTimeline;
	/** Controlled member filter, so the board header's facepile can drive it. */
	selectedMemberId?: string | null;
	onSelectedMemberIdChange?: (memberId: string | null) => void;
}

export function ExperimentalPulse({
	capturedLooseWorkIds,
	onCaptureLooseWork,
	onRequestAction,
	requestedActionIds,
	timeline = PULSE_TIMELINE,
	selectedMemberId,
	onSelectedMemberIdChange,
}: Readonly<ExperimentalPulseProps>) {
	const filter = usePulseMemberFilter({ onSelectedMemberIdChange, selectedMemberId });
	// One outline behind both the article and the ruler, so the marks and the
	// anchors can never disagree: every mark is an element on the page.
	const outline = useMemo(() => buildPulseOutline(timeline), [timeline]);
	const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null);
	const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
	const previewEntryId = focusedEntryId ?? hoveredEntryId;
	const previewEntry = useMemo(
		() => outline.find((entry) => entry.id === previewEntryId) ?? null,
		[outline, previewEntryId],
	);
	const reading = usePulseReading({ outline, resetKey: filter.selectedMemberId });
	const pulse = usePulseTimeline(timeline, {
		activeIndex: reading.activeSnapshotIndex,
		selectedMemberId: filter.selectedMemberId,
	});

	// Bottom fade stays a CSS mask. The top fade is a pointer-events-none
	// overlay that only appears while the reader moves back toward the top:
	// keeping it mounted at opacity zero lets it transition without veiling a
	// header after the article is positioned by a chevron or ruler jump.
	const overflow = useHasVerticalOverflow<HTMLDivElement>();
	const { ref: overflowRef, showBottomScrollMask, showTopScrollMask } = overflow;
	const { scrollRef, scrollToEntry, scrollToSnapshot } = reading;
	const [isScrollingTowardTop, setIsScrollingTowardTop] = useState(false);
	const previousScrollTopRef = useRef(0);
	const scrollportRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
		previousScrollTopRef.current = node?.scrollTop ?? 0;
		scrollRef(node);
		overflowRef(node);
	}, [overflowRef, scrollRef]);
	const handleArticleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
		const nextScrollTop = event.currentTarget.scrollTop;
		setIsScrollingTowardTop(
			isPulseScrollTowardTop(previousScrollTopRef.current, nextScrollTop),
		);
		previousScrollTopRef.current = nextScrollTop;
	}, []);
	const handleArticleScrollEnd = useCallback(() => {
		setIsScrollingTowardTop(false);
	}, []);
	// No settle nudge here: the rounding that made a jump light the mark above it
	// is absorbed by `toActiveOutlineIndex`'s one-pixel threshold, where it
	// belongs — the shell should not be correcting the outline's arithmetic.
	const handleSelectEntry = scrollToEntry;
	const handleGoToSnapshot = scrollToSnapshot;

	const scrollportStyle = useMemo((): CSSProperties => ({
		...buildScrollMaskStyle({
			fadeBottom: showBottomScrollMask,
			fadeSize: PULSE_FADE_SIZE,
			fadeTop: false,
		}),
		// Jumping from the ruler writes the scroll position directly, and
		// hover-scrubbing writes it every pointer move; an inherited smooth
		// behaviour would lag a frame behind the cursor and animate motion under
		// reduced motion that nobody asked for.
		scrollBehavior: "auto",
	}), [showBottomScrollMask]);

	if (pulse.activeSnapshot === null) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center bg-surface px-6 py-16">
				<p className="text-sm text-text-subtle">This timeline has no snapshots yet.</p>
			</div>
		);
	}

	return (
		// The fold contract is what makes `lg:h-full` and `overflow-y-auto` below
		// mean anything: without it the whole page scrolls and the ruler — the
		// primary navigation — scrolls away with it.
		//
		// Height comes from the container, not from a `100dvh` minus a guessed
		// chrome height. That guess was always a little wrong, which left the
		// document a few pixels taller than the viewport, and those few pixels
		// were enough for the page to steal wheel events from the article.
		<div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col bg-surface lg:min-h-[40rem]">
			<div className="min-w-0 shrink-0 border-b border-border px-6 lg:hidden">
				<div className={SHELL_MEASURE}>
					<p className={cn(PROJECT_LABEL, "py-2")}>{timeline.projectLabel}</p>
					<div className="-mx-1 min-w-0 px-1 pb-3">
						<PulseScrubberCompact
							activeEntryIndex={reading.activeEntryIndex}
							entries={outline}
							filteredMemberName={pulse.selectedMember?.name ?? null}
							highlightedIndexes={pulse.highlightedIndexes}
							isFiltered={pulse.isFiltered}
							onFocusedEntryChange={setFocusedEntryId}
							onHoveredEntryChange={setHoveredEntryId}
							onSelectEntry={handleSelectEntry}
							snapshots={timeline.snapshots}
						/>
					</div>
				</div>
			</div>

			<div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-10 lg:overflow-hidden lg:py-12">
				<div className={cn(SHELL_MEASURE, "flex flex-col gap-10 lg:h-full lg:flex-row lg:gap-0")}>
					{/* 12px of lead-in drops the first mark onto the optical centre of
					    the 24px eyebrow row, so the ruler starts on the article's first
					    line rather than below it, and the rail runs to the fold. */}
					<div className="hidden shrink-0 lg:flex lg:h-full lg:flex-col lg:pt-3 lg:pb-6">
						<PulseScrubber
							activeEntryIndex={reading.activeEntryIndex}
							entries={outline}
							filteredMemberName={pulse.selectedMember?.name ?? null}
							highlightedIndexes={pulse.highlightedIndexes}
							isFiltered={pulse.isFiltered}
							onFocusedEntryChange={setFocusedEntryId}
							onHoveredEntryChange={setHoveredEntryId}
							onSelectEntry={handleSelectEntry}
							snapshots={timeline.snapshots}
						/>
					</div>

					{/* The article, and the reading scrollport in the Pulse fold. It
					    scrolls at every width — below `lg` inside a bounded reading pane
					    — because the ruler's marks scroll *this* element, and a ruler
					    whose marks do nothing is worse than no ruler. `tabIndex` is what
					    makes it keyboard-scrollable at all in Chrome and Safari. The work
					    rail beside it is its own scroller. */}
					<div className="relative -m-1 max-h-[70svh] min-h-0 min-w-0 flex-1 lg:mr-10 lg:h-full lg:max-h-none">
						<div
							aria-label={`${timeline.projectLabel} insights`}
							className="h-full overflow-y-auto p-1 lg:overscroll-y-contain lg:pr-10 lg:pb-12"
							data-pulse-article=""
							onScroll={handleArticleScroll}
							onScrollEnd={handleArticleScrollEnd}
							ref={scrollportRef}
							role="region"
							style={scrollportStyle}
							tabIndex={0}
						>
							<PulseStream
								activeSnapshotIndex={pulse.activeIndex}
								anchorRef={reading.registerAnchor}
								onGoToSnapshot={handleGoToSnapshot}
								onRequestAction={onRequestAction}
								onSelectMember={filter.selectMember}
								previewEntry={previewEntry}
								requestedActionIds={requestedActionIds}
								selectedMemberId={filter.selectedMemberId}
								timeline={timeline}
							/>
						</div>
						<ScrollMaskEdgeOverlay
							className={cn(
								"opacity-0 transition-opacity motion-reduce:transition-none",
								showTopScrollMask && isScrollingTowardTop
									? "visible opacity-100 duration-normal ease-out-practical"
									: "invisible duration-fast ease-in",
							)}
							data-pulse-article-top-fade=""
							edge="top"
							fadeSize={PULSE_FADE_SIZE}
						/>
					</div>

					<PulseWorkRail
						capturedIds={capturedLooseWorkIds}
						looseWork={pulse.looseWork}
						members={pulse.members}
						onCapture={onCaptureLooseWork}
						scopedToFirstName={pulse.selectedMember?.name.split(" ")[0] ?? null}
						workItems={pulse.workItems}
					/>
				</div>
			</div>
		</div>
	);
}
