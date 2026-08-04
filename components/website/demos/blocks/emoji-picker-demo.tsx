"use client";

import ReplyLeftIcon from "@atlaskit/icon-lab/core/reply-left";
import { useState } from "react";

import {
	EmojiPickerPopover,
	EmojiReactionBar,
	EmojiReactionPill,
	type EmojiReactionSummary,
} from "@/components/blocks/emoji-picker";
import Page from "@/components/blocks/emoji-picker/page";
import { Button } from "@/components/ui/button";

const INITIAL_REACTIONS: readonly EmojiReactionSummary[] = [
	{ count: 3, emoji: "👍️", reacted: true },
	{ count: 1, emoji: "🔥" },
];

/**
 * Reference toggle for the demos only. Real consumers keep this in their own
 * reducer so there is exactly one implementation per surface.
 */
function toggleReaction(
	reactions: readonly EmojiReactionSummary[],
	emoji: string,
): readonly EmojiReactionSummary[] {
	const existing = reactions.find((reaction) => reaction.emoji === emoji);
	if (!existing) {
		return [...reactions, { count: 1, emoji, reacted: true }];
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

export default function EmojiPickerDemo() {
	return <Page />;
}

export function EmojiPickerDemoReactionBar() {
	const [reactions, setReactions] = useState(INITIAL_REACTIONS);

	return (
		<div className="w-full p-6">
			<div className="mx-auto max-w-xl rounded-lg border border-border p-4">
				<EmojiReactionBar
					leading={
						<Button aria-label="Reply" size="compact" type="button" variant="ghost">
							<ReplyLeftIcon color="currentColor" label="" />
							Reply
						</Button>
					}
					onToggleReaction={(emoji) => setReactions((current) => toggleReaction(current, emoji))}
					reactions={reactions}
				/>
			</div>
		</div>
	);
}

export function EmojiPickerDemoPopover() {
	const [picked, setPicked] = useState<readonly string[]>([]);

	return (
		<div className="flex w-full items-center justify-center gap-3 p-6">
			<EmojiPickerPopover
				onSelect={(emoji) => setPicked((current) => [...current, emoji])}
				selected={picked}
			/>
			<span className="text-sm text-text-subtlest">
				{picked.length > 0 ? picked.join(" ") : "Nothing picked yet"}
			</span>
		</div>
	);
}

export function EmojiPickerDemoFullPicker() {
	const [picked, setPicked] = useState<readonly string[]>([]);

	return (
		<div className="flex w-full items-center justify-center gap-3 p-6">
			<EmojiPickerPopover
				defaultView="full"
				onSelect={(emoji) => setPicked((current) => [...current, emoji])}
				selected={picked}
				triggerLabel="Browse all emoji"
			/>
			<span className="text-sm text-text-subtlest">
				{picked.length > 0 ? picked.join(" ") : "Opens straight onto the searchable panel"}
			</span>
		</div>
	);
}

export function EmojiPickerDemoPills() {
	const [reactions, setReactions] = useState<readonly EmojiReactionSummary[]>([
		{ count: 1, emoji: "👍️" },
		{ count: 4, emoji: "👏", reacted: true },
		{ count: 12, emoji: "🔥", label: "Priya and 11 others reacted with fire" },
	]);

	return (
		<div className="flex w-full flex-wrap items-center justify-center gap-2 p-6">
			{reactions.map((reaction) => (
				<EmojiReactionPill
					count={reaction.count}
					emoji={reaction.emoji}
					key={reaction.emoji}
					label={reaction.label}
					onToggle={(emoji) => setReactions((current) => toggleReaction(current, emoji))}
					pressed={reaction.reacted}
				/>
			))}
		</div>
	);
}
