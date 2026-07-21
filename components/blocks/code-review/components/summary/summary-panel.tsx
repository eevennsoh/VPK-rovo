"use client";

import BranchIcon from "@atlaskit/icon/core/branch";
import GrowDiagonalIcon from "@atlaskit/icon/core/grow-diagonal";

import { Button } from "@/components/ui/button";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { ScrollArea } from "@/components/ui/scroll-area";

import type {
	ChangedFile,
	ChangeSet,
	CodeReviewWorkItem,
	DiffLayout,
} from "../../data/types";
import { SummaryFileAccordion } from "./summary-file-accordion";
import { SummaryRail } from "./summary-rail";
import { SummaryToolbar } from "./summary-toolbar";

interface SummaryPanelProps {
	workItem: CodeReviewWorkItem;
	files: readonly ChangedFile[];
	changeSets: readonly ChangeSet[];
	layout: DiffLayout;
	selectedChangeSetId: string | null;
	searchQuery: string;
	onLayoutChange: (layout: DiffLayout) => void;
	onScreenChange: (screen: "summary" | "editor") => void;
	onSearchQueryChange: (query: string) => void;
	onSelectedChangeSetIdChange: (id: string | null) => void;
}

export function SummaryPanel({
	workItem,
	files,
	changeSets,
	layout,
	selectedChangeSetId,
	searchQuery,
	onLayoutChange,
	onScreenChange,
	onSearchQueryChange,
	onSelectedChangeSetIdChange,
}: Readonly<SummaryPanelProps>) {
	return (
		<section className="flex h-full min-h-0 flex-col">
			<header className="flex h-[76px] shrink-0 items-center justify-between gap-4 border-b border-border px-4">
				<div className="min-w-0">
					<h1 className="text-base font-semibold text-text">Code summary</h1>
					<div className="mt-1 flex items-center gap-3 text-xs text-text-subtle">
						<span className="flex items-center gap-1">
							<GithubLogo aria-hidden borderless label="" size="xxsmall" />
							{workItem.repoName}
						</span>
						<span className="flex items-center gap-1">
							<BranchIcon label="" size="small" />
							{workItem.branchName}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button onClick={() => onScreenChange("editor")} variant="outline">
						Edit code
					</Button>
					<Button aria-label="Expand code summary" size="icon-compact" variant="outline">
						<GrowDiagonalIcon label="" size="small" />
					</Button>
				</div>
			</header>
			<div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)]">
				<SummaryRail
					changeSets={changeSets}
					onSelect={onSelectedChangeSetIdChange}
					selectedChangeSetId={selectedChangeSetId}
				/>
				<div className="flex min-h-0 min-w-0 flex-col">
					<SummaryToolbar
						layout={layout}
						onLayoutChange={onLayoutChange}
						onSearchQueryChange={onSearchQueryChange}
						searchQuery={searchQuery}
					/>
					<ScrollArea className="min-h-0 flex-1">
						{files.length === 0 ? (
							<div className="flex min-h-40 items-center justify-center text-sm text-text-subtle">
								No files match
							</div>
						) : (
							files.map((file) => (
								<SummaryFileAccordion file={file} key={file.id} layout={layout} />
							))
						)}
					</ScrollArea>
				</div>
			</div>
		</section>
	);
}
