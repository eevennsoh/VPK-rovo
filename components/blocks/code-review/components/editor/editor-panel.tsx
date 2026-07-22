"use client";

import type { ChangedFile, DiffLayout } from "../../data/types";
import type {
	InlineCommentAnchor,
	InlineCommentDraft,
	InlineReviewComment,
} from "../../lib/inline-comments";
import { EditorDiff } from "./editor-diff";
import { EditorExplorer } from "./editor-explorer";

interface EditorPanelProps {
	file: ChangedFile;
	files: readonly ChangedFile[];
	layout: DiffLayout;
	selectedFileId: string;
	drafts: readonly InlineCommentDraft[];
	comments: readonly InlineReviewComment[];
	onAddDraft: (anchor: InlineCommentAnchor) => void;
	onCancelDraft: (draftId: string) => void;
	onCommitDraft: (draftId: string) => void;
	onDeleteComment: (commentId: string) => void;
	onFileSelect: (fileId: string) => void;
	onLayoutChange: (layout: DiffLayout) => void;
	onUpdateDraft: (draftId: string, body: string) => void;
}

export function EditorPanel({
	file,
	files,
	layout,
	selectedFileId,
	drafts,
	comments,
	onAddDraft,
	onCancelDraft,
	onCommitDraft,
	onDeleteComment,
	onFileSelect,
	onLayoutChange,
	onUpdateDraft,
}: Readonly<EditorPanelProps>) {
	return (
		<section className="grid size-full min-h-0 grid-cols-[240px_minmax(0,1fr)]">
			<EditorExplorer files={files} onFileSelect={onFileSelect} selectedFileId={selectedFileId} />
			<EditorDiff
				comments={comments}
				drafts={drafts}
				file={file}
				layout={layout}
				onAddDraft={onAddDraft}
				onCancelDraft={onCancelDraft}
				onCommitDraft={onCommitDraft}
				onDeleteComment={onDeleteComment}
				onLayoutChange={onLayoutChange}
				onUpdateDraft={onUpdateDraft}
			/>
		</section>
	);
}
