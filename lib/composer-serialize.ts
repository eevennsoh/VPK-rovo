import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Plain-text serialization for the mentions-only chat composer.
 *
 * The composer document is intentionally minimal: a `doc` of `paragraph`s, each
 * holding inline `text`, `hardBreak`, and `mention` nodes. These helpers walk
 * that structure into the plain string the chat transports expect, turning each
 * mention back into the text the user typed so the serialized text stays
 * aligned with controlled composer values.
 *
 * The core logic operates on a ProseMirror `Node` (the document) rather than a
 * live `Editor`, so it can be unit-tested by constructing a doc/JSON without a
 * DOM. `serializeComposerDoc` is the thin `Editor`-facing convenience wrapper.
 */

/** Categories surfaced through the "@" mention menu (people, teams, and subagents). */
const AT_SIGIL_CATEGORIES: ReadonlySet<string> = new Set(["human", "team", "subagent"]);

/**
 * Resolve the sigil a mention serializes with. People/teams/subagents come from
 * the "@" surface; skills/tools/knowledge/apps come from the "/" surface.
 * Anything unknown defaults to "@" so a stray mention still round-trips to a
 * usable token.
 */
function getMentionSigil(category: unknown): "@" | "/" {
	if (typeof category === "string" && !AT_SIGIL_CATEGORIES.has(category)) {
		// skill | tool | knowledge | app (and any future "/" category).
		return "/";
	}

	return "@";
}

/**
 * Serialize a single mention node to its source text or sigil + label
 * (e.g. "@Andrea Wilson").
 */
export function serializeComposerMentionAttrs(attrs: {
	category?: unknown;
	id?: unknown;
	label?: unknown;
	sourceText?: unknown;
}): string {
	if (typeof attrs.sourceText === "string" && attrs.sourceText) {
		return attrs.sourceText;
	}

	const sigil = getMentionSigil(attrs.category);
	const label =
		typeof attrs.label === "string" && attrs.label.trim()
			? attrs.label
			: String(attrs.id ?? "");

	return `${sigil}${label}`;
}

function serializeMention(node: ProseMirrorNode): string {
	return serializeComposerMentionAttrs(node.attrs);
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
 * boundaries and hard breaks both become "\n"; mentions become source text when
 * available, otherwise sigil + label. Trailing blank lines are trimmed so an
 * empty trailing paragraph (which ProseMirror keeps as the editing caret line)
 * does not leak a stray newline — but intentional trailing spaces on the last
 * line are preserved.
 */
export function serializeComposerNode(doc: ProseMirrorNode): string {
	const blocks: string[] = [];

	doc.forEach((block) => {
		blocks.push(serializeInline(block));
	});

	return blocks.join("\n").replace(/\n+$/u, "");
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
	// setContent resets the selection to the document start; move the caret to
	// the end so prefilled / synced / voice-transcript text is appended when the
	// user starts typing, not prepended. Selection only — does not steal focus.
	editor.commands.setTextSelection(editor.state.doc.content.size);
}
