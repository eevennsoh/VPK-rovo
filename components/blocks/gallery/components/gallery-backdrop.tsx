import type { JSX } from "react";

import { cn } from "@/lib/utils";

/**
 * Progressive backdrop-blur zone that sits behind the gallery strip.
 *
 * Four stacked `backdrop-filter` layers with increasing blur (2 → 4 → 8 → 16px),
 * each masked to a downward band so the blur ramps stronger toward the bottom of
 * the viewport (where the pinned strip lives). A subtle `bg-surface` tint caps the
 * bottom edge for legibility. Purely presentational — no hooks, no JS motion — so
 * this file intentionally omits the `"use client"` directive.
 *
 * Safari needs the `-webkit-` prefixed variants of both `backdrop-filter` and
 * `mask-image`, so every layer sets them inline alongside the standard property.
 */

// ── Progressive blur bands ──
// Each layer's mask fades in where the previous one starts fading out, so the
// overlapping opaque bands compound into a smooth ramp from light blur (top) to
// heavy blur (bottom). Dynamic gradient values → inline style (allowed).
const BLUR_LAYERS = [
	{
		blur: 2,
		mask: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 55%)",
	},
	{
		blur: 4,
		mask: "linear-gradient(to bottom, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 78%)",
	},
	{
		blur: 8,
		mask: "linear-gradient(to bottom, rgba(0,0,0,0) 48%, rgba(0,0,0,1) 62%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 93%)",
	},
	{
		blur: 16,
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
			{BLUR_LAYERS.map((layer) => (
				<div
					key={layer.blur}
					className="absolute inset-0"
					style={{
						backdropFilter: `blur(${layer.blur}px)`,
						WebkitBackdropFilter: `blur(${layer.blur}px)`,
						maskImage: layer.mask,
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
