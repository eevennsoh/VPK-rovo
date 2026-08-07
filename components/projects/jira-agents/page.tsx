"use client";

import { useCallback, useState } from "react";

import { RovoChatProvider, useRovoChat } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import { ExperimentalV2JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/experimental-v2-jira-work-item";
import type { WorkItemAutomationRule } from "@/components/blocks/jira-work-item/experimental-v2/components/automation-tab";
import { JiraDesignWorkspaceStage } from "@/components/projects/jira-golden-journeys/components/for-you-stage";
import type { JiraDesignView } from "@/components/projects/jira-golden-journeys/components/jira-design-view-tabs";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys/data/agent-chat-data";
import { JIRA_AGENTS_GALLERY_ITEMS } from "./data/gallery-items";
import {
	JIRA_AGENTS_STORY_BOARD_AGENTS,
	JIRA_AGENTS_STORY_COMPOSER_AGENTS,
	JIRA_AGENTS_STORY_ITEM_ID,
	shouldStartJiraAgentsPlan,
} from "./data/hotfix-story";
import { JiraAgentsStoryControls } from "./story-controls";
import { useJiraAgentsStory, type JiraAgentsStoryController } from "./use-hotfix-story";

const JIRA_AGENTS_AUTOMATION_RULES = [
	{
		id: "reduce-checkout-abandonment",
		title: "Reduce storefront checkout abandonment",
		iconVariant: "purple",
	},
	{
		id: "validate-guest-order-totals",
		title: "Validate guest checkout order totals",
		iconVariant: "purple",
	},
	{
		id: "prevent-duplicate-payment",
		title: "Prevent duplicate payment on retry",
		iconVariant: "blue",
	},
	{
		id: "run-checkout-regression",
		title: "Run guest checkout regression suite",
		iconVariant: "green",
		lastRunAt: "2m ago",
	},
] as const satisfies readonly WorkItemAutomationRule[];

const JIRA_AGENTS_LEAD_SESSION_ID = "story-session-claude-code";
const JIRA_AGENTS_CHILD_SESSION_IDS = ["story-session-code-planner"] as const;

function getVisibleOrchestrationSessionIds(
	controller: JiraAgentsStoryController,
): readonly string[] {
	switch (controller.orchestrationStep) {
		case "agents-working":
		case "comment":
		case "reaction-1":
		case "reaction-2":
			return [];
		case "lead":
			return [JIRA_AGENTS_LEAD_SESSION_ID];
		case "consult":
			return [JIRA_AGENTS_LEAD_SESSION_ID, JIRA_AGENTS_CHILD_SESSION_IDS[0]];
		case "idle":
		case "complete":
			return [JIRA_AGENTS_LEAD_SESSION_ID, ...JIRA_AGENTS_CHILD_SESSION_IDS];
	}
}

function KanbanListStage({
	controller,
}: Readonly<{ controller: JiraAgentsStoryController }>): React.ReactElement {
	const [view, setView] = useState<JiraDesignView>("board");

	return (
		<JiraDesignWorkspaceStage
			agents={JIRA_AGENTS_STORY_BOARD_AGENTS}
			boardColumns={controller.boardColumns}
			defaultOpenItemId={JIRA_AGENTS_STORY_ITEM_ID}
			onBoardColumnsChange={controller.updateBoardColumns}
			onViewChange={setView}
			sections={controller.sections}
			view={view}
		/>
	);
}

function JiraAgentsWorkItemStage({
	controller,
}: Readonly<{ controller: JiraAgentsStoryController }>): React.ReactElement {
	const { openChat, selectAgent } = useRovoChat();
	const { chapter, startOrchestration } = controller;
	const visibleSessionIds = getVisibleOrchestrationSessionIds(controller);
	const handleOpenAgentChat = useCallback((agentId: string) => {
		selectAgent(agentId, { preserveCurrentThread: true });
		openChat("floating");
	}, [openChat, selectAgent]);
	const handleAgentPromptSubmit = useCallback((agentIds: readonly string[]) => {
		if (shouldStartJiraAgentsPlan(chapter, agentIds)) {
			startOrchestration();
		}
	}, [chapter, startOrchestration]);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 items-start justify-center overflow-hidden px-8 pt-4 pb-4">
			<ExperimentalV2JiraWorkItem
				activitySessionThread={{
					parentSessionId: JIRA_AGENTS_LEAD_SESSION_ID,
					childSessionIds: JIRA_AGENTS_CHILD_SESSION_IDS,
					visibleSessionIds,
				}}
				automationRules={JIRA_AGENTS_AUTOMATION_RULES}
				composerAgents={JIRA_AGENTS_STORY_COMPOSER_AGENTS}
				composerDelivery="broadcast-active-agents"
				initialPreset={controller.initialState.preset}
				initialState={controller.initialState}
				initialStateRevision={controller.launchId}
				onAgentPromptSubmit={handleAgentPromptSubmit}
				onOpenAgentChat={handleOpenAgentChat}
				presentation="inline"
				workItem={controller.workItem}
			/>
		</div>
	);
}

export default function JiraAgentsPage(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(JIRA_AGENTS_GALLERY_ITEMS[0]?.id ?? "");
	const storyController = useJiraAgentsStory(selectedId === "work-item");
	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		setSelectedId(nextSelectedId);
	}, []);
	const renderSelectedItem = useCallback((item: GalleryItem): React.ReactNode => {
		if (item.id === "kanban-list") return <KanbanListStage controller={storyController} />;
		if (item.id === "work-item") return <JiraAgentsWorkItemStage controller={storyController} />;
		return null;
	}, [storyController]);

	return (
		<RovoChatProvider agentProfiles={JGP_CHAT_AGENT_PROFILES}>
			<div className="relative h-dvh w-full overflow-hidden bg-surface">
				<Gallery
					items={JIRA_AGENTS_GALLERY_ITEMS}
					title="Jira Agents"
					selectedId={selectedId}
					onSelectedChange={handleSelectedChange}
					renderSelectedItem={renderSelectedItem}
					showTopBarBorder={selectedId !== "work-item"}
					topBarCenter={
						selectedId === "work-item"
							? <JiraAgentsStoryControls controller={storyController} />
							: null
					}
				/>
			</div>
		</RovoChatProvider>
	);
}
