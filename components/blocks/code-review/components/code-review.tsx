"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import type { RovoAgentProfile } from "@/app/data/directory/agents";
import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { CHANGED_FILES, EDITOR_FILE } from "../data/changed-files";
import { CODE_REVIEW_WORK_ITEM } from "../data/work-item";
import type { ChangedFile, CodeReviewWorkItem, DiffLayout } from "../data/types";
import {
	EMPTY_INLINE_COMMENT_STATE,
	cancelInlineCommentDraft,
	commitInlineCommentDraft,
	createInlineCommentDraft,
	removeAllInlineComments,
	removeInlineComment,
	updateInlineComment,
	updateInlineCommentDraft,
	type InlineCommentAnchor,
	type InlineReviewComment,
} from "../lib/inline-comments";
import { CodeReviewCanvasHeader } from "./code-review-canvas-header";
import {
	CodeReviewCanvasRightRail,
	type CodeReviewAgentVariant,
} from "./code-review-canvas-right-rail";
import { EditorPanel } from "./editor/editor-panel";

export interface CodeReviewProps {
	workItem?: CodeReviewWorkItem;
	files?: readonly ChangedFile[];
	explorerRootLabel?: string;
	className?: string;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	primaryActionLabel?: string;
	onPrimaryAction?: () => void;
	showPrimaryActionMenu?: boolean;
	primaryActionMenu?: ReactNode;
	agentVariant?: CodeReviewAgentVariant;
	agentProfile?: RovoAgentProfile;
	hideComposerSourceAndModelControls?: boolean;
	onReviewSubmit?: (submission: Readonly<{
		comments: readonly InlineReviewComment[];
		prompt: string;
	}>) => void;
}

export function CodeReview({
	workItem = CODE_REVIEW_WORK_ITEM,
	files = CHANGED_FILES,
	explorerRootLabel,
	className,
	open,
	defaultOpen = false,
	onOpenChange,
	primaryActionLabel = "Create pull request",
	onPrimaryAction,
	showPrimaryActionMenu = true,
	primaryActionMenu,
	agentVariant = "custom",
	agentProfile,
	hideComposerSourceAndModelControls = false,
	onReviewSubmit,
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
	const [inlineComments, setInlineComments] = useState(EMPTY_INLINE_COMMENT_STATE);
	const nextInlineCommentId = useRef(0);
	const [editorFileId, setEditorFileId] = useState(
		() => (editorFiles.find((file) => file.inExplorer) ?? editorFiles[0])?.id ?? EDITOR_FILE.id,
	);
	const selectedEditorFile =
		editorFiles.find((file) => file.id === editorFileId) ?? editorFiles[0] ?? EDITOR_FILE;
	const handleAddDraft = useCallback((anchor: InlineCommentAnchor) => {
		nextInlineCommentId.current += 1;
		setInlineComments((state) => createInlineCommentDraft(state, {
			...anchor,
			body: "",
			id: `inline-comment-${nextInlineCommentId.current}`,
		}));
	}, []);
	const handleCancelDraft = useCallback((draftId: string) => {
		setInlineComments((state) => cancelInlineCommentDraft(state, draftId));
	}, []);
	const handleCommitDraft = useCallback((draftId: string) => {
		setInlineComments((state) => commitInlineCommentDraft(state, draftId));
	}, []);
	const handleDeleteComment = useCallback((commentId: string) => {
		setInlineComments((state) => removeInlineComment(state, commentId));
	}, []);
	const handleUpdateComment = useCallback((commentId: string, body: string) => {
		setInlineComments((state) => updateInlineComment(state, commentId, body));
	}, []);
	const handleRemoveAllComments = useCallback(() => {
		setInlineComments((state) => removeAllInlineComments(state));
	}, []);
	const handleUpdateDraft = useCallback((draftId: string, body: string) => {
		setInlineComments((state) => updateInlineCommentDraft(state, draftId, body));
	}, []);

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
				primaryActionLabel={primaryActionLabel}
				onPrimaryAction={onPrimaryAction}
				primaryActionMenu={showPrimaryActionMenu ? (
					primaryActionMenu ?? (
						<>
							<DropdownMenuItem>Create draft pull request</DropdownMenuItem>
							<DropdownMenuItem>Commit &amp; Push</DropdownMenuItem>
						</>
					)
				) : undefined}
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
								comments={inlineComments.comments}
								drafts={inlineComments.drafts}
								explorerRootLabel={explorerRootLabel}
								file={selectedEditorFile}
								files={editorFiles}
								layout={editorLayout}
								onAddDraft={handleAddDraft}
								onCancelDraft={handleCancelDraft}
								onCommitDraft={handleCommitDraft}
								onDeleteComment={handleDeleteComment}
								onUpdateComment={handleUpdateComment}
								onFileSelect={setEditorFileId}
								onLayoutChange={setEditorLayout}
								onUpdateDraft={handleUpdateDraft}
								selectedFileId={editorFileId}
							/>
						),
					},
				]}
				rightRail={
					<CodeReviewCanvasRightRail
						agentVariant={agentVariant}
						agentProfile={agentProfile}
						comments={inlineComments.comments}
						hideComposerSourceAndModelControls={hideComposerSourceAndModelControls}
						workItem={workItem}
						onClose={() => setCanvasOpen(false)}
						onRemoveAllComments={handleRemoveAllComments}
						onReviewSubmit={onReviewSubmit}
					/>
				}
			/>
		</>
	);
}
