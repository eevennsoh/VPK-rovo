"use client";

import { LayoutGroup, motion, useReducedMotion, type Transition } from "motion/react";
import { useState, type ReactNode } from "react";

import { usePanelLayout } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import { cn } from "@/lib/utils";

const COMPOSER_REPOSITION_TRANSITION = {
	duration: 0.25,
	ease: [0.4, 0, 0, 1],
} satisfies Transition; // duration-slow + ease-in-out

const REDUCED_MOTION_TRANSITION = { duration: 0 } satisfies Transition;

interface JiraWorkItemComposerMotionProps {
	children: ReactNode;
	className?: string;
	placement: "planner" | "sticky";
}

/** Shared layout identity for the planner composer becoming the sticky composer. */
export function JiraWorkItemComposerMotion({
	children,
	className,
	placement,
}: Readonly<JiraWorkItemComposerMotionProps>) {
	const shouldReduceMotion = Boolean(useReducedMotion());
	const { metadataLayoutAnimating } = usePanelLayout();
	const [isAnimating, setIsAnimating] = useState(false);

	return (
		<LayoutGroup inherit="id">
			<motion.div
				className={cn("min-w-0", className)}
				layout={metadataLayoutAnimating ? false : "position"}
				layoutDependency={placement}
				layoutId={metadataLayoutAnimating ? undefined : "jira-work-item-composer"}
				onLayoutAnimationStart={() => setIsAnimating(true)}
				onLayoutAnimationComplete={() => setIsAnimating(false)}
				style={isAnimating && !shouldReduceMotion ? { willChange: "transform" } : undefined}
				transition={shouldReduceMotion ? REDUCED_MOTION_TRANSITION : COMPOSER_REPOSITION_TRANSITION}
			>
				{children}
			</motion.div>
		</LayoutGroup>
	);
}
