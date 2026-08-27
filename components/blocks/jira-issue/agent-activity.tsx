"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import {
	AgentAssignment,
	type AgentAssignmentAgent,
} from "@/components/blocks/agent-assignment";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import { summarizeJiraIssueAgentActivities } from "@/components/blocks/jira-issue/agent-activity-model";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { PixelLoader } from "@/components/ui-custom/pixel-loader";
import { Shimmer } from "@/components/ui-custom/shimmer";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { IconTile } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type JiraIssueAgentActivityMode = "none" | "working" | "awaiting-input" | "completed";
export type JiraIssueAgentActivityState = "working" | "awaiting-input" | "completed";

export interface JiraIssueAgentActivity {
	id: string;
	name: string;
	avatarSrc?: string;
	agentBrandName?: ThirdPartyLogoName;
	label: string;
	labels?: readonly string[];
	message?: string;
	/** Stable start time supplied by a real running session. */
	startedAtMs?: number;
	/** Optional seeded runtime for demos; active timers continue from this value. */
	initialElapsedSeconds?: number;
	cycleIntervalJitterMs?: number;
	cycleIntervalMs?: number;
	question?: QuestionCardQuestion;
	state: JiraIssueAgentActivityState;
}

const JIRA_ISSUE_MOTION_ENTER: Transition = { duration: 0.15, ease: [0.4, 1, 0.6, 1] }; // duration-normal + ease-out-practical
const JIRA_ISSUE_MOTION_EXIT: Transition = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] }; // duration-fast + ease-in
const JIRA_ISSUE_MOTION_LAYOUT: Transition = { duration: 0.2, ease: [0.4, 0, 0, 1] }; // duration-medium + ease-in-out
const JIRA_ISSUE_MOTION_REDUCED: Transition = { duration: 0 };
const JIRA_ISSUE_MOTION_STYLE: CSSProperties = { willChange: "transform, opacity" };
const JIRA_ISSUE_AGENT_LABEL_TRANSITION = { duration: 0.2, ease: "easeOut" } as const;
const JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS = 5200;
const JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS = 1800;
const JIRA_ISSUE_AGENT_SHIMMER_DURATION = 1.4;
const JIRA_ISSUE_AGENT_SHIMMER_SPREAD = 2;

function getJiraIssueLayoutTransition(shouldReduceMotion: boolean | null): Transition {
	return shouldReduceMotion ? JIRA_ISSUE_MOTION_REDUCED : JIRA_ISSUE_MOTION_LAYOUT;
}

function getJiraIssuePresenceMotion(shouldReduceMotion: boolean | null) {
	if (shouldReduceMotion) {
		return {
			animate: undefined,
			exit: undefined,
			initial: false,
		} as const;
	}

	return {
		animate: { opacity: 1, y: 0, transition: JIRA_ISSUE_MOTION_ENTER },
		exit: { opacity: 0, y: -4, transition: JIRA_ISSUE_MOTION_EXIT },
		initial: { opacity: 0, y: -4 },
	} as const;
}

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

function getJiraIssueAgentCycleDelay(intervalMs: number, jitterMs: number): number {
	return Math.max(1000, intervalMs) + Math.round(Math.random() * Math.max(0, jitterMs));
}

function getJiraIssueAgentWorkingLabels(activity: JiraIssueAgentActivity | undefined): readonly string[] {
	if (!activity) {
		return [];
	}

	const trimmedLabel = activity.label.trim();
	const labels = trimmedLabel ? [trimmedLabel] : [];

	for (const workingLabel of activity.labels ?? []) {
		if (workingLabel !== trimmedLabel) {
			labels.push(workingLabel);
		}
	}

	return labels;
}

function toAgentAssignmentAgent(activity: JiraIssueAgentActivity): AgentAssignmentAgent {
	return {
		id: activity.id,
		name: activity.name,
		byline: "",
		...(activity.avatarSrc ? { avatarSrc: activity.avatarSrc } : {}),
		...(activity.agentBrandName ? { brandName: activity.agentBrandName } : {}),
		status: activity.label,
		statusLabel: activity.label,
	};
}

function toSelectorAgent(activity: JiraIssueAgentActivity): AgentSelectorAgent {
	return {
		id: activity.id,
		name: activity.name,
		byline: "",
		...(activity.avatarSrc ? { avatarSrc: activity.avatarSrc } : {}),
		...(activity.agentBrandName ? { brandName: activity.agentBrandName } : {}),
	};
}

function toActivityFromAssignedAgent(agent: AgentAssignmentAgent): JiraIssueAgentActivity {
	return {
		id: agent.id,
		name: agent.name,
		...(agent.avatarSrc ? { avatarSrc: agent.avatarSrc } : {}),
		...(agent.brandName ? { agentBrandName: agent.brandName } : {}),
		label: agent.statusLabel,
		state: "working",
	};
}

function JiraIssueAgentActivityRow({
	activities,
	onOpenChange,
	onViewChat,
	usesStrokeChrome,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	onOpenChange?: (open: boolean) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	usesStrokeChrome: boolean;
}>) {
	const summary = summarizeJiraIssueAgentActivities(activities);
	const isSingleAgent = summary.activityCount === 1;
	const isAwaitingInput = summary.priorityState === "awaiting-input";
	const featuredActivity = summary.featuredActivityIndex !== null
		? activities[summary.featuredActivityIndex]
		: undefined;
	const shouldCycleSingleAgentLabel = isSingleAgent && !isAwaitingInput;
	const canOpenChat = isSingleAgent && Boolean(onViewChat);
	const activityKey = activities.map((activity) => activity.id).join("\n");
	const [assignedIdDraft, setAssignedIdDraft] = useState<{
		key: string;
		ids: readonly string[];
	} | null>(null);
	const assignedIds = assignedIdDraft?.key === activityKey
		? assignedIdDraft.ids
		: activities.map((activity) => activity.id);
	const catalogAgents = useMemo(() => {
		const extras = activities
			.filter((activity) => !ROVO_AGENT_SELECTOR_AGENTS.some((agent) => agent.id === activity.id))
			.map(toSelectorAgent);
		return extras.length > 0
			? [...extras, ...ROVO_AGENT_SELECTOR_AGENTS]
			: ROVO_AGENT_SELECTOR_AGENTS;
	}, [activities]);
	const assignedAgents = assignedIds.flatMap((agentId): AgentAssignmentAgent[] => {
		const activity = activities.find((candidate) => candidate.id === agentId);
		if (activity) {
			return [toAgentAssignmentAgent(activity)];
		}
		const catalogAgent = catalogAgents.find((candidate) => candidate.id === agentId);
		return catalogAgent
			? [{ ...catalogAgent, statusLabel: "Assigned" }]
			: [];
	});

	const rowButton = (
		<button
			type="button"
			aria-label={
				canOpenChat
					? `Open ${activities[0]?.name ?? "agent"} in Rovo chat: ${summary.label}`
					: isSingleAgent
						? `${activities[0]?.name ?? "Agent"}: ${summary.label}`
						: `${summary.activityCount} agents: ${summary.label}`
			}
			data-slot="jira-issue-agent-row"
			onClick={canOpenChat ? () => onViewChat?.(activities[0]) : undefined}
			className="flex h-6 w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
		>
			<div className={cn("flex min-w-0 flex-1 items-center", usesStrokeChrome ? "gap-1.5" : "gap-2")}>
				{featuredActivity ? (
					<AgentAvatarVisual
						avatarClassName="shrink-0"
						avatarSrc={featuredActivity.avatarSrc}
						brandName={featuredActivity.agentBrandName}
						fallbackText={getAgentInitial(featuredActivity.name)}
						label={featuredActivity.name}
						sizePx={16}
					/>
				) : usesStrokeChrome ? (
					<IconTile
						aria-hidden
						as="span"
						className="text-icon-subtle"
						icon={<AiAgentIcon label="" size="small" />}
						iconSize="small"
						label=""
						size="xxsmall"
						variant="transparent"
					/>
				) : (
					<span
						className="ml-px grid size-4 shrink-0 place-items-center text-icon-subtle"
						aria-hidden="true"
					>
						<AiAgentIcon label="" />
					</span>
				)}
				{isAwaitingInput ? (
					<span
						className={cn(
							"flex min-w-0 flex-1 items-baseline overflow-hidden text-text-subtlest",
							usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
						)}
					>
						<Shimmer
							as="span"
							className={cn(
								"block min-w-0 truncate",
								usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
							)}
							duration={JIRA_ISSUE_AGENT_SHIMMER_DURATION}
							spread={JIRA_ISSUE_AGENT_SHIMMER_SPREAD}
							wave={false}
						>
							{summary.label}
						</Shimmer>
						<AnimatedDots className={usesStrokeChrome ? "[&>span]:text-xs" : undefined} />
					</span>
				) : shouldCycleSingleAgentLabel ? (
					<JiraIssueCyclingAgentLabel
						cycleIntervalJitterMs={activities[0]?.cycleIntervalJitterMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS}
						cycleIntervalMs={activities[0]?.cycleIntervalMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS}
						labels={getJiraIssueAgentWorkingLabels(activities[0])}
						usesStrokeChrome={usesStrokeChrome}
					/>
				) : (
					<span
						className={cn(
							"block min-w-0 flex-1 truncate text-text-subtlest",
							usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
						)}
					>
						{summary.label}
					</span>
				)}
			</div>
			{isAwaitingInput ? (
				<span
					className={cn(
						"grid shrink-0 place-items-center text-icon-information",
						usesStrokeChrome ? "size-4" : "-my-1 size-6",
					)}
					aria-hidden="true"
				>
					<StatusInformationIcon label="" size="small" color="currentColor" />
				</span>
			) : (
				<span
					className={cn(
						"grid shrink-0 place-items-center text-icon",
						usesStrokeChrome ? "size-4" : "-my-1 size-6",
					)}
					aria-hidden="true"
				>
					{usesStrokeChrome ? (
						<PixelLoader className="justify-center" pattern="diagonal-top-left" shape="dot" size="small" />
					) : (
						<Spinner label="" size="sm" />
					)}
				</span>
			)}
		</button>
	);

	if (isSingleAgent) {
		return rowButton;
	}

	return (
		<AgentAssignment
			agents={catalogAgents}
			assignedAgents={assignedAgents}
			onAssignedAgentIdsChange={(agentIds) => {
				setAssignedIdDraft({ ids: agentIds, key: activityKey });
			}}
			onAssignedAgentSelect={(agent) => {
				const activity = activities.find((candidate) => candidate.id === agent.id);
				onViewChat?.(activity ?? toActivityFromAssignedAgent(agent));
			}}
			onOpenChange={onOpenChange}
			openMode="hover"
			positionerClassName="z-[575]"
			trigger={rowButton}
		/>
	);
}

function JiraIssueCyclingAgentLabelContent({
	cycleIntervalJitterMs,
	cycleIntervalMs,
	labels,
	usesStrokeChrome,
}: Readonly<{
	cycleIntervalJitterMs: number;
	cycleIntervalMs: number;
	labels: readonly string[];
	usesStrokeChrome: boolean;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const [labelIndex, setLabelIndex] = useState(0);
	const label = labels[labelIndex % labels.length] ?? "";

	useEffect(() => {
		if (shouldReduceMotion || labels.length <= 1) {
			return undefined;
		}

		let timeoutId: number | undefined;
		const queueNextCycle = () => {
			timeoutId = window.setTimeout(() => {
				setLabelIndex((currentIndex) => (currentIndex + 1) % labels.length);
				queueNextCycle();
			}, getJiraIssueAgentCycleDelay(cycleIntervalMs, cycleIntervalJitterMs));
		};

		queueNextCycle();

		return () => {
			if (timeoutId !== undefined) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [cycleIntervalJitterMs, cycleIntervalMs, labels.length, shouldReduceMotion]);

	return (
		<span
			className={cn(
				"block min-w-0 flex-1 overflow-hidden text-text-subtlest",
				usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
			)}
		>
			<span className={cn("block min-w-0 overflow-hidden", usesStrokeChrome ? "min-h-4" : "min-h-5")}>
				<AnimatePresence mode="wait">
					<motion.span
						key={label}
						animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
						className={cn("block min-w-0 truncate", usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5")}
						exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
						initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
						transition={JIRA_ISSUE_AGENT_LABEL_TRANSITION}
					>
						{label}
					</motion.span>
				</AnimatePresence>
			</span>
		</span>
	);
}

function JiraIssueCyclingAgentLabel(props: Readonly<{
	cycleIntervalJitterMs: number;
	cycleIntervalMs: number;
	labels: readonly string[];
	usesStrokeChrome: boolean;
}>) {
	return (
		<JiraIssueCyclingAgentLabelContent
			key={props.labels.join("\n")}
			{...props}
		/>
	);
}

export function JiraIssueAgentActivityRows({
	activities,
	onOpenChange,
	onViewChat,
	shouldReduceMotion,
	usesStrokeChrome,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	onOpenChange?: (open: boolean) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	shouldReduceMotion: boolean | null;
	usesStrokeChrome: boolean;
}>) {
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);
	const hasActivities = activities.length > 0;
	const summary = hasActivities ? summarizeJiraIssueAgentActivities(activities) : null;

	return (
		<motion.div
			className={cn("flex w-full min-w-0 flex-col overflow-hidden", hasActivities && "px-1 py-1")}
			layout={shouldReduceMotion ? false : "position"}
			transition={layoutTransition}
		>
			<AnimatePresence initial={false} mode="popLayout">
				{summary ? (
					<motion.div
						key={`${summary.priorityState}-${summary.activityCount}`}
						animate={presenceMotion.animate}
						className="min-w-0"
						exit={presenceMotion.exit}
						initial={presenceMotion.initial}
						layout={shouldReduceMotion ? false : "position"}
						style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
						transition={layoutTransition}
					>
						<JiraIssueAgentActivityRow
							activities={activities}
							onOpenChange={onOpenChange}
							onViewChat={onViewChat}
							usesStrokeChrome={usesStrokeChrome}
						/>
					</motion.div>
				) : null}
			</AnimatePresence>
		</motion.div>
	);
}
