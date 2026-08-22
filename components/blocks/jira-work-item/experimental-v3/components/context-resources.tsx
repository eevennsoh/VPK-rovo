"use client";

import { useState, type ReactElement } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import AttachmentIcon from "@atlaskit/icon/core/attachment";
import BranchIcon from "@atlaskit/icon/core/branch";
import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";
import CommitIcon from "@atlaskit/icon/core/commit";
import FileIcon from "@atlaskit/icon/core/file";
import LinkIcon from "@atlaskit/icon/core/link";

import { AgentFilledSummaryRow } from "@/components/blocks/agent/components/agent-summary-row";
import { AttachmentsPopover } from "@/components/blocks/jira-work-item/experimental-v3/components/attachments-popover";
import {
	ContextTitleActions,
	type CodingAgentId,
} from "@/components/blocks/jira-work-item/experimental-v3/components/context-title-actions";
import { StatusPill } from "@/components/blocks/jira-work-item/experimental-v3/components/detail-field-editors";
import { LinkedWorkItemsPopover } from "@/components/blocks/jira-work-item/experimental-v3/components/linked-work-items-popover";
import { SubtasksPopover } from "@/components/blocks/jira-work-item/experimental-v3/components/subtasks-popover";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v3/context-jira-work-item";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ContextResourceActionId = "attachments" | "subtasks" | "linkedItems";

interface ContextResourceAction {
	id: ContextResourceActionId;
	buttonLabel: string;
	icon: ReactElement;
	renderPopover: (
		trigger: ReactElement,
		open: boolean,
		onOpenChange: (open: boolean) => void,
	) => ReactElement;
}

interface ContextResourcesProps {
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
}

export function ContextResources({
	outputs = [],
	primaryCodingAgentId,
}: Readonly<ContextResourcesProps>) {
	const { metadata, planner } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	const hasPlanner = planner.status !== "inactive" && planner.status !== "applied";
	const [activeResourceAction, setActiveResourceAction] = useState<ContextResourceActionId | null>(null);
	const resources: readonly ContextResourceAction[] = [
		{
			id: "attachments",
			buttonLabel: "Add attachments",
			icon: <AttachmentIcon label="" size="small" />,
			renderPopover: (trigger, open, onOpenChange) => (
				<AttachmentsPopover key="attachments" open={open} onOpenChange={onOpenChange} trigger={trigger} />
			),
		},
		{
			id: "subtasks",
			buttonLabel: "Add subtasks",
			icon: <ChildWorkItemsIcon label="" size="small" />,
			renderPopover: (trigger, open, onOpenChange) => (
				<SubtasksPopover key="subtasks" open={open} onOpenChange={onOpenChange} trigger={trigger} />
			),
		},
		{
			id: "linkedItems",
			buttonLabel: "Link work items",
			icon: <LinkIcon label="" size="small" />,
			renderPopover: (trigger, open, onOpenChange) => (
				<LinkedWorkItemsPopover key="linkedItems" open={open} onOpenChange={onOpenChange} trigger={trigger} />
			),
		},
	];
	const closeResourceAction = () => setActiveResourceAction(null);

	return (
		<div className="mt-3">
			{/*
			 * Sits in the dialog header band under the title, so it spans the full
			 * width rather than only the description column. No
			 * `@container/agentlayout` ancestor exists here — keep spacing plain and
			 * let `@container/resource-row` below own the responsive collapse.
			 */}
			<div
				className={cn(
					"relative z-10",
					hasPlanner
						? "bg-bg-input [&_[data-slot=button]]:bg-bg-input [&_[data-slot=button]:hover]:bg-bg-neutral-subtle-hovered [&_[data-slot=button]:active]:bg-bg-neutral-subtle-pressed"
						: null,
				)}
				data-jira-work-item-resource-row
			>
				<div
					className="@container/resource-row flex flex-wrap items-center gap-2 *:focus-visible:relative *:focus-visible:z-10"
					data-jira-work-item-resource-row-content
				>
					<StatusPill
						onChange={(next) => actions.updateMetadata({ status: next })}
						value={metadata.status}
					/>
					<ContextTitleActions primaryAgentId={primaryCodingAgentId} />
					<div className="relative inline-flex">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={<Button aria-label="Add to work item" size="icon" type="button" variant="outline" />}
							>
								<AddIcon label="" size="small" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" positionerClassName="z-[502]">
								<DropdownMenuGroup>
									{resources.map((resource) => (
										<DropdownMenuItem
											elemBefore={resource.icon}
											key={resource.id}
											onSelect={() => setActiveResourceAction(resource.id)}
										>
											{resource.buttonLabel}
										</DropdownMenuItem>
									))}
									<DropdownMenuItem elemBefore={<CommitIcon label="" size="small" />}>
										Create commit
									</DropdownMenuItem>
									<DropdownMenuItem elemBefore={<BranchIcon label="" size="small" />}>
										Create branch
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
						{resources.map((resource) =>
							resource.renderPopover(
								<Button
									aria-hidden
									className="pointer-events-none absolute inset-0 opacity-0"
									tabIndex={-1}
									type="button"
								/>,
								activeResourceAction === resource.id,
								(open) => {
									if (open) {
										setActiveResourceAction(resource.id);
										return;
									}
									closeResourceAction();
								},
							),
						)}
					</div>
				</div>
			</div>
			{outputs.length > 0 ? (
				<div className="mt-1">
					<AgentFilledSummaryRow
						agentFieldName="outputs"
						itemElemBefore={() => (
							<Icon aria-hidden render={<FileIcon color="currentColor" label="" size="small" />} />
						)}
						items={outputs}
						label="Output"
						labelClassName="whitespace-nowrap sm:w-28"
						tagColor="standard"
					/>
				</div>
			) : null}
		</div>
	);
}
