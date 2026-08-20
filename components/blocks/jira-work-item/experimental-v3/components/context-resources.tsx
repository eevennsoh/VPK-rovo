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
import { AttachmentsPopover } from "@/components/blocks/jira-work-item/experimental-v3/components/attachments-popover";
import {
	ContextTitleActions,
	type CodingAgentId,
} from "@/components/blocks/jira-work-item/experimental-v3/components/context-title-actions";
import { StatusPill } from "@/components/blocks/jira-work-item/experimental-v3/components/detail-field-editors";
import { LinkedWorkItemsPopover } from "@/components/blocks/jira-work-item/experimental-v3/components/linked-work-items-popover";
import { PullRequestsSelect } from "@/components/blocks/jira-work-item/experimental-v3/components/pull-requests-select";
import { SubtasksPopover } from "@/components/blocks/jira-work-item/experimental-v3/components/subtasks-popover";
import {
	useJiraWorkItemActions,
	useJiraWorkItemMeta,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
 * The work item's single control row, in the dialog header band beneath the
 * title.
 *
 * Order matches the design: status, pull requests, coding agent, then the plus
 * menu. The plus menu launches the existing Attachments, Subtasks, and
 * linked-work-item popovers; filled values render as conditional sections in
 * the metadata rail. Pull requests open from a Select that carries both the
 * open/merged metrics and, once one is chosen, a removable Tag.
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
	const { contextResources, metadata, planner } = useJiraWorkItemState();
	const { workItem } = useJiraWorkItemMeta();
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
					{pullRequestEntries.length > 0 ? (
						<PullRequestsSelect
							entries={pullRequestEntries}
							selectedIdentity={selectedPullRequestIdentity}
							onClearSelection={onPullRequestClear}
							onSelectEntry={onPullRequestSelect}
						/>
					) : null}
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
					{pullRequestSelected ? null : (
						<div className="pointer-events-none ml-auto shrink-0 flex items-center gap-2 opacity-0 transition-opacity duration-normal ease-out group-hover/description-scope:pointer-events-auto group-hover/description-scope:opacity-100 group-has-[:focus-visible]/description-scope:pointer-events-auto group-has-[:focus-visible]/description-scope:opacity-100 motion-reduce:transition-none">
							<Tooltip>
								<TooltipTrigger
									delay={0}
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
