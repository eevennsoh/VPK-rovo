import {
	formatSessionTimestamp,
	type ActivityEvent,
	type AgentActivityEvent,
	type AgentSessionStatus,
	type HumanActivityEvent,
	type StaticChangedFilesActivityEvent,
	type StaticEventActivityEvent,
	type StaticTimelineActor,
} from "@/components/blocks/jira-work-item/data/session-state";
import type {
	JiraActivityActor,
	JiraActivityChangedFilesEntry,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityEventEntry,
} from "@/components/blocks/jira-activity";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";

export const JIRA_WORK_ITEM_CURRENT_USER: JiraActivityActor = {
	id: "jira-work-item-current-user",
	name: "You",
	kind: "person",
};

const AGENT_STATUS_TAG = {
	running: { text: "Working", color: "blue" },
	waiting: { text: "Waiting for you", color: "yellow" },
	completed: { text: "Done", color: "green" },
} as const satisfies Record<AgentSessionStatus, NonNullable<JiraActivityCommentEntry["tag"]>>;

const AGENT_SESSION_STATE = {
	running: "running",
	waiting: "needs-input",
	completed: "complete",
} as const;

function actorIdFromName(name: string): string {
	const normalizedName = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-|-$/gu, "");
	return `jira-work-item-person-${normalizedName || "unknown"}`;
}

function humanAuthorActor(author: Readonly<HumanActivityEvent["author"]>): JiraActivityActor {
	if (author.name === JIRA_WORK_ITEM_CURRENT_USER.name) {
		return author.avatarUrl
			? { ...JIRA_WORK_ITEM_CURRENT_USER, avatarSrc: author.avatarUrl }
			: JIRA_WORK_ITEM_CURRENT_USER;
	}

	return {
		id: actorIdFromName(author.name),
		name: author.name,
		kind: "person",
		...(author.avatarUrl ? { avatarSrc: author.avatarUrl } : {}),
	};
}

function humanActor(event: Readonly<HumanActivityEvent>): JiraActivityActor {
	return humanAuthorActor(event.author);
}

function mapHumanEvent(event: Readonly<HumanActivityEvent>): JiraActivityCommentEntry {
	return {
		id: event.id,
		kind: "comment",
		actor: humanActor(event),
		timestamp: formatSessionTimestamp(event.createdAtMs),
		body: [{ type: "text", text: event.content }],
		...(event.threadReplies
			? {
				replies: event.threadReplies.map((reply) => ({
					id: reply.id,
					actor: humanAuthorActor({
						name: reply.authorName,
						avatarUrl: reply.authorAvatarSrc,
					}),
					timestamp: formatSessionTimestamp(reply.createdAtMs),
					body: reply.content,
				})),
			}
			: {}),
		// Human comments opt in to Reply. The flag was previously false only to
		// suppress the always-mounted composer under every human comment; now that
		// Reply-to-reveal is the default, the affordance costs nothing until used.
		allowReply: true,
	};
}

function mapAgentEvent(event: Readonly<AgentActivityEvent>): JiraActivityCommentEntry {
	const usesRovoLogo = event.agentId.startsWith("skill:");
	const avatarSrc = usesRovoLogo
		? undefined
		: event.agentAvatarSrc ?? getDeterministicAgentAvatarSrc(event.agentId);

	return {
		id: event.id,
		kind: "comment",
		actor: {
			id: `jira-work-item-agent-${event.agentId}`,
			name: event.agentName,
			kind: "agent",
			...(usesRovoLogo ? { vpkLogo: "rovo" as const } : { avatarSrc }),
		},
		timestamp: formatSessionTimestamp(event.createdAtMs),
		tag: AGENT_STATUS_TAG[event.status],
		body: event.responsePreview ? [{ type: "text", text: event.responsePreview }] : [],
		collapsible: {
			label: "Prompt",
			content: [{ type: "text", text: event.commandPreview }],
		},
		allowReply: event.status !== "completed",
		sessionItem: {
			id: event.sessionId,
			title: event.title,
			state: AGENT_SESSION_STATE[event.status],
			agent: {
				name: event.agentName,
				...(usesRovoLogo ? { vpkLogo: "rovo" as const } : { avatarSrc }),
			},
			branch: event.branch,
			elapsedSeconds: event.elapsedSeconds,
		},
	};
}

function staticActor(actor: Readonly<StaticTimelineActor>): JiraActivityActor {
	return {
		id: actor.id,
		name: actor.name,
		kind: actor.kind,
		...(actor.avatarSrc ? { avatarSrc: actor.avatarSrc } : {}),
		...(actor.brandName ? { brandName: actor.brandName as ThirdPartyLogoName } : {}),
	};
}

function mapStaticEvent(event: Readonly<StaticEventActivityEvent>): JiraActivityEventEntry {
	return {
		id: event.id,
		kind: "event",
		actor: staticActor(event.actor),
		timestamp: formatSessionTimestamp(event.createdAtMs),
		...(event.icon ? { icon: event.icon } : {}),
		segments: event.segments,
		...(event.pullRequest ? { pullRequest: event.pullRequest } : {}),
	};
}

function mapStaticChangedFiles(event: Readonly<StaticChangedFilesActivityEvent>): JiraActivityChangedFilesEntry {
	return {
		id: event.id,
		kind: "changed-files",
		actor: staticActor(event.actor),
		timestamp: formatSessionTimestamp(event.createdAtMs),
		summary: event.summary,
		description: event.description,
		...(event.branch ? { branch: event.branch } : {}),
		...(event.tag ? { tag: event.tag } : {}),
		...(event.sessionItem ? { sessionItem: event.sessionItem } : {}),
		...(event.outputs ? { outputs: event.outputs } : {}),
	};
}

/** Convert the already-chronological Jira Work Item activity stream for Jira Activity. */
export function mapActivityEventsToJiraEntries(events: readonly ActivityEvent[]): JiraActivityEntry[] {
	return events.map((event) => {
		switch (event.kind) {
			case "human":
				return mapHumanEvent(event);
			case "agent":
				return mapAgentEvent(event);
			case "event":
				return mapStaticEvent(event);
			case "changed-files":
				return mapStaticChangedFiles(event);
		}
	});
}
