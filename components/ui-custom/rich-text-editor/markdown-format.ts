// Pure Markdown-syntax transforms for the source-mode textarea.
//
// The rich text editor's toolbar normally dispatches Tiptap commands. When the
// editor is flipped to raw Markdown source mode those commands have nowhere to
// act, so instead we rewrite the textarea's selected text with the equivalent
// Markdown syntax. Keeping this logic as a pure function (selection in, new
// selection out — no DOM, no React) makes every transform unit-testable.

export type MarkdownFormatKind =
	| "bold"
	| "italic"
	| "underline"
	| "strikethrough"
	| "inlineCode"
	| "normal"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "quote"
	| "bulletList"
	| "orderedList"
	| "codeBlock"
	| "horizontalRule"
	| "link";

export interface MarkdownSelectionState {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

export interface MarkdownFormatOptions {
	/** Required for `kind: "link"`; the URL inserted into `[text](url)`. */
	linkUrl?: string;
}

interface InlineMarker {
	open: string;
	close: string;
}

const INLINE_MARKERS: Partial<Record<MarkdownFormatKind, InlineMarker>> = {
	bold: { open: "**", close: "**" },
	italic: { open: "*", close: "*" },
	strikethrough: { open: "~~", close: "~~" },
	// Markdown has no underline; `<u>` round-trips through @tiptap/markdown.
	underline: { open: "<u>", close: "</u>" },
	inlineCode: { open: "`", close: "`" },
};

const HEADING_PREFIX: Partial<Record<MarkdownFormatKind, string>> = {
	h1: "# ",
	h2: "## ",
	h3: "### ",
	h4: "#### ",
	h5: "##### ",
	h6: "###### ",
};

const CODE_FENCE = "```";

// Matches a single leading block marker: ATX heading, blockquote, bullet, or
// ordered-list item. Used to normalise a line before applying a new block style.
const BLOCK_PREFIX = /^(#{1,6}\s+|>\s+|[-*+]\s+|\d+\.\s+)/;
const ORDERED_PREFIX = /^\d+\.\s+/;

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyInline(
	marker: InlineMarker,
	state: MarkdownSelectionState,
): MarkdownSelectionState {
	const { value, selectionStart, selectionEnd } = state;
	const { open, close } = marker;
	const selected = value.slice(selectionStart, selectionEnd);

	// Selection already contains the markers → unwrap them.
	if (
		selected.length >= open.length + close.length &&
		selected.startsWith(open) &&
		selected.endsWith(close)
	) {
		const inner = selected.slice(open.length, selected.length - close.length);
		return {
			value: value.slice(0, selectionStart) + inner + value.slice(selectionEnd),
			selectionStart,
			selectionEnd: selectionStart + inner.length,
		};
	}

	// Markers sit immediately around the selection → unwrap them.
	const before = value.slice(Math.max(0, selectionStart - open.length), selectionStart);
	const after = value.slice(selectionEnd, selectionEnd + close.length);
	if (before === open && after === close) {
		return {
			value:
				value.slice(0, selectionStart - open.length) +
				selected +
				value.slice(selectionEnd + close.length),
			selectionStart: selectionStart - open.length,
			selectionEnd: selectionEnd - open.length,
		};
	}

	// Otherwise wrap the selection (collapsed selection → caret between markers).
	return {
		value:
			value.slice(0, selectionStart) +
			open +
			selected +
			close +
			value.slice(selectionEnd),
		selectionStart: selectionStart + open.length,
		selectionEnd: selectionEnd + open.length,
	};
}

function getLineBounds(
	value: string,
	selectionStart: number,
	selectionEnd: number,
): { lineStart: number; lineEnd: number } {
	const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
	const newlineAfter = value.indexOf("\n", selectionEnd);
	const lineEnd = newlineAfter === -1 ? value.length : newlineAfter;
	return { lineStart, lineEnd };
}

function transformLines(kind: MarkdownFormatKind, lines: string[]): string[] {
	if (kind === "normal") {
		return lines.map((line) => line.replace(BLOCK_PREFIX, ""));
	}

	if (kind === "orderedList") {
		if (lines.every((line) => ORDERED_PREFIX.test(line))) {
			return lines.map((line) => line.replace(ORDERED_PREFIX, ""));
		}
		let index = 0;
		return lines.map((line) => {
			index += 1;
			return `${index}. ${line.replace(BLOCK_PREFIX, "")}`;
		});
	}

	const prefix =
		kind === "quote"
			? "> "
			: kind === "bulletList"
				? "- "
				: HEADING_PREFIX[kind];

	if (!prefix) {
		return lines;
	}

	const prefixRegex = new RegExp(`^${escapeRegExp(prefix)}`);

	// All target lines already carry the prefix → toggle it off.
	if (lines.every((line) => prefixRegex.test(line))) {
		return lines.map((line) => line.replace(prefixRegex, ""));
	}

	return lines.map((line) => prefix + line.replace(BLOCK_PREFIX, ""));
}

function applyBlock(
	kind: MarkdownFormatKind,
	state: MarkdownSelectionState,
): MarkdownSelectionState {
	const { value, selectionStart, selectionEnd } = state;
	const { lineStart, lineEnd } = getLineBounds(value, selectionStart, selectionEnd);
	const block = value.slice(lineStart, lineEnd);
	const nextBlock = transformLines(kind, block.split("\n")).join("\n");

	return {
		value: value.slice(0, lineStart) + nextBlock + value.slice(lineEnd),
		selectionStart: lineStart,
		selectionEnd: lineStart + nextBlock.length,
	};
}

/**
 * Toggle a fenced code block around the selected lines. When the surrounding
 * lines already form a complete fenced block (opening + closing ``` lines), we
 * strip the fences; otherwise we wrap with empty fence lines so the selected
 * lines stay verbatim between them.
 */
function applyCodeBlock(state: MarkdownSelectionState): MarkdownSelectionState {
	const { value, selectionStart, selectionEnd } = state;
	const { lineStart, lineEnd } = getLineBounds(value, selectionStart, selectionEnd);
	const beforeBlock = value.slice(0, lineStart);
	const block = value.slice(lineStart, lineEnd);
	const afterBlock = value.slice(lineEnd);
	const lines = block.split("\n");

	// Already fenced (first + last selected line are both ```): strip the fences.
	if (
		lines.length >= 2 &&
		lines[0].trim().startsWith(CODE_FENCE) &&
		lines[lines.length - 1].trim() === CODE_FENCE
	) {
		const inner = lines.slice(1, -1).join("\n");
		return {
			value: beforeBlock + inner + afterBlock,
			selectionStart: lineStart,
			selectionEnd: lineStart + inner.length,
		};
	}

	const fenced = `${CODE_FENCE}\n${block}\n${CODE_FENCE}`;
	return {
		value: beforeBlock + fenced + afterBlock,
		selectionStart: lineStart,
		selectionEnd: lineStart + fenced.length,
	};
}

/**
 * Insert a `---` horizontal rule on its own line. The caret/selection lands on
 * the blank line below the rule, ready to keep typing.
 */
function applyHorizontalRule(state: MarkdownSelectionState): MarkdownSelectionState {
	const { value, selectionStart, selectionEnd } = state;
	const before = value.slice(0, selectionEnd);
	const after = value.slice(selectionEnd);
	const needsLeadingNewlines = before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
	const needsTrailingNewlines = after.startsWith("\n") ? "\n" : "\n\n";
	const inserted = `${needsLeadingNewlines}---${needsTrailingNewlines}`;
	const nextValue = before + inserted + after;
	const caret = before.length + inserted.length;

	return {
		value: nextValue,
		selectionStart: caret,
		selectionEnd: caret,
	};
}

function applyLink(
	state: MarkdownSelectionState,
	url: string,
): MarkdownSelectionState {
	const { value, selectionStart, selectionEnd } = state;
	const text = value.slice(selectionStart, selectionEnd) || "link";
	const markdown = `[${text}](${url})`;

	return {
		value: value.slice(0, selectionStart) + markdown + value.slice(selectionEnd),
		// Select the link text so it can be edited or re-formatted immediately.
		selectionStart: selectionStart + 1,
		selectionEnd: selectionStart + 1 + text.length,
	};
}

/**
 * Apply a Markdown formatting action to a textarea selection.
 *
 * Returns the next `{ value, selectionStart, selectionEnd }`. When the action
 * cannot be completed (e.g. `link` with no URL) the input state is returned
 * unchanged so callers can treat it as a no-op.
 */
export function applyMarkdownFormat(
	kind: MarkdownFormatKind,
	state: MarkdownSelectionState,
	options: MarkdownFormatOptions = {},
): MarkdownSelectionState {
	if (kind === "link") {
		if (!options.linkUrl) {
			return state;
		}
		return applyLink(state, options.linkUrl);
	}

	if (kind === "codeBlock") {
		return applyCodeBlock(state);
	}

	if (kind === "horizontalRule") {
		return applyHorizontalRule(state);
	}

	const marker = INLINE_MARKERS[kind];
	if (marker) {
		return applyInline(marker, state);
	}

	return applyBlock(kind, state);
}
