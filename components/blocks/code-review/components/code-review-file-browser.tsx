"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import type { ChangedFile, DiffLayout } from "../data/types";
import { EditorDiff } from "./editor/editor-diff";
import { EditorExplorer } from "./editor/editor-explorer";

const EMPTY_ITEMS = [] as const;
const NOOP = () => {};

export interface CodeReviewFileBrowserProps {
	className?: string;
	defaultSelectedFileId?: string;
	files: readonly ChangedFile[];
	rootLabel?: string;
}

export function CodeReviewFileBrowser({
	className,
	defaultSelectedFileId,
	files,
	rootLabel = "Changed files",
}: Readonly<CodeReviewFileBrowserProps>) {
	const [layout, setLayout] = useState<DiffLayout>("unified");
	const [selectedFileId, setSelectedFileId] = useState(
		() => files.find((file) => file.id === defaultSelectedFileId)?.id ?? files[0]?.id ?? "",
	);
	const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0];

	if (!selectedFile) {
		return (
			<div
				className={cn("flex h-full min-h-0 min-w-0 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm text-text-subtle", className)}
				data-code-review-file-browser
			>
				No changed files.
			</div>
		);
	}

	return (
		<section
			aria-label="Changed files review"
			className={cn("@container/code-review-file-browser h-full min-h-0 min-w-0 overflow-hidden rounded-md border border-border bg-surface", className)}
			data-code-review-file-browser
		>
			<div className="grid size-full min-h-0 grid-cols-1 grid-rows-[minmax(9rem,32%)_minmax(0,1fr)] @[640px]/code-review-file-browser:grid-cols-[240px_minmax(0,1fr)] @[640px]/code-review-file-browser:grid-rows-1">
				<EditorExplorer
					className="border-b border-r-0 @[640px]/code-review-file-browser:border-b-0 @[640px]/code-review-file-browser:border-r"
					explorerRootLabel={rootLabel}
					files={files}
					includeDemoTree={false}
					onFileSelect={setSelectedFileId}
					selectedFileId={selectedFile.id}
					showSearch={false}
				/>
				<EditorDiff
					comments={EMPTY_ITEMS}
					drafts={EMPTY_ITEMS}
					file={selectedFile}
					layout={layout}
					onAddDraft={NOOP}
					onCancelDraft={NOOP}
					onCommitDraft={NOOP}
					onDeleteComment={NOOP}
					onLayoutChange={setLayout}
					onUpdateComment={NOOP}
					onUpdateDraft={NOOP}
					readOnly
				/>
			</div>
		</section>
	);
}
