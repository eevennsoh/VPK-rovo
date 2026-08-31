"use client";

import { motion } from "motion/react";

import { RovoSparkleMark } from "@/components/ui-custom/rovo-sparkle";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";

import {
	OMNIBAR_PILL_ZOOM,
	OMNIBAR_SURFACE_ENTER,
	OMNIBAR_SURFACE_EXIT,
	resolveOmnibarTransition,
	resolveOmnibarZoom,
} from "../omnibar-motion";

export interface OmnibarPillProps {
	className?: string;
	label: string;
	onActivate: () => void;
	shouldReduceMotion: boolean | null;
}

/**
 * Collapsed state: a lozenge holding nothing but the Rovo sparkle.
 *
 * The pill paints its own floating-Rovo-button chrome rather than inheriting a fill from a
 * shared morphing surface. That is what lets it cross-fade with the bar as an independent
 * object: a fill on a common ancestor would have to resize between the two geometries, and
 * resizing is the thing this transition replaces.
 *
 * The glyph is the canonical `RovoSparkleMark` in its brand-color format — the same
 * four-quadrant mark the catalog `RovoSparkle` trigger shows when active.
 */
export function OmnibarPill({
	className,
	label,
	onActivate,
	shouldReduceMotion,
}: Readonly<OmnibarPillProps>) {
	const enterTransition = resolveOmnibarTransition(OMNIBAR_SURFACE_ENTER, shouldReduceMotion);
	const exitTransition = resolveOmnibarTransition(OMNIBAR_SURFACE_EXIT, shouldReduceMotion);

	return (
		<motion.div
			animate={{ opacity: 1, scale: 1 }}
			className={cn("col-start-1 row-start-1", className)}
			data-slot="omnibar-pill"
			exit={{
				opacity: 0,
				// The ghost overlaps the arriving bar for a tenth of a second, and its button
				// would otherwise swallow a click meant for the composer.
				pointerEvents: "none",
				scale: resolveOmnibarZoom(OMNIBAR_PILL_ZOOM.exitTo, shouldReduceMotion),
				transition: exitTransition,
			}}
			initial={{
				opacity: 0,
				scale: resolveOmnibarZoom(OMNIBAR_PILL_ZOOM.enterFrom, shouldReduceMotion),
			}}
			style={{ willChange: "opacity, transform" }}
			transition={enterTransition}
		>
			<button
				aria-label={label}
				className="flex h-7 w-24 cursor-pointer items-center justify-center rounded-full bg-bg-neutral-bold"
				onClick={onActivate}
				style={{ boxShadow: token("elevation.shadow.overlay") }}
				type="button"
			>
				<RovoSparkleMark active selected={false} size="default" />
			</button>
		</motion.div>
	);
}
