"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useState, type KeyboardEvent, type ReactNode } from "react";

import type { SkillsDirectorySkill } from "@/app/data/directory";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { AgentSession } from "@/components/blocks/jira-work-item/data/session-state";
import { ActivityComposerAgentContextPill } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-composer-agent-context-pill";
import { ActivityComposerSkillContextPill } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-composer-skill-context-pill";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { ContextBarPill } from "@/components/ui-custom/context-bar";
import {
	RichTextSuggestionMenu,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";

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
	onInvokeAgent: (agent: Pick<AgentSelectorAgent, "id" | "name" | "avatarSrc" | "brandName">) => void;
	onInvokeSkill: (skill: SkillsDirectorySkill) => void;
	onOpenAgentChat?: (agentId: string) => void;
	runningSessions: readonly AgentSession[];
}

function RunningSessionsPill({
	onOpenAgentChat,
	sessions,
}: Readonly<{
	onOpenAgentChat: (agentId: string) => void;
	sessions: readonly AgentSession[];
}>) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const items: readonly RichTextSuggestionMenuItem[] = sessions.map((session) => ({
		description: session.title,
		id: session.id,
		icon: null,
		label: session.agentName,
		leadingVisual: (
			<AgentAvatarVisual
				avatarSrc={session.agentAvatarSrc}
				fallbackText={session.agentName}
				sizePx={24}
			/>
		),
		persistentDescription: true,
		trailing: <Spinner label="" size="xs" variant="rainbow" />,
	}));

	const openSession = (item: RichTextSuggestionMenuItem) => {
		const session = sessions.find((candidate) => candidate.id === item.id);
		if (!session) return;
		setIsOpen(false);
		onOpenAgentChat(session.agentId);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			const step = event.key === "ArrowDown" ? 1 : -1;
			setSelectedIndex((index) => (index + step + items.length) % items.length);
		} else if (event.key === "Enter") {
			event.preventDefault();
			openSession(items[selectedIndex]);
		}
	};

	return (
		<Popover
			onOpenChange={(nextOpen) => {
				setIsOpen(nextOpen);
				setSelectedIndex(0);
			}}
			open={isOpen}
		>
			<PopoverTrigger
				render={(
					<ContextBarPill
						aria-label={`${sessions.length} running agents`}
						className="motion-reduce:transition-none"
						icon={<Spinner label="" size="xs" variant="rainbow" />}
					/>
				)}
			>
				{sessions.length} Running
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-[320px] gap-0 rounded-xl p-0"
				onKeyDown={handleKeyDown}
				positionerClassName="z-[503]"
				side="top"
				sideOffset={8}
			>
				<RichTextSuggestionMenu
					className="rich-text-command-menu-borderless w-full!"
					emptyLabel="No agents running"
					items={items}
					onHover={setSelectedIndex}
					onSelect={openSession}
					selectedIndex={selectedIndex}
					title="Running agents"
				/>
			</PopoverContent>
		</Popover>
	);
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
	onInvokeAgent,
	onInvokeSkill,
	onOpenAgentChat,
	runningSessions,
}: Readonly<ActivityComposerContextPillsProps>) {
	const shouldReduceMotion = Boolean(useReducedMotion());

	return (
		<motion.div
			animate="visible"
			className="mb-3 flex flex-wrap gap-2"
			data-jira-work-item-context-pills
			initial={shouldReduceMotion ? false : "hidden"}
			variants={PILL_GROUP_VARIANTS}
		>
			{runningSessions.length > 0 && onOpenAgentChat ? (
				<RevealingPill>
					<RunningSessionsPill
						onOpenAgentChat={onOpenAgentChat}
						sessions={runningSessions}
					/>
				</RevealingPill>
			) : null}
			<RevealingPill>
				<ActivityComposerAgentContextPill onInvokeAgent={onInvokeAgent} />
			</RevealingPill>
			<RevealingPill>
				<ActivityComposerSkillContextPill onInvokeSkill={onInvokeSkill} />
			</RevealingPill>
		</motion.div>
	);
}
