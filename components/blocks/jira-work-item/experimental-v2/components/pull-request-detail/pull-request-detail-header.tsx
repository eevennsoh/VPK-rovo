import type { RefObject } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header";
import type { PullRequestHeaderMergeState } from "@/components/blocks/pull-request-header";

import type {
	PullRequestDetailData,
	PullRequestMergeState,
} from "../../lib/pull-request-detail-data";

interface PullRequestDetailHeaderProps {
	data: PullRequestDetailData;
	scrollContainerRef: RefObject<HTMLElement | null>;
}

/** Maps domain PR merge status onto the shared header Merge button labels. */
function mapPullRequestHeaderMergeState(
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

/** Thin adapter: maps PR detail data onto the shared Pull request header block. */
export function PullRequestDetailHeader({
	data,
	scrollContainerRef,
}: Readonly<PullRequestDetailHeaderProps>) {
	return (
		<PullRequestHeader
			number={data.number}
			title={data.title}
			status={data.status}
			baseBranch={data.baseBranch}
			headBranch={data.headBranch}
			repository={data.repository}
			mergeState={mapPullRequestHeaderMergeState(data.mergeState)}
			scrollContainerRef={scrollContainerRef}
			data-jira-work-item-pull-request-detail-header
		/>
	);
}
