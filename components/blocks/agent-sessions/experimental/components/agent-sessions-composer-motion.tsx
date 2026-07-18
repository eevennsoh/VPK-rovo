"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const COMPOSER_REPOSITION_TRANSITION = {
	duration: 0.25,
	ease: [0.4, 0, 0, 1],
} satisfies Transition; // duration-slow + ease-in-out

const REDUCED_MOTION_TRANSITION = { duration: 0 } satisfies Transition;

interface AgentSessionsComposerMotionProps {
	children: ReactNode;
	className?: string;
}

/** Shared layout identity for the planner composer becoming the sticky composer. */
export function AgentSessionsComposerMotion({
	children,
	className,
}: Readonly<AgentSessionsComposerMotionProps>) {
	const shouldReduceMotion = Boolean(useReducedMotion());
	const [isAnimating, setIsAnimating] = useState(false);

	return (
		<motion.div
			className={cn("min-w-0", className)}
			layoutId="agent-sessions-composer"
			onLayoutAnimationStart={() => setIsAnimating(true)}
			onLayoutAnimationComplete={() => setIsAnimating(false)}
			style={isAnimating && !shouldReduceMotion ? { willChange: "transform" } : undefined}
			transition={shouldReduceMotion ? REDUCED_MOTION_TRANSITION : COMPOSER_REPOSITION_TRANSITION}
		>
			{children}
		</motion.div>
	);
}
