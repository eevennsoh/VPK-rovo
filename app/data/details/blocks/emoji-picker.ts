import type { ComponentDetail } from "@/app/data/component-detail-types";

export const EMOJI_PICKER_DETAIL: ComponentDetail = {
	description:
		'A reusable emoji reaction kit: an "Add reaction" popover that opens on a six-emoji quick bar and discloses a full searchable picker on demand, plus reaction pills and a composed action row. Every component is fully controlled — it emits a glyph and owns no reaction state, so the toggle math stays in the consumer\'s reducer. The full picker is `next/dynamic`-loaded and reads self-hosted emojibase JSON from `public/emoji-data/`, so nothing is fetched until the “…” disclosure is used. Refresh that data with `pnpm run sync:emoji-data`, which copies `emojibase-data/en/{data.json,messages.json}` into `public/emoji-data/en/`; the output is committed so the static export stays self-contained.',
	importStatement: `import {
  EmojiPickerPopover,
  EmojiReactionBar,
  EmojiReactionPill,
} from "@/components/blocks/emoji-picker";
import type { EmojiReactionSummary } from "@/components/blocks/emoji-picker";`,
	usage: `import { useState } from "react";

import { EmojiReactionBar } from "@/components/blocks/emoji-picker";
import type { EmojiReactionSummary } from "@/components/blocks/emoji-picker";

// The block is fully controlled and ships no toggle helper — the math lives in
// the consumer, so there is exactly one implementation of it per surface.
function toggleReaction(
  reactions: readonly EmojiReactionSummary[],
  emoji: string,
): readonly EmojiReactionSummary[] {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);
  if (!existing) {
    return [...reactions, { emoji, count: 1, reacted: true }];
  }
  if (existing.reacted) {
    return existing.count <= 1
      ? reactions.filter((reaction) => reaction.emoji !== emoji)
      : reactions.map((reaction) =>
          reaction.emoji === emoji
            ? { ...reaction, count: reaction.count - 1, reacted: false }
            : reaction,
        );
  }
  return reactions.map((reaction) =>
    reaction.emoji === emoji
      ? { ...reaction, count: reaction.count + 1, reacted: true }
      : reaction,
  );
}

const [reactions, setReactions] = useState<readonly EmojiReactionSummary[]>([
  { emoji: "👍", count: 3, reacted: true },
  { emoji: "🔥", count: 1 },
]);

<EmojiReactionBar
  reactions={reactions}
  onToggleReaction={(emoji) => setReactions((current) => toggleReaction(current, emoji))}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		previewHeight: "fit",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "onSelect",
			type: "(emoji: string) => void",
			required: true,
			description:
				"Called with each chosen glyph from either the quick bar or the full picker. The popover stays open for repeated selections.",
		},
		{
			name: "trigger",
			type: "ReactNode",
			default: "ghost icon Button with EmojiAddIcon",
			description:
				"A React element replaces the default trigger outright; any other node becomes the default Button's children.",
		},
		{
			name: "triggerLabel",
			type: "string",
			default: '"Add reaction"',
			description: "Accessible name applied to the default trigger Button.",
		},
		{
			name: "open",
			type: "boolean",
			default: "undefined (uncontrolled)",
			description: "Controlled open state of the popover.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "Called whenever the popover opens or closes.",
		},
		{
			name: "align",
			type: '"start" | "center" | "end"',
			default: '"start"',
			description: "Alignment forwarded to PopoverContent.",
		},
		{
			name: "side",
			type: '"top" | "bottom" | "left" | "right"',
			default: '"bottom"',
			description: "Placement side forwarded to PopoverContent.",
		},
		{
			name: "defaultView",
			type: '"quick" | "full"',
			default: '"quick"',
			description:
				"Which view the popover opens on. The view resets to this on every close. Opening on `full` loads the picker library and emojibase data immediately.",
		},
		{
			name: "frequent",
			type: "readonly string[]",
			default: "FREQUENT_EMOJI",
			description: "Overrides the six glyphs offered by the quick bar.",
		},
		{
			name: "positionerClassName",
			type: "string",
			default: '"z-[502]"',
			description: "Classes on the popover positioner. The default clears the work-item dialog.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the popover content surface.",
		},
	],
	subComponents: [
		{
			name: "EmojiReactionBar",
			description:
				"The composed action row: an optional leading slot (e.g. Reply), the reaction pills, the add-reaction popover, then a trailing slot pushed right. Picker choices only add reactions, while pill clicks can toggle them off.",
			props: [
				{
					name: "reactions",
					type: "readonly EmojiReactionSummary[]",
					required: true,
					description: "Reaction view models rendered as pills, in display order.",
				},
				{
					name: "onToggleReaction",
					type: "(emoji: string) => void",
					required: true,
					description:
						"Called for a pill click or a picker selection that the viewer has not already added. Re-selecting an active reaction only confirms its existing state.",
				},
				{
					name: "showAddReaction",
					type: "boolean",
					default: "true",
					description: "Set false to render pills without the add-reaction popover.",
				},
				{
					name: "leading",
					type: "ReactNode",
					description: "Content rendered before the pills, such as a Reply button.",
				},
				{
					name: "trailing",
					type: "ReactNode",
					description: "Content rendered in a right-aligned group, such as Edit or More.",
				},
				{
					name: "frequent",
					type: "readonly string[]",
					default: "FREQUENT_EMOJI",
					description: "Forwarded to the popover's quick bar.",
				},
				{
					name: "aria-label",
					type: "string",
					default: '"Reactions"',
					description: 'Accessible name for the row, which renders as `role="group"`.',
				},
				{
					name: "className",
					type: "string",
					description: "Additional classes applied to the row.",
				},
			],
		},
		{
			name: "EmojiReactionPill",
			description:
				"A single reaction chip: the glyph is `aria-hidden` and the count is visible text. Selected styling comes entirely from `aria-pressed` on the shared Button base, so this component never hand-rolls selected colors.",
			props: [
				{
					name: "emoji",
					type: "string",
					required: true,
					description: "The reaction glyph, also used as the toggle key.",
				},
				{
					name: "count",
					type: "number",
					required: true,
					description: "Number of actors who reacted. Always rendered as visible text.",
				},
				{
					name: "pressed",
					type: "boolean",
					default: "false",
					description: "Whether the viewer reacted. Drives `aria-pressed` and the selected tokens.",
				},
				{
					name: "confirmed",
					type: "boolean",
					default: "false",
					description:
						"Briefly applies the selected-hover background to confirm an already-active picker choice.",
				},
				{
					name: "label",
					type: "string",
					default: "`${count} reacted with ${emoji}`",
					description:
						'Accessible label override, e.g. "Priya and 2 others reacted with thumbs up".',
				},
				{
					name: "onToggle",
					type: "(emoji: string) => void",
					description: "Called with the glyph when the pill is activated.",
				},
				{
					name: "className",
					type: "string",
					description: "Additional classes applied to the pill.",
				},
			],
		},
		{
			name: "EmojiQuickBar",
			description:
				"The zero-data fast path shown when the popover opens: six circular emoji buttons, a divider, and a “…” disclosure. Needs no emojibase fetch and no picker library bundle.",
			props: [
				{
					name: "onSelect",
					type: "(emoji: string) => void",
					required: true,
					description: "Called with the chosen glyph.",
				},
				{
					name: "frequent",
					type: "readonly string[]",
					default: "FREQUENT_EMOJI",
					description: "Overrides the offered glyphs.",
				},
				{
					name: "onShowMore",
					type: "() => void",
					description: "Omit to hide the “…” disclosure entirely.",
				},
				{
					name: "showMoreExpanded",
					type: "boolean",
					default: "false",
					description: "Reflected as `aria-expanded` on the disclosure button.",
				},
				{
					name: "className",
					type: "string",
					description: "Additional classes applied to the bar.",
				},
			],
		},
		{
			name: "EmojiPickerPanel",
			description:
				"The full searchable picker — the only file that imports the picker library. Reads self-hosted emojibase JSON from `/emoji-data/en/`, so it works offline and inside the Micros static export. Load it with `dynamic(() => import(...), { ssr: false })`; the popover already does.",
			props: [
				{
					name: "onSelect",
					type: "(emoji: string) => void",
					required: true,
					description: "Called with the chosen glyph.",
				},
				{
					name: "className",
					type: "string",
					description: "Additional classes applied to the panel root.",
				},
			],
		},
		{
			name: "EmojiReactionSummary",
			description:
				"Presentational view model (`emoji`, `count`, `reacted?`, `label?`). Consumers normalize their own storage — actor ids, server counts — into this shape at the boundary, which is what keeps the block domain-agnostic. `FREQUENT_EMOJI` and `emojiLabel(emoji)` ship alongside it.",
		},
	],
	examples: [
		{
			title: "Reaction bar",
			description:
				"Leading Reply slot, live pills, and the add-reaction popover wired to a local toggle.",
			demoSlug: "emoji-picker-demo-reaction-bar",
		},
		{
			title: "Add reaction popover",
			description:
				"The default ghost trigger opening on the six-emoji quick bar, with the “…” disclosure to the full picker.",
			demoSlug: "emoji-picker-demo-popover",
		},
		{
			title: "Full picker",
			description:
				'Opening straight onto the searchable panel with `defaultView="full"`, which loads the emojibase data from same-origin `/emoji-data/en/`.',
			demoSlug: "emoji-picker-demo-full-picker",
		},
		{
			title: "Pill states",
			description: "Default, selected via `aria-pressed`, and a custom accessible label.",
			demoSlug: "emoji-picker-demo-pills",
		},
	],
};
