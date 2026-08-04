"use client";

import type { ReactElement } from "react";

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
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StickyRowScrollFade } from "@/components/visual/scroll-mask";
import { cn } from "@/lib/utils";

interface ContextResourceAction {
	buttonLabel: string;
	icon: ReactElement;
	renderAddButton: (trigger: ReactElement) => ReactElement;
}

interface ContextResourcesProps {
	descriptionViewMode: EditorToolbarViewMode;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
}

/**
 * Context resource controls: Attachments, Subtasks, and linked work items keep
 * their compact add buttons in the shared control row. Filled resource values
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
	const resources: readonly ContextResourceAction[] = [
		{
			buttonLabel: "Add attachments",
			icon: <AttachmentIcon label="" size="small" />,
			renderAddButton: (trigger) => (
				<AttachmentsPopover key="attachments" tooltip="Add attachments" trigger={trigger} />
			),
		},
		{
			buttonLabel: "Add subtasks",
			icon: <ChildWorkItemsIcon label="" size="small" />,
			renderAddButton: (trigger) => (
				<SubtasksPopover key="subtasks" tooltip="Add subtasks" trigger={trigger} />
			),
		},
		{
			buttonLabel: "Link work items",
			icon: <LinkIcon label="" size="small" />,
			renderAddButton: (trigger) => (
				<LinkedWorkItemsPopover key="linkedItems" tooltip="Link work items" trigger={trigger} />
			),
		},
	];

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
				<TooltipProvider>
					<div
						className="flex flex-wrap items-start gap-1 *:focus-visible:relative *:focus-visible:z-10"
						data-jira-work-item-resource-row-content
					>
						{resources.map((resource) =>
							resource.renderAddButton(
								<Button aria-label={resource.buttonLabel} size="icon-compact" type="button" variant="outline">
									{resource.icon}
								</Button>,
							),
						)}
						<Tooltip>
							<TooltipTrigger
								render={<Button aria-label="Create commit" size="icon-compact" type="button" variant="outline" />}
							>
								<CommitIcon label="" size="small" />
							</TooltipTrigger>
							<TooltipContent positionerClassName="z-[502]">Create commit</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger
								render={<Button aria-label="Create branch" size="icon-compact" type="button" variant="outline" />}
							>
								<BranchIcon label="" size="small" />
							</TooltipTrigger>
							<TooltipContent positionerClassName="z-[502]">Create branch</TooltipContent>
						</Tooltip>
						<AnimatedContextTitleActions primaryAgentId={primaryCodingAgentId} />
						<div className="pointer-events-none ml-auto shrink-0 opacity-0 transition-opacity duration-normal ease-out group-hover/description-scope:pointer-events-auto group-hover/description-scope:opacity-100 group-has-[:focus-visible]/description-scope:pointer-events-auto group-has-[:focus-visible]/description-scope:opacity-100 motion-reduce:transition-none">
							<EditorToolbarModeTabs
								mode={descriptionViewMode}
								onModeChange={onDescriptionViewModeChange}
								size="compact"
							/>
						</div>
					</div>
				</TooltipProvider>
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
