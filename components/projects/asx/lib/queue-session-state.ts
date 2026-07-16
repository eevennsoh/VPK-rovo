import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type {
	AsxQueueJiraColumn,
	AsxQueueLayoutMode,
	AsxQueueSession,
	AsxQueueSessionStatus,
	AsxQueueSortMode,
} from "../data/queue-sessions";

const UNFINISHED_SESSION_STATUSES = new Set<AsxQueueSessionStatus>([
	"awaiting-input",
	"running",
	"pr-open",
]);

export interface QueueSessionNavigationOptions {
	layoutMode: AsxQueueLayoutMode;
	sortMode: AsxQueueSortMode;
}

export interface QueueSessionNavigation {
	bySpace: Record<string, AsxQueueSession[]>;
	pinned: AsxQueueSession[];
	unpinned: AsxQueueSession[];
}

export interface ArchiveQueueSessionResult {
	activeSessionId: string;
	sessions: AsxQueueSession[];
}

function cloneQueueSession(session: AsxQueueSession): AsxQueueSession {
	return {
		...session,
		fileChanges: session.fileChanges
			? {
				...session.fileChanges,
				files: [...session.fileChanges.files],
			}
			: undefined,
		messages: session.messages.map((message) => ({
			...message,
			parts: message.parts.map((part) => ({ ...part })),
		})),
		question: session.question
			? {
				...session.question,
				questions: session.question.questions.map((question) => ({
					...question,
					options: question.options.map((option) => ({ ...option })),
				})),
			}
			: undefined,
	};
}

function updateQueueSession(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
	update: (session: AsxQueueSession) => AsxQueueSession,
): AsxQueueSession[] {
	return sessions.map((session) => session.id === sessionId ? update(session) : session);
}

export function createInitialQueueSessions(seeds: readonly AsxQueueSession[]): AsxQueueSession[] {
	return seeds.map(cloneQueueSession);
}

export function getUnfinishedQueueSessions(sessions: readonly AsxQueueSession[]): AsxQueueSession[] {
	return sessions.filter((session) => UNFINISHED_SESSION_STATUSES.has(session.status));
}

export function groupQueueSessionsBySpace(
	sessions: readonly AsxQueueSession[],
): Record<string, AsxQueueSession[]> {
	return sessions.reduce<Record<string, AsxQueueSession[]>>((groups, session) => {
		groups[session.spaceId] = [...(groups[session.spaceId] ?? []), session];
		return groups;
	}, {});
}

export function appendQueueSessionUserMessage(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
	message: RovoUIMessage,
): AsxQueueSession[] {
	return updateQueueSession(sessions, sessionId, (session) => ({
		...session,
		messages: [...session.messages, message],
		question: undefined,
		status: "running",
	}));
}

export function stopQueueSession(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
): AsxQueueSession[] {
	return updateQueueSession(sessions, sessionId, (session) => ({
		...session,
		status: "stopped",
	}));
}

export function archiveQueueSession(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
	activeSessionId: string,
): ArchiveQueueSessionResult {
	const removedIndex = sessions.findIndex((session) => session.id === sessionId);
	if (removedIndex === -1) {
		return {
			activeSessionId,
			sessions: [...sessions],
		};
	}

	const remainingSessions = sessions.filter((session) => session.id !== sessionId);
	if (activeSessionId !== sessionId) {
		return {
			activeSessionId,
			sessions: remainingSessions,
		};
	}

	return {
		activeSessionId: remainingSessions[removedIndex]?.id
			?? remainingSessions[removedIndex - 1]?.id
			?? "",
		sessions: remainingSessions,
	};
}

export function setQueueSessionPinned(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
	isPinned: boolean,
): AsxQueueSession[] {
	return updateQueueSession(sessions, sessionId, (session) => ({
		...session,
		isPinned,
	}));
}

export function dismissQueueSessionFileChanges(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
): AsxQueueSession[] {
	return updateQueueSession(sessions, sessionId, (session) => session.fileChanges
		? {
			...session,
			fileChanges: {
				...session.fileChanges,
				isDismissed: true,
			},
		}
		: session);
}

export function setQueueSessionJiraColumn(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
	jiraColumn: AsxQueueJiraColumn,
): AsxQueueSession[] {
	return updateQueueSession(sessions, sessionId, (session) => ({
		...session,
		jiraColumn,
	}));
}

export function sortQueueSessions(
	sessions: readonly AsxQueueSession[],
	sortMode: AsxQueueSortMode,
): AsxQueueSession[] {
	const rankKey = sortMode === "priority"
		? "priorityRank"
		: sortMode === "last-updated"
			? "updatedRank"
			: "manualRank";

	return [...sessions].sort((left, right) => {
		const rankDifference = left[rankKey] - right[rankKey];
		return rankDifference || left.manualRank - right.manualRank;
	});
}

export function reorderQueueSessions(
	sessions: readonly AsxQueueSession[],
	activeSessionId: string,
	overSessionId: string,
	layoutMode: AsxQueueLayoutMode,
): AsxQueueSession[] {
	if (activeSessionId === overSessionId) return [...sessions];

	const manuallyOrdered = sortQueueSessions(sessions, "manual");
	const activeSession = manuallyOrdered.find((session) => session.id === activeSessionId);
	const overSession = manuallyOrdered.find((session) => session.id === overSessionId);
	if (!activeSession || !overSession || activeSession.isPinned !== overSession.isPinned) {
		return [...sessions];
	}
	if (layoutMode === "by-project" && activeSession.spaceId !== overSession.spaceId) {
		return [...sessions];
	}

	const reorderableSessions = manuallyOrdered.filter((session) => (
		session.isPinned === activeSession.isPinned
		&& (layoutMode === "one-list" || session.spaceId === activeSession.spaceId)
	));
	const activeIndex = reorderableSessions.findIndex((session) => session.id === activeSessionId);
	const overIndex = reorderableSessions.findIndex((session) => session.id === overSessionId);
	if (activeIndex === -1 || overIndex === -1) return [...sessions];

	const nextOrder = [...reorderableSessions];
	const [movedSession] = nextOrder.splice(activeIndex, 1);
	if (!movedSession) return [...sessions];
	nextOrder.splice(overIndex, 0, movedSession);

	const availableRanks = reorderableSessions.map((session) => session.manualRank);
	const nextRankById = new Map(nextOrder.map((session, index) => (
		[session.id, availableRanks[index]]
	)));

	return sessions.map((session) => {
		const manualRank = nextRankById.get(session.id);
		return manualRank === undefined ? session : { ...session, manualRank };
	});
}

export function getQueueSessionNavigation(
	sessions: readonly AsxQueueSession[],
	options: QueueSessionNavigationOptions,
): QueueSessionNavigation {
	const sortedSessions = sortQueueSessions(sessions, options.sortMode);
	const pinned = sortedSessions.filter((session) => session.isPinned);
	const unpinned = sortedSessions.filter((session) => !session.isPinned);

	return {
		bySpace: options.layoutMode === "by-project"
			? groupQueueSessionsBySpace(unpinned)
			: {},
		pinned,
		unpinned,
	};
}
