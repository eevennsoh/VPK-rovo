"use client";

import type { DiffLineAnnotation, SelectedLineRange } from "@pierre/diffs";
import { MultiFileDiff } from "@pierre/diffs/react";
import { useMemo, useReducer, useRef, type PointerEvent } from "react";

import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";

import type { ChangedFile, DiffLayout } from "../data/types";
import type {
	InlineCommentAnchor,
	InlineCommentDraft,
	InlineCommentSide,
	InlineReviewComment,
} from "../lib/inline-comments";
import {
	normalizeInlineCommentLineRange,
	resolveInlineCommentLineText,
} from "../lib/inline-comments";
import {
	InlineCommentAnnotation,
	InlineCommentGutterButton,
	type InlineCommentAnnotationMetadata,
} from "./inline-comment-annotation";

interface DiffFileViewProps {
	file: ChangedFile;
	layout: DiffLayout;
	className?: string;
	readOnly?: boolean;
	drafts: readonly InlineCommentDraft[];
	comments: readonly InlineReviewComment[];
	onAddDraft: (anchor: InlineCommentAnchor) => void;
	onCancelDraft: (draftId: string) => void;
	onCommitDraft: (draftId: string) => void;
	onDeleteComment: (commentId: string) => void;
	onUpdateComment: (commentId: string, body: string) => void;
	onUpdateDraft: (draftId: string, body: string) => void;
}

const DIFF_UNSAFE_CSS = `
[data-diffs-header] ~ [data-diff] [data-code] {
	padding-top: var(--diffs-gap-inline, var(--diffs-gap-fallback));
}

[data-column-number]:has([data-gutter-utility-slot]) [data-line-number-content] {
	visibility: hidden;
}

[data-column-number]:has([data-gutter-utility-slot]) [data-gutter-utility-slot] {
	z-index: 5;
}
`;

export function DiffFileView({
	file,
	layout,
	className,
	readOnly = false,
	drafts,
	comments,
	onAddDraft,
	onCancelDraft,
	onCommitDraft,
	onDeleteComment,
	onUpdateComment,
	onUpdateDraft,
}: Readonly<DiffFileViewProps>) {
	const { actualTheme } = useTheme();
	const [selectionRevision, resetSelection] = useReducer((revision: number) => revision + 1, 0);
	const lastCommittedSelection = useRef<Readonly<{
		fileId: string;
		layout: DiffLayout;
		range: SelectedLineRange;
	}> | null>(null);
	const selectionStartedFromGutter = useRef(false);
	const lineAnnotations = useMemo<DiffLineAnnotation<InlineCommentAnnotationMetadata>[]>(
		() => [
			...drafts
				.filter((draft) => draft.fileId === file.id)
				.map((draft) => ({
					lineNumber: draft.lineNumber,
					side: draft.side,
					metadata: { kind: "draft" as const, draft },
				})),
			...comments
				.filter((comment) => comment.fileId === file.id)
				.map((comment) => ({
					lineNumber: comment.lineNumber,
					side: comment.side,
					metadata: { kind: "comment" as const, comment },
				})),
		],
		[comments, drafts, file.id],
	);
	const handleAddComment = (range: SelectedLineRange) => {
		const side = range.side ?? range.endSide;
		const isMixedSideRange = range.endSide !== undefined && range.endSide !== side;
		const normalizedRange = normalizeInlineCommentLineRange(range.start, range.end);
		if (!side || isMixedSideRange || !normalizedRange) {
			lastCommittedSelection.current = null;
			resetSelection();
			return;
		}

		onAddDraft({
			fileId: file.id,
			filePath: file.path,
			side,
			...normalizedRange,
			lineText: resolveInlineCommentLineText(
				file,
				side,
				normalizedRange.startLineNumber,
				normalizedRange.lineNumber,
			),
		});
		lastCommittedSelection.current = null;
		resetSelection();
	};
	const handleKeyboardAddComment = (side: InlineCommentSide, lineNumber: number) => {
		const committedSelection = lastCommittedSelection.current;
		const range = committedSelection?.fileId === file.id && committedSelection.layout === layout
			? committedSelection.range
			: { start: lineNumber, end: lineNumber, side };

		handleAddComment(range);
	};
	const handleLineSelected = (range: SelectedLineRange | null) => {
		const shouldAddComment = selectionStartedFromGutter.current;
		selectionStartedFromGutter.current = false;
		lastCommittedSelection.current = range
			? { fileId: file.id, layout, range }
			: null;

		if (shouldAddComment && range) {
			handleAddComment(range);
		}
	};
	const handleGutterPointerSelect = (
		event: PointerEvent<HTMLButtonElement>,
		line: Readonly<{ lineNumber: number; side: InlineCommentSide }>,
	) => {
		if (event.pointerType === "mouse" && event.button !== 0) {
			return;
		}

		// Pierre 1.2.12 makes its native gutter callback mutually exclusive with
		// a custom utility. Forward only the initial down to the assigned line
		// number so Pierre still owns move, up, selection, and cancellation.
		const slotWrapper = event.currentTarget.closest<HTMLElement>(
			'[slot="gutter-utility-slot"]',
		);
		const numberElement = slotWrapper?.assignedSlot?.parentElement?.parentElement;
		const PointerEventConstructor = numberElement?.ownerDocument.defaultView?.PointerEvent;
		if (!(numberElement instanceof HTMLElement) || !PointerEventConstructor) {
			selectionStartedFromGutter.current = false;
			handleKeyboardAddComment(line.side, line.lineNumber);
			return;
		}

		selectionStartedFromGutter.current = true;
		numberElement.dispatchEvent(new PointerEventConstructor("pointerdown", {
			bubbles: true,
			button: event.button,
			buttons: event.buttons,
			cancelable: true,
			clientX: event.clientX,
			clientY: event.clientY,
			composed: true,
			ctrlKey: event.ctrlKey,
			metaKey: event.metaKey,
			pointerId: event.pointerId,
			pointerType: event.pointerType,
			shiftKey: lastCommittedSelection.current !== null,
		}));
	};
	const handlePointerCancel = () => {
		lastCommittedSelection.current = null;
		selectionStartedFromGutter.current = false;
		resetSelection();
	};

	return (
		<div className={cn("min-w-0", className)} onPointerCancelCapture={handlePointerCancel}>
			<MultiFileDiff<InlineCommentAnnotationMetadata>
				key={`${file.id}:${layout}:${selectionRevision}`}
				// disableFileHeader breaks light-mode rendering entirely (rows never mount);
				// a null custom header removes the built-in header without that code path.
				renderCustomHeader={() => null}
				oldFile={{
					name: file.path,
					contents: file.oldContents,
					lang: file.language,
				}}
				newFile={{
					name: file.path,
					contents: file.newContents,
					lang: file.language,
				}}
				lineAnnotations={readOnly ? [] : lineAnnotations}
				options={{
					collapsedContextThreshold: 6,
					diffStyle: layout,
					enableGutterUtility: !readOnly,
					enableLineSelection: !readOnly,
					hunkSeparators: "line-info",
					lineHoverHighlight: "both",
					onLineSelected: readOnly ? undefined : handleLineSelected,
					theme: {
						light: "github-light",
						dark: "github-dark",
					},
					themeType: actualTheme,
					unsafeCSS: DIFF_UNSAFE_CSS,
				}}
				renderAnnotation={readOnly ? undefined : ({ metadata }) => (
					<InlineCommentAnnotation
						key={metadata.kind === "draft" ? metadata.draft.id : metadata.comment.id}
						metadata={metadata}
						onCancelDraft={onCancelDraft}
						onCommitDraft={onCommitDraft}
						onDeleteComment={onDeleteComment}
						onUpdateComment={onUpdateComment}
						onUpdateDraft={onUpdateDraft}
					/>
				)}
				renderGutterUtility={readOnly ? undefined : (getHoveredLine) => (
					<InlineCommentGutterButton
						getHoveredLine={getHoveredLine}
						onAddComment={handleKeyboardAddComment}
						onPointerSelect={handleGutterPointerSelect}
					/>
				)}
			/>
		</div>
	);
}
