import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import DragHandleVerticalIcon from "@atlaskit/icon/core/drag-handle-vertical";
import GridIcon from "@atlaskit/icon/core/grid";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";

import type { JiraActivityChangedFilesEntry } from "./jira-activity-types";

/**
 * Bordered card summarizing a code change: a header (name/time/tag + overflow
 * menu) over a single change row (drag affordance, summary, muted description,
 * branch/PR tag, and open affordances). The actor avatar lives on the spine.
 */
export function JiraActivityChangedFiles({
	entry,
}: Readonly<{ entry: JiraActivityChangedFilesEntry }>) {
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
