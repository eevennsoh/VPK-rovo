"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";

import { AgentCardHeader } from "@/components/blocks/agent-card";
import { JiraIssueCountBadge } from "@/components/blocks/jira-issue/count-badge";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { PromptInputButton, PromptInputTextarea } from "@/components/ui-custom/prompt-input";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export type JiraIssueAgentActivityMode = "none" | "working" | "awaiting-input" | "completed";
export type JiraIssueAgentActivityState = "working" | "awaiting-input" | "completed";

export interface JiraIssueAgentActivity {
	id: string;
	name: string;
	avatarSrc?: string;
	label: string;
	labels?: readonly string[];
	cycleIntervalJitterMs?: number;
	cycleIntervalMs?: number;
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
const JIRA_ISSUE_AGENT_WORKING_LABELS = [
	"Figuring out which services are affected",
	"Checking dependent components",
	"Reviewing linked work items",
	"Mapping owners and handoffs",
	"Preparing the next update",
] as const;
const JIRA_ISSUE_AGENT_PANEL_MESSAGES = {
	"dependency-mapper": "On it. I am checking the linked component dependencies and will write the handoff notes back into this work item.",
	"service-impact-agent": "On it. I am digging into the affected services and will add a clear service impact summary inside this work item.",
} as const;
const JIRA_ISSUE_AGENT_PANEL_FALLBACK_MESSAGE =
	"On it. I am reviewing the connected work and will add the next update inside this work item.";

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

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

function getJiraIssueAgentCycleDelay(intervalMs: number, jitterMs: number): number {
	return Math.max(1000, intervalMs) + Math.round(Math.random() * Math.max(0, jitterMs));
}

function getJiraIssueAgentWorkingLabels(activity: JiraIssueAgentActivity): readonly string[] {
	const trimmedLabel = activity.label.trim();
	const labels = trimmedLabel ? [trimmedLabel] : [];
	const workingLabels = activity.labels ?? JIRA_ISSUE_AGENT_WORKING_LABELS;

	for (const workingLabel of workingLabels) {
		if (workingLabel !== trimmedLabel) {
			labels.push(workingLabel);
		}
	}

	return labels;
}

function getJiraIssueAgentPanelMessage(activity: JiraIssueAgentActivity): string {
	if (activity.state === "awaiting-input") {
		return "I found a decision point that needs your input before I can continue with the implementation notes.";
	}

	return JIRA_ISSUE_AGENT_PANEL_MESSAGES[activity.id as keyof typeof JIRA_ISSUE_AGENT_PANEL_MESSAGES]
		?? JIRA_ISSUE_AGENT_PANEL_FALLBACK_MESSAGE;
}

function JiraIssueAgentActivityPanel({
	activity,
	onViewChat,
}: Readonly<{
	activity: JiraIssueAgentActivity;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
}>) {
	const panelMessage = getJiraIssueAgentPanelMessage(activity);
	const [reply, setReply] = useState("");
	const [realtimeVoiceActive, setRealtimeVoiceActive] = useState(false);
	const [clickyActive, setClickyActive] = useState(false);
	const canSubmit = Boolean(reply.trim());

	function handleViewChat() {
		onViewChat?.(activity);
	}

	const handleToggleRealtimeVoice = useCallback(() => {
		setClickyActive(false);
		setRealtimeVoiceActive((active) => !active);
	}, []);
	const handleStop = useCallback(() => {
		setRealtimeVoiceActive(false);
		setClickyActive(false);
	}, []);
	const handleToggleClicky = useCallback(() => {
		setRealtimeVoiceActive(true);
		setClickyActive((active) => !active);
	}, []);

	return (
		<div className="flex flex-col gap-3 p-3">
			<AgentCardHeader
				action={
					onViewChat ? (
						<Button type="button" onClick={handleViewChat} size="compact" variant="outline">
							View chat
						</Button>
					) : null
				}
				byline={<p className="text-xs leading-4 text-text-subtle">Just now</p>}
				leading={
					<Avatar label={activity.name} shape="hexagon" size="default">
						{activity.avatarSrc ? <AvatarImage src={activity.avatarSrc} alt="" /> : null}
						<AvatarFallback>{getAgentInitial(activity.name)}</AvatarFallback>
					</Avatar>
				}
				title={activity.name}
			/>
			<p className="text-sm leading-5 text-text">{panelMessage}</p>
			<FloatingComposer
				actions={
					<RovoComposerActionButton
						canSubmit={canSubmit}
						clickyActive={clickyActive}
						composerStatus="ready"
						experimentalDarkCta
						onStop={handleStop}
						onToggleClicky={handleToggleClicky}
						onToggleRealtimeVoice={handleToggleRealtimeVoice}
						realtimeVoiceActive={realtimeVoiceActive}
					/>
				}
				addButton={
					<PromptInputButton aria-label="Add" size="icon-sm" variant="ghost">
						<AddIcon label="" />
					</PromptInputButton>
				}
				allowOverflow
				aria-label="Reply to agent"
				className="shadow-none"
				onSubmit={() => setReply("")}
			>
				<PromptInputTextarea
					aria-label="Reply to agent"
					className={cn(floatingComposerTextareaClassName, "text-sm leading-5")}
					enableDirectoryAutocomplete={false}
					onChange={(event) => setReply(event.currentTarget.value)}
					placeholder="Ask, @mention, or / for actions"
					rows={1}
					value={reply}
				/>
			</FloatingComposer>
		</div>
	);
}

function JiraIssueAgentActivityRow({
	activity,
	index,
	onViewChat,
	rowCount,
}: Readonly<{
	activity: JiraIssueAgentActivity;
	index: number;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	rowCount: number;
}>) {
	const isAwaitingInput = activity.state === "awaiting-input";
	const workingLabels = getJiraIssueAgentWorkingLabels(activity);
	const rowRadiusClassName = rowCount === 1
		? "rounded-sm"
		: index === 0
			? "rounded-tl-[6px] rounded-tr-[6px] rounded-bl-[2px] rounded-br-[2px]"
			: index === rowCount - 1
				? "rounded-tl-[2px] rounded-tr-[2px] rounded-bl-[6px] rounded-br-[6px]"
				: "rounded-[2px]";

	return (
		<HoverCard>
			{/* Base UI reads open/close delay on the Trigger, not the Root; 0/0 makes the reveal
			    and dismissal instant so switching between rows doesn't overlap two flyouts. */}
			<HoverCardTrigger
				closeDelay={0}
				delay={0}
				render={(
					<button
						type="button"
						aria-label={`${activity.name}: ${activity.label}`}
						className={cn(
							"flex h-6 w-full items-center justify-between gap-2 px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-surface-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
							rowRadiusClassName,
						)}
					>
						<div className="flex min-w-0 items-center gap-2">
							<Avatar label={activity.name} shape="hexagon" size="xs">
								{activity.avatarSrc ? <AvatarImage src={activity.avatarSrc} alt="" /> : null}
								<AvatarFallback>{getAgentInitial(activity.name)}</AvatarFallback>
							</Avatar>
							{isAwaitingInput ? (
								<span className="inline-flex min-w-0 items-baseline text-sm leading-5 text-text-subtlest">
									<span className="truncate">{activity.label}</span>
									<AnimatedDots />
								</span>
							) : (
								<JiraIssueCyclingAgentLabel
									cycleIntervalJitterMs={activity.cycleIntervalJitterMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS}
									cycleIntervalMs={activity.cycleIntervalMs ?? JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS}
									labels={workingLabels}
								/>
							)}
						</div>
						{isAwaitingInput ? (
							<span className="-my-1 grid size-6 shrink-0 place-items-center text-icon-information" aria-hidden="true">
								<StatusInformationIcon label="" size="small" color="currentColor" />
							</span>
						) : null}
					</button>
				)}
			/>
			<HoverCardContent
				align="start"
				className="w-[400px] max-w-[calc(100vw-48px)] rounded-xl bg-surface-overlay p-0 text-text shadow-2xl data-ending-style:transition-none"
				side="right"
				sideOffset={8}
			>
				<JiraIssueAgentActivityPanel activity={activity} onViewChat={onViewChat} />
			</HoverCardContent>
		</HoverCard>
	);
}

function JiraIssueCyclingAgentLabel({
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
	const labelsKey = labels.join("\n");
	const label = labels[labelIndex % labels.length] ?? "";

	useEffect(() => {
		setLabelIndex(0);
	}, [labelsKey]);

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
	}, [cycleIntervalJitterMs, cycleIntervalMs, labels.length, labelsKey, shouldReduceMotion]);

	return (
		<span className="block min-w-0 flex-1 overflow-hidden text-sm leading-5 text-text-subtlest">
			<span className="block min-h-5">
				<AnimatePresence initial={false} mode="wait">
					<motion.span
						key={label}
						className="block truncate"
						initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
						animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
						exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
						transition={JIRA_ISSUE_AGENT_LABEL_TRANSITION}
					>
						<Shimmer
							as="span"
							duration={JIRA_ISSUE_AGENT_SHIMMER_DURATION}
							spread={JIRA_ISSUE_AGENT_SHIMMER_SPREAD}
							wave={false}
							className="block min-w-0 truncate text-sm leading-5"
						>
							{label}
						</Shimmer>
					</motion.span>
				</AnimatePresence>
			</span>
		</span>
	);
}

export function JiraIssueAgentActivityRows({
	activities,
	onViewChat,
	shouldReduceMotion,
}: Readonly<{
	activities: readonly JiraIssueAgentActivity[];
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	shouldReduceMotion: boolean | null;
}>) {
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);
	const hasActivities = activities.length > 0;

	return (
		<motion.div
			className={cn("flex w-full flex-col overflow-hidden", hasActivities && "px-1 py-1")}
			layout={shouldReduceMotion ? false : "position"}
			transition={layoutTransition}
		>
			<AnimatePresence initial={false} mode="popLayout">
				{activities.map((activity, index) => (
					<motion.div
						key={activity.id}
						animate={presenceMotion.animate}
						exit={presenceMotion.exit}
						initial={presenceMotion.initial}
						layout={shouldReduceMotion ? false : "position"}
						style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
						transition={layoutTransition}
					>
						<JiraIssueAgentActivityRow
							activity={activity}
							index={index}
							onViewChat={onViewChat}
							rowCount={activities.length}
						/>
					</motion.div>
				))}
			</AnimatePresence>
		</motion.div>
	);
}

export function JiraIssueAgentDone({ count }: Readonly<{ count: number }>) {
	return (
		<section aria-label="Agent done">
			<div className="flex h-8 w-full items-center justify-between px-3 py-2">
				<div className="flex items-center gap-2 text-sm font-medium leading-5 text-text-subtle">
					<span className="grid size-4 shrink-0 place-items-center text-icon-subtle" aria-hidden="true">
						<AiAgentIcon label="" size="medium" spacing="none" color="currentColor" />
					</span>
					<span>Agent done</span>
					<JiraIssueCountBadge>{count}</JiraIssueCountBadge>
				</div>
			</div>
		</section>
	);
}
