import { useEffect, useState } from "react";

import type { PulseAgentSession } from "@/components/blocks/jira-kanban/experimental/pulse/types";

import {
	getJiraGoldenJourneysV4SyncDelayMs,
	JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS,
	takeJiraGoldenJourneysV4SyncBatch,
} from "../data/agent-session-sync";

interface JiraGoldenJourneysV4AgentSessionSyncState {
	newAgentSessionIds: ReadonlySet<string>;
	nextIndex: number;
	syncedAgentSessions: readonly PulseAgentSession[];
}

function createInitialSyncState(): JiraGoldenJourneysV4AgentSessionSyncState {
	return {
		newAgentSessionIds: new Set(),
		nextIndex: 0,
		syncedAgentSessions: [],
	};
}

export function useJiraGoldenJourneysV4AgentSessionSync(): Readonly<{
	newAgentSessionIds: ReadonlySet<string>;
	syncedAgentSessions: readonly PulseAgentSession[];
}> {
	const [syncState, setSyncState] = useState(createInitialSyncState);

	useEffect(() => {
		if (syncState.nextIndex >= JIRA_GOLDEN_JOURNEYS_V4_SYNC_SESSIONS.length) {
			return undefined;
		}

		let timeoutId: number | undefined;
		const clearPendingSync = () => {
			if (timeoutId === undefined) {
				return;
			}
			window.clearTimeout(timeoutId);
			timeoutId = undefined;
		};
		const scheduleNextSync = () => {
			if (timeoutId !== undefined || document.visibilityState !== "visible") {
				return;
			}

			timeoutId = window.setTimeout(() => {
				timeoutId = undefined;
				const batch = takeJiraGoldenJourneysV4SyncBatch(syncState.nextIndex);
				const newAgentSessionIds = new Set(syncState.newAgentSessionIds);
				for (const session of batch.sessions) {
					newAgentSessionIds.add(session.id);
				}

				setSyncState({
					newAgentSessionIds,
					nextIndex: batch.nextIndex,
					syncedAgentSessions: [
						...batch.sessions,
						...syncState.syncedAgentSessions,
					],
				});
			}, getJiraGoldenJourneysV4SyncDelayMs());
		};
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				scheduleNextSync();
				return;
			}
			clearPendingSync();
		};

		scheduleNextSync();
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			clearPendingSync();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [syncState]);

	return {
		newAgentSessionIds: syncState.newAgentSessionIds,
		syncedAgentSessions: syncState.syncedAgentSessions,
	};
}
