"use client";

import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { useCallback, useRef } from "react";

import {
	clearComposerTraceDecorations,
	setComposerTraceDecorations,
	type ComposerTraceDecoration,
} from "./composer-extensions";
import {
	clearDismissedAutoTags,
	getDismissedAutoTagRanges,
	getMentionNodeAttrs,
	RICH_TEXT_OBJECT_REPLACEMENT,
} from "./extensions";
import type { RichTextMentionSources } from "./types";
import {
	serializeComposerMentionAttrs,
	serializeComposerDoc,
	setComposerPlainText,
} from "@/lib/composer-serialize";
import {
	getDirectoryAutocompleteExactLabelMatches,
	type DirectoryAutocompleteExactLabelMatch,
	type DirectoryAutocompleteState,
} from "@/lib/directory-autocomplete";

type ComposerRef<T> = {
	current: T;
};

type PublishComposerText = (
	text: string,
	editorDom: HTMLElement | null,
	fromEditor: boolean
) => void;

const VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS = 180;
const VISUAL_TRACE_AUTO_TAG_CONVERT_MS = 940;
const VISUAL_TRACE_AUTO_TAG_STAGGER_MS = 140;

interface VisualTraceAutoTagPendingMatch {
	expectedText: string;
	from: number;
	id: string;
	label: string;
	match: DirectoryAutocompleteExactLabelMatch;
	to: number;
	traceFrom: number;
	traceText: string;
	traceTo: number;
}

interface VisualTraceAutoTagUndoSnapshot {
	afterText: string;
	beforeJSON: ReturnType<Editor["getJSON"]>;
	beforeText: string;
}

// The mention extension tracks reverted spots by position (see the dismissed-tag
// plugin). A candidate match is skipped when its document range overlaps one of
// those spots, so a reverted word stays text until the user edits it there.
function overlapsDismissedAutoTag(
	ranges: readonly { from: number; to: number }[],
	from: number,
	to: number,
): boolean {
	return ranges.some((range) => range.from < to && from < range.to);
}

/** A mention node that the composer auto-tagged (carries the typed `sourceText`). */
function isAutoTaggedMention(
	node: { attrs: { sourceText?: unknown }; type: { name: string } } | null | undefined,
): boolean {
	return (
		node?.type.name === "mention" &&
		typeof node.attrs.sourceText === "string" &&
		Boolean(node.attrs.sourceText)
	);
}

function isMentionNode(
	node: { type: { name: string } } | null | undefined,
): node is ProseMirrorNode {
	return node?.type.name === "mention";
}

/**
 * Resolve the document position of an auto-tagged mention a Backspace should
 * revert, or null. Handles the caret sitting directly after the chip, and the
 * common just-typed case where conversion appended a trailing space so the caret
 * lands after that space (a lone space is treated as adjacency to the chip).
 */
function getBackspaceRevertPos(editor: Editor): number | null {
	const { selection } = editor.state;
	if (selection instanceof NodeSelection && isAutoTaggedMention(selection.node)) {
		return selection.from;
	}

	if (!selection.empty) {
		return null;
	}

	const { $from } = selection;
	const before = $from.nodeBefore;
	if (isAutoTaggedMention(before)) {
		return $from.pos - before!.nodeSize;
	}

	if (before?.isText && before.text === " ") {
		const spaceStart = $from.pos - before.nodeSize;
		const beforeSpace = editor.state.doc.resolve(spaceStart).nodeBefore;
		if (isAutoTaggedMention(beforeSpace)) {
			return spaceStart - beforeSpace!.nodeSize;
		}
	}

	return null;
}

/**
 * Resolve a deliberate mention deletion range for Backspace. Mentions inserted
 * from the directory or menu do not carry `sourceText`, so they should delete as
 * a token instead of restoring to typed text. When the caret sits after the
 * inserted trailing space, include that space in the same deletion.
 */
function getBackspaceMentionDeleteRange(editor: Editor): { from: number; to: number } | null {
	const { selection } = editor.state;
	if (selection instanceof NodeSelection) {
		const nodeAfter = editor.state.doc.resolve(selection.to).nodeAfter;
		return isMentionNode(selection.node) && !isAutoTaggedMention(selection.node)
			? {
				from: selection.from,
				to: selection.to + (nodeAfter?.isText && nodeAfter.text?.startsWith(" ") ? 1 : 0),
			}
			: null;
	}

	if (!selection.empty) {
		return null;
	}

	const { $from } = selection;
	const before = $from.nodeBefore;
	if (isMentionNode(before) && !isAutoTaggedMention(before)) {
		return {
			from: $from.pos - before.nodeSize,
			to: $from.pos,
		};
	}

	if (before?.isText && before.text === " ") {
		const spaceStart = $from.pos - before.nodeSize;
		const beforeSpace = editor.state.doc.resolve(spaceStart).nodeBefore;
		if (isMentionNode(beforeSpace) && !isAutoTaggedMention(beforeSpace)) {
			return {
				from: spaceStart - beforeSpace.nodeSize,
				to: $from.pos,
			};
		}
	}

	return null;
}

interface VisualTraceTextSegment {
	from: number;
	textFrom: number;
	textTo: number;
	to: number;
}

interface VisualTraceBlockText {
	blockFrom: number;
	segments: readonly VisualTraceTextSegment[];
	text: string;
}

interface VisualTraceRangeScope {
	from: number;
	to: number;
	type: "range";
}

type VisualTraceAutoTagScope = "block" | "document" | VisualTraceRangeScope;
const VISUAL_TRACE_EXTERNAL_SYNC_LOOKBACK_CHARS = 96;

function getCurrentVisualTraceBlockText(editor: Editor): VisualTraceBlockText {
	const { selection } = editor.state;
	const blockFrom = selection.$from.start();
	const segments: VisualTraceTextSegment[] = [];
	let text = "";

	selection.$from.parent.descendants((node, offset) => {
		if (node.isText && node.text) {
			const textFrom = text.length;
			text += node.text;
			segments.push({
				from: blockFrom + offset,
				textFrom,
				textTo: text.length,
				to: blockFrom + offset + node.text.length,
			});
			return false;
		}

		if (node.type.name === "hardBreak") {
			text += "\n";
			return false;
		}

		if (node.type.name === "mention") {
			text += RICH_TEXT_OBJECT_REPLACEMENT;
			return false;
		}

		return true;
	});

	return {
		blockFrom,
		segments,
		text,
	};
}

function getVisualTraceDocumentText(editor: Editor): VisualTraceBlockText {
	const segments: VisualTraceTextSegment[] = [];
	let text = "";

	editor.state.doc.forEach((block, blockOffset, blockIndex) => {
		if (blockIndex > 0) {
			text += "\n";
		}

		block.descendants((node, offset) => {
			if (node.isText && node.text) {
				const position = blockOffset + 1 + offset;
				const textFrom = text.length;
				text += node.text;
				segments.push({
					from: position,
					textFrom,
					textTo: text.length,
					to: position + node.text.length,
				});
				return false;
			}

			if (node.type.name === "hardBreak") {
				text += "\n";
				return false;
			}

			if (node.type.name === "mention") {
				text += RICH_TEXT_OBJECT_REPLACEMENT;
				return false;
			}

			return true;
		});
	});

	return {
		blockFrom: 0,
		segments,
		text,
	};
}

function getVisualTraceRangeText(
	editor: Editor,
	range: VisualTraceRangeScope,
): VisualTraceBlockText {
	const segments: VisualTraceTextSegment[] = [];
	const docTo = editor.state.doc.content.size;
	const from = Math.max(0, Math.min(range.from, docTo));
	const to = Math.max(from, Math.min(range.to, docTo));
	let text = "";

	editor.state.doc.nodesBetween(from, to, (node, pos) => {
		if (node.isText && node.text) {
			const nodeFrom = pos;
			const sliceFrom = Math.max(0, from - nodeFrom);
			const sliceTo = Math.min(node.text.length, to - nodeFrom);
			if (sliceFrom < sliceTo) {
				const textFrom = text.length;
				text += node.text.slice(sliceFrom, sliceTo);
				segments.push({
					from: nodeFrom + sliceFrom,
					textFrom,
					textTo: text.length,
					to: nodeFrom + sliceTo,
				});
			}
			return false;
		}

		if (node.type.name === "hardBreak") {
			text += "\n";
			return false;
		}

		if (node.type.name === "mention") {
			text += RICH_TEXT_OBJECT_REPLACEMENT;
			return false;
		}

		return true;
	});

	return {
		blockFrom: from,
		segments,
		text,
	};
}

function getCommonPrefixLength(left: string, right: string): number {
	const limit = Math.min(left.length, right.length);
	let index = 0;
	while (index < limit && left.charCodeAt(index) === right.charCodeAt(index)) {
		index += 1;
	}

	return index;
}

function getVisualTraceExternalSyncTextOffset(text: string, changedFromOffset: number): number {
	const safeChangedFromOffset = Math.max(0, Math.min(changedFromOffset, text.length));
	let offset = safeChangedFromOffset;
	const floor = Math.max(0, safeChangedFromOffset - VISUAL_TRACE_EXTERNAL_SYNC_LOOKBACK_CHARS);

	while (offset > floor) {
		const character = text.charAt(offset - 1);
		if (character === "\n" || character === "." || character === "!" || character === "?") {
			break;
		}
		offset -= 1;
	}

	while (offset < safeChangedFromOffset && /\s/u.test(text.charAt(offset))) {
		offset += 1;
	}

	return offset;
}

function getComposerNodeSerializedText(node: ProseMirrorNode): string {
	if (node.isText) {
		return node.text ?? "";
	}

	if (node.type.name === "mention") {
		return serializeComposerMentionAttrs(node.attrs);
	}

	if (node.type.name === "hardBreak") {
		return "\n";
	}

	return "";
}

function getComposerDocPositionAtSerializedOffset(editor: Editor, textOffset: number): number {
	const targetOffset = Math.max(0, textOffset);
	let serializedOffset = 0;
	let position: number | null = null;

	editor.state.doc.forEach((block, blockOffset, blockIndex) => {
		if (position !== null) {
			return;
		}

		if (blockIndex > 0) {
			const nextOffset = serializedOffset + 1;
			if (targetOffset <= nextOffset) {
				position = targetOffset === serializedOffset ? blockOffset : blockOffset + 1;
				return;
			}
			serializedOffset = nextOffset;
		}

		block.descendants((node, offset) => {
			if (position !== null) {
				return false;
			}

			const serializedText = getComposerNodeSerializedText(node);
			if (!serializedText) {
				return true;
			}

			const nodeFrom = blockOffset + 1 + offset;
			const nodeTo = nodeFrom + node.nodeSize;
			const nextOffset = serializedOffset + serializedText.length;
			if (targetOffset <= nextOffset) {
				if (node.type.name === "mention") {
					position = targetOffset === nextOffset ? nodeTo : nodeFrom;
					return false;
				}

				position = nodeFrom + Math.max(0, targetOffset - serializedOffset);
				return false;
			}

			serializedOffset = nextOffset;
			return false;
		});

		if (position === null && targetOffset <= serializedOffset) {
			position = blockOffset + block.nodeSize - 1;
		}
	});

	return position ?? TextSelection.atEnd(editor.state.doc).from;
}

function replaceComposerPlainTextFrom(editor: Editor, from: number, text: string): void {
	const replaceTo = TextSelection.atEnd(editor.state.doc).from;
	const transaction = text
		? editor.state.tr.insertText(text, from, replaceTo)
		: editor.state.tr.delete(from, replaceTo);
	transaction.setSelection(TextSelection.atEnd(transaction.doc));
	editor.view.dispatch(transaction);
}

function appendComposerPlainTextAtEnd(editor: Editor, text: string): void {
	if (!text) {
		return;
	}

	const insertFrom = TextSelection.atEnd(editor.state.doc).from;
	replaceComposerPlainTextFrom(editor, insertFrom, text);
}

function getVisualTraceDocPosition(
	block: VisualTraceBlockText,
	textOffset: number,
): number | null {
	for (const segment of block.segments) {
		if (textOffset >= segment.textFrom && textOffset <= segment.textTo) {
			return segment.from + textOffset - segment.textFrom;
		}
	}

	return null;
}

function getVisualTraceDocRange(
	block: VisualTraceBlockText,
	match: DirectoryAutocompleteExactLabelMatch,
): { from: number; to: number } | null {
	const from = getVisualTraceDocPosition(block, match.from);
	const to = getVisualTraceDocPosition(block, match.to);
	if (from === null || to === null || from >= to) {
		return null;
	}

	return { from, to };
}

interface UseComposerVisualTraceAutoTaggingOptions {
	activeEditorRef: ComposerRef<Editor | null>;
	enabled: boolean;
	mentionSourcesRef: ComposerRef<RichTextMentionSources>;
	publishText: PublishComposerText;
	refreshDirectoryAutocompleteRef: ComposerRef<(editor: Editor) => void>;
	setDirectoryAutocompleteState: (state: DirectoryAutocompleteState | null) => void;
}

export function useComposerVisualTraceAutoTagging({
	activeEditorRef,
	enabled,
	mentionSourcesRef,
	publishText,
	refreshDirectoryAutocompleteRef,
	setDirectoryAutocompleteState,
}: UseComposerVisualTraceAutoTaggingOptions) {
	const applyingRef = useRef(false);
	const generationRef = useRef(0);
	const immediateUpdateRef = useRef(false);
	const pendingRef = useRef(false);
	const pendingMatchesRef = useRef<readonly VisualTraceAutoTagPendingMatch[]>([]);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const undoSnapshotRef = useRef<VisualTraceAutoTagUndoSnapshot | null>(null);
	const externalAppendRangeRef = useRef<VisualTraceRangeScope | null>(null);

	const clearExternalSyncRange = useCallback(() => {
		externalAppendRangeRef.current = null;
	}, []);

	const isBusy = useCallback(() => (
		pendingRef.current ||
		pendingMatchesRef.current.length > 0 ||
		applyingRef.current
	), []);

	const getAutoTagMatches = useCallback((activeEditor: Editor, scope: VisualTraceAutoTagScope): readonly VisualTraceAutoTagPendingMatch[] => {
		const mentionType = activeEditor.schema.nodes.mention;
		if (!enabled || !activeEditor.isEditable || !mentionType) {
			return [];
		}

		const block = scope === "document"
			? getVisualTraceDocumentText(activeEditor)
			: scope === "block"
				? getCurrentVisualTraceBlockText(activeEditor)
				: getVisualTraceRangeText(activeEditor, scope);
		const matches = getDirectoryAutocompleteExactLabelMatches({
			sources: mentionSourcesRef.current,
			suppressTrailingPrefixMatches: scope !== "document",
			text: block.text,
		});
		if (matches.length === 0) {
			return [];
		}

		const dismissedRanges = getDismissedAutoTagRanges(activeEditor.state);

		return matches.flatMap((match, index): VisualTraceAutoTagPendingMatch[] => {
			const range = getVisualTraceDocRange(block, match);
			if (!range) {
				return [];
			}

			if (overlapsDismissedAutoTag(dismissedRanges, range.from, range.to)) {
				return [];
			}

			const currentText = activeEditor.state.doc.textBetween(
				range.from,
				range.to,
				"\n",
				RICH_TEXT_OBJECT_REPLACEMENT
			);
			const expectedText = block.text.slice(match.from, match.to);
			if (
				currentText.includes(RICH_TEXT_OBJECT_REPLACEMENT) ||
				currentText.toLowerCase() !== expectedText.toLowerCase()
			) {
				return [];
			}

			return [{
				expectedText,
				from: range.from,
				id: `visual-trace-auto-tag-${generationRef.current}-${index}`,
				label: match.label,
				match,
				to: range.to,
				traceFrom: range.from,
				traceText: block.text.slice(match.from, match.to),
				traceTo: range.to,
			}];
		});
	}, [enabled, mentionSourcesRef]);

	const convertAutoTagMatches = useCallback((
		activeEditor: Editor,
		pendingMatches: readonly VisualTraceAutoTagPendingMatch[],
	): boolean => {
		const mentionType = activeEditor.schema.nodes.mention;
		if (!mentionType || pendingMatches.length === 0) {
			return false;
		}

		let transaction = activeEditor.state.tr;
		for (const pendingMatch of [...pendingMatches].sort((a, b) => b.from - a.from)) {
			const currentText = transaction.doc.textBetween(
				pendingMatch.from,
				pendingMatch.to,
				"\n",
				RICH_TEXT_OBJECT_REPLACEMENT
			);
			if (
				currentText.includes(RICH_TEXT_OBJECT_REPLACEMENT) ||
				currentText.toLowerCase() !== pendingMatch.expectedText.toLowerCase()
			) {
				continue;
			}

			const nodeAfter = transaction.doc.resolve(pendingMatch.to).nodeAfter;
			const textAfter = nodeAfter?.isText ? nodeAfter.text?.charAt(0) : undefined;
			const shouldInsertTrailingSpace = textAfter === undefined;
			const mentionAttrs = {
				...getMentionNodeAttrs(pendingMatch.match.mention),
				sourceText: pendingMatch.expectedText,
			};
			const replacement = shouldInsertTrailingSpace
				? [
						mentionType.create(mentionAttrs),
						transaction.doc.type.schema.text(" "),
					]
				: mentionType.create(mentionAttrs);

			transaction = transaction.replaceWith(
				pendingMatch.from,
				pendingMatch.to,
				replacement,
			);
		}

		if (!transaction.docChanged) {
			return false;
		}
		applyingRef.current = true;
		try {
			activeEditor.view.dispatch(transaction);
			clearComposerTraceDecorations(activeEditor.view);
		} finally {
			applyingRef.current = false;
		}
		return true;
	}, []);

	const restoreUndoSnapshot = useCallback((activeEditor: Editor, snapshot: VisualTraceAutoTagUndoSnapshot): boolean => {
		if (serializeComposerDoc(activeEditor) !== snapshot.afterText) {
			return false;
		}

		undoSnapshotRef.current = null;
		applyingRef.current = true;
		try {
			activeEditor.commands.setContent(snapshot.beforeJSON, {
				emitUpdate: false,
			});
			activeEditor.commands.setTextSelection(activeEditor.state.doc.content.size);
			clearComposerTraceDecorations(activeEditor.view);
			// The whole-doc restore invalidates any reverted-spot positions; drop them
			// explicitly rather than relying on how setContent maps them.
			clearDismissedAutoTags(activeEditor);
			publishText(snapshot.beforeText, activeEditor.view.dom, true);
		} finally {
			applyingRef.current = false;
		}
		return true;
	}, [publishText]);

	const clearPendingAutoTagging = useCallback(() => {
		generationRef.current += 1;
		pendingRef.current = false;
		pendingMatchesRef.current = [];
		for (const timeout of timeoutsRef.current) {
			clearTimeout(timeout);
		}
		timeoutsRef.current = [];
		const activeEditor = activeEditorRef.current;
		if (activeEditor) {
			clearComposerTraceDecorations(activeEditor.view);
		}
	}, [activeEditorRef]);

	const runAutoTagging = useCallback((
		activeEditor: Editor,
		generation: number,
		scope: VisualTraceAutoTagScope,
	): boolean => {
		if (generation !== generationRef.current) {
			return false;
		}

		pendingRef.current = false;
		setDirectoryAutocompleteState(null);

		const pendingMatches = getAutoTagMatches(activeEditor, scope);
		if (pendingMatches.length === 0) {
			pendingMatchesRef.current = [];
			clearComposerTraceDecorations(activeEditor.view);
			refreshDirectoryAutocompleteRef.current(activeEditor);
			return false;
		}

		const undoBaseline = {
			beforeJSON: activeEditor.getJSON(),
			beforeText: serializeComposerDoc(activeEditor),
		};
		pendingRef.current = true;
		pendingMatchesRef.current = pendingMatches;
		let convertedAny = false;
		const reducedMotion = typeof window !== "undefined" &&
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
		const decorations: ComposerTraceDecoration[] = pendingMatches.map((pendingMatch, index) => ({
			from: pendingMatch.traceFrom,
			id: pendingMatch.id,
			label: pendingMatch.traceText,
			motion: reducedMotion ? "static" : "active",
			pending: index > 0,
			to: pendingMatch.traceTo,
		}));
		setComposerTraceDecorations(activeEditor.view, decorations);

		const conversionOrder = [...pendingMatches].sort((a, b) => b.from - a.from);
		conversionOrder.forEach((pendingMatch, index) => {
			const timeout = setTimeout(() => {
				if (generation !== generationRef.current) {
					return;
				}

				const converted = convertAutoTagMatches(activeEditor, [pendingMatch]);
				convertedAny = convertedAny || converted;
				pendingMatchesRef.current = pendingMatchesRef.current.filter((match) => match.id !== pendingMatch.id);
				const remainingDecorations = pendingMatchesRef.current.map((match, remainingIndex) => ({
					from: match.traceFrom,
					id: match.id,
					label: match.traceText,
					motion: reducedMotion ? "static" : "active",
					pending: remainingIndex > 0,
					to: match.traceTo,
				} satisfies ComposerTraceDecoration));
				if (remainingDecorations.length > 0) {
					setComposerTraceDecorations(activeEditor.view, remainingDecorations);
				} else {
					pendingRef.current = false;
					clearComposerTraceDecorations(activeEditor.view);
					if (convertedAny) {
						undoSnapshotRef.current = {
							...undoBaseline,
							afterText: serializeComposerDoc(activeEditor),
						};
					}
					refreshDirectoryAutocompleteRef.current(activeEditor);
				}
				if (converted) {
					publishText(serializeComposerDoc(activeEditor), activeEditor.view.dom, true);
				}
			}, index * VISUAL_TRACE_AUTO_TAG_STAGGER_MS + VISUAL_TRACE_AUTO_TAG_CONVERT_MS);
			timeoutsRef.current.push(timeout);
		});

		return true;
	}, [
		convertAutoTagMatches,
		getAutoTagMatches,
		publishText,
		refreshDirectoryAutocompleteRef,
		setDirectoryAutocompleteState,
	]);

	const flushAutoTagging = useCallback((activeEditor: Editor | null = activeEditorRef.current): boolean => {
		if (!enabled || !activeEditor) {
			return false;
		}

		clearPendingAutoTagging();
		const undoBaseline = {
			beforeJSON: activeEditor.getJSON(),
			beforeText: serializeComposerDoc(activeEditor),
		};
		const pendingMatches = getAutoTagMatches(activeEditor, "document");
		const converted = convertAutoTagMatches(activeEditor, pendingMatches);
		if (converted) {
			undoSnapshotRef.current = {
				...undoBaseline,
				afterText: serializeComposerDoc(activeEditor),
			};
			publishText(serializeComposerDoc(activeEditor), activeEditor.view.dom, true);
		}
		return converted;
	}, [
		activeEditorRef,
		clearPendingAutoTagging,
		convertAutoTagMatches,
		enabled,
		getAutoTagMatches,
		publishText,
	]);

	const scheduleAutoTagging = useCallback((
		activeEditor: Editor,
		immediate: boolean,
		scope: VisualTraceAutoTagScope = immediate ? "document" : "block",
	): boolean => {
		if (!enabled) {
			return false;
		}

		clearPendingAutoTagging();

		const generation = generationRef.current;
		pendingRef.current = true;
		// Intentionally do NOT clear the directory-autocomplete state here. This runs
		// on every keystroke, and `runAutoTagging` (after the idle debounce) already
		// nulls + recomputes it synchronously. Clearing eagerly left the empty-state
		// greeting with no matches for the entire debounce window, so it flipped to
		// its default prompt list and then snapped back to the matches — a jarring
		// per-keystroke jump. Keeping the prior matches until the recompute lands
		// keeps the suggestion list stable while typing.
		const delay = immediate ? 0 : VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS;
		const timeout = setTimeout(() => {
			runAutoTagging(activeEditor, generation, scope);
		}, delay);
		timeoutsRef.current = [timeout];
		return true;
	}, [clearPendingAutoTagging, enabled, runAutoTagging]);

	const handleEditorUpdated = useCallback((activeEditor: Editor): boolean => {
		if (applyingRef.current) {
			setDirectoryAutocompleteState(null);
			return true;
		}
		if (!enabled) {
			clearExternalSyncRange();
			return false;
		}

		const externalAppendScope = externalAppendRangeRef.current;
		externalAppendRangeRef.current = null;
		const immediate = immediateUpdateRef.current;
		immediateUpdateRef.current = false;
		if (externalAppendScope) {
			scheduleAutoTagging(activeEditor, true, externalAppendScope);
			return true;
		}

		clearExternalSyncRange();
		scheduleAutoTagging(activeEditor, immediate, immediate ? "document" : "block");
		return true;
	}, [
		clearExternalSyncRange,
		enabled,
		scheduleAutoTagging,
		setDirectoryAutocompleteState,
	]);

	const handleKeyDown = useCallback((activeEditor: Editor, event: KeyboardEvent): boolean => {
		const backspaceRevertPos =
			event.key === "Backspace" && !event.metaKey && !event.ctrlKey && !event.altKey
				? getBackspaceRevertPos(activeEditor)
				: null;
		if (backspaceRevertPos !== null && activeEditor.commands.restoreAutoTaggedMention(backspaceRevertPos)) {
			return true;
		}
		const backspaceDeleteRange =
			event.key === "Backspace" && !event.metaKey && !event.ctrlKey && !event.altKey
				? getBackspaceMentionDeleteRange(activeEditor)
				: null;
		if (backspaceDeleteRange) {
			const transaction = activeEditor.state.tr.delete(backspaceDeleteRange.from, backspaceDeleteRange.to);
			transaction.setSelection(TextSelection.create(transaction.doc, backspaceDeleteRange.from));
			activeEditor.view.dispatch(transaction);
			return true;
		}

		const snapshot = undoSnapshotRef.current;
		if (
			!snapshot ||
			event.key.toLowerCase() !== "z" ||
			event.shiftKey ||
			!(event.metaKey || event.ctrlKey)
		) {
			return false;
		}

		return restoreUndoSnapshot(activeEditor, snapshot);
	}, [restoreUndoSnapshot]);

	const handlePaste = useCallback(() => {
		immediateUpdateRef.current = true;
	}, []);

	const resetEditorState = useCallback((activeEditor: Editor) => {
		undoSnapshotRef.current = null;
		clearExternalSyncRange();
		clearDismissedAutoTags(activeEditor);
	}, [clearExternalSyncRange]);

	const syncExternalValue = useCallback((
		activeEditor: Editor,
		resolvedValue: string,
		currentText: string,
	): void => {
		const setExternalVisualTraceRange = (changedFromTextOffset: number, rangeTo: number) => {
			if (!enabled) {
				clearExternalSyncRange();
				return;
			}

			const traceTextOffset = getVisualTraceExternalSyncTextOffset(
				resolvedValue,
				changedFromTextOffset,
			);
			const traceFrom = getComposerDocPositionAtSerializedOffset(activeEditor, traceTextOffset);
			externalAppendRangeRef.current = {
				from: traceFrom,
				to: rangeTo,
				type: "range",
			};
		};

		const appendedText = resolvedValue.startsWith(currentText)
			? resolvedValue.slice(currentText.length)
			: "";
		if (appendedText) {
			const from = TextSelection.atEnd(activeEditor.state.doc).from;
			const to = from + appendedText.length;
			setExternalVisualTraceRange(currentText.length, to);
			appendComposerPlainTextAtEnd(activeEditor, appendedText);
			return;
		}

		const commonPrefixLength = getCommonPrefixLength(currentText, resolvedValue);
		if (commonPrefixLength > 0) {
			const from = getComposerDocPositionAtSerializedOffset(activeEditor, commonPrefixLength);
			const replacementText = resolvedValue.slice(commonPrefixLength);
			const to = from + replacementText.length;
			setExternalVisualTraceRange(commonPrefixLength, to);
			replaceComposerPlainTextFrom(activeEditor, from, replacementText);
			return;
		}

		clearExternalSyncRange();
		setComposerPlainText(activeEditor, resolvedValue);
		undoSnapshotRef.current = null;
		clearDismissedAutoTags(activeEditor);
		publishText(serializeComposerDoc(activeEditor), activeEditor.view.dom, false);
		if (enabled) {
			scheduleAutoTagging(activeEditor, true, "document");
		} else {
			refreshDirectoryAutocompleteRef.current(activeEditor);
		}
	}, [
		clearExternalSyncRange,
		enabled,
		publishText,
		refreshDirectoryAutocompleteRef,
		scheduleAutoTagging,
	]);

	return {
		clearPendingAutoTagging,
		flushAutoTagging,
		handleEditorUpdated,
		handleKeyDown,
		handlePaste,
		isBusy,
		resetEditorState,
		scheduleAutoTagging,
		syncExternalValue,
	};
}
