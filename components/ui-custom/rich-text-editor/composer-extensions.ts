"use client";

import { Extension, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";

import {
	createRichTextMentionExtension,
	SlashCommand,
} from "./extensions";
import type { RichTextEditorExtensionOptions } from "./types";

/**
 * Minimal schema for the mentions-only chat composer.
 *
 * Unlike the full document editor (`createRichTextEditorExtensions`), the
 * composer is a single-paragraph-friendly contentEditable that supports ONLY
 * plain text, hard breaks, and the shared `@`/`/` mention tokens — no marks
 * (bold/italic/…), no block nodes (headings/lists/tables/code), no markdown,
 * and no input rules. The Document/Paragraph/Text/HardBreak nodes are defined
 * inline via `Node.create` from `@tiptap/core` (a direct dependency) instead of
 * pulling in StarterKit or its transitive node packages.
 */

const ComposerDocument = Node.create({
	name: "doc",
	topNode: true,
	content: "block+",
});

const ComposerParagraph = Node.create({
	name: "paragraph",
	group: "block",
	content: "inline*",
	parseHTML() {
		return [{ tag: "p" }];
	},
	renderHTML() {
		return ["p", 0];
	},
});

const ComposerText = Node.create({
	name: "text",
	group: "inline",
});

const ComposerHardBreak = Node.create({
	name: "hardBreak",
	group: "inline",
	inline: true,
	selectable: false,
	linebreakReplacement: true,
	parseHTML() {
		return [{ tag: "br" }];
	},
	renderHTML() {
		return ["br"];
	},
	addKeyboardShortcuts() {
		const insertHardBreak = () =>
			this.editor.chain().insertContent({ type: this.name }).run();

		// Shift+Enter (and Cmd/Ctrl+Enter) insert a hard break. Plain Enter is
		// reserved for submit (see createComposerSubmit) so it is not bound here.
		return {
			"Shift-Enter": insertHardBreak,
			"Mod-Enter": insertHardBreak,
		};
	},
});

const composerSubmitPluginKey = new PluginKey("composer-submit");
export const composerDirectoryAutocompletePluginKey = new PluginKey<DecorationSet>("composer-directory-autocomplete");

/**
 * True when any `@tiptap/suggestion`-backed palette (the `@` mention menu or the
 * `/` command menu) is currently open. Those plugins store `{ active }` in their
 * own plugin state; while a menu is open Enter/Tab belong to the menu, not the
 * submit handler.
 */
function isSuggestionMenuOpen(view: EditorView): boolean {
	for (const plugin of view.state.plugins) {
		const state = plugin.getState(view.state) as
			| { active?: boolean; range?: unknown; query?: unknown }
			| undefined;
		// @tiptap/suggestion stores `{ active, range, query, ... }`. Match that
		// specific shape rather than any plugin exposing a truthy `active`, so an
		// unrelated plugin storing `{ active: true }` can't permanently suppress
		// Enter-to-submit.
		if (state?.active === true && "range" in state && "query" in state) {
			return true;
		}
	}

	return false;
}

/**
 * Plain Enter (no Shift, not during IME composition) submits the host form;
 * Shift+Enter inserts a hard break (handled by ComposerHardBreak). Also forces
 * pasted clipboard content to plain text so no formatting (and no foreign
 * schema nodes) ever enters the mentions-only document. Runs at a lower priority
 * than the suggestion plugins so an open `@`/`/` menu consumes Enter first.
 */
function createComposerBehavior(
	onEnter?: (view: EditorView) => boolean,
	onPasteFiles?: (files: File[]) => void,
) {
	return Extension.create({
		name: "composerBehavior",
		// Below the default (100) so suggestion plugins handle Enter when a menu
		// is open before this submit handler ever sees it.
		priority: 50,
		addProseMirrorPlugins() {
			return [
				new Plugin({
					key: composerSubmitPluginKey,
					props: {
						handleKeyDown: (view, event) => {
							if (event.key !== "Enter") {
								return false;
							}
							if (event.shiftKey || event.isComposing) {
								return false;
							}
							if (isSuggestionMenuOpen(view)) {
								return false;
							}

							return onEnter ? onEnter(view) : false;
						},
						handlePaste: (view, event) => {
							const clipboard = event.clipboardData;
							// Pasted files (images, screenshots, files from Finder)
							// become composer attachments, matching the previous
							// native-textarea behavior. Files take precedence over any
							// accompanying text/plain payload.
							if (clipboard?.items && onPasteFiles) {
								const files: File[] = [];
								for (const item of clipboard.items) {
									if (item.kind === "file") {
										const file = item.getAsFile();
										if (file) {
											files.push(file);
										}
									}
								}
								if (files.length > 0) {
									event.preventDefault();
									onPasteFiles(files);
									return true;
								}
							}

							const text = clipboard?.getData("text/plain");
							if (!text) {
								return false;
							}

							event.preventDefault();
							// Drop all clipboard formatting and any non-composer schema
							// nodes: insert plain text, turning newlines into hardBreaks so
							// multi-line pastes keep their line structure without paragraphs.
							const hardBreakType = view.state.schema.nodes.hardBreak;
							const { tr } = view.state;
							const lines = text.split("\n");
							lines.forEach((line, index) => {
								if (index > 0 && hardBreakType) {
									tr.replaceSelectionWith(hardBreakType.create(), false);
								}
								if (line) {
									tr.insertText(line);
								}
							});
							view.dispatch(tr);
							return true;
						},
					},
				}),
			];
		},
	});
}

export interface ComposerDirectoryAutocompleteController {
	acceptActive: () => boolean;
	acceptGhost: () => boolean;
	acceptIndex: (index: number) => boolean;
	hasVisibleList: () => boolean;
	moveActive: (direction: -1 | 1) => boolean;
	setActiveIndex: (index: number) => boolean;
}

export interface ComposerDirectoryAutocompleteDecoration {
	from: number;
	text: string;
}

function createComposerDirectoryAutocomplete(
	controller?: ComposerDirectoryAutocompleteController,
) {
	return Extension.create({
		name: "composerDirectoryAutocomplete",
		// Above ProseMirror's base Enter keymap so a visible external list can
		// accept the active row before Enter splits the composer paragraph.
		priority: 150,
		addProseMirrorPlugins() {
			return [
				new Plugin<DecorationSet>({
					key: composerDirectoryAutocompletePluginKey,
					state: {
						init: () => DecorationSet.empty,
						apply(transaction, current) {
							const meta = transaction.getMeta(composerDirectoryAutocompletePluginKey) as
								| ComposerDirectoryAutocompleteDecoration
								| null
								| undefined;

							if (meta === null) {
								return DecorationSet.empty;
							}

							if (meta?.text) {
								const widget = Decoration.widget(
									meta.from,
									() => {
										const element = document.createElement("span");
										element.className = "prompt-input-directory-autocomplete-ghost";
										element.textContent = meta.text;
										element.setAttribute("aria-hidden", "true");
										return element;
									},
									{ side: 1 },
								);
								return DecorationSet.create(transaction.doc, [widget]);
							}

							return current.map(transaction.mapping, transaction.doc);
						},
					},
					props: {
						decorations(state) {
							return composerDirectoryAutocompletePluginKey.getState(state) ?? DecorationSet.empty;
						},
						handleDOMEvents: {
							keydown: (_view, event) => {
								if (!controller || !controller.hasVisibleList()) {
									return false;
								}

								const keyboardEvent = event as KeyboardEvent;
								if (keyboardEvent.key !== "Enter" || keyboardEvent.shiftKey || keyboardEvent.isComposing) {
									return false;
								}

								event.preventDefault();
								return controller.acceptActive();
							},
							beforeinput: (_view, event) => {
								if (!controller || event.isComposing || !controller.hasVisibleList()) {
									return false;
								}

								const inputType = (event as InputEvent).inputType;
								if (inputType !== "insertParagraph" && inputType !== "insertLineBreak") {
									return false;
								}

								event.preventDefault();
								return controller.acceptActive();
							},
						},
						handleKeyDown: (_view, event) => {
							if (!controller || event.isComposing || event.altKey) {
								return false;
							}

							if ((event.metaKey || event.ctrlKey) && /^[1-9]$/u.test(event.key) && controller.hasVisibleList()) {
								event.preventDefault();
								return controller.acceptIndex(Number(event.key) - 1);
							}

							if (event.ctrlKey || event.metaKey) {
								return false;
							}

							if (event.key === "ArrowDown" && controller.hasVisibleList()) {
								event.preventDefault();
								return controller.moveActive(1);
							}

							if (event.key === "ArrowUp" && controller.hasVisibleList()) {
								event.preventDefault();
								return controller.moveActive(-1);
							}

							if (event.key === "Enter" && controller.hasVisibleList()) {
								event.preventDefault();
								return controller.acceptActive();
							}

							if (event.key === "Tab" || event.key === "ArrowRight") {
								return controller.acceptGhost();
							}

							return false;
						},
					},
				}),
			];
		},
	});
}

export interface ComposerEditorExtensionOptions extends RichTextEditorExtensionOptions {
	directoryAutocomplete?: ComposerDirectoryAutocompleteController;
	/**
	 * Called on a plain (non-Shift, non-IME) Enter when no `@`/`/` menu is open.
	 * Return `true` to consume the keystroke (e.g. after requesting form submit).
	 */
	onEnter?: (view: EditorView) => boolean;
	/**
	 * Called with files pasted into the composer (images, etc.) so the host can
	 * turn them into attachments — the contentEditable itself can't hold files.
	 */
	onPasteFiles?: (files: File[]) => void;
}

export function createComposerEditorExtensions(
	options: ComposerEditorExtensionOptions = {},
) {
	// The chat composer anchors its `@`/`/` palette to the prompt-input box
	// (full width, 8px gap, viewport-aware up/down flip) rather than the caret.
	const composerOptions = { ...options, anchorToInput: true };
	return [
		ComposerDocument,
		ComposerParagraph,
		ComposerText,
		ComposerHardBreak,
		createRichTextMentionExtension(composerOptions),
		// The composer's "/" menu surfaces references only — no Format category.
		SlashCommand.configure({ ...composerOptions, includeFormat: false }),
		createComposerDirectoryAutocomplete(options.directoryAutocomplete),
		createComposerBehavior(options.onEnter, options.onPasteFiles),
	];
}
