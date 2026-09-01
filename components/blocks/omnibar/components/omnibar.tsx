"use client";

import type { ReactNode } from "react";
import { useCallback, useRef } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";

import { useScrubberComposer } from "@/components/blocks/scrubber/hooks/use-scrubber-composer";
import type { ScrubberEntry } from "@/components/blocks/scrubber/lib/scrubber-entries";
import { cn } from "@/lib/utils";

import { useOmnibarState, type OmnibarState } from "../hooks/use-omnibar-state";
import { OmnibarBar, type OmnibarTone } from "./omnibar-bar";
import { OmnibarPanel } from "./omnibar-panel";
import { OmnibarPill } from "./omnibar-pill";
import { OmnibarTimelineRail } from "./omnibar-timeline-rail";

export type { OmnibarTone };

const DEFAULT_PLACEHOLDER = "Describe any changes you want to make...";

/**
 * The stack that holds both geometries.
 *
 * `grid` with both surfaces in cell 1/1 is what lets them overlap during the cross-fade
 * without either one displacing the other, and it keeps the box sized to whichever surface
 * is currently the larger — so the collapsed hit area is the pill's 96px, not the bar's.
 * `items-end` bottom-aligns the two the way the bottom-anchored rail implies;
 * `justify-items-center` keeps the pill on the bar's centre line while they trade places.
 *
 * `minmax(0,auto)` rather than a plain `auto` track: the bar's width is definite, so an auto
 * track takes 720px as its *minimum* and overflows to the right of a narrower container —
 * `max-width` on this element alone clamps the box but not the track inside it. A zero min
 * lets the track shrink, and the bar's own `max-w-full` then follows it down.
 */
const OMNIBAR_STACK = cn(
	"pointer-events-auto grid grid-cols-[minmax(0,auto)]",
	"w-fit max-w-[calc(100%-32px)] items-end justify-items-center",
);

export interface OmnibarProps {
	className?: string;
	/** Seeds the initial geometry. Useful for catalog variants that show one state. */
	defaultState?: OmnibarState;
	/**
	 * Opens the bar straight into Timeline. Only meaningful alongside `timelineEntries` and
	 * `defaultState="expanded"` — any other geometry sends the mode back to idle on mount.
	 */
	defaultTimelineOpen?: boolean;
	/**
	 * Host-owned panel. When set, the side-panel control calls this and collapses the bar
	 * instead of docking the block's own ChatPanel — use it to open a page-level sidebar.
	 */
	onOpenPanel?: () => void;
	onStateChange?: (state: OmnibarState) => void;
	onSubmit?: (prompt: string) => void;
	/** Fires whenever scrubbing commits a new entry, whether or not the index is controlled. */
	onTimelineActiveIndexChange?: (index: number) => void;
	placeholder?: string;
	/**
	 * `container` (default) anchors to the nearest positioned ancestor so catalog previews
	 * stay inside their frame; `viewport` pins to the window for real prototypes.
	 */
	positioning?: "container" | "viewport";
	/**
	 * Body of the docked state. Defaults to the self-contained `ChatPanel` block. Pass a real
	 * surface (for example the Rovo sidebar chat) to swap it without this block taking on that
	 * surface's providers.
	 *
	 * Supply a function to receive `onClose`: a plain node has no way to send the Omnibar back
	 * to `collapsed`, so a custom panel would otherwise be a one-way door.
	 */
	sidePanel?: ReactNode | ((controls: Readonly<{ onClose: () => void }>) => ReactNode);
	/** Committed rail index. Supply it to control the rail; omit to let the block own it. */
	timelineActiveIndex?: number;
	/**
	 * Which geometry the timeline takes.
	 *
	 * `x` (default) swaps the bar's editor cell for a horizontal rail. `y` leaves the bar
	 * alone and docks a full-height rail to the right edge, so a draft and the timeline are
	 * usable at the same time.
	 */
	timelineAxis?: "x" | "y";
	/**
	 * Supplying a timeline is what adds the Timeline context pill above the composer.
	 * Omit it and the bar has no pill at all, which is the shape every existing
	 * consumer already renders.
	 */
	timelineEntries?: readonly ScrubberEntry[];
	/**
	 * `default` gives the expanded bar the standard light `PromptInput variant="floating"`
	 * chrome — the same white composer every other surface in the repo renders. `inverse`
	 * re-skins it onto a black surface instead.
	 */
	tone?: OmnibarTone;
}

/**
 * A persistent bottom-center AI bar with three geometries: a black sparkle pill, an expanded
 * light prompt bar, and a right-docked chat panel.
 *
 * Hovering expands the pill; pressing inside the bar pins it open so a draft survives the
 * pointer leaving. The pill and the bar are two independent surfaces that cross-fade through
 * each other on a shared z-axis rather than one box whose width morphs — see
 * `omnibar-motion.ts`. Each therefore paints its own chrome and owns its own width, and
 * nothing here animates layout, so placeholder and button labels never get scaled by a
 * parent's size projection.
 *
 * With `timelineEntries`, the bar also gains a scrubbable notch rail. The draft deliberately
 * lives in `useScrubberComposer` rather than in a local `useState` here: the `x` axis unmounts
 * the tiptap editor, and only a plain string held above the swap survives it. That is the same
 * hook the standalone `ScrubberComposer` uses, so the two surfaces cannot drift.
 */
export function Omnibar({
	className,
	defaultState,
	defaultTimelineOpen = false,
	onOpenPanel,
	onStateChange,
	onSubmit,
	onTimelineActiveIndexChange,
	placeholder = DEFAULT_PLACEHOLDER,
	positioning = "container",
	sidePanel,
	timelineActiveIndex,
	timelineAxis = "x",
	timelineEntries,
	tone = "default",
}: Readonly<OmnibarProps>) {
	const shouldReduceMotion = useReducedMotion();
	const pillFocusRequestRef = useRef(false);
	const {
		activeIndex,
		consumeFocusRestore,
		draft,
		isTimeline,
		selectIndex,
		setDraft,
		setMode,
		toggleMode,
	} = useScrubberComposer({
		activeIndex: timelineActiveIndex,
		defaultMode: defaultTimelineOpen && timelineEntries !== undefined ? "timeline" : "idle",
		onActiveIndexChange: onTimelineActiveIndexChange,
	});
	const consumeEditorFocusRequest = useCallback(() => {
		const shouldRestoreTimelineFocus = consumeFocusRestore();
		const shouldRestorePillFocus = pillFocusRequestRef.current;
		pillFocusRequestRef.current = false;
		return shouldRestoreTimelineFocus || shouldRestorePillFocus;
	}, [consumeFocusRestore]);

	/**
	 * Any geometry other than the expanded bar takes the toggle away with it, so the mode has
	 * to come back to idle or the bar would reopen mid-scrub with no way to have asked for it.
	 *
	 * `consumeFocusRestore()` immediately after is not a no-op: `setMode("idle")` arms the
	 * editor's one-shot focus restore, which is right when the user pressed the toggle and
	 * wrong when the bar simply collapsed — the next hover would then steal focus into the
	 * editor. Reading the flag here disarms it.
	 */
	const handleStateChange = useCallback(
		(next: OmnibarState) => {
			if (next !== "expanded") {
				setMode("idle");
				consumeFocusRestore();
			}
			onStateChange?.(next);
		},
		[consumeFocusRestore, onStateChange, setMode],
	);

	const {
		closePanel,
		handlePin,
		handlePointerEnter,
		handlePointerLeave,
		openPanel,
		pinned,
		state,
		surfaceRef,
	} = useOmnibarState({
		defaultState,
		onOpenPanel,
		onStateChange: handleStateChange,
	});
	const handlePillActivate = useCallback((shouldFocusEditor: boolean) => {
		pillFocusRequestRef.current = shouldFocusEditor;
		handlePin();
	}, [handlePin]);

	const handleSubmit = useCallback(() => {
		const prompt = draft.trim();
		// Without a consumer there is nowhere for the draft to go, so clearing it would
		// destroy the only copy. The submit control is disabled in that case, but Enter
		// still reaches `requestSubmit()`, so the guard has to live here too.
		if (!prompt || onSubmit === undefined) {
			return;
		}
		onSubmit(prompt);
		setDraft("");
	}, [draft, onSubmit, setDraft]);

	const handleTimelineSelect = useCallback(
		(id: string) => {
			const index = timelineEntries?.findIndex((entry) => entry.id === id) ?? -1;
			if (index >= 0) {
				selectIndex(index);
			}
		},
		[selectIndex, timelineEntries],
	);

	const exitTimeline = useCallback(() => setMode("idle"), [setMode]);

	const isExpanded = state === "expanded";

	const timeline = timelineEntries
		? {
			activeIndex,
			axis: timelineAxis,
			entries: timelineEntries,
			isTimeline,
			onExit: exitTimeline,
			onSelect: handleTimelineSelect,
			onToggle: toggleMode,
		}
		: undefined;
	const showEdgeRail = isExpanded && isTimeline && timelineAxis === "y" && timelineEntries !== undefined;

	const resolvedPanel = (
		<OmnibarPanel
			key="omnibar-panel"
			onClose={closePanel}
			positioning={positioning}
			shouldReduceMotion={shouldReduceMotion}
		>
			{typeof sidePanel === "function" ? sidePanel({ onClose: closePanel }) : sidePanel}
		</OmnibarPanel>
	);

	return (
		<>
			<div
				className={cn(
					"z-[510] flex justify-center",
					// The rail spans the full width and centres the stack, so neither surface
					// needs a translate of its own — scale is the only transform in play.
					"pointer-events-none inset-x-0 bottom-5",
					positioning === "container" ? "absolute" : "fixed",
					// An open edge rail owns the right gutter. Padding rather than a narrower
					// surface: the rail is what centres the bar, so insetting it slides the bar
					// clear of the card instead of leaving it to pass behind one corner. The
					// value is the card's own width plus its edge inset — see `RAIL_CARD`.
					showEdgeRail ? "pe-[200px]" : null,
					className,
				)}
				data-pinned={pinned || undefined}
				data-slot="omnibar"
				data-state={state}
				data-timeline={isTimeline || undefined}
				data-tone={tone}
			>
				<div
					className={OMNIBAR_STACK}
					data-omnibar-surface=""
					// Only pins once the bar is already open. Firing while collapsed would
					// expand on Tab, unmounting the pill the focus is on and dropping focus
					// to the document — the keyboard user could not get in at all.
					onFocusCapture={isExpanded ? handlePin : undefined}
					onPointerDown={handlePin}
					onPointerEnter={handlePointerEnter}
					onPointerLeave={handlePointerLeave}
					ref={surfaceRef}
				>
					<AnimatePresence initial={false}>
						{state === "docked" ? null : isExpanded ? (
							<OmnibarBar
								consumeFocusRestore={consumeEditorFocusRequest}
								key="bar"
								onOpenPanel={openPanel}
								onSubmit={handleSubmit}
								onValueChange={setDraft}
								placeholder={placeholder}
								shouldReduceMotion={shouldReduceMotion}
								submitDisabled={onSubmit === undefined}
								timeline={timeline}
								tone={tone}
								value={draft}
							/>
						) : (
							<OmnibarPill
								key="pill"
								label="Ask Rovo"
								onActivate={handlePillActivate}
								shouldReduceMotion={shouldReduceMotion}
							/>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Siblings of the rail, not children: the rail is a bottom-anchored strip with
			    pointer events disabled, so a nested panel or edge rail would be mispositioned
			    and inert. */}
			<AnimatePresence initial={false}>
				{showEdgeRail && timelineEntries ? (
					<OmnibarTimelineRail
						activeIndex={activeIndex}
						entries={timelineEntries}
						key="omnibar-timeline-rail"
						onSelect={handleTimelineSelect}
						positioning={positioning}
						shouldReduceMotion={shouldReduceMotion}
					/>
				) : null}
			</AnimatePresence>

			<AnimatePresence initial={false}>
				{state === "docked" ? resolvedPanel : null}
			</AnimatePresence>
		</>
	);
}
