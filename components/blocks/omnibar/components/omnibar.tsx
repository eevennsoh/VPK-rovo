"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useScrubberComposer } from "@/components/blocks/scrubber/hooks/use-scrubber-composer";
import type { ScrubberEntry } from "@/components/blocks/scrubber/lib/scrubber-entries";
import { cn } from "@/lib/utils";

import {
	OMNIBAR_MORPH_ENTER,
	OMNIBAR_MORPH_EXIT,
	resolveOmnibarTransition,
} from "../omnibar-motion";
import { useOmnibarState, type OmnibarState } from "../hooks/use-omnibar-state";
import { OmnibarBar } from "./omnibar-bar";
import { OmnibarPanel } from "./omnibar-panel";
import { OmnibarPill } from "./omnibar-pill";
import { OmnibarTimelineRail } from "./omnibar-timeline-rail";

const DEFAULT_PLACEHOLDER = "Describe any changes you want to make...";

// Radii are "fully rounded" at each geometry: half of the 28px pill, half of the 56px bar.
const PILL_RADIUS = 14;
const BAR_RADIUS = 28;

export interface OmnibarProps {
	className?: string;
	/** Seeds the initial geometry. Useful for catalog variants that show one state. */
	defaultState?: OmnibarState;
	/**
	 * Opens the bar straight into Timeline. Only meaningful alongside `timelineEntries` and
	 * `defaultState="expanded"` — any other geometry sends the mode back to idle on mount.
	 */
	defaultTimelineOpen?: boolean;
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
	 * Supplying a timeline is what adds the `⌛ Timeline` toggle. Omit it and the bar has no
	 * toggle at all, which is the shape every existing consumer already renders.
	 */
	timelineEntries?: readonly ScrubberEntry[];
}

/**
 * A persistent bottom-center AI bar with three geometries: a black sparkle pill, an expanded
 * prompt bar, and a right-docked chat panel.
 *
 * Hovering expands the pill; pressing inside the bar pins it open so a draft survives the
 * pointer leaving. The pill and bar are one `layout` element — never two with a shared
 * `layoutId`, which hijacks `transform-origin` and breaks the morph.
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
	onStateChange,
	onSubmit,
	onTimelineActiveIndexChange,
	placeholder = DEFAULT_PLACEHOLDER,
	positioning = "container",
	sidePanel,
	timelineActiveIndex,
	timelineAxis = "x",
	timelineEntries,
}: Readonly<OmnibarProps>) {
	const shouldReduceMotion = useReducedMotion();
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
	} = useOmnibarState({ defaultState, onStateChange: handleStateChange });

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
	const morphTransition = resolveOmnibarTransition(
		isExpanded ? OMNIBAR_MORPH_ENTER : OMNIBAR_MORPH_EXIT,
		shouldReduceMotion,
	);

	const timeline = timelineEntries
		? {
			activeIndex,
			axis: timelineAxis,
			consumeFocusRestore,
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
					// The rail spans the full width so the surface can centre itself without a
					// translate that Motion's `layout` would overwrite.
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
			>
				<AnimatePresence initial={false}>
					{state === "docked" ? null : (
						<motion.div
							animate={{ opacity: 1, borderRadius: isExpanded ? BAR_RADIUS : PILL_RADIUS }}
							className={cn(
								"pointer-events-auto overflow-hidden bg-bg-neutral-bold shadow-overlay",
								// Measured against the rail, not the viewport: under
								// `positioning="container"` the rail is the positioned ancestor, and a
								// `100vw` cap would overflow any container narrower than the window —
								// then get clipped by a host frame like the demo page's.
								isExpanded ? "w-[min(720px,calc(100%-32px))]" : "h-7 w-24",
							)}
							data-omnibar-surface=""
							exit={{ opacity: 0, transition: morphTransition }}
							initial={{ opacity: 0, borderRadius: PILL_RADIUS }}
							key="omnibar-surface"
							layout
							// Only pins once the bar is already open. Firing while collapsed would
							// expand on Tab, unmounting the pill the focus is on and dropping focus
							// to the document — the keyboard user could not get in at all.
							onFocusCapture={isExpanded ? handlePin : undefined}
							onPointerDown={handlePin}
							onPointerEnter={handlePointerEnter}
							onPointerLeave={handlePointerLeave}
							ref={surfaceRef}
							style={{ willChange: "transform, opacity" }}
							transition={morphTransition}
						>
							<AnimatePresence initial={false} mode="popLayout">
								{isExpanded ? (
									<OmnibarBar
										key="bar"
										onOpenPanel={openPanel}
										onSubmit={handleSubmit}
										onValueChange={setDraft}
										placeholder={placeholder}
										shouldReduceMotion={shouldReduceMotion}
										submitDisabled={onSubmit === undefined}
										timeline={timeline}
										value={draft}
									/>
								) : (
									<OmnibarPill
										key="pill"
										label="Ask Rovo"
										onActivate={handlePin}
										shouldReduceMotion={shouldReduceMotion}
									/>
								)}
							</AnimatePresence>
						</motion.div>
					)}
				</AnimatePresence>
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
