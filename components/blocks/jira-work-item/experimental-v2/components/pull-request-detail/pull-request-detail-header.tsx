import type { RefObject } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header";

import { mapPullRequestHeaderMergeState } from "../../lib/map-pull-request-header-merge-state";
import type { PullRequestDetailData } from "../../lib/pull-request-detail-data";

interface PullRequestDetailHeaderProps {
	data: PullRequestDetailData;
	scrollContainerRef: RefObject<HTMLElement | null>;
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
