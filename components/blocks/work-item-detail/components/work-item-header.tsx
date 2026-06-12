"use client";

// oxlint-disable react-doctor/prefer-module-scope-static-value -- These values are intentionally colocated with the component/demo contract for readability and token context.

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type WorkItem } from "../types";
import LinkIcon from "@atlaskit/icon/core/link";
import ShareIcon from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

interface WorkItemHeaderProps {
	workItem: Readonly<WorkItem>;
}

export function WorkItemHeader({ workItem }: WorkItemHeaderProps) {
	const typeColors: Record<string, string> = {
		Story: "bg-bg-information text-text",
		Task: "bg-bg-neutral text-text",
		Bug: "bg-bg-danger text-text",
		Epic: "bg-bg-warning text-text",
		Subtask: "bg-bg-success text-text",
	};

	const statusColors: Record<string, string> = {
		"To Do": "bg-bg-neutral text-text",
		"In Progress": "bg-bg-information text-text",
		"In Review": "bg-bg-warning text-text",
		Done: "bg-bg-success text-text",
		Closed: "bg-bg-neutral-bold text-text",
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<Badge className={typeColors[workItem.type]}>{workItem.type}</Badge>
					<span className="text-sm font-medium text-text-subtle">{workItem.key}</span>
				</div>
				<h1 className="text-2xl font-bold text-text">{workItem.title}</h1>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Badge className={statusColors[workItem.status]}>{workItem.status}</Badge>
					{workItem.storyPoints && (
						<div className="text-sm font-medium text-text">
							<span className="text-text-subtle">Story Points:</span> {workItem.storyPoints}
						</div>
					)}
				</div>
				<div className="flex gap-2">
					<Button size="icon" variant="ghost">
						<LinkIcon label="" size="small" />
					</Button>
					<Button size="icon" variant="ghost">
						<ShareIcon label="" size="small" />
					</Button>
					<Button size="icon" variant="ghost">
						<ShowMoreHorizontalIcon label="" size="small" />
					</Button>
				</div>
			</div>
		</div>
	);
}
