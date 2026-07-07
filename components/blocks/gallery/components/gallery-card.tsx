"use client";

import { motion, useReducedMotion, type MotionValue } from "motion/react";
import { useCallback, useRef, type RefObject } from "react";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { GalleryItem } from "../data/gallery-items";
import { useDockScale } from "../hooks/use-dock-magnification";

// Base card footprints (bottom-aligned in the track). Cards grow UPWARD when
// magnified (transformOrigin "bottom center") so they never push their neighbors.
const SIZE_CLASS: Record<GalleryItem["size"], string> = {
	tall: "h-52 w-36",
	square: "h-28 w-28",
	wide: "h-32 w-56",
};

// ── vpk motion tokens as resolved cubic-bezier arrays (Motion cannot read var()) ──
const EASE_IN = [0.6, 0, 0.8, 0.6] as const; // --ease-in (practical EXIT)
const DUR_MEDIUM = 0.2; // --duration-medium
// Morph-back (close) timing: on dismiss the overlay unmounts and this strip card
// re-mounts, so ITS layout transition owns the return morph. Use the faster
// practical exit curve per the asymmetric-exit rule (the enter morph timing lives
// on the expanded overlay). Without this the return would run Motion's default.
const CARD_MORPH_BACK = { layout: { duration: DUR_MEDIUM, ease: EASE_IN } } as const;

export interface GalleryCardProps {
	item: GalleryItem;
	/** Shared-element morph id (undefined under reduced motion → plain cross-fade). */
	layoutId: string | undefined;
	pointerX: MotionValue<number>;
	scrollContainerRef: RefObject<HTMLDivElement | null>;
	/** Read to bail the click that ends a drag. */
	wasDraggedRef: RefObject<boolean>;
	/** Pauses dock magnification while the track is being panned. */
	dragging: boolean;
	/** When true this card is morphed into the overlay; the strip keeps a spacer. */
	isExpanded: boolean;
	onExpand: (id: string) => void;
	/** Registers the DOM node so the orchestrator can restore focus on close. */
	registerCard: (id: string, node: HTMLButtonElement | null) => void;
}

export function GalleryCard({
	item,
	layoutId,
	pointerX,
	scrollContainerRef,
	wasDraggedRef,
	dragging,
	isExpanded,
	onExpand,
	registerCard,
}: Readonly<GalleryCardProps>) {
	const cardRef = useRef<HTMLButtonElement | null>(null);
	const scale = useDockScale({ pointerX, cardRef, scrollContainerRef, disabled: dragging });
	// vpk mandates an explicit reduced-motion guard on every animation source. The
	// dock scale (useDockScale) and the shared-element morph (layoutId, undefined
	// under reduced motion from the orchestrator) both quiet themselves; this guard
	// also collapses the layout transition so any residual morph resolves instantly.
	const prefersReducedMotion = useReducedMotion();

	const setRef = useCallback(
		(node: HTMLButtonElement | null) => {
			cardRef.current = node;
			registerCard(item.id, node);
		},
		[item.id, registerCard],
	);

	const handleClick = useCallback(() => {
		// A press that ended a pan must not open the card.
		if (wasDraggedRef.current) return;
		onExpand(item.id);
	}, [item.id, onExpand, wasDraggedRef]);

	// While expanded, the real card lives in the overlay (matching layoutId). Keep
	// a same-size, inert spacer so the track layout — and scroll offset — hold.
	if (isExpanded) {
		return <div aria-hidden="true" className={cn("shrink-0", SIZE_CLASS[item.size])} />;
	}

	return (
		<motion.button
			ref={setRef}
			layoutId={layoutId}
			transition={prefersReducedMotion ? { duration: 0 } : CARD_MORPH_BACK}
			type="button"
			aria-label={`Expand ${item.title}`}
			onClick={handleClick}
			className={cn(
				"relative shrink-0 overflow-hidden rounded-xl bg-surface-raised text-left outline-none",
				"focus-visible:ring-2 focus-visible:ring-ring",
				SIZE_CLASS[item.size],
			)}
			style={{
				scale,
				transformOrigin: "bottom center",
				willChange: "transform",
				boxShadow: token("elevation.shadow.raised"),
			}}
		>
			<span aria-hidden="true" className={cn("absolute inset-0", item.surfaceClassName)} />
			{/* Legibility scrim + truncated caption, mirroring the reference strip. */}
			<span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent p-2 pt-6">
				<span className="block truncate text-xs font-medium text-white">{item.title}</span>
			</span>
		</motion.button>
	);
}
