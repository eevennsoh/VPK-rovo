"use client";

import { useCallback, useState } from "react";

import { RovoChatProvider, useRovoChat } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import { ExperimentalV2JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/experimental-v2-jira-work-item";
import {
	useWorkItemStageController,
	WorkItemControls,
	type WorkItemStageController,
} from "@/components/projects/asx/components/work-item-stage";
import {
	ForYouStage,
	JiraDesignWorkspaceStage,
} from "@/components/projects/jira-golden-journeys/components/for-you-stage";
import type { JiraDesignView } from "@/components/projects/jira-golden-journeys/components/jira-design-view-tabs";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys/data/agent-chat-data";
import { JIRA_AGENTS_GALLERY_ITEMS } from "./data/gallery-items";

function KanbanListStage(): React.ReactElement {
	const [view, setView] = useState<JiraDesignView>("board");

	return <JiraDesignWorkspaceStage onViewChange={setView} view={view} />;
}

function JiraAgentsWorkItemStage({
	controller,
}: Readonly<{ controller: WorkItemStageController }>): React.ReactElement {
	const { openChat, selectAgent } = useRovoChat();
	const handleOpenAgentChat = useCallback((agentId: string) => {
		selectAgent(agentId, { preserveCurrentThread: true });
		openChat("floating");
	}, [openChat, selectAgent]);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 items-start justify-center overflow-hidden px-8 pt-4 pb-4">
			<ExperimentalV2JiraWorkItem
				key={controller.launchId}
				initialPreset={controller.preset}
				onOpenAgentChat={handleOpenAgentChat}
				presentation="inline"
			/>
		</div>
	);
}

export default function JiraAgentsPage(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(JIRA_AGENTS_GALLERY_ITEMS[0]?.id ?? "");
	const workItemController = useWorkItemStageController();
	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		setSelectedId(nextSelectedId);
	}, []);
	const renderSelectedItem = useCallback((item: GalleryItem): React.ReactNode => {
		if (item.id === "for-you") return <ForYouStage />;
		if (item.id === "kanban-list") return <KanbanListStage />;
		if (item.id === "work-item") return <JiraAgentsWorkItemStage controller={workItemController} />;
		return null;
	}, [workItemController]);

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
							? <WorkItemControls controller={workItemController} />
							: null
					}
				/>
			</div>
		</RovoChatProvider>
	);
}
