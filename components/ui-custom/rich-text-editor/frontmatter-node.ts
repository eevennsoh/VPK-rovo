import { mergeAttributes, Node } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import type { FrontmatterEntries, FrontmatterEntry } from "@/app/data/directory/skill-frontmatter";

import {
	createFrontmatterParser,
	FRONTMATTER_MARKDOWN_TOKEN_NAME,
	frontmatterMarkdownTokenizer,
	serializeFrontmatterNode,
} from "./frontmatter-codec";
import { FrontmatterNodeView } from "./frontmatter-node-view";

// Body mention categories whose labels are mirrored into frontmatter allowed-tools.
const ALLOWED_TOOL_MENTION_CATEGORIES = new Set(["app", "tool", "knowledge"]);

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

function collectFrontmatterNodes(doc: ProseMirrorNode): Array<{ node: ProseMirrorNode; pos: number }> {
	const found: Array<{ node: ProseMirrorNode; pos: number }> = [];
	doc.forEach((node, offset) => {
		if (node.type.name === "frontmatter") {
			found.push({ node, pos: offset });
		}
	});
	return found;
}

function collectAllowedToolMentionLabels(doc: ProseMirrorNode): Set<string> {
	const labels = new Set<string>();
	doc.descendants((node) => {
		if (node.type.name === "mention" && ALLOWED_TOOL_MENTION_CATEGORIES.has(String(node.attrs.category))) {
			const label = node.attrs.label ?? node.attrs.id;
			if (label) {
				labels.add(String(label));
			}
		}
		return true;
	});
	return labels;
}

function getAllowedToolsList(entries: FrontmatterEntries): string[] {
	const entry = entries.find((candidate) => candidate.key === "allowed-tools");
	if (!entry) {
		return [];
	}
	return Array.isArray(entry.value) ? [...entry.value] : [String(entry.value)];
}

function withAllowedTools(entries: FrontmatterEntries, allowed: readonly string[]): FrontmatterEntry[] {
	const next: FrontmatterEntry = { key: "allowed-tools", value: [...allowed] };
	return entries.some((entry) => entry.key === "allowed-tools")
		? entries.map((entry) => (entry.key === "allowed-tools" ? next : entry))
		: [...entries, next];
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

	addProseMirrorPlugins() {
		const nodeName = this.name;
		const pluginKey = new PluginKey<{ entries: FrontmatterEntries }>("frontmatterPin");
		return [
			new Plugin<{ entries: FrontmatterEntries }>({
				key: pluginKey,
				// Remember the latest frontmatter entries so a deleted card can be
				// re-created with its content rather than an empty starter.
				state: {
					init: (_config, state) => ({
						entries: (collectFrontmatterNodes(state.doc)[0]?.node.attrs.entries as FrontmatterEntries) ?? [],
					}),
					apply: (_tr, value, _oldState, newState) => {
						const first = collectFrontmatterNodes(newState.doc)[0];
						return first ? { entries: (first.node.attrs.entries as FrontmatterEntries) ?? [] } : value;
					},
				},
				appendTransaction: (transactions, oldState, newState) => {
					if (!transactions.some((tr) => tr.docChanged)) {
						return null;
					}
					const nodeType = newState.schema.nodes[nodeName];
					const frontmatterNodes = collectFrontmatterNodes(newState.doc);
					const tr = newState.tr;
					let changed = false;

					// (a) Single source of truth: a SKILL.md has exactly one frontmatter
					// card. A paste can insert extra `---…---` blocks; collapse them to one
					// card pinned at the top, keeping the latest (last) block's content so
					// the most recent paste overwrites the older one.
					if (frontmatterNodes.length > 1) {
						const latest = frontmatterNodes[frontmatterNodes.length - 1];
						const latestEntries = (latest.node.attrs.entries as FrontmatterEntries) ?? [];
						// Delete from last to first so earlier positions stay valid, then
						// re-insert a single card at the top with the latest content.
						for (let index = frontmatterNodes.length - 1; index >= 0; index -= 1) {
							const { node, pos } = frontmatterNodes[index];
							tr.delete(pos, pos + node.nodeSize);
						}
						tr.insert(0, nodeType.create({ entries: latestEntries }));
						return tr;
					}

					// (b) Pin: re-insert a single card at the top if it was deleted
					// (backspace / select-all), so the SKILL.md never loses its frontmatter.
					if (frontmatterNodes.length === 0) {
						const remembered = pluginKey.getState(oldState)?.entries ?? [];
						tr.insert(0, nodeType.create({ entries: remembered }));
						return tr;
					}

					// (c) Sync: mirror body app/tool/knowledge mentions into allowed-tools.
					// Diff old→new so a tag removed in the card stays removed (body
					// unchanged ⇒ empty diff), while a mention added/removed via `/` in
					// the body adds/removes the matching allowed-tools entry.
					const before = collectAllowedToolMentionLabels(oldState.doc);
					const after = collectAllowedToolMentionLabels(newState.doc);
					const added = [...after].filter((label) => !before.has(label));
					const removed = new Set([...before].filter((label) => !after.has(label)));
					if (added.length > 0 || removed.size > 0) {
						const first = frontmatterNodes[0];
						const entries = (first.node.attrs.entries as FrontmatterEntries) ?? [];
						const allowed = getAllowedToolsList(entries);
						const seen = new Set(allowed.map((value) => value.toLowerCase()));
						const nextAllowed = allowed.filter((value) => !removed.has(value));
						for (const label of added) {
							if (!seen.has(label.toLowerCase())) {
								nextAllowed.push(label);
								seen.add(label.toLowerCase());
							}
						}
						const allowedChanged =
							nextAllowed.length !== allowed.length ||
							nextAllowed.some((value, index) => value !== allowed[index]);
						if (allowedChanged) {
							tr.setNodeMarkup(first.pos, undefined, {
								...first.node.attrs,
								entries: withAllowedTools(entries, nextAllowed),
							});
							changed = true;
						}
					}

					return changed ? tr : null;
				},
			}),
		];
	},
});
