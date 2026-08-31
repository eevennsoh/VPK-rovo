"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
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
import { OmnibarBar, OmnibarContextPill, type OmnibarTone } from "./omnibar-bar";
import { OmnibarPanel } from "./omnibar-panel";
import { OmnibarPill } from "./omnibar-pill";
import { OmnibarTimelineRail } from "./omnibar-timeline-rail";

export type { OmnibarTone };

const DEFAULT_PLACEHOLDER = "Describe any changes you want to make...";

// Radii are "fully rounded" at each geometry: half of the 28px pill, half of the 56px bar.
// Compact tone matches `PromptInput variant="floating"` (`rounded-xl` = 12px).
// Width/height are Motion-animated (not `layout` scale) so type stays native size.
const PILL_RADIUS = 14;
const PILL_WIDTH = 96; // w-24
const PILL_HEIGHT = 28; // h-7
const BAR_RADIUS = 28;
const COMPACT_RADIUS = 12;
const EXPANDED_WIDTH = "min(720px, calc(100% - 32px))";

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
	 * `inverse` (default) paints the expanded bar onto the black morphing surface.
	 * `default` leaves the existing compact `FloatingComposer` chrome in place.
	 */
	tone?: OmnibarTone;
}

/**
 * A persistent bottom-center AI bar with three geometries: a black sparkle pill, an expanded
 * prompt bar, and a right-docked chat panel.
 *
 * Hovering expands the pill; pressing inside the bar pins it open so a draft survives the
 * pointer leaving. The pill and composer share one surface whose width and height
 * animate — never Motion `layout` scale, which would enlarge placeholder and button
 * labels during the morph. Shared `layoutId` is also avoided: it hijacks
 * `transform-origin` and breaks the morph. The Timeline chip is *not* inside that
 * box: compact tone hoists it and staggers it so mouse-out cannot scale the stack
 * as one shape.
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
	tone = "inverse",
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
	const hoistContextPill = tone === "default" && timelineEntries !== undefined;
	const [holdComposer, setHoldComposer] = useState(false);

	const handleStateChange = useCallback(
		(next: OmnibarState) => {
			if (next === "collapsed" && hoistContextPill) {
				// Keep the composer at expanded geometry until the Timeline chip
				// finishes leaving. Collapsing both in one `layout` tick is what
				// scaled the stack as one box on mouse-out.
				setHoldComposer(true);
			} else if (next !== "collapsed") {
				setHoldComposer(false);
			}
			if (next !== "expanded") {
				setMode("idle");
				consumeFocusRestore();
			}
			onStateChange?.(next);
		},
		[consumeFocusRestore, hoistContextPill, onStateChange, setMode],
	);

	const handleContextExitComplete = useCallback(() => {
		setHoldComposer(false);
	}, []);

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
	const isDefaultTone = tone === "default";
	const composerExpanded = isExpanded || holdComposer;
	const isCompactExpanded = composerExpanded && isDefaultTone;
	const morphTransition = resolveOmnibarTransition(
		composerExpanded ? OMNIBAR_MORPH_ENTER : OMNIBAR_MORPH_EXIT,
		shouldReduceMotion,
	);
	const surfaceWidth = composerExpanded ? EXPANDED_WIDTH : PILL_WIDTH;
	const surfaceHeight = composerExpanded ? "auto" : PILL_HEIGHT;
	const surfaceRadius = isCompactExpanded
		? COMPACT_RADIUS
		: composerExpanded
			? BAR_RADIUS
			: PILL_RADIUS;

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
				data-tone={tone}
			>
				<AnimatePresence initial={false}>
					{state === "docked" ? null : (
						<motion.div
							animate={{ opacity: 1, width: surfaceWidth }}
							className={cn(
								"pointer-events-auto relative",
								// Own the width so the inner surface does not circularly
								// shrink to the composer's min-content inside this
								// `justify-center` rail. Motion animates the same value
								// so the box grows from center without `layout` scale.
								composerExpanded ? "w-[min(720px,calc(100%-32px))]" : "w-24",
							)}
							data-omnibar-surface=""
							exit={{ opacity: 0, transition: morphTransition }}
							initial={{ opacity: 0, width: surfaceWidth }}
							key="omnibar-hover"
							onPointerDown={handlePin}
							onPointerEnter={handlePointerEnter}
							onPointerLeave={handlePointerLeave}
							ref={surfaceRef}
							style={{ willChange: "opacity" }}
							transition={morphTransition}
						>
							{hoistContextPill && (isExpanded || holdComposer) ? (
								<div className="absolute inset-x-0 bottom-full z-10 flex justify-start pb-2">
									<AnimatePresence
										initial={false}
										onExitComplete={handleContextExitComplete}
									>
										{isExpanded && timeline ? (
											<OmnibarContextPill
												isInverse={false}
												isPressed={timeline.isTimeline}
												key="context-pill"
												onToggle={timeline.onToggle}
												shouldReduceMotion={shouldReduceMotion}
											/>
										) : null}
									</AnimatePresence>
								</div>
							) : null}
							<motion.div
								animate={{
									opacity: 1,
									borderRadius: surfaceRadius,
									height: surfaceHeight,
								}}
								className={cn(
									// Compact tone keeps this surface transparent in both
									// geometries: the pill paints Rovo-button chrome itself,
									// and FloatingComposer owns the light expanded chrome.
									// Dark fill here is what left a leftover under the composer
									// and what layout-scaled into a dark paper-plane on leave.
									isDefaultTone
										? "overflow-visible bg-transparent shadow-none"
										: "overflow-hidden bg-bg-neutral-bold shadow-overlay",
									// Always fill the width-animating hover box. A `layout`
									// size projection here is what scaled the textarea and
									// trailing labels. Height is Motion-animated instead.
									"w-full",
									composerExpanded ? null : "h-7",
								)}
								initial={{
									opacity: 0,
									borderRadius: surfaceRadius,
									height: surfaceHeight,
								}}
								key="omnibar-surface"
								// Only pins once the bar is already open. Firing while collapsed would
								// expand on Tab, unmounting the pill the focus is on and dropping focus
								// to the document — the keyboard user could not get in at all.
								onFocusCapture={composerExpanded ? handlePin : undefined}
								style={{ willChange: "opacity" }}
								transition={morphTransition}
							>
								<AnimatePresence initial={false} mode="popLayout">
									{composerExpanded ? (
										<OmnibarBar
											consumeFocusRestore={consumeEditorFocusRequest}
											hideContextPill={hoistContextPill}
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
											paintChrome={isDefaultTone}
											shouldReduceMotion={shouldReduceMotion}
										/>
									)}
								</AnimatePresence>
							</motion.div>
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
