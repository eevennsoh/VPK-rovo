"use client";

import { useId, useState, type ComponentProps, type CSSProperties, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition } from "motion/react";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";

import {
	JiraIssueAgentActivityRows,
	JiraIssueAgentDone,
	type JiraIssueAgentActivity,
	type JiraIssueAgentActivityMode,
} from "@/components/blocks/jira-issue/agent-activity";
import type { QuestionCardAnswers } from "@/components/blocks/question-card/types";
import { JiraIssueCountBadge } from "@/components/blocks/jira-issue/count-badge";
import {
	JiraIssueGenerativeActionMenu,
	type JiraIssueGenerativeActionConfig,
} from "@/components/blocks/jira-issue/generative-action-menu";
import { useIsMounted } from "@/components/hooks/use-is-mounted";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarUnassigned,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import { Tag, TagGroup, type TagColor } from "@/components/ui/tag";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type JiraIssuePriority = "major" | "medium" | "minor";
export type {
	JiraIssueAgentActivity,
	JiraIssueAgentActivityMode,
	JiraIssueAgentActivityState,
} from "@/components/blocks/jira-issue/agent-activity";
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
	onAgentActivityOpenChange?: (open: boolean) => void;
	onAgentActivityQuestionSubmit?: (activity: JiraIssueAgentActivity, answers: QuestionCardAnswers) => void;
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

function getIssueInitial(issueKey: string): string {
	return issueKey[0]?.toUpperCase() ?? "U";
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

function JiraIssueSubtasks({
	completedCount,
	controlId,
	expanded,
	hasInsetSurface,
	label,
	onToggle,
	shouldReduceMotion,
	subtasks,
}: Readonly<{
	completedCount: number;
	controlId: string;
	expanded: boolean;
	hasInsetSurface: boolean;
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
						className={cn("flex flex-col gap-2 px-3 pt-1", hasInsetSurface ? "pb-2" : "pb-3")}
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
	onAgentActivityOpenChange,
	onAgentActivityQuestionSubmit,
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
	const [generativeActionAnchor, setGenerativeActionAnchor] = useState<HTMLElement | null>(null);
	const [internalSubtasksExpanded, setInternalSubtasksExpanded] = useState(defaultSubtasksExpanded);
	const [generativeActionPointerActive, setGenerativeActionPointerActive] = useState(false);
	const [generativeActionFocusActive, setGenerativeActionFocusActive] = useState(false);
	const generativeActionRevealActive = generativeActionPointerActive || generativeActionFocusActive;
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
	const shouldRenderIssueClickButton = Boolean(props.onClick && !parentEpicControl);
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

	function handleGenerativeActionPointerOver(event: PointerEvent<HTMLElement>) {
		if (generativeAction && event.currentTarget.contains(event.target as Node)) {
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
			generativeAction
			&& event.target instanceof Element
			&& event.currentTarget.contains(event.target)
		) {
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
			showAutomationIndicator={showAutomationIndicator}
			showPriorityIndicator={showPriorityIndicator}
			summary={summary}
			tags={tags}
		/>
	);
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
										hasInsetSurface={hasActiveAgentActivityShell}
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
		<JiraIssueGenerativeActionMenu
			action={generativeAction}
			anchor={generativeActionAnchor}
			issue={{ issueKey, summary }}
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
					data-dragging={dragging || undefined}
					data-selected={selected || undefined}
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
						style={agentActivityShellStyle}
						transition={layoutTransition}
					>
						<motion.div
							aria-hidden="true"
							animate={shouldReduceMotion ? undefined : agentActivityBackdropAnimation}
							className="pointer-events-none absolute bg-bg-accent-gray-subtlest"
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
								onOpenChange={onAgentActivityOpenChange}
								onQuestionSubmit={onAgentActivityQuestionSubmit}
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
				ref={setGenerativeActionAnchor}
				draggable={draggable}
				className={rootClassName}
				data-dragging={dragging || undefined}
				data-selected={selected || undefined}
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
			data-dragging={dragging || undefined}
			data-selected={selected || undefined}
			style={buttonStyle}
			{...props}
		>
			{summaryContent}
		</button>
	);
}
