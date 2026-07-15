"use client";

import { useCallback } from "react";

import type { JiraIssueAgentActivity, JiraIssueGenerativeActionRequest } from "@/components/blocks/jira-issue";
import { JiraKanban, type JiraKanbanCardData } from "@/components/blocks/jira-kanban";
import { ASX_KANBAN_AGENTS, ASX_KANBAN_DEFAULT_AGENT_ID } from "@/components/projects/asx/data/kanban-data";
import { useAsxAgentChatDemo } from "@/components/projects/asx/hooks/use-asx-agent-chat-demo";
import { useAsxKanbanLifecycle } from "@/components/projects/asx/hooks/use-kanban-lifecycle";
import { AsxRovoOverlay } from "./asx-rovo-overlay";

/**
 * The "Kanban" design pattern for the Agent Sessions Experience gallery.
 *
 * Reuses the real `components/blocks/jira-kanban` board verbatim (same sample
 * columns + agents as the block's own demo), shown read-only in the gallery
 * stage when the Kanban card is selected.
 *
 * Layout intent: the Gallery viewport is the container. The board breaks out of
 * the stage's centered `max-w-3xl` column to span the full viewport width
 * (`left-1/2 -translate-x-1/2 w-screen`) and fills the available stage height.
 * The pinned dock floats over the board's lower portion via its backdrop blur
 * (the gallery's "content flows under the dock" effect). Columns flow to fill
 * the width and scroll their own cards.
 *
 * The arbitrary variants complete the board's flex-column height chain (its
 * shared root is only `flex-1 min-h-0`, so its inner section would otherwise
 * grow to content height) — scoped here so the /jira board and the block demo
 * keep their existing behavior.
 */
export function KanbanStage(): React.ReactElement {
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useAsxAgentChatDemo();
	const openCardChat = useCallback((agentId: string, agentName: string, card: JiraKanbanCardData, request?: string) => {
		openAgentChat({
			agentId,
			agentName,
			issueKey: card.code,
			issueSummary: card.title,
			request,
		});
	}, [openAgentChat]);
	const handleNonAgentAction = useCallback((request: JiraIssueGenerativeActionRequest, card: JiraKanbanCardData) => {
		openCardChat(
			ASX_KANBAN_DEFAULT_AGENT_ID,
			"RFP Drafter",
			card,
			request.prompt,
		);
	}, [openCardChat]);
	const {
		boardColumns,
		draggedCardCode,
		handleCardDragEnd,
		handleCardDragStart,
		handleCardDrop,
		handleCardSelect,
		handleGenerativeActionSubmit,
		handleQuestionSubmit,
		selectedCardCodes,
	} = useAsxKanbanLifecycle({ onNonAgentAction: handleNonAgentAction });
	const handleViewChat = useCallback((activity: JiraIssueAgentActivity, card: JiraKanbanCardData) => {
		openCardChat(activity.id, activity.name, card);
	}, [openCardChat]);

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 flex-col px-8 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col [&>div>section]:flex [&>div>section]:min-h-0">
			<JiraKanban
				agents={ASX_KANBAN_AGENTS}
				ariaLabel="RFP board columns. Assign agents or drag Intake cards into Drafting to start work."
				boardColumns={boardColumns}
				draggedCardCode={draggedCardCode}
				onCardAgentActivityQuestionSubmit={handleQuestionSubmit}
				onCardAgentActivityViewChat={handleViewChat}
				onCardDragEnd={handleCardDragEnd}
				onCardDragStart={handleCardDragStart}
				onCardDrop={handleCardDrop}
				onCardGenerativeActionSubmit={handleGenerativeActionSubmit}
				onCardSelect={handleCardSelect}
				paddingTop={0}
				selectedCardCodes={selectedCardCodes}
			/>
			<AsxRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
			/>
		</div>
	);
}
