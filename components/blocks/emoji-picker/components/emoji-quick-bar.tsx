"use client";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { emojiLabel, FREQUENT_EMOJI } from "../data/emoji-frequent";

export interface EmojiQuickBarProps {
	onSelect: (emoji: string) => void;
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
					className="rounded-sm text-base"
					key={emoji}
					onClick={() => onSelect(emoji)}
					size="icon"
					type="button"
					variant="ghost"
				>
					<span
						aria-hidden="true"
						className="inline-block transition-transform duration-normal ease-out-practical group-hover/button:scale-125 group-hover/button:will-change-transform group-focus-visible/button:scale-125 group-focus-visible/button:will-change-transform motion-reduce:transform-none motion-reduce:transition-none"
					>
						{emoji}
					</span>
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
					className={cn(
						"mx-1 h-5 data-vertical:self-center",
						showMoreExpanded ? "ml-auto" : null,
					)}
					orientation="vertical"
				/>
					<Button
						aria-expanded={showMoreExpanded}
						aria-label="More emoji"
						className="rounded-sm aria-expanded:border-transparent aria-expanded:bg-transparent aria-expanded:text-text-subtle aria-expanded:hover:bg-bg-neutral-subtle-hovered aria-expanded:active:bg-bg-neutral-subtle-pressed aria-expanded:[&_svg]:text-icon-subtle"
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
