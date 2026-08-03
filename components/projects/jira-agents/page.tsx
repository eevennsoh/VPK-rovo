"use client";

import { useCallback, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import {
	useWorkItemStageController,
	WorkItemControls,
	WorkItemStage,
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

export default function JiraAgentsPage(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(JIRA_AGENTS_GALLERY_ITEMS[0]?.id ?? "");
	const workItemController = useWorkItemStageController();
	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		setSelectedId(nextSelectedId);
	}, []);
	const renderSelectedItem = useCallback((item: GalleryItem): React.ReactNode => {
		if (item.id === "for-you") return <ForYouStage />;
		if (item.id === "kanban-list") return <KanbanListStage />;
		if (item.id === "work-item") return <WorkItemStage controller={workItemController} />;
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
