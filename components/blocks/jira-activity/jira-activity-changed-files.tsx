import type { ReactNode } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import DragHandleVerticalIcon from "@atlaskit/icon/core/drag-handle-vertical";
import GridIcon from "@atlaskit/icon/core/grid";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";

import {
	AgentListActivityHeader,
	type AgentListItem,
} from "@/components/blocks/agent-list";
import { ArtifactList, type ArtifactListItem } from "@/components/ui-custom/artifact-list";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";

import type { JiraActivityChangedFilesEntry } from "./jira-activity-types";

/**
 * Agent output card using compact Artifact List rows. Legacy summary-only
 * entries retain the original single code-change row as a fallback.
 *
 * Activity-feed chrome matches {@link JiraActivityCard}: transparent, borderless
 * shell with the artifact list as a nested attachment. The `jira-issue` variant
 * keeps denser padded chrome for hover-card surfaces.
 */
export function JiraActivityChangedFiles({
	entry,
	footer,
	hideLeadAvatar = false,
	onOutputOpen,
	onView,
	outputOpenLabel = "Open",
	status = "done",
	variant = "activity",
	viewActionLabel = "Open",
}: Readonly<{
	entry: JiraActivityChangedFilesEntry;
	footer?: ReactNode;
	/** When true, omit the session header avatar (timeline node already shows it). */
	hideLeadAvatar?: boolean;
	onOutputOpen?: (item: ArtifactListItem) => void;
	onView?: (item: AgentListItem) => void;
	outputOpenLabel?: "Open" | "View";
	status?: "done" | "failed" | "review";
	variant?: "activity" | "jira-issue";
	viewActionLabel?: "Open" | "View";
}>) {
	if (entry.sessionItem && entry.outputs) {
		const sessionItem = entry.sessionItem;
		const isJiraIssue = variant === "jira-issue";
		const statusPresentation = status === "failed"
			? {
					icon: <StatusErrorIcon color="currentColor" label="" size="small" />,
					iconClassName: "text-icon-danger",
					label: "Failed",
				}
			: null;
		const header = (
			<AgentListActivityHeader
				action={(
					<Button
						aria-label={`${viewActionLabel} ${sessionItem.agent.name}`}
						className="shrink-0 gap-1"
						onClick={() => onView?.(sessionItem)}
						size="compact"
						type="button"
						variant="outline"
					>
						{viewActionLabel}
						{viewActionLabel === "Open" ? <LinkExternalIcon label="" size="small" /> : null}
					</Button>
				)}
				hideAvatar={hideLeadAvatar}
				item={sessionItem}
				metadataPrefix={statusPresentation ? (
					<span className="flex shrink-0 items-center gap-1 text-text">
						<Icon
							aria-hidden
							className={statusPresentation.iconClassName}
							render={statusPresentation.icon}
						/>
						{statusPresentation.label}
					</span>
				) : undefined}
				timeFallback={entry.timestamp}
			/>
		);
		const description = entry.description ? (
			<p className="text-sm leading-5 text-text">{entry.description}</p>
		) : null;
		const outputs = entry.outputs.length > 0 ? (
			<ArtifactList
				className={isJiraIssue
					? "mx-3 rounded-lg"
					// Attachment-style nested list under borderless comment chrome.
					: "border border-border bg-transparent shadow-none"}
				items={entry.outputs}
				onOpen={onOutputOpen}
				openLabel={outputOpenLabel}
				style={isJiraIssue ? undefined : { boxShadow: "none" }}
				variant="compact"
			/>
		) : null;

		if (isJiraIssue) {
			return (
				<div className="group/activity-card w-full rounded-xl bg-transparent">
					<div className="grid gap-4 p-3">
						{header}
						{description}
					</div>
					{outputs}
					{footer ? (
						<div className={entry.outputs.length > 0 ? "p-3" : "px-3 pb-3 pt-0"}>
							{footer}
						</div>
					) : null}
				</div>
			);
		}

		return (
			<div className="group/activity-card w-full overflow-visible rounded-xl bg-transparent">
				<div className="grid gap-3">
					{header}
					{description}
					{outputs}
					{footer}
				</div>
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
