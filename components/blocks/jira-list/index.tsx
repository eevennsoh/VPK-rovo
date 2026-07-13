"use client";

import type { ComponentProps, ReactNode } from "react";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import BugIcon from "@atlaskit/icon/core/bug";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import EpicIcon from "@atlaskit/icon/core/epic";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";
import AddIcon from "@atlaskit/icon/core/add";

import type { JiraIssuePriority, JiraIssueTag } from "@/components/blocks/jira-issue";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarImage,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, TagGroup } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export type JiraListPriority = JiraIssuePriority;
export type JiraListTag = JiraIssueTag;
export type JiraListIssueType = "epic" | "task" | "story" | "subtask" | "bug";

export interface JiraListPerson {
	id: string;
	name: string;
	avatarSrc?: string;
	avatarShape?: NonNullable<AvatarProps["shape"]>;
	avatarUnassignedKind?: AvatarUnassignedKind;
}

export interface JiraListGoal {
	text: string;
	emphasis?: "default" | "warning";
}

export interface JiraListRowData {
	issueKey: string;
	summary: string;
	issueType: JiraListIssueType;
	priority: JiraListPriority;
	status: string;
	statusVariant?: ComponentProps<typeof Lozenge>["variant"];
	indentLevel?: number;
	hasChildren?: boolean;
	isExpanded?: boolean;
	assignee?: JiraListPerson;
	agentSessions?: readonly string[];
	goals?: readonly JiraListGoal[];
	labels?: readonly JiraListTag[];
	dueDate?: string;
	contributors?: readonly JiraListPerson[];
}

export interface JiraListProps {
	rows: readonly JiraListRowData[];
	ariaLabel?: string;
	className?: string;
	createLabel?: string;
	totalCountLabel?: string;
	visibleCount?: number;
	selectedIssueKeys?: ReadonlySet<string>;
	onCreate?: () => void;
	onIssueClick?: (row: JiraListRowData) => void;
	onIssueKeyClick?: (row: JiraListRowData) => void;
	onSelectAllRows?: (checked: boolean) => void;
	onSelectRow?: (issueKey: string, checked: boolean) => void;
	onToggleExpand?: (issueKey: string) => void;
}

const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
} as const;

const ISSUE_TYPE_ICONS = {
	epic: EpicIcon,
	task: TaskIcon,
	story: StoryIcon,
	subtask: SubtasksIcon,
	bug: BugIcon,
} as const;

function getPersonInitials(name: string): string {
	return name
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function JiraListAvatar({ person }: Readonly<{ person: JiraListPerson }>) {
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

function IssueTypeGlyph({ issueType }: Readonly<{ issueType: JiraListIssueType }>) {
	const IssueTypeIcon = ISSUE_TYPE_ICONS[issueType];
	return (
		<Icon
			className="text-icon-brand"
			label={issueType}
			render={<IssueTypeIcon label="" size="small" />}
		/>
	);
}

function PriorityGlyph({ priority }: Readonly<{ priority: JiraListPriority }>) {
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

function OverflowBadge({
	count,
	label,
}: Readonly<{
	count: number;
	label: string;
}>) {
	return count > 0 ? <Badge aria-label={label}>+{count}</Badge> : null;
}

function renderAgentSessions(agentSessions: readonly string[] | undefined): ReactNode {
	if (!agentSessions || agentSessions.length === 0) {
		return <span className="text-text-subtle text-sm">None</span>;
	}

	const visibleSessions = agentSessions.slice(0, 2);
	return (
		<div className="flex min-w-0 items-center gap-1 overflow-hidden">
			<TagGroup className="min-w-0 gap-1">
				{visibleSessions.map((session) => (
					<Tag className="max-w-[7rem]" color="teal" key={session}>
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

function renderGoals(goals: readonly JiraListGoal[] | undefined): ReactNode {
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

function renderLabels(labels: readonly JiraListTag[] | undefined): ReactNode {
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

function renderContributors(contributors: readonly JiraListPerson[] | undefined): ReactNode {
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

export function JiraList({
	rows,
	ariaLabel = "Jira list view",
	className,
	createLabel = "Create",
	totalCountLabel = `${rows.length}`,
	visibleCount = rows.length,
	selectedIssueKeys = new Set<string>(),
	onCreate,
	onIssueClick,
	onIssueKeyClick,
	onSelectAllRows,
	onSelectRow,
	onToggleExpand,
}: Readonly<JiraListProps>) {
	const selectableRowCount = rows.length;
	const selectedRowCount = rows.filter((row) => selectedIssueKeys.has(row.issueKey)).length;
	const allRowsSelected = selectableRowCount > 0 && selectedRowCount === selectableRowCount;
	const someRowsSelected = selectedRowCount > 0 && !allRowsSelected;

	return (
		<section
			aria-label={ariaLabel}
			className={cn(
				"flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-border bg-surface",
				className,
			)}
			data-testid="jira-list"
		>
			<div className="min-h-0 flex-1 overflow-auto">
				<Table className="min-w-[1570px] table-fixed">
					<colgroup>
						<col className="w-10" />
						<col className="w-[438px]" />
						<col className="w-[126px]" />
						<col className="w-[214px]" />
						<col className="w-[247px]" />
						<col className="w-[132px]" />
						<col className="w-[61px]" />
						<col className="w-[112px]" />
						<col className="w-[114px]" />
						<col className="w-[173px]" />
					</colgroup>
					<TableHeader className="sticky top-0 z-10 bg-surface-sunken">
						<TableRow className="hover:bg-transparent">
							<TableHead className="h-10 bg-surface-sunken px-2">
								<div className="flex items-center justify-center">
									<Checkbox
										aria-label="Select all work items"
										checked={allRowsSelected}
										disabled={selectableRowCount === 0}
										isIndeterminate={someRowsSelected}
										onCheckedChange={(checked) => onSelectAllRows?.(Boolean(checked))}
									/>
								</div>
							</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Work</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Status</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Assignee</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Agent sessions</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Goals</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Priority</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Labels</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">Due date</TableHead>
							<TableHead className="h-10 bg-surface-sunken px-2 text-text-subtle">
								<span className="inline-flex items-center gap-1">
									Contributors
									<Icon className="text-icon-subtle" render={<ArrowUpIcon label="" size="small" />} />
								</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => {
							const isSelected = selectedIssueKeys.has(row.issueKey);
							return (
								<TableRow data-state={isSelected ? "selected" : undefined} key={row.issueKey}>
									<TableCell className="h-10 px-2">
										<div className="flex items-center justify-center">
											<Checkbox
												aria-label={`Select ${row.issueKey}`}
												checked={isSelected}
												onCheckedChange={(checked) => onSelectRow?.(row.issueKey, Boolean(checked))}
											/>
										</div>
									</TableCell>
									<TableCell className="h-10 px-2">
										<div
											className="flex min-w-0 items-center gap-1.5"
											style={{ paddingInlineStart: `${8 + (row.indentLevel ?? 0) * 24}px` }}
										>
											{row.hasChildren ? (
												<Button
													aria-label={`${row.isExpanded ? "Collapse" : "Expand"} ${row.issueKey}`}
													className="size-6 shrink-0 px-0"
													onClick={() => onToggleExpand?.(row.issueKey)}
													size="icon"
													variant="ghost"
												>
													<Icon
														className="text-icon-subtle"
														render={
															row.isExpanded ? (
																<ChevronDownIcon label="" size="small" />
															) : (
																<ChevronRightIcon label="" size="small" />
															)
														}
													/>
												</Button>
											) : (
												<span aria-hidden="true" className="block size-6 shrink-0" />
											)}
											<IssueTypeGlyph issueType={row.issueType} />
											<Button
												className="h-auto shrink-0 px-0 text-link"
												onClick={() => onIssueKeyClick?.(row)}
												size="default"
												variant="link"
											>
												{row.issueKey}
											</Button>
											<button
												className="truncate text-left text-sm text-text hover:text-text focus-visible:text-link focus-visible:outline-none"
												onClick={() => onIssueClick?.(row)}
												type="button"
											>
												{row.summary}
											</button>
										</div>
									</TableCell>
									<TableCell className="h-10 px-2">
										<Lozenge variant={row.statusVariant ?? "neutral"}>{row.status}</Lozenge>
									</TableCell>
									<TableCell className="h-10 px-2">
										{row.assignee ? (
											<div className="flex min-w-0 items-center gap-2">
												<JiraListAvatar person={row.assignee} />
												<span className="truncate text-sm text-text">{row.assignee.name}</span>
											</div>
										) : (
											<span className="text-text-subtle text-sm">Unassigned</span>
										)}
									</TableCell>
									<TableCell className="h-10 px-2">{renderAgentSessions(row.agentSessions)}</TableCell>
									<TableCell className="h-10 px-2">{renderGoals(row.goals)}</TableCell>
									<TableCell className="h-10 px-2">
										<div className="flex items-center justify-center">
											<PriorityGlyph priority={row.priority} />
										</div>
									</TableCell>
									<TableCell className="h-10 px-2">{renderLabels(row.labels)}</TableCell>
									<TableCell className="h-10 px-2 text-sm text-text-subtle">
										{row.dueDate ?? "No due date"}
									</TableCell>
									<TableCell className="h-10 px-2">{renderContributors(row.contributors)}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between border-t border-border bg-surface px-2 py-2">
				<Button className="gap-1.5 text-text-subtle" onClick={onCreate} variant="ghost">
					<Icon className="text-icon-subtle" render={<AddIcon label="" size="small" />} />
					{createLabel}
				</Button>
				<p className="text-sm font-semibold text-text-subtle">
					{visibleCount} of <span className="text-link">{totalCountLabel}</span>
				</p>
			</div>
		</section>
	);
}
