"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";

import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";

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
import {
	ActivityRailChromeProvider,
} from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import {
	AutomationTab,
	type WorkItemAutomationRule,
} from "@/components/blocks/jira-work-item/experimental-v2/components/automation-tab";
import { DevelopmentSectionContent } from "@/components/blocks/jira-work-item/experimental-v2/components/details-sections";
import { DetailsTab } from "@/components/blocks/jira-work-item/experimental-v2/components/details-tab";
import { MetadataRailToggle } from "@/components/blocks/jira-work-item/experimental-v2/components/metadata-rail-toggle";
import {
	useJiraWorkItemActions,
	useJiraWorkItemMeta,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/context-metadata-rail";
import { CONNECTED_REPOSITORY_COUNT } from "@/components/blocks/jira-work-item/experimental-v2/lib/development-repositories";
import { SmartLink, type SmartLinkItem } from "@/components/blocks/smart-link";
import { SMART_LINK_MODAL_ACTIONS } from "@/components/blocks/smart-link/data/smart-link-actions";
import { ProgressCircle } from "@/components/ui-custom/progress-circle";

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

function mergePeople(...seed: readonly (WorkItemPerson | null | undefined)[]): WorkItemPerson[] {
	const byName = new Map<string, WorkItemPerson>();
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
 * Work-item metadata rail for the experimental variant. Details keeps the
 * ArtifactPane surface, while Activity slots in the shared ActivityPanel from
 * the composition root.
 *
 * Scroll ownership matches the left description column: toggle chrome
 * (`MetadataRailToggle`) is the first, sticky child of the flex-1 body
 * scrollport, with `px-3` matching ArtifactPane / Activity content. Keeping the
 * first field below that in-flow spacer lets its focus halo paint fully. The
 * toggle reveals on rail-body hover (not body focus-within). Activity count and
 * sort/filter publish through `ActivityRailChromeProvider` onto that toggle.
 */
export function MetadataRail({
	activity,
	automationRules = [],
	borderless = false,
}: Readonly<{
	activity?: ReactNode;
	automationRules?: readonly WorkItemAutomationRule[];
	borderless?: boolean;
}>) {
	const {
		activePanelView,
		setActivityChrome,
	} = useMetadataRail();
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

	const { ref: metadataBodyScrollRef, showBottomScrollMask } = useHasVerticalOverflow<HTMLDivElement>();
	const metadataBodyScrollMaskStyle = useMemo(
		() => buildScrollMaskStyle({
			fadeTop: false,
			fadeBottom: showBottomScrollMask,
		}),
		[showBottomScrollMask],
	);

	return (
		<ActivityRailChromeProvider setChrome={setActivityChrome}>
			{/* Same sticky-chrome-inside-scrollport shell as the description column. */}
			<div
				className="flex min-h-0 min-w-0 flex-1 flex-col"
				data-jira-work-item-column-shell
			>
				<div
					ref={metadataBodyScrollRef}
					className="relative min-h-0 min-w-0 flex-1 overflow-y-auto @[860px]/agentlayout:pb-8"
					data-jira-work-item-scroll-region
					style={metadataBodyScrollMaskStyle}
				>
					<div
						className="shrink-0 @[860px]/agentlayout:sticky @[860px]/agentlayout:top-0 @[860px]/agentlayout:z-10 @[860px]/agentlayout:[container-type:scroll-state]"
						data-jira-work-item-column-chrome
					>
						<MetadataRailToggle />
					</div>
					<div
						className="flex min-w-0 flex-col gap-2"
						data-jira-work-item-column-body
						data-jira-work-item-metadata-rail-body
					>
						{/* Keep panels mounted so Activity local reactions/replies/sort survive toggles. */}
						<div
							hidden={activePanelView !== "details"}
							inert={activePanelView !== "details" ? true : undefined}
						>
							<ArtifactPane
								aria-label="Work item details"
								borderless={borderless}
								// Drop first-section pt-1.5 so Details top-aligns with description
								// after both column chromes share the same pb-7. overflow-visible
								// is the borderless ArtifactPane default (focus-ring clearance).
								className="[&>div:first-child]:pt-0"
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
										title: "Repositories",
									},
								]}
							/>
						</div>
						{activity != null ? (
							<div
								// overflow-visible: reply PromptInput shadows must paint past the
								// padded content box; the rail scrollport still owns clipping.
								className="overflow-visible px-3"
								hidden={activePanelView !== "activity"}
								inert={activePanelView !== "activity" ? true : undefined}
							>
								{activity}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</ActivityRailChromeProvider>
	);
}
