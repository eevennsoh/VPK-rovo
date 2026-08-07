"use client";

import { LayoutGroup } from "motion/react";
import { useId, useMemo, useState } from "react";

import { useRovoChat } from "@/app/contexts";
import { getAgentsWorkItemForCard } from "@/components/projects/jira/data/rfp-work-items";
import { WorkItemModalProvider } from "@/app/contexts/context-work-item-modal";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type {
	JiraWorkItemComposerDelivery,
	JiraWorkItemPreset,
	JiraWorkItemState,
} from "@/components/blocks/jira-work-item/data/session-state";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { JiraWorkItemProvider } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
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
import type { ActivitySessionThreadConfig } from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";

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
	const composerLayoutGroupId = useId();
	const [descriptionViewMode, setDescriptionViewMode] = useState<EditorToolbarViewMode>("rendered");
	const { chatSurface } = useRovoChat();
	const agentChatOpen = chatSurface === "floating";
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
				workItem={workItem}
			>
				<PanelLayoutProvider>
					<LayoutGroup id={composerLayoutGroupId}>
						<ExperimentalWorkItemDialog
							inlineSurface={inlineSurface}
							open={open}
							onClose={onClose}
							presentation={presentation}
							sidebar={<FloatingSessionSurface />}
							sidebarOpen={agentChatOpen}
							workItemCode={workItem.code}
							workItemTitle={workItem.title}
						>
							<ExperimentalWorkItemLayout
								header={(
									<ContextHeader
										descriptionViewMode={descriptionViewMode}
										outputs={props.outputs}
										primaryCodingAgentId={props.primaryCodingAgentId}
										onDescriptionViewModeChange={setDescriptionViewMode}
									/>
								)}
								context={(
									<ContextPanel
										descriptionViewMode={descriptionViewMode}
										onDescriptionViewModeChange={setDescriptionViewMode}
									/>
								)}
								activity={<ActivityPanel activitySessionThread={props.activitySessionThread} />}
								composer={(
									<ActivityComposer
										agents={props.composerAgents}
										onAgentPromptSubmit={props.onAgentPromptSubmit}
										onOpenAgentChat={props.onOpenAgentChat}
									/>
								)}
								fillContainer={inlineSurface === "fill"}
								metadata={(
									<div
										aria-hidden={agentChatOpen}
										inert={agentChatOpen ? true : undefined}
									>
										<MetadataRail automationRules={props.automationRules} borderless />
									</div>
								)}
							/>
						</ExperimentalWorkItemDialog>
					</LayoutGroup>
				</PanelLayoutProvider>
			</JiraWorkItemProvider>
		</WorkItemModalProvider>
	);
}

export default ExperimentalV2JiraWorkItem;
