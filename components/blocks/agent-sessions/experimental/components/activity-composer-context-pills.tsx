"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useState, type ReactNode } from "react";

import { ActivityComposerAgentContextPill } from "@/components/blocks/agent-sessions/experimental/components/activity-composer-agent-context-pill";
import { ActivityComposerSkillContextPill } from "@/components/blocks/agent-sessions/experimental/components/activity-composer-skill-context-pill";
import { StatusPill } from "@/components/blocks/agent-sessions/experimental/components/detail-field-editors";
import { ContextBarPill } from "@/components/ui-custom/context-bar/context-bar";
import { Icon } from "@/components/ui/icon";
import ProjectStatusIcon from "@atlaskit/icon/core/project-status";

const PILL_GROUP_VARIANTS = {
	hidden: {},
	visible: {
		transition: {
			delayChildren: 0.25, // duration-slow: let the composer finish repositioning first
			staggerChildren: 0.05, // duration-xxshort
		},
	},
} satisfies Variants;

const PILL_REVEAL_VARIANTS = {
	hidden: { opacity: 0, y: 8 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.15,
			ease: [0.4, 1, 0.6, 1],
		}, // duration-normal + ease-out-practical
	},
} satisfies Variants;

interface ActivityComposerContextPillsProps {
	onSelectAgent: (agentName: string) => void;
	onSelectSkill: (skillId: string) => void;
	onStatusChange: (status: string) => void;
	status: string;
}

function RevealingPill({ children }: Readonly<{ children: ReactNode }>) {
	const [isAnimating, setIsAnimating] = useState(false);

	return (
		<motion.div
			onAnimationComplete={() => setIsAnimating(false)}
			onAnimationStart={() => setIsAnimating(true)}
			style={isAnimating ? { willChange: "transform, opacity" } : undefined}
			variants={PILL_REVEAL_VARIANTS}
		>
			{children}
		</motion.div>
	);
}

/** Context shortcuts revealed after the planner review composer becomes sticky. */
export function ActivityComposerContextPills({
	onSelectAgent,
	onSelectSkill,
	onStatusChange,
	status,
}: Readonly<ActivityComposerContextPillsProps>) {
	const shouldReduceMotion = Boolean(useReducedMotion());

	return (
		<motion.div
			animate="visible"
			className="mb-3 flex flex-wrap gap-2"
			data-agent-sessions-context-pills
			initial={shouldReduceMotion ? false : "hidden"}
			variants={PILL_GROUP_VARIANTS}
		>
			<RevealingPill>
				<ActivityComposerAgentContextPill onSelectAgent={onSelectAgent} />
			</RevealingPill>
			<RevealingPill>
				<ActivityComposerSkillContextPill onSelectSkill={onSelectSkill} />
			</RevealingPill>
			<RevealingPill>
				<ContextBarPill
					className="gap-2 pr-2"
					icon={<Icon aria-hidden render={<ProjectStatusIcon label="" size="small" />} />}
					interactive={false}
				>
					Move to:
					<StatusPill onChange={onStatusChange} value={status} />
				</ContextBarPill>
			</RevealingPill>
		</motion.div>
	);
}
