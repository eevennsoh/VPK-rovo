"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useCallback, useRef, type RefObject } from "react";

import Squircle from "@/components/website/demos/visual/shaders/squircle";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { GalleryItem } from "../data/gallery-items";
import { useDockScale } from "../hooks/use-dock-magnification";
import { useFitText } from "../hooks/use-fit-text";

// Three fixed footprints (bottom-aligned in the track). Squircle needs pixel
// dimensions, so these are numbers rather than Tailwind size classes. Cards grow
// UPWARD when magnified (transformOrigin "bottom center") so they never push
// their neighbors.
const SIZE_DIMS: Record<GalleryItem["size"], { width: number; height: number }> = {
	portrait: { width: 144, height: 208 },
	landscape: { width: 224, height: 128 },
	"1x1": { width: 112, height: 112 },
};

// ── vpk motion tokens as resolved cubic-bezier arrays (Motion cannot read var()) ──
const EASE_IN = [0.6, 0, 0.8, 0.6] as const; // --ease-in (practical EXIT)
const DUR_MEDIUM = 0.2; // --duration-medium
const DUR_FAST = 0.1; // --duration-fast
// Morph-back (close) timing: on dismiss the overlay unmounts and this strip card
// re-mounts, so ITS layout transition owns the return morph. Use the faster
// practical exit curve per the asymmetric-exit rule (the enter morph timing lives
// on the expanded overlay). Without this the return would run Motion's default.
const CARD_MORPH_BACK = { layout: { duration: DUR_MEDIUM, ease: EASE_IN } } as const;

// Smooth glide-in for the staggered entrance. A bounce:0 spring (no overshoot)
// decelerates naturally — much smoother than the bold ADS ease-out cubic-bezier,
// whose front-loaded curve makes cards snap to size. This matches the established
// smooth staggered-reveal idiom in chat-greeting.tsx. `visualDuration` is the time
// the card appears to take to land; the track spaces each card's start (stagger).
const CARD_ENTER = { type: "spring", bounce: 0, visualDuration: 0.28 } as const;

// Faster, interrupt-friendly EXIT. The toggle can be spammed, so the card sinks back
// down (y→40) on a bounce:0 spring: springs resolve gracefully from any in-flight
// position/velocity, whereas the old duration/ease tween restarted abruptly and left
// cards stranded mid-travel when open→close→open interrupted it. Opacity rides a short
// ease-in tween. The reverse-order stagger (dock empties outside-in) is owned by the
// track; this is deliberately quicker than the enter per the asymmetric-exit rule.
const CARD_EXIT = {
	y: { type: "spring", bounce: 0, visualDuration: 0.16 },
	opacity: { duration: DUR_FAST, ease: EASE_IN },
} as const;

// Per-card entrance/exit. The strip is pinned to the BOTTOM of the viewport, so cards
// RISE in from below (y:40→0, bottom-to-top) and SINK back down on exit (0→40),
// spatially anchored to the dock they belong to. The rise emerges from just beneath
// the strip; opacity is ~0 at the start of the travel so the brief clip at the bottom
// edge reads as the card surfacing into place. `y` is an INDEPENDENT transform, and it
// lives on the wrapper (below), NOT on the button — the button's `transform` is owned
// by the dock `scale` MotionValue, which would otherwise clobber the entrance `y`.
// Smooth spring ENTER, faster spring EXIT (asymmetric-exit rule). Stagger is owned by
// the track.
const CARD_ITEM = {
	hidden: { opacity: 0, y: 40 },
	visible: { opacity: 1, y: 0, transition: CARD_ENTER },
	exit: { opacity: 0, y: 40, transition: CARD_EXIT },
} as const;
// Reduced motion: fade only, no rise.
const CARD_ITEM_REDUCED = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: DUR_MEDIUM } },
	exit: { opacity: 0, transition: { duration: DUR_MEDIUM } },
} as const;

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
	const { width, height } = SIZE_DIMS[item.size];
	const cardRef = useRef<HTMLButtonElement | null>(null);
	const scale = useDockScale({ pointerX, cardRef, scrollContainerRef, disabled: dragging });
	// The dock scale grows the button VISUALLY (transform), which does not reserve
	// layout space — so magnified cards would overlap their neighbours. Driving the
	// WRAPPER's layout width by the same scale makes the flex row reflow and push
	// neighbours apart, preserving the gap (macOS-dock behaviour). Height is left at
	// rest: cards grow UPWARD via the transform into the track's `pt-24` headroom, so
	// vertical growth never needs to reserve layout space. Function form reads the
	// MotionValue in a callback (never during render).
	const scaledWidth = useTransform(() => width * scale.get());
	// vpk mandates an explicit reduced-motion guard on every animation source. The
	// dock scale (useDockScale) and the shared-element morph (layoutId, undefined
	// under reduced motion from the orchestrator) both quiet themselves; this guard
	// also collapses the layout transition so any residual morph resolves instantly.
	const prefersReducedMotion = useReducedMotion();
	const itemVariants = prefersReducedMotion ? CARD_ITEM_REDUCED : CARD_ITEM;

	// Scale the title to fill the card, wrapping onto multiple lines as needed.
	const { containerRef, textRef } = useFitText<HTMLDivElement, HTMLSpanElement>(item.title);

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

	// Three layers keep transform ownership cleanly separated so nothing clobbers
	// anything else:
	//   • WRAPPER (flex child / stagger item): entrance y + opacity, and the animated
	//     layout WIDTH that reserves the magnified footprint. Stays mounted across
	//     expand→collapse so it holds the track slot while the button morphs away.
	//   • SCALE layer (non-layout): the dock `scale` from a bottom-centre origin —
	//     decoupled from layoutId so the origin is never hijacked (grows upward only).
	//   • BUTTON (layoutId): the shared-element morph target and click surface, at its
	//     fixed base footprint; the scale layer sizes it visually.
	return (
		<motion.div
			variants={itemVariants}
			// Animated layout width (base × dock scale) reserves the magnified footprint
			// so neighbours are pushed apart and the inter-card gap is preserved. The
			// base-size button is centred inside and scaled on top of that. `items-end`
			// keeps it bottom-aligned as it grows upward.
			className="flex shrink-0 items-end justify-center"
			style={{ width: scaledWidth, height, willChange: "transform, opacity" }}
		>
			{isExpanded ? null : (
				<motion.div
					// The dock scale lives on this NON-layout layer, deliberately decoupled
					// from the button's `layoutId`. Motion's layout projection manages the
					// transform-origin of a layoutId element (forcing it toward centre under
					// a transformed ancestor, e.g. the docs preview), which made the card
					// scale from its centre and clip at the strip's bottom edge. On a plain
					// motion.div the `bottom center` origin is always honoured, so the card
					// grows UPWARD into the track headroom and is never cut off.
					style={{ scale, transformOrigin: "bottom center", willChange: "transform" }}
				>
					<motion.button
						ref={setRef}
						layoutId={layoutId}
						transition={prefersReducedMotion ? { duration: 0 } : CARD_MORPH_BACK}
						type="button"
						aria-label={`Expand ${item.title}`}
						onClick={handleClick}
						className={cn(
							"relative block rounded-3xl text-left outline-none",
							"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						)}
						// Fixed base footprint; the surrounding layer scales it (the wrapper's
						// animated width reserves the matching layout space).
						style={{ width, height }}
					>
					{/* Opaque light-grey squircle surface (elevation.surface.sunken — the
					    Squircle's own default fill is a semi-transparent neutral). */}
					<Squircle
						width={width}
						height={height}
						strokeWidth={0}
						fillColor={token("elevation.surface.sunken")}
						style={{ boxShadow: token("elevation.shadow.raised") }}
					/>
					{/* Bottom-anchored, auto-fitting title on its own layer — a SIBLING of the
					    Squircle, so it is untouched by the Squircle's internal fallback→
					    corner-shape DOM swap (which would otherwise orphan the fit observer and
					    leave the text at its default size). Each word gets its own line. The
					    button's aria-label already names the card, so this text is decorative. */}
					<div aria-hidden="true" className="pointer-events-none absolute inset-0 p-6">
						<div ref={containerRef} className="flex h-full w-full flex-col justify-end">
							<span
								ref={textRef}
								className="block w-full font-semibold leading-[1.02] tracking-tight text-text"
							>
								{item.title.split(/\s+/).map((word, index) => (
									<span key={index} className="block">
										{word}
									</span>
								))}
							</span>
						</div>
					</div>
					</motion.button>
				</motion.div>
			)}
		</motion.div>
	);
}
