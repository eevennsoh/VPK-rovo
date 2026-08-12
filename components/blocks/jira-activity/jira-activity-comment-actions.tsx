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
	/** Lets the comment restore focus to the Reply button when the composer collapses. */
	replyRef?: Ref<HTMLButtonElement>;
	/**
	 * SCM review-thread resolve. Omit when the entry did not opt in with
	 * `allowResolve`. Label flips to Unresolve when already resolved.
	 */
	onResolve?: () => void;
	resolved?: boolean;
}

/**
 * The always-visible action row under a comment's body: Reply plus the shared
 * reaction bar. Stateless — the comment owns the disclosure and the reducer
 * owns the toggle. Resolve is a subtle text control for PR review threads.
 */
export function JiraActivityCommentActions({
	reactions,
	onToggleReaction,
	onReply,
	replyExpanded,
	replyComposerId,
	replyRef,
	onResolve,
	resolved = false,
}: Readonly<JiraActivityCommentActionsProps>) {
	const resolveLabel = resolved ? "Unresolve" : "Resolve";

	return (
		<EmojiReactionBar
			aria-label="Comment actions"
			leading={
				<>
					{onReply ? (
						<Button
							aria-controls={replyComposerId}
							// The shared Button base maps aria-expanded to the selected token
							// set, so the open composer is reflected without extra styling.
							aria-expanded={replyExpanded}
							aria-label="Reply"
							className="rounded-sm"
							onClick={onReply}
							ref={replyRef}
							size="icon-compact"
							type="button"
							variant="ghost"
						>
							<ReplyLeftIcon color="currentColor" label="" />
						</Button>
					) : null}
					{onResolve ? (
						<Button
							aria-label={resolveLabel}
							aria-pressed={resolved}
							className="h-auto rounded-sm px-1.5 text-xs font-normal text-text-subtlest hover:text-text-subtle"
							onClick={onResolve}
							size="compact"
							type="button"
							variant="ghost"
						>
							{resolveLabel}
						</Button>
					) : null}
				</>
			}
			onToggleReaction={onToggleReaction}
			reactions={reactions}
		/>
	);
}
