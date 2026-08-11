import type { PullRequestReviewProps } from "@/components/blocks/pull-request-review/components/pull-request-review-types";

/**
 * Mirrors the guided-review state the reviewer reaches at the end of a diff
 * pass: every changed file marked reviewed, verdict not yet chosen.
 */
export const DEMO_PULL_REQUEST_REVIEW: Pick<
	PullRequestReviewProps,
	"placeholder" | "reviewedCount" | "reviewedTotal" | "title"
> = {
	title: "Review",
	reviewedCount: 3,
	reviewedTotal: 3,
	placeholder: "Leave a comment...",
};
