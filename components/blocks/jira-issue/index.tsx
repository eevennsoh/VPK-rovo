"use client";

import { useEffect, useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition } from "motion/react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AttachmentIcon from "@atlaskit/icon/core/attachment";
import AutomationIcon from "@atlaskit/icon/core/automation";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import EmojiAddIcon from "@atlaskit/icon/core/emoji-add";
import MentionIcon from "@atlaskit/icon/core/mention";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";

import {
	JiraIssueGenerativeActionMenu,
	type JiraIssueGenerativeActionConfig,
} from "@/components/blocks/jira-issue/generative-action-menu";
import { useIsMounted } from "@/components/hooks/use-is-mounted";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { PromptInputButton, PromptInputSubmit, PromptInputTextarea } from "@/components/ui-custom/prompt-input";
import { Shimmer } from "@/components/ui-custom/shimmer";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarUnassigned,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import { Tag, TagGroup, type TagColor } from "@/components/ui/tag";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type JiraIssuePriority = "major" | "medium" | "minor";
export type JiraIssueAgentActivityMode = "none" | "working" | "awaiting-input" | "completed";
export type JiraIssueAgentActivityState = "working" | "awaiting-input" | "completed";
export type {
	JiraIssueGenerativeActionConfig,
	JiraIssueGenerativeActionIssue,
	JiraIssueGenerativeActionKind,
	JiraIssueGenerativeActionRequest,
	JiraIssueGenerativeActionSelectedItem,
} from "@/components/blocks/jira-issue/generative-action-menu";

export interface JiraIssueTag {
	text: string;
	color: TagColor;
}

export interface JiraIssueSubtask {
	summary: string;
	issueKey: string;
	status?: string;
	issueTypeLabel?: string;
	assigneeAvatarSrc?: string;
	assigneeAvatarLabel?: string;
	assigneeUnassignedKind?: AvatarUnassignedKind;
}

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

export interface JiraIssueProps extends Omit<ComponentProps<"button">, "children"> {
	/** Issue summary shown as the primary card text. */
	summary: string;
	/** Jira issue key, e.g. RFP-101. */
	issueKey: string;
	tags?: readonly JiraIssueTag[];
	priority?: JiraIssuePriority;
	issueTypeLabel?: string;
	assigneeAvatarSrc?: string;
	assigneeAvatarLabel?: string;
	assigneeAvatarShape?: NonNullable<AvatarProps["shape"]>;
	assigneeUnassignedKind?: AvatarUnassignedKind;
	assigneePulse?: boolean;
	selected?: boolean;
	dragging?: boolean;
	showPriorityIndicator?: boolean;
	showAutomationIndicator?: boolean;
	parentEpicControl?: ReactNode;
	subtasks?: readonly JiraIssueSubtask[];
	subtasksCompleted?: number;
	subtasksLabel?: string;
	defaultSubtasksExpanded?: boolean;
	subtasksExpanded?: boolean;
	onSubtasksExpandedChange?: (expanded: boolean) => void;
	agentActivities?: readonly JiraIssueAgentActivity[];
	agentDoneCount?: number;
	agentActivityMode?: JiraIssueAgentActivityMode;
	onAgentActivityViewChat?: (activity: JiraIssueAgentActivity) => void;
	generativeAction?: JiraIssueGenerativeActionConfig;
}

const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
} as const;

const PRIORITY_COLORS = {
	major: token("color.icon.danger"),
	medium: token("color.icon.information"),
	minor: token("color.icon.success"),
} as const;

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

function getIssueInitial(issueKey: string): string {
	return issueKey[0]?.toUpperCase() ?? "U";
}

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

function getCompletedCount(completedCount: number | undefined, totalCount: number): number {
	return Math.min(Math.max(completedCount ?? 0, 0), totalCount);
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

function JiraIssueAssignee({
	assigneeAvatarLabel,
	assigneeAvatarShape,
	assigneeAvatarSrc,
	assigneePulse,
	assigneeUnassignedKind,
	issueKey,
}: Readonly<{
	assigneeAvatarLabel?: string;
	assigneeAvatarShape: NonNullable<AvatarProps["shape"]>;
	assigneeAvatarSrc?: string;
	assigneePulse: boolean;
	assigneeUnassignedKind?: AvatarUnassignedKind;
	issueKey: string;
}>) {
	if (assigneeUnassignedKind) {
		return (
			<AvatarUnassigned
				className={cn(
					assigneePulse && "motion-safe:animate-pulse ring-2 ring-border-focused ring-offset-2 ring-offset-surface",
				)}
				kind={assigneeUnassignedKind}
				size="sm"
			/>
		);
	}

	return (
		<Avatar
			className={cn(
				assigneePulse && "motion-safe:animate-pulse ring-2 ring-border-focused ring-offset-2 ring-offset-surface",
			)}
			label={assigneeAvatarLabel ?? issueKey}
			shape={assigneeAvatarShape}
			size="sm"
		>
			{assigneeAvatarSrc ? <AvatarImage src={assigneeAvatarSrc} alt="" /> : null}
			<AvatarFallback>{getIssueInitial(issueKey)}</AvatarFallback>
		</Avatar>
	);
}

function JiraIssueSummary({
	assigneeAvatarLabel,
	assigneeAvatarShape,
	assigneeAvatarSrc,
	assigneePulse,
	assigneeUnassignedKind,
	issueKey,
	issueTypeLabel,
	isMounted,
	parentEpicControl,
	priority,
	showAutomationIndicator,
	showPriorityIndicator,
	summary,
	tags,
}: Readonly<{
	assigneeAvatarLabel?: string;
	assigneeAvatarShape: NonNullable<AvatarProps["shape"]>;
	assigneeAvatarSrc?: string;
	assigneePulse: boolean;
	assigneeUnassignedKind?: AvatarUnassignedKind;
	issueKey: string;
	issueTypeLabel: string;
	isMounted: boolean;
	parentEpicControl?: ReactNode;
	priority: JiraIssuePriority;
	showAutomationIndicator: boolean;
	showPriorityIndicator: boolean;
	summary: string;
	tags?: readonly JiraIssueTag[];
}>) {
	const PriorityIcon = PRIORITY_ICONS[priority];
	const priorityColor = PRIORITY_COLORS[priority];

	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm">{summary}</span>

			{parentEpicControl ? (
				<div className="flex min-w-0 flex-col items-start gap-1">
					<p className="text-sm font-semibold leading-5 text-text-subtle">Parent</p>
					{parentEpicControl}
				</div>
			) : null}

			{tags && tags.length > 0 ? (
				<TagGroup className="gap-1">
					{tags.map((tag, index) => (
						<Tag key={`${tag.text}-${index}`} color={tag.color}>
							{tag.text}
						</Tag>
					))}
				</TagGroup>
			) : null}

			<div className="pt-0.5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<TaskIcon label={issueTypeLabel} color={token("color.icon.brand")} />
						<span className="text-xs font-semibold text-text-subtlest">{issueKey}</span>
					</div>

					{showAutomationIndicator ? (
						<span className="grid size-6 place-items-center text-icon-accent-orange" aria-label="Automation linked">
							<AutomationIcon label="" size="small" color="currentColor" />
						</span>
					) : (
						<div className="flex items-center gap-1.5">
							{showPriorityIndicator ? <PriorityIcon label={`${priority} priority`} color={priorityColor} /> : null}
							{isMounted ? (
								<JiraIssueAssignee
									assigneeAvatarLabel={assigneeAvatarLabel}
									assigneeAvatarShape={assigneeAvatarShape}
									assigneeAvatarSrc={assigneeAvatarSrc}
									assigneePulse={assigneePulse}
									assigneeUnassignedKind={assigneeUnassignedKind}
									issueKey={issueKey}
								/>
							) : null}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function JiraIssueSubtaskCard({ subtask }: Readonly<{ subtask: JiraIssueSubtask }>) {
	return (
		<div
			className="border border-transparent bg-surface p-3"
			style={{
				borderRadius: token("radius.large"),
				boxShadow: token("elevation.shadow.raised"),
			}}
		>
			<div className="flex flex-col gap-4">
				<p className="text-sm leading-5 text-text">{subtask.summary}</p>
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						<TaskIcon label={subtask.issueTypeLabel ?? "Sub-task"} color={token("color.icon.information")} />
						<span className="truncate text-xs font-semibold text-text-subtlest">{subtask.issueKey}</span>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Lozenge>{subtask.status ?? "To Do"}</Lozenge>
						{subtask.assigneeUnassignedKind ? (
							<AvatarUnassigned kind={subtask.assigneeUnassignedKind} size="sm" />
						) : (
							<Avatar label={subtask.assigneeAvatarLabel ?? subtask.issueKey} size="sm">
								{subtask.assigneeAvatarSrc ? <AvatarImage alt="" src={subtask.assigneeAvatarSrc} /> : null}
								<AvatarFallback>{getIssueInitial(subtask.issueKey)}</AvatarFallback>
							</Avatar>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function JiraIssueSeparator({ inset = 0 }: Readonly<{ inset?: number }>) {
	return (
		<Separator
			className="h-px transition-[margin,width] duration-medium ease-in-out motion-reduce:transition-none"
			style={{
				marginLeft: `${inset - 1}px`,
				marginRight: `${inset - 1}px`,
				width: `calc(100% + ${2 - inset * 2}px)`,
			}}
		/>
	);
}

function JiraIssueCountBadge({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<Badge className="h-5 min-w-0 rounded-sm px-1.5 font-semibold text-text-subtle" max={false} variant="neutral">
			{children}
		</Badge>
	);
}

function JiraIssueAgentActivityPanel({
	activity,
	onViewChat,
}: Readonly<{
	activity: JiraIssueAgentActivity;
	onViewChat?: (activity: JiraIssueAgentActivity) => void;
}>) {
	const panelMessage = getJiraIssueAgentPanelMessage(activity);

	function handleViewChat() {
		onViewChat?.(activity);
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 items-center gap-2">
					<Avatar label={activity.name} shape="hexagon" size="sm">
						{activity.avatarSrc ? <AvatarImage src={activity.avatarSrc} alt="" /> : null}
						<AvatarFallback>{getAgentInitial(activity.name)}</AvatarFallback>
					</Avatar>
					<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
						<span className="truncate text-base font-semibold leading-6 text-text">{activity.name}</span>
						<span className="text-sm leading-5 text-text-subtlest">Just now</span>
						{onViewChat ? (
							<Button
								type="button"
								className="-ml-1 px-2 text-text-subtle hover:text-text"
								onClick={handleViewChat}
								size="compact"
								variant="ghost"
							>
								View chat
							</Button>
						) : null}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm">
					<Button type="button" aria-label="Add reaction" size="icon-compact" variant="ghost">
						<EmojiAddIcon label="" size="small" />
					</Button>
					<Button type="button" aria-label="Mark agent update as done" size="icon-compact" variant="ghost">
						<CheckMarkIcon label="" size="small" />
					</Button>
					<Button type="button" aria-label="More agent actions" size="icon-compact" variant="ghost">
						<ShowMoreHorizontalIcon label="" size="small" />
					</Button>
				</div>
			</div>
			<p className="pl-8 text-base leading-6 text-text">{panelMessage}</p>
			<FloatingComposer
				addButton={<AvatarUnassigned kind="person" size="sm" />}
				aria-label="Reply to agent"
				className="rounded-xl border border-border bg-bg-input p-2 shadow-none"
				onSubmit={(_, event) => event.preventDefault()}
				actions={
					<>
						<PromptInputButton type="button" aria-label="Attach file" size="icon-sm" variant="ghost">
							<AttachmentIcon label="" size="small" />
						</PromptInputButton>
						<PromptInputButton type="button" aria-label="Mention someone" size="icon-sm" variant="ghost">
							<MentionIcon label="" size="small" />
						</PromptInputButton>
						<PromptInputSubmit className="rounded-full" size="icon-sm" />
					</>
				}
			>
				<PromptInputTextarea
					aria-label="Agent reply"
					className={cn(floatingComposerTextareaClassName, "min-h-6 text-sm leading-5")}
					enableDirectoryAutocomplete={false}
					placeholder="Add a comment..."
					rows={1}
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
		<HoverCard closeDelay={120} openDelay={120}>
			<HoverCardTrigger
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
				className="w-[520px] max-w-[calc(100vw-48px)] rounded-xl border border-border bg-surface-overlay p-0 text-text shadow-xl"
				side="top"
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
							initialBackgroundPosition="50% center"
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

function JiraIssueAgentActivityRows({
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

function JiraIssueAgentDone({ count }: Readonly<{ count: number }>) {
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

function JiraIssueSubtasks({
	completedCount,
	controlId,
	expanded,
	label,
	onToggle,
	shouldReduceMotion,
	subtasks,
}: Readonly<{
	completedCount: number;
	controlId: string;
	expanded: boolean;
	label: string;
	onToggle: () => void;
	shouldReduceMotion: boolean | null;
	subtasks: readonly JiraIssueSubtask[];
}>) {
	const totalCount = subtasks.length;
	const subtasksToggleLabel = `${expanded ? "Hide" : "Show"} ${label.toLowerCase()}`;
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);

	return (
		<section aria-label={label}>
			<div className="flex h-8 w-full items-center justify-between px-3 py-2">
				<div className="flex items-center gap-2 text-sm font-medium leading-5 text-text-subtle">
					<span className="grid size-4 shrink-0 place-items-center text-icon-subtle" aria-hidden="true">
						<SubtasksIcon label="" size="medium" spacing="none" color="currentColor" />
					</span>
					<span>{label}</span>
					<JiraIssueCountBadge>{completedCount}/{totalCount}</JiraIssueCountBadge>
				</div>
				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								aria-controls={controlId}
								aria-expanded={expanded}
								aria-label={subtasksToggleLabel}
								className="inline-flex size-6 items-center justify-center rounded-sm text-icon-subtle outline-none transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
								onClick={onToggle}
							>
								{expanded ? (
									<ChevronDownIcon label="" size="small" color="currentColor" />
								) : (
									<ChevronRightIcon label="" size="small" color="currentColor" />
								)}
							</button>
						}
					/>
					<TooltipContent>{subtasksToggleLabel}</TooltipContent>
				</Tooltip>
			</div>
			<AnimatePresence initial={false} mode="popLayout">
				{expanded ? (
					<motion.div
						id={controlId}
						key="subtasks-panel"
						animate={presenceMotion.animate}
						className="flex flex-col gap-2 px-3 pb-3"
						exit={presenceMotion.exit}
						initial={presenceMotion.initial}
						layout={shouldReduceMotion ? false : "position"}
						style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
						transition={layoutTransition}
					>
						{subtasks.map((subtask) => (
							<JiraIssueSubtaskCard key={subtask.issueKey} subtask={subtask} />
						))}
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

export function JiraIssue({
	"aria-pressed": ariaPressed,
	agentActivities,
	agentActivityMode,
	agentDoneCount = 0,
	assigneeAvatarLabel,
	assigneeAvatarShape = "circle",
	assigneeAvatarSrc,
	assigneePulse = false,
	assigneeUnassignedKind,
	className,
	defaultSubtasksExpanded = false,
	dragging = false,
	draggable = true,
	generativeAction,
	issueKey,
	issueTypeLabel = "Task",
	onSubtasksExpandedChange,
	onAgentActivityViewChat,
	parentEpicControl,
	priority = "major",
	selected = false,
	showAutomationIndicator = false,
	showPriorityIndicator = true,
	style,
	subtasks,
	subtasksCompleted,
	subtasksExpanded,
	subtasksLabel = "Subtasks",
	summary,
	tags,
	type = "button",
	...props
}: Readonly<JiraIssueProps>) {
	const isMounted = useIsMounted();
	const shouldReduceMotion = useReducedMotion();
	const subtasksPanelId = useId();
	const agentActivityLayoutGroupId = useId();
	const [internalSubtasksExpanded, setInternalSubtasksExpanded] = useState(defaultSubtasksExpanded);
	const hasSubtasks = Boolean(subtasks?.length);
	const resolvedSubtasksExpanded = subtasksExpanded ?? internalSubtasksExpanded;
	const completedSubtaskCount = getCompletedCount(subtasksCompleted, subtasks?.length ?? 0);
	const nonCompletedAgentActivities = (agentActivities ?? []).filter((activity) => activity.state !== "completed");
	const inferredAgentActivityMode: JiraIssueAgentActivityMode = nonCompletedAgentActivities.some((activity) => activity.state === "awaiting-input")
		? "awaiting-input"
		: nonCompletedAgentActivities.length > 0
			? "working"
			: agentDoneCount > 0
				? "completed"
				: "none";
	const resolvedAgentActivityMode = agentActivityMode ?? inferredAgentActivityMode;
	const activeAgentActivities = resolvedAgentActivityMode === "none" || resolvedAgentActivityMode === "completed"
		? []
		: nonCompletedAgentActivities;
	const hasActiveAgentActivityShell = resolvedAgentActivityMode === "working" || resolvedAgentActivityMode === "awaiting-input";
	const hasAgentDoneNotification = agentDoneCount > 0;
	const hasIssueRows = hasSubtasks || hasAgentDoneNotification;
	const hasAgentActivityPresentation = agentActivityMode !== undefined || Boolean(agentActivities?.length) || hasAgentDoneNotification;
	const usesAgentActivityShell = hasAgentActivityPresentation;
	const hasInteractiveContent = hasSubtasks || Boolean(parentEpicControl) || hasAgentActivityPresentation || Boolean(generativeAction);
	const issueRowsClassName = cn("pt-1", (!(hasSubtasks && resolvedSubtasksExpanded) || hasAgentDoneNotification) && "pb-1");
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);
	const rootBaseStyle: CSSProperties = {
		borderRadius: token("radius.large"),
		boxShadow: token("elevation.shadow.raised"),
		cursor: dragging ? "grabbing" : draggable ? "grab" : "default",
		opacity: dragging ? 0.5 : 1,
		textAlign: "left",
		transformOrigin: "top center",
		...style,
	};
	const buttonStyle: CSSProperties = {
		...rootBaseStyle,
		padding: token("space.150"),
	};
	const rootClassName = cn(
		"group/jira-issue relative w-full border outline-none focus-visible:border-ring",
		usesAgentActivityShell
			? "border-transparent bg-transparent"
			: selected
				? "border-border-selected bg-bg-selected"
				: "border-transparent bg-surface",
		"transition-[opacity,background-color,border-color] duration-normal ease-out",
		"data-starting-style:opacity-0 data-starting-style:-translate-y-1",
		!usesAgentActivityShell && className,
	);
	const agentActivitySurfaceClassName = cn(
		"pointer-events-none absolute border",
		selected
			? "border-border-selected bg-bg-selected"
			: "border-transparent bg-surface",
	);
	const agentActivityShellClassName = cn(
		"relative w-full overflow-visible rounded-[10px] outline-none",
		"transition-[opacity,background-color,border-color] duration-normal ease-out",
		"data-starting-style:opacity-0 data-starting-style:-translate-y-1",
	);
	const agentActivityArticleClassName = cn(
		"group/jira-issue relative w-full overflow-visible outline-none",
		"data-starting-style:opacity-0 data-starting-style:-translate-y-1",
		className,
	);
	// Separator and surface positioning subtract 1px to account for the card edge,
	// so an inset of 5 gives the active agent shell a visible 4px reveal.
	const agentActivitySurfaceInset = hasActiveAgentActivityShell ? 5 : 0;
	const agentActivityArticleStyle: CSSProperties = {
		borderRadius: "10px",
		cursor: rootBaseStyle.cursor,
		opacity: rootBaseStyle.opacity,
		textAlign: "left",
		transformOrigin: "top center",
		...style,
	};
	const agentActivityShellStyle: CSSProperties = {
		borderRadius: "10px",
		transformOrigin: "top center",
	};
	const agentActivityBackdropStyle: CSSProperties = {
		borderRadius: "10px",
		transformOrigin: "top center",
	};
	const agentActivityBackdropAnimation = {
		bottom: 0,
		left: 0,
		opacity: hasActiveAgentActivityShell ? 1 : 0,
		right: 0,
		top: 0,
	};
	const agentActivitySurfacePosition = agentActivitySurfaceInset - 1;
	const agentActivitySurfaceAnimation = {
		bottom: -1,
		left: agentActivitySurfacePosition,
		right: agentActivitySurfacePosition,
		top: agentActivitySurfacePosition,
	};
	const agentActivityInnerStyle: CSSProperties = {
		borderRadius: token("radius.large"),
		textAlign: "left",
		transformOrigin: "top center",
	};
	const agentActivitySurfaceStyle: CSSProperties = {
		borderRadius: token("radius.large"),
		boxShadow: token("elevation.shadow.raised"),
		transformOrigin: "top center",
	};

	function handleSubtasksToggle() {
		const nextExpanded = !resolvedSubtasksExpanded;
		if (subtasksExpanded === undefined) {
			setInternalSubtasksExpanded(nextExpanded);
		}
		onSubtasksExpandedChange?.(nextExpanded);
	}

	const summaryContent = (
		<JiraIssueSummary
			assigneeAvatarLabel={assigneeAvatarLabel}
			assigneeAvatarShape={assigneeAvatarShape}
			assigneeAvatarSrc={assigneeAvatarSrc}
			assigneePulse={assigneePulse}
			assigneeUnassignedKind={assigneeUnassignedKind}
			issueKey={issueKey}
			issueTypeLabel={issueTypeLabel}
			isMounted={isMounted}
			parentEpicControl={parentEpicControl}
			priority={priority}
			showAutomationIndicator={showAutomationIndicator}
			showPriorityIndicator={showPriorityIndicator}
			summary={summary}
			tags={tags}
		/>
	);
	const richIssueContent = (
		<div className="relative z-10 flex flex-col">
			{props.onClick ? (
				<button
					type={type}
					aria-pressed={ariaPressed ?? selected}
					className="w-full p-3 text-left outline-none transition-colors duration-normal ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					disabled={props.disabled}
					onClick={props.onClick}
				>
					{summaryContent}
				</button>
			) : (
				<div className="p-3">{summaryContent}</div>
			)}
			{hasIssueRows ? (
				<div>
					<JiraIssueSeparator inset={usesAgentActivityShell ? agentActivitySurfaceInset : 0} />
					<div className={issueRowsClassName}>
						<AnimatePresence initial={false} mode="popLayout">
							{hasSubtasks && subtasks ? (
								<motion.div
									key="subtasks"
									animate={presenceMotion.animate}
									exit={presenceMotion.exit}
									initial={presenceMotion.initial}
									layout={shouldReduceMotion ? false : "position"}
									style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
									transition={layoutTransition}
								>
									<JiraIssueSubtasks
										completedCount={completedSubtaskCount}
										controlId={subtasksPanelId}
										expanded={resolvedSubtasksExpanded}
										label={subtasksLabel}
										onToggle={handleSubtasksToggle}
										shouldReduceMotion={shouldReduceMotion}
										subtasks={subtasks}
									/>
								</motion.div>
							) : null}
							{hasAgentDoneNotification ? (
								<motion.div
									key="agent-done"
									animate={presenceMotion.animate}
									exit={presenceMotion.exit}
									initial={presenceMotion.initial}
									layout={shouldReduceMotion ? false : "position"}
									style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
									transition={layoutTransition}
								>
									<JiraIssueAgentDone count={agentDoneCount} />
								</motion.div>
							) : null}
						</AnimatePresence>
					</div>
				</div>
			) : null}
		</div>
	);
	const generativeActionMenu = generativeAction ? (
		<JiraIssueGenerativeActionMenu action={generativeAction} issue={{ issueKey, summary }} />
	) : null;

	if (hasInteractiveContent) {
		if (usesAgentActivityShell) {
			return (
				<article
					draggable={draggable}
					className={agentActivityArticleClassName}
					data-dragging={dragging || undefined}
					data-selected={selected || undefined}
					data-agent-activity-mode={resolvedAgentActivityMode}
					onDragEnd={props.onDragEnd as ComponentProps<"article">["onDragEnd"]}
					onDragStart={props.onDragStart as ComponentProps<"article">["onDragStart"]}
					style={agentActivityArticleStyle}
				>
					<motion.div
						className={agentActivityShellClassName}
						initial={false}
						layout={shouldReduceMotion ? false : "size"}
						style={agentActivityShellStyle}
						transition={layoutTransition}
					>
						<motion.div
							aria-hidden="true"
							animate={shouldReduceMotion ? undefined : agentActivityBackdropAnimation}
							className="pointer-events-none absolute bg-surface-sunken"
							initial={false}
							style={shouldReduceMotion ? { ...agentActivityBackdropStyle, ...agentActivityBackdropAnimation } : agentActivityBackdropStyle}
							transition={layoutTransition}
						/>
						<LayoutGroup id={agentActivityLayoutGroupId}>
							<motion.div
								className={rootClassName}
								data-slot="jira-issue-card"
								layout={shouldReduceMotion ? false : "position"}
								style={agentActivityInnerStyle}
								transition={layoutTransition}
							>
								<motion.div
									aria-hidden="true"
									animate={shouldReduceMotion ? undefined : agentActivitySurfaceAnimation}
									className={agentActivitySurfaceClassName}
									data-slot="jira-issue-surface"
									initial={false}
									style={shouldReduceMotion ? { ...agentActivitySurfaceStyle, ...agentActivitySurfaceAnimation } : agentActivitySurfaceStyle}
									transition={layoutTransition}
								/>
								{richIssueContent}
							</motion.div>
							<JiraIssueAgentActivityRows
								activities={activeAgentActivities}
								onViewChat={onAgentActivityViewChat}
								shouldReduceMotion={shouldReduceMotion}
							/>
						</LayoutGroup>
					</motion.div>
					{generativeActionMenu}
				</article>
			);
		}

		return (
			<article
				draggable={draggable}
				className={rootClassName}
				data-dragging={dragging || undefined}
				data-selected={selected || undefined}
				onDragEnd={props.onDragEnd as ComponentProps<"article">["onDragEnd"]}
				onDragStart={props.onDragStart as ComponentProps<"article">["onDragStart"]}
				style={rootBaseStyle}
			>
				{richIssueContent}
				{generativeActionMenu}
			</article>
		);
	}

	return (
		<button
			type={type}
			draggable={draggable}
			aria-pressed={ariaPressed ?? selected}
			className={rootClassName}
			data-dragging={dragging || undefined}
			data-selected={selected || undefined}
			style={buttonStyle}
			{...props}
		>
			{summaryContent}
		</button>
	);
}
