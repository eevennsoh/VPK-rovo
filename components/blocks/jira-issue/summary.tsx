"use client";

import type { ReactNode } from "react";
import AutomationIcon from "@atlaskit/icon/core/automation";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import TaskIcon from "@atlaskit/icon/core/task";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarUnassigned,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
import { IconTile } from "@/components/ui/icon-tile";
import { Tag, TagGroup } from "@/components/ui/tag";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { getIssueInitial } from "@/components/blocks/jira-issue/lib";
import type {
	JiraIssuePriority,
	JiraIssuePullRequestStatus,
	JiraIssueTag,
} from "@/components/blocks/jira-issue/types";

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
		<div className={cn("flex shrink-0 items-center", usesStrokeChrome ? "gap-1.5" : "gap-1")}>
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

export function JiraIssueSummary({
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
	const pullRequestCluster = pullRequestNumber ? (
		<JiraIssuePullRequestCluster
			pullRequestNumber={pullRequestNumber}
			pullRequestStatus={pullRequestStatus}
			usesStrokeChrome={usesStrokeChrome}
		/>
	) : null;
	const metadataCluster = showAutomationIndicator ? (
		<span className="grid size-6 place-items-center text-icon-accent-orange" aria-label="Automation linked">
			<AutomationIcon label="" size="small" color="currentColor" />
		</span>
	) : (
		<div className="flex shrink-0 items-center gap-1.5">
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
	);

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
				<div className="flex min-w-0 items-center justify-between">
					<div className={usesStrokeChrome ? "flex min-w-0 items-center" : "flex min-w-0 items-center gap-2"}>
						<div
							className={
								usesStrokeChrome
									? "flex shrink-0 items-center gap-1.5"
									: "flex shrink-0 items-center gap-1"
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
						{usesStrokeChrome ? null : pullRequestCluster}
					</div>

					{usesStrokeChrome && pullRequestCluster ? (
						<div className="flex shrink-0 items-center gap-1.5">
							{pullRequestCluster}
							{metadataCluster}
						</div>
					) : (
						metadataCluster
					)}
				</div>
			</div>
		</div>
	);
}

