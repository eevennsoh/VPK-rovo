"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CheckmarkIcon from "@atlaskit/icon/core/check-mark";
import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import type { WorkItem } from "../types";

interface WorkItemSidebarProps {
	workItem: WorkItem;
}

export function WorkItemSidebar({ workItem }: Readonly<WorkItemSidebarProps>) {
	return (
		<div className="space-y-4">
			{/* Status Card */}
			<Card className="p-4 bg-surface">
				<div className="space-y-3">
					<div className="text-xs font-semibold text-text-subtle uppercase">Status</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-color-icon-success" />
						<span className="font-semibold text-text">{workItem.status}</span>
					</div>
					<Button variant="secondary" size="default" className="w-full">
						<ChevronDownIcon label="" size="small" />
						Change Status
					</Button>
				</div>
			</Card>

			{/* Assignee Card */}
			<Card className="p-4 bg-surface">
				<div className="space-y-3">
					<div className="text-xs font-semibold text-text-subtle uppercase">Assignee</div>
					<div className="flex items-center gap-3">
						<Avatar className="w-8 h-8">
							<AvatarImage src={workItem.assignee.avatar} />
							<AvatarFallback>{workItem.assignee.initials}</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<div className="text-sm font-medium text-text">{workItem.assignee.name}</div>
							<div className="text-xs text-text-subtle">{workItem.assignee.role}</div>
						</div>
					</div>
					<Button variant="secondary" size="default" className="w-full">
						Change Assignee
					</Button>
				</div>
			</Card>

			{/* Priority Card */}
			<Card className="p-4 bg-surface">
				<div className="space-y-3">
					<div className="text-xs font-semibold text-text-subtle uppercase">Priority</div>
					<Badge
						variant="secondary"
						className={cn(
							workItem.priority === "Critical" && "bg-bg-danger text-text",
							workItem.priority === "High" && "bg-bg-warning text-text",
							workItem.priority === "Medium" && "bg-bg-neutral text-text",
							workItem.priority === "Low" && "bg-bg-success text-text"
						)}
					>
						{workItem.priority}
					</Badge>
					<Button variant="secondary" size="default" className="w-full">
						<ChevronDownIcon label="" size="small" />
						Change Priority
					</Button>
				</div>
			</Card>

			{/* Metadata */}
			<Card className="p-4 bg-surface space-y-3">
				<div className="text-xs font-semibold text-text-subtle uppercase">Details</div>

				<div className="space-y-2">
					<div className="text-xs text-text-subtle">Reporter</div>
					<div className="text-sm font-medium text-text">{workItem.reporter}</div>
				</div>

				<div className="space-y-2">
					<div className="text-xs text-text-subtle">Created</div>
					<div className="text-sm font-medium text-text">{workItem.created}</div>
				</div>

				<div className="space-y-2">
					<div className="text-xs text-text-subtle">Updated</div>
					<div className="text-sm font-medium text-text">{workItem.updated}</div>
				</div>

				{workItem.dueDate ? (
					<div className="space-y-2">
						<div className="text-xs text-text-subtle">Due Date</div>
						<div className="text-sm font-medium text-text">{workItem.dueDate}</div>
					</div>
				) : null}
			</Card>

			{/* Labels */}
			{workItem.labels && workItem.labels.length > 0 ? (
				<Card className="p-4 bg-surface">
					<div className="space-y-3">
						<div className="text-xs font-semibold text-text-subtle uppercase">Labels</div>
						<div className="flex flex-wrap gap-2">
							{workItem.labels.map((label) => (
								<Badge key={label} variant="secondary">
									{label}
								</Badge>
							))}
						</div>
						<Button variant="secondary" size="default" className="w-full">
							<AddIcon label="" size="small" />
							Add Label
						</Button>
					</div>
				</Card>
			) : null}

			{/* Actions */}
			<div className="flex gap-2">
				<Button size="default" className="flex-1">
					<CheckmarkIcon label="" size="small" />
					Resolve
				</Button>
				<Button size="default" variant="ghost">
					<ShowMoreHorizontalIcon label="" size="small" />
				</Button>
			</div>
		</div>
	);
}
