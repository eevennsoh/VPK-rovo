"use client";

import BranchIcon from "@atlaskit/icon/core/branch";
import GrowDiagonalIcon from "@atlaskit/icon/core/grow-diagonal";

import { Button } from "@/components/ui/button";
import { GithubLogo } from "@/components/ui/logo-third-party";

import type { ChangedFile, CodeReviewWorkItem, DiffLayout } from "../../data/types";
import { EditorDiff } from "./editor-diff";
import { EditorExplorer } from "./editor-explorer";

interface EditorPanelProps {
	workItem: CodeReviewWorkItem;
	file: ChangedFile;
	layout: DiffLayout;
	selectedFileId: string;
	onFileSelect: (fileId: string) => void;
	onLayoutChange: (layout: DiffLayout) => void;
	onScreenChange: (screen: "summary" | "editor") => void;
}

export function EditorPanel({
	workItem,
	file,
	layout,
	selectedFileId,
	onFileSelect,
	onLayoutChange,
	onScreenChange,
}: Readonly<EditorPanelProps>) {
	return (
		<section className="flex h-full min-h-0 flex-col">
			<header className="flex h-[76px] shrink-0 items-center justify-between gap-4 border-b border-border px-4">
				<div className="min-w-0">
					<h1 className="text-base font-semibold text-text">Code editor</h1>
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
					<Button onClick={() => onScreenChange("summary")} variant="outline">
						View code summary
					</Button>
					<Button aria-label="Expand code editor" size="icon-compact" variant="outline">
						<GrowDiagonalIcon label="" size="small" />
					</Button>
				</div>
			</header>
			<div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)]">
				<EditorExplorer onFileSelect={onFileSelect} selectedFileId={selectedFileId} />
				<EditorDiff file={file} layout={layout} onLayoutChange={onLayoutChange} />
			</div>
		</section>
	);
}
