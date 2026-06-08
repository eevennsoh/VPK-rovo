import type {
	JSONContent,
	MarkdownParseHelpers,
	MarkdownParseResult,
	MarkdownToken,
	MarkdownTokenizer,
} from "@tiptap/core";

import type { RichTextReferenceCategory } from "./types";

/**
 * Markdown ↔ Mention token codec.
 *
 * The RichTextEditor takes/returns its content as a markdown string (`value` →
 * `setContent(value, { contentType: "markdown" })`, `getMarkdown()` on update).
 * tiptap-markdown has no idea what a Mention node is, so without a codec a
 * mention silently drops out of the markdown round-trip. This module teaches
 * tiptap-markdown to serialize a mention node to a stable inline token and parse
 * that token back into a mention node, so an agent's `instructions` markdown
 * string hydrates into colored lozenges and serializes back losslessly.
 *
 * Pure (no React / tiptap-runtime imports) so it is unit-testable under
 * `node --test`; `extensions.ts` wires these into the Mention node config and
 * injects the real directory resolver via {@link createMentionTokenParser}.
 *
 * ## Token grammar
 *
 * ```
 * @[<category>:<id>]
 * ```
 *
 * The bracketed payload is exactly the mention node's stored `id` attr, which is
 * already `category:dirId` (see `toMentionId` in editor-palette mention-sources:
 * `"${category}:${id}"`). `<id>` may itself contain colons — knowledge ids nest
 * as `knowledge:appId:contentId`. The leading segment before the first colon is
 * the category and must be one of the reference categories allowed in a body
 * (`subagent | skill | tool | knowledge`); other categories (human, team, …) are
 * not emitted as body tokens.
 *
 * Examples: `@[skill:web-search]`, `@[subagent:research-bot]`,
 * `@[knowledge:slack:all]`.
 */

/** Marked token type / `markdownTokenName` for a serialized mention. */
export const MENTION_MARKDOWN_TOKEN_NAME = "mentionToken";

/**
 * Reference categories that may appear as `@[category:id]` tokens in a body.
 * Mirrors `RICH_TEXT_REFERENCE_CATEGORY_OPTIONS` but kept local so this module
 * stays free of React imports (the options file is a `.tsx`).
 */
const BODY_TOKEN_CATEGORIES: ReadonlySet<RichTextReferenceCategory> = new Set([
	"subagent",
	"skill",
	"tool",
	"knowledge",
]);

function isBodyTokenCategory(value: string): value is RichTextReferenceCategory {
	return BODY_TOKEN_CATEGORIES.has(value as RichTextReferenceCategory);
}

// Inner payload of a token: `category:id`. Allow the id-safe character set
// `toMentionId` can produce (letters, digits, `-`, `_`, `.`) plus `:` so nested
// knowledge ids round-trip. Anchored matching is applied by the caller.
const TOKEN_INNER = "[A-Za-z0-9_./:-]+";
const ANCHORED_TOKEN = new RegExp(`^@\\[(${TOKEN_INNER})\\]`);
const SCAN_TOKEN = new RegExp(`@\\[${TOKEN_INNER}\\]`);

/**
 * Split a token's `id` payload (`category:rest`) into its category and the
 * stored mention id. Returns `null` when the payload is not a valid body token
 * (missing colon, empty id, or a non-body category) — the caller then leaves the
 * source as plain text rather than fabricating a mention.
 */
export function parseMentionTokenId(
	payload: string,
): { category: RichTextReferenceCategory; id: string } | null {
	const separator = payload.indexOf(":");
	if (separator <= 0 || separator === payload.length - 1) {
		return null;
	}

	const category = payload.slice(0, separator);
	if (!isBodyTokenCategory(category)) {
		return null;
	}

	// The stored `id` attr is the full `category:rest` payload (per toMentionId),
	// not just the trailing segment — emit/consume it verbatim.
	return { category, id: payload };
}

/**
 * Serialize a mention node to its markdown token. The token carries the stored
 * `id` (already `category:rest`); the visible label is intentionally NOT in the
 * token so the id stays the single source of truth and a renamed directory entry
 * re-resolves its label on parse. Falls back to the node label as plain `@label`
 * only when the id is missing/non-body (so nothing is silently lost).
 */
export function serializeMentionNode(node: JSONContent): string {
	const attrs = node.attrs ?? {};
	const id = typeof attrs.id === "string" ? attrs.id : "";

	if (id && parseMentionTokenId(id)) {
		return `@[${id}]`;
	}

	const label = typeof attrs.label === "string" ? attrs.label : id;
	return label ? `@${label}` : "";
}

/**
 * Resolves a token's `{ category, id }` to the label/visual attrs the mention
 * node view needs. Injected by `extensions.ts` (backed by the editor-palette
 * directory) so this module has no dependency on the React visual layer.
 *
 * Returning `undefined` means "unknown id" — the parser then leaves the token as
 * plain text (render-or-passthrough; upstream ingest handles repair).
 */
export type MentionTokenResolver = (
	category: RichTextReferenceCategory,
	id: string,
	// `attrs` is the resolver's extra mention attrs (typically visual attrs). Typed
	// as `object` (not `Record<string, unknown>`) so a typed attrs *interface*
	// without an index signature is still assignable; the parser spreads it.
) => { label: string; attrs: object } | undefined;

/**
 * Marked inline tokenizer for `@[category:id]`. Only emits a token when the
 * payload is a valid body token; otherwise yields to marked's default inline
 * tokenizers so the literal text survives untouched.
 */
export const mentionMarkdownTokenizer: MarkdownTokenizer = {
	name: MENTION_MARKDOWN_TOKEN_NAME,
	level: "inline",
	start(src: string) {
		const match = src.match(SCAN_TOKEN);
		return match?.index ?? -1;
	},
	tokenize(src: string): MarkdownToken | undefined {
		const match = ANCHORED_TOKEN.exec(src);
		if (!match) {
			return undefined;
		}

		const payload = match[1];
		// Validate here so an invalid payload (e.g. `@[human:foo]`) is left to the
		// default tokenizer instead of becoming an empty/garbage token.
		if (!parseMentionTokenId(payload)) {
			return undefined;
		}

		return {
			type: MENTION_MARKDOWN_TOKEN_NAME,
			raw: match[0],
			payload,
		};
	},
};

/**
 * Build the `parseMarkdown` handler for the mention token, bound to a resolver.
 * Known ids become a mention node (with resolved label + visual attrs); unknown
 * ids fall back to the literal token text so nothing crashes and the source is
 * preserved for upstream repair.
 */
export function createMentionTokenParser(resolve: MentionTokenResolver) {
	return (token: MarkdownToken, helpers: MarkdownParseHelpers): MarkdownParseResult => {
		const payload = typeof token.payload === "string" ? token.payload : "";
		const parsed = parseMentionTokenId(payload);

		if (!parsed) {
			return helpers.createTextNode(token.raw ?? `@[${payload}]`);
		}

		const resolved = resolve(parsed.category, parsed.id);
		if (!resolved) {
			// Unknown id: render-or-passthrough. Keep the original token text so a
			// later ingest pass can repair it rather than losing the reference.
			return helpers.createTextNode(token.raw ?? `@[${payload}]`);
		}

		return helpers.createNode("mention", {
			category: parsed.category,
			id: parsed.id,
			label: resolved.label,
			mentionSuggestionChar: "@",
			...resolved.attrs,
		});
	};
}
