"use client";

import { LayoutGroup } from "motion/react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useRovoChat } from "@/app/contexts";
import type { SkillsDirectorySkill } from "@/app/data/directory";
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
import type { SessionReplyInterceptor } from "@/components/blocks/jira-work-item/experimental-v2/components/floating-session-surface";
import type { CodingAgentId } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import type { WorkItemAutomationRule } from "@/components/blocks/jira-work-item/experimental-v2/components/automation-tab";
import {
	METADATA_PANEL_DEFAULT_WIDTH_PX,
	METADATA_PANEL_MAX_WIDTH_PX,
	METADATA_PANEL_MIN_WIDTH_PX,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/layout-constants";
import {
	getPullRequestIdentity,
	selectPullRequestEntries,
	type ActivitySessionThreadConfig,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";
import { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";
import { SidebarResizeHandle } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface ExperimentalV2JiraWorkItemBaseProps {
	activitySessionThread?: ActivitySessionThreadConfig;
	automationRules?: readonly WorkItemAutomationRule[];
	composerAgents?: readonly AgentSelectorAgent[];
	initialPreset: JiraWorkItemPreset;
	initialState?: JiraWorkItemState;
	initialStateRevision?: string | number;
	onAgentPromptSubmit?: (agentIds: readonly string[], prompt: string) => void;
	onOpenAgentChat?: (agentId: string) => void;
	onPullRequestApprove?: (identity: string) => void;
	onSessionReply?: SessionReplyInterceptor;
	onSkillInvoke?: (skill: SkillsDirectorySkill) => boolean | void;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	pullRequestApprovalStates?: Readonly<Record<string, "available" | "approved">>;
	stageKey?: string;
	/** Override status pill options (defaults to RFP board columns). */
	statusPhases?: readonly string[];
	workItem?: WorkItemData;
	composerDelivery?: JiraWorkItemComposerDelivery;
}

export type ExperimentalV2JiraWorkItemProps = ExperimentalV2JiraWorkItemBaseProps & (
	| { presentation?: "modal"; open: boolean; onClose: () => void }
	| {
		presentation: "inline";
		inlineSurface?: "card" | "card-fill" | "fill";
		open?: never;
		onClose?: never;
	}
);

const NOOP = () => undefined;

interface ExperimentalV2JiraWorkItemContentProps {
	activitySessionThread?: ActivitySessionThreadConfig;
	automationRules?: readonly WorkItemAutomationRule[];
	composerAgents?: readonly AgentSelectorAgent[];
	inlineSurface: "card" | "card-fill" | "fill";
	onAgentPromptSubmit?: (agentIds: readonly string[], prompt: string) => void;
	onClose: () => void;
	onOpenAgentChat?: (agentId: string) => void;
	onPullRequestApprove?: (identity: string) => void;
	onSessionReply?: SessionReplyInterceptor;
	onSkillInvoke?: (skill: SkillsDirectorySkill) => boolean | void;
	open: boolean;
	outputs?: readonly string[];
	presentation: "modal" | "inline";
	primaryCodingAgentId?: CodingAgentId;
	pullRequestApprovalStates?: Readonly<Record<string, "available" | "approved">>;
	stageKey?: string;
	workItem: WorkItemData;
}

interface WorkItemSidePanelResizeHandleProps {
	ariaLabel: string;
	className?: string;
	resize: ReturnType<typeof useSidebarResize>;
	testId: string;
}

function WorkItemSidePanelResizeHandle({
	ariaLabel,
	className,
	resize,
	testId,
}: Readonly<WorkItemSidePanelResizeHandleProps>) {
	return (
		<SidebarResizeHandle
			aria-label={ariaLabel}
			aria-orientation="vertical"
			aria-valuemax={resize.maxWidth}
			aria-valuemin={resize.minWidth}
			aria-valuenow={resize.sidebarWidth}
			className={cn(
				"bottom-6! bg-transparent duration-normal ease-out-practical focus-visible:bg-bg-selected-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>div]:h-16 [&>div]:origin-center [&>div]:transition-[opacity,background-color,scale] hover:[&>div]:scale-105 data-[active]:[&>div]:scale-105 focus-visible:[&>div]:scale-105 focus-visible:[&>div]:bg-bg-selected-bold focus-visible:[&>div]:opacity-100 [&>div]:duration-medium [&>div]:ease-out-practical motion-reduce:transition-none motion-reduce:[&>div]:scale-100 motion-reduce:[&>div]:transition-none",
				className,
			)}
			data-active={resize.isResizing ? "" : undefined}
			data-testid={testId}
			onDoubleClick={resize.onResizeHandleDoubleClick}
			onKeyDown={resize.onResizeHandleKeyDown}
			onPointerDown={resize.onResizeHandlePointerDown}
			onPointerEnter={resize.onResizeHandlePointerEnter}
			onPointerLeave={resize.onResizeHandlePointerLeave}
			role="separator"
			side="left"
			tabIndex={0}
		/>
	);
}

function ExperimentalV2JiraWorkItemContent({
	activitySessionThread,
	automationRules,
	composerAgents,
	inlineSurface,
	onAgentPromptSubmit,
	onClose,
	onOpenAgentChat,
	onPullRequestApprove,
	onSessionReply,
	onSkillInvoke,
	open,
	outputs,
	presentation,
	primaryCodingAgentId,
	pullRequestApprovalStates,
	stageKey,
	workItem,
}: Readonly<ExperimentalV2JiraWorkItemContentProps>) {
	const composerLayoutGroupId = useId();
	const [descriptionViewMode, setDescriptionViewMode] = useState<EditorToolbarViewMode>("rendered");
	const [selectedPullRequestIdentity, setSelectedPullRequestIdentity] = useState<string | null>(null);
	const previousStageKeyRef = useRef(stageKey);
	const { chatSurface } = useRovoChat();
	const { activityEvents } = useJiraWorkItemMeta();
	const { elapsedMs } = useJiraWorkItemState();
	const agentChatOpen = chatSurface === "floating";
	const metadataPanelResize = useSidebarResize({
		defaultWidth: METADATA_PANEL_DEFAULT_WIDTH_PX,
		direction: "rtl",
		maxWidth: METADATA_PANEL_MAX_WIDTH_PX,
		minWidth: METADATA_PANEL_MIN_WIDTH_PX,
		minWidthResistance: true,
	});
	const pullRequestEntries = useMemo(() => (
		selectPullRequestEntries(activityEvents, SESSION_EPOCH_MS + elapsedMs).map((entry) => {
			if (!entry.pullRequest) return entry;
			const identity = getPullRequestIdentity(entry.pullRequest);
			if (pullRequestApprovalStates?.[identity] !== "approved") return entry;
			return {
				...entry,
				pullRequest: {
					...entry.pullRequest,
					reviewDecision: "approved" as const,
					mergeState: "ready" as const,
				},
			};
		})
	), [activityEvents, elapsedMs, pullRequestApprovalStates]);
	useLayoutEffect(() => {
		if (
			stageKey === undefined
			|| Object.is(previousStageKeyRef.current, stageKey)
		) {
			return;
		}
		previousStageKeyRef.current = stageKey;
		setDescriptionViewMode("rendered");
		setSelectedPullRequestIdentity(null);
	}, [stageKey]);
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
		setSelectedPullRequestIdentity(identity);
	};
	const selectedPullRequestApprovalState = selectedPullRequestIdentity
		? pullRequestApprovalStates?.[selectedPullRequestIdentity]
		: undefined;

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
						sidebar={<FloatingSessionSurface onSessionReply={onSessionReply} />}
						sidebarOpen={agentChatOpen}
						sidebarResizeHandle={(
							<WorkItemSidePanelResizeHandle
								ariaLabel="Resize agent chat panel"
								className="top-0! bottom-0! left-0! bg-border group-hover/chat-panel:[&>div]:opacity-100"
								resize={metadataPanelResize}
								testId="jira-work-item-chat-resize-handle"
							/>
						)}
						sidebarResizing={metadataPanelResize.isResizing}
						sidebarWidth={metadataPanelResize.sidebarWidth}
						workItemCode={workItem.code}
						workItemTitle={workItem.title}
					>
						<ExperimentalWorkItemLayout
							metadataPanelResizing={metadataPanelResize.isResizing}
							metadataPanelWidth={metadataPanelResize.sidebarWidth}
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
									onPullRequestApprove={onPullRequestApprove}
									pullRequestApprovalState={selectedPullRequestApprovalState}
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
									onSkillInvoke={onSkillInvoke}
								/>
							)}
							fillContainer={inlineSurface !== "card"}
							metadata={(
								<div
									aria-hidden={agentChatOpen}
									className="group/metadata-resize relative flex min-h-0 min-w-0 flex-1 flex-col"
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
									<div className="hidden @[860px]/agentlayout:contents">
										{/* The description content ends 24px before the split while rail
										content starts 36px after it (24px shell + 12px rail padding).
										Shift the separator 6px right to sit at that visual midpoint. */}
										<WorkItemSidePanelResizeHandle
											ariaLabel="Resize details and activity panel"
											className="top-[3.875rem]! left-[calc(-1.5rem+0.375rem)]! bg-transparent! hover:bg-transparent! data-[active]:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0 group-hover/metadata-panel:[&>div]:opacity-100"
											resize={metadataPanelResize}
											testId="jira-work-item-metadata-resize-handle"
										/>
									</div>
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
	let inlineSurface: "card" | "card-fill" | "fill" = "card";
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
					onAgentPromptSubmit={props.onAgentPromptSubmit}
					onClose={onClose}
					onOpenAgentChat={props.onOpenAgentChat}
					onPullRequestApprove={props.onPullRequestApprove}
					onSessionReply={props.onSessionReply}
					onSkillInvoke={props.onSkillInvoke}
					open={open}
					outputs={props.outputs}
					presentation={presentation}
					primaryCodingAgentId={props.primaryCodingAgentId}
					pullRequestApprovalStates={props.pullRequestApprovalStates}
					stageKey={props.stageKey}
					workItem={workItem}
				/>
			</JiraWorkItemProvider>
		</WorkItemModalProvider>
	);
}

export default ExperimentalV2JiraWorkItem;
