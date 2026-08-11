import type { PullRequestReviewVerdict } from "@/components/blocks/pull-request-review/components/pull-request-review-types";

/**
 * Verdict options in the order the segmented control renders them, matching the
 * SCM review flow: comment first (the low-commitment default), then the two
 * decisions. Lives here rather than beside the control so that file exports a
 * component and nothing else — a mixed module breaks Fast Refresh state
 * preservation (`react-doctor/only-export-components`).
 */
export const PULL_REQUEST_REVIEW_VERDICTS: ReadonlyArray<{
	value: PullRequestReviewVerdict;
	label: string;
}> = [
	{ value: "comment", label: "Comment" },
	{ value: "approve", label: "Approve" },
	{ value: "request-changes", label: "Request changes" },
];
