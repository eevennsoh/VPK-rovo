import type { ReactNode } from "react";
import BugIcon from "@atlaskit/icon/core/bug";
import EpicIcon from "@atlaskit/icon/core/epic";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";

import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
	AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

import type {
	JiraListColumnAnchorId,
	JiraListExtraColumn,
	JiraListGoal,
	JiraListIssueType,
	JiraListPerson,
	JiraListPriority,
	JiraListRowData,
	JiraListTag,
} from "@/components/blocks/jira-list/jira-list-types";

const DEFAULT_EXTRA_COLUMN_WIDTH_CLASS = "w-[156px]";

const AGENT_SESSION_AVATAR_SRCS: Readonly<Record<string, string>> = {
	"Survey summarizer": "/avatar-agent/product-agents/feedback-analyzer.svg",
	"Readiness checker": "/avatar-agent/teamwork-agents/readiness-checker.svg",
	"Theme analyzer": "/avatar-agent/teamwork-agents/jira-theme-analyzer.svg",
	"Signal monitor": "/avatar-agent/dev-agents/code-observer-signalfx.svg",
	"Checklist drafter": "/avatar-agent/teamwork-agents/workflow-builder.svg",
	"Content reviewer": "/avatar-agent/dev-agents/code-reviewer.svg",
	"Launch planner": "/avatar-agent/dev-agents/code-planner.svg",
	"Release notes drafter": "/avatar-agent/teamwork-agents/release-notes-drafter.svg",
	"Approval tracker": "/avatar-agent/teamwork-agents/progress-tracker.svg",
	"Bug triage": "/avatar-agent/teamwork-agents/bug-report-assistant.svg",
	"Insight summarizer": "/avatar-agent/strategy-agents/strategic-insight.svg",
	"Editor": "/avatar-agent/dev-agents/code-documentation-writer.svg",
};

export const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
} as const;

export const PRIORITY_LABELS = {
	major: "Major",
	medium: "Medium",
	minor: "Minor",
} as const;

export const ISSUE_TYPE_ICONS = {
	epic: EpicIcon,
	task: TaskIcon,
	story: StoryIcon,
	subtask: SubtasksIcon,
	bug: BugIcon,
} as const;

export function HierarchyConnector({
	indentLevel,
}: Readonly<{
	indentLevel: number;
}>) {
	if (indentLevel <= 0) {
		return null;
	}

	return (
		<div
			aria-hidden="true"
			className="relative shrink-0"
			style={{ width: `${indentLevel * 18}px` }}
		>
			<span className="absolute inset-y-0 left-2 w-px bg-border" />
			<span className="absolute top-1/2 left-2 h-px w-3 -translate-y-1/2 bg-border" />
		</div>
	);
}

export function getPersonInitials(name: string): string {
	return name
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

export function JiraListAvatar({ person }: Readonly<{ person: JiraListPerson }>) {
	if (person.avatarUnassignedKind) {
		return (
			<Avatar label={person.name} shape={person.avatarShape ?? "circle"} size="sm">
				<AvatarFallback>{person.avatarUnassignedKind === "agent" ? "AI" : "?"}</AvatarFallback>
			</Avatar>
		);
	}

	return (
		<Avatar label={person.name} shape={person.avatarShape ?? "circle"} size="sm">
			{person.avatarSrc ? <AvatarImage alt="" src={person.avatarSrc} /> : null}
			<AvatarFallback>{getPersonInitials(person.name)}</AvatarFallback>
		</Avatar>
	);
}

export function IssueTypeGlyph({ issueType }: Readonly<{ issueType: JiraListIssueType }>) {
	const IssueTypeIcon = ISSUE_TYPE_ICONS[issueType];
	return (
		<Icon
			className="text-icon-brand"
			label={issueType}
			render={<IssueTypeIcon label="" size="small" />}
		/>
	);
}

export function PriorityGlyph({ priority }: Readonly<{ priority: JiraListPriority }>) {
	const PriorityIcon = PRIORITY_ICONS[priority];
	return (
		<Icon
			className={cn(
				priority === "major" && "text-icon-danger",
				priority === "medium" && "text-icon-information",
				priority === "minor" && "text-icon-information",
			)}
			label={`${priority} priority`}
			render={<PriorityIcon label="" size="small" />}
		/>
	);
}

export function OverflowBadge({
	count,
	label,
}: Readonly<{
	count: number;
	label: string;
}>) {
	return count > 0 ? <Badge aria-label={label}>+{count}</Badge> : null;
}

function OverflowMenu({
	children,
	count,
	label,
}: Readonly<{
	children: ReactNode;
	count: number;
	label: string;
}>) {
	if (count <= 0) {
		return null;
	}

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Badge
						aria-label={`Show ${count} more ${label}`}
						className="cursor-pointer"
						render={<button type="button" />}
					>
						+{count}
					</Badge>
				}
			/>
			<PopoverContent
				align="start"
				className="w-auto min-w-36 gap-0 p-1 shadow-xl"
				sideOffset={6}
			>
				<ul aria-label={`More ${label}`} className="flex flex-col gap-1">{children}</ul>
			</PopoverContent>
		</Popover>
	);
}

function AgentSessionTag({ session }: Readonly<{ session: string }>) {
	const avatarSrc = AGENT_SESSION_AVATAR_SRCS[session];

	return (
		<Tag
			className="max-w-full self-center"
			elemBefore={
				<Avatar label={`${session} agent`} shape="hexagon" size="xs">
					{avatarSrc ? <AvatarImage alt="" src={avatarSrc} /> : null}
					<AvatarFallback>AI</AvatarFallback>
				</Avatar>
			}
			maxWidth="100%"
		>
			{session}
		</Tag>
	);
}

export interface JiraListColumnDefinition {
	id: JiraListColumnAnchorId;
	label: string;
	widthClassName: string;
	align?: "left" | "center";
	headerContent?: ReactNode;
	renderCell: (row: JiraListRowData) => ReactNode;
}

export function getOrderedColumns(
	baseColumns: readonly JiraListColumnDefinition[],
	extraColumns: readonly JiraListExtraColumn[],
): JiraListColumnDefinition[] {
	const orderedColumns = [...baseColumns];

	for (const extraColumn of extraColumns) {
		const anchorIndex = orderedColumns.findIndex((column) => column.id === extraColumn.afterColumnId);
		orderedColumns.splice(anchorIndex === -1 ? orderedColumns.length : anchorIndex + 1, 0, {
			id: extraColumn.id,
			label: extraColumn.label,
			widthClassName: extraColumn.widthClassName ?? DEFAULT_EXTRA_COLUMN_WIDTH_CLASS,
			renderCell: (row) => (
				<span className="text-sm text-text-subtle">
					{extraColumn.valuesByIssueKey?.[row.issueKey] ?? "None"}
				</span>
			),
		});
	}

	return orderedColumns;
}

export function renderAgentSessions(agentSessions: readonly string[] | undefined): ReactNode {
	if (!agentSessions || agentSessions.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const [visibleSession, ...overflowSessions] = agentSessions;
	return (
		<div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
			<div className="flex min-w-0 items-center">
				<AgentSessionTag session={visibleSession} />
			</div>
			<OverflowMenu count={overflowSessions.length} label="agent sessions">
				{overflowSessions.map((session) => (
					<li className="flex" key={session}>
						<AgentSessionTag session={session} />
					</li>
				))}
			</OverflowMenu>
		</div>
	);
}

export function renderGoals(goals: readonly JiraListGoal[] | undefined): ReactNode {
	if (!goals || goals.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const [primaryGoal, ...secondaryGoals] = goals;
	return (
		<div className="flex min-w-0 items-center gap-1 overflow-hidden">
			<span
				className={cn(
					"truncate text-sm",
					primaryGoal.emphasis === "warning" ? "text-text-warning" : "text-link",
				)}
			>
				{primaryGoal.text}
			</span>
			<OverflowBadge
				count={secondaryGoals.length}
				label={`${secondaryGoals.length} more goals`}
			/>
		</div>
	);
}

export function renderLabels(labels: readonly JiraListTag[] | undefined): ReactNode {
	if (!labels || labels.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const visibleLabels = labels.slice(0, 2);
	const overflowLabels = labels.slice(visibleLabels.length);
	return (
		<div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
			<div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
				{visibleLabels.map((label) => (
					<Tag className="max-w-[6.5rem] self-center" color={label.color} key={`${label.text}-${label.color}`}>
						{label.text}
					</Tag>
				))}
			</div>
			<OverflowMenu count={overflowLabels.length} label="labels">
				{overflowLabels.map((label) => (
					<li className="flex" key={`${label.text}-${label.color}`}>
						<Tag className="self-center" color={label.color}>{label.text}</Tag>
					</li>
				))}
			</OverflowMenu>
		</div>
	);
}

export function renderContributors(contributors: readonly JiraListPerson[] | undefined): ReactNode {
	if (!contributors || contributors.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const visibleContributors = contributors.slice(0, 3);
	const overflowCount = Math.max(0, contributors.length - visibleContributors.length);
	return (
		<AvatarGroup label={`Contributors: ${contributors.map((contributor) => contributor.name).join(", ")}`}>
			{visibleContributors.map((contributor) => (
				<JiraListAvatar key={contributor.id} person={contributor} />
			))}
			{overflowCount > 0 ? (
				<AvatarGroupCount>+{overflowCount}</AvatarGroupCount>
			) : null}
		</AvatarGroup>
	);
}
