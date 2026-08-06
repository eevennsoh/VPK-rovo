import {
	formatSessionTimestamp,
	getAgentActivityActorId,
	type ActivityEvent,
	type AgentActivityEvent,
	type AgentSessionThreadReply,
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

/**
 * Opt-in activity composition for a lead agent and its delegated sessions.
 * Sessions remain independent in the work-item model while Activity presents
 * the delegated agents as replies beneath one lead card.
 */
export interface ActivitySessionThreadConfig {
	parentSessionId: string;
	childSessionIds: readonly string[];
	visibleSessionIds: readonly string[];
}

export function composeActivitySessionThread(
	events: readonly ActivityEvent[],
	config?: Readonly<ActivitySessionThreadConfig>,
): ActivityEvent[] {
	if (!config) return [...events];

	const childSessionIds = new Set(config.childSessionIds);
	const visibleSessionIds = new Set(config.visibleSessionIds);
	const childReplies = events.flatMap((event): AgentSessionThreadReply[] => {
		if (
			event.kind !== "agent"
			|| !childSessionIds.has(event.sessionId)
			|| !visibleSessionIds.has(event.sessionId)
		) {
			return [];
		}

		return [
			{
				id: `${event.id}-thread-reply`,
				agentId: event.agentId,
				agentName: event.agentName,
				agentAvatarSrc: event.agentAvatarSrc,
				content: event.responsePreview ?? event.commandPreview,
				createdAtMs: event.createdAtMs,
			},
			...(event.threadReplies ?? []),
		];
	});

	return events.flatMap((event): ActivityEvent[] => {
		if (event.kind !== "agent") return [event];
		if (childSessionIds.has(event.sessionId)) return [];
		if (event.sessionId !== config.parentSessionId) return [event];
		if (!visibleSessionIds.has(event.sessionId)) return [];

		return [{
			...event,
			threadReplies: [...(event.threadReplies ?? []), ...childReplies]
				.sort((left, right) => left.createdAtMs - right.createdAtMs),
		}];
	});
}

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

function agentActor(agent: Readonly<{
	id: string;
	name: string;
	avatarSrc?: string;
}>): JiraActivityActor {
	const usesRovoLogo = agent.id.startsWith("skill:");
	const avatarSrc = usesRovoLogo
		? undefined
		: agent.avatarSrc ?? getDeterministicAgentAvatarSrc(agent.id);
	return {
		id: getAgentActivityActorId(agent.id),
		name: agent.name,
		kind: "agent",
		...(usesRovoLogo ? { vpkLogo: "rovo" as const } : { avatarSrc }),
	};
}

function mapHumanEvent(
	event: Readonly<HumanActivityEvent>,
	referenceTimeMs?: number,
): JiraActivityCommentEntry {
	return {
		id: event.id,
		kind: "comment",
		actor: humanActor(event),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		body: [{ type: "text", text: event.content }],
		...(event.reactions ? { reactions: event.reactions } : {}),
		...(event.threadReplies
			? {
				replies: event.threadReplies.map((reply) => ({
					id: reply.id,
					actor: humanAuthorActor({
						name: reply.authorName,
						avatarUrl: reply.authorAvatarSrc,
					}),
					timestamp: formatSessionTimestamp(reply.createdAtMs, referenceTimeMs),
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

function mapAgentEvent(
	event: Readonly<AgentActivityEvent>,
	referenceTimeMs?: number,
): JiraActivityCommentEntry {
	const usesRovoLogo = event.agentId.startsWith("skill:");
	const avatarSrc = usesRovoLogo
		? undefined
		: event.agentAvatarSrc ?? getDeterministicAgentAvatarSrc(event.agentId);
	const statusTag = event.status === "waiting" && event.waitingOn?.kind === "agent"
		? { text: `Waiting for ${event.waitingOn.agentName}`, color: "yellow" as const }
		: AGENT_STATUS_TAG[event.status];

	return {
		id: event.id,
		kind: "comment",
		actor: agentActor({ id: event.agentId, name: event.agentName, avatarSrc: event.agentAvatarSrc }),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		tag: statusTag,
		body: event.responsePreview ? [{ type: "text", text: event.responsePreview }] : [],
		collapsible: {
			label: "Prompt",
			content: [{ type: "text", text: event.commandPreview }],
		},
		allowReply: event.status !== "completed",
		...(event.threadReplies
			? {
				replies: event.threadReplies.map((reply) => ({
					id: reply.id,
					actor: agentActor({
						id: reply.agentId,
						name: reply.agentName,
						avatarSrc: reply.agentAvatarSrc,
					}),
					timestamp: formatSessionTimestamp(reply.createdAtMs, referenceTimeMs),
					body: reply.content,
				})),
			}
			: {}),
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

function mapStaticEvent(
	event: Readonly<StaticEventActivityEvent>,
	referenceTimeMs?: number,
): JiraActivityEventEntry {
	return {
		id: event.id,
		kind: "event",
		actor: staticActor(event.actor),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		...(event.icon ? { icon: event.icon } : {}),
		segments: event.segments,
		...(event.pullRequest ? { pullRequest: event.pullRequest } : {}),
	};
}

function mapStaticChangedFiles(
	event: Readonly<StaticChangedFilesActivityEvent>,
	referenceTimeMs?: number,
): JiraActivityChangedFilesEntry {
	return {
		id: event.id,
		kind: "changed-files",
		actor: staticActor(event.actor),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		summary: event.summary,
		description: event.description,
		...(event.branch ? { branch: event.branch } : {}),
		...(event.tag ? { tag: event.tag } : {}),
		...(event.sessionItem ? { sessionItem: event.sessionItem } : {}),
		...(event.outputs ? { outputs: event.outputs } : {}),
	};
}

/** Convert the already-chronological Jira Work Item activity stream for Jira Activity. */
export function mapActivityEventsToJiraEntries(
	events: readonly ActivityEvent[],
	referenceTimeMs?: number,
): JiraActivityEntry[] {
	return events.map((event) => {
		switch (event.kind) {
			case "human":
				return mapHumanEvent(event, referenceTimeMs);
			case "agent":
				return mapAgentEvent(event, referenceTimeMs);
			case "event":
				return mapStaticEvent(event, referenceTimeMs);
			case "changed-files":
				return mapStaticChangedFiles(event, referenceTimeMs);
		}
	});
}
