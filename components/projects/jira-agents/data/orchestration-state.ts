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

const CONSULT_READY_PREVIEW = "Code Planner's secure API contract and validation matrix are ready. I'm confirming the plan handoff before implementation begins in Build.";

function createConsultReadyPlanState(
	plan: Readonly<JiraWorkItemState>,
	build: Readonly<JiraWorkItemState>,
): JiraWorkItemState {
	const completedPlanner = build.sessions.find((session) => session.agentId === "code-planner");
	return {
		...plan,
		sessions: plan.sessions.map((session) => {
			if (session.agentId === "code-planner" && completedPlanner) return completedPlanner;
			if (session.agentId !== "claude-code") return session;
			return {
				...session,
				previewText: CONSULT_READY_PREVIEW,
				messages: session.messages.map((message, index) => index === session.messages.length - 1
					? { ...message, content: CONSULT_READY_PREVIEW }
					: message),
			};
		}),
	};
}

/**
 * Route-owned snapshots for the prompt-driven orchestration reveal. Sessions
 * exist from the first step so the composer can immediately show the shared
 * two-agent context. Activity independently reveals those sessions after the
 * prompt and acknowledgement reactions land.
 */
export function createJiraAgentsOrchestrationState(
	step: JiraAgentsOrchestrationStep,
): JiraWorkItemState {
	if (step === "idle") return createJiraAgentsStoryState("intake");
	if (step === "complete") return createJiraAgentsStoryState("build");

	const intake = createJiraAgentsStoryState("intake", { descriptionImproved: true });
	const plan = createJiraAgentsStoryState("plan");
	const build = createJiraAgentsStoryState("build");
	const stageState = step === "consult" ? createConsultReadyPlanState(plan, build) : plan;
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
			? [...intake.comments, stagedComment]
			: intake.comments,
		staticEvents: showLeadActivity ? stageState.staticEvents : intake.staticEvents,
	};
}
