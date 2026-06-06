import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Plain-text serialization for the mentions-only chat composer.
 *
 * The composer document is intentionally minimal: a `doc` of `paragraph`s, each
 * holding inline `text`, `hardBreak`, and `mention` nodes. These helpers walk
 * that structure into the plain string the chat transports expect, turning each
 * mention back into its `@`/`/` sigil + label so the serialized text reads the
 * way the user typed it.
 *
 * The core logic operates on a ProseMirror `Node` (the document) rather than a
 * live `Editor`, so it can be unit-tested by constructing a doc/JSON without a
 * DOM. `serializeComposerDoc` is the thin `Editor`-facing convenience wrapper.
 */

/** Categories surfaced through the "@" mention menu (people and teams). */
const AT_SIGIL_CATEGORIES: ReadonlySet<string> = new Set(["human", "team"]);

/**
 * Resolve the sigil a mention serializes with. People/teams come from the "@"
 * surface; skills/tools/knowledge/subagents come from the "/" surface. Anything
 * unknown defaults to "@" so a stray mention still round-trips to a usable token.
 */
function getMentionSigil(category: unknown): "@" | "/" {
	if (typeof category === "string" && !AT_SIGIL_CATEGORIES.has(category)) {
		// skill | tool | knowledge | subagent (and any future "/" category).
		return "/";
	}

	return "@";
}

/** Serialize a single mention node to its sigil + label (e.g. "@Andrea Wilson"). */
function serializeMention(node: ProseMirrorNode): string {
	const sigil = getMentionSigil(node.attrs.category);
	const label =
		typeof node.attrs.label === "string" && node.attrs.label.trim()
			? node.attrs.label
			: String(node.attrs.id ?? "");

	return `${sigil}${label}`;
}

/** Serialize the inline content of one block (paragraph) to a string. */
function serializeInline(block: ProseMirrorNode): string {
	let text = "";

	block.forEach((child) => {
		if (child.type.name === "text") {
			text += child.text ?? "";
			return;
		}

		if (child.type.name === "mention") {
			text += serializeMention(child);
			return;
		}

		if (child.type.name === "hardBreak") {
			text += "\n";
		}
	});

	return text;
}

/**
 * Serialize a ProseMirror composer document to plain text. Block (paragraph)
 * boundaries and hard breaks both become "\n"; mentions become their sigil +
 * label. Trailing whitespace is trimmed so an empty trailing paragraph (which
 * ProseMirror keeps as the editing caret line) does not leak a stray newline.
 */
export function serializeComposerNode(doc: ProseMirrorNode): string {
	const blocks: string[] = [];

	doc.forEach((block) => {
		blocks.push(serializeInline(block));
	});

	return blocks.join("\n").replace(/\s+$/u, "");
}

/** Serialize a live editor's document to plain text. */
export function serializeComposerDoc(editor: Editor): string {
	return serializeComposerNode(editor.state.doc);
}

/**
 * Build the ProseMirror JSON document for a plain string: one paragraph per
 * line, with empty paragraphs for blank lines. No mention parsing — plain text
 * stays plain so prefilled/cleared values never resurrect tokens.
 */
export function buildComposerDocJSON(text: string): {
	type: "doc";
	content: Array<{
		type: "paragraph";
		content?: Array<{ type: "text"; text: string }>;
	}>;
} {
	const lines = text.split("\n");

	return {
		type: "doc",
		content: lines.map((line) =>
			line.length > 0
				? { type: "paragraph", content: [{ type: "text", text: line }] }
				: { type: "paragraph" },
		),
	};
}

/**
 * Replace the editor's document with the plain string, as paragraphs split on
 * "\n". No mention parsing. Updates are not emitted (so callers can sync from an
 * external value without re-triggering their own onUpdate handlers); the host is
 * responsible for any follow-up sync it needs.
 */
export function setComposerPlainText(editor: Editor, text: string): void {
	editor.commands.setContent(buildComposerDocJSON(text), {
		emitUpdate: false,
	});
}
