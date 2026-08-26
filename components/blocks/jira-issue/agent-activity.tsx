"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";

import {
	AgentList,
	type AgentListCustomFlyoutActions,
	type AgentListItem,
} from "@/components/blocks/agent-list";
import { AgentStates } from "@/components/blocks/agent-states";
import { summarizeJiraIssueAgentActivities } from "@/components/blocks/jira-issue/agent-activity-model";
import type { QuestionCardAnswers, QuestionCardQuestion } from "@/components/blocks/question-card/types";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { Shimmer } from "@/components/ui-custom/shimmer";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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

function toAgentListItem(activity: JiraIssueAgentActivity): AgentListItem {
	return {
		agent: {
			avatarSrc: activity.avatarSrc,
			brandName: activity.agentBrandName,
			id: activity.id,
			name: activity.name,
		},
		elapsedSeconds: activity.initialElapsedSeconds,
		id: activity.id,
		startedAtMs: activity.startedAtMs,
		state: activity.state === "awaiting-input" ? "needs-input" : "running",
		title: activity.label,
	};
}

function JiraIssueAgentActivityRow({
	activities,
	onOpenChange,
	onQuestionSubmit,
	onViewChat,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	onOpenChange?: (open: boolean) => void;
	onQuestionSubmit?: (activity: JiraIssueAgentActivity, answers: QuestionCardAnswers) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
}>) {
	const [flyoutOpen, setFlyoutOpen] = useState(false);
	const summary = summarizeJiraIssueAgentActivities(activities);
	const isSingleAgent = summary.activityCount === 1;
	const agentListItems = activities.map(toAgentListItem);
	const isAwaitingInput = summary.priorityState === "awaiting-input";
	const featuredActivity = summary.featuredActivityIndex !== null
		? activities[summary.featuredActivityIndex]
		: undefined;
	const shouldCycleSingleAgentLabel = isSingleAgent && !isAwaitingInput;

	function handleOpenChange(open: boolean) {
		setFlyoutOpen(open);
		onOpenChange?.(open);
	}

	function handleAgentListView(item: AgentListItem) {
		const activity = activities.find((candidate) => candidate.id === item.id);
		if (!activity) {
			return;
		}

		handleOpenChange(false);
		onViewChat?.(activity);
	}

	function renderAgentFlyout(
		item: AgentListItem,
		{ close }: AgentListCustomFlyoutActions,
	) {
		const activity = activities.find((candidate) => candidate.id === item.id);
		if (!activity) {
			return null;
		}

		return (
			<AgentStates
				agent={{
					avatarSrc: activity.avatarSrc,
					brandName: activity.agentBrandName,
					id: activity.id,
					name: activity.name,
				}}
				initialElapsedSeconds={activity.initialElapsedSeconds}
				message={activity.message}
				onQuestionSubmit={onQuestionSubmit
					? (answers) => {
						close();
						handleOpenChange(false);
						onQuestionSubmit(activity, answers);
					}
					: undefined}
				onView={onViewChat
					? () => {
						close();
						handleAgentListView(item);
					}
					: undefined}
				question={activity.question}
				startedAtMs={activity.startedAtMs}
				state={activity.state}
			/>
		);
	}

	const trigger = (
		<button
			type="button"
			aria-expanded={isSingleAgent ? undefined : flyoutOpen}
			aria-label={
				isSingleAgent
					? onViewChat
						? `Open ${activities[0]?.name ?? "agent"} in Rovo chat: ${summary.label}`
						: `Show ${activities[0]?.name ?? "agent"}: ${summary.label}`
					: `Show ${summary.activityCount} agents: ${summary.label}`
			}
			data-slot="jira-issue-agent-row"
			onClick={isSingleAgent
				? () => {
					if (onViewChat) {
						onViewChat(activities[0]);
						return;
					}
					handleOpenChange(true);
				}
				: () => handleOpenChange(true)}
			className="flex h-6 w-full min-w-0 items-center justify-between gap-2 rounded-b-[6px] rounded-t-sm px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
		>
			<div className="flex min-w-0 flex-1 items-center gap-2">
				{featuredActivity ? (
					<AgentAvatarVisual
						avatarClassName="shrink-0"
						avatarSrc={featuredActivity.avatarSrc}
						brandName={featuredActivity.agentBrandName}
						fallbackText={getAgentInitial(featuredActivity.name)}
						label={featuredActivity.name}
						sizePx={16}
					/>
				) : (
					<span className="ml-px grid size-4 shrink-0 place-items-center text-text-subtlest" aria-hidden="true">
						<AiAgentIcon label="" />
					</span>
				)}
				{isAwaitingInput ? (
					<span className="flex min-w-0 flex-1 items-baseline overflow-hidden text-sm leading-5 text-text-subtlest">
						<Shimmer
							as="span"
							className="block min-w-0 truncate text-sm leading-5"
							duration={JIRA_ISSUE_AGENT_SHIMMER_DURATION}
							spread={JIRA_ISSUE_AGENT_SHIMMER_SPREAD}
							wave={false}
						>
							{summary.label}
						</Shimmer>
						<AnimatedDots />
					</span>
				) : shouldCycleSingleAgentLabel ? (
					<JiraIssueCyclingAgentLabel
						cycleIntervalJitterMs={activities[0]?.cycleIntervalJitterMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS}
						cycleIntervalMs={activities[0]?.cycleIntervalMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS}
						labels={getJiraIssueAgentWorkingLabels(activities[0])}
					/>
				) : (
					<span className="block min-w-0 flex-1 truncate text-sm leading-5 text-text-subtlest">
						{summary.label}
					</span>
				)}
			</div>
			{isAwaitingInput ? (
				<span className="-my-1 grid size-6 shrink-0 place-items-center text-icon-information" aria-hidden="true">
					<StatusInformationIcon label="" size="small" color="currentColor" />
				</span>
			) : (
				<span className="-my-1 grid size-6 shrink-0 place-items-center text-icon" aria-hidden="true">
					<Spinner label="" size="sm" />
				</span>
			)}
		</button>
	);

	if (isSingleAgent && featuredActivity) {
		return (
			<HoverCard open={flyoutOpen} onOpenChange={handleOpenChange}>
				<HoverCardTrigger closeDelay={80} delay={120} render={trigger} />
				<HoverCardContent
					align="start"
					alignOffset={0}
					className="w-auto max-w-[calc(100vw-48px)] bg-transparent p-0 shadow-none data-ending-style:transition-none"
					positionerClassName="z-[575] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']"
					side="right"
					sideOffset={8}
				>
					{renderAgentFlyout(agentListItems[0], { close: () => handleOpenChange(false) })}
				</HoverCardContent>
			</HoverCard>
		);
	}

	return (
		<HoverCard open={flyoutOpen} onOpenChange={handleOpenChange}>
			<HoverCardTrigger closeDelay={80} delay={120} render={trigger} />
			<HoverCardContent
				align="start"
				alignOffset={0}
				className="w-[320px] max-w-[calc(100vw-48px)] bg-transparent p-0 shadow-none data-ending-style:transition-none"
				positionerClassName="z-[575] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']"
				side="right"
				sideOffset={8}
			>
				<AgentList
					className="w-full border-0 bg-surface-overlay shadow-2xl"
					flyout="none"
					items={agentListItems}
					onView={handleAgentListView}
					renderFlyout={renderAgentFlyout}
					variant="compact"
				/>
			</HoverCardContent>
		</HoverCard>
	);
}

function JiraIssueCyclingAgentLabelContent({
	cycleIntervalJitterMs,
	cycleIntervalMs,
	labels,
}: Readonly<{
	cycleIntervalJitterMs: number;
	cycleIntervalMs: number;
	labels: readonly string[];
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
		<span className="block min-w-0 flex-1 overflow-hidden text-sm leading-5 text-text-subtlest">
			<span className="block min-h-5 min-w-0 overflow-hidden">
				<AnimatePresence mode="wait">
					<motion.span
						key={label}
						animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
						className="block min-w-0 truncate text-sm leading-5"
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
	onQuestionSubmit,
	onViewChat,
	shouldReduceMotion,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	onOpenChange?: (open: boolean) => void;
	onQuestionSubmit?: (activity: JiraIssueAgentActivity, answers: QuestionCardAnswers) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	shouldReduceMotion: boolean | null;
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
							onQuestionSubmit={onQuestionSubmit}
							onViewChat={onViewChat}
						/>
					</motion.div>
				) : null}
			</AnimatePresence>
		</motion.div>
	);
}
