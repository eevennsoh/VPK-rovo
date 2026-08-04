"use client";

import ReplyLeftIcon from "@atlaskit/icon-lab/core/reply-left";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { EmojiPickerPopover } from "./components/emoji-picker-popover";
import { EmojiReactionBar } from "./components/emoji-reaction-bar";
import { EmojiReactionPill } from "./components/emoji-reaction-pill";
import type { EmojiReactionSummary } from "./data/emoji-frequent";

const INITIAL_REACTIONS: readonly EmojiReactionSummary[] = [
	{ count: 3, emoji: "👍️", reacted: true },
	{ count: 1, emoji: "🔥" },
];

/**
 * Reference toggle for the preview only. Real consumers keep this in their own
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

export default function EmojiPickerPage() {
	const [reactions, setReactions] = useState(INITIAL_REACTIONS);
	const [picked, setPicked] = useState<string[]>([]);

	return (
		<div className="w-full bg-surface px-8 py-12 text-text">
			<div className="mx-auto flex max-w-2xl flex-col gap-10">
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold text-text">Reaction bar</h2>
					<p className="text-sm text-text-subtlest">
						Leading Reply slot, live pills, and the add-reaction popover. Pills are fully
						controlled — this page owns the toggle.
					</p>
					<div className="rounded-lg border border-border p-4">
						<EmojiReactionBar
							leading={
								<Button aria-label="Reply" size="compact" type="button" variant="ghost">
									<ReplyLeftIcon color="currentColor" label="" />
									Reply
								</Button>
							}
							onToggleReaction={(emoji) =>
								setReactions((current) => toggleReaction(current, emoji))
							}
							reactions={reactions}
						/>
					</div>
				</section>

				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold text-text">Picker popover</h2>
					<p className="text-sm text-text-subtlest">
						Opens on the six-emoji quick bar. The full searchable picker — and its
						same-origin emojibase data from <code>/emoji-data/en/</code> — loads only after
						the “…” disclosure.
					</p>
					<div className="flex items-center gap-3 rounded-lg border border-border p-4">
						<EmojiPickerPopover
							onSelect={(emoji) => setPicked((current) => [...current, emoji])}
							selected={picked}
						/>
						<span className="text-sm text-text-subtlest">
							{picked.length > 0 ? picked.join(" ") : "Nothing picked yet"}
						</span>
					</div>
				</section>

				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold text-text">Pill states</h2>
					<p className="text-sm text-text-subtlest">
						Selected styling comes from <code>aria-pressed</code> on the shared Button base.
					</p>
					<div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-4">
						<EmojiReactionPill count={1} emoji="👍️" />
						<EmojiReactionPill count={4} emoji="👏" pressed />
						<EmojiReactionPill
							count={12}
							emoji="🔥"
							label="Priya and 11 others reacted with fire"
						/>
					</div>
				</section>
			</div>
		</div>
	);
}
