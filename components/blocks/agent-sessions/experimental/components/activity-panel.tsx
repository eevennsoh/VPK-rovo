"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";

import { JiraActivity } from "@/components/blocks/jira-activity";
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
	const { state, meta, actions } = useAgentSessions();
	const activityRootRef = useRef<HTMLDivElement>(null);
	const lastScrolledSessionIdRef = useRef<string | null>(null);
	const shouldReduceMotion = Boolean(useReducedMotion());
	const latestSessionId = state.sessions.at(-1)?.id ?? null;
	const entries = useMemo(() => mapActivityEventsToJiraEntries(meta.activityEvents), [meta.activityEvents]);

	useEffect(() => {
		if (!latestSessionId?.startsWith("session-") || lastScrolledSessionIdRef.current === latestSessionId) {
			return undefined;
		}

		const animationFrame = requestAnimationFrame(() => {
			const activityEntryId = `activity-${latestSessionId}`;
			const target = Array.from(
				activityRootRef.current?.querySelectorAll<HTMLElement>("[data-jira-activity-entry-id]") ?? [],
			).find((entry) => entry.dataset.jiraActivityEntryId === activityEntryId);
			if (!target) {
				return;
			}

			lastScrolledSessionIdRef.current = latestSessionId;
			target.scrollIntoView({
				behavior: shouldReduceMotion ? "auto" : "smooth",
				block: "nearest",
			});
		});

		return () => cancelAnimationFrame(animationFrame);
	}, [latestSessionId, shouldReduceMotion]);

	return (
		<div ref={activityRootRef} data-agent-sessions-activity>
			<JiraActivity
				composer={null}
				currentUser={AGENT_SESSIONS_CURRENT_USER}
				entries={entries}
				onSubmitReply={(entry, body) => {
					const event = meta.activityEvents.find((activityEvent) => activityEvent.id === entry.id);
					if (event?.kind === "agent") {
						actions.replySession(event.sessionId, body);
					}
				}}
				onViewSession={(item) => actions.openSession(item.id)}
			/>
		</div>
	);
}
