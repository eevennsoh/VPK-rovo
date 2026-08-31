"use client";

import { motion } from "motion/react";

import { RovoSparkleMark } from "@/components/ui-custom/rovo-sparkle";
import { token } from "@/lib/tokens";

import { OMNIBAR_CONTENT, OMNIBAR_CONTENT_EXIT, resolveOmnibarTransition } from "../omnibar-motion";

export interface OmnibarPillProps {
	label: string;
	onActivate: () => void;
	/**
	 * Compact `tone="default"` leaves the morphing surface transparent so a dark
	 * leftover cannot sit under the composer. The pill then paints the floating
	 * Rovo button chrome itself — `bg-bg-neutral-bold` + overlay elevation — at the
	 * collapsed lozenge size, not `size-full` of a growing surface.
	 */
	paintChrome?: boolean;
	shouldReduceMotion: boolean | null;
}

/**
 * Collapsed state: a lozenge holding nothing but the Rovo sparkle.
 *
 * Inverse tone paints the fill on the morphing surface above this. Compact tone
 * paints the same Rovo-button chrome here so the surface can stay transparent.
 * Either way the glyph is the canonical `RovoSparkleMark` in its brand-color
 * format — the same four-quadrant mark the catalog `RovoSparkle` trigger shows
 * when active.
 */
export function OmnibarPill({
	label,
	onActivate,
	paintChrome = false,
	shouldReduceMotion,
}: Readonly<OmnibarPillProps>) {
	const enterTransition = resolveOmnibarTransition(OMNIBAR_CONTENT, shouldReduceMotion);
	const exitTransition = resolveOmnibarTransition(OMNIBAR_CONTENT_EXIT, shouldReduceMotion);

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="flex size-full items-center justify-center"
			data-slot="omnibar-pill"
			exit={{ opacity: 0, transition: exitTransition }}
			initial={{ opacity: 0 }}
			// Position only — a size `layout` here would scale the sparkle during the morph.
			layout="position"
			style={{ willChange: "opacity" }}
			transition={enterTransition}
		>
			<button
				aria-label={label}
				className={
					paintChrome
						? "flex h-7 w-24 cursor-pointer items-center justify-center rounded-full bg-bg-neutral-bold"
						: "flex size-full cursor-pointer items-center justify-center"
				}
				onClick={onActivate}
				style={paintChrome ? { boxShadow: token("elevation.shadow.overlay") } : undefined}
				type="button"
			>
				<RovoSparkleMark active selected={false} size="default" />
			</button>
		</motion.div>
	);
}
