"use client";

import { useId, useState, type ComponentProps, type CSSProperties, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import AutomationIcon from "@atlaskit/icon/core/automation";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import TaskIcon from "@atlaskit/icon/core/task";

import {
	JiraIssueAgentActivityRows,
	type JiraIssueAgentActivity,
	type JiraIssueAgentActivityMode,
} from "@/components/blocks/jira-issue/agent-activity";
import {
	JiraIssueAgentDone,
	type JiraIssueCompletedAgentRun,
} from "@/components/blocks/jira-issue/completed-agent-runs";
import type { QuestionCardAnswers } from "@/components/blocks/question-card/types";
import {
	getCompletedCount,
	getIssueInitial,
	getJiraIssueLayoutTransition,
	getJiraIssuePresenceMotion,
	JIRA_ISSUE_MOTION_STYLE,
} from "@/components/blocks/jira-issue/lib";
import { JiraIssueSeparator, JiraIssueSubtasks } from "@/components/blocks/jira-issue/subtasks";
import {
	JiraIssueGenerativeActionMenu,
	type JiraIssueGenerativeActionConfig,
} from "@/components/blocks/jira-issue/generative-action-menu";
import { JiraIssueMoreMenu, type JiraIssueMoreAction } from "@/components/blocks/jira-issue/more-menu";
import { JiraIssueUncapturedWork } from "@/components/blocks/jira-issue/uncaptured-work";
import type { SmartLinkItem } from "@/components/blocks/smart-link";
import { useIsMounted } from "@/components/hooks/use-is-mounted";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarUnassigned,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
import { IconTile } from "@/components/ui/icon-tile";
import { Tag, TagGroup, type TagColor } from "@/components/ui/tag";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const AGENT_ACTIVITY_SHELL_STYLE: CSSProperties = {
	borderRadius: "10px",
	transformOrigin: "top center",
};
const AGENT_ACTIVITY_BACKDROP_STYLE: CSSProperties = {
	borderRadius: "10px",
	transformOrigin: "top center",
};
const AGENT_ACTIVITY_INNER_STYLE: CSSProperties = {
	borderRadius: token("radius.large"),
	textAlign: "left",
	transformOrigin: "top center",
};
const AGENT_ACTIVITY_SURFACE_STYLE: CSSProperties = {
	borderRadius: token("radius.large"),
	boxShadow: token("elevation.shadow.raised"),
	transformOrigin: "top center",
};

export type JiraIssueChrome = "raised" | "stroke";
export type JiraIssuePriority = "major" | "medium" | "minor";
export type JiraIssuePullRequestStatus = "open" | "failed" | "merged";
export type JiraIssueVariant = "default" | "uncaptured-work";
export type {
	JiraIssueAgentActivity,
	JiraIssueAgentActivityMode,
	JiraIssueAgentActivityState,
} from "@/components/blocks/jira-issue/agent-activity";
export type {
	JiraIssueCompletedAgentRun,
	JiraIssueCompletedAgentRunState,
} from "@/components/blocks/jira-issue/completed-agent-runs";
export type {
	JiraIssueGenerativeActionConfig,
	JiraIssueGenerativeActionIssue,
	JiraIssueGenerativeActionKind,
	JiraIssueGenerativeActionRequest,
	JiraIssueGenerativeActionSelectedItem,
} from "@/components/blocks/jira-issue/generative-action-menu";
export type { JiraIssueMoreAction } from "@/components/blocks/jira-issue/more-menu";

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

export interface JiraIssueParticipant {
	id: string;
	name: string;
	avatarSrc: string;
	avatarShape?: NonNullable<AvatarProps["shape"]>;
}

export interface JiraIssueUncapturedWorkProps extends Omit<ComponentProps<"article">, "children"> {
	variant: "uncaptured-work";
	/** Work that has not yet been represented by a Jira issue. */
	summary: string;
	/** Hoverable source context: type icon, provider name, and destination label. */
	sourceLink: SmartLinkItem;
	participants: readonly JiraIssueParticipant[];
	captured?: boolean;
	/** Suggested Jira key the chin split-button should link to, e.g. PAY-121. */
	suggestedWorkItemKey?: string;
	/** Creates a Jira work item from the chin split-button menu. Omit to expose an unavailable action. */
	onCreateWorkItem?: () => void;
	/** Links this uncaptured work to the suggested Jira work item. Omit to expose an unavailable primary action. */
	onLinkWorkItem?: () => void;
	/** Dismisses this uncaptured work from the chin. Omit to hide the dismiss control. */
	onDismiss?: () => void;
}

export interface JiraIssueDefaultProps extends Omit<ComponentProps<"button">, "children"> {
	variant?: "default";
	/** Issue summary shown as the primary card text. */
	summary: string;
	/** Jira issue key, e.g. RFP-101. */
	issueKey: string;
	pullRequestNumber?: number;
	pullRequestStatus?: JiraIssuePullRequestStatus;
	tags?: readonly JiraIssueTag[];
	priority?: JiraIssuePriority;
	issueTypeLabel?: string;
	assigneeAvatarSrc?: string;
	assigneeAvatarLabel?: string;
	assigneeAvatarShape?: NonNullable<AvatarProps["shape"]>;
	assigneeUnassignedKind?: AvatarUnassignedKind;
	assigneePulse?: boolean;
	active?: boolean;
	/** Raised elevation is the default card chrome. Stroke is a 1px border with no shadow. */
	chrome?: JiraIssueChrome;
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
	agentDoneRuns?: readonly JiraIssueCompletedAgentRun[];
	agentActivityMode?: JiraIssueAgentActivityMode;
	onAgentActivityOpenChange?: (open: boolean) => void;
	onAgentActivityQuestionSubmit?: (activity: JiraIssueAgentActivity, answers: QuestionCardAnswers) => void;
	onAgentActivityViewChat?: (activity: JiraIssueAgentActivity) => void;
	onAgentDoneRunSubmit?: (run: JiraIssueCompletedAgentRun, prompt: string) => void;
	onAgentDoneRunReview?: (run: JiraIssueCompletedAgentRun) => void;
	onAgentDoneRunView?: (run: JiraIssueCompletedAgentRun) => void;
	/** Controls the built-in hover-revealed issue actions menu. */
	showMoreAction?: boolean;
	/** Called after an item is selected from the issue actions menu. */
	onMoreActionSelect?: (action: JiraIssueMoreAction) => void;
	generativeAction?: JiraIssueGenerativeActionConfig;
}

export type JiraIssueProps = JiraIssueDefaultProps | JiraIssueUncapturedWorkProps;

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

function JiraIssueAssignee({
	assigneeAvatarLabel,
	assigneeAvatarShape,
	assigneeAvatarSrc,
	assigneePulse,
	assigneeUnassignedKind,
	issueKey,
	size = "sm",
}: Readonly<{
	assigneeAvatarLabel?: string;
	assigneeAvatarShape: NonNullable<AvatarProps["shape"]>;
	assigneeAvatarSrc?: string;
	assigneePulse: boolean;
	assigneeUnassignedKind?: AvatarUnassignedKind;
	issueKey: string;
	size?: NonNullable<AvatarProps["size"]>;
}>) {
	if (assigneeUnassignedKind) {
		return (
			<AvatarUnassigned
				className={cn(
					assigneePulse && "motion-safe:animate-pulse ring-2 ring-border-focused ring-offset-2 ring-offset-surface",
				)}
				kind={assigneeUnassignedKind}
				size={size}
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
			size={size}
		>
			{assigneeAvatarSrc ? <AvatarImage src={assigneeAvatarSrc} alt="" /> : null}
			<AvatarFallback>{getIssueInitial(issueKey)}</AvatarFallback>
		</Avatar>
	);
}

function getJiraIssuePullRequestPresentation(status: JiraIssuePullRequestStatus | undefined): {
	Icon: typeof PullRequestIcon;
	colorClass: string;
	label: string;
} {
	switch (status) {
		case "failed":
			return {
				Icon: MergeFailureIcon,
				colorClass: "text-icon-danger",
				label: "Pull request failed",
			};
		case "merged":
			return {
				Icon: MergeSuccessIcon,
				colorClass: "text-icon-accent-purple",
				label: "Pull request merged",
			};
		case "open":
		case undefined:
			return {
				Icon: PullRequestIcon,
				colorClass: "text-icon-accent-lime",
				label: "Pull request",
			};
		default: {
			const exhaustive: never = status;
			throw new Error(`Unhandled pull request status: ${String(exhaustive)}`);
		}
	}
}

function JiraIssuePullRequestCluster({
	pullRequestNumber,
	pullRequestStatus,
	usesStrokeChrome,
}: Readonly<{
	pullRequestNumber: number;
	pullRequestStatus?: JiraIssuePullRequestStatus;
	usesStrokeChrome: boolean;
}>) {
	const { Icon, colorClass, label } = getJiraIssuePullRequestPresentation(pullRequestStatus);
	const icon = (
		<Icon
			label={usesStrokeChrome ? "" : label}
			color="currentColor"
			size={usesStrokeChrome ? "small" : undefined}
		/>
	);

	return (
		<div className={cn("flex items-center", usesStrokeChrome ? "gap-1.5" : "gap-1")}>
			{usesStrokeChrome ? (
				<IconTile
					as="span"
					className={colorClass}
					icon={icon}
					iconSize="small"
					label={label}
					size="xxsmall"
					variant="transparent"
				/>
			) : (
				<span className={colorClass}>
					{icon}
				</span>
			)}
			<span
				className={
					usesStrokeChrome
						? "font-mono text-xs font-normal leading-4 text-text-subtlest"
						: "text-xs font-semibold text-text-subtlest"
				}
			>
				#{pullRequestNumber}
			</span>
		</div>
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
	pullRequestNumber,
	pullRequestStatus,
	showAutomationIndicator,
	showPriorityIndicator,
	summary,
	tags,
	usesStrokeChrome,
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
	pullRequestNumber?: number;
	pullRequestStatus?: JiraIssuePullRequestStatus;
	showAutomationIndicator: boolean;
	showPriorityIndicator: boolean;
	summary: string;
	tags?: readonly JiraIssueTag[];
	usesStrokeChrome: boolean;
}>) {
	const PriorityIcon = PRIORITY_ICONS[priority];
	const priorityColor = PRIORITY_COLORS[priority];

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<div className="flex min-w-0 items-start gap-2">
				<span className={cn("min-w-0 flex-1", usesStrokeChrome ? "line-clamp-2 text-sm leading-5" : "text-sm")}>{summary}</span>
				<div className="size-6 shrink-0" data-slot="jira-issue-more-action" />
			</div>

			{parentEpicControl ? (
				<div className="flex min-w-0 flex-col items-start gap-1">
					<p className="text-sm font-semibold leading-5 text-text-subtle">Parent</p>
					{parentEpicControl}
				</div>
			) : null}

			{tags && tags.length > 0 ? (
				<TagGroup className="min-w-0 gap-1 overflow-hidden">
					{tags.map((tag, index) => (
						<Tag key={`${tag.text}-${index}`} color={tag.color}>
							{tag.text}
						</Tag>
					))}
				</TagGroup>
			) : null}

			<div className="pt-0.5">
				<div className="flex items-center justify-between">
					<div className={usesStrokeChrome ? "flex items-center gap-3" : "flex items-center gap-2"}>
						<div
							className={
								usesStrokeChrome
									? "flex items-center gap-1.5"
									: "flex items-center gap-1"
							}
						>
							{usesStrokeChrome ? (
								<IconTile
									as="span"
									icon={<TaskIcon label="" color={token("color.icon.brand")} size="small" />}
									iconSize="small"
									label={issueTypeLabel}
									size="xxsmall"
									variant="transparent"
								/>
							) : (
								<TaskIcon
									label={issueTypeLabel}
									color={token("color.icon.brand")}
								/>
							)}
							<span
								className={
									usesStrokeChrome
										? "font-mono text-xs font-normal leading-4 text-text-subtlest"
										: "text-xs font-semibold text-text-subtlest"
								}
							>
								{issueKey}
							</span>
						</div>
						{pullRequestNumber ? (
							<JiraIssuePullRequestCluster
								pullRequestNumber={pullRequestNumber}
								pullRequestStatus={pullRequestStatus}
								usesStrokeChrome={usesStrokeChrome}
							/>
						) : null}
					</div>

					{showAutomationIndicator ? (
						<span className="grid size-6 place-items-center text-icon-accent-orange" aria-label="Automation linked">
							<AutomationIcon label="" size="small" color="currentColor" />
						</span>
					) : (
						<div className="flex items-center gap-1.5">
							{showPriorityIndicator ? (
								<PriorityIcon
									label={`${priority} priority`}
									color={priorityColor}
									size={usesStrokeChrome ? "small" : undefined}
								/>
							) : null}
							{isMounted ? (
								<JiraIssueAssignee
									assigneeAvatarLabel={assigneeAvatarLabel}
									assigneeAvatarShape={assigneeAvatarShape}
									assigneeAvatarSrc={assigneeAvatarSrc}
									assigneePulse={assigneePulse}
									assigneeUnassignedKind={assigneeUnassignedKind}
									issueKey={issueKey}
									size={usesStrokeChrome ? "xs" : "sm"}
								/>
							) : null}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function JiraIssue(props: Readonly<JiraIssueProps>) {
	if (props.variant === "uncaptured-work") {
		return <JiraIssueUncapturedWork {...props} />;
	}

	return <JiraIssueDefault {...props} />;
}

function JiraIssueDefault({
	"aria-pressed": ariaPressed,
	active = false,
	agentActivities,
	agentActivityMode,
	agentDoneRuns = [],
	assigneeAvatarLabel,
	assigneeAvatarShape = "circle",
	assigneeAvatarSrc,
	assigneePulse = false,
	assigneeUnassignedKind,
	chrome = "raised",
	className,
	defaultSubtasksExpanded = false,
	dragging = false,
	draggable = true,
	generativeAction,
	issueKey,
	issueTypeLabel = "Task",
	onSubtasksExpandedChange,
	onAgentActivityOpenChange,
	onAgentActivityQuestionSubmit,
	onAgentActivityViewChat,
	onAgentDoneRunSubmit,
	onAgentDoneRunReview,
	onAgentDoneRunView,
	onMoreActionSelect,
	parentEpicControl,
	priority = "major",
	pullRequestNumber,
	pullRequestStatus,
	selected = false,
	showAutomationIndicator = false,
	showMoreAction = true,
	showPriorityIndicator = true,
	style,
	subtasks,
	subtasksCompleted,
	subtasksExpanded,
	subtasksLabel = "Subtasks",
	summary,
	tags,
	type = "button",
	variant = "default",
	...props
}: Readonly<JiraIssueDefaultProps>) {
	const isMounted = useIsMounted();
	const shouldReduceMotion = useReducedMotion();
	const subtasksPanelId = useId();
	const agentActivityLayoutGroupId = useId();
	const [generativeActionAnchor, setGenerativeActionAnchor] = useState<HTMLElement | null>(null);
	const [internalSubtasksExpanded, setInternalSubtasksExpanded] = useState(defaultSubtasksExpanded);
	const [generativeActionPointerActive, setGenerativeActionPointerActive] = useState(false);
	const [generativeActionFocusActive, setGenerativeActionFocusActive] = useState(false);
	const [generativeActionRevealSuppressed, setGenerativeActionRevealSuppressed] = useState(false);
	const [agentActivityHoverOpen, setAgentActivityHoverOpen] = useState(false);
	const [moreActionMenuOpen, setMoreActionMenuOpen] = useState(false);
	const generativeActionRevealActive = !agentActivityHoverOpen
		&& !moreActionMenuOpen
		&& !generativeActionRevealSuppressed
		&& (generativeActionPointerActive || generativeActionFocusActive);
	const hasSubtasks = Boolean(subtasks?.length);
	const resolvedSubtasksExpanded = subtasksExpanded ?? internalSubtasksExpanded;
	const completedSubtaskCount = getCompletedCount(subtasksCompleted, subtasks?.length ?? 0);
	const nonCompletedAgentActivities = (agentActivities ?? []).filter((activity) => activity.state !== "completed");
	const inferredAgentActivityMode: JiraIssueAgentActivityMode = nonCompletedAgentActivities.some((activity) => activity.state === "awaiting-input")
		? "awaiting-input"
		: nonCompletedAgentActivities.length > 0
			? "working"
			: agentDoneRuns.length > 0
				? "completed"
				: "none";
	const resolvedAgentActivityMode = agentActivityMode ?? inferredAgentActivityMode;
	const activeAgentActivities = resolvedAgentActivityMode === "none" || resolvedAgentActivityMode === "completed"
		? []
		: nonCompletedAgentActivities;
	const hasAgentDoneNotification = resolvedAgentActivityMode === "completed" && agentDoneRuns.length > 0;
	const inferredPullRequestNumber = agentDoneRuns.find((run) => run.pullRequestNumber)?.pullRequestNumber;
	const resolvedPullRequestNumber = pullRequestNumber ?? inferredPullRequestNumber;
	const hasActiveAgentActivityShell = resolvedAgentActivityMode === "working"
		|| resolvedAgentActivityMode === "awaiting-input"
		|| hasAgentDoneNotification;
	const hasIssueRows = hasSubtasks;
	const hasAgentActivityPresentation = agentActivityMode !== undefined || Boolean(agentActivities?.length) || hasAgentDoneNotification;
	const usesAgentActivityShell = hasAgentActivityPresentation;
	const hasInteractiveContent = showMoreAction || hasSubtasks || Boolean(parentEpicControl) || hasAgentActivityPresentation || Boolean(generativeAction);
	const shouldRenderIssueClickButton = Boolean(props.onClick && !parentEpicControl);
	const issueRowsClassName = cn("pt-1", !(hasSubtasks && resolvedSubtasksExpanded) && "pb-1");
	const layoutTransition = getJiraIssueLayoutTransition(shouldReduceMotion);
	const presenceMotion = getJiraIssuePresenceMotion(shouldReduceMotion);
	const usesStrokeChrome = chrome === "stroke";
	const idleBorderClassName = usesStrokeChrome
		? "border-border-disabled hover:border-border group-hover/jira-issue:border-border"
		: "border-transparent";
	const agentActivityIdleBorderClassName = usesStrokeChrome
		? "border-border-disabled group-hover/jira-issue-card:border-border"
		: "border-transparent";
	const rootBaseStyle: CSSProperties = {
		borderRadius: token("radius.large"),
		...(usesStrokeChrome ? undefined : { boxShadow: token("elevation.shadow.raised") }),
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
		"group/jira-issue relative w-full min-w-0 border outline-none focus-visible:border-ring",
		usesAgentActivityShell
			? "group/jira-issue-card border-transparent bg-transparent"
			: selected
				? "border-border-selected bg-bg-selected"
				: active
					? `${idleBorderClassName} bg-bg-selected`
					: `${idleBorderClassName} bg-surface`,
		"transition-[opacity,background-color,border-color] duration-normal ease-out",
		"data-starting-style:opacity-0 data-starting-style:-translate-y-1",
		!usesAgentActivityShell && className,
	);
	const agentActivitySurfaceClassName = cn(
		"pointer-events-none absolute border",
		selected
			? "border-border-selected bg-bg-selected"
			: active
				? `${agentActivityIdleBorderClassName} bg-bg-selected`
				: `${agentActivityIdleBorderClassName} bg-surface`,
	);
	const agentActivityShellClassName = cn(
		"relative w-full min-w-0 overflow-visible rounded-[10px] outline-none",
		"transition-[opacity,background-color,border-color] duration-normal ease-out",
		"data-starting-style:opacity-0 data-starting-style:-translate-y-1",
	);
	const agentActivityArticleClassName = cn(
		"group/jira-issue relative w-full min-w-0 overflow-visible outline-none",
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
	const agentActivitySurfaceStyle: CSSProperties = {
		...AGENT_ACTIVITY_SURFACE_STYLE,
		...(usesStrokeChrome ? { boxShadow: "none" } : undefined),
	};

	function handleSubtasksToggle() {
		const nextExpanded = !resolvedSubtasksExpanded;
		if (subtasksExpanded === undefined) {
			setInternalSubtasksExpanded(nextExpanded);
		}
		onSubtasksExpandedChange?.(nextExpanded);
	}

	function handleAgentActivityOpenChange(open: boolean) {
		setAgentActivityHoverOpen(open);
		onAgentActivityOpenChange?.(open);
	}

	function handleGenerativeActionPointerOver(event: PointerEvent<HTMLElement>) {
		if (
			event.target instanceof Element
			&& event.target.closest("[data-slot='jira-issue-agent-row']")
		) {
			setGenerativeActionRevealSuppressed(true);
			setGenerativeActionPointerActive(false);
			return;
		}

		if (event.currentTarget.contains(event.target as Node)) {
			setGenerativeActionRevealSuppressed(false);
			setGenerativeActionPointerActive(true);
		}
	}

	function handleGenerativeActionPointerOut(event: PointerEvent<HTMLElement>) {
		if (!event.currentTarget.contains(event.target as Node)) {
			return;
		}

		const nextTarget = event.relatedTarget as Node | null;
		if (event.currentTarget.contains(nextTarget)) {
			return;
		}

		setGenerativeActionPointerActive(false);
	}

	function handleGenerativeActionFocusCapture(event: FocusEvent<HTMLElement>) {
		if (
			event.target instanceof Element
			&& event.currentTarget.contains(event.target)
		) {
			setGenerativeActionRevealSuppressed(false);
			setGenerativeActionFocusActive(event.target.matches(":focus-visible"));
		}
	}

	function handleGenerativeActionBlurCapture(event: FocusEvent<HTMLElement>) {
		if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) {
			return;
		}

		const nextTarget = event.relatedTarget as Node | null;
		if (event.currentTarget.contains(nextTarget)) {
			return;
		}

		setGenerativeActionFocusActive(false);
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
			pullRequestNumber={resolvedPullRequestNumber}
			pullRequestStatus={pullRequestStatus}
			showAutomationIndicator={showAutomationIndicator}
			showPriorityIndicator={showPriorityIndicator}
			summary={summary}
			tags={tags}
			usesStrokeChrome={usesStrokeChrome}
		/>
	);
	const moreActionMenu = showMoreAction ? (
		<div className="absolute right-3 top-3 z-20 size-6">
			<JiraIssueMoreMenu
				issueKey={issueKey}
				onActionSelect={onMoreActionSelect}
				onOpenChange={setMoreActionMenuOpen}
			/>
		</div>
	) : null;
	const richIssueContent = (
		<div className="relative z-10 flex flex-col">
			{shouldRenderIssueClickButton ? (
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
			{moreActionMenu}
			<AnimatePresence initial={false} mode="popLayout">
				{hasIssueRows && subtasks ? (
					<motion.div
						key="issue-rows"
						animate={presenceMotion.animate}
						exit={presenceMotion.exit}
						initial={presenceMotion.initial}
						layout={shouldReduceMotion ? false : "position"}
						style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
						transition={layoutTransition}
					>
						<JiraIssueSeparator
							inset={usesAgentActivityShell ? agentActivitySurfaceInset : 0}
							usesStrokeChrome={usesStrokeChrome}
						/>
						<div className={issueRowsClassName}>
							<JiraIssueSubtasks
								completedCount={completedSubtaskCount}
								controlId={subtasksPanelId}
								expanded={resolvedSubtasksExpanded}
								hasInsetSurface={hasActiveAgentActivityShell}
								label={subtasksLabel}
								onToggle={handleSubtasksToggle}
								shouldReduceMotion={shouldReduceMotion}
								subtasks={subtasks}
								usesStrokeChrome={usesStrokeChrome}
							/>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
	const generativeActionMenu = generativeAction ? (
		<JiraIssueGenerativeActionMenu
			action={generativeAction}
			anchor={generativeActionAnchor}
			issue={{ issueKey, summary }}
			onOpenChange={(nextOpen) => setGenerativeActionRevealSuppressed(!nextOpen)}
			onTriggerBlur={() => setGenerativeActionFocusActive(false)}
			onTriggerFocus={() => setGenerativeActionFocusActive(true)}
			onTriggerPointerEnter={() => setGenerativeActionPointerActive(true)}
			onTriggerPointerLeave={() => setGenerativeActionPointerActive(false)}
			revealActive={generativeActionRevealActive}
		/>
	) : null;

	if (hasInteractiveContent) {
		if (usesAgentActivityShell) {
			return (
				<article
					ref={setGenerativeActionAnchor}
					draggable={draggable}
					className={agentActivityArticleClassName}
					data-active={active || undefined}
					data-dragging={dragging || undefined}
					data-selected={selected || undefined}
					data-variant={variant}
					data-agent-activity-mode={resolvedAgentActivityMode}
					onBlurCapture={handleGenerativeActionBlurCapture}
					onDragEnd={props.onDragEnd as ComponentProps<"article">["onDragEnd"]}
					onDragStart={props.onDragStart as ComponentProps<"article">["onDragStart"]}
					onFocusCapture={handleGenerativeActionFocusCapture}
					onPointerOut={handleGenerativeActionPointerOut}
					onPointerOver={handleGenerativeActionPointerOver}
					style={agentActivityArticleStyle}
				>
					<motion.div
						className={agentActivityShellClassName}
						initial={false}
						layout={shouldReduceMotion ? false : "size"}
						style={AGENT_ACTIVITY_SHELL_STYLE}
						transition={layoutTransition}
					>
						<motion.div
							aria-hidden="true"
							animate={shouldReduceMotion ? undefined : agentActivityBackdropAnimation}
							className="pointer-events-none absolute bg-bg-accent-gray-subtlest"
							initial={false}
							style={shouldReduceMotion ? { ...AGENT_ACTIVITY_BACKDROP_STYLE, ...agentActivityBackdropAnimation } : AGENT_ACTIVITY_BACKDROP_STYLE}
							transition={layoutTransition}
						/>
						<LayoutGroup id={agentActivityLayoutGroupId}>
							<motion.div
								className={rootClassName}
								data-slot="jira-issue-card"
								layout={shouldReduceMotion ? false : "position"}
								style={AGENT_ACTIVITY_INNER_STYLE}
								transition={layoutTransition}
							>
								<motion.div
									aria-hidden="true"
									animate={shouldReduceMotion ? undefined : agentActivitySurfaceAnimation}
									className={agentActivitySurfaceClassName}
									data-slot="jira-issue-surface"
									initial={false}
									style={shouldReduceMotion
										? { ...agentActivitySurfaceStyle, ...agentActivitySurfaceAnimation }
										: agentActivitySurfaceStyle}
									transition={layoutTransition}
								/>
								{richIssueContent}
							</motion.div>
							<JiraIssueAgentActivityRows
								activities={activeAgentActivities}
								onOpenChange={handleAgentActivityOpenChange}
								onQuestionSubmit={onAgentActivityQuestionSubmit}
								onViewChat={onAgentActivityViewChat}
								shouldReduceMotion={shouldReduceMotion}
								usesStrokeChrome={usesStrokeChrome}
							/>
							<AnimatePresence initial={false} mode="popLayout">
								{hasAgentDoneNotification ? (
									<motion.div
										key="agent-review"
										animate={presenceMotion.animate}
										exit={presenceMotion.exit}
										initial={presenceMotion.initial}
										layout={shouldReduceMotion ? false : "position"}
										style={shouldReduceMotion ? undefined : JIRA_ISSUE_MOTION_STYLE}
										transition={layoutTransition}
									>
										<JiraIssueAgentDone
											onOpenChange={handleAgentActivityOpenChange}
											onReview={onAgentDoneRunReview}
											onSubmit={onAgentDoneRunSubmit}
											onView={onAgentDoneRunView}
											runs={agentDoneRuns}
											usesStrokeChrome={usesStrokeChrome}
										/>
									</motion.div>
								) : null}
							</AnimatePresence>
						</LayoutGroup>
					</motion.div>
					{generativeActionMenu}
				</article>
			);
		}

		return (
			<article
				ref={setGenerativeActionAnchor}
				draggable={draggable}
				className={rootClassName}
				data-active={active || undefined}
				data-dragging={dragging || undefined}
				data-selected={selected || undefined}
				data-variant={variant}
				onBlurCapture={handleGenerativeActionBlurCapture}
				onDragEnd={props.onDragEnd as ComponentProps<"article">["onDragEnd"]}
				onDragStart={props.onDragStart as ComponentProps<"article">["onDragStart"]}
				onFocusCapture={handleGenerativeActionFocusCapture}
				onPointerOut={handleGenerativeActionPointerOut}
				onPointerOver={handleGenerativeActionPointerOver}
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
			data-active={active || undefined}
			data-dragging={dragging || undefined}
			data-selected={selected || undefined}
			data-variant={variant}
			style={buttonStyle}
			{...props}
		>
			{summaryContent}
		</button>
	);
}
