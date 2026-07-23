"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import AddIcon from "@atlaskit/icon/core/add";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";

import { AgentCardHeader } from "@/components/blocks/agent-card";
import { QuestionCard } from "@/components/blocks/question-card/components/question-card";
import type { QuestionCardAnswers, QuestionCardQuestion } from "@/components/blocks/question-card/types";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { PromptInputButton, PromptInputTextarea } from "@/components/ui-custom/prompt-input";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Button } from "@/components/ui/button";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { ElapsedTime } from "@/components/ui/elapsed-time";
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
const JIRA_ISSUE_AGENT_AWAITING_LABEL = "Waiting for input";
const JIRA_ISSUE_AGENT_SHIMMER_DURATION = 1.4;
const JIRA_ISSUE_AGENT_SHIMMER_SPREAD = 2;
const JIRA_ISSUE_AGENT_SPINNER_LOOP_MS = 1200;
const JIRA_ISSUE_AGENT_INITIAL_ELAPSED_MIN_SECONDS = 45;
const JIRA_ISSUE_AGENT_INITIAL_ELAPSED_MAX_SECONDS = 7 * 60;
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

export function JiraIssueAgentPrompt({
	className,
	onSubmit,
}: Readonly<{
	className?: string;
	onSubmit?: (prompt: string) => void;
}>) {
	const [reply, setReply] = useState("");
	const [realtimeVoiceActive, setRealtimeVoiceActive] = useState(false);
	const [clickyActive, setClickyActive] = useState(false);
	const canSubmit = Boolean(reply.trim());

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
	const handleSubmit = useCallback(() => {
		const prompt = reply.trim();
		if (!prompt) return;
		onSubmit?.(prompt);
		setReply("");
	}, [onSubmit, reply]);

	return (
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
			className={cn(
				"shadow-[0px_-2px_25px_rgba(30,31,33,0.08)]",
				className,
			)}
			onSubmit={handleSubmit}
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
	);
}

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

function getJiraIssueAgentSpinnerPhaseOffsetMs(activityId: string, index: number): number {
	let hash = (index + 1) * 317;
	for (let characterIndex = 0; characterIndex < activityId.length; characterIndex += 1) {
		hash = (hash * 31 + activityId.charCodeAt(characterIndex)) % JIRA_ISSUE_AGENT_SPINNER_LOOP_MS;
	}
	return hash;
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
	if (activity.message) {
		return activity.message;
	}

	if (activity.state === "awaiting-input") {
		return "I found a decision point that needs your input before I can continue with the implementation notes.";
	}

	return JIRA_ISSUE_AGENT_PANEL_MESSAGES[activity.id as keyof typeof JIRA_ISSUE_AGENT_PANEL_MESSAGES]
		?? JIRA_ISSUE_AGENT_PANEL_FALLBACK_MESSAGE;
}

function getJiraIssueAgentInitialElapsedSeconds(): number {
	const range = JIRA_ISSUE_AGENT_INITIAL_ELAPSED_MAX_SECONDS
		- JIRA_ISSUE_AGENT_INITIAL_ELAPSED_MIN_SECONDS;
	return JIRA_ISSUE_AGENT_INITIAL_ELAPSED_MIN_SECONDS + Math.floor(Math.random() * range);
}

function JiraIssueAgentActivityPanel({
	activity,
	onQuestionSubmit,
	onViewChat,
	startedAtMs,
}: Readonly<{
	activity: JiraIssueAgentActivity;
	onQuestionSubmit?: (activity: JiraIssueAgentActivity, answers: QuestionCardAnswers) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	startedAtMs: number;
}>) {
	const panelMessage = getJiraIssueAgentPanelMessage(activity);
	const isRovoActivity = activity.name === "Rovo";

	function handleViewChat() {
		onViewChat?.(activity);
	}

	function handleQuestionSubmit(answers: QuestionCardAnswers) {
		onQuestionSubmit?.(activity, answers);
	}

	return (
		<div className="flex flex-col gap-3 p-3">
			<AgentCardHeader
				action={
					onViewChat ? (
						<Button type="button" onClick={handleViewChat} size="compact" variant="outline">
							View
						</Button>
					) : null
				}
				byline={<ElapsedTime className="text-xs leading-4 text-text-subtle" startedAtMs={startedAtMs} />}
				leading={
					<AgentAvatarVisual
						avatarClassName={isRovoActivity ? "[&>svg]:hidden" : undefined}
						avatarSrc={activity.avatarSrc}
						brandName={activity.agentBrandName}
						fallbackText={getAgentInitial(activity.name)}
						label={activity.name}
						sizePx={32}
					/>
				}
				title={activity.name}
			/>
			<p className="text-sm leading-5 text-text">{panelMessage}</p>
			{activity.state === "awaiting-input" && activity.question ? (
				<QuestionCard
					className="shadow-none"
					onSubmit={handleQuestionSubmit}
					questions={[activity.question]}
				/>
			) : (
				<JiraIssueAgentPrompt />
			)}
		</div>
	);
}

function JiraIssueAgentActivityRow({
	activity,
	index,
	onOpenChange,
	onQuestionSubmit,
	onViewChat,
	rowCount,
}: Readonly<{
	activity: JiraIssueAgentActivity;
	index: number;
	onOpenChange?: (open: boolean) => void;
	onQuestionSubmit?: (activity: JiraIssueAgentActivity, answers: QuestionCardAnswers) => void;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
	rowCount: number;
}>) {
	const isAwaitingInput = activity.state === "awaiting-input";
	const displayLabel = isAwaitingInput ? JIRA_ISSUE_AGENT_AWAITING_LABEL : activity.label;
	const [startedAtMs] = useState(() => {
		if (typeof activity.startedAtMs === "number" && Number.isFinite(activity.startedAtMs)) {
			return activity.startedAtMs;
		}
		const initialElapsedSeconds = activity.initialElapsedSeconds
			?? getJiraIssueAgentInitialElapsedSeconds();
		return Date.now() - initialElapsedSeconds * 1000;
	});
	const workingLabels = getJiraIssueAgentWorkingLabels(activity);
	const rowRadiusClassName = rowCount === 1
		? "rounded-sm"
		: index === 0
			? "rounded-tl-[6px] rounded-tr-[6px] rounded-bl-[2px] rounded-br-[2px]"
			: index === rowCount - 1
				? "rounded-tl-[2px] rounded-tr-[2px] rounded-bl-[6px] rounded-br-[6px]"
				: "rounded-[2px]";

	return (
		<HoverCard onOpenChange={onOpenChange}>
			{/* Base UI reads open/close delay on the Trigger, not the Root; 0/0 makes the reveal
			    and dismissal instant so switching between rows doesn't overlap two flyouts. */}
			<HoverCardTrigger
				closeDelay={0}
				delay={0}
				render={(
					<button
						type="button"
						aria-label={`${activity.name}: ${displayLabel}`}
						data-slot="jira-issue-agent-row"
						className={cn(
							"flex h-6 w-full items-center justify-between gap-2 px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
							rowRadiusClassName,
						)}
					>
						<div className="flex min-w-0 items-center gap-2">
							<AgentAvatarVisual
								avatarSrc={activity.avatarSrc}
								brandName={activity.agentBrandName}
								fallbackText={getAgentInitial(activity.name)}
								label={activity.name}
								sizePx={16}
							/>
							{isAwaitingInput ? (
								<span className="inline-flex min-w-0 items-baseline text-sm leading-5 text-text-subtlest">
									<Shimmer
										as="span"
										duration={JIRA_ISSUE_AGENT_SHIMMER_DURATION}
										spread={JIRA_ISSUE_AGENT_SHIMMER_SPREAD}
										wave={false}
										className="min-w-0 truncate text-sm leading-5"
									>
										{displayLabel}
									</Shimmer>
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
						) : (
							<span className="-my-1 grid size-6 shrink-0 place-items-center" aria-hidden="true">
								<Spinner
									label=""
									phaseOffsetMs={getJiraIssueAgentSpinnerPhaseOffsetMs(activity.id, index)}
									size="sm"
									variant="rainbow"
								/>
							</span>
						)}
					</button>
				)}
			/>
			<HoverCardContent
				align="start"
				alignOffset={0}
				className="w-[400px] max-w-[calc(100vw-48px)] rounded-xl bg-surface-overlay p-0 text-text shadow-2xl data-ending-style:transition-none"
				positionerClassName="z-[575] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-['']"
				side="right"
				sideOffset={8}
			>
				<JiraIssueAgentActivityPanel
					activity={activity}
					onQuestionSubmit={onQuestionSubmit}
					onViewChat={onViewChat}
					startedAtMs={startedAtMs}
				/>
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
				<AnimatePresence mode="wait">
					<motion.span
						key={label}
						className="block min-w-0 truncate text-sm leading-5"
						initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
						animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
						exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
						transition={JIRA_ISSUE_AGENT_LABEL_TRANSITION}
					>
						{label}
					</motion.span>
				</AnimatePresence>
			</span>
		</span>
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
							onOpenChange={onOpenChange}
							onQuestionSubmit={onQuestionSubmit}
							onViewChat={onViewChat}
							rowCount={activities.length}
						/>
					</motion.div>
				))}
			</AnimatePresence>
		</motion.div>
	);
}
