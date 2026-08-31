"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { AGENT_SESSION_ARRIVAL_TRANSITION } from "./agent-session-arrival-motion";

/** A newly synced notch rests in the same emphasized state hover reveals. */
const NOTCH_EMPHASIS = "scale-x-[1.6] bg-icon";

/** Reviewed notches stay quiet until their shared row is hovered or focused. */
const NOTCH_AT_REST = cn(
	"bg-icon-subtlest",
	"group-hover/notch:scale-x-[1.6] group-hover/notch:bg-icon",
	"group-has-[:focus-visible]/notch:scale-x-[1.6] group-has-[:focus-visible]/notch:bg-icon",
);

/** The canonical 12×2px mark shared by the Small variant and collapsed column. */
export function AgentSessionNotchMark({
	isArriving = false,
	isNew = false,
}: Readonly<{
	isArriving?: boolean;
	isNew?: boolean;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const shouldPlayArrival = isArriving && !shouldReduceMotion;

	return (
		<motion.span
			animate={shouldPlayArrival ? { scaleX: 1 } : undefined}
			aria-hidden="true"
			className={cn(
				"h-0.5 w-3 rounded-full transition-[background-color,scale] duration-xxshort ease-out-practical",
				"motion-reduce:transition-none",
				isNew ? NOTCH_EMPHASIS : NOTCH_AT_REST,
			)}
			initial={shouldPlayArrival ? { scaleX: 0 } : false}
			style={{ willChange: shouldPlayArrival ? "transform" : undefined }}
			transition={AGENT_SESSION_ARRIVAL_TRANSITION}
		/>
	);
}
