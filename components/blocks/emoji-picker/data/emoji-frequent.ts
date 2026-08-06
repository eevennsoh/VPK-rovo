/**
 * Presentational view model for a single reaction. Consumers normalize their own
 * storage (actor ids, server counts, …) into this shape at the boundary, which is
 * what keeps the emoji-picker block domain-agnostic.
 */
export interface EmojiReactionSummary {
	/** The reaction glyph, used as the stable key. */
	emoji: string;
	/** Number of actors who reacted. Always rendered as visible text. */
	count: number;
	/** Whether the viewer reacted. Drives `aria-pressed` on the pill. */
	reacted?: boolean;
	/** Accessible label override, e.g. "Priya and 2 others reacted with thumbs up". */
	label?: string;
	/** Names shown in the optional Slack-like reaction hover detail. */
	reactorNames?: readonly string[];
}

/** Formats actor names as an English conjunction for compact reaction details. */
export function formatReactionActorNames(names: readonly string[]): string {
	if (names.length < 2) return names[0] ?? "";
	if (names.length === 2) return `${names[0]} and ${names[1]}`;
	return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

/**
 * The six reactions offered by the quick bar before the full picker loads.
 *
 * Each glyph MUST be byte-identical to the `emoji` field emojibase ships for it,
 * because reactions are keyed by the raw glyph string. Thumbs-up in particular
 * carries a U+FE0F variation selector in emojibase ("👍️", not "👍"); using the
 * bare codepoint here would make a quick-bar pick and a full-picker pick create
 * two separate pills for the same reaction. `emoji-picker.test.js` asserts every
 * entry round-trips against `public/emoji-data/en/data.json`.
 */
export const FREQUENT_EMOJI = ["👍️","👏","🔥","❤️","😮","🤗"] as const;

/**
 * Spoken names so screen readers announce "thumbs up" rather than relying on
 * the reader's own emoji dictionary. Covers the quick bar plus the reactions
 * that commonly reach us from seed and demo data.
 *
 * This cannot be exhaustive: a glyph chosen from the full picker arrives as a
 * bare string, and emojibase's own labels live in the lazily fetched 762 KB
 * dataset. Unknown glyphs therefore fall back to the glyph itself, which modern
 * screen readers still announce by its CLDR name. Pass `EmojiReactionSummary.label`
 * when a consumer knows a better name.
 */
const EMOJI_LABELS: Readonly<Record<string, string>> = {
	"👍️": "thumbs up",
	// Bare U+1F44D renders identically and may reach us from hand-authored seed
	// data, so it resolves to the same name rather than falling back to the glyph.
	"👍": "thumbs up",
	"👏": "clapping hands",
	"🔥": "fire",
	"❤️": "red heart",
	"❤": "red heart",
	"😮": "face with open mouth",
	"🤗": "smiling face with open hands",
	"🎉": "party popper",
	"🙏": "folded hands",
	"👀": "eyes",
	"✅": "check mark button",
	"🚀": "rocket",
	"😄": "grinning face with smiling eyes",
	"🤔": "thinking face",
	"👎": "thumbs down",
};

/** Resolves the accessible name for a glyph, falling back to the glyph itself. */
export function emojiLabel(emoji: string): string {
	return EMOJI_LABELS[emoji] ?? emoji;
}
