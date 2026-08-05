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
	const handleOpenAgentChat = useCallback((agentId: string) => {
		selectAgent(agentId, { preserveCurrentThread: true });
		openChat("floating");
	}, [openChat, selectAgent]);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 items-start justify-center overflow-hidden px-8 pt-4 pb-4">
			<ExperimentalV2JiraWorkItem
				automationRules={JIRA_AGENTS_AUTOMATION_RULES}
				key={controller.launchId}
				composerAgents={JIRA_AGENTS_STORY_COMPOSER_AGENTS}
				composerDelivery="broadcast-active-agents"
				initialPreset={controller.initialState.preset}
				initialState={controller.initialState}
				onOpenAgentChat={handleOpenAgentChat}
				presentation="inline"
				workItem={controller.workItem}
			/>
		</div>
	);
}

export default function JiraAgentsPage(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(JIRA_AGENTS_GALLERY_ITEMS[0]?.id ?? "");
	const storyController = useJiraAgentsStory();
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
