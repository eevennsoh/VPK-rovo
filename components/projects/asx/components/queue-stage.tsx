"use client";

import { useCallback, useMemo, useState } from "react";
import type { FileUIPart } from "ai";
import { JiraSidebar } from "@/components/blocks/product-sidebar/variants/jira";
import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import type { QuestionCardAnswers } from "@/components/blocks/question-card/types";
import AppLayout from "@/components/projects/page";
import { createRovoAppUserMessage } from "@/components/projects/rovo-core/lib/rovo-app-user-message";
import { createId } from "@/lib/utils";
import {
	ASX_QUEUE_SESSION_SEEDS,
	ASX_QUEUE_SPACES,
	createAsxQueueSidebarSessionItem,
	getAsxQueueAgent,
	type AsxQueueJiraColumn,
	type AsxQueueLayoutMode,
	type AsxQueueSortMode,
} from "../data/queue-sessions";
import {
	appendQueueSessionUserMessage,
	archiveQueueSession,
	createInitialQueueSessions,
	dismissQueueSessionFileChanges,
	groupQueueSessionsBySpace,
	reorderQueueSessions,
	setQueueSessionJiraColumn,
	setQueueSessionPinned,
	sortQueueSessions,
	stopQueueSession,
} from "../lib/queue-session-state";
import { QueueConversationWorkspace } from "./queue-conversation-workspace";

export function QueueStage(): React.ReactElement {
	const [sessions, setSessions] = useState(() => createInitialQueueSessions(ASX_QUEUE_SESSION_SEEDS));
	const [activeSessionId, setActiveSessionId] = useState(ASX_QUEUE_SESSION_SEEDS[0]?.id ?? "");
	const [selectedItem, setSelectedItem] = useState(ASX_QUEUE_SPACES[0]?.name ?? "");
	const [layoutMode, setLayoutMode] = useState<AsxQueueLayoutMode>("by-project");
	const [sortMode, setSortMode] = useState<AsxQueueSortMode>("manual");
	const orderedSessions = useMemo(() => sortQueueSessions(sessions, sortMode), [sessions, sortMode]);
	const groupedSessions = useMemo(() => groupQueueSessionsBySpace(orderedSessions), [orderedSessions]);
	const orderedSidebarSessions = useMemo(
		() => orderedSessions.map(createAsxQueueSidebarSessionItem),
		[orderedSessions],
	);
	const pinnedSessionIds = useMemo(
		() => new Set(sessions.filter((session) => session.isPinned).map((session) => session.id)),
		[sessions],
	);
	const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
	const activeSpace = ASX_QUEUE_SPACES.find((space) => space.id === activeSession?.spaceId) ?? ASX_QUEUE_SPACES[0];
	const activeAgent = activeSession ? getAsxQueueAgent(activeSession.agentId) : null;
	const sessionsBySpaceId = useMemo<Record<string, JiraSidebarSessionItem[]>>(() => {
		return Object.fromEntries(
			Object.entries(groupedSessions).map(([spaceId, spaceSessions]) => [
				spaceId,
				spaceSessions.map(createAsxQueueSidebarSessionItem),
			]),
		);
	}, [groupedSessions]);

	const handleSelectSession = useCallback((sessionId: string) => {
		const session = sessions.find((candidate) => candidate.id === sessionId);
		const space = ASX_QUEUE_SPACES.find((candidate) => candidate.id === session?.spaceId);
		setActiveSessionId(sessionId);
		if (space) setSelectedItem(space.name);
	}, [sessions]);
	const appendUserMessage = useCallback((text: string, files: FileUIPart[] = []) => {
		const trimmedText = text.trim();
		if (!trimmedText && files.length === 0) return;
		const message = createRovoAppUserMessage({
			createdAt: new Date().toISOString(),
			files,
			id: createId("asx-queue-user"),
			text: trimmedText,
		});
		setSessions((current) => appendQueueSessionUserMessage(current, activeSessionId, message));
	}, [activeSessionId]);

	const handleSubmit = useCallback(async ({ files, text }: { files: FileUIPart[]; text: string }) => {
		appendUserMessage(text, files);
	}, [appendUserMessage]);
	const handleAnswerQuestion = useCallback((answers: QuestionCardAnswers) => {
		const questions = activeSession?.question?.questions ?? [];
		const answer = Object.entries(answers)
			.flatMap(([questionId, value]) => {
				const question = questions.find((candidate) => candidate.id === questionId);
				const values = Array.isArray(value) ? value : [value];
				return values.map((selectedValue) => (
					question?.options.find((option) => option.id === selectedValue)?.label ?? selectedValue
				));
			})
			.map((value) => value.trim())
			.filter(Boolean)
			.join(", ");
		appendUserMessage(answer);
	}, [activeSession?.question?.questions, appendUserMessage]);
	const handleTogglePinSession = useCallback((sessionId: string) => {
		setSessions((current) => {
			const session = current.find((candidate) => candidate.id === sessionId);
			return session ? setQueueSessionPinned(current, sessionId, !session.isPinned) : [...current];
		});
	}, []);
	const handleStopSession = useCallback((sessionId: string) => {
		setSessions((current) => stopQueueSession(current, sessionId));
	}, []);
	const handleArchiveSession = useCallback((sessionId: string) => {
		const result = archiveQueueSession(sessions, sessionId, activeSessionId);
		setSessions(result.sessions);
		setActiveSessionId(result.activeSessionId);
		const nextSession = result.sessions.find((session) => session.id === result.activeSessionId);
		const nextSpace = ASX_QUEUE_SPACES.find((space) => space.id === nextSession?.spaceId);
		if (nextSpace) setSelectedItem(nextSpace.name);
	}, [activeSessionId, sessions]);
	const handleDismissFileChanges = useCallback(() => {
		setSessions((current) => dismissQueueSessionFileChanges(current, activeSessionId));
	}, [activeSessionId]);
	const handleJiraColumnChange = useCallback((jiraColumn: AsxQueueJiraColumn) => {
		setSessions((current) => setQueueSessionJiraColumn(current, activeSessionId, jiraColumn));
	}, [activeSessionId]);
	const handleReorderSession = useCallback((activeId: string, overId: string) => {
		setSessions((current) => reorderQueueSessions(current, activeId, overId, layoutMode));
	}, [layoutMode]);

	if (!activeSession || !activeSpace || !activeAgent) return <div />;

	return (
		<div
			className="relative left-1/2 h-full min-h-0 w-screen -translate-x-1/2 overflow-hidden isolate"
			data-testid="asx-queue-stage"
		>
			<AppLayout
				product="jira"
				hideRovoAction
				shellHeight="parent"
				topNavigationSearchAlignment="sidebar"
				sidebarContent={(
					<JiraSidebar
						onSelectItem={setSelectedItem}
						selectedItem={selectedItem}
						sessionNavigation={{
							activeSessionId,
							layoutMode,
							onArchiveSession: handleArchiveSession,
							onLayoutModeChange: setLayoutMode,
							onReorderSession: handleReorderSession,
							onSelectSession: handleSelectSession,
							onSortModeChange: setSortMode,
							onStopSession: handleStopSession,
							onTogglePinSession: handleTogglePinSession,
							orderedSessions: orderedSidebarSessions,
							pinnedSessionIds,
							sessionsBySpaceId,
							sortMode,
						}}
					/>
				)}
			>
				<QueueConversationWorkspace
					agent={activeAgent}
					key={activeSession.id}
					onAnswerQuestion={handleAnswerQuestion}
					onDismissFileChanges={handleDismissFileChanges}
					onJiraColumnChange={handleJiraColumnChange}
					onSubmit={handleSubmit}
					session={activeSession}
				/>
			</AppLayout>
		</div>
	);
}
