import type { JSX } from "react";

import { cn } from "@/lib/utils";

/**
 * Progressive surface veil that sits behind the gallery strip.
 *
 * Four stacked surface layers are masked to downward bands so the tint ramps
 * stronger toward the bottom of the viewport, where the pinned strip lives.
 * Purely presentational — no hooks, no JS motion — so this file intentionally
 * omits the `"use client"` directive.
 *
 * Safari needs the `-webkit-` prefixed variant of `mask-image`, so every layer
 * sets it inline alongside the standard property.
 */

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
		</div>
	);
}
