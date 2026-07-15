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
	AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Tag, TagGroup } from "@/components/ui/tag";
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

export const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
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
				priority === "minor" && "text-icon-success",
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

	const visibleSessions = agentSessions.slice(0, 1);
	return (
		<div className="flex min-w-0 items-center gap-1 overflow-hidden">
			<TagGroup className="min-w-0 gap-1">
				{visibleSessions.map((session, sessionIndex) => (
					<Tag className="max-w-[7rem]" color="teal" key={`${session}-${sessionIndex}`}>
						{session}
					</Tag>
				))}
			</TagGroup>
			<OverflowBadge
				count={Math.max(0, agentSessions.length - visibleSessions.length)}
				label={`${agentSessions.length - visibleSessions.length} more agent sessions`}
			/>
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
	return (
		<div className="flex min-w-0 items-center gap-1 overflow-hidden">
			<TagGroup className="min-w-0 gap-1">
				{visibleLabels.map((label) => (
					<Tag className="max-w-[5.75rem]" color={label.color} key={`${label.text}-${label.color}`}>
						{label.text}
					</Tag>
				))}
			</TagGroup>
			<OverflowBadge
				count={Math.max(0, labels.length - visibleLabels.length)}
				label={`${labels.length - visibleLabels.length} more labels`}
			/>
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
		<AvatarGroup
			className="-space-x-1.5 *:data-[slot=avatar]:ring-0!"
			label={`Contributors: ${contributors.map((contributor) => contributor.name).join(", ")}`}
		>
			{visibleContributors.map((contributor) => (
				<JiraListAvatar key={contributor.id} person={contributor} />
			))}
			{overflowCount > 0 ? (
				<Avatar aria-label={`${overflowCount} more contributors`} size="sm">
					<AvatarFallback className="bg-bg-neutral-bold text-[10px] font-semibold text-text-inverse">
						+{overflowCount}
					</AvatarFallback>
				</Avatar>
			) : null}
		</AvatarGroup>
	);
}
