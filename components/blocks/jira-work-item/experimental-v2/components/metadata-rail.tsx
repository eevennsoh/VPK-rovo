"use client";

import { useMemo, useState, type ReactElement, type ReactNode } from "react";

import FilesIcon from "@atlaskit/icon/core/files";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import VideoIcon from "@atlaskit/icon/core/video";
import WorkItemIcon from "@atlaskit/icon/core/work-item";

import {
	type WorkItemAttachment,
	type WorkItemChildItem,
	type WorkItemPerson,
} from "@/app/contexts/context-work-item-modal";
import { ArtifactPane, type ArtifactPaneSectionItem } from "@/components/blocks/artifact-pane";
import { getAttachmentLabel } from "@/components/blocks/jira-work-item/data/context-fixtures";
import { METADATA_PEOPLE } from "@/components/blocks/jira-work-item/data/metadata-people";
import type { ContextLinkedItem } from "@/components/blocks/jira-work-item/data/session-state";
import { SMART_LINK_MODAL_ACTIONS } from "@/components/blocks/smart-link/data/smart-link-actions";
import { DevelopmentSectionContent } from "@/components/blocks/jira-work-item/experimental-v2/components/details-sections";
import { DetailsTab } from "@/components/blocks/jira-work-item/experimental-v2/components/details-tab";
import { CONNECTED_REPOSITORY_COUNT } from "@/components/blocks/jira-work-item/experimental-v2/components/development-repository-picker";
import {
	AutomationTab,
	type WorkItemAutomationRule,
} from "@/components/blocks/jira-work-item/experimental-v2/components/automation-tab";
import {
	useJiraWorkItemActions,
	useJiraWorkItemMeta,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { SmartLink, type SmartLinkItem } from "@/components/blocks/smart-link";
import { ProgressCircle } from "@/components/ui-custom/progress-circle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type MetadataRailView = "details" | "activity";

function attachmentGlyph(attachment: Readonly<WorkItemAttachment>): ReactElement {
	if (attachment.ext === "link") return <LinkIcon label="" size="small" color="currentColor" />;
	if (attachment.thumbnailKind === "video") return <VideoIcon label="" size="small" color="currentColor" />;
	if (attachment.ext === "page" || attachment.ext === "doc") return <PageIcon label="" size="small" color="currentColor" />;
	return <FilesIcon label="" size="small" color="currentColor" />;
}

function toAttachmentSmartLink(attachment: Readonly<WorkItemAttachment>): SmartLinkItem {
	const id = attachment.id ?? attachment.name;
	const isConfluence = attachment.sourceProduct === "confluence";
	const isLoom = attachment.sourceProduct === "loom";

	return {
		id,
		href: `#attachment-${id}`,
		title: getAttachmentLabel(attachment),
		variant: isConfluence ? "confluence" : isLoom ? "loom" : "file",
		provider: isConfluence
			? { name: "Confluence", logo: { kind: "atlassian", name: "confluence" } }
			: isLoom
				? { name: "Loom", logo: { kind: "atlassian", name: "loom" } }
				: { name: attachment.sourceLabel ?? "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: isConfluence
			? { kind: "atlassian", name: "confluence" }
			: isLoom
				? { kind: "atlassian", name: "loom" }
				: { kind: "icon-tile", icon: attachmentGlyph(attachment) },
		description: `${attachment.sourceLabel ?? "Attachment"} attached to this work item.`,
		metadata: [{ label: attachment.date }],
		actions: SMART_LINK_MODAL_ACTIONS,
	};
}

function toWorkItemStatus(status: WorkItemChildItem["status"] | undefined): SmartLinkItem["status"] {
	return status ? {
		done: { label: "Done", variant: "success" as const },
		inprogress: { label: "In progress", variant: "information" as const },
		todo: { label: "To do", variant: "neutral" as const },
	}[status] : undefined;
}

function toSubtaskSmartLink(subtask: Readonly<WorkItemChildItem>): SmartLinkItem {

	return {
		id: subtask.key,
		href: `#${subtask.key.toLowerCase()}`,
		title: `${subtask.key}: ${subtask.summary}`,
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "icon-tile", icon: <WorkItemIcon label="" size="medium" />, tone: "information" },
		description: subtask.description ?? (subtask.type ? `${subtask.type} in this work item.` : "Subtask in this work item."),
		assignee: subtask.assignee
			? { name: subtask.assignee, src: subtask.assigneeAvatarUrl }
			: undefined,
		priority: subtask.priority,
		status: toWorkItemStatus(subtask.status),
		actions: SMART_LINK_MODAL_ACTIONS,
	};
}

function toLinkedItemSmartLink(linkedItem: Readonly<ContextLinkedItem>): SmartLinkItem {
	return {
		id: linkedItem.id,
		href: `#${linkedItem.key.toLowerCase()}`,
		title: `${linkedItem.key}: ${linkedItem.summary}`,
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "icon-tile", icon: <WorkItemIcon label="" size="medium" />, tone: "information" },
		description: linkedItem.description ?? `${linkedItem.type} that ${linkedItem.relationship} this work item.`,
		assignee: linkedItem.assignee
			? { name: linkedItem.assignee, src: linkedItem.assigneeAvatarUrl }
			: undefined,
		priority: linkedItem.priority,
		status: toWorkItemStatus(linkedItem.status),
		actions: SMART_LINK_MODAL_ACTIONS,
	};
}

function ResourceSmartLinks({
	items,
	onRemove,
}: Readonly<{
	items: readonly SmartLinkItem[];
	onRemove: (id: string) => void;
}>) {
	return (
		<ul className="space-y-1">
			{items.map((item) => (
				<li className="min-w-0" key={item.id}>
					<SmartLink
						align="center"
						alignOffset={0}
						className="min-w-0 max-w-full"
						item={item}
						onRemove={() => onRemove(item.id)}
						positionerClassName="z-[600]"
						removeButtonLabel={`Remove ${item.title}`}
						removeVariant="overlay"
						showStatus
						side="left"
					/>
				</li>
			))}
		</ul>
	);
}

/**
 * Subtasks section heading. The ring is a visual summary of completion; the
 * ratio beside the title (and each subtask's own status) carries it for
 * assistive tech, so the ring itself stays hidden from the accessibility tree.
 */
function SubtasksSectionTitle({ done, total }: Readonly<{ done: number; total: number }>) {
	return (
		<>
			Subtasks
			<ProgressCircle aria-hidden size="xs" value={total > 0 ? Math.round((done / total) * 100) : 0} variant="outline" />
		</>
	);
}

function mergePeople(...seed: readonly (WorkItemPerson | null | undefined)[]): WorkItemPerson[] {	const byName = new Map<string, WorkItemPerson>();
	for (const person of METADATA_PEOPLE) {
		byName.set(person.name, person);
	}
	for (const person of seed) {
		if (person && !byName.has(person.name)) {
			byName.set(person.name, person);
		}
	}
	return [...byName.values()];
}

/**
 * Work-item metadata rail for the experimental variant. A Details/Activity
 * outline ToggleGroup (joined filter segments, same recipe as
 * ToggleGroupDemoFilter / EditorToolbarModeTabs) owns the panel header;
 * Details keeps the ArtifactPane surface, while Activity slots in the shared
 * ActivityPanel from the composition root.
 */
export function MetadataRail({
	activity,
	automationRules = [],
	borderless = false,
}: Readonly<{
	activity?: ReactNode;
	automationRules?: readonly WorkItemAutomationRule[];
	borderless?: boolean;
}> = {}) {
	const [panelView, setPanelView] = useState<MetadataRailView>("details");
	const { workItem } = useJiraWorkItemMeta();
	const { contextResources, metadata: draft } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	const { attachments, linkedItems, subtasks } = contextResources;
	const people = useMemo(
		() => mergePeople(workItem.assignee, workItem.reporter),
		[workItem.assignee, workItem.reporter],
	);
	const resourceSections: ArtifactPaneSectionItem[] = [];

	if (attachments.length > 0) {
		resourceSections.push({
			content: (
				<ResourceSmartLinks
					items={attachments.map(toAttachmentSmartLink)}
					onRemove={(id) => actions.removeContextResource("attachment", id)}
				/>
			),
			count: attachments.length,
			id: "attachments",
			title: "Attachments",
		});
	}

	if (subtasks.length > 0) {
		const doneSubtasks = subtasks.filter((subtask) => subtask.status === "done").length;

		resourceSections.push({
			content: (
				<ResourceSmartLinks
					items={subtasks.map(toSubtaskSmartLink)}
					onRemove={(id) => actions.removeContextResource("subtask", id)}
				/>
			),
			count: `${doneSubtasks}/${subtasks.length}`,
			id: "subtasks",
			title: <SubtasksSectionTitle done={doneSubtasks} total={subtasks.length} />,
		});
	}

	if (linkedItems.length > 0) {
		resourceSections.push({
			content: (
				<ResourceSmartLinks
					items={linkedItems.map(toLinkedItemSmartLink)}
					onRemove={(id) => actions.removeContextResource("link", id)}
				/>
			),
			count: linkedItems.length,
			id: "linked-items",
			title: "Linked work items",
		});
	}

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<div className="px-3">
				<ToggleGroup
					aria-label="Work item panel"
					multiple={false}
					size="sm"
					value={[panelView]}
					variant="outline"
					onValueChange={(value) => {
						const next = value[0];
						if (next === "details" || next === "activity") {
							setPanelView(next);
						}
					}}
				>
					<ToggleGroupItem value="details">
						Details
					</ToggleGroupItem>
					<ToggleGroupItem value="activity">
						Activity
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
			{panelView === "details" ? (
				<ArtifactPane
					aria-label="Work item details"
					borderless={borderless}
					showSeparators={false}
					sections={[
						{
							collapsible: false,
							content: <DetailsTab draft={draft} onChange={actions.updateMetadata} people={people} />,
							defaultOpen: true,
							id: "details",
							title: "Details",
						},
						...resourceSections,
						{
							content: <AutomationTab rules={automationRules} />,
							count: automationRules.length || undefined,
							headerAction: { label: "Manage automations" },
							id: "automation",
							title: "Automation",
						},
						{
							content: <DevelopmentSectionContent />,
							count: CONNECTED_REPOSITORY_COUNT || undefined,
							headerAction: { label: "Manage dev tools" },
							id: "development",
							title: "Development",
						},
					]}
				/>
			) : (
				activity
			)}
		</div>
	);
}
