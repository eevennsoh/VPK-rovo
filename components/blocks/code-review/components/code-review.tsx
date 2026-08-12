"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import type { RovoAgentProfile } from "@/app/data/directory/agents";
import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CHANGED_FILES } from "../data/changed-files";
import { CODE_REVIEW_WORK_ITEM } from "../data/work-item";
import type { ChangedFile, CodeReviewCommit, CodeReviewWorkItem, DiffLayout } from "../data/types";
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
	/** PR commits for the changes-picker Commits submenu; omit on canvas demos. */
	commits?: readonly CodeReviewCommit[];
	explorerRootLabel?: string;
	defaultSelectedFileId?: string;
	/** Render the editor surface inline (no RovoCanvas chrome). */
	embedded?: boolean;
	/** Grow with content for parent scrollports; used by embedded work-item embeds. */
	expandContent?: boolean;
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
	/** Fired whenever committed inline comments change (not drafts). */
	onInlineCommentsChange?: (comments: readonly InlineReviewComment[]) => void;
	/** Seed committed inline comments when the surface remounts (e.g. reopening a PR). */
	initialInlineComments?: readonly InlineReviewComment[];
	onReviewSubmit?: (submission: Readonly<{
		comments: readonly InlineReviewComment[];
		prompt: string;
	}>) => void;
}

export function CodeReview({
	workItem = CODE_REVIEW_WORK_ITEM,
	files = CHANGED_FILES,
	commits,
	explorerRootLabel,
	defaultSelectedFileId,
	embedded = false,
	expandContent = false,
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
	onInlineCommentsChange,
	initialInlineComments,
	onReviewSubmit,
}: Readonly<CodeReviewProps>) {
	const { additions, deletions } = files.reduce(
		(totals, file) => ({
			additions: totals.additions + file.additions,
			deletions: totals.deletions + file.deletions,
		}),
		{ additions: 0, deletions: 0 },
	);
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
	const [inlineComments, setInlineComments] = useState(() => (
		initialInlineComments && initialInlineComments.length > 0
			? { drafts: EMPTY_INLINE_COMMENT_STATE.drafts, comments: initialInlineComments }
			: EMPTY_INLINE_COMMENT_STATE
	));
	const inlineCommentsRef = useRef(inlineComments);
	const nextInlineCommentId = useRef(initialInlineComments?.length ?? 0);
	const applyInlineComments = useCallback((
		updater: (state: typeof EMPTY_INLINE_COMMENT_STATE) => typeof EMPTY_INLINE_COMMENT_STATE,
	) => {
		const previous = inlineCommentsRef.current;
		const next = updater(previous);
		inlineCommentsRef.current = next;
		setInlineComments(next);
		if (next.comments !== previous.comments) {
			onInlineCommentsChange?.(next.comments);
		}
	}, [onInlineCommentsChange]);
	const handleAddDraft = useCallback((anchor: InlineCommentAnchor) => {
		nextInlineCommentId.current += 1;
		applyInlineComments((state) => createInlineCommentDraft(state, {
			...anchor,
			body: "",
			id: `inline-comment-${nextInlineCommentId.current}`,
		}));
	}, [applyInlineComments]);
	const handleCancelDraft = useCallback((draftId: string) => {
		applyInlineComments((state) => cancelInlineCommentDraft(state, draftId));
	}, [applyInlineComments]);
	const handleCommitDraft = useCallback((draftId: string) => {
		applyInlineComments((state) => commitInlineCommentDraft(state, draftId));
	}, [applyInlineComments]);
	const handleDeleteComment = useCallback((commentId: string) => {
		applyInlineComments((state) => removeInlineComment(state, commentId));
	}, [applyInlineComments]);
	const handleUpdateComment = useCallback((commentId: string, body: string) => {
		applyInlineComments((state) => updateInlineComment(state, commentId, body));
	}, [applyInlineComments]);
	const handleRemoveAllComments = useCallback(() => {
		applyInlineComments((state) => removeAllInlineComments(state));
	}, [applyInlineComments]);
	const handleUpdateDraft = useCallback((draftId: string, body: string) => {
		applyInlineComments((state) => updateInlineCommentDraft(state, draftId, body));
	}, [applyInlineComments]);

	const editorPanel = (
		<EditorPanel
			comments={inlineComments.comments}
			commits={commits}
			defaultSelectedFileId={defaultSelectedFileId}
			drafts={inlineComments.drafts}
			expandContent={expandContent}
			explorerRootLabel={explorerRootLabel}
			files={files}
			layout={editorLayout}
			onAddDraft={handleAddDraft}
			onCancelDraft={handleCancelDraft}
			onCommitDraft={handleCommitDraft}
			onDeleteComment={handleDeleteComment}
			onUpdateComment={handleUpdateComment}
			onLayoutChange={setEditorLayout}
			onUpdateDraft={handleUpdateDraft}
		/>
	);

	if (embedded) {
		if (files.length === 0) {
			return (
				<div
					className={cn(
						"flex min-w-0 items-center justify-center rounded-md border border-border bg-surface px-4 py-8 text-sm text-text-subtle",
						className,
					)}
					data-code-review-embedded
				>
					No changed files.
				</div>
			);
		}

		return (
			<section
				aria-label="Changed files review"
				className={cn(
					"min-w-0 rounded-md border border-border bg-surface",
					/*
					 * expandContent sticks toolbar/tree in a parent scrollport —
					 * overflow-hidden would trap sticky inside this shell. Corner
					 * bleed is handled via rounded-[inherit] on EditorPanel chrome.
					 */
					expandContent ? undefined : "overflow-hidden",
					className,
				)}
				data-code-review-embedded
			>
				{editorPanel}
			</section>
		);
	}

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
						content: editorPanel,
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
