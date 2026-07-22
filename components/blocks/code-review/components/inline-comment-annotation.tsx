"use client";

import AddIcon from "@atlaskit/icon/core/add";
import DeleteIcon from "@atlaskit/icon/core/delete";
import type { GetHoveredLineResult } from "@pierre/diffs";
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type {
	InlineCommentDraft,
	InlineCommentSide,
	InlineReviewComment,
} from "../lib/inline-comments";

export type InlineCommentAnnotationMetadata =
	| { kind: "draft"; draft: InlineCommentDraft }
	| { kind: "comment"; comment: InlineReviewComment };

interface InlineCommentGutterButtonProps {
	getHoveredLine: () => GetHoveredLineResult<"diff"> | undefined;
	onAddComment: (side: InlineCommentSide, lineNumber: number) => void;
}

export function InlineCommentGutterButton({
	getHoveredLine,
	onAddComment,
}: Readonly<InlineCommentGutterButtonProps>) {
	const handleClick = () => {
		const hoveredLine = getHoveredLine();
		if (hoveredLine) {
			onAddComment(hoveredLine.side, hoveredLine.lineNumber);
		}
	};

	return (
		<Button
			aria-label="Add inline comment"
			className="size-5 rounded-sm p-0"
			data-testid="inline-comment-gutter-button"
			onClick={handleClick}
			size="icon-compact"
			title="Add inline comment"
		>
			<AddIcon label="" size="small" />
		</Button>
	);
}

interface InlineCommentDraftEditorProps {
	draft: InlineCommentDraft;
	onCancel: (draftId: string) => void;
	onChange: (draftId: string, body: string) => void;
	onCommit: (draftId: string) => void;
}

function InlineCommentDraftEditor({
	draft,
	onCancel,
	onChange,
	onCommit,
}: Readonly<InlineCommentDraftEditorProps>) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const canCommit = draft.body.trim().length > 0;
	const sideLabel = draft.side === "additions" ? "new" : "old";

	useEffect(() => {
		const frame = requestAnimationFrame(() => textareaRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, []);

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Escape") {
			event.preventDefault();
			onCancel(draft.id);
			return;
		}

		if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && canCommit) {
			event.preventDefault();
			onCommit(draft.id);
		}
	};

	return (
		<div
			className="min-w-0 bg-surface-raised px-3 py-2 font-sans text-text"
			data-inline-comment-kind="draft"
			onPointerDown={(event: PointerEvent<HTMLDivElement>) => event.stopPropagation()}
		>
			<div className="mb-2 text-xs font-semibold text-text-subtle">Local comment</div>
			<Textarea
				ref={textareaRef}
				aria-label={`Comment on ${draft.filePath}, ${sideLabel} side, line ${draft.lineNumber}`}
				className="min-h-20 resize-y bg-bg-input font-sans text-sm"
				onChange={(event) => onChange(draft.id, event.currentTarget.value)}
				onKeyDown={handleKeyDown}
				placeholder="Add a comment about this line"
				value={draft.body}
			/>
			<div className="mt-2 flex justify-end gap-2">
				<Button onClick={() => onCancel(draft.id)} size="compact" variant="ghost">
					Cancel
				</Button>
				<Button disabled={!canCommit} onClick={() => onCommit(draft.id)} size="compact">
					Comment
				</Button>
			</div>
		</div>
	);
}

interface InlineCommentViewProps {
	comment: InlineReviewComment;
	onDelete: (commentId: string) => void;
}

function InlineCommentView({ comment, onDelete }: Readonly<InlineCommentViewProps>) {
	const sideLabel = comment.side === "additions" ? "new" : "old";

	return (
		<div
			className="group/comment min-w-0 bg-surface-raised px-3 py-2 font-sans text-text"
			data-inline-comment-kind="comment"
			onPointerDown={(event: PointerEvent<HTMLDivElement>) => event.stopPropagation()}
		>
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs font-semibold text-text-subtle">Local comment</span>
				<Button
					aria-label={`Delete comment on ${comment.filePath}, ${sideLabel} side, line ${comment.lineNumber}`}
					className="opacity-70 group-hover/comment:opacity-100"
					onClick={() => onDelete(comment.id)}
					size="icon-compact"
					variant="ghost"
				>
					<DeleteIcon label="" size="small" />
				</Button>
			</div>
			<p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p>
		</div>
	);
}

interface InlineCommentAnnotationProps {
	metadata: InlineCommentAnnotationMetadata;
	onCancelDraft: (draftId: string) => void;
	onCommitDraft: (draftId: string) => void;
	onDeleteComment: (commentId: string) => void;
	onUpdateDraft: (draftId: string, body: string) => void;
}

export function InlineCommentAnnotation({
	metadata,
	onCancelDraft,
	onCommitDraft,
	onDeleteComment,
	onUpdateDraft,
}: Readonly<InlineCommentAnnotationProps>) {
	return metadata.kind === "draft" ? (
		<InlineCommentDraftEditor
			draft={metadata.draft}
			onCancel={onCancelDraft}
			onChange={onUpdateDraft}
			onCommit={onCommitDraft}
		/>
	) : (
		<InlineCommentView comment={metadata.comment} onDelete={onDeleteComment} />
	);
}
