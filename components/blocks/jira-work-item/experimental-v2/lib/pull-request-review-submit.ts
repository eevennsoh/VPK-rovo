import type { PullRequestReviewVerdict } from "@/components/blocks/pull-request-review";
import type { SonnerToastAppearance } from "@/components/ui/sonner";

import type { PullRequestReviewer } from "./pull-request-detail-data";

/** Guided-review demo: the signed-in reviewer is Priya Narayanan. */
export const GUIDED_REVIEW_CURRENT_REVIEWER_ID = "priya-narayanan";

export const PULL_REQUEST_REVIEW_TOASTER_ID = "jira-work-item-pull-request-review";

export interface PullRequestReviewToastCopy {
	appearance: SonnerToastAppearance;
	title: string;
}

/** Map a submitted review verdict to the current reviewer's Approvers status. */
export function mapReviewVerdictToReviewerStatus(
	verdict: PullRequestReviewVerdict,
): PullRequestReviewer["status"] {
	switch (verdict) {
		case "approve":
			return "approved";
		case "request-changes":
			return "changes-requested";
		case "comment":
			return "commented";
		default: {
			const _exhaustive: never = verdict;
			return _exhaustive;
		}
	}
}

/** Action-specific sonner copy for a successful PR review submit. */
export function mapReviewVerdictToToastCopy(
	verdict: PullRequestReviewVerdict,
): PullRequestReviewToastCopy {
	switch (verdict) {
		case "approve":
			return { appearance: "success", title: "Approved" };
		case "request-changes":
			return { appearance: "error", title: "Changes requested" };
		case "comment":
			return { appearance: "info", title: "Comment submitted" };
		default: {
			const _exhaustive: never = verdict;
			return _exhaustive;
		}
	}
}

/** Overlay the demo current-reviewer's status onto the Approvers list. */
export function applyCurrentReviewerStatus(
	reviewers: readonly PullRequestReviewer[],
	status: PullRequestReviewer["status"] | undefined,
): readonly PullRequestReviewer[] {
	if (!status) return reviewers;
	return reviewers.map((reviewer) => (
		reviewer.id === GUIDED_REVIEW_CURRENT_REVIEWER_ID
			? { ...reviewer, status }
			: reviewer
	));
}
