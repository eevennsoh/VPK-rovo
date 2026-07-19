"use client";

import type { ReactElement, ReactNode } from "react";

import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";
import FilesIcon from "@atlaskit/icon/core/files";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import VideoIcon from "@atlaskit/icon/core/video";

import {
	AgentAddValueButton,
	AgentFilledSummaryRow,
	AgentReferenceChip,
} from "@/components/blocks/agent/components/agent-summary-row";
import {
	useAgentSessionsActions,
	useAgentSessionsState,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { getAttachmentLabel } from "@/components/blocks/agent-sessions/data/context-fixtures";
import { AttachmentsPopover } from "@/components/blocks/agent-sessions/experimental/components/attachments-popover";
import { SubtasksPopover } from "@/components/blocks/agent-sessions/experimental/components/subtasks-popover";
import { LinkedWorkItemsPopover } from "@/components/blocks/agent-sessions/experimental/components/linked-work-items-popover";
import type { WorkItemAttachment } from "@/app/contexts/context-work-item-modal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function attachmentGlyph(attachment: Readonly<WorkItemAttachment>): ReactElement {
	if (attachment.ext === "link") return <LinkIcon label="" size="small" color="currentColor" />;
	if (attachment.thumbnailKind === "video") return <VideoIcon label="" size="small" color="currentColor" />;
	if (attachment.ext === "page" || attachment.ext === "doc") return <PageIcon label="" size="small" color="currentColor" />;
	return <FilesIcon label="" size="small" color="currentColor" />;
}

/**
 * A context resource that can flip between two shapes. When empty it is a bare
 * outlined "Add …" button that sits in the shared button row; the moment it has
 * a value it is plucked out into a labelled property/value row (and drops back
 * into the button row when cleared).
 */
interface ContextResource {
	/** Stable key + canonical ordering within the button row. */
	id: string;
	/** True when the resource has no values (renders as a button). */
	isEmpty: boolean;
	/** Label shown on the bare outlined empty-state button. */
	emptyButtonLabel: string;
	/** Wraps the empty-state button in its anchored add popover. */
	renderEmptyButton: (trigger: ReactElement) => ReactNode;
	/** The filled property/value row. */
	renderFilledRow: () => ReactNode;
}

/**
 * Empty-to-filled Context resources: Attachments, Subtasks, and Linked work
 * items. While a resource is empty it lives as a compact outlined button in a
 * single shared row (a clean default state); once it holds a value it becomes a
 * labelled property/value summary row and leaves the button row. All data +
 * mutations flow through the foundation hooks.
 */
export function ContextResources() {
	const { contextResources } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const { attachments, subtasks, linkedItems } = contextResources;

	const resources: readonly ContextResource[] = [
		{
			id: "attachments",
			isEmpty: attachments.length === 0,
			emptyButtonLabel: "Add attachments",
			renderEmptyButton: (trigger) => <AttachmentsPopover key="attachments" trigger={trigger} />,
			renderFilledRow: () => (
				<AgentFilledSummaryRow
					addLabel="Add attachment"
					agentFieldName="attachments"
					items={attachments.map(getAttachmentLabel)}
					label="Attachments"
					labelClassName="whitespace-nowrap sm:w-28"
					onRemoveItem={(index) => {
						const attachment = attachments[index];
						actions.removeContextResource("attachment", attachment.id ?? attachment.name);
					}}
					renderAddControl={({ label, className }) => (
						<AttachmentsPopover trigger={<AgentAddValueButton className={className} label={label} />} />
					)}
					renderItem={({ item, index, onRemove }) => (
						<AgentReferenceChip
							elemBefore={<Icon aria-hidden render={attachmentGlyph(attachments[index])} />}
							label={item}
							onRemove={onRemove}
							tagColor="standard"
						/>
					)}
					tagColor="standard"
				/>
			),
		},
		{
			id: "subtasks",
			isEmpty: subtasks.length === 0,
			emptyButtonLabel: "Add subtasks",
			renderEmptyButton: (trigger) => <SubtasksPopover key="subtasks" trigger={trigger} />,
			renderFilledRow: () => (
				<AgentFilledSummaryRow
					addLabel="Add subtask"
					agentFieldName="subtasks"
					items={subtasks.map((item) => `${item.key}: ${item.summary}`)}
					label="Subtasks"
					labelClassName="whitespace-nowrap sm:w-28"
					onRemoveItem={(index) => actions.removeContextResource("subtask", subtasks[index].key)}
					renderAddControl={({ label, className }) => (
						<SubtasksPopover trigger={<AgentAddValueButton className={className} label={label} />} />
					)}
					renderItem={({ item, onRemove }) => (
						<AgentReferenceChip
							elemBefore={<Icon aria-hidden render={<ChildWorkItemsIcon color="currentColor" label="" size="small" />} />}
							label={item}
							onRemove={onRemove}
							tagColor="blue"
						/>
					)}
					tagColor="blue"
				/>
			),
		},
		{
			id: "linkedItems",
			isEmpty: linkedItems.length === 0,
			emptyButtonLabel: "Link work items",
			renderEmptyButton: (trigger) => <LinkedWorkItemsPopover key="linkedItems" trigger={trigger} />,
			renderFilledRow: () => (
				<AgentFilledSummaryRow
					addLabel="Link work item"
					agentFieldName="linkedItems"
					items={linkedItems.map((item) => `${item.relationship} ${item.key}: ${item.summary}`)}
					label="Linked work items"
					labelClassName="whitespace-nowrap sm:w-28"
					onRemoveItem={(index) => actions.removeContextResource("link", linkedItems[index].id)}
					renderAddControl={({ label, className }) => (
						<LinkedWorkItemsPopover trigger={<AgentAddValueButton className={className} label={label} />} />
					)}
					renderItem={({ item, onRemove }) => (
						<AgentReferenceChip
							elemBefore={<Icon aria-hidden render={<LinkIcon color="currentColor" label="" size="small" />} />}
							label={item}
							onRemove={onRemove}
							tagColor="purple"
						/>
					)}
					tagColor="purple"
				/>
			),
		},
	];

	const filled = resources.filter((resource) => !resource.isEmpty);
	const empty = resources.filter((resource) => resource.isEmpty);

	return (
		<div className="flex flex-col gap-4">
			{empty.length > 0 ? (
				<div className="flex flex-wrap items-start gap-1 *:focus-visible:relative *:focus-visible:z-10">
					{empty.map((resource) =>
						resource.renderEmptyButton(
							<Button size="compact" type="button" variant="outline">
								{resource.emptyButtonLabel}
							</Button>,
						),
					)}
				</div>
			) : null}
			{filled.length > 0 ? (
				<div className="flex flex-col gap-1">
					{filled.map((resource) => (
						<div key={resource.id}>{resource.renderFilledRow()}</div>
					))}
				</div>
			) : null}
		</div>
	);
}
