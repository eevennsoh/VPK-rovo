import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import DragHandleVerticalIcon from "@atlaskit/icon/core/drag-handle-vertical";
import GridIcon from "@atlaskit/icon/core/grid";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { ArtifactList } from "@/components/ui-custom/artifact-list";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { formatElapsedTime } from "@/lib/elapsed-time";

import type { JiraActivityChangedFilesEntry } from "./jira-activity-types";

/**
 * Agent output card using compact Artifact List rows. Legacy summary-only
 * entries retain the original single code-change row as a fallback.
 */
export function JiraActivityChangedFiles({
	entry,
}: Readonly<{ entry: JiraActivityChangedFilesEntry }>) {
	if (entry.sessionItem && entry.outputs) {
		return (
			<div className="w-full overflow-hidden rounded-lg border border-border bg-surface">
				<div className="flex h-14 min-w-0 items-center gap-3 px-3">
					<AgentAvatarVisual
						avatarClassName="shrink-0"
						avatarSrc={entry.sessionItem.agent.avatarSrc}
						label={entry.sessionItem.agent.name}
						sizePx={32}
						vpkLogo={entry.sessionItem.agent.vpkLogo}
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium leading-5 text-text">
							{entry.sessionItem.title}
						</p>
						<div className="flex items-center gap-1 text-xs leading-4 text-text-subtle">
							<span>{formatElapsedTime(entry.sessionItem.elapsedSeconds ?? 0)}</span>
							<span aria-hidden className="text-text-subtlest">·</span>
							<span className="truncate">{entry.sessionItem.agent.name}</span>
						</div>
					</div>
					<Button
						aria-label="More actions"
						className="shrink-0"
						size="icon-compact"
						type="button"
						variant="ghost"
					>
						<ShowMoreHorizontalIcon label="" />
					</Button>
				</div>

				<ArtifactList
					className="rounded-none border-x-0 border-b-0"
					items={entry.outputs}
					variant="compact"
				/>
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
