import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import type { FrontmatterEntries } from "@/app/data/directory/skill-frontmatter";

import {
	createFrontmatterParser,
	FRONTMATTER_MARKDOWN_TOKEN_NAME,
	frontmatterMarkdownTokenizer,
	serializeFrontmatterNode,
} from "./frontmatter-codec";
import { FrontmatterNodeView } from "./frontmatter-node-view";

function readEntries(raw: string | null): FrontmatterEntries {
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

/**
 * Block-level `frontmatter` node: renders a SKILL.md YAML frontmatter block as an
 * editable key/value card (the React node view). It is an atom — ProseMirror
 * keeps no editable children; all editing happens through the controlled inputs
 * in the node view, which write back via `updateAttributes({ entries })`. The
 * markdown hooks make it round-trip through `@tiptap/markdown` as a `---` fence.
 *
 * Opt-in: only registered when `RichTextEditorExtensionOptions.frontmatter.enabled`
 * is set (see extensions.ts), so no other editor consumer is affected.
 */
export const FrontmatterNode = Node.create({
	name: "frontmatter",
	group: "block",
	atom: true,
	selectable: false,
	draggable: false,
	// Pin it to the very top: no insert command is exposed and the markdown parser
	// only ever emits it as the leading block.
	markdownTokenName: FRONTMATTER_MARKDOWN_TOKEN_NAME,
	markdownTokenizer: frontmatterMarkdownTokenizer,
	parseMarkdown: createFrontmatterParser(),
	renderMarkdown: serializeFrontmatterNode,

	addAttributes() {
		return {
			entries: {
				default: [] as FrontmatterEntries,
				parseHTML: (element: HTMLElement) => readEntries(element.getAttribute("data-entries")),
				renderHTML: (attributes: Record<string, unknown>) => ({
					"data-entries": JSON.stringify(attributes.entries ?? []),
				}),
			},
		};
	},

	parseHTML() {
		return [{ tag: "div[data-frontmatter]" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["div", mergeAttributes(HTMLAttributes, { "data-frontmatter": "" })];
	},

	addNodeView() {
		return ReactNodeViewRenderer(FrontmatterNodeView);
	},
});
