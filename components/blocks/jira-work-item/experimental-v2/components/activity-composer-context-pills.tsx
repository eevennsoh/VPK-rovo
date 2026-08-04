"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import type { SkillsDirectorySkill } from "@/app/data/directory";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { AgentSession } from "@/components/blocks/jira-work-item/data/session-state";
import { ActivityComposerAgentContextPill } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-composer-agent-context-pill";
import { ActivityComposerSkillContextPill } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-composer-skill-context-pill";
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

function RunningSessionsList({
	onClose,
	onOpenAgentChat,
	sessions,
}: Readonly<{
	onClose: () => void;
	onOpenAgentChat: (agentId: string) => void;
	sessions: readonly AgentSession[];
}>) {
	const containerRef = useRef<HTMLDivElement>(null);
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
		onClose();
		onOpenAgentChat(session.agentId);
	};

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			onClose();
		} else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			const step = event.key === "ArrowDown" ? 1 : -1;
			setSelectedIndex((index) => (index + step + items.length) % items.length);
		} else if (event.key === "Enter") {
			event.preventDefault();
			openSession(items[selectedIndex]);
		}
	};

	return (
		<div
			className="w-full outline-none"
			onKeyDown={handleKeyDown}
			ref={containerRef}
			tabIndex={-1}
		>
			<RichTextSuggestionMenu
				className="w-full!"
				emptyLabel="No agents running"
				items={items}
				onHover={setSelectedIndex}
				onSelect={openSession}
				selectedIndex={selectedIndex}
				title="Running agents"
			/>
		</div>
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
	const runningTriggerRef = useRef<HTMLButtonElement>(null);
	const shouldRestoreRunningTriggerFocusRef = useRef(false);
	const [showRunningSessions, setShowRunningSessions] = useState(false);

	useEffect(() => {
		if (!showRunningSessions && shouldRestoreRunningTriggerFocusRef.current) {
			shouldRestoreRunningTriggerFocusRef.current = false;
			runningTriggerRef.current?.focus();
		}
	}, [showRunningSessions]);

	const closeRunningSessions = () => {
		shouldRestoreRunningTriggerFocusRef.current = true;
		setShowRunningSessions(false);
	};

	return (
		<motion.div
			animate="visible"
			className="mb-3 flex flex-wrap gap-2"
			data-jira-work-item-context-pills
			initial={shouldReduceMotion ? false : "hidden"}
			variants={PILL_GROUP_VARIANTS}
		>
			{showRunningSessions && onOpenAgentChat ? (
				<RunningSessionsList
					onClose={closeRunningSessions}
					onOpenAgentChat={onOpenAgentChat}
					sessions={runningSessions}
				/>
			) : (
				<>
					{runningSessions.length > 0 && onOpenAgentChat ? (
						<RevealingPill>
							<ContextBarPill
								aria-label={`${runningSessions.length} running agents`}
								className="motion-reduce:transition-none"
								icon={<Spinner label="" size="xs" variant="rainbow" />}
								onClick={() => setShowRunningSessions(true)}
								ref={runningTriggerRef}
							>
								{runningSessions.length} Running
							</ContextBarPill>
						</RevealingPill>
					) : null}
					<RevealingPill>
						<ActivityComposerAgentContextPill onInvokeAgent={onInvokeAgent} />
					</RevealingPill>
					<RevealingPill>
						<ActivityComposerSkillContextPill onInvokeSkill={onInvokeSkill} />
					</RevealingPill>
				</>
			)}
		</motion.div>
	);
}
