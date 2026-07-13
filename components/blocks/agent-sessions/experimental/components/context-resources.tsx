"use client";

import type { ReactNode } from "react";

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

function attachmentGlyph(attachment: Readonly<WorkItemAttachment>): ReactNode {
	if (attachment.ext === "link") return <LinkIcon label="" size="small" color="currentColor" />;
	if (attachment.thumbnailKind === "video") return <VideoIcon label="" size="small" color="currentColor" />;
	if (attachment.ext === "page" || attachment.ext === "doc") return <PageIcon label="" size="small" color="currentColor" />;
	return <FilesIcon label="" size="small" color="currentColor" />;
}

/**
 * Empty-to-filled Context resources: three summary rows (Attachments, Subtasks,
 * Linked work items). Each row's add affordance anchors its matching tabbed
 * popover via `renderAddControl`; filled rows show compact chips with inline
 * removal. All data + mutations flow through the foundation hooks.
 */
export function ContextResources() {
	const { contextResources } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const { attachments, subtasks, linkedItems } = contextResources;

	return (
		<div className="flex flex-col gap-1">
			<AgentFilledSummaryRow
				label="Attachments"
				agentFieldName="attachments"
				items={attachments.map(getAttachmentLabel)}
				addLabel="Add attachment"
				tagColor="standard"
				renderItem={({ item, index, onRemove }) => (
					<AgentReferenceChip
						label={item}
						elemBefore={attachmentGlyph(attachments[index])}
						tagColor="standard"
						onRemove={onRemove}
					/>
				)}
				renderAddControl={({ label, className }) => (
					<AttachmentsPopover trigger={<AgentAddValueButton className={className} label={label} />} />
				)}
				onRemoveItem={(index) => {
					const attachment = attachments[index];
					actions.removeContextResource("attachment", attachment.id ?? attachment.name);
				}}
			/>

			<AgentFilledSummaryRow
				label="Subtasks"
				agentFieldName="subtasks"
				items={subtasks.map((item) => `${item.key}: ${item.summary}`)}
				addLabel="Add subtask"
				tagColor="blue"
				renderItem={({ item, onRemove }) => (
					<AgentReferenceChip
						label={item}
						elemBefore={<ChildWorkItemsIcon label="" size="small" color="currentColor" />}
						tagColor="blue"
						onRemove={onRemove}
					/>
				)}
				renderAddControl={({ label, className }) => (
					<SubtasksPopover trigger={<AgentAddValueButton className={className} label={label} />} />
				)}
				onRemoveItem={(index) => actions.removeContextResource("subtask", subtasks[index].key)}
			/>

			<AgentFilledSummaryRow
				label="Linked work items"
				agentFieldName="linkedItems"
				items={linkedItems.map((item) => `${item.relationship} ${item.key}: ${item.summary}`)}
				addLabel="Link work item"
				tagColor="purple"
				renderItem={({ item, onRemove }) => (
					<AgentReferenceChip
						label={item}
						elemBefore={<LinkIcon label="" size="small" color="currentColor" />}
						tagColor="purple"
						onRemove={onRemove}
					/>
				)}
				renderAddControl={({ label, className }) => (
					<LinkedWorkItemsPopover trigger={<AgentAddValueButton className={className} label={label} />} />
				)}
				onRemoveItem={(index) => actions.removeContextResource("link", linkedItems[index].id)}
			/>
		</div>
	);
}
