"use client";

import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";

import { RovoCanvasArtefactIdentity } from "@/components/blocks/rovo-canvas/page";
import { IconTile } from "@/components/ui/icon-tile";
import { Lozenge } from "@/components/ui/lozenge";

import type { CodeReviewWorkItem } from "../data/types";

interface CodeReviewCanvasHeaderProps {
	workItem: CodeReviewWorkItem;
}

export function CodeReviewCanvasHeader({
	workItem,
}: Readonly<CodeReviewCanvasHeaderProps>): React.ReactElement {
	return (
		<div className="flex min-w-0 items-center gap-2 px-2">
			<IconTile
				icon={<AngleBracketsIcon label="" size="small" />}
				label="Code review"
				size="small"
				variant="blueBold"
			/>
			<RovoCanvasArtefactIdentity
				label={`${workItem.key} ${workItem.title}`}
				metadata={`${workItem.repoName} · ${workItem.branchName}`}
			/>
			<Lozenge className="shrink-0" variant="neutral">
				{workItem.environment}
			</Lozenge>
		</div>
	);
}
