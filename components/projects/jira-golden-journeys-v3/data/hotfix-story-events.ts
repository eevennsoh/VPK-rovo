import type { StaticTimelineEvent } from "@/components/blocks/jira-work-item/data/session-state";

import {
	FAILED_PR_CHECKS,
	PASSED_PR_CHECKS,
	RERUNNING_PR_CHECKS,
	RUNNING_PR_CHECKS,
	SETTLING_PR_CHECKS,
	STARTED_PR_CHECKS,
	UNIT_PASSED_PR_CHECKS,
} from "./story-pull-request-checks";
import {
	CLAUDE_CODE_ACTOR,
	GITHUB_ACTOR,
	JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY,
	JORDAN_LEE_ACTOR,
	MAYA_CHEN_ACTOR,
	PRIYA_NARAYANAN_ACTOR,
	STORY_EPOCH_MS,
	VENN_ACTOR,
	type JiraGoldenJourneysV3ApprovalStep,
	type JiraGoldenJourneysV3CiStatus,
	type JiraGoldenJourneysV3FixStep,
	type JiraGoldenJourneysV3ReviewStep,
	type JiraGoldenJourneysV3StoryChapter,
	type JiraGoldenJourneysV3StoryStateOptions,
} from "./story-model";

type StoryPullRequestChecks = NonNullable<
	NonNullable<Extract<StaticTimelineEvent, { kind: "event" }>["pullRequest"]>["checks"]
>;
type StoryPullRequestReviewers = NonNullable<
	NonNullable<Extract<StaticTimelineEvent, { kind: "event" }>["pullRequest"]>["reviewers"]
>;

const WORK_ITEM_LIFECYCLE_EVENTS: readonly StaticTimelineEvent[] = [
	{
		id: "story-reported",
		kind: "event",
		actor: MAYA_CHEN_ACTOR,
		icon: "created",
		segments: [
			{ type: "text", text: "reported the feature story from the storefront conversion roadmap" },
		],
		createdAtMs: STORY_EPOCH_MS - 3_600_000,
	},
	{
		id: "story-assigned",
		kind: "event",
		actor: PRIYA_NARAYANAN_ACTOR,
		icon: "assigned",
		segments: [
			{ type: "text", text: "assigned the work item to " },
			{ type: "user-mention", text: VENN_ACTOR.name, avatarSrc: VENN_ACTOR.avatarSrc },
		],
		createdAtMs: STORY_EPOCH_MS - 3_300_000,
	},
	{
		id: "story-started-with-claude",
		kind: "event",
		actor: CLAUDE_CODE_ACTOR,
		icon: "delegated",
		showActor: false,
		showTimestamp: false,
		segments: [
			{ type: "agent-mention", text: "Claude", brandName: "claude" },
			{ type: "text", text: " Started working" },
		],
		createdAtMs: STORY_EPOCH_MS - 1_560_000,
	},
	{
		id: "story-moved-in-progress",
		kind: "event",
		actor: VENN_ACTOR,
		icon: "status",
		segments: [
			{ type: "text", text: "moved from " },
			{ type: "lozenge", text: "To do" },
			{ type: "transition-arrow" },
			{ type: "lozenge", text: "In progress" },
		],
		createdAtMs: STORY_EPOCH_MS - 1_440_000,
	},
];

function withWorkItemLifecycle(
	events: readonly StaticTimelineEvent[],
): readonly StaticTimelineEvent[] {
	return [...WORK_ITEM_LIFECYCLE_EVENTS, ...events];
}

function createPullRequestEvent({
	checks,
	mergeState,
	reviewDecision,
	reviewers,
	status = "Open",
	updatedAtMs,
}: Readonly<{
	checks: StoryPullRequestChecks;
	mergeState: "ready" | "blocked" | "merged";
	reviewDecision: "approved" | "review-required";
	reviewers?: StoryPullRequestReviewers;
	status?: "Open" | "Merged";
	updatedAtMs: number;
}>): StaticTimelineEvent {
	return {
		id: "story-pr-review",
		kind: "event",
		actor: GITHUB_ACTOR,
		icon: "pull-request",
		segments: [],
		pullRequest: {
			number: 1847,
			title: "Implement guest checkout without account creation",
			status,
			additions: 86,
			deletions: 21,
			repository: "eevensoh/vpk-rovo",
			branch: "feature/shop-4821-guest-checkout",
			targetBranch: "main",
			url: JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY,
			authorName: "Venn",
			authorAvatarSrc: "/avatar-user/venn/venn.png",
			createdAtMs: STORY_EPOCH_MS - 1_260_000,
			updatedAtMs,
			reviewDecision,
			...(reviewers ? { reviewers } : {}),
			mergeState,
			checks,
		},
		createdAtMs: updatedAtMs,
	};
}

const FAILED_CI_EVENT: StaticTimelineEvent = {
	id: "story-ci-failed",
	kind: "event",
	actor: GITHUB_ACTOR,
	icon: "pull-request",
	segments: [
		{ type: "text", text: "blocked PR #1847 after " },
		{ type: "code", text: "lint-and-typecheck" },
		{ type: "text", text: " reported " },
		{ type: "lozenge", text: "1 failed", variant: "danger" },
	],
	createdAtMs: STORY_EPOCH_MS - 1_080_000,
};

const REPAIR_EVENT: StaticTimelineEvent = {
	id: "story-ci-repair",
	kind: "changed-files",
	actor: CLAUDE_CODE_ACTOR,
	summary: "Fixed delivery-address nullability",
	description: "Claude inspected the failed check, narrowed deliveryAddress before order creation, committed 9f32a6d, and pushed the repair to PR #1847.",
	branch: "feature/shop-4821-guest-checkout",
	tag: { text: "CI rerunning", color: "blue" },
	createdAtMs: STORY_EPOCH_MS - 960_000,
};

const CI_PASSED_EVENT: StaticTimelineEvent = {
	id: "story-ci-passed",
	kind: "event",
	actor: GITHUB_ACTOR,
	icon: "pull-request",
	segments: [
		{ type: "text", text: "completed the rerun for PR #1847 with " },
		{ type: "lozenge", text: "3 checks passed", variant: "success" },
	],
	createdAtMs: STORY_EPOCH_MS - 840_000,
};

function checksForReviewStep(step: JiraGoldenJourneysV3ReviewStep): StoryPullRequestChecks {
	switch (step) {
		case "queued":
			return STARTED_PR_CHECKS;
		case "running":
			return RUNNING_PR_CHECKS;
		case "unit-passed":
			return UNIT_PASSED_PR_CHECKS;
		case "settling":
			return SETTLING_PR_CHECKS;
		case "failed":
			return FAILED_PR_CHECKS;
	}
}

function checksForCiStatus(status: JiraGoldenJourneysV3CiStatus): StoryPullRequestChecks {
	switch (status) {
		case "running":
			return STARTED_PR_CHECKS;
		case "failed":
			return FAILED_PR_CHECKS;
		case "repairing":
			return RERUNNING_PR_CHECKS;
		case "passed":
			return PASSED_PR_CHECKS;
	}
}

/** Same check rows the work-item PR rail shows for this chapter/state. */
export function resolveJiraGoldenJourneysV3PullRequestChecks(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
): StoryPullRequestChecks {
	switch (chapter) {
		case "terminal":
		case "build":
			return STARTED_PR_CHECKS;
		case "review":
			return checksForReviewStep(options.reviewStep ?? "queued");
		case "fix":
			if (options.fixStep === "repairing") {
				return RERUNNING_PR_CHECKS;
			}
			if (options.fixStep === "complete") {
				return PASSED_PR_CHECKS;
			}
			return FAILED_PR_CHECKS;
		case "approve":
		case "release":
			return checksForCiStatus(options.ciStatus ?? "running");
	}
}

function createReviewEvents(step: JiraGoldenJourneysV3ReviewStep): readonly StaticTimelineEvent[] {
	const prEvent = createPullRequestEvent({
		checks: checksForReviewStep(step),
		mergeState: "blocked",
		reviewDecision: "review-required",
		updatedAtMs: STORY_EPOCH_MS - (step === "failed" ? 1_060_000 : 1_180_000),
	});
	return withWorkItemLifecycle(step === "failed"
		? [prEvent, FAILED_CI_EVENT]
		: [prEvent]);
}

function createFixEvents(step: JiraGoldenJourneysV3FixStep): readonly StaticTimelineEvent[] {
	const checks = step === "failed"
		? FAILED_PR_CHECKS
		: step === "repairing"
			? RERUNNING_PR_CHECKS
			: PASSED_PR_CHECKS;
	const prEvent = createPullRequestEvent({
		checks,
		mergeState: "blocked",
		reviewDecision: "review-required",
		updatedAtMs: STORY_EPOCH_MS - (step === "complete" ? 820_000 : 900_000),
	});
	return withWorkItemLifecycle([
		prEvent,
		FAILED_CI_EVENT,
		...(step === "failed" ? [] : [REPAIR_EVENT]),
		...(step === "complete" ? [CI_PASSED_EVENT] : []),
	]);
}

function approvalEvent(
	id: string,
	actor: typeof PRIYA_NARAYANAN_ACTOR,
	minutesAgo: number,
): StaticTimelineEvent {
	return {
		id,
		kind: "event",
		actor,
		segments: [
			{ type: "text", text: "approved PR #1847" },
		],
		createdAtMs: STORY_EPOCH_MS - minutesAgo * 60_000,
	};
}

function reviewersForApprovalStep(
	approvalStep: JiraGoldenJourneysV3ApprovalStep,
): StoryPullRequestReviewers {
	return [
		{
			id: "priya-narayanan",
			name: "Priya Narayanan",
			avatarSrc: "/avatar-user/priya-hansra/color/asow-strategy-orange.png",
			status: approvalStep >= 1 ? "approved" : "pending",
		},
		{
			id: "jordan-lee",
			name: "Jordan Lee",
			avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			status: approvalStep >= 2 ? "approved" : "pending",
		},
	];
}

const MERGED_EVENT: StaticTimelineEvent = {
	id: "story-pr-merged",
	kind: "event",
	actor: GITHUB_ACTOR,
	icon: "pull-request",
	segments: [
		{ type: "text", text: "automatically merged PR #1847 after CI and 2 required approvals passed" },
		{ type: "lozenge", text: "Merged", variant: "success" },
	],
	createdAtMs: STORY_EPOCH_MS - 60_000,
};

function createApproveEvents(
	options: JiraGoldenJourneysV3StoryStateOptions,
): readonly StaticTimelineEvent[] {
	const approvalStep = options.approvalStep ?? 0;
	const ciStatus = options.ciStatus ?? "running";
	const approved = approvalStep === 2 && ciStatus === "passed";
	const merged = options.pullRequestMerged === true;
	return withWorkItemLifecycle([
		createPullRequestEvent({
			checks: checksForCiStatus(ciStatus),
			mergeState: merged ? "merged" : approved ? "ready" : "blocked",
			reviewDecision: approved ? "approved" : "review-required",
			reviewers: reviewersForApprovalStep(approvalStep),
			status: merged ? "Merged" : "Open",
			updatedAtMs: STORY_EPOCH_MS - 420_000,
		}),
		...(ciStatus === "passed" ? [CI_PASSED_EVENT] : []),
		...(approvalStep >= 1
			? [approvalEvent("story-priya-approved", PRIYA_NARAYANAN_ACTOR, 6)]
			: []),
		...(approvalStep >= 2
			? [approvalEvent("story-jordan-approved", JORDAN_LEE_ACTOR, 4)]
			: []),
		...(merged ? [MERGED_EVENT] : []),
	]);
}

function createReleaseEvents(options: JiraGoldenJourneysV3StoryStateOptions): readonly StaticTimelineEvent[] {
	const approvalStep = options.approvalStep ?? 0;
	const ciStatus = options.ciStatus ?? "running";
	const merged = options.pullRequestMerged === true;
	const ready = approvalStep === 2 && ciStatus === "passed";
	return withWorkItemLifecycle([
		createPullRequestEvent({
			checks: checksForCiStatus(ciStatus),
			mergeState: merged ? "merged" : ready ? "ready" : "blocked",
			reviewDecision: ready ? "approved" : "review-required",
			reviewers: reviewersForApprovalStep(approvalStep),
			status: merged ? "Merged" : "Open",
			updatedAtMs: STORY_EPOCH_MS - 120_000,
		}),
		...(ciStatus === "passed" ? [CI_PASSED_EVENT] : []),
		...(approvalStep >= 1
			? [approvalEvent("story-priya-approved", PRIYA_NARAYANAN_ACTOR, 6)]
			: []),
		...(approvalStep >= 2
			? [approvalEvent("story-jordan-approved", JORDAN_LEE_ACTOR, 4)]
			: []),
		...(merged ? [MERGED_EVENT] : []),
	]);
}

export function storyEventsForChapter(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
): readonly StaticTimelineEvent[] {
	switch (chapter) {
		case "terminal":
			return [];
		case "build":
			return withWorkItemLifecycle([
				createPullRequestEvent({
					checks: STARTED_PR_CHECKS,
					mergeState: "blocked",
					reviewDecision: "review-required",
					updatedAtMs: STORY_EPOCH_MS - 1_180_000,
				}),
			]);
		case "review":
			return createReviewEvents(options.reviewStep ?? "queued");
		case "fix":
			return createFixEvents(options.fixStep ?? "failed");
		case "approve":
			return createApproveEvents(options);
		case "release":
			return createReleaseEvents(options);
	}
}
