"use client";

import { useCallback, useMemo, useState } from "react";
import { useRovoChat } from "@/app/contexts";
import ChatPanel, {
	type ChatPanelHistoryController,
} from "@/components/projects/sidebar-chat/page";
import {
	ASX_QUEUE_SESSION_SEEDS,
	createAsxQueueHistoryThreads,
	type AsxQueueSession,
} from "../data/queue-sessions";

function ignoreThreadRun(): Promise<void> {
	return Promise.resolve();
}

/**
 * The "Rovo" design pattern for the Agent Sessions Experience gallery.
 *
 * Reuses the `components/projects/sidebar-chat` project verbatim — the same
 * `ChatPanel` (with smart widgets + sidebar smart generation) that the
 * standalone `/sidebar-chat` demo renders — shown as a bounded sidebar panel
 * in the gallery stage when the Rovo card is selected.
 *
 * Layout intent: the sidebar chat is a narrow, bounded panel. The gallery runs
 * this stage with the default `stagePosition="top"` (shared by the board/list/
 * terminal stages), so centering is done here. The pinned dock is treated as a
 * pure overlay — we do NOT reserve its footprint — so the panel is vertically
 * (and horizontally) centered within the full stage height as if the dock were
 * absent, with the dock's backdrop blur floating over the panel's lower edge.
 * Its 400px width and 800px height cap match the standalone sidebar-chat demo;
 * `h-full` lets it shrink on short viewports. `ChatPanel` carries its own
 * raised surface + border + radius (see the sidebar-chat
 * `chatStyles.chatPanel`), so no extra chrome is needed here.
 *
 * The chat runs on the ASX-wide `RovoChatProvider` (see `../page.tsx`); the
 * gallery resets it when the Rovo card is entered so the panel opens at its
 * greeting instead of inheriting the Kanban demo's conversation.
 */
export function RovoStage(): React.ReactElement {
	const {
		replaceMessages,
		resetAgentToRovo,
		resetChat,
		selectAgent,
	} = useRovoChat();
	const [historySessions, setHistorySessions] = useState<AsxQueueSession[]>(() => (
		ASX_QUEUE_SESSION_SEEDS.map((session) => ({ ...session }))
	));
	const [activeHistorySessionId, setActiveHistorySessionId] = useState<string | null>(null);
	const historyThreads = useMemo(
		() => createAsxQueueHistoryThreads(historySessions),
		[historySessions],
	);

	const handleNewChat = useCallback(() => {
		setActiveHistorySessionId(null);
		resetAgentToRovo({ preserveCurrentThread: true });
		resetChat();
	}, [resetAgentToRovo, resetChat]);
	const handleSelectThread = useCallback((threadId: string) => {
		const session = historySessions.find((item) => item.id === threadId);
		const thread = historyThreads.find((item) => item.id === threadId);
		if (!session || !thread) return Promise.resolve();

		resetChat();
		selectAgent(session.agentId, { preserveCurrentThread: true });
		replaceMessages(thread.messages);
		setActiveHistorySessionId(threadId);
		return Promise.resolve();
	}, [historySessions, historyThreads, replaceMessages, resetChat, selectAgent]);
	const handleDeleteThread = useCallback((threadId: string) => {
		setHistorySessions((sessions) => sessions.filter((session) => session.id !== threadId));
		if (activeHistorySessionId === threadId) handleNewChat();
		return Promise.resolve();
	}, [activeHistorySessionId, handleNewChat]);
	const chatHistory = useMemo<ChatPanelHistoryController>(() => ({
		activeThreadId: activeHistorySessionId,
		cancelThreadRun: ignoreThreadRun,
		deleteThread: handleDeleteThread,
		onNewChat: handleNewChat,
		selectThread: handleSelectThread,
		threads: historyThreads,
		threadsLoaded: true,
	}), [
		activeHistorySessionId,
		handleDeleteThread,
		handleNewChat,
		handleSelectThread,
		historyThreads,
	]);

	return (
		<div className="flex h-full min-h-0 w-full items-center justify-center">
			<div className="h-full max-h-[800px] min-h-0 w-[400px]">
				<ChatPanel
					chatHistory={chatHistory}
					onClose={() => {}}
					enableSmartWidgets
					sendPromptOptions={{
						smartGeneration: {
							enabled: true,
							surface: "sidebar",
						},
					}}
				/>
			</div>
		</div>
	);
}
