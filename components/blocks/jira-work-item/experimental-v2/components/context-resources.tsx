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
import {
	EditorToolbarModeTabs,
	type EditorToolbarViewMode,
} from "@/components/blocks/editor-toolbar";
import { AttachmentsPopover } from "@/components/blocks/jira-work-item/experimental-v2/components/attachments-popover";
import { useJiraWorkItemState } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import {
	AnimatedContextTitleActions,
	type CodingAgentId,
} from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import { LinkedWorkItemsPopover } from "@/components/blocks/jira-work-item/experimental-v2/components/linked-work-items-popover";
import { SubtasksPopover } from "@/components/blocks/jira-work-item/experimental-v2/components/subtasks-popover";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { StickyRowScrollFade } from "@/components/visual/scroll-mask";
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
	descriptionViewMode: EditorToolbarViewMode;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
}

/**
 * Context resource controls: the shared plus menu launches the existing
 * Attachments, Subtasks, and linked-work-item popovers. Filled resource values
 * are rendered as conditional sections in the metadata rail.
 */
export function ContextResources({
	descriptionViewMode,
	outputs = [],
	primaryCodingAgentId,
	onDescriptionViewModeChange,
}: Readonly<ContextResourcesProps>) {
	const { planner } = useJiraWorkItemState();
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
		<>
			<div
				className={cn(
					"sticky top-0 z-10 [container-type:scroll-state]",
					hasPlanner
						? "bg-bg-input [&_[data-slot=button]]:bg-bg-input [&_[data-slot=button]:hover]:bg-bg-neutral-subtle-hovered [&_[data-slot=button]:active]:bg-bg-neutral-subtle-pressed"
						: "bg-surface-overlay",
				)}
				data-jira-work-item-resource-row
			>
				<div
					className="flex flex-wrap items-start gap-1 *:focus-visible:relative *:focus-visible:z-10"
					data-jira-work-item-resource-row-content
				>
					<div className="relative inline-flex">
						<DropdownMenu>
							<DropdownMenuTrigger
								render={<Button aria-label="Add to work item" size="icon-compact" type="button" variant="outline" />}
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
								(open) => (open ? setActiveResourceAction(resource.id) : closeResourceAction()),
							),
						)}
					</div>
					<AnimatedContextTitleActions primaryAgentId={primaryCodingAgentId} />
					<div className="pointer-events-none ml-auto shrink-0 opacity-0 transition-opacity duration-normal ease-out group-hover/description-scope:pointer-events-auto group-hover/description-scope:opacity-100 group-has-[:focus-visible]/description-scope:pointer-events-auto group-has-[:focus-visible]/description-scope:opacity-100 motion-reduce:transition-none">
						<EditorToolbarModeTabs
							mode={descriptionViewMode}
							onModeChange={onDescriptionViewModeChange}
							size="compact"
						/>
					</div>
				</div>
				<StickyRowScrollFade data-slot="jira-work-item-resource-row-scroll-fade" />
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
		</>
	);
}
