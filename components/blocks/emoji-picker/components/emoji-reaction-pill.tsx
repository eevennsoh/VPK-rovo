"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { emojiLabel } from "../data/emoji-frequent";

export interface EmojiReactionPillProps {
	emoji: string;
	count: number;
	pressed?: boolean;
	confirmed?: boolean;
	label?: string;
	onToggle?: (emoji: string) => void;
	className?: string;
}

/**
 * A single reaction chip. Selected styling comes entirely from `aria-pressed`,
 * which the shared Button base already maps to the selected token set — this
 * component must never hand-roll those colors.
 *
 * Geometry matches `components/ui/tag.tsx`: the squarish `rounded-sm` corner and
 * 12px `text-xs` label, so a reaction chip reads as the same family as a Tag.
 * The glyph is a plain span, so the button's font-size sizes it and the count
 * together.
 */
export function EmojiReactionPill({
	emoji,
	count,
	pressed = false,
	confirmed = false,
	label,
	onToggle,
	className,
}: Readonly<EmojiReactionPillProps>) {
	return (
		<Button
			// The glyph is `aria-hidden` below, so the name must spell it out —
			// interpolating the raw codepoint here would put it straight back in.
			// The visible count is kept in the name to satisfy WCAG 2.5.3 Label in Name.
			aria-label={label ?? `${count} reacted with ${emojiLabel(emoji)}`}
			aria-pressed={pressed}
			className={cn(
				"gap-1 rounded-sm px-2 text-xs font-normal tabular-nums duration-fast ease-out-practical motion-reduce:transition-none",
				confirmed && "aria-pressed:bg-bg-selected-hovered",
				className,
			)}
			onClick={() => onToggle?.(emoji)}
			size="compact"
			type="button"
			variant="outline"
		>
			<span aria-hidden="true">{emoji}</span>
			<span>{count}</span>
		</Button>
	);
}
