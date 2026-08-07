import type { JiraWorkItemState } from "@/components/blocks/jira-work-item/data/session-state";

import { createJiraAgentsStoryState } from "./hotfix-story";

export type JiraAgentsOrchestrationStep =
	| "idle"
	| "agents-working"
	| "comment"
	| "reaction-1"
	| "reaction-2"
	| "lead"
	| "consult"
	| "complete";

/**
 * Route-owned snapshots for the prompt-driven orchestration reveal. Sessions
 * exist from the first step so the composer can immediately show the shared
 * two-agent context. Activity independently reveals those sessions after the
 * prompt and acknowledgement reactions land.
 */
export function createJiraAgentsOrchestrationState(
	step: JiraAgentsOrchestrationStep,
): JiraWorkItemState {
	if (step === "idle") return createJiraAgentsStoryState("brief");
	if (step === "complete") return createJiraAgentsStoryState("working");

	const brief = createJiraAgentsStoryState("brief");
	const plan = createJiraAgentsStoryState("plan");
	const working = createJiraAgentsStoryState("working");
	const stageState = step === "consult" ? working : plan;
	const orchestrationComment = stageState.comments.find(
		(comment) => comment.id === "story-channel-orchestration",
	);
	const reactionCount = step === "reaction-1"
		? 1
		: step === "reaction-2" || step === "lead"
			? 2
			: 0;
	const showComment = step !== "agents-working";
	const showLeadActivity = step === "lead" || step === "consult";
	const stagedComment = orchestrationComment
		? {
			...orchestrationComment,
			...(reactionCount > 0 && orchestrationComment.reactions?.[0]
				? {
					reactions: [{
						...orchestrationComment.reactions[0],
						actorIds: orchestrationComment.reactions[0].actorIds.slice(0, reactionCount),
					}],
				}
				: { reactions: undefined }),
		}
		: null;

	return {
		...stageState,
		comments: showComment && stagedComment
			? [...brief.comments, stagedComment]
			: brief.comments,
		staticEvents: showLeadActivity ? stageState.staticEvents : brief.staticEvents,
	};
}
