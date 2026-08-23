"use client";

import {
	ContextBarPullRequest,
	type ContextBarPullRequestCiCheck,
	type ContextBarPullRequestCiStatus,
	type ContextBarPullRequestMergeState,
} from "@/components/ui-custom/context-bar";

import {
	JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY,
	JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_NUMBER,
} from "./data/story-model";

export type PullRequestContextBarCiStatus = ContextBarPullRequestCiStatus;
export type PullRequestContextBarMergeState = ContextBarPullRequestMergeState;
export type PullRequestContextBarCiCheck = ContextBarPullRequestCiCheck;

export interface PullRequestContextBarProps {
	additions: number;
	approvalsCurrent: number;
	approvalsRequired: number;
	autoFixEnabled: boolean;
	autoMergeEnabled: boolean;
	branch: string;
	ciChecks: readonly PullRequestContextBarCiCheck[];
	ciStatus: PullRequestContextBarCiStatus;
	ciSummary: string;
	deletions: number;
	mergeState: PullRequestContextBarMergeState;
	onAutoFixChange: (enabled: boolean) => void;
	onAutoMergeChange: (enabled: boolean) => void;
	onDismiss: () => void;
	repository: string;
}

const STORY_PULL_REQUEST_TITLE = "Implement guest checkout without account creation";
const STORY_PULL_REQUEST_AUTHOR = {
	name: "Venn",
	avatarUrl: "/avatar-user/venn/venn.png",
} as const;
const STORY_PULL_REQUEST_TARGET_BRANCH = "main";
const STORY_PULL_REQUEST_FILES_CHANGED = 12;

/** v3 adapter: story PR identity + CI/merge data on the shared ContextBar PR variation. */
export function PullRequestContextBar({
	additions,
	approvalsCurrent,
	approvalsRequired,
	autoFixEnabled,
	autoMergeEnabled,
	branch,
	ciChecks,
	ciStatus,
	ciSummary,
	deletions,
	mergeState,
	onAutoFixChange,
	onAutoMergeChange,
	onDismiss,
	repository,
}: Readonly<PullRequestContextBarProps>) {
	return (
		<ContextBarPullRequest
			additions={additions}
			approvalsCurrent={approvalsCurrent}
			approvalsRequired={approvalsRequired}
			author={STORY_PULL_REQUEST_AUTHOR}
			branch={branch}
			ci={{
				autoFixEnabled,
				autoMergeEnabled,
				checks: ciChecks,
				onAutoFixChange,
				onAutoMergeChange,
				status: ciStatus,
				summary: ciSummary,
			}}
			deletions={deletions}
			dismissLabel="Dismiss pull request context"
			filesChanged={STORY_PULL_REQUEST_FILES_CHANGED}
			href={JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY}
			mergeState={mergeState}
			number={JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_NUMBER}
			onDismiss={onDismiss}
			repository={repository}
			status={mergeState === "merged" ? "Merged" : "Open"}
			targetBranch={STORY_PULL_REQUEST_TARGET_BRANCH}
			title={STORY_PULL_REQUEST_TITLE}
		/>
	);
}
