"use client";

import { Extension, mergeAttributes } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Mention from "@tiptap/extension-mention";
import {
	Table,
	TableCell,
	TableHeader,
	TableRow,
} from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { PluginKey } from "@tiptap/pm/state";
import { Suggestion, exitSuggestion } from "@tiptap/suggestion";
import StarterKit from "@tiptap/starter-kit";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
import { FrontmatterNode } from "./frontmatter-node";
import { RichTextMentionNodeView } from "./mention-node-view";
import {
	createMentionTokenParser,
	mentionMarkdownTokenizer,
	MENTION_MARKDOWN_TOKEN_NAME,
	type MentionTokenResolver,
	serializeMentionNode,
} from "./mention-token-codec";
import {
	getRichTextMentionVisualAttrs,
	getRichTextMentionVisualDOMSpec,
	getRichTextMentionVisualFromAttrs,
} from "./mention-visual";
import { isRichTextReferenceCategory } from "./reference-categories";
import {
	createMentionSuggestionRenderer,
	createSlashSuggestionRenderer,
	type RichTextSlashAction,
} from "./suggestion-menu";
import {
	resolveCommandVariant,
	resolveMentionVariant,
} from "./types";
import type {
	RichTextEditorExtensionOptions,
	RichTextMentionItem,
} from "./types";

const slashCommandPluginKey = new PluginKey("rich-text-slash-command");

/**
 * Resolve a mention's category. Prefers an explicit non-empty `category`
 * (stored on the node), else derives it from the `id` prefix (`skill:foo` →
 * `skill`), falling back to `"context"`. Single source for every mention
 * surface (node view, editor inventory).
 */
export function getMentionCategory(id: unknown, category?: unknown): string {
	if (typeof category === "string" && category.trim()) {
		return category;
	}

	if (typeof id !== "string") {
		return "context";
	}

	return id.split(":")[0] || "context";
}

export function getMentionNodeAttrs(mention: RichTextMentionItem) {
	return {
		category: mention.category,
		id: mention.id,
		label: mention.label,
		mentionSuggestionChar: "@",
		...getRichTextMentionVisualAttrs(mention.visual),
	};
}

/**
 * Resolve a `@[category:id]` markdown token back to the mention attrs the node
 * view needs, looking the id up in the shared editor-palette directory (the same
 * source the `@`/`/` palettes draw from). Returns `undefined` for an unknown id
 * so the codec leaves the token as plain text. Lookup is by exact `id` because a
 * token carries the id, not the label.
 */
const resolveMentionToken: MentionTokenResolver = (category, id) => {
	if (!isRichTextReferenceCategory(category)) {
		return undefined;
	}

	const item = EDITOR_PALETTE_MENTION_SOURCES[category]?.find(
		(candidate) => candidate.id === id,
	);
	if (!item) {
		return undefined;
	}

	return {
		label: item.label,
		attrs: getRichTextMentionVisualAttrs(item.visual),
	};
};

export const RichTextMention = Mention.extend({
	// Teach tiptap-markdown to round-trip a mention as `@[category:id]`. Without
	// these the node is dropped from the markdown `value` (it has no default
	// markdown spec), so an agent's tokenized `instructions` lose their lozenges.
	markdownTokenName: MENTION_MARKDOWN_TOKEN_NAME,
	markdownTokenizer: mentionMarkdownTokenizer,
	parseMarkdown: createMentionTokenParser(resolveMentionToken),
	renderMarkdown: serializeMentionNode,
	addAttributes() {
		return {
			...(this.parent?.() ?? {}),
			category: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-mention-category"),
				renderHTML: (attributes: Record<string, unknown>) => (
					attributes.category ? { "data-mention-category": attributes.category } : {}
				),
			},
			visualIconKey: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-visual-icon-key"),
				renderHTML: (attributes: Record<string, unknown>) => (
					attributes.visualIconKey ? { "data-visual-icon-key": attributes.visualIconKey } : {}
				),
			},
			visualIconColor: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-visual-icon-color"),
				renderHTML: (attributes: Record<string, unknown>) => (
					attributes.visualIconColor ? { "data-visual-icon-color": attributes.visualIconColor } : {}
				),
			},
			visualKind: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-visual-kind"),
				renderHTML: (attributes: Record<string, unknown>) => (
					attributes.visualKind ? { "data-visual-kind": attributes.visualKind } : {}
				),
			},
			visualLogoName: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-visual-logo-name"),
				renderHTML: (attributes: Record<string, unknown>) => (
					attributes.visualLogoName ? { "data-visual-logo-name": attributes.visualLogoName } : {}
				),
			},
			visualShape: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-visual-shape"),
				renderHTML: (attributes: Record<string, unknown>) => (
					attributes.visualShape ? { "data-visual-shape": attributes.visualShape } : {}
				),
			},
			visualSrc: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-visual-src"),
				renderHTML: (attributes: Record<string, unknown>) => (
					attributes.visualSrc ? { "data-visual-src": attributes.visualSrc } : {}
				),
			},
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(RichTextMentionNodeView);
	},
});

export const SlashCommand = Extension.create<RichTextEditorExtensionOptions>({
	name: "slashCommand",

	addProseMirrorPlugins() {
		const getMentionSources = this.options.getMentionSources;
		const includeFormat = this.options.includeFormat ?? true;
		// The "/" command menu resolves to the command variant (object form lets
		// Studio keep "/" nested while "@" stays flat).
		const suggestionVariant = resolveCommandVariant(this.options.suggestionVariant);

		return [
			Suggestion<RichTextSlashAction, RichTextSlashAction>({
				editor: this.editor,
				char: "/",
				pluginKey: slashCommandPluginKey,
				// The renderer computes visible items from the slash command list and
				// the live mention sources, so Tiptap does not need a static list.
				items: () => [],
				command: ({ editor, range, props }) => {
					if (props.type === "mention") {
						editor
							.chain()
							.focus()
							.insertContentAt(range, [
								{
									type: "mention",
									attrs: getMentionNodeAttrs(props.mention),
								},
								{ type: "text", text: " " },
							])
							.run();
						return;
					}

					editor.chain().focus().deleteRange(range).run();
					if (props.type === "ask-rovo") {
						props.onAskRovo?.(editor);
						return;
					}

					props.run(editor);
				},
				render: () => createSlashSuggestionRenderer(
					getMentionSources,
					this.options.onAskRovo,
					includeFormat,
					this.options.anchorToInput,
					suggestionVariant,
					this.options.onOpenDirectory,
					(editor) => exitSuggestion(editor.view, slashCommandPluginKey),
				),
			}),
		];
	},
});

/**
 * The configured `@` mention extension shared by the full document editor and
 * the mentions-only chat composer. Both surfaces insert the same mention node
 * (visual node view, `data-mention-category`, "@" suggestion) so a token reads
 * identically wherever it is created.
 */
export function createRichTextMentionExtension(
	options: RichTextEditorExtensionOptions = {},
) {
	return RichTextMention.configure({
		HTMLAttributes: {
			class: "rich-text-mention",
		},
		deleteTriggerWithBackspace: true,
		renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
		renderHTML: ({ node, options: mentionOptions }) => [
			"span",
			mergeAttributes(
				mentionOptions.HTMLAttributes,
				{
					"data-mention-category": node.attrs.category ?? getMentionCategory(node.attrs.id),
					"data-type": "mention",
				},
			),
			...[
				getRichTextMentionVisualDOMSpec(getRichTextMentionVisualFromAttrs(node.attrs)) ?? [
					"span",
					{ "aria-hidden": "true", class: "rich-text-mention-trigger" },
					"@",
				],
				[
					"span",
					{ class: "rich-text-mention-label" },
					node.attrs.label ?? node.attrs.id,
				],
			],
		],
		suggestion: {
			char: "@",
			items: () => [],
			command: ({ editor, range, props }) => {
				const mention = props as RichTextMentionItem;
				editor
					.chain()
					.focus()
					.insertContentAt(range, [
						{
							type: "mention",
							attrs: getMentionNodeAttrs(mention),
						},
						{ type: "text", text: " " },
					])
					.run();
			},
			render: () => createMentionSuggestionRenderer(
				options.getMentionSources,
				options.anchorToInput,
				resolveMentionVariant(options.suggestionVariant),
			),
		},
	});
}

export function createRichTextEditorExtensions(
	options: RichTextEditorExtensionOptions = {},
) {
	return [
		...(options.frontmatter?.enabled ? [FrontmatterNode] : []),
		StarterKit.configure({
			link: false,
			underline: false,
		}),
		Underline,
		Link.configure({
			openOnClick: false,
			HTMLAttributes: {
				class: "editor-link",
			},
		}),
		TextAlign.configure({
			types: ["heading", "paragraph"],
			alignments: ["left", "center", "right"],
		}),
		TextStyle,
		Color,
		Highlight.configure({
			multicolor: true,
		}),
		TaskList.configure({
			HTMLAttributes: {
				class: "rich-text-task-list",
			},
		}),
		TaskItem.configure({
			nested: true,
			HTMLAttributes: {
				class: "rich-text-task-item",
			},
		}),
		Table.configure({
			resizable: true,
			HTMLAttributes: {
				class: "rich-text-table",
			},
		}),
		TableRow,
		TableHeader,
		TableCell,
		createRichTextMentionExtension(options),
		SlashCommand.configure(options),
		Markdown.configure({
			indentation: {
				style: "tab",
				size: 1,
			},
		}),
	];
}
