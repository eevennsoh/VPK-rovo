"use client";

import { useAgentSessions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";

import { ActivityAgentEvent } from "./activity-agent-event";
import { ActivityHumanEvent } from "./activity-human-event";

/**
 * Chronological Activity feed. Reads the derived, time-sorted `activityEvents` from
 * the foundation and switches on `event.kind`: human comments render as comment rows,
 * agent events as compact inline blocks that open the full session on click.
 */
export function ActivityEventList() {
	const { meta, actions } = useAgentSessions();
	const events = meta.activityEvents;

	if (events.length === 0) {
		return <p className="px-1 text-sm text-text-subtlest">No activity yet.</p>;
	}

	return (
		<ol className="flex flex-col gap-3">
			{events.map((event) => (
				<li key={event.id}>
					{event.kind === "human" ? (
						<ActivityHumanEvent event={event} />
					) : (
						<ActivityAgentEvent event={event} onOpenSession={actions.openSession} />
					)}
				</li>
			))}
		</ol>
	);
}
