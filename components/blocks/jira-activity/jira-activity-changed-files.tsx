import { useState, type ReactNode } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import DragHandleVerticalIcon from "@atlaskit/icon/core/drag-handle-vertical";
import GridIcon from "@atlaskit/icon/core/grid";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import type { JiraAgentSessionItem } from "@/components/blocks/jira-agent-session";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { ArtifactList } from "@/components/ui-custom/artifact-list";
import { Button } from "@/components/ui/button";
import { ElapsedTime, RelativeTime } from "@/components/ui/elapsed-time";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

import type { JiraActivityChangedFilesEntry } from "./jira-activity-types";

function JiraActivitySessionTime({ item, fallback }: Readonly<{
	item: JiraAgentSessionItem;
	fallback: string;
}>) {
	const [seededStartedAtMs] = useState(
		() => Date.now() - Math.max(0, item.elapsedSeconds ?? 0) * 1000,
	);

	return item.state === "complete" ? (
		<RelativeTime
			fallback={fallback}
			secondsAgo={item.completedSecondsAgo}
			timestampMs={item.completedAtMs}
		/>
	) : (
		<ElapsedTime startedAtMs={item.startedAtMs ?? seededStartedAtMs} />
	);
}

function JiraActivityViewAction({
	item,
	onView,
}: Readonly<{
	item: JiraAgentSessionItem;
	onView?: (item: JiraAgentSessionItem) => void;
}>) {
	const handleView = () => onView?.(item);

	return (
		<Button
			aria-label={`Open ${item.agent.name}`}
			className="shrink-0 gap-1"
			onClick={handleView}
			size="compact"
			type="button"
			variant="outline"
		>
			Open
			<LinkExternalIcon label="" size="small" />
		</Button>
	);
}

/**
 * Agent output card using compact Artifact List rows. Legacy summary-only
 * entries retain the original single code-change row as a fallback.
 */
export function JiraActivityChangedFiles({
	entry,
	footer,
	onView,
	pullRequestNumber,
	status = "done",
	variant = "activity",
}: Readonly<{
	entry: JiraActivityChangedFilesEntry;
	footer?: ReactNode;
	onView?: (item: JiraAgentSessionItem) => void;
	pullRequestNumber?: number;
	status?: "done" | "failed" | "review";
	variant?: "activity" | "jira-issue";
}>) {
	if (entry.sessionItem && entry.outputs) {
		const isJiraIssue = variant === "jira-issue";
		const statusLabel = status === "review" && pullRequestNumber
			? `#${pullRequestNumber}`
			: status === "done" ? "Done" : "Failed";
		const statusIcon = status === "review"
			? <PullRequestIcon color="currentColor" label="" size="small" />
			: status === "done"
				? <StatusSuccessIcon color="currentColor" label="" size="small" />
				: <StatusErrorIcon color="currentColor" label="" size="small" />;
		const statusIconClassName = status === "failed" ? "text-icon-danger" : "text-icon-success";

		return (
			<div
				className={cn(
					"w-full bg-surface",
					isJiraIssue ? "rounded-xl" : "overflow-hidden rounded-lg border border-border",
				)}
			>
				<div className="flex h-14 min-w-0 items-center gap-3 px-3">
					<AgentAvatarVisual
						avatarClassName="shrink-0"
						avatarSrc={entry.sessionItem.agent.avatarSrc}
						brandName={entry.sessionItem.agent.brandName}
						label={entry.sessionItem.agent.name}
						sizePx={32}
						vpkLogo={entry.sessionItem.agent.vpkLogo}
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium leading-5 text-text">
							{entry.sessionItem.title}
						</p>
						<div className="flex items-center gap-1 text-xs leading-4 text-text-subtle">
							<span
								className={cn(
									"flex shrink-0 items-center gap-1",
									status === "review" ? "text-text-subtlest" : "text-text",
								)}
							>
								<Icon
									aria-hidden
									className={statusIconClassName}
									render={statusIcon}
								/>
								{statusLabel}
							</span>
							<span aria-hidden className="text-text-subtlest">·</span>
							<JiraActivitySessionTime
								fallback={entry.timestamp}
								item={entry.sessionItem}
							/>
							<span aria-hidden className="text-text-subtlest">·</span>
							<span className="truncate">{entry.sessionItem.agent.name}</span>
						</div>
					</div>
					<JiraActivityViewAction item={entry.sessionItem} onView={onView} />
				</div>
				{entry.description ? (
					<p className={cn("px-3 text-sm leading-5 text-text", isJiraIssue ? "pb-2" : "pb-3")}>
						{entry.description}
					</p>
				) : null}

				{entry.outputs.length > 0 ? (
					<ArtifactList
						className={isJiraIssue ? "mx-3 rounded-lg" : "rounded-none border-x-0 border-b-0"}
						items={entry.outputs}
						variant="compact"
					/>
				) : null}
				{footer ? (
					<div
						className={isJiraIssue
							? entry.outputs.length > 0 ? "p-3" : "px-3 pb-3 pt-0"
							: undefined}
					>
						{footer}
					</div>
				) : null}
			</div>
		);
	}

	return (
		<div className="w-full overflow-hidden rounded-lg border border-border bg-surface">
			<div className="flex items-center gap-2 px-3 py-2.5 text-sm leading-5">
				<span className="font-medium text-text">{entry.actor.name}</span>
				<span className="text-text-subtle">{entry.timestamp}</span>
				{entry.tag ? <Tag color={entry.tag.color ?? "gray"}>{entry.tag.text}</Tag> : null}
				<Button
					aria-label="More actions"
					className="ml-auto"
					size="icon-compact"
					type="button"
					variant="ghost"
				>
					<ShowMoreHorizontalIcon label="" />
				</Button>
			</div>

			<div className="flex items-center gap-2 border-t border-border px-3 py-2.5 text-sm leading-5">
				<Icon
					aria-hidden
					className="shrink-0 text-icon-subtlest"
					render={<DragHandleVerticalIcon color="currentColor" label="" size="small" />}
				/>
				<span className="shrink-0 font-medium text-text">{entry.summary}</span>
				<span className="min-w-0 flex-1 truncate text-text-subtlest">
					{entry.description}
				</span>
				{entry.branch ? (
					<Tag
						className="shrink-0"
						color="gray"
						elemBefore={
							<Icon
								aria-hidden
								render={<PullRequestIcon color="currentColor" label="" size="small" />}
							/>
						}
						shape="rounded"
					>
						{entry.branch}
					</Tag>
				) : null}
				<Icon
					aria-hidden
					className="shrink-0 text-icon-subtle"
					render={<GridIcon color="currentColor" label="" size="small" />}
				/>
				<Icon
					aria-hidden
					className="shrink-0 text-icon-subtle"
					render={<ChevronRightIcon color="currentColor" label="" size="small" />}
				/>
			</div>
		</div>
	);
}
