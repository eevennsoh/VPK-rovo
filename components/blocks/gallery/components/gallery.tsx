"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type JSX } from "react";

import { cn } from "@/lib/utils";

import type { GalleryItem } from "../data/gallery-items";
import { GalleryBackdrop } from "./gallery-backdrop";
import { GalleryExpanded } from "./gallery-expanded";
import { GalleryToggle } from "./gallery-toggle";
import { GalleryTrack } from "./gallery-track";

// ── vpk motion tokens as resolved cubic-bezier arrays (Motion cannot read var()) ──
// Source: .agents/rules/motion-decisions.md "Consuming tokens" map. Durations in SECONDS.
const EASE_OUT = [0, 0.4, 0, 1] as const; // --ease-out (BOLD; prominent-surface ENTER)
const EASE_IN = [0.6, 0, 0.8, 0.6] as const; // --ease-in (practical EXIT — every exit)
const DUR_SLOW = 0.25; // --duration-slow
const DUR_FAST = 0.1; // --duration-fast

// The pinned strip is a pure ORCHESTRATION node: it carries no visual style of its
// own, only the active variant LABEL ("hidden"/"visible"/"exit") which propagates
// through the track down to each card. Crucially it does NOT fade — a parent opacity
// fade multiplies its children, which previously MASKED the per-card reverse-stagger
// on close (the whole strip just dissolved as one block). With the fade moved to the
// backdrop layer below, the cards' staggered rise/sink is the sole focal motion, and
// AnimatePresence still keeps the strip mounted until every descendant's exit
// completes. A card re-mounting after an expand→collapse does NOT replay the entrance
// (the parent is already at rest in "visible"); only the layout morph runs.
const STRIP = { hidden: {}, visible: {}, exit: {} } as const;

// Backdrop veil fade lives on its OWN layer behind the cards (its variants inherit the
// strip's active label via context), so fading it out on close no longer dims the cards
// mid-exit. Bold ease-out wash IN (prominent surface); fast ease-in OUT so the veil
// clears ahead of the cards instead of lingering. Opacity-only → safe under reduced
// motion as-is.
const BACKDROP = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: DUR_SLOW, ease: EASE_OUT } },
	exit: { opacity: 0, transition: { duration: DUR_FAST, ease: EASE_IN } },
} as const;

export interface GalleryProps {
	items: readonly GalleryItem[];
	/** Controlled visibility of the pinned strip. */
	open?: boolean;
	/** Uncontrolled initial visibility (default true). */
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	className?: string;
}

export function Gallery({
	items,
	open,
	defaultOpen = true,
	onOpenChange,
	className,
}: Readonly<GalleryProps>): JSX.Element {
	const shouldReduceMotion = useReducedMotion();
	const instanceId = useId();
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	// Controlled when `open` is provided; otherwise track internal state. Always
	// notify via `onOpenChange`.
	const isOpen = open ?? internalOpen;
	// Mirror the resolved open state in a ref so a rapidly-repeated toggle reads the
	// value the PREVIOUS click just set. Reading `open ?? internalOpen` from the
	// callback's closure is stale between a click and its commit, so two fast clicks
	// (open→close→open) would compute the same `next` twice and collapse into one
	// toggle — the "stuck when clicked too fast" bug.
	const isOpenRef = useRef(isOpen);
	isOpenRef.current = isOpen;

	useEffect(() => {
		if (!isOpen && expandedId !== null) setExpandedId(null);
	}, [expandedId, isOpen]);

	const handleToggle = useCallback(() => {
		const next = !isOpenRef.current;
		isOpenRef.current = next;
		if (open === undefined) setInternalOpen(next);
		onOpenChange?.(next);
		// Closing the strip must also dismiss any expanded card, or its morph-back
		// target and focus-registry entry would be stranded when the strip unmounts.
		if (!next) setExpandedId(null);
	}, [open, onOpenChange]);

	// Card DOM registry for focus restoration on close.
	const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
	const registerCard = useCallback((id: string, node: HTMLButtonElement | null) => {
		if (node) cardRefs.current.set(id, node);
		else cardRefs.current.delete(id);
	}, []);

	const getLayoutId = useCallback(
		(id: string) => (shouldReduceMotion ? undefined : `${instanceId}-card-${id}`),
		[instanceId, shouldReduceMotion],
	);

	const handleExpand = useCallback((id: string) => setExpandedId(id), []);
	const handleClose = useCallback(() => {
		setExpandedId((current) => {
			// Restore focus to the originating card once it has re-mounted.
			if (current) {
				const id = current;
				requestAnimationFrame(() => cardRefs.current.get(id)?.focus());
			}
			return null;
		});
	}, []);

	const expandedItem = expandedId ? (items.find((item) => item.id === expandedId) ?? null) : null;
	const hasExpandedOverlay = isOpen && expandedItem !== null;

	return (
		<div className={cn(className)}>
			<AnimatePresence>
				{isOpen ? (
					<motion.div
						key="gallery-strip"
						className="fixed inset-x-0 bottom-0 z-40"
						variants={STRIP}
						initial="hidden"
						animate="visible"
						exit="exit"
						// While a card is expanded, take the strip (and its cards) out of
						// the tab order and a11y tree so keyboard/AT users can't reach
						// behind the modal scrim.
						inert={hasExpandedOverlay ? true : undefined}
					>
						{/* Veil fades on its own layer (variants inherit the strip's active
						    label), so closing no longer dims the cards mid reverse-stagger. */}
						<motion.div variants={BACKDROP} style={{ willChange: "opacity" }}>
							<GalleryBackdrop />
						</motion.div>
						<GalleryTrack
							items={items}
							getLayoutId={getLayoutId}
							expandedId={expandedId}
							onExpand={handleExpand}
							registerCard={registerCard}
						/>
					</motion.div>
				) : null}
			</AnimatePresence>

			<div
				// Toggle sits behind the scrim while a card is expanded — keep it out
				// of the tab order / a11y tree until the dialog closes. (Wrapper box
				// has no layout impact; the toggle inside is position:fixed.)
				inert={hasExpandedOverlay ? true : undefined}
			>
				<GalleryToggle open={isOpen} onToggle={handleToggle} />
			</div>

			<AnimatePresence>
				{isOpen && expandedItem ? (
					<GalleryExpanded
						key="gallery-expanded"
						item={expandedItem}
						layoutId={getLayoutId(expandedItem.id)}
						onClose={handleClose}
					/>
				) : null}
			</AnimatePresence>
		</div>
	);
}
