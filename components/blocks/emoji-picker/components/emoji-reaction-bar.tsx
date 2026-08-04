"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { EmojiReactionSummary } from "../data/emoji-frequent";
import { EmojiPickerPopover } from "./emoji-picker-popover";
import { EmojiReactionPill } from "./emoji-reaction-pill";

export interface EmojiReactionBarProps {
	reactions: readonly EmojiReactionSummary[];
	onToggleReaction: (emoji: string) => void;
	showAddReaction?: boolean;
	leading?: ReactNode;
	trailing?: ReactNode;
	frequent?: readonly string[];
	"aria-label"?: string;
	className?: string;
}

/**
 * The composed action row: leading slot (e.g. Reply), the reaction pills, the
 * add-reaction popover, then a trailing slot (e.g. Edit / More).
 *
 * Stateless by design — adding and removing a reaction are the same event, so
 * the consumer's reducer owns the toggle.
 */
export function EmojiReactionBar({
	reactions,
	onToggleReaction,
	showAddReaction = true,
	leading,
	trailing,
	frequent,
	"aria-label": ariaLabel = "Reactions",
	className,
}: Readonly<EmojiReactionBarProps>) {
	const selected = reactions
		.filter((reaction) => reaction.reacted)
		.map((reaction) => reaction.emoji);

	return (
		<div
			aria-label={ariaLabel}
			className={cn("flex flex-wrap items-center gap-1", className)}
			role="group"
		>
			{leading}
			{reactions.map((reaction) => (
				<EmojiReactionPill
					count={reaction.count}
					emoji={reaction.emoji}
					key={reaction.emoji}
					label={reaction.label}
					onToggle={onToggleReaction}
					pressed={reaction.reacted}
				/>
			))}
			{showAddReaction ? (
				<EmojiPickerPopover
					frequent={frequent}
					onSelect={onToggleReaction}
					selected={selected}
				/>
			) : null}
			{/*
			 * Trailing controls sit inline after the add-reaction button rather than
			 * being pushed to the far edge — the row reads as one continuous group.
			 * A consumer that wants them right-aligned can pass `ml-auto` itself.
			 */}
			{trailing ? <div className="flex items-center gap-1">{trailing}</div> : null}
		</div>
	);
}
