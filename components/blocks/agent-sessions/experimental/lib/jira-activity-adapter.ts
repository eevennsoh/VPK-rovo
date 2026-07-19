import {
	formatSessionTimestamp,
	type ActivityEvent,
	type AgentActivityEvent,
	type AgentSessionStatus,
	type HumanActivityEvent,
} from "@/components/blocks/agent-sessions/data/session-state";
import type {
	JiraActivityActor,
	JiraActivityCommentEntry,
	JiraActivityEntry,
} from "@/components/blocks/jira-activity";

export const AGENT_SESSIONS_CURRENT_USER: JiraActivityActor = {
	id: "agent-sessions-current-user",
	name: "You",
	kind: "person",
};

const AGENT_STATUS_TAG = {
	running: { text: "Working", color: "blue" },
	waiting: { text: "Waiting for you", color: "yellow" },
	completed: { text: "Done", color: "green" },
} as const satisfies Record<AgentSessionStatus, NonNullable<JiraActivityCommentEntry["tag"]>>;

function actorIdFromName(name: string): string {
	const normalizedName = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-|-$/gu, "");
	return `agent-sessions-person-${normalizedName || "unknown"}`;
}

function humanActor(event: Readonly<HumanActivityEvent>): JiraActivityActor {
	if (event.author.name === AGENT_SESSIONS_CURRENT_USER.name) {
		return event.author.avatarUrl
			? { ...AGENT_SESSIONS_CURRENT_USER, avatarSrc: event.author.avatarUrl }
			: AGENT_SESSIONS_CURRENT_USER;
	}

	return {
		id: actorIdFromName(event.author.name),
		name: event.author.name,
		kind: "person",
		...(event.author.avatarUrl ? { avatarSrc: event.author.avatarUrl } : {}),
	};
}

function mapHumanEvent(event: Readonly<HumanActivityEvent>): JiraActivityCommentEntry {
	return {
		id: event.id,
		kind: "comment",
		actor: humanActor(event),
		timestamp: formatSessionTimestamp(event.createdAtMs),
		body: [{ type: "text", text: event.content }],
		allowReply: false,
	};
}

function mapAgentEvent(event: Readonly<AgentActivityEvent>): JiraActivityCommentEntry {
	return {
		id: event.id,
		kind: "comment",
		actor: {
			id: `agent-sessions-agent-${event.agentId}`,
			name: event.agentName,
			kind: "agent",
			...(event.agentAvatarSrc ? { avatarSrc: event.agentAvatarSrc } : {}),
		},
		timestamp: formatSessionTimestamp(event.createdAtMs),
		tag: AGENT_STATUS_TAG[event.status],
		body: event.responsePreview ? [{ type: "text", text: event.responsePreview }] : [],
		collapsible: {
			label: "Prompt",
			content: [{ type: "text", text: event.commandPreview }],
		},
		allowReply: false,
	};
}

/** Convert the already-chronological Agent Sessions activity stream for Jira Activity. */
export function mapActivityEventsToJiraEntries(events: readonly ActivityEvent[]): JiraActivityEntry[] {
	return events.map((event) => (event.kind === "human" ? mapHumanEvent(event) : mapAgentEvent(event)));
}
