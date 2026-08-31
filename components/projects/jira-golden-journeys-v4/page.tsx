"use client";

import { useCallback, useRef, useState } from "react";

import { RovoChatProvider, useRovoChat } from "@/app/contexts/context-rovo-chat";
import type { AgentSessionItem } from "@/components/blocks/agent-session";
import type { JiraIssueAgentActivity } from "@/components/blocks/jira-issue";
import type { JiraKanbanCardData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";
import { linkJiraKanbanAgentSession, unlinkJiraKanbanAgentSession } from "@/components/blocks/jira-kanban/state";
import { JiraList, type JiraListRowData } from "@/components/blocks/jira-list";
import { Omnibar } from "@/components/blocks/omnibar";
import { SCRUBBER_DEMO_ENTRIES } from "@/components/blocks/scrubber";
import { JgpRovoOverlay } from "@/components/projects/jira-golden-journeys-v1/components/jira-golden-journeys-v1-rovo-overlay";
import { JGP_CHAT_AGENT_PROFILES } from "@/components/projects/jira-golden-journeys-v1/data/agent-chat-data";
import { useJgpAgentChatDemo } from "@/components/projects/jira-golden-journeys-v1/hooks/use-jira-golden-journeys-v1-agent-chat-demo";
import { JiraViewTabs } from "@/components/projects/jira/components/jira-header";
import AppLayout from "@/components/projects/page";

import {
	createJiraGoldenJourneysV4PayBoardColumns,
	toJiraGoldenJourneysV4AgentActivityFromSession,
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
	const { chatSurface, openChat, sendPrompt } = useRovoChat();
	const isSidebarChatOpen = chatSurface === "sidebar";
	const [boardColumns, setBoardColumns] = useState(createJiraGoldenJourneysV4PayBoardColumns);
	const [detachedAgentSessionsByCard, setDetachedAgentSessionsByCard] = useState<
		Readonly<Record<string, readonly AgentSessionItem[]>>
	>({});
	const detachedActivitiesByIdRef = useRef<Record<string, JiraIssueAgentActivity>>({});
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
	const handleOmnibarOpenPanel = useCallback(() => {
		openChat("sidebar");
	}, [openChat]);
	const handleOmnibarSubmit = useCallback((prompt: string) => {
		openChat("sidebar");
		void sendPrompt(prompt);
	}, [openChat, sendPrompt]);
	const handleAgentSessionUnlink = useCallback((session: { id: string }, card: JiraKanbanCardData) => {
		const activity = card.agentActivities?.find((candidate) => candidate.id === session.id);
		if (!activity) return;
		const detachedSession = toJiraGoldenJourneysV4DetachedAgentSession(activity, card);
		detachedActivitiesByIdRef.current = {
			...detachedActivitiesByIdRef.current,
			[activity.id]: activity,
		};
		setDetachedAgentSessionsByCard((current) => {
			const currentSessions = current[card.code] ?? [];
			return currentSessions.some((candidate) => candidate.id === detachedSession.id)
				? current
				: { ...current, [card.code]: [...currentSessions, detachedSession] };
		});
		setBoardColumns((columns) => unlinkJiraKanbanAgentSession(columns, card.code, session.id));
	}, []);
	const handleAgentSessionLink = useCallback((session: AgentSessionItem, card: JiraKanbanCardData) => {
		const activity = detachedActivitiesByIdRef.current[session.id]
			?? toJiraGoldenJourneysV4AgentActivityFromSession(session);
		if (session.id in detachedActivitiesByIdRef.current) {
			const rest = { ...detachedActivitiesByIdRef.current };
			delete rest[session.id];
			detachedActivitiesByIdRef.current = rest;
		}
		setDetachedAgentSessionsByCard((current) => {
			const currentSessions = current[card.code] ?? [];
			const nextSessions = currentSessions.filter((candidate) => candidate.id !== session.id);
			if (nextSessions.length === currentSessions.length) {
				return current;
			}
			if (nextSessions.length === 0) {
				const rest = { ...current };
				delete rest[card.code];
				return rest;
			}
			return { ...current, [card.code]: nextSessions };
		});
		setBoardColumns((columns) => linkJiraKanbanAgentSession(columns, card.code, activity));
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
						onCardAgentSessionLink={handleAgentSessionLink}
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
			{/*
			 * The Omnibar is this board's single AI entry point, so the launcher is hidden —
			 * two bottom-anchored Rovo affordances would compete for the same job. The
			 * floating chat stays reachable: card "View chat" actions still open it.
			 *
			 * `tone="default"` keeps the existing compact prompt instead of the inverse black
			 * bar. The side-panel control opens the same AppLayout sidebar Ask Rovo uses —
			 * not a second docked ChatPanel. While that sidebar is open the bar unmounts so
			 * the page never shows two composers at once.
			 *
			 * `positioning="viewport"` because the board fills the window and the bar has to
			 * clear the horizontally scrolling columns rather than ride inside them. The
			 * timeline is the same PAY sprint week the board narrates, so scrubbing it reads
			 * as moving through this project's history.
			 */}
			{isSidebarChatOpen ? null : (
				<Omnibar
					onOpenPanel={handleOmnibarOpenPanel}
					onSubmit={handleOmnibarSubmit}
					positioning="viewport"
					timelineAxis="x"
					timelineEntries={SCRUBBER_DEMO_ENTRIES}
					tone="default"
				/>
			)}
			<JgpRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
				launcher="hidden"
			/>
		</>
	);
}
