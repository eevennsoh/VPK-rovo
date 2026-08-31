"use client";

import { useCallback, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import type { JiraIssueAgentActivity } from "@/components/blocks/jira-issue";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";
import { unlinkJiraKanbanAgentSession } from "@/components/blocks/jira-kanban/state";
import { JiraList, type JiraListRowData } from "@/components/blocks/jira-list";
import { JgpRovoOverlay } from "@/components/projects/jira-golden-journeys-v1/components/jira-golden-journeys-v1-rovo-overlay";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v1/data/agent-chat-data";
import { useJgpAgentChatDemo } from "@/components/projects/jira-golden-journeys-v1/hooks/use-jira-golden-journeys-v1-agent-chat-demo";
import { JiraViewTabs } from "@/components/projects/jira/components/jira-header";
import AppLayout from "@/components/projects/page";

import {
	createJiraGoldenJourneysV4PayBoardColumns,
	toJiraGoldenJourneysV4DetachedAgentSession,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID,
} from "./data/presentation-story";

const STATUS_VARIANTS: Readonly<Record<string, JiraListRowData["statusVariant"]>> = {
	"To do": "neutral",
	"In progress": "information",
	"In review": "warning",
	Done: "success",
};

function createListRows(columns: readonly JiraKanbanColumnData[]): JiraListRowData[] {
	return columns.flatMap((column) => column.cards.map((card) => ({
		issueKey: card.code,
		summary: card.title,
		issueType: "task",
		priority: card.priority,
		status: column.title,
		statusVariant: STATUS_VARIANTS[column.title],
		assignee: card.assignee,
		agentSessions: [
			...(card.agentActivities?.map((activity) => activity.name) ?? []),
			...(card.agentDoneRuns?.map((run) => run.agentName) ?? []),
		],
		labels: card.tags,
		contributors: card.assignee ? [card.assignee] : [],
	})));
}

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
	const [detachedAgentSessionsByCard, setDetachedAgentSessionsByCard] = useState<
		Readonly<Record<string, readonly AgentSessionItem[]>>
	>({});
	const [activeView, setActiveView] = useState<"board" | "list">("board");
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
	const handleAgentSessionUnlink = useCallback((session: { id: string }, card: JiraKanbanCardData) => {
		const activity = card.agentActivities?.find((candidate) => candidate.id === session.id);
		if (!activity) return;
		const detachedSession = toJiraGoldenJourneysV4DetachedAgentSession(activity, card);
		setDetachedAgentSessionsByCard((current) => {
			const currentSessions = current[card.code] ?? [];
			return currentSessions.some((candidate) => candidate.id === detachedSession.id)
				? current
				: { ...current, [card.code]: [...currentSessions, detachedSession] };
		});
		setBoardColumns((columns) => unlinkJiraKanbanAgentSession(columns, card.code, session.id));
	}, []);

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
						activeView={activeView}
						agentActivityLayout="split"
						cardGenerativeActionPresentation="more-actions"
						agentSessionAssigneeIdAliases={JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID}
						agents={JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS}
						ariaLabel="Track the Payments SDK v2 migration. Scroll horizontally to review all delivery statuses."
						boardColumns={boardColumns}
						detachedAgentSessionsByCard={detachedAgentSessionsByCard}
						headerAssignees={JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES}
						insightsEnabled={false}
						onBoardColumnsChange={(columns: readonly JiraKanbanColumnData[]) => {
							setBoardColumns([...columns]);
						}}
						onCardAgentActivityViewChat={handleViewChat}
						onCardAgentSessionUnlink={handleAgentSessionUnlink}
						onViewChange={setActiveView}
						renderListContent={(columns) => {
							const listRows = createListRows(columns);
							return (
								<div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
									<JiraList
										ariaLabel="Payments SDK v2 migration work items list"
										className="h-full max-h-none"
										rows={listRows}
										totalCountLabel={`${listRows.length}`}
										visibleCount={listRows.length}
									/>
								</div>
							);
						}}
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
