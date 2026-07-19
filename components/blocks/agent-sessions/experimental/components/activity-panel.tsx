"use client";

import { useMemo } from "react";

import { JiraActivity } from "@/components/blocks/jira-activity";
import { Button } from "@/components/ui/button";
import { useAgentSessions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import {
	AGENT_SESSIONS_CURRENT_USER,
	mapActivityEventsToJiraEntries,
} from "@/components/blocks/agent-sessions/experimental/lib/jira-activity-adapter";

/**
 * True when the work item has at least one activity event to show. Callers use
 * this to omit the Activity slot entirely (heading + sort control + timeline)
 * so the content above reclaims the vertical space when there is nothing to sort.
 */
export function useHasActivity(): boolean {
	const { meta } = useAgentSessions();
	return meta.activityEvents.length > 0;
}

/**
 * Live Jira Activity timeline for the experimental Agent Sessions block. The
 * timeline's built-in composer is suppressed because the shared Agent Sessions
 * composer remains pinned by ExperimentalWorkItemLayout. Agent comment actions
 * open the corresponding floating session surface.
 */
export function ActivityPanel() {
	const { meta, actions } = useAgentSessions();
	const entries = useMemo(() => mapActivityEventsToJiraEntries(meta.activityEvents), [meta.activityEvents]);

	return (
		<JiraActivity
			composer={null}
			currentUser={AGENT_SESSIONS_CURRENT_USER}
			entries={entries}
			renderCommentAction={(entry) => {
				const event = meta.activityEvents.find((activityEvent) => activityEvent.id === entry.id);
				if (!event || event.kind !== "agent") return null;

				return (
					<Button onClick={() => actions.openSession(event.sessionId)} size="compact" type="button" variant="link">
						View session
					</Button>
				);
			}}
		/>
	);
}
