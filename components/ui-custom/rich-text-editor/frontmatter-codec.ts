import type {
	JSONContent,
	MarkdownParseHelpers,
	MarkdownParseResult,
	MarkdownToken,
	MarkdownTokenizer,
} from "@tiptap/core";

import {
	parseFrontmatterYaml,
	serializeFrontmatterYaml,
	type FrontmatterEntries,
} from "@/app/data/directory/skill-frontmatter";

/**
 * Markdown ↔ frontmatter-node codec.
 *
 * Teaches `@tiptap/markdown` to recognize a leading `---\n…\n---` YAML block as a
 * single block-level `frontmatter` node (rendered as the editable key/value card)
 * and to serialize that node back to the same fenced block — so the editor's
 * markdown round-trip preserves the SKILL.md frontmatter and the "Markdown" view
 * shows the full file. Modeled on `mention-token-codec.ts` (the inline analog).
 *
 * Pure (no React) so it is unit-testable; the YAML parse/serialize is reused from
 * the app codec (`app/data/directory/skill-frontmatter.ts`).
 */
export const FRONTMATTER_MARKDOWN_TOKEN_NAME = "frontmatterToken";

const FRONTMATTER_BLOCK_RE = /^---\n([\s\S]*?)\n---(?:\n|$)/u;
const FIRST_KEY_RE = /^\s*[^\s:#][^:]*:(?:\s|$)/u;

/** True when the YAML payload's first non-empty line looks like a `key:` line. */
function looksLikeFrontmatter(payload: string): boolean {
	const firstLine = payload.split("\n").find((line) => line.trim() !== "");
	return firstLine !== undefined && FIRST_KEY_RE.test(firstLine);
}

/**
 * Marked block tokenizer for a leading YAML frontmatter fence. Only fires at the
 * very start of a block and only when the fenced content reads as `key:` lines,
 * so a mid-body thematic break (`---`) is left to marked's default `hr` rule.
 */
export const frontmatterMarkdownTokenizer: MarkdownTokenizer = {
	name: FRONTMATTER_MARKDOWN_TOKEN_NAME,
	level: "block",
	start(src: string) {
		return src.startsWith("---\n") ? 0 : -1;
	},
	tokenize(src: string): MarkdownToken | undefined {
		const match = FRONTMATTER_BLOCK_RE.exec(src);
		if (!match || match.index !== 0 || !looksLikeFrontmatter(match[1])) {
			return undefined;
		}
		return {
			type: FRONTMATTER_MARKDOWN_TOKEN_NAME,
			raw: match[0],
			payload: match[1],
		};
	},
};

/** Build the `parseMarkdown` handler — a frontmatter token becomes a frontmatter node. */
export function createFrontmatterParser() {
	return (token: MarkdownToken, helpers: MarkdownParseHelpers): MarkdownParseResult => {
		const payload = typeof token.payload === "string" ? token.payload : "";
		return helpers.createNode("frontmatter", { entries: parseFrontmatterYaml(payload) });
	};
}

/** Serialize a frontmatter node back to its `---` fenced YAML block. */
export function serializeFrontmatterNode(node: JSONContent): string {
	const entries = (node.attrs?.entries ?? []) as FrontmatterEntries;
	if (entries.length === 0) {
		return "";
	}
	return `---\n${serializeFrontmatterYaml(entries)}\n---`;
}
