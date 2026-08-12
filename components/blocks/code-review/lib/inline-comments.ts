import type { ChangedFile, CodeReviewWorkItem } from "../data/types";

export type InlineCommentSide = "additions" | "deletions";

export interface InlineCommentAnchor {
	fileId: string;
	filePath: string;
	side: InlineCommentSide;
	startLineNumber: number;
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

export function updateInlineComment(
	state: InlineCommentState,
	commentId: string,
	body: string,
): InlineCommentState {
	const trimmedBody = body.trim();
	if (!trimmedBody) {
		return state;
	}

	return {
		...state,
		comments: state.comments.map((comment) =>
			comment.id === commentId ? { ...comment, body: trimmedBody } : comment,
		),
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
	startLineNumber: number,
	lineNumber = startLineNumber,
): string {
	const range = normalizeInlineCommentLineRange(startLineNumber, lineNumber);
	if (!range) {
		return "";
	}

	const contents = side === "additions" ? file.newContents : file.oldContents;
	const lines = contents.split(/\r?\n/u);
	if (range.lineNumber > lines.length) {
		return "";
	}

	return lines.slice(range.startLineNumber - 1, range.lineNumber).join("\n");
}

export function normalizeInlineCommentLineRange(
	startLineNumber: number,
	lineNumber: number,
): Pick<InlineCommentAnchor, "startLineNumber" | "lineNumber"> | null {
	if (
		!Number.isInteger(startLineNumber)
		|| !Number.isInteger(lineNumber)
		|| startLineNumber < 1
		|| lineNumber < 1
	) {
		return null;
	}

	return {
		startLineNumber: Math.min(startLineNumber, lineNumber),
		lineNumber: Math.max(startLineNumber, lineNumber),
	};
}

export function formatInlineCommentLineLabel(
	comment: Pick<InlineCommentAnchor, "startLineNumber" | "lineNumber">,
): string {
	return comment.startLineNumber === comment.lineNumber
		? `Line ${comment.lineNumber}`
		: `Lines ${comment.startLineNumber} - ${comment.lineNumber}`;
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

	const serializedComments = comments.map((comment, index) => {
		const isRange = comment.startLineNumber !== comment.lineNumber;

		return [
			`Comment ${index + 1}:`,
			`File: ${comment.filePath}`,
			`Side: ${getSideLabel(comment.side)}`,
			isRange
				? `Lines: ${comment.startLineNumber}-${comment.lineNumber}`
				: `Line: ${comment.lineNumber}`,
			`${isRange ? "Exact code block" : "Exact code line"}: ${JSON.stringify(comment.lineText)}`,
			`Review comment: ${comment.body}`,
		].join("\n");
	}).join("\n\n");

	return [
		"Inline code review comments (local prompt context):",
		`Work item: ${workItem.key} ${workItem.title}`,
		`Repository: ${workItem.repoName}`,
		`Branch: ${workItem.branchName}`,
		"",
		serializedComments,
	].join("\n");
}
