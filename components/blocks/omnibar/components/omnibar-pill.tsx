"use client";

import { motion } from "motion/react";

import { RovoSparkleMark } from "@/components/ui-custom/rovo-sparkle";

import { OMNIBAR_CONTENT, resolveOmnibarTransition } from "../omnibar-motion";

export interface OmnibarPillProps {
	label: string;
	onActivate: () => void;
	shouldReduceMotion: boolean | null;
}

/**
 * Collapsed state: a black lozenge holding nothing but the Rovo sparkle.
 *
 * The black fill lives on the morphing surface above this, so the pill only centres the
 * canonical `RovoSparkleMark` (already `color.icon.inverse`) and fills whatever geometry the
 * surface is animating to. Hover is handled by the surface; the button exists so the pill is
 * a real click target with a name.
 */
export function OmnibarPill({
	label,
	onActivate,
	shouldReduceMotion,
}: Readonly<OmnibarPillProps>) {
	const transition = resolveOmnibarTransition(OMNIBAR_CONTENT, shouldReduceMotion);

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="size-full"
			data-slot="omnibar-pill"
			exit={{ opacity: 0, transition }}
			initial={{ opacity: 0 }}
			style={{ willChange: "opacity" }}
			transition={transition}
		>
			<button
				aria-label={label}
				className="flex size-full cursor-pointer items-center justify-center"
				onClick={onActivate}
				type="button"
			>
				<RovoSparkleMark active={false} selected={false} size="default" />
			</button>
		</motion.div>
	);
}
