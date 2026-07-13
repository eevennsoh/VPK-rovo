"use client";

import { useCallback, useRef, type CSSProperties, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

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

// Card entrance/exit is orchestrated HERE — the track is the direct motion parent of
// the cards, so its variant transition owns their stagger. The active label ("hidden"
// /"visible"/"exit") arrives from the strip via variant propagation; these container
// variants add only the sequencing (the per-card values live on the card). Exit runs
// in reverse (staggerDirection:-1) so the dock empties from the outside in, and its
// stagger is deliberately TIGHTER than the enter — a quick reverse ripple out rather
// than a slow drawn-out one (asymmetric-exit rule).
const TRACK_CONTAINER = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.045, delayChildren: 0.03 } },
	exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
} as const;
const TRACK_CONTAINER_REDUCED = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.025 } },
	exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
} as const;

// ── Progressive edge blur (mirrors components/visual/scroll-mask) ──
// Stacked, feathered backdrop-blur layers = progressive (variable) blur: each layer
// blurs a little more but is masked to a progressively narrower band toward the edge,
// so the blur compounds at the edge and tapers to zero inward — no hard cutoff. This
// is the left/right (horizontal) counterpart of scroll-mask's top/bottom builder, so
// the dock's overflowing cards softly blur out rather than only fading. Radii stay
// gentle because stacked backdrop-filters compound.
const GALLERY_EDGE_BLUR_SIZE = "72px";
const GALLERY_BLUR_LAYERS = [
	{ blur: 0.5, mid: 68, end: 100 },
	{ blur: 1, mid: 52, end: 82 },
	{ blur: 2, mid: 38, end: 62 },
	{ blur: 3.5, mid: 24, end: 44 },
	{ blur: 6, mid: 10, end: 26 },
] as const;

function buildGalleryEdgeBlurLayerStyles(edge: "left" | "right"): CSSProperties[] {
	// Strongest blur sits AT the edge and tapers inward, so the mask runs from the
	// edge (#000) toward the interior (transparent): "to right" for the left edge,
	// "to left" for the right edge.
	const direction = edge === "left" ? "to right" : "to left";
	return GALLERY_BLUR_LAYERS.map(({ blur, mid, end }) => {
		const maskImage = `linear-gradient(${direction}, #000 0%, #000 ${mid}%, transparent ${end}%)`;
		const backdropFilter = `blur(${blur}px)`;
		return {
			position: "absolute",
			inset: 0,
			backdropFilter,
			WebkitBackdropFilter: backdropFilter,
			maskImage,
			WebkitMaskImage: maskImage,
		};
	});
}

// Static per edge → build once at module scope (no per-render allocation).
const LEFT_BLUR_LAYERS = buildGalleryEdgeBlurLayerStyles("left");
const RIGHT_BLUR_LAYERS = buildGalleryEdgeBlurLayerStyles("right");

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
	const containerVariants = shouldReduceMotion ? TRACK_CONTAINER_REDUCED : TRACK_CONTAINER;
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
		// Relative wrapper hosts the scroller plus the fixed edge-blur overlays. It is a
		// plain div, so Motion's variant state still propagates through it (context) from
		// the strip down to the scroller/cards.
		<div className="relative">
			<motion.div
				ref={setScrollRef}
				variants={containerVariants}
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
			</motion.div>

			{/* Progressive blur pinned to each edge that actually has hidden content, so
			    cards soften into the fade instead of only turning transparent. */}
			{canScrollLeft ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 left-0"
					style={{ width: GALLERY_EDGE_BLUR_SIZE }}
				>
					{LEFT_BLUR_LAYERS.map((layerStyle, index) => (
						<div key={index} style={layerStyle} />
					))}
				</div>
			) : null}
			{canScrollRight ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 right-0"
					style={{ width: GALLERY_EDGE_BLUR_SIZE }}
				>
					{RIGHT_BLUR_LAYERS.map((layerStyle, index) => (
						<div key={index} style={layerStyle} />
					))}
				</div>
			) : null}
		</div>
	);
}
