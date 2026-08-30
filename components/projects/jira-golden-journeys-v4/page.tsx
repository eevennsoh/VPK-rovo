"use client";

import { useCallback, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import type { JiraIssueAgentActivity } from "@/components/blocks/jira-issue";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";
import { JgpRovoOverlay } from "@/components/projects/jira-golden-journeys-v1/components/jira-golden-journeys-v1-rovo-overlay";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v1/data/agent-chat-data";
import { useJgpAgentChatDemo } from "@/components/projects/jira-golden-journeys-v1/hooks/use-jira-golden-journeys-v1-agent-chat-demo";
import { JiraViewTabs } from "@/components/projects/jira/components/jira-header";
import AppLayout from "@/components/projects/page";

import {
	createJiraGoldenJourneysV4PayBoardColumns,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES,
} from "./data/presentation-story";

export default function JiraGoldenJourneysV4Page(): React.ReactElement {
	return (
		<RovoChatProvider agentProfiles={JGP_CHAT_AGENT_PROFILES}>
			<JiraGoldenJourneysV4App />
		</RovoChatProvider>
	);
}

function JiraGoldenJourneysV4App(): React.ReactElement {
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useJgpAgentChatDemo();
	const [boardColumns, setBoardColumns] = useState(createJiraGoldenJourneysV4PayBoardColumns);
	const [selectedTab, setSelectedTab] = useState(1);
	const handleViewChat = useCallback((activity: JiraIssueAgentActivity, card: JiraKanbanCardData) => {
		openAgentChat({
			agentId: activity.id,
			agentName: activity.name,
			issueKey: card.code,
			issueSummary: card.title,
			intro: activity.message,
			question: activity.question,
		});
	}, [openAgentChat]);

	return (
		<>
			<AppLayout
				chatContextBar={chatContextBar}
				chatPanelFlush
				defaultSidebarOpen={false}
				hideFloatingRovo
				product="jira"
			>
				<div className="h-full min-h-0 min-w-0 overflow-hidden bg-surface [&>div]:min-h-0">
					<ExperimentalJiraKanbanPage
						agents={JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS}
						ariaLabel="Track the Payments SDK v2 migration. Scroll horizontally to review all delivery statuses."
						boardColumns={boardColumns}
						headerAssignees={JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES}
						insightsEnabled={false}
						onBoardColumnsChange={(columns: readonly JiraKanbanColumnData[]) => {
							setBoardColumns([...columns]);
						}}
						onCardAgentActivityViewChat={handleViewChat}
						showAgentSessionColumn
						showBoardContent={selectedTab === 1}
						viewTabs={<JiraViewTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />}
					/>
				</div>
			</AppLayout>
			<JgpRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
			/>
		</>
	);
}
