import type {
	JiraInsightCheckpoint,
	JiraInsightSource,
	JiraInsightsSnapshot,
} from "@/components/blocks/jira-insights/jira-insights-types";

import type {
	JiraGoldenJourneysV3StoryChapter,
	JiraGoldenJourneysV3StoryStateOptions,
} from "./story-model";

const CLAUDE_SESSION_ID = "story-session-claude-code";
const PULL_REQUEST_IDENTITY = "https://github.com/eevensoh/vpk-rovo/pull/1847";
const STORY_EPOCH_MS = Date.UTC(2026, 7, 5, 2, 0, 0);

const DESCRIPTION_SOURCE: JiraInsightSource = {
	id: "work-item-description",
	kind: "work-item-section",
	label: "Work item description",
	sectionId: "description",
};
const IMPLEMENTATION_SOURCE: JiraInsightSource = {
	id: "implementation-activity",
	entryId: "story-changed-files",
	kind: "activity-entry",
	label: "Implementation activity",
	brandName: "claude",
};
const CLAUDE_SESSION_SOURCE: JiraInsightSource = {
	id: "claude-session",
	kind: "agent-session",
	label: "Claude Code session",
	sessionId: CLAUDE_SESSION_ID,
	brandName: "claude",
};
const PULL_REQUEST_SOURCE: JiraInsightSource = {
	id: "pull-request-1847",
	identity: PULL_REQUEST_IDENTITY,
	kind: "pull-request",
	label: "PR #1847",
	brandName: "github",
};
const GITHUB_SOURCE: JiraInsightSource = {
	id: "github-pr-1847",
	href: "https://github.com/eevensoh/vpk-rovo/pull/1847",
	kind: "external-link",
	label: "Open in GitHub",
	brandName: "github",
};

const BASE_CHECKPOINTS: readonly JiraInsightCheckpoint[] = [
	{
		id: "implementation-safeguards",
		title: "Guest checkout preserves existing safeguards",
		description: "The implementation keeps server-owned pricing, inventory, payment validation, and idempotent order creation while adding the guest path.",
		capturedAtMs: STORY_EPOCH_MS - 1_320_000,
		sources: [DESCRIPTION_SOURCE, IMPLEMENTATION_SOURCE],
	},
	{
		id: "delivery-path",
		title: "PR #1847 is the delivery path",
		description: "Claude opened the guest-checkout pull request, requested Priya and Jordan, and handed the change to CI.",
		capturedAtMs: STORY_EPOCH_MS - 1_180_000,
		sources: [CLAUDE_SESSION_SOURCE, PULL_REQUEST_SOURCE, GITHUB_SOURCE],
	},
];

const CI_BLOCKER: JiraInsightCheckpoint = {
	id: "ci-blocker",
	title: "Delivery-address nullability blocks merge",
	description: "Lint and typecheck found that deliveryAddress could still be null before order creation; unit and browser checks remained green.",
	capturedAtMs: STORY_EPOCH_MS - 1_080_000,
	sources: [
		{ id: "ci-failure-activity", entryId: "story-ci-failed", kind: "activity-entry", label: "Failed CI activity", brandName: "github" },
		PULL_REQUEST_SOURCE,
	],
};

const DELIVERY_ADDRESS_REPAIR: JiraInsightCheckpoint = {
	id: "delivery-address-repair",
	title: "Narrow deliveryAddress before order creation",
	description: "The repair establishes a non-null delivery address before the order is created and pushes commit 9f32a6d to the existing pull request.",
	capturedAtMs: STORY_EPOCH_MS - 960_000,
	sources: [
		{ id: "repair-activity", entryId: "story-ci-repair", kind: "activity-entry", label: "Repair activity", brandName: "claude" },
		CLAUDE_SESSION_SOURCE,
	],
};

const CI_RERUN_GREEN: JiraInsightCheckpoint = {
	id: "ci-rerun-green",
	title: "The CI rerun is green",
	description: "All required checks pass after the delivery-address repair, leaving teammate approvals as the remaining merge gate.",
	capturedAtMs: STORY_EPOCH_MS - 840_000,
	sources: [
		{ id: "ci-passed-activity", entryId: "story-ci-passed", kind: "activity-entry", label: "Passed CI activity", brandName: "github" },
		PULL_REQUEST_SOURCE,
	],
};

const APPROVAL_GATE_SATISFIED: JiraInsightCheckpoint = {
	id: "approval-gate-satisfied",
	title: "Both required reviewers approved",
	description: "Priya Narayanan and Jordan Lee approved PR #1847, satisfying the final protected-merge requirement.",
	capturedAtMs: STORY_EPOCH_MS - 240_000,
	sources: [PULL_REQUEST_SOURCE],
};

const MERGE_COMPLETE: JiraInsightCheckpoint = {
	id: "merge-complete",
	title: "PR #1847 merged and SHOP-4821 is Done",
	description: "Auto-merge completed after green CI and both required approvals, closing the delivery loop for guest checkout.",
	capturedAtMs: STORY_EPOCH_MS - 60_000,
	sources: [
		{ id: "merge-activity", entryId: "story-pr-merged", kind: "activity-entry", label: "Merge activity", brandName: "github" },
		PULL_REQUEST_SOURCE,
	],
};

function summaryForStory(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
): string {
	if (chapter === "release" && options.pullRequestMerged) {
		return "Guest checkout merged automatically after CI passed and both required reviewers approved PR #1847. SHOP-4821 is Done.";
	}
	if (chapter === "approve" && options.approvalStep === 2 && options.ciStatus === "passed") {
		return "Guest checkout is implemented, CI is green, and both required approvals are complete. PR #1847 is ready to merge.";
	}
	if (chapter === "fix" && options.fixStep === "complete") {
		return "The delivery-address nullability issue is repaired and the CI rerun is green. PR #1847 now needs two approvals.";
	}
	if (chapter === "fix" && options.fixStep === "repairing") {
		return "Claude narrowed deliveryAddress before order creation and pushed the repair. CI is rerunning on PR #1847.";
	}
	if (chapter === "review" && options.reviewStep === "failed") {
		return "Guest checkout is implemented, but PR #1847 is blocked by a nullable deliveryAddress path found by lint and typecheck.";
	}
	return "Guest checkout is implemented with existing checkout safeguards preserved. PR #1847 is open, reviewers are requested, and CI is underway.";
}

export function createJiraGoldenJourneysV3InsightsSnapshot(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
	revision: string | number,
): JiraInsightsSnapshot {
	const checkpoints: JiraInsightCheckpoint[] = chapter === "terminal" ? [] : [...BASE_CHECKPOINTS];
	const reviewFailed = chapter === "review" && options.reviewStep === "failed";
	const reachedFix = chapter === "fix" || chapter === "approve" || chapter === "release";
	const repairStarted = reachedFix && (chapter !== "fix" || options.fixStep !== "failed");
	const ciPassed = (chapter === "fix" && options.fixStep === "complete")
		|| ((chapter === "approve" || chapter === "release") && options.ciStatus === "passed");
	const approvalsComplete = (chapter === "approve" || chapter === "release")
		&& options.approvalStep === 2
		&& options.ciStatus === "passed";

	if (reviewFailed || reachedFix) checkpoints.push(CI_BLOCKER);
	if (repairStarted) checkpoints.push(DELIVERY_ADDRESS_REPAIR);
	if (ciPassed) checkpoints.push(CI_RERUN_GREEN);
	if (approvalsComplete) checkpoints.push(APPROVAL_GATE_SATISFIED);
	if (chapter === "release" && options.pullRequestMerged) checkpoints.push(MERGE_COMPLETE);

	return {
		summary: summaryForStory(chapter, options),
		checkpoints,
		unreadCheckpointIds: checkpoints.map((checkpoint) => checkpoint.id),
		revision,
	};
}
