"use client";

import { useCallback, useRef, type CSSProperties, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";

import { useHasHorizontalOverflow } from "@/components/hooks/use-has-horizontal-overflow";
import { cn } from "@/lib/utils";

import type { GalleryItem } from "../data/gallery-items";
import { useDockPointer } from "../hooks/use-dock-magnification";
import { useDragScroll } from "../hooks/use-drag-scroll";
import { GalleryCard } from "./gallery-card";

// Local edge-mask builder — deliberately NOT the bento one, which composites a
// permanent bottom fade via `mask-composite: intersect`. Gallery wants left/right
// fades only, so this is a single `linear-gradient(to right, …)` (no composite).
const GALLERY_EDGE_FADE = "48px";

function buildGalleryEdgeMask(canScrollLeft: boolean, canScrollRight: boolean): string {
	const left = canScrollLeft ? `transparent 0, #000 ${GALLERY_EDGE_FADE}` : "#000 0";
	const right = canScrollRight
		? `#000 calc(100% - ${GALLERY_EDGE_FADE}), transparent 100%`
		: "#000 100%";
	return `linear-gradient(to right, ${left}, ${right})`;
}

type GalleryEdgeMaskStyle = CSSProperties & Record<"--gallery-edge-mask", string>;

function getGalleryEdgeMaskStyle(
	canScrollLeft: boolean,
	canScrollRight: boolean,
): GalleryEdgeMaskStyle {
	return { "--gallery-edge-mask": buildGalleryEdgeMask(canScrollLeft, canScrollRight) };
}

export interface GalleryTrackProps {
	items: readonly GalleryItem[];
	/** Maps an item id to its morph layoutId (undefined under reduced motion). */
	getLayoutId: (id: string) => string | undefined;
	expandedId: string | null;
	onExpand: (id: string) => void;
	registerCard: (id: string, node: HTMLButtonElement | null) => void;
	className?: string;
}

export function GalleryTrack({
	items,
	getLayoutId,
	expandedId,
	onExpand,
	registerCard,
	className,
}: Readonly<GalleryTrackProps>) {
	const shouldReduceMotion = useReducedMotion();
	const { ref: overflowRef, canScrollLeft, canScrollRight } =
		useHasHorizontalOverflow<HTMLDivElement>({ reduceMotion: shouldReduceMotion ?? false });

	// Own RefObject (drag + dock read `.current`); merge with the hook's callback ref.
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const setScrollRef = useCallback(
		(node: HTMLDivElement | null) => {
			scrollRef.current = node;
			overflowRef(node);
		},
		[overflowRef],
	);

	const pointerX = useDockPointer();
	const drag = useDragScroll(scrollRef);

	const handlePointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			drag.onPointerDown(event);
		},
		[drag],
	);

	const handlePointerMove = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			drag.onPointerMove(event);
			// Pause the dock (park cards at rest) the instant a press becomes a pan;
			// `wasDraggedRef` is updated synchronously inside `onPointerMove`.
			pointerX.set(drag.wasDraggedRef.current ? Number.POSITIVE_INFINITY : event.clientX);
		},
		[drag, pointerX],
	);

	const handlePointerUp = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			drag.onPointerUp(event);
			pointerX.set(event.clientX);
		},
		[drag, pointerX],
	);

	const handlePointerLeave = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			drag.onPointerLeave(event);
			pointerX.set(Number.POSITIVE_INFINITY);
		},
		[drag, pointerX],
	);
	const handleLostPointerCapture = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			drag.onLostPointerCapture(event);
		},
		[drag],
	);

	return (
		<div
			ref={setScrollRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			onPointerLeave={handlePointerLeave}
			onLostPointerCapture={handleLostPointerCapture}
			className={cn(
				// Bottom-aligned scroll strip with top headroom so magnified cards
				// grow upward without clipping. Scrollbar hidden; edge fades via mask.
				"relative flex items-end gap-3 overflow-x-auto px-6 pt-24 pb-4",
				"[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				"[mask-image:var(--gallery-edge-mask)] [-webkit-mask-image:var(--gallery-edge-mask)]",
				drag.dragging ? "cursor-grabbing select-none" : "cursor-grab",
				className,
			)}
			style={getGalleryEdgeMaskStyle(canScrollLeft, canScrollRight)}
		>
			{items.map((item) => (
				<GalleryCard
					key={item.id}
					item={item}
					layoutId={getLayoutId(item.id)}
					pointerX={pointerX}
					scrollContainerRef={scrollRef}
					wasDraggedRef={drag.wasDraggedRef}
					dragging={drag.dragging}
					isExpanded={expandedId === item.id}
					onExpand={onExpand}
					registerCard={registerCard}
				/>
			))}
		</div>
	);
}
