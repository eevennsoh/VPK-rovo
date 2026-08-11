"use client";

import {
	CommentsComposerChip,
	type CommentsComposerChipItem,
} from "@/components/ui-custom/comments-composer-chip";

import type { InlineReviewComment } from "../lib/inline-comments";

interface InlineCommentsComposerChipProps {
	comments: readonly InlineReviewComment[];
	onRemoveAll: () => void;
}

function toChipItems(comments: readonly InlineReviewComment[]): CommentsComposerChipItem[] {
	return comments.map((comment) => ({
		id: comment.id,
		title: comment.filePath,
		subtitle: `Line ${comment.lineNumber}`,
		body: comment.body,
	}));
}

/** Code Review adapter around the shared comments composer chip. */
export function InlineCommentsComposerChip({
	comments,
	onRemoveAll,
}: Readonly<InlineCommentsComposerChipProps>) {
	return (
		<CommentsComposerChip
			comments={toChipItems(comments)}
			onRemoveAll={onRemoveAll}
			removeAllLabel="Remove all inline comments"
			testId="inline-comments-chip"
		/>
	);
}
