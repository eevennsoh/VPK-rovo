"use client";

import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import BranchIcon from "@atlaskit/icon/core/branch";

import { RovoCanvasArtefactIdentity } from "@/components/blocks/rovo-canvas/page";
import { IconTile } from "@/components/ui/icon-tile";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { MetadataPathLink, MetadataPathValue } from "@/components/ui/metadata-path-link";

import type { CodeReviewWorkItem } from "../data/types";

interface CodeReviewCanvasHeaderProps {
	additions: number;
	deletions: number;
	workItem: CodeReviewWorkItem;
}

export function CodeReviewCanvasHeader({
	additions,
	deletions,
	workItem,
}: Readonly<CodeReviewCanvasHeaderProps>): React.ReactElement {
	return (
		<div className="flex min-w-0 items-center gap-2 px-2">
			<IconTile
				icon={<AngleBracketsIcon label="" size="small" />}
				label="Code review"
				size="medium"
				variant="blueBold"
			/>
			<RovoCanvasArtefactIdentity
				label={`${workItem.key}: ${workItem.title}`}
				metadata={
					<span className="flex min-w-0 items-center gap-1">
						<GithubLogo aria-hidden borderless label="" size="xxsmall" />
						<MetadataPathLink segmented title={workItem.repoName}>
							<MetadataPathValue path={workItem.repoName} />
						</MetadataPathLink>
						<span aria-hidden="true">·</span>
						<span className="flex min-w-0 items-center gap-1">
							<BranchIcon label="" size="small" />
							<span className="shrink-0 text-text">{workItem.localBranchName}</span>
							<span aria-hidden="true">→</span>
							<MetadataPathLink segmented title={workItem.branchName}>
								<MetadataPathValue path={workItem.branchName} />
							</MetadataPathLink>
						</span>
						<span aria-hidden="true">·</span>
						<span className="ml-auto flex shrink-0 items-center gap-1">
							<span className="text-text-success">+{additions}</span>
							<span className="text-text-danger">-{deletions}</span>
						</span>
					</span>
				}
			/>
		</div>
	);
}
