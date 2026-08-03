"use client";

import type { ReactElement } from "react";

import AttachmentIcon from "@atlaskit/icon/core/attachment";
import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";
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
 * Context resource controls: Attachments and Subtasks keep their compact add
 * buttons in the shared control row. Filled resource values are rendered as
 * conditional sections in the metadata rail.
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
			renderAddButton: (trigger) => <AttachmentsPopover key="attachments" trigger={trigger} />,
		},
		{
			buttonLabel: "Add subtasks",
			icon: <ChildWorkItemsIcon label="" size="small" />,
			renderAddButton: (trigger) => <SubtasksPopover key="subtasks" trigger={trigger} />,
		},
		{
			buttonLabel: "Link work item",
			icon: <LinkIcon label="" size="small" />,
			renderAddButton: (trigger) => <LinkedWorkItemsPopover key="linkedItems" trigger={trigger} />,
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
				<div
					className="flex flex-wrap items-start gap-2 *:focus-visible:relative *:focus-visible:z-10"
					data-jira-work-item-resource-row-content
				>
					{resources.map((resource) =>
						resource.renderAddButton(
							<Button aria-label={resource.buttonLabel} size="icon" type="button" variant="outline">
								{resource.icon}
							</Button>,
						),
					)}
					<AnimatedContextTitleActions primaryAgentId={primaryCodingAgentId} />
					<div className="ml-auto shrink-0">
						<EditorToolbarModeTabs
							mode={descriptionViewMode}
							onModeChange={onDescriptionViewModeChange}
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
