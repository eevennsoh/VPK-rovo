"use client";

import { useState, type ReactElement } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import AttachmentIcon from "@atlaskit/icon/core/attachment";
import BranchIcon from "@atlaskit/icon/core/branch";
import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";
import CommitIcon from "@atlaskit/icon/core/commit";
import CopyIcon from "@atlaskit/icon/core/copy";
import FileIcon from "@atlaskit/icon/core/file";
import LinkIcon from "@atlaskit/icon/core/link";

import { AgentFilledSummaryRow } from "@/components/blocks/agent/components/agent-summary-row";
import {
	EditorToolbarModeTabs,
	type EditorToolbarViewMode,
} from "@/components/blocks/editor-toolbar";
import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import { AttachmentsPopover } from "@/components/blocks/jira-work-item/experimental-v2/components/attachments-popover";
import {
	AnimatedContextTitleActions,
	type CodingAgentId,
} from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import { LinkedWorkItemsPopover } from "@/components/blocks/jira-work-item/experimental-v2/components/linked-work-items-popover";
import { PullRequestsSelect } from "@/components/blocks/jira-work-item/experimental-v2/components/pull-requests-select";
import { SubtasksPopover } from "@/components/blocks/jira-work-item/experimental-v2/components/subtasks-popover";
import {
	useJiraWorkItemMeta,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
	pullRequestEntries: readonly JiraActivityEventEntry[];
	pullRequestSelected: boolean;
	selectedPullRequestIdentity: string | null;
	onDescriptionViewModeChange: (mode: EditorToolbarViewMode) => void;
	onPullRequestSelect: (entry: JiraActivityEventEntry) => void;
	onPullRequestClear: () => void;
}

/**
 * Context resource controls: the shared plus menu launches the existing
 * Attachments, Subtasks, and linked-work-item popovers. Pull requests open from
 * a Select beside Open in Claude; the active filter is a removable Tag inside
 * the Select trigger (title meta hosts a separate read-only multi-metric Tag).
 * Filled
 * attachment/subtask/link values are rendered as conditional sections in the
 * metadata rail.
 */
export function ContextResources({
	descriptionViewMode,
	outputs = [],
	primaryCodingAgentId,
	pullRequestEntries,
	pullRequestSelected,
	selectedPullRequestIdentity,
	onDescriptionViewModeChange,
	onPullRequestSelect,
	onPullRequestClear,
}: Readonly<ContextResourcesProps>) {
	const { contextResources, planner } = useJiraWorkItemState();
	const { workItem } = useJiraWorkItemMeta();
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
		<div className="@[860px]/agentlayout:pt-6">
			{/*
			 * Fixed column chrome above the description scrollport. Shared wide
			 * pb-7 aligns description with Details. The shell publishes scroll
			 * state through data-scroll-fade-visible for the soft edge below.
			 */}
			<div
				className={cn(
					"relative z-10 shrink-0 @[860px]/agentlayout:pb-7",
					hasPlanner
						? "bg-bg-input [&_[data-slot=button]]:bg-bg-input [&_[data-slot=button]:hover]:bg-bg-neutral-subtle-hovered [&_[data-slot=button]:active]:bg-bg-neutral-subtle-pressed"
						: null,
				)}
				data-jira-work-item-resource-row
			>
				<div
					className="@container/resource-row flex flex-wrap items-start gap-2 *:focus-visible:relative *:focus-visible:z-10"
					data-jira-work-item-resource-row-content
				>
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
					<AnimatedContextTitleActions primaryAgentId={primaryCodingAgentId} />
					{pullRequestEntries.length > 0 ? (
						<PullRequestsSelect
							entries={pullRequestEntries}
							selectedIdentity={selectedPullRequestIdentity}
							onClearSelection={onPullRequestClear}
							onSelectEntry={onPullRequestSelect}
						/>
					) : null}
					{pullRequestSelected ? null : (
						<div className="pointer-events-none ml-auto shrink-0 flex items-center gap-2 opacity-0 transition-opacity duration-normal ease-out group-hover/description-scope:pointer-events-auto group-hover/description-scope:opacity-100 group-has-[:focus-visible]/description-scope:pointer-events-auto group-has-[:focus-visible]/description-scope:opacity-100 motion-reduce:transition-none">
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label="Copy work item as markdown"
											size="icon"
											type="button"
											variant="outline"
											onClick={() => {
												const description = contextResources.description.trim();
												const markdown = `# ${workItem.code}: ${contextResources.title}${description ? `\n\n${description}` : ""}`;
												void navigator.clipboard.writeText(markdown);
											}}
										/>
									}
								>
									<CopyIcon label="" size="small" />
								</TooltipTrigger>
								<TooltipContent positionerClassName="z-[502]">
									Copy work item as markdown
								</TooltipContent>
							</Tooltip>
							<EditorToolbarModeTabs
								mode={descriptionViewMode}
								onModeChange={onDescriptionViewModeChange}
							/>
						</div>
					)}
				</div>
				{/*
				 * Soft-mask under resources while description scrolls. Hidden when
				 * a PR is open so it does not paint over the in-body sticky PR
				 * header that sits just below this row.
				 */}
				{pullRequestSelected ? null : (
					<StickyRowScrollFade
						className={cn(
							"group-data-[scroll-fade-visible]:opacity-100",
							hasPlanner ? "[&>div]:from-bg-input" : undefined,
						)}
						data-slot="jira-work-item-resource-row-scroll-fade"
					/>
				)}
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
