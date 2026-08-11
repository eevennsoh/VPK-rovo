"use client";

import AddIcon from "@atlaskit/icon/core/add";
import type { GetHoveredLineResult } from "@pierre/diffs";
import {
	useState,
	type KeyboardEvent,
	type MouseEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
} from "react";

import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputTextarea,
} from "@/components/ui-custom/prompt-input";
import { composerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { Button } from "@/components/ui/button";

import type {
	InlineCommentDraft,
	InlineCommentSide,
	InlineReviewComment,
} from "../lib/inline-comments";
import { formatInlineCommentLineLabel } from "../lib/inline-comments";

export type InlineCommentAnnotationMetadata =
	| { kind: "draft"; draft: InlineCommentDraft }
	| { kind: "comment"; comment: InlineReviewComment };

interface InlineCommentGutterButtonProps {
	getHoveredLine: () => GetHoveredLineResult<"diff"> | undefined;
	onAddComment: (side: InlineCommentSide, lineNumber: number) => void;
	onPointerSelect: (
		event: ReactPointerEvent<HTMLButtonElement>,
		line: GetHoveredLineResult<"diff">,
	) => void;
}

export function InlineCommentGutterButton({
	getHoveredLine,
	onAddComment,
	onPointerSelect,
}: Readonly<InlineCommentGutterButtonProps>) {
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		const PointerEventConstructor = event.currentTarget.ownerDocument.defaultView?.PointerEvent;
		const pointerType = PointerEventConstructor && event.nativeEvent instanceof PointerEventConstructor
			? event.nativeEvent.pointerType
			: "";
		if (
			event.detail !== 0
			|| pointerType.length > 0
		) {
			return;
		}

		const hoveredLine = getHoveredLine();
		if (hoveredLine) {
			onAddComment(hoveredLine.side, hoveredLine.lineNumber);
		}
	};
	const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
		const hoveredLine = getHoveredLine();
		if (hoveredLine) {
			onPointerSelect(event, hoveredLine);
		}
	};

	return (
		<Button
			aria-label="Add inline comment"
			className="relative z-10 mr-2 size-5 rounded-sm border-0 bg-surface-overlay p-0 text-icon-subtle shadow-2xl hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed"
			data-testid="inline-comment-gutter-button"
			onClick={handleClick}
			onPointerDown={handlePointerDown}
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

interface InlineCommentEditorSurfaceProps {
	ariaLabel: string;
	body: string;
	children: ReactNode;
	editorKey?: string;
	kind: "comment" | "draft";
	lineLabel: string;
	onChange: (body: string) => void;
	onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
	onSubmit: () => void;
}

function InlineCommentEditorSurface({
	ariaLabel,
	body,
	children,
	editorKey,
	kind,
	lineLabel,
	onChange,
	onKeyDown,
	onSubmit,
}: Readonly<InlineCommentEditorSurfaceProps>) {
	return (
		<div
			className="min-w-0 bg-surface-raised px-3 pb-3 pt-2 font-sans text-text"
			data-inline-comment-kind={kind}
			onKeyDown={onKeyDown}
			onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => event.stopPropagation()}
		>
			<div className="mb-2 text-xs font-semibold text-text-subtlest">
				Comment on {lineLabel.toLowerCase()}
			</div>
			<PromptInput
				className="min-h-[101px] w-full rounded-xl border border-border bg-surface px-3 pb-3 pt-4"
				onSubmit={onSubmit}
			>
				<PromptInputBody>
					<PromptInputTextarea
						aria-label={ariaLabel}
						autoFocus
						className={composerTextareaClassName}
						enableDirectoryAutocomplete={false}
						enableSuggestionMenus={false}
						key={editorKey}
						onChange={(event) => onChange(event.currentTarget.value)}
						placeholder=""
						value={body}
					/>
				</PromptInputBody>
				<PromptInputFooter className="mt-3 justify-end px-0 pb-0 pt-0">
					{children}
				</PromptInputFooter>
			</PromptInput>
		</div>
	);
}

function InlineCommentDraftEditor({
	draft,
	onCancel,
	onChange,
	onCommit,
}: Readonly<InlineCommentDraftEditorProps>) {
	const canCommit = draft.body.trim().length > 0;
	const lineLabel = formatInlineCommentLineLabel(draft);

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			onCancel(draft.id);
		}
	};

	return (
		<InlineCommentEditorSurface
			ariaLabel={`Comment on ${lineLabel.toLowerCase()}`}
			body={draft.body}
			kind="draft"
			lineLabel={lineLabel}
			onChange={(body) => onChange(draft.id, body)}
			onKeyDown={handleKeyDown}
			onSubmit={() => {
				if (canCommit) onCommit(draft.id);
			}}
		>
			<Button onClick={() => onCancel(draft.id)} type="button" variant="ghost">
				Cancel
			</Button>
			<Button disabled={!canCommit} type="submit" variant="outline">
				Comment
			</Button>
		</InlineCommentEditorSurface>
	);
}

interface InlineCommentViewProps {
	comment: InlineReviewComment;
	onDelete: (commentId: string) => void;
	onUpdate: (commentId: string, body: string) => void;
}

function InlineCommentView({
	comment,
	onDelete,
	onUpdate,
}: Readonly<InlineCommentViewProps>) {
	const [body, setBody] = useState(comment.body);
	const lineLabel = formatInlineCommentLineLabel(comment);
	const trimmedBody = body.trim();
	const isEditing = body !== comment.body;
	const canUpdate = isEditing && trimmedBody.length > 0;

	const handleCancel = () => setBody(comment.body);
	const handleUpdate = () => {
		if (canUpdate) {
			onUpdate(comment.id, trimmedBody);
			setBody(trimmedBody);
		}
	};
	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape" && isEditing) {
			event.preventDefault();
			event.stopPropagation();
			handleCancel();
		}
	};

	return (
		<InlineCommentEditorSurface
			ariaLabel={`Comment on ${lineLabel.toLowerCase()}`}
			body={body}
			editorKey={comment.body}
			kind="comment"
			lineLabel={lineLabel}
			onChange={setBody}
			onKeyDown={handleKeyDown}
			onSubmit={handleUpdate}
		>
			{isEditing ? (
				<>
					<Button onClick={handleCancel} type="button" variant="ghost">
						Cancel
					</Button>
					<Button disabled={!canUpdate} type="submit" variant="outline">
						Update
					</Button>
				</>
			) : (
				<Button
					aria-label={`Delete comment on ${comment.filePath}, ${lineLabel.toLowerCase()}`}
					onClick={() => onDelete(comment.id)}
					type="button"
					variant="outline"
				>
					Delete
				</Button>
			)}
		</InlineCommentEditorSurface>
	);
}

interface InlineCommentAnnotationProps {
	metadata: InlineCommentAnnotationMetadata;
	onCancelDraft: (draftId: string) => void;
	onCommitDraft: (draftId: string) => void;
	onDeleteComment: (commentId: string) => void;
	onUpdateComment: (commentId: string, body: string) => void;
	onUpdateDraft: (draftId: string, body: string) => void;
}

export function InlineCommentAnnotation({
	metadata,
	onCancelDraft,
	onCommitDraft,
	onDeleteComment,
	onUpdateComment,
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
		<InlineCommentView
			comment={metadata.comment}
			onDelete={onDeleteComment}
			onUpdate={onUpdateComment}
		/>
	);
}
