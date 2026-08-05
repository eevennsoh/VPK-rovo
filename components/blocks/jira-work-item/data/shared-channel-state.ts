import type {
	AgentSessionComment,
	JiraWorkItemAction,
	JiraWorkItemState,
} from "@/components/blocks/jira-work-item/data/session-state";

type BroadcastCommentAction = Extract<JiraWorkItemAction, { type: "broadcast-comment" }>;

/** Stable Jira Activity actor id shared by authored reactions and the adapter. */
export function getAgentActivityActorId(agentId: string): string {
	return `jira-work-item-agent-${agentId}`;
}

/** Append one shared-channel comment and copy it into every active agent thread. */
export function reduceBroadcastComment(
	state: Readonly<JiraWorkItemState>,
	action: Readonly<BroadcastCommentAction>,
	createdAtMs: number,
): JiraWorkItemState {
	const activeActorIds = Array.from(new Set(
		state.sessions
			.filter((session) => session.status !== "completed")
			.map((session) => getAgentActivityActorId(session.agentId)),
	));
	const comment: AgentSessionComment = {
		id: `comment-${state.nextIdCounter}`,
		authorName: action.authorName ?? "You",
		authorAvatarSrc: action.authorAvatarSrc,
		content: action.text,
		createdAtMs,
		...(activeActorIds.length > 0
			? { reactions: [{ emoji: "👀", actorIds: activeActorIds }] }
			: {}),
	};
	const sessions = state.sessions.map((session) =>
		session.status === "completed"
			? session
			: {
					...session,
					messages: [
						...session.messages,
						{
							id: `${session.id}-broadcast-${state.nextIdCounter}`,
							role: "human" as const,
							authorName: action.authorName ?? "You",
							authorAvatarSrc: action.authorAvatarSrc,
							content: action.text,
							createdAtMs,
						},
					],
				},
	);
	return {
		...state,
		comments: [...state.comments, comment],
		sessions,
		nextIdCounter: state.nextIdCounter + 1,
	};
}
