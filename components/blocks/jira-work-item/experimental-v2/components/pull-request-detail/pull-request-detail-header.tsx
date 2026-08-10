import type { RefObject } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header";

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
			authorName={data.authorName}
			authorAvatarSrc={data.authorAvatarSrc}
			baseBranch={data.baseBranch}
			headBranch={data.headBranch}
			repository={data.repository}
			additions={data.additions}
			deletions={data.deletions}
			updatedTime={data.updatedTime}
			url={data.url}
			scrollContainerRef={scrollContainerRef}
			data-jira-work-item-pull-request-detail-header
		/>
	);
}
