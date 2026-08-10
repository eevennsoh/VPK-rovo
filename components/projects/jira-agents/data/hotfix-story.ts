import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { AgentListItem, AgentListState } from "@/components/blocks/agent-list";
import type {
	AgentSession,
	AgentSessionComment,
	AgentSessionStatus,
	JiraWorkItemPreset,
	JiraWorkItemState,
	StaticTimelineEvent,
} from "@/components/blocks/jira-work-item/data/session-state";
import {
	getAgentActivityActorId,
	hydratePreset,
} from "@/components/blocks/jira-work-item/data/session-state";
import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import type {
	JiraKanbanAgentData,
	JiraKanbanCardData,
	JiraKanbanColumnData,
} from "@/components/blocks/jira-kanban";
import type {
	JiraForYouAgent,
	JiraForYouItem,
	JiraForYouSection,
	JiraForYouStatus,
} from "@/components/projects/jira-for-you/jira-for-you-types";
import { JIRA_FOR_YOU_SECTIONS } from "@/components/projects/jira-for-you/data";
import {
	JIRA_DESIGN_KANBAN_AGENTS,
	JIRA_DESIGN_KANBAN_COLUMNS,
} from "@/components/projects/jira-golden-journeys/data/jira-design-work-items";
import {
	createJiraAgentsStoryContextResources,
	IMPROVED_STORY_DESCRIPTION,
	RAW_STORY_DESCRIPTION,
} from "./story-context";
import {
	FAILED_PR_CHECKS,
	PASSED_PR_CHECKS,
	QUEUED_PR_CHECKS,
	RERUNNING_PR_CHECKS,
	RUNNING_PR_CHECKS,
} from "./story-pull-request-checks";
import {
	CLAUDE_CODE,
	CLAUDE_CODE_ACTOR,
	CLAUDE_SESSION_TITLE_BY_CHAPTER,
	CODE_PLANNER,
	GITHUB_ACTOR,
	HUMAN_ACTOR,
	JIRA_AGENTS_DESCRIPTION_SKILL_SCRIPT_ID,
	JIRA_AGENTS_DESCRIPTION_SKILL_SESSION_ID,
	JIRA_AGENTS_STORY_ISSUE_KEY,
	JIRA_AGENTS_STORY_ITEM_ID,
	JIRA_AGENTS_STORY_WORK_ITEM_BASE,
	ROVO,
	ROVO_ACTOR,
	STORY_AGENT_BY_ID,
	STORY_CREATED_AT_MS,
	STORY_EPOCH_MS,
	STORY_STATUS_BY_CHAPTER,
	VENN_ACTOR,
	WORK_ITEM_STATUS_BY_CHAPTER,
	type JiraAgentsDescriptionSkillPhase,
	type JiraAgentsReviewStep,
	type JiraAgentsStoryAgent,
	type JiraAgentsStoryChapter,
	type JiraAgentsStoryStateOptions,
} from "./story-model";

export {
	JIRA_AGENTS_DESCRIPTION_SKILL_SCRIPT_ID,
	JIRA_AGENTS_DESCRIPTION_SKILL_SESSION_ID,
	JIRA_AGENTS_PULL_REQUEST_IDENTITY,
	JIRA_AGENTS_STATUS_PHASES,
	JIRA_AGENTS_STORY_CHAPTERS,
	JIRA_AGENTS_STORY_COMPOSER_AGENTS,
	JIRA_AGENTS_STORY_ISSUE_KEY,
	JIRA_AGENTS_STORY_ITEM_ID,
	JIRA_AGENTS_STORY_WORK_ITEM_BASE,
	shouldStartJiraAgentsPlan,
} from "./story-model";
export type {
	JiraAgentsDescriptionSkillPhase,
	JiraAgentsReviewStep,
	JiraAgentsStoryChapter,
	JiraAgentsStoryStateOptions,
} from "./story-model";

function createStoryArtifactSession({
	agent,
	branch,
	elapsedSeconds,
	id,
	state,
	title,
}: {
	agent: JiraAgentsStoryAgent;
	branch: string;
	elapsedSeconds: number;
	id: string;
	state: AgentListState;
	title: string;
}): AgentListItem {
	return {
		id,
		title,
		state,
		agent: {
			id: agent.id,
			name: agent.name,
			...(agent.brandName ? { brandName: agent.brandName } : { avatarSrc: agent.avatarSrc }),
		},
		branch,
		elapsedSeconds,
	};
}

function statusEvent(
	id: string,
	from: string,
	to: string,
	createdAtMs: number,
): StaticTimelineEvent {
	return {
		id,
		kind: "event",
		actor: HUMAN_ACTOR,
		icon: "status",
		segments: [
			{ type: "text", text: "moved from " },
			{ type: "lozenge", text: from },
			{ type: "transition-arrow" },
			{ type: "lozenge", text: to },
		],
		createdAtMs,
	};
}

const INTAKE_EVENTS: readonly StaticTimelineEvent[] = [
	{
		id: "story-created",
		kind: "event",
		actor: HUMAN_ACTOR,
		icon: "created",
		segments: [{ type: "text", text: "created the feature story from the storefront conversion roadmap" }],
		createdAtMs: STORY_CREATED_AT_MS,
	},
	{
		id: "story-impact-labelled",
		kind: "event",
		actor: HUMAN_ACTOR,
		icon: "label",
		segments: [
			{ type: "text", text: "added " },
			{ type: "label", text: "guest-checkout", color: "blue" },
			{ type: "text", text: " and " },
			{ type: "label", text: "feature", color: "purple" },
		],
		createdAtMs: STORY_EPOCH_MS - 3_480_000,
	},
];

const DESCRIPTION_APPLIED_EVENT: StaticTimelineEvent = {
	id: "story-description-applied",
	kind: "event",
	actor: ROVO_ACTOR,
	icon: "linked",
	segments: [{
		type: "text",
		text: "Added the approved implementation-ready description to SHOP-4821 after Venn confirmed the suggestion.",
	}],
	createdAtMs: STORY_EPOCH_MS - 2_520_000,
};

const PLAN_EVENTS: readonly StaticTimelineEvent[] = [
	...INTAKE_EVENTS,
	statusEvent("story-moved-in-progress", "To do", "In progress", STORY_EPOCH_MS - 3_000_000),
	{
		id: "story-lead-delegated",
		kind: "event",
		actor: CLAUDE_CODE_ACTOR,
		icon: "delegated",
		showActor: false,
		showTimestamp: false,
		segments: [
			{ type: "agent-mention", text: CLAUDE_CODE.name, brandName: CLAUDE_CODE.brandName },
			{ type: "agent-mention", text: CODE_PLANNER.name, avatarSrc: CODE_PLANNER.avatarSrc },
			{ type: "text", text: " Started working" },
		],
		createdAtMs: STORY_EPOCH_MS - 2_880_000,
	},
];

const BUILD_EVENTS: readonly StaticTimelineEvent[] = PLAN_EVENTS;

const HANDOFF_EVENT: StaticTimelineEvent = {
	id: "story-changed-files",
	kind: "changed-files",
	actor: CLAUDE_CODE_ACTOR,
	summary: "Changed 12 files",
	description: "Implemented the guest order service plus the storefront delivery, payment, validation, confirmation, and post-purchase account flows against Code Planner's contract.",
	branch: "feature/shop-4821-guest-checkout",
	tag: { text: "Implementation complete", color: "green" },
	sessionItem: createStoryArtifactSession({
		id: "story-claude-checkout",
		title: "Implemented guest checkout end to end",
		state: "complete",
		agent: CLAUDE_CODE,
		branch: "feature/shop-4821-guest-checkout",
		elapsedSeconds: 482,
	}),
	outputs: [
		{
			id: "guest-checkout-implementation",
			title: "Guest checkout implementation",
			source: "Agent output",
			owner: CLAUDE_CODE.name,
			iconName: "ai-chat",
		},
	],
	createdAtMs: STORY_EPOCH_MS - 1_320_000,
};

const FAILED_CI_EVENT: StaticTimelineEvent = {
	id: "story-ci-failed",
	kind: "event",
	actor: GITHUB_ACTOR,
	icon: "linked",
	segments: [
		{ type: "text", text: "blocked PR #1847 after " },
		{ type: "code", text: "lint-and-typecheck" },
		{ type: "text", text: " reported " },
		{ type: "lozenge", text: "1 failed", variant: "danger" },
	],
	createdAtMs: STORY_EPOCH_MS - 1_140_000,
};

type StoryPullRequestChecks = NonNullable<
	NonNullable<Extract<StaticTimelineEvent, { kind: "event" }>["pullRequest"]>["checks"]
>;

function createPullRequestEvent({
	checks,
	id,
	mergeState,
	reviewDecision,
	status = "Open",
	updatedAtMs,
}: {
	checks?: StoryPullRequestChecks;
	id: string;
	mergeState: "ready" | "blocked" | "merged";
	reviewDecision: "approved" | "review-required";
	status?: "Open" | "Merged";
	updatedAtMs: number;
}): StaticTimelineEvent {
	return {
		id,
		kind: "event",
		actor: GITHUB_ACTOR,
		icon: "linked",
		segments: [],
		pullRequest: {
			number: 1847,
			title: "Add guest checkout to the storefront",
			status,
			additions: 86,
			deletions: 21,
			repository: "eevensoh/vpk-rovo",
			branch: "feature/shop-4821-guest-checkout",
			targetBranch: "main",
			url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
			authorName: CLAUDE_CODE.name,
			createdAtMs: STORY_EPOCH_MS - 1_200_000,
			updatedAtMs,
			reviewDecision,
			mergeState,
			...(checks ? { checks } : {}),
		},
		createdAtMs: updatedAtMs,
	};
}

const ACCEPTANCE_MATRIX_EVENT: StaticTimelineEvent = {
	id: "story-regression-matrix",
	kind: "changed-files",
	actor: CLAUDE_CODE_ACTOR,
	summary: "Acceptance matrix passed",
	description: "Verified guest purchase, validation errors, inventory changes, declined payments, duplicate submissions, confirmation, and optional post-purchase account creation.",
	branch: "#1847",
	tag: { text: "18 checks passing", color: "green" },
	sessionItem: createStoryArtifactSession({
		id: "story-test-report",
		title: "Acceptance matrix passed",
		state: "complete",
		agent: CLAUDE_CODE,
		branch: "#1847",
		elapsedSeconds: 438,
	}),
	outputs: [{
		id: "acceptance-report",
		title: "SHOP-4821 acceptance report",
		source: "Test artifact",
		owner: CLAUDE_CODE.name,
		iconName: "page",
	}],
	createdAtMs: STORY_EPOCH_MS - 720_000,
};

function createReviewEvents(step: JiraAgentsReviewStep): readonly StaticTimelineEvent[] {
	const checks = step === "queued"
		? QUEUED_PR_CHECKS
		: step === "running"
			? RUNNING_PR_CHECKS
			: FAILED_PR_CHECKS;
	const updatedAtMs = step === "queued"
		? STORY_EPOCH_MS - 1_200_000
		: step === "running"
			? STORY_EPOCH_MS - 1_170_000
			: STORY_EPOCH_MS - 1_140_000;
	return [
		...BUILD_EVENTS,
		HANDOFF_EVENT,
		statusEvent("story-moved-review", "In progress", "In review", STORY_EPOCH_MS - 1_260_000),
		createPullRequestEvent({
			checks,
			id: "story-pr-review",
			mergeState: "blocked",
			reviewDecision: "review-required",
			updatedAtMs,
		}),
		...(step === "failed" ? [FAILED_CI_EVENT] : []),
	];
}

function createFixEvents(repairComplete: boolean): readonly StaticTimelineEvent[] {
	return [
		...createReviewEvents("failed"),
		statusEvent("story-moved-fix", "In review", "In progress", STORY_EPOCH_MS - 1_020_000),
		{
			id: "story-ci-repair",
			kind: "changed-files",
			actor: CLAUDE_CODE_ACTOR,
			summary: repairComplete ? "Repaired the failed CI path" : "Repairing the failed CI path",
			description: repairComplete
				? "Narrowed the nullable delivery address before order creation and reran the failed lint and typecheck check to green while preserving the existing green unit and browser results."
				: "Narrowed the nullable delivery address before order creation and is rerunning the failed lint and typecheck check while preserving the green unit and browser results.",
			branch: "feature/shop-4821-guest-checkout",
			tag: repairComplete
				? { text: "CI rerun passed", color: "green" }
				: { text: "CI rerun active", color: "blue" },
			sessionItem: createStoryArtifactSession({
				id: "story-ci-repair-session",
				title: "Repair delivery-address validation",
				state: repairComplete ? "complete" : "running",
				agent: CLAUDE_CODE,
				branch: "feature/shop-4821-guest-checkout",
				elapsedSeconds: repairComplete ? 174 : 96,
			}),
			outputs: [],
			createdAtMs: STORY_EPOCH_MS - 960_000,
		},
		createPullRequestEvent({
			checks: repairComplete ? PASSED_PR_CHECKS : RERUNNING_PR_CHECKS,
			id: "story-pr-fix-rerun",
			mergeState: "blocked",
			reviewDecision: "review-required",
			updatedAtMs: STORY_EPOCH_MS - (repairComplete ? 780_000 : 900_000),
		}),
	];
}

function createApproveEvents(pullRequestApproved: boolean): readonly StaticTimelineEvent[] {
	return [
		...createFixEvents(true),
		ACCEPTANCE_MATRIX_EVENT,
		statusEvent("story-moved-approve", "In progress", "In review", STORY_EPOCH_MS - 660_000),
		createPullRequestEvent({
			checks: PASSED_PR_CHECKS,
			id: "story-pr-approve",
			mergeState: pullRequestApproved ? "ready" : "blocked",
			reviewDecision: pullRequestApproved ? "approved" : "review-required",
			updatedAtMs: STORY_EPOCH_MS - 600_000,
		}),
		...(pullRequestApproved ? [{
			id: "story-venn-approved",
			kind: "event" as const,
			actor: VENN_ACTOR,
			icon: "linked" as const,
			segments: [
				{ type: "text" as const, text: "approved " },
				{ type: "code" as const, text: "PR #1847" },
				{ type: "text" as const, text: " for production release" },
			],
			createdAtMs: STORY_EPOCH_MS - 540_000,
		}] : []),
	];
}

const RELEASE_EVENTS: readonly StaticTimelineEvent[] = [
	...createApproveEvents(true),
	createPullRequestEvent({
		checks: PASSED_PR_CHECKS,
		id: "story-pr-merged",
		mergeState: "merged",
		reviewDecision: "approved",
		status: "Merged",
		updatedAtMs: STORY_EPOCH_MS - 480_000,
	}),
	{
		id: "story-release-feature-flag",
		kind: "event",
		actor: GITHUB_ACTOR,
		icon: "linked",
		segments: [
			{ type: "text", text: "deployed to production behind " },
			{ type: "code", text: "guest_checkout_v1" },
			{ type: "text", text: " at 5% rollout" },
		],
		createdAtMs: STORY_EPOCH_MS - 360_000,
	},
	{
		id: "story-release-smoke-telemetry",
		kind: "event",
		actor: CLAUDE_CODE_ACTOR,
		icon: "linked",
		segments: [
			{ type: "text", text: "passed production smoke checks and confirmed healthy telemetry: guest completion increased 11.8%, payment failures held at 2.1%, duplicate orders remained at zero, and checkout support contacts stayed within baseline" },
		],
		createdAtMs: STORY_EPOCH_MS - 240_000,
	},
	{
		id: "story-release-rollout-complete",
		kind: "event",
		actor: VENN_ACTOR,
		icon: "linked",
		segments: [
			{ type: "text", text: "completed the feature-flag rollout to " },
			{ type: "lozenge", text: "100%", variant: "success" },
		],
		createdAtMs: STORY_EPOCH_MS - 120_000,
	},
	statusEvent("story-moved-release", "In review", "Done", STORY_EPOCH_MS - 60_000),
];

function createSession(
	agent: JiraAgentsStoryAgent,
	status: AgentSessionStatus,
	order: number,
	options: {
		command: string;
		commandAuthorName?: string;
		imageAttachment?: AgentSession["imageAttachment"];
		previewText: string;
		progressChecklist?: AgentSession["progressChecklist"];
		title: string;
		waitingOn?: AgentSession["waitingOn"];
		threadReplies?: AgentSession["threadReplies"];
	},
): AgentSession {
	const completed = status === "completed";
	const waiting = status === "waiting";
	const steps = [
		{ id: `${agent.id}-context`, label: "Read the shared work-item context", status: "complete" as const },
		{
			id: `${agent.id}-work`,
			label: options.title,
			status: completed ? "complete" as const : waiting ? "pending" as const : "active" as const,
		},
		{
			id: `${agent.id}-handoff`,
			label: "Share the result with the agent team",
			status: completed ? "complete" as const : "pending" as const,
		},
	];

	return {
		id: `story-session-${agent.id}`,
		agentId: agent.id ?? "unknown-agent",
		agentName: agent.name,
		agentAvatarSrc: agent.avatarSrc,
		agentBrandName: agent.brandName,
		title: options.title,
		status,
		command: options.command,
		previewText: options.previewText,
		steps,
		progress: completed ? 1 : waiting ? 1 / 3 : 1 / 2,
		messages: [
			{
				id: `story-session-${agent.id}-prompt`,
				role: "human",
				authorName: options.commandAuthorName ?? "Venn",
				content: options.command,
				createdAtMs: STORY_EPOCH_MS - 2_700_000 + order * 60_000,
			},
			{
				id: `story-session-${agent.id}-update`,
				role: "agent",
				authorName: agent.name,
				authorAvatarSrc: agent.avatarSrc,
				content: options.previewText,
				createdAtMs: STORY_EPOCH_MS - 2_640_000 + order * 60_000,
			},
		],
		startedAtMs: STORY_EPOCH_MS - 2_700_000 + order * 60_000,
		scriptId: `shop-4821-${agent.id}`,
		scriptCursor: completed ? 3 : 1,
		stepElapsedMs: 0,
		resumedFromWait: false,
		order,
		...(options.progressChecklist ? { progressChecklist: options.progressChecklist } : {}),
		...(options.imageAttachment ? { imageAttachment: options.imageAttachment } : {}),
		...(options.waitingOn ? { waitingOn: options.waitingOn } : {}),
		...(options.threadReplies ? { threadReplies: options.threadReplies } : {}),
	};
}

function getDescriptionSkillPhase(
	chapter: JiraAgentsStoryChapter,
	options: JiraAgentsStoryStateOptions,
): JiraAgentsDescriptionSkillPhase {
	if (options.descriptionSkillPhase) return options.descriptionSkillPhase;
	if (options.descriptionImproved !== undefined) {
		return options.descriptionImproved ? "applied" : "idle";
	}
	return chapter === "intake" ? "idle" : "applied";
}

function createDescriptionSkillSession(phase: Exclude<JiraAgentsDescriptionSkillPhase, "idle">): AgentSession {
	const status: AgentSessionStatus = phase === "running"
		? "running"
		: phase === "awaiting-confirmation"
			? "waiting"
			: "completed";
	const suggestion = [
		"I reviewed the current work item and drafted a stronger description without changing it.",
		"",
		"I clarified the shopper outcome, added the missing delivery scope, made server-owned safeguards explicit, and turned the request into testable acceptance criteria.",
		"",
		"**Suggested description**",
		"",
		IMPROVED_STORY_DESCRIPTION,
	].join("\n");
	const previewText = phase === "running"
		? "Reviewing the current description and drafting a clearer implementation-ready version."
		: phase === "awaiting-confirmation"
			? "The improved description is ready. Waiting for confirmation before updating the work item."
			: phase === "dismissed"
				? "Understood — I kept the current work item description unchanged. You can run Improve description again whenever you’re ready."
				: "Done — I added the approved description to SHOP-4821. The original work item stayed unchanged until this confirmation.";
	const session = createSession(ROVO, status, 0, {
		title: "Improve description",
		command: "/Improve description",
		previewText,
	});
	const suggestionReady = phase !== "running";
	const stepStatus = suggestionReady ? "complete" as const : "pending" as const;
	return {
		...session,
		scriptId: JIRA_AGENTS_DESCRIPTION_SKILL_SCRIPT_ID,
		scriptCursor: suggestionReady ? 2 : 0,
		progress: suggestionReady ? 1 : 0,
		steps: [
			{
				id: "review",
				label: "Review the current work item",
				status: suggestionReady ? "complete" : "active",
			},
			{
				id: "draft",
				label: "Draft the improved description",
				status: stepStatus,
			},
		],
		waitingOn: phase === "awaiting-confirmation" ? { kind: "user" } : undefined,
		messages: [
			session.messages[0],
			{
				...session.messages[1],
				content: suggestionReady ? suggestion : previewText,
			},
			...(phase === "applied" || phase === "dismissed" ? [{
				id: `${session.id}-${phase}`,
				role: "agent" as const,
				authorName: ROVO.name,
				authorAvatarSrc: ROVO.avatarSrc,
				content: previewText,
				createdAtMs: STORY_EPOCH_MS - 2_580_000,
			}] : []),
		],
	};
}

function createStorySessions(
	chapter: JiraAgentsStoryChapter,
	options: JiraAgentsStoryStateOptions,
): AgentSession[] {
	const descriptionSkillPhase = getDescriptionSkillPhase(chapter, options);
	const descriptionSkillSession = descriptionSkillPhase === "idle"
		? []
		: [createDescriptionSkillSession(descriptionSkillPhase)];
	if (chapter === "intake") return descriptionSkillSession;

	const plannerStatus: AgentSessionStatus = chapter === "plan" ? "running" : "completed";
	const claudeStatus: AgentSessionStatus = chapter === "release"
		|| (chapter === "approve" && options.pullRequestApproved)
		|| (chapter === "review" && options.reviewStep === "failed")
		? "completed"
		: chapter === "approve" || chapter === "review"
			? "waiting"
			: "running";
	const completedChecklistItems = {
		plan: 0,
		build: 1,
		handoff: 3,
		review: options.reviewStep === "failed" ? 5 : 4,
		fix: 5,
		approve: options.pullRequestApproved ? 7 : 6,
		release: 8,
	} as const satisfies Record<Exclude<JiraAgentsStoryChapter, "intake">, number>;
	const checklistLabels = [
		"Consult Code Planner on the secure API and validation contract",
		"Implement guest checkout end to end",
		"Verify the final design and attach a screenshot",
		"Open the pull request for automated CI review",
		"Run CI and diagnose the actionable failure",
		"Repair the failed path and rerun its failed check to green",
		"Obtain Venn's required human approval in the PR guide",
		"Merge, deploy behind the feature flag, and verify production rollout",
	] as const;
	const progressChecklist = checklistLabels.map((label, index) => ({
		id: `story-claude-progress-${index + 1}`,
		label,
		completed: index < completedChecklistItems[chapter],
	}));

	const claude = createSession(CLAUDE_CODE, claudeStatus, 1, {
		title: CLAUDE_SESSION_TITLE_BY_CHAPTER[chapter],
		command: "Take the lead on implementing guest checkout. Consult Code Planner on the secure API and validation contract first, then implement and verify the work.",
		previewText: chapter === "plan"
			? "I'm taking the lead on SHOP-4821. Code Planner, review this work item and define the secure API contract, server-owned validation rules, idempotency behavior, and recoverable error handling before I implement it."
			: chapter === "build"
				? "Code Planner's contract is ready. I'm implementing the guest order service and storefront flow with server-owned pricing, inventory, payment validation, and idempotent order creation."
				: chapter === "handoff"
					? "Guest checkout is implemented and verified. I've attached the final desktop and mobile evidence and prepared PR #1847 for automated CI review."
					: chapter === "review"
						? options.reviewStep === "queued"
							? "PR #1847 is open. GitHub Actions owns the automated review; its lint, typecheck, unit, and guest-checkout browser checks are queued."
							: options.reviewStep === "running"
								? "GitHub Actions is running lint and typecheck for PR #1847 while the remaining automated checks wait for CI capacity."
								: "GitHub Actions blocked PR #1847. Lint and typecheck found a nullable delivery-address path; unit and browser coverage passed."
						: chapter === "fix"
							? "I repaired the nullable delivery-address path and am rerunning the failed lint and typecheck check; unit and browser coverage remain passed."
							: chapter === "approve"
								? options.pullRequestApproved
									? "Venn approved PR #1847. All CI and acceptance evidence is complete, so the change is ready to merge and release."
									: "All CI and 18 acceptance checks pass. PR #1847 is waiting for Venn's required human review before merge."
				: "PR #1847 was approved by Venn and merged. Guest checkout deployed behind its production feature flag, passed production smoke checks, verified healthy telemetry, and completed rollout.",
		progressChecklist,
		imageAttachment: chapter === "handoff" || chapter === "review" || chapter === "fix" || chapter === "approve" || chapter === "release"
			? {
				src: "/illustration/jira-agents/guest-checkout-final.png",
				alt: "Final guest checkout design",
				filename: "guest-checkout-final.png",
			}
			: undefined,
		waitingOn: chapter === "approve" && !options.pullRequestApproved
			? { kind: "user" }
			: chapter === "review" && options.reviewStep !== "failed"
				? {
					kind: "agent",
					agentId: "github-actions",
					agentName: "GitHub Actions",
				}
				: undefined,
	});
	const planner = createSession(CODE_PLANNER, plannerStatus, 2, {
		title: "Consult on the guest checkout contract",
		commandAuthorName: CLAUDE_CODE.name,
		command: "Review SHOP-4821 and define the secure request and response contract, server-owned validation rules, idempotency behavior, and recoverable error handling I should implement.",
		previewText: plannerStatus === "completed"
			? "Consultation complete. Use a server-owned guest-order endpoint that recalculates pricing, discounts, tax, shipping, and inventory. Require an idempotency key and return field-safe errors for address, inventory, and payment failures. The OpenAPI contract and validation matrix are ready."
			: "Reviewing the checkout requirements and preparing the API contract, validation matrix, and idempotency rules for Claude Code.",
	});

	return [...descriptionSkillSession, claude, planner];
}

function activeAgentIds(sessions: readonly AgentSession[]): string[] {
	return sessions
		.filter((session) => session.status !== "completed")
		.map((session) => session.agentId);
}

function createStoryComments(
	chapter: JiraAgentsStoryChapter,
	sessions: readonly AgentSession[],
): AgentSessionComment[] {
	const showAcknowledgementReactions = chapter === "plan";
	const actorIds = showAcknowledgementReactions
		? activeAgentIds(sessions).map(getAgentActivityActorId)
		: [];
	return [
		{
			id: "story-channel-intake",
			authorName: "Jordan Lee",
			authorAvatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			content: "Checkout-funnel research identifies mandatory registration as the largest avoidable drop-off for first-time shoppers. During rollout, track guest completion, payment failures, duplicate orders, and checkout-related support contacts.",
			createdAtMs: STORY_EPOCH_MS - 3_240_000,
			threadReplies: [{
				id: "story-channel-intake-maya-reply",
				authorName: "Maya Chen",
				authorAvatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
				content: "Agreed. If the email already belongs to an account, let the shopper finish as a guest and offer sign-in or account linking only after the order is confirmed. That keeps this release focused and avoids pulling account recovery into checkout.",
				createdAtMs: STORY_EPOCH_MS - 240_000,
			}],
		},
		...(chapter === "intake" ? [] : [{
			id: "story-channel-orchestration",
			authorName: "Venn",
			content: "@Claude Code take the lead on implementing guest checkout. Consult @Code Planner on the secure API and validation contract first, then implement and verify the work.",
			createdAtMs: STORY_EPOCH_MS - 2_940_000,
			...(actorIds.length > 0
				? { reactions: [{ emoji: "👀", actorIds }] }
				: {}),
		} satisfies AgentSessionComment]),
	];
}

function storyEventsForChapter(
	chapter: JiraAgentsStoryChapter,
	options: JiraAgentsStoryStateOptions,
): readonly StaticTimelineEvent[] {
	switch (chapter) {
		case "intake":
			return options.descriptionSkillPhase === "applied"
				? [...INTAKE_EVENTS, DESCRIPTION_APPLIED_EVENT]
				: INTAKE_EVENTS;
		case "plan":
			return PLAN_EVENTS;
		case "build":
			return BUILD_EVENTS;
		case "handoff":
			return [...BUILD_EVENTS, HANDOFF_EVENT];
		case "review":
			return createReviewEvents(options.reviewStep ?? "queued");
		case "fix":
			return createFixEvents(false);
		case "approve":
			return createApproveEvents(options.pullRequestApproved ?? false);
		case "release":
			return RELEASE_EVENTS;
	}
}

export function getJiraAgentsStoryStatus(chapter: JiraAgentsStoryChapter): JiraForYouStatus {
	return STORY_STATUS_BY_CHAPTER[chapter];
}

export function getJiraAgentsStoryChapterForStatus(status: string): JiraAgentsStoryChapter | null {
	switch (status) {
		case "To do":
			return "intake";
		case "In progress":
			return "build";
		case "Review":
		case "In review":
			return "review";
		case "Done":
			return "release";
		default:
			return null;
	}
}

export function createJiraAgentsStoryWorkItem(
	chapter: JiraAgentsStoryChapter,
	options: JiraAgentsStoryStateOptions = {},
): WorkItemData {
	const descriptionImproved = getDescriptionSkillPhase(chapter, options) === "applied";
	return {
		...JIRA_AGENTS_STORY_WORK_ITEM_BASE,
		description: descriptionImproved ? IMPROVED_STORY_DESCRIPTION : RAW_STORY_DESCRIPTION,
		status: WORK_ITEM_STATUS_BY_CHAPTER[chapter],
	};
}

export function createJiraAgentsStoryState(
	chapter: JiraAgentsStoryChapter,
	options: JiraAgentsStoryStateOptions = {},
): JiraWorkItemState {
	const descriptionSkillPhase = getDescriptionSkillPhase(chapter, options);
	const resolvedOptions = {
		...options,
		descriptionImproved: descriptionSkillPhase === "applied",
		descriptionSkillPhase,
		reviewStep: options.reviewStep ?? "queued",
	};
	const workItem = createJiraAgentsStoryWorkItem(chapter, resolvedOptions);
	const sessions = createStorySessions(chapter, resolvedOptions);
	const preset: JiraWorkItemPreset = sessions.length > 0 ? "running" : "filled";
	const base = hydratePreset(preset, workItem);

	return {
		...base,
		preset,
		contextResources: createJiraAgentsStoryContextResources(chapter, workItem, {
			descriptionImproved: descriptionSkillPhase === "applied",
		}),
		metadata: {
			...base.metadata,
			status: WORK_ITEM_STATUS_BY_CHAPTER[chapter],
			atlassianProject: "storefront-platform",
			parent: JIRA_AGENTS_STORY_WORK_ITEM_BASE.parent?.code ?? null,
			crew: sessions.map((session) => ({
				id: session.agentId,
				kind: "agent" as const,
				name: session.agentName,
				avatarUrl: session.agentAvatarSrc,
				...(session.agentBrandName ? { brandName: session.agentBrandName } : {}),
			})),
		},
		comments: createStoryComments(chapter, sessions),
		sessions,
		staticEvents: [...storyEventsForChapter(chapter, resolvedOptions)],
		activeSessionId: chapter === "intake" && descriptionSkillPhase !== "idle"
			? JIRA_AGENTS_DESCRIPTION_SKILL_SESSION_ID
			: null,
		composerPrefill: null,
		elapsedMs: STORY_EPOCH_MS - SESSION_EPOCH_MS,
		nextOrder: sessions.length,
		nextIdCounter: 100,
	};
}

function activeAgentsForChapter(chapter: JiraAgentsStoryChapter): readonly JiraForYouAgent[] {
	const state = createJiraAgentsStoryState(chapter);
	return state.sessions
		.filter((session) => session.status !== "completed")
		.flatMap((session) => {
			const agent = STORY_AGENT_BY_ID.get(session.agentId);
			return agent ? [agent] : [];
		});
}

export function createJiraAgentsStoryItem(chapter: JiraAgentsStoryChapter): JiraForYouItem {
	const agents = activeAgentsForChapter(chapter);
	return {
		id: JIRA_AGENTS_STORY_ITEM_ID,
		title: JIRA_AGENTS_STORY_WORK_ITEM_BASE.title,
		issueType: "story",
		issueKey: JIRA_AGENTS_STORY_ISSUE_KEY,
		spaceName: "Storefront Platform",
		jiraStatus: STORY_STATUS_BY_CHAPTER[chapter],
		tabs: ["assigned", "worked-on", "viewed"],
		...(agents.length > 0 ? { agents } : {}),
		...(agents.length > 0
			? { status: `${agents.length} agent${agents.length === 1 ? "" : "s"} working` }
			: {}),
	};
}

export function createJiraAgentsWorkspaceSections(
	chapter: JiraAgentsStoryChapter,
): readonly JiraForYouSection[] {
	const storyItem = createJiraAgentsStoryItem(chapter);
	const targetStatus = STORY_STATUS_BY_CHAPTER[chapter];
	const cleanSections = JIRA_FOR_YOU_SECTIONS.map((section) => ({
		...section,
		items: section.items.filter((item) => item.issueKey !== JIRA_AGENTS_STORY_ISSUE_KEY),
	}));
	const targetIndex = cleanSections.findIndex((section) => section.label === targetStatus);

	if (targetIndex >= 0) {
		return cleanSections.map((section, index) => index === targetIndex
			? { ...section, items: [storyItem, ...section.items] }
			: section);
	}

	const doneIndex = cleanSections.findIndex((section) => section.label === "Done");
	const insertionIndex = doneIndex >= 0 ? doneIndex : cleanSections.length;
	return [
		...cleanSections.slice(0, insertionIndex),
		{
			id: `jira-agents-${targetStatus.toLocaleLowerCase().replaceAll(" ", "-")}`,
			label: targetStatus,
			collapsible: true,
			items: [storyItem],
		},
		...cleanSections.slice(insertionIndex),
	];
}

function createBoardActivity(session: AgentSession) {
	const waitingAgent = session.waitingOn?.kind === "agent" ? session.waitingOn.agentName : null;
	return {
		id: `${JIRA_AGENTS_STORY_ISSUE_KEY}:${session.agentId}`,
		name: session.agentName,
		avatarSrc: session.agentAvatarSrc,
		agentBrandName: session.agentBrandName,
		label: waitingAgent ? `Waiting for ${waitingAgent}` : session.previewText,
		labels: session.steps.map((step) => step.label),
		message: session.previewText,
		state: session.status === "waiting" ? "awaiting-input" as const : "working" as const,
	};
}

function createJiraAgentsStoryCard(chapter: JiraAgentsStoryChapter): JiraKanbanCardData {
	const state = createJiraAgentsStoryState(chapter);
	const activeSessions = state.sessions.filter((session) => session.status !== "completed");
	return {
		title: JIRA_AGENTS_STORY_WORK_ITEM_BASE.title,
		code: JIRA_AGENTS_STORY_ISSUE_KEY,
		priority: "major",
		assignee: {
			id: "jordan-lee",
			name: "Jordan Lee",
			avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		},
		avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		tags: [
			{ text: "Storefront", color: "blue" },
			{ text: "Feature", color: "purple" },
		],
		...(activeSessions.length > 0
			? { agentActivities: activeSessions.map(createBoardActivity) }
			: {}),
		...(chapter === "review" || chapter === "fix" || chapter === "approve" || chapter === "release"
			? {
				pullRequestNumber: 1847,
				pullRequestStatus: chapter === "release" ? "merged" as const : "open" as const,
			}
			: {}),
	};
}

export function createJiraAgentsBoardColumns(
	chapter: JiraAgentsStoryChapter,
	columns: readonly JiraKanbanColumnData[] = JIRA_DESIGN_KANBAN_COLUMNS,
): JiraKanbanColumnData[] {
	const status = STORY_STATUS_BY_CHAPTER[chapter];
	const storyCard = createJiraAgentsStoryCard(chapter);
	return columns.map((column) => {
		const cards = column.cards.filter((card) => card.code !== JIRA_AGENTS_STORY_ISSUE_KEY);
		const nextCards = column.title === status ? [storyCard, ...cards] : cards;
		return { ...column, cards: nextCards, count: nextCards.length };
	});
}

export function getJiraAgentsStoryColumn(
	columns: readonly JiraKanbanColumnData[],
): string | null {
	return columns.find((column) => column.cards.some(
		(card) => card.code === JIRA_AGENTS_STORY_ISSUE_KEY,
	))?.title ?? null;
}

export const JIRA_AGENTS_STORY_BOARD_AGENTS: readonly JiraKanbanAgentData[] = [
	...JIRA_DESIGN_KANBAN_AGENTS,
	{
		id: CLAUDE_CODE.id ?? "claude-code",
		name: CLAUDE_CODE.name,
		byline: "Coding agent by Anthropic",
		brandName: "claude",
	},
	{
		id: CODE_PLANNER.id ?? "code-planner",
		name: CODE_PLANNER.name,
		byline: "Checkout architecture and API planning agent",
		avatarSrc: CODE_PLANNER.avatarSrc,
	},
];
