import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { StaticTimelineEvent } from "@/components/blocks/jira-work-item/data/session-state";
import type { JiraForYouAgent, JiraForYouStatus } from "@/components/projects/jira-for-you/jira-for-you-types";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

import { RAW_STORY_DESCRIPTION } from "./story-context";

export type JiraGoldenJourneysV3StoryChapter =
	| "terminal"
	| "build"
	| "review"
	| "fix"
	| "approve"
	| "release";

/** Review starts with the PR's initial CI run and ends on one actionable failure. */
export type JiraGoldenJourneysV3ReviewStep =
	| "queued"
	| "running"
	| "unit-passed"
	| "settling"
	| "failed";

/** Auto-fix is the only transition out of Fix's failed state. */
export type JiraGoldenJourneysV3FixStep = "failed" | "repairing" | "complete";
export type JiraGoldenJourneysV3ApprovalStep = 0 | 1 | 2;
export type JiraGoldenJourneysV3CiStatus = "running" | "failed" | "repairing" | "passed";
export type JiraGoldenJourneysV3MergeStatus = "disabled" | "blocked" | "queued" | "merged";
export type JiraGoldenJourneysV3MergeBlocker = "ci" | "approvals" | null;

export interface JiraGoldenJourneysV3StoryStateOptions {
	reviewStep?: JiraGoldenJourneysV3ReviewStep;
	fixStep?: JiraGoldenJourneysV3FixStep;
	approvalStep?: JiraGoldenJourneysV3ApprovalStep;
	ciStatus?: JiraGoldenJourneysV3CiStatus;
	autoFixEnabled?: boolean;
	autoMergeEnabled?: boolean;
	pullRequestMerged?: boolean;
}

export interface JiraGoldenJourneysV3Reviewer {
	id: "priya-narayanan" | "jordan-lee";
	name: "Priya Narayanan" | "Jordan Lee";
	avatarSrc: string;
}

export interface JiraGoldenJourneysV3ReviewerApproval extends JiraGoldenJourneysV3Reviewer {
	approved: boolean;
}

export interface JiraGoldenJourneysV3MergeGate {
	ciPassed: boolean;
	approvalsSatisfied: boolean;
	canMerge: boolean;
	blocker: JiraGoldenJourneysV3MergeBlocker;
}

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS = [
	{ label: "Terminal", value: "terminal" },
	{ label: "Build", value: "build" },
	{ label: "Review", value: "review" },
	{ label: "Fix", value: "fix" },
	{ label: "Approve", value: "approve" },
	{ label: "Release", value: "release" },
] as const satisfies readonly { label: string; value: JiraGoldenJourneysV3StoryChapter }[];

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_ITEM_ID = "shop-4821-guest-checkout";
export const JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY = "SHOP-4821";
export const JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY = "https://github.com/eevensoh/vpk-rovo/pull/1847";
export const JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_NUMBER = 1847;
export const JIRA_GOLDEN_JOURNEYS_V3_REQUIRED_APPROVAL_COUNT = 2;
export const JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID = "story-session-claude-code";
export const JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SCRIPT_ID = "shop-4821-claude-delivery";

export const STORY_EPOCH_MS = Date.UTC(2026, 7, 5, 2, 0, 0);
export const STORY_CREATED_AT_MS = STORY_EPOCH_MS - 3_600_000;

export const STORY_STATUS_BY_CHAPTER = {
	terminal: "In progress",
	build: "In progress",
	review: "In review",
	fix: "In progress",
	approve: "In review",
	release: "Done",
} as const satisfies Record<JiraGoldenJourneysV3StoryChapter, JiraForYouStatus>;

export const WORK_ITEM_STATUS_BY_CHAPTER = {
	terminal: "In progress",
	build: "In progress",
	review: "In review",
	fix: "In progress",
	approve: "In review",
	release: "Done",
} as const satisfies Record<JiraGoldenJourneysV3StoryChapter, string>;

export const CLAUDE_SESSION_TITLE_BY_CHAPTER = {
	terminal: "Implement guest checkout from the local terminal",
	build: "Hand off PR #1847 and monitor CI",
	review: "Monitor the initial CI run",
	fix: "Auto-fix the failed CI check",
	approve: "Wait for required teammate approvals",
	release: "Confirm the rules-gated merge",
} as const satisfies Record<JiraGoldenJourneysV3StoryChapter, string>;

export const JIRA_GOLDEN_JOURNEYS_V3_STATUS_PHASES = [
	"To do",
	"In progress",
	"In review",
	"Done",
] as const satisfies readonly string[];

export type JiraGoldenJourneysV3StoryAgent = Omit<JiraForYouAgent, "avatarSrc" | "id"> & {
	id: string;
} & (
	| { avatarSrc: string; brandName?: ThirdPartyLogoName }
	| { avatarSrc?: string; brandName: ThirdPartyLogoName }
);

export const CLAUDE_CODE = {
	id: "claude-code",
	name: "Claude Code",
	brandName: "claude",
} satisfies JiraGoldenJourneysV3StoryAgent;

export const STORY_AGENTS = [CLAUDE_CODE] as const;
export const STORY_AGENT_BY_ID = new Map(STORY_AGENTS.map((agent) => [agent.id, agent]));

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_COMPOSER_AGENTS: readonly AgentSelectorAgent[] = [
	{
		id: CLAUDE_CODE.id,
		name: CLAUDE_CODE.name,
		byline: "Coding agent by Anthropic",
		brandName: "claude",
	},
];

export const JIRA_GOLDEN_JOURNEYS_V3_REVIEWERS = [
	{
		id: "priya-narayanan",
		name: "Priya Narayanan",
		avatarSrc: "/avatar-user/priya-hansra/color/asow-strategy-orange.png",
	},
	{
		id: "jordan-lee",
		name: "Jordan Lee",
		avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
	},
] as const satisfies readonly JiraGoldenJourneysV3Reviewer[];

export function createJiraGoldenJourneysV3ReviewerApprovals(
	approvalStep: JiraGoldenJourneysV3ApprovalStep,
): readonly JiraGoldenJourneysV3ReviewerApproval[] {
	return JIRA_GOLDEN_JOURNEYS_V3_REVIEWERS.map((reviewer, index) => ({
		...reviewer,
		approved: index < approvalStep,
	}));
}

export function evaluateJiraGoldenJourneysV3MergeGate(
	ciStatus: JiraGoldenJourneysV3CiStatus,
	approvalCount: number,
): JiraGoldenJourneysV3MergeGate {
	const ciPassed = ciStatus === "passed";
	const approvalsSatisfied = approvalCount >= JIRA_GOLDEN_JOURNEYS_V3_REQUIRED_APPROVAL_COUNT;
	return {
		ciPassed,
		approvalsSatisfied,
		canMerge: ciPassed && approvalsSatisfied,
		blocker: !ciPassed ? "ci" : !approvalsSatisfied ? "approvals" : null,
	};
}

export function resolveJiraGoldenJourneysV3MergeStatus({
	approvalCount,
	autoMergeEnabled,
	ciStatus,
	pullRequestMerged,
}: Readonly<{
	approvalCount: number;
	autoMergeEnabled: boolean;
	ciStatus: JiraGoldenJourneysV3CiStatus;
	pullRequestMerged: boolean;
}>): JiraGoldenJourneysV3MergeStatus {
	if (pullRequestMerged) return "merged";
	if (!autoMergeEnabled) return "disabled";
	return evaluateJiraGoldenJourneysV3MergeGate(ciStatus, approvalCount).canMerge
		? "queued"
		: "blocked";
}

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE: WorkItemData = {
	code: JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY,
	title: "Add guest checkout to the storefront",
	createdAtMs: STORY_CREATED_AT_MS,
	description: RAW_STORY_DESCRIPTION,
	status: "In progress",
	priority: "High",
	assignee: {
		name: "Venn",
		avatarUrl: "/avatar-user/venn/venn.png",
	},
	reporter: {
		name: "Maya Chen",
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
	},
	parent: { code: "SHOP-4800", title: "Reduce storefront checkout abandonment" },
	labels: ["storefront", "checkout", "feature"],
	startDate: "Aug 5, 2026",
	dueDate: "Aug 19, 2026",
};

export const CLAUDE_CODE_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-claude-code",
	name: CLAUDE_CODE.name,
	kind: "agent",
	brandName: CLAUDE_CODE.brandName,
};

export const GITHUB_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-github",
	name: "GitHub",
	kind: "app",
	brandName: "github",
};

export const PRIYA_NARAYANAN_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-priya-narayanan",
	name: "Priya Narayanan",
	kind: "person",
	avatarSrc: JIRA_GOLDEN_JOURNEYS_V3_REVIEWERS[0].avatarSrc,
};

export const JORDAN_LEE_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-jordan-lee",
	name: "Jordan Lee",
	kind: "person",
	avatarSrc: JIRA_GOLDEN_JOURNEYS_V3_REVIEWERS[1].avatarSrc,
};
