import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { AsxQueueSession } from "../data/queue-sessions";

const UNFINISHED_SESSION_STATUSES = new Set(["queued", "running", "needs-input"]);

export function createInitialQueueSessions(seeds: readonly AsxQueueSession[]): AsxQueueSession[] {
	return seeds.map((session) => ({
		...session,
		messages: session.messages.map((message) => ({
			...message,
			parts: [...message.parts],
		})),
	}));
}

export function getUnfinishedQueueSessions(sessions: readonly AsxQueueSession[]): AsxQueueSession[] {
	return sessions.filter((session) => UNFINISHED_SESSION_STATUSES.has(session.status));
}

export function groupQueueSessionsBySpace(
	sessions: readonly AsxQueueSession[],
): Record<string, AsxQueueSession[]> {
	const groups: Record<string, AsxQueueSession[]> = {};

	for (const session of getUnfinishedQueueSessions(sessions)) {
		const spaceSessions = groups[session.spaceId] ?? [];
		spaceSessions.push(session);
		groups[session.spaceId] = spaceSessions;
	}

	return groups;
}

export function appendQueueSessionUserMessage(
	sessions: readonly AsxQueueSession[],
	sessionId: string,
	message: RovoUIMessage,
): AsxQueueSession[] {
	return sessions.map((session) => {
		if (session.id !== sessionId) return session;

		return {
			...session,
			messages: [...session.messages, message],
			status: "running",
		};
	});
}
