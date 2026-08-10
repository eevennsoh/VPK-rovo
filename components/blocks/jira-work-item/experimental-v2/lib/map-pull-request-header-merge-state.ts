import type { PullRequestHeaderMergeState } from "@/components/blocks/pull-request-header";

import type { PullRequestMergeState } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-detail-data";

/** Maps domain PR merge status onto the shared header Merge button labels. */
export function mapPullRequestHeaderMergeState(
	mergeState: PullRequestMergeState,
): PullRequestHeaderMergeState {
	switch (mergeState) {
		case "conflicts":
			return "merge-conflicts";
		case "blocked":
			return "checks-running";
		case "ready":
		case "merged":
			return "ready";
		default: {
			const _exhaustive: never = mergeState;
			return _exhaustive;
		}
	}
}
