"use client";

import { LayoutGroup } from "motion/react";
import { useId, useMemo, useState } from "react";

import { useRovoChat } from "@/app/contexts";
import { getAgentsWorkItemForCard } from "@/components/projects/jira/data/rfp-work-items";
import { WorkItemModalProvider } from "@/app/contexts/context-work-item-modal";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type {
	JiraWorkItemComposerDelivery,
	JiraWorkItemPreset,
	JiraWorkItemState,
} from "@/components/blocks/jira-work-item/data/session-state";
import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import {
	JiraWorkItemProvider,
	useJiraWorkItemMeta,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { MetadataRailProvider } from "@/components/blocks/jira-work-item/experimental-v2/context-metadata-rail";
import { PanelLayoutProvider } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import { ExperimentalWorkItemDialog } from "@/components/blocks/jira-work-item/experimental-v2/components/experimental-work-item-dialog";
import { ExperimentalWorkItemLayout } from "@/components/blocks/jira-work-item/experimental-v2/components/experimental-work-item-layout";
import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { ContextHeader, ContextPanel } from "@/components/blocks/jira-work-item/experimental-v2/components/context-panel";
import { ActivityPanel } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import { ActivityComposer } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-composer";
import { MetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/components/metadata-rail";
import { FloatingSessionSurface } from "@/components/blocks/jira-work-item/experimental-v2/components/floating-session-surface";
import type { CodingAgentId } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import type { WorkItemAutomationRule } from "@/components/blocks/jira-work-item/experimental-v2/components/automation-tab";
import {
	getPullRequestIdentity,
	selectPullRequestEntries,
	type ActivitySessionThreadConfig,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";

interface ExperimentalV2JiraWorkItemBaseProps {
	activitySessionThread?: ActivitySessionThreadConfig;
	automationRules?: readonly WorkItemAutomationRule[];
	composerAgents?: readonly AgentSelectorAgent[];
	initialPreset: JiraWorkItemPreset;
	initialState?: JiraWorkItemState;
	initialStateRevision?: string | number;
	onAgentPromptSubmit?: (agentIds: readonly string[], prompt: string) => void;
	onOpenAgentChat?: (agentId: string) => void;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	/** Override status pill options (defaults to RFP board columns). */
	statusPhases?: readonly string[];
	workItem?: WorkItemData;
	composerDelivery?: JiraWorkItemComposerDelivery;
}

export type ExperimentalV2JiraWorkItemProps = ExperimentalV2JiraWorkItemBaseProps & (
	| { presentation?: "modal"; open: boolean; onClose: () => void }
	| {
		presentation: "inline";
		inlineSurface?: "card" | "fill";
		open?: never;
		onClose?: never;
	}
);

const NOOP = () => undefined;

interface ExperimentalV2JiraWorkItemContentProps {
	activitySessionThread?: ActivitySessionThreadConfig;
	automationRules?: readonly WorkItemAutomationRule[];
	composerAgents?: readonly AgentSelectorAgent[];
	inlineSurface: "card" | "fill";
	onAgentPromptSubmit?: (agentIds: readonly string[], prompt: string) => void;
	onClose: () => void;
	onOpenAgentChat?: (agentId: string) => void;
	open: boolean;
	outputs?: readonly string[];
	presentation: "modal" | "inline";
	primaryCodingAgentId?: CodingAgentId;
	workItem: WorkItemData;
}

function ExperimentalV2JiraWorkItemContent({
	activitySessionThread,
	automationRules,
	composerAgents,
	inlineSurface,
	onAgentPromptSubmit,
	onClose,
	onOpenAgentChat,
	open,
	outputs,
	presentation,
	primaryCodingAgentId,
	workItem,
}: Readonly<ExperimentalV2JiraWorkItemContentProps>) {
	const composerLayoutGroupId = useId();
	const [descriptionViewMode, setDescriptionViewMode] = useState<EditorToolbarViewMode>("rendered");
	const [selectedPullRequestIdentity, setSelectedPullRequestIdentity] = useState<string | null>(null);
	const { chatSurface } = useRovoChat();
	const { activityEvents } = useJiraWorkItemMeta();
	const { elapsedMs } = useJiraWorkItemState();
	const agentChatOpen = chatSurface === "floating";
	const pullRequestEntries = useMemo(
		() => selectPullRequestEntries(activityEvents, SESSION_EPOCH_MS + elapsedMs),
		[activityEvents, elapsedMs],
	);
	const selectedPullRequestEntry = useMemo(
		() => pullRequestEntries.find((entry) => (
			entry.pullRequest
			&& getPullRequestIdentity(entry.pullRequest) === selectedPullRequestIdentity
		)) ?? null,
		[pullRequestEntries, selectedPullRequestIdentity],
	);
	const handlePullRequestSelect = (entry: JiraActivityEventEntry) => {
		if (!entry.pullRequest) return;
		const identity = getPullRequestIdentity(entry.pullRequest);
		setSelectedPullRequestIdentity((currentIdentity) => (
			currentIdentity === identity ? null : identity
		));
	};

	return (
		<PanelLayoutProvider>
			<MetadataRailProvider>
				<LayoutGroup id={composerLayoutGroupId}>
					<ExperimentalWorkItemDialog
						inlineSurface={inlineSurface}
						open={open}
						onClose={onClose}
						presentation={presentation}
						pullRequestEntries={pullRequestEntries}
						sidebar={<FloatingSessionSurface />}
						sidebarOpen={agentChatOpen}
						workItemCode={workItem.code}
						workItemTitle={workItem.title}
					>
						<ExperimentalWorkItemLayout
							header={(
								<ContextHeader
									descriptionViewMode={descriptionViewMode}
									outputs={outputs}
									primaryCodingAgentId={primaryCodingAgentId}
									pullRequestEntries={pullRequestEntries}
									pullRequestSelected={selectedPullRequestEntry !== null}
									selectedPullRequestIdentity={selectedPullRequestIdentity}
									onDescriptionViewModeChange={setDescriptionViewMode}
									onPullRequestClear={() => setSelectedPullRequestIdentity(null)}
									onPullRequestSelect={handlePullRequestSelect}
								/>
							)}
							context={(scrollContainerRef) => (
								<ContextPanel
									descriptionViewMode={descriptionViewMode}
									scrollContainerRef={scrollContainerRef}
									selectedPullRequestEntry={selectedPullRequestEntry}
									onDescriptionViewModeChange={setDescriptionViewMode}
								/>
							)}
							composer={(
								<ActivityComposer
									agents={composerAgents}
									onAgentPromptSubmit={onAgentPromptSubmit}
									onOpenAgentChat={onOpenAgentChat}
								/>
							)}
							fillContainer={inlineSurface === "fill"}
							metadata={(
								<div
									aria-hidden={agentChatOpen}
									className="flex min-h-0 min-w-0 flex-1 flex-col"
									inert={agentChatOpen ? true : undefined}
								>
									<MetadataRail
										activity={(
											<ActivityPanel
												activitySessionThread={activitySessionThread}
												railChromeEnabled={selectedPullRequestEntry === null}
											/>
										)}
										automationRules={automationRules}
										borderless
										selectedPullRequestEntry={selectedPullRequestEntry}
									/>
								</div>
							)}
						/>
					</ExperimentalWorkItemDialog>
				</LayoutGroup>
			</MetadataRailProvider>
		</PanelLayoutProvider>
	);
}

/**
 * Composition root for the experimental **v2** Jira Work Item surface.
 *
 * Forked from `experimental/` so v2 can diverge freely without touching v1. The
 * two trees are byte-identical apart from import paths and this root's name;
 * the session/planner model under `data/` is deliberately shared, so model
 * changes reach both variants.
 *
 * Wraps the whole experience in the block-local `JiraWorkItemProvider` (one
 * shared session-state instance) so the launcher, the embedded session panel,
 * and the Activity `@`-reply composer all act on the same sessions. The session
 * panel replaces the metadata rail while it is open and expands into a
 * full-height sibling column, keeping the chat within the work-item surface.
 */
export function ExperimentalV2JiraWorkItem(props: Readonly<ExperimentalV2JiraWorkItemProps>) {
	const { initialPreset, initialState } = props;
	let presentation: "modal" | "inline";
	let inlineSurface: "card" | "fill" = "card";
	let open: boolean;
	let onClose: () => void;
	if (props.presentation === "inline") {
		presentation = "inline";
		inlineSurface = props.inlineSurface ?? "card";
		open = true;
		onClose = NOOP;
	} else {
		presentation = "modal";
		open = props.open;
		onClose = props.onClose;
	}
	const defaultWorkItem = useMemo(
		() => getAgentsWorkItemForCard({
				title: "Acmecorp: Prepare for bid recommendation for ESM RFP",
				code: "RFP-101",
			}),
		[],
	);
	const workItem = props.workItem ?? defaultWorkItem;

	return (
		// Keep the WorkItemModalProvider mounted (isOpen always true) so the reused
		// standard ModalHeader has its context and the Base UI dialog owns its own
		// open/close lifecycle + enter/exit animation. Read-only reuse — the standard
		// modal itself is untouched.
		<WorkItemModalProvider isOpen onClose={onClose} workItem={workItem}>
			<JiraWorkItemProvider
				active={open}
				composerDelivery={props.composerDelivery}
				initialPreset={initialPreset}
				initialState={initialState}
				initialStateRevision={props.initialStateRevision}
				statusPhases={props.statusPhases}
				workItem={workItem}
			>
				<ExperimentalV2JiraWorkItemContent
					activitySessionThread={props.activitySessionThread}
					automationRules={props.automationRules}
					composerAgents={props.composerAgents}
					inlineSurface={inlineSurface}
					key={props.initialStateRevision}
					onAgentPromptSubmit={props.onAgentPromptSubmit}
					onClose={onClose}
					onOpenAgentChat={props.onOpenAgentChat}
					open={open}
					outputs={props.outputs}
					presentation={presentation}
					primaryCodingAgentId={props.primaryCodingAgentId}
					workItem={workItem}
				/>
			</JiraWorkItemProvider>
		</WorkItemModalProvider>
	);
}

export default ExperimentalV2JiraWorkItem;
