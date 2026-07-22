"use client";

import type { DiffLineAnnotation } from "@pierre/diffs";
import { MultiFileDiff } from "@pierre/diffs/react";
import { useMemo } from "react";

import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";

import type { ChangedFile, DiffLayout } from "../data/types";
import type {
	InlineCommentAnchor,
	InlineCommentDraft,
	InlineCommentSide,
	InlineReviewComment,
} from "../lib/inline-comments";
import { resolveInlineCommentLineText } from "../lib/inline-comments";
import {
	InlineCommentAnnotation,
	InlineCommentGutterButton,
	type InlineCommentAnnotationMetadata,
} from "./inline-comment-annotation";

interface DiffFileViewProps {
	file: ChangedFile;
	layout: DiffLayout;
	className?: string;
	drafts: readonly InlineCommentDraft[];
	comments: readonly InlineReviewComment[];
	onAddDraft: (anchor: InlineCommentAnchor) => void;
	onCancelDraft: (draftId: string) => void;
	onCommitDraft: (draftId: string) => void;
	onDeleteComment: (commentId: string) => void;
	onUpdateDraft: (draftId: string, body: string) => void;
}

const DIFF_TOP_INSET_CSS = `
[data-diffs-header] ~ [data-diff] [data-code] {
	padding-top: var(--diffs-gap-inline, var(--diffs-gap-fallback));
}
`;

export function DiffFileView({
	file,
	layout,
	className,
	drafts,
	comments,
	onAddDraft,
	onCancelDraft,
	onCommitDraft,
	onDeleteComment,
	onUpdateDraft,
}: Readonly<DiffFileViewProps>) {
	const { actualTheme } = useTheme();
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
	const handleAddComment = (side: InlineCommentSide, lineNumber: number) => {
		onAddDraft({
			fileId: file.id,
			filePath: file.path,
			side,
			lineNumber,
			lineText: resolveInlineCommentLineText(file, side, lineNumber),
		});
	};

	return (
		<MultiFileDiff<InlineCommentAnnotationMetadata>
			className={cn(className)}
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
			lineAnnotations={lineAnnotations}
			options={{
				diffStyle: layout,
				enableGutterUtility: true,
				lineHoverHighlight: "both",
				onLineNumberClick: ({ annotationSide, lineNumber }) => {
					handleAddComment(annotationSide, lineNumber);
				},
				theme: {
					light: "github-light",
					dark: "github-dark",
				},
				themeType: actualTheme,
				unsafeCSS: DIFF_TOP_INSET_CSS,
			}}
			renderAnnotation={({ metadata }) => (
				<InlineCommentAnnotation
					metadata={metadata}
					onCancelDraft={onCancelDraft}
					onCommitDraft={onCommitDraft}
					onDeleteComment={onDeleteComment}
					onUpdateDraft={onUpdateDraft}
				/>
			)}
			renderGutterUtility={(getHoveredLine) => (
				<InlineCommentGutterButton
					getHoveredLine={getHoveredLine}
					onAddComment={handleAddComment}
				/>
			)}
		/>
	);
}
