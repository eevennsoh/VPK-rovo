"use client";

import { useState, type RefObject } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header";
import type { PullRequestHeaderMergeState } from "@/components/blocks/pull-request-header";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/context-metadata-rail";

import type {
	PullRequestDetailData,
	PullRequestMergeState,
} from "../../lib/pull-request-detail-data";
import { PULL_REQUEST_CHECKS_SECTION_ID } from "./pull-request-details-rail";

interface PullRequestDetailHeaderProps {
	data: PullRequestDetailData;
	scrollContainerRef: RefObject<HTMLElement | null>;
}

/** Maps domain PR merge status onto the shared header Merge split-button labels. */
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
	const [autoMerge, setAutoMerge] = useState(true);
	const { requestExpandPullRequestSection, setPanelView } = useMetadataRail();

	return (
		<PullRequestHeader
			number={data.number}
			title={data.title}
			status={data.status}
			baseBranch={data.baseBranch}
			headBranch={data.headBranch}
			repository={data.repository}
			mergeState={mapPullRequestHeaderMergeState(data.mergeState)}
			autoMerge={autoMerge}
			onAutoMergeChange={setAutoMerge}
			onMergeClick={() => undefined}
			onChecksRunningClick={() => {
				setPanelView("details");
				requestExpandPullRequestSection(PULL_REQUEST_CHECKS_SECTION_ID);
			}}
			onMoreActionsClick={() => undefined}
			scrollContainerRef={scrollContainerRef}
			className="rounded-xl border p-4"
			data-jira-work-item-pull-request-detail-header
			style={{ borderRadius: 12 }}
		/>
	);
}
