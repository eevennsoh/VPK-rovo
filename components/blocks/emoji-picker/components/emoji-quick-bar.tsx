"use client";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { emojiLabel, FREQUENT_EMOJI } from "../data/emoji-frequent";

export interface EmojiQuickBarProps {
	onSelect: (emoji: string) => void;
	selected?: readonly string[];
	frequent?: readonly string[];
	/** Invoked by the "…" disclosure that swaps in the full searchable picker. */
	onShowMore?: () => void;
	/** Whether the full picker is currently showing, for the disclosure's ARIA state. */
	showMoreExpanded?: boolean;
	className?: string;
}

/**
 * The zero-data fast path: six common reactions plus a disclosure to the full
 * picker. Rendering this needs no emojibase fetch and no picker library bundle.
 */
export function EmojiQuickBar({
	onSelect,
	selected,
	frequent = FREQUENT_EMOJI,
	onShowMore,
	showMoreExpanded = false,
	className,
}: Readonly<EmojiQuickBarProps>) {
	return (
		<div
			aria-label="Frequently used reactions"
			className={cn("flex items-center gap-0.5", className)}
			role="group"
		>
			{frequent.map((emoji) => (
				<Button
					aria-label={emojiLabel(emoji)}
					aria-pressed={selected?.includes(emoji) ?? false}
					className="rounded-sm text-base"
					key={emoji}
					onClick={() => onSelect(emoji)}
					size="icon"
					type="button"
					variant="ghost"
				>
					<span aria-hidden="true">{emoji}</span>
				</Button>
			))}
			{onShowMore ? (
				<>
					<Separator
					// Separator ships `data-vertical:self-stretch`, and `align-self: stretch`
					// only stretches when the cross size is `auto` — with an explicit `h-5`
					// it degrades to flex-start and pins the rule to the top of the row.
					// The variant must be matched (`data-vertical:`) so tailwind-merge drops
					// the base class instead of leaving two rules to fight on specificity.
					className="mx-1 h-5 data-vertical:self-center"
					orientation="vertical"
				/>
					<Button
						aria-expanded={showMoreExpanded}
						aria-label="More emoji"
						className="rounded-sm"
						onClick={onShowMore}
						size="icon"
						type="button"
						variant="ghost"
					>
						<ShowMoreHorizontalIcon color="currentColor" label="" />
					</Button>
				</>
			) : null}
		</div>
	);
}
