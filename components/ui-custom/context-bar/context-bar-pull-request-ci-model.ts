import type { PullRequestCheck } from "@/components/blocks/pull-request/components/pull-request-checks-list";

export type ContextBarPullRequestCiStatus = "pending" | "running" | "failed" | "passed";
export type ContextBarPullRequestMergeState = "disabled" | "blocked" | "queued" | "merged";
export type ContextBarPullRequestCiCheck = PullRequestCheck;

export interface ContextBarPullRequestCi {
	status: ContextBarPullRequestCiStatus;
	checks: readonly ContextBarPullRequestCiCheck[];
	summary: string;
	autoFixEnabled: boolean;
	autoMergeEnabled: boolean;
	onAutoFixChange: (enabled: boolean) => void;
	onAutoMergeChange: (enabled: boolean) => void;
	onFixCheck?: (checks: readonly ContextBarPullRequestCiCheck[]) => void;
}

const CI_STATUS_PRESENTATION = {
	pending: { iconClassName: "text-icon-subtle", label: "CI pending" },
	running: { iconClassName: "text-icon-warning", label: "CI running" },
	failed: { iconClassName: "text-icon-danger", label: "CI failed" },
	passed: { iconClassName: "text-icon-success", label: "CI passed" },
} satisfies Record<ContextBarPullRequestCiStatus, { iconClassName: string; label: string }>;

const MERGE_STATE_PRESENTATION = {
	disabled: {
		className: "bg-bg-neutral text-text-subtle",
		label: "Auto-merge off",
	},
	blocked: {
		className: "bg-bg-danger-subtler text-text-danger-bolder",
		label: "Auto-merge blocked",
	},
	queued: {
		className: "bg-bg-warning-subtler text-text-warning-bolder",
		label: "Auto-merge queued",
	},
	merged: {
		className: "bg-bg-success-subtler text-text-success-bolder",
		label: "Merged",
	},
} satisfies Record<ContextBarPullRequestMergeState, { className: string; label: string }>;

export function contextBarPullRequestCiPresentation(status: ContextBarPullRequestCiStatus) {
	return CI_STATUS_PRESENTATION[status];
}

export function contextBarPullRequestMergePresentation(state: ContextBarPullRequestMergeState) {
	return MERGE_STATE_PRESENTATION[state];
}
