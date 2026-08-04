"use client";

import type { Ref } from "react";

import ReplyLeftIcon from "@atlaskit/icon-lab/core/reply-left";

// Imported from the component modules rather than the block barrel: the barrel
// statically re-exports the frimousse-backed panel, and going direct keeps that
// library out of this block's module graph.
import { EmojiReactionBar } from "@/components/blocks/emoji-picker/components/emoji-reaction-bar";
import type { EmojiReactionSummary } from "@/components/blocks/emoji-picker/data/emoji-frequent";
import { Button } from "@/components/ui/button";

export interface JiraActivityCommentActionsProps {
	reactions: readonly EmojiReactionSummary[];
	onToggleReaction: (emoji: string) => void;
	/** Omit to hide Reply — the entry opted out with `allowReply: false`. */
	onReply?: () => void;
	replyExpanded?: boolean;
	replyComposerId?: string;
	/** Lets the comment restore focus to Reply when the composer collapses. */
	replyRef?: Ref<HTMLButtonElement>;
}

/**
 * The always-visible action row under a comment's body: Reply plus the shared
 * reaction bar. Stateless — the comment owns the disclosure and the reducer
 * owns the toggle.
 */
export function JiraActivityCommentActions({
	reactions,
	onToggleReaction,
	onReply,
	replyExpanded,
	replyComposerId,
	replyRef,
}: Readonly<JiraActivityCommentActionsProps>) {
	return (
		<EmojiReactionBar
			aria-label="Comment actions"
			leading={
				onReply ? (
					<Button
						aria-controls={replyComposerId}
						// The shared Button base maps aria-expanded to the selected token
						// set, so the open composer is reflected without extra styling.
						aria-expanded={replyExpanded}
						aria-label="Reply"
						onClick={onReply}
						ref={replyRef}
						shape="circle"
						size="icon-compact"
						type="button"
						variant="ghost"
					>
						<ReplyLeftIcon color="currentColor" label="" />
					</Button>
				) : null
			}
			onToggleReaction={onToggleReaction}
			reactions={reactions}
		/>
	);
}
