"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

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

const DEFAULT_PLACEHOLDER = "Describe any changes you want to make...";

// Radii are "fully rounded" at each geometry: half of the 28px pill, half of the 56px bar.
const PILL_RADIUS = 14;
const BAR_RADIUS = 28;

export interface OmnibarProps {
	className?: string;
	/** Seeds the initial geometry. Useful for catalog variants that show one state. */
	defaultState?: OmnibarState;
	onStateChange?: (state: OmnibarState) => void;
	onSubmit?: (prompt: string) => void;
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
}

/**
 * A persistent bottom-center AI bar with three geometries: a black sparkle pill, an expanded
 * prompt bar, and a right-docked chat panel.
 *
 * Hovering expands the pill; pressing inside the bar pins it open so a draft survives the
 * pointer leaving. The pill and bar are one `layout` element — never two with a shared
 * `layoutId`, which hijacks `transform-origin` and breaks the morph.
 */
export function Omnibar({
	className,
	defaultState,
	onStateChange,
	onSubmit,
	placeholder = DEFAULT_PLACEHOLDER,
	positioning = "container",
	sidePanel,
}: Readonly<OmnibarProps>) {
	const shouldReduceMotion = useReducedMotion();
	const [value, setValue] = useState("");
	const {
		closePanel,
		handlePin,
		handlePointerEnter,
		handlePointerLeave,
		openPanel,
		pinned,
		state,
		surfaceRef,
	} = useOmnibarState({ defaultState, onStateChange });

	const handleSubmit = useCallback(() => {
		const prompt = value.trim();
		// Without a consumer there is nowhere for the draft to go, so clearing it would
		// destroy the only copy. The submit control is disabled in that case, but Enter
		// still reaches `requestSubmit()`, so the guard has to live here too.
		if (!prompt || onSubmit === undefined) {
			return;
		}
		onSubmit(prompt);
		setValue("");
	}, [onSubmit, value]);

	const isExpanded = state === "expanded";
	const morphTransition = resolveOmnibarTransition(
		isExpanded ? OMNIBAR_MORPH_ENTER : OMNIBAR_MORPH_EXIT,
		shouldReduceMotion,
	);

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
					className,
				)}
				data-pinned={pinned || undefined}
				data-slot="omnibar"
				data-state={state}
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
										onValueChange={setValue}
										placeholder={placeholder}
										shouldReduceMotion={shouldReduceMotion}
										value={value}
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

			{/* Sibling of the rail, not a child: the rail is a bottom-anchored strip with
			    pointer events disabled, so a nested panel would be mispositioned and inert. */}
			<AnimatePresence initial={false}>
				{state === "docked" ? resolvedPanel : null}
			</AnimatePresence>
		</>
	);
}
