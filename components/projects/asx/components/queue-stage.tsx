"use client";

import { useCallback, useMemo, useState } from "react";
import type { FileUIPart } from "ai";
import { JiraSidebar } from "@/components/blocks/product-sidebar/variants/jira";
import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import AppLayout from "@/components/projects/page";
import { createRovoAppUserMessage } from "@/components/projects/rovo-core/lib/rovo-app-user-message";
import { createId } from "@/lib/utils";
import {
	ASX_QUEUE_SESSION_SEEDS,
	ASX_QUEUE_SPACES,
	getAsxQueueAgent,
} from "../data/queue-sessions";
import {
	appendQueueSessionUserMessage,
	createInitialQueueSessions,
	groupQueueSessionsBySpace,
} from "../lib/queue-session-state";
import { QueueConversationWorkspace } from "./queue-conversation-workspace";

export function QueueStage(): React.ReactElement {
	const [sessions, setSessions] = useState(() => createInitialQueueSessions(ASX_QUEUE_SESSION_SEEDS));
	const [activeSessionId, setActiveSessionId] = useState(ASX_QUEUE_SESSION_SEEDS[0]?.id ?? "");
	const [selectedItem, setSelectedItem] = useState(ASX_QUEUE_SPACES[0]?.name ?? "");
	const groupedSessions = useMemo(() => groupQueueSessionsBySpace(sessions), [sessions]);
	const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
	const activeSpace = ASX_QUEUE_SPACES.find((space) => space.id === activeSession?.spaceId) ?? ASX_QUEUE_SPACES[0];
	const activeAgent = activeSession ? getAsxQueueAgent(activeSession.agentId) : null;
	const sessionsBySpaceId = useMemo<Record<string, JiraSidebarSessionItem[]>>(() => {
		return Object.fromEntries(
			Object.entries(groupedSessions).map(([spaceId, spaceSessions]) => [
				spaceId,
				spaceSessions.map((session) => {
					const agent = getAsxQueueAgent(session.agentId);
					return {
						agentAvatarSrc: agent.avatarSrc,
						agentName: agent.name,
						id: session.id,
						status: session.status,
						title: session.title,
					};
				}),
			]),
		);
	}, [groupedSessions]);

	const handleSelectSession = useCallback((sessionId: string) => {
		const session = sessions.find((candidate) => candidate.id === sessionId);
		const space = ASX_QUEUE_SPACES.find((candidate) => candidate.id === session?.spaceId);
		setActiveSessionId(sessionId);
		if (space) setSelectedItem(space.name);
	}, [sessions]);

	const handleSubmit = useCallback(async ({ files, text }: { files: FileUIPart[]; text: string }) => {
		const trimmedText = text.trim();
		if (!trimmedText && files.length === 0) return;
		const createdAt = new Date().toISOString();
		const message = createRovoAppUserMessage({
			createdAt,
			files,
			id: createId("asx-queue-user"),
			text: trimmedText,
		});
		setSessions((current) => appendQueueSessionUserMessage(current, activeSessionId, message));
	}, [activeSessionId]);

	if (!activeSession || !activeSpace || !activeAgent) return <div />;

	return (
		<div
			className="relative left-1/2 -mt-20 -mb-80 h-dvh w-screen -translate-x-1/2 overflow-hidden isolate"
			data-testid="asx-queue-stage"
		>
			<AppLayout
				product="jira"
				hideRovoAction
				topNavigationSearchAlignment="sidebar"
				sidebarContent={(
					<JiraSidebar
						onSelectItem={setSelectedItem}
						selectedItem={selectedItem}
						sessionNavigation={{
							activeSessionId,
							onSelectSession: handleSelectSession,
							sessionsBySpaceId,
						}}
					/>
				)}
			>
				<QueueConversationWorkspace
					agent={activeAgent}
					onSubmit={handleSubmit}
					session={activeSession}
					spaceName={activeSpace.name}
				/>
			</AppLayout>
		</div>
	);
}
