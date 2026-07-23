import type { ChangedFile, CodeReviewWorkItem } from "../data/types";

export type InlineCommentSide = "additions" | "deletions";

export interface InlineCommentAnchor {
	fileId: string;
	filePath: string;
	side: InlineCommentSide;
	lineNumber: number;
	lineText: string;
}

export interface InlineCommentDraft extends InlineCommentAnchor {
	id: string;
	body: string;
}

export interface InlineReviewComment extends InlineCommentAnchor {
	id: string;
	body: string;
}

export interface InlineCommentState {
	drafts: readonly InlineCommentDraft[];
	comments: readonly InlineReviewComment[];
}

export const EMPTY_INLINE_COMMENT_STATE: InlineCommentState = {
	drafts: [],
	comments: [],
};

export function createInlineCommentDraft(
	state: InlineCommentState,
	draft: InlineCommentDraft,
): InlineCommentState {
	return {
		...state,
		drafts: [...state.drafts, draft],
	};
}

export function updateInlineCommentDraft(
	state: InlineCommentState,
	draftId: string,
	body: string,
): InlineCommentState {
	return {
		...state,
		drafts: state.drafts.map((draft) =>
			draft.id === draftId ? { ...draft, body } : draft,
		),
	};
}

export function commitInlineCommentDraft(
	state: InlineCommentState,
	draftId: string,
): InlineCommentState {
	const draft = state.drafts.find((candidate) => candidate.id === draftId);
	const body = draft?.body.trim() ?? "";
	if (!draft || !body) {
		return state;
	}

	return {
		drafts: state.drafts.filter((candidate) => candidate.id !== draftId),
		comments: [...state.comments, { ...draft, body }],
	};
}

export function cancelInlineCommentDraft(
	state: InlineCommentState,
	draftId: string,
): InlineCommentState {
	return {
		...state,
		drafts: state.drafts.filter((draft) => draft.id !== draftId),
	};
}

export function removeInlineComment(
	state: InlineCommentState,
	commentId: string,
): InlineCommentState {
	return {
		...state,
		comments: state.comments.filter((comment) => comment.id !== commentId),
	};
}

export function removeAllInlineComments(state: InlineCommentState): InlineCommentState {
	return {
		...state,
		comments: [],
	};
}

export function resolveInlineCommentLineText(
	file: ChangedFile,
	side: InlineCommentSide,
	lineNumber: number,
): string {
	if (!Number.isInteger(lineNumber) || lineNumber < 1) {
		return "";
	}

	const contents = side === "additions" ? file.newContents : file.oldContents;
	return contents.split(/\r?\n/u)[lineNumber - 1] ?? "";
}

function getSideLabel(side: InlineCommentSide): "new" | "old" {
	return side === "additions" ? "new" : "old";
}

export function serializeInlineCommentsContext(
	workItem: CodeReviewWorkItem,
	comments: readonly InlineReviewComment[],
): string {
	if (comments.length === 0) {
		return "";
	}

	const serializedComments = comments.map((comment, index) => [
		`Comment ${index + 1}:`,
		`File: ${comment.filePath}`,
		`Side: ${getSideLabel(comment.side)}`,
		`Line: ${comment.lineNumber}`,
		`Exact code line: ${JSON.stringify(comment.lineText)}`,
		`Review comment: ${comment.body}`,
	].join("\n")).join("\n\n");

	return [
		"Inline code review comments (local prompt context):",
		`Work item: ${workItem.key} ${workItem.title}`,
		`Repository: ${workItem.repoName}`,
		`Branch: ${workItem.branchName}`,
		"",
		serializedComments,
	].join("\n");
}
