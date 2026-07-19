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
