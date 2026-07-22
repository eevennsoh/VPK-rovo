"use client";

import { useState } from "react";

import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";
import { Button } from "@/components/ui/button";

import { CHANGED_FILES, EDITOR_FILE } from "../data/changed-files";
import { CODE_REVIEW_WORK_ITEM } from "../data/work-item";
import type { ChangedFile, CodeReviewWorkItem, DiffLayout } from "../data/types";
import { CodeReviewCanvasHeader } from "./code-review-canvas-header";
import { CodeReviewCanvasRightRail } from "./code-review-canvas-right-rail";
import { EditorPanel } from "./editor/editor-panel";

export interface CodeReviewProps {
	workItem?: CodeReviewWorkItem;
	files?: readonly ChangedFile[];
	className?: string;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function CodeReview({
	workItem = CODE_REVIEW_WORK_ITEM,
	files = CHANGED_FILES,
	className,
	open,
	defaultOpen = false,
	onOpenChange,
}: Readonly<CodeReviewProps>) {
	const isDefaultFileSet = files === CHANGED_FILES;
	const { additions, deletions } = files.reduce(
		(totals, file) => ({
			additions: totals.additions + file.additions,
			deletions: totals.deletions + file.deletions,
		}),
		{ additions: 0, deletions: 0 },
	);
	// The bundled EDITOR_FILE ("ipc.mp.test.ts") is a fixture-only demo tab, distinct
	// from the default CHANGED_FILES set; custom `files` drive the editor entirely on their own.
	const editorFiles = isDefaultFileSet ? [...files, EDITOR_FILE] : files;
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const isControlled = open !== undefined;
	const isCanvasOpen = open ?? internalOpen;
	const setCanvasOpen = (nextOpen: boolean) => {
		if (!isControlled) {
			setInternalOpen(nextOpen);
		}
		onOpenChange?.(nextOpen);
	};
	const [editorLayout, setEditorLayout] = useState<DiffLayout>("unified");
	const [editorFileId, setEditorFileId] = useState(
		() => (editorFiles.find((file) => file.inExplorer) ?? editorFiles[0])?.id ?? EDITOR_FILE.id,
	);
	const selectedEditorFile =
		editorFiles.find((file) => file.id === editorFileId) ?? editorFiles[0] ?? EDITOR_FILE;

	return (
		<>
			{!isControlled && !isCanvasOpen ? (
				<div className="flex h-full items-center justify-center bg-surface">
					<Button onClick={() => setCanvasOpen(true)}>Open code review</Button>
				</div>
			) : null}
			<RovoCanvas
				className={className}
				open={isCanvasOpen}
				onOpenChange={setCanvasOpen}
				kind="script"
				title={`${workItem.key}: ${workItem.title}`}
				headerStart={<CodeReviewCanvasHeader additions={additions} deletions={deletions} workItem={workItem} />}
				primaryActionLabel="Create pull request"
				artefactLabel={`${workItem.key}: ${workItem.title}`}
				artefactMetadata={`${workItem.repoName} · ${workItem.localBranchName} → ${workItem.branchName}`}
				showArtefactIdentity={false}
				views={[
					{
						id: "code",
						label: "Code",
						toolbar: "none",
						content: (
							<EditorPanel
								file={selectedEditorFile}
								layout={editorLayout}
								onFileSelect={setEditorFileId}
								onLayoutChange={setEditorLayout}
								selectedFileId={editorFileId}
							/>
						),
					},
				]}
				rightRail={
					<CodeReviewCanvasRightRail
						workItem={workItem}
						onClose={() => setCanvasOpen(false)}
					/>
				}
			/>
		</>
	);
}
