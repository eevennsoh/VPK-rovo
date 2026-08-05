"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

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
	workingSessions: readonly AgentSession[];
}

function getWorkingSessionDescription(session: Readonly<AgentSession>): string | undefined {
	if (session.status === "waiting") {
		return session.waitingOn?.kind === "agent"
			? `Waiting for ${session.waitingOn.agentName}`
			: "Waiting for you";
	}
	return session.title;
}

function WorkingSessionsList({
	onClose,
	onOpenAgentChat,
	sessions,
}: Readonly<{
	onClose: (restoreFocus: boolean) => void;
	onOpenAgentChat: (agentId: string) => void;
	sessions: readonly AgentSession[];
}>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const items: readonly RichTextSuggestionMenuItem[] = sessions.map((session) => ({
		description: getWorkingSessionDescription(session),
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
		trailing: session.status === "running"
			? <Spinner label="" size="xs" variant="rainbow" />
			: <span className="text-xs text-text-subtle">Waiting</span>,
	}));

	const openSession = (item: RichTextSuggestionMenuItem) => {
		const session = sessions.find((candidate) => candidate.id === item.id);
		if (!session) return;
		onClose(false);
		onOpenAgentChat(session.agentId);
	};

	useEffect(() => {
		containerRef.current?.focus();

		const handlePointerDown = (event: PointerEvent) => {
			if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
				onClose(false);
			}
		};
		const handleDismissKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onClose(true);
			}
		};

		window.addEventListener("pointerdown", handlePointerDown, true);
		window.addEventListener("keydown", handleDismissKeyDown);
		return () => {
			window.removeEventListener("pointerdown", handlePointerDown, true);
			window.removeEventListener("keydown", handleDismissKeyDown);
		};
	}, [onClose]);

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
		<div
			className="w-full outline-none"
			onKeyDown={handleKeyDown}
			ref={containerRef}
			tabIndex={-1}
		>
			<RichTextSuggestionMenu
				className="rich-text-command-menu-borderless w-full!"
				emptyLabel="No agents working"
				items={items}
				onHover={setSelectedIndex}
				onSelect={openSession}
				selectedIndex={selectedIndex}
				title="Working agents"
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
	workingSessions,
}: Readonly<ActivityComposerContextPillsProps>) {
	const shouldReduceMotion = Boolean(useReducedMotion());
	const workingTriggerRef = useRef<HTMLButtonElement>(null);
	const shouldRestoreWorkingTriggerFocusRef = useRef(false);
	const [showWorkingSessions, setShowWorkingSessions] = useState(false);

	useEffect(() => {
		if (!showWorkingSessions && shouldRestoreWorkingTriggerFocusRef.current) {
			shouldRestoreWorkingTriggerFocusRef.current = false;
			workingTriggerRef.current?.focus();
		}
	}, [showWorkingSessions]);

	const closeWorkingSessions = useCallback((restoreFocus: boolean) => {
		shouldRestoreWorkingTriggerFocusRef.current = restoreFocus;
		setShowWorkingSessions(false);
	}, []);

	return (
		<motion.div
			animate="visible"
			className="mb-3 flex flex-wrap gap-2"
			data-jira-work-item-context-pills
			initial={shouldReduceMotion ? false : "hidden"}
			variants={PILL_GROUP_VARIANTS}
		>
			{showWorkingSessions && onOpenAgentChat ? (
				<WorkingSessionsList
					onClose={closeWorkingSessions}
					onOpenAgentChat={onOpenAgentChat}
					sessions={workingSessions}
				/>
			) : (
				<>
					{workingSessions.length > 0 && onOpenAgentChat ? (
						<RevealingPill>
							<ContextBarPill
								aria-label={`${workingSessions.length} agents working`}
								className="motion-reduce:transition-none"
								icon={<Spinner label="" size="xs" variant="rainbow" />}
								onClick={() => setShowWorkingSessions(true)}
								ref={workingTriggerRef}
							>
								{workingSessions.length} {workingSessions.length === 1 ? "agent" : "agents"} working
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
