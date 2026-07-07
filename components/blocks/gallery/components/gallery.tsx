"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useId, useRef, useState, type JSX } from "react";

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
const DUR_MEDIUM = 0.2; // --duration-medium

// Pinned strip enter/exit: fade + slide from below. Prominent surface → bold
// ease-out ENTER; faster practical ease-in EXIT declared on the exit variant.
const STRIP = {
	initial: { opacity: 0, y: "100%" },
	animate: { opacity: 1, y: "0%", transition: { duration: DUR_SLOW, ease: EASE_OUT } },
	exit: { opacity: 0, y: "100%", transition: { duration: DUR_MEDIUM, ease: EASE_IN } },
} as const;

// Reduced motion: fade only, no slide (tokens don't auto-collapse motion).
const STRIP_REDUCED = {
	initial: { opacity: 0 },
	animate: { opacity: 1, transition: { duration: DUR_SLOW } },
	exit: { opacity: 0, transition: { duration: DUR_MEDIUM } },
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
	// notify via `onOpenChange`; use functional updates for the next value.
	const isOpen = open ?? internalOpen;
	const handleToggle = useCallback(() => {
		const next = !(open ?? internalOpen);
		if (open === undefined) setInternalOpen(next);
		onOpenChange?.(next);
		// Closing the strip must also dismiss any expanded card, or its morph-back
		// target and focus-registry entry would be stranded when the strip unmounts.
		if (!next) setExpandedId(null);
	}, [open, internalOpen, onOpenChange]);

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
	const stripVariants = shouldReduceMotion ? STRIP_REDUCED : STRIP;

	return (
		<div className={cn(className)}>
			<AnimatePresence>
				{isOpen ? (
					<motion.div
						key="gallery-strip"
						className="fixed inset-x-0 bottom-0 z-40"
						initial={stripVariants.initial}
						animate={stripVariants.animate}
						exit={stripVariants.exit}
						style={{ willChange: "transform, opacity" }}
						// While a card is expanded, take the strip (and its cards) out of
						// the tab order and a11y tree so keyboard/AT users can't reach
						// behind the modal scrim.
						inert={expandedId !== null ? true : undefined}
					>
						<GalleryBackdrop />
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
				inert={expandedId !== null ? true : undefined}
			>
				<GalleryToggle
					open={isOpen}
					onToggle={handleToggle}
					className={isOpen ? "bottom-64" : undefined}
				/>
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
