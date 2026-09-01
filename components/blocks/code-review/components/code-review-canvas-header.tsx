"use client";

import BranchIcon from "@atlaskit/icon/core/branch";
import TaskIcon from "@atlaskit/icon/core/task";

import { RovoCanvasArtefactIdentity } from "@/components/blocks/rovo-canvas/page";
import { IconTile } from "@/components/ui/icon-tile";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { MetadataPathLink, MetadataPathValue } from "@/components/ui/metadata-path-link";
import { token } from "@/lib/tokens";

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
				icon={<TaskIcon label="" color={token("color.icon.brand")} />}
				label="Task"
				size="medium"
				variant="blue"
			/>
			<RovoCanvasArtefactIdentity
				label={`${workItem.key}: ${workItem.title}`}
				metadata={
					<span className="flex min-w-0 items-center gap-1">
						<GithubLogo
							aria-hidden
							borderless
							label=""
							size="xxsmall"
						/>
						<MetadataPathLink segmented title={workItem.repoName}>
							<MetadataPathValue path={workItem.repoName} />
						</MetadataPathLink>
						<span aria-hidden="true">·</span>
						<span className="flex min-w-0 items-center gap-1">
							<BranchIcon label="" size="small" />
							<span className="shrink-0 text-text">{workItem.branchName}</span>
							<span aria-hidden="true">→</span>
							<MetadataPathLink segmented title={workItem.localBranchName}>
								<MetadataPathValue path={workItem.localBranchName} />
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
