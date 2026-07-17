"use client";

import { motion } from "motion/react";
import type { JSX } from "react";

import { buildScrollMaskBlurLayerStyles } from "@/components/visual/scroll-mask/lib";
import { cn } from "@/lib/utils";

/**
 * Progressive surface veil that sits behind the gallery strip.
 *
 * Two effects ramp stronger toward the bottom of the viewport, where the pinned
 * strip lives, so page content reads as a frosted band beneath the dock:
 *
 * 1. A progressive backdrop sampling blur (reusing ScrollMask's layered-veil blur
 *    builder) softens the underlying page content.
 * 2. Four stacked `bg-surface` layers, masked to downward bands, tint that band —
 *    the "white fade" — so it lightens as it blurs.
 *
 * Safari needs the `-webkit-` prefixed variants of `mask-image` / the backdrop sampling property;
 * the builder and each veil layer set them inline alongside the standard property.
 */

// ── vpk motion tokens as resolved cubic-bezier arrays (Motion cannot read var()) ──
// Source: .agents/rules/motion-decisions.md "Consuming tokens" map. Durations in SECONDS.
const EASE_OUT = [0, 0.4, 0, 1] as const; // --ease-out (BOLD; prominent-surface ENTER)
const EASE_IN = [0.6, 0, 0.8, 0.6] as const; // --ease-in (practical EXIT — every exit)
const DUR_SLOW = 0.25; // --duration-slow
const DUR_FAST = 0.1; // --duration-fast

// Only the white veil fades. It inherits the strip's active variant label
// ("hidden"/"visible"/"exit") via context, so fading it here (rather than on a wrapper
// around the whole backdrop) keeps the blur out of an opacity group — an ancestor
// opacity isolates the backdrop sampling property, which would then sample an empty buffer and blur
// nothing. Bold ease-out wash IN (prominent surface); fast ease-in OUT so the veil
// clears ahead of the cards. Opacity-only → safe under reduced motion as-is.
const BACKDROP = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: DUR_SLOW, ease: EASE_OUT } },
	exit: { opacity: 0, transition: { duration: DUR_FAST, ease: EASE_IN } },
} as const;

// Progressive backdrop blur ramped to the bottom edge (strongest at the floor, tapering
// upward) using the shared ScrollMask blur builder — the same layered-veil technique the
// gallery track uses on its horizontal edges. Static per mount → build once at module
// scope (no per-render allocation) and NOT opacity-faded (see the BACKDROP note above).
const BOTTOM_BLUR_LAYERS = buildScrollMaskBlurLayerStyles("bottom");

// Each layer's mask fades in where the previous one starts fading out, so the
// overlapping surface bands compound into a smooth ramp from light tint (top) to
// stronger tint (bottom). Dynamic gradient values → inline style (allowed).
const VEIL_LAYERS = [
	{
		id: "upper",
		opacity: 0.12,
		mask: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 55%)",
	},
	{
		id: "middle",
		opacity: 0.18,
		mask: "linear-gradient(to bottom, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 78%)",
	},
	{
		id: "lower",
		opacity: 0.26,
		mask: "linear-gradient(to bottom, rgba(0,0,0,0) 48%, rgba(0,0,0,1) 62%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 93%)",
	},
	{
		id: "floor",
		opacity: 0.34,
		mask: "linear-gradient(to bottom, rgba(0,0,0,0) 66%, rgba(0,0,0,1) 84%, rgba(0,0,0,1) 100%)",
	},
] as const;

// Subtle surface tint, revealed only toward the bottom edge (mask alpha caps at
// ~0.55 so underlying content stays visible through the blur).
const TINT_MASK =
	"linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)";

export function GalleryBackdrop(props: Readonly<{ className?: string }>): JSX.Element {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56",
				props.className,
			)}
		>
			{/* Progressive blur first (painted behind the tint) so the veil lightens the
			    already-blurred page content — a frosted-glass band that ramps to the floor. */}
			{BOTTOM_BLUR_LAYERS.map((layerStyle, index) => (
				<div key={index} style={layerStyle} />
			))}
			<motion.div
				className="absolute inset-0"
				variants={BACKDROP}
				style={{ willChange: "opacity" }}
			>
				{VEIL_LAYERS.map((layer) => (
					<div
						key={layer.id}
						className="absolute inset-0 bg-surface"
						style={{
							maskImage: layer.mask,
							opacity: layer.opacity,
							WebkitMaskImage: layer.mask,
						}}
					/>
				))}
				<div
					className="absolute inset-0 bg-surface"
					style={{
						maskImage: TINT_MASK,
						WebkitMaskImage: TINT_MASK,
					}}
				/>
			</motion.div>
		</div>
	);
}
