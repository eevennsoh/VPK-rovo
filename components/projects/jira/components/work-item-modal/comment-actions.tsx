"use client";

import EditIcon from "@atlaskit/icon/core/edit";
import ReplyLeftIcon from "@atlaskit/icon-lab/core/reply-left";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

// Imported from the component modules rather than the block barrel: the barrel
// statically re-exports the catalog preview page and the frimousse-backed panel,
// and going direct keeps both out of the work-item modal's module graph.
import { EmojiReactionBar } from "@/components/blocks/emoji-picker/components/emoji-reaction-bar";
import type { EmojiReactionSummary } from "@/components/blocks/emoji-picker/data/emoji-frequent";
import { Button } from "@/components/ui/button";

const NO_REACTIONS: readonly EmojiReactionSummary[] = [];

function noop() {}

export interface CommentActionsProps {
	reactions?: readonly EmojiReactionSummary[];
	onToggleReaction?: (emoji: string) => void;
	onReply?: () => void;
}

/**
 * The comment action row. Composes the shared `EmojiReactionBar` so the modal and
 * `jira-activity` render one implementation of reply + reactions; the standalone
 * thumbs-up button is gone because the quick bar already offers it.
 *
 * Every prop is optional so the existing zero-prop call site keeps its current
 * (inert) behavior.
 */
export function CommentActions({
	reactions = NO_REACTIONS,
	onToggleReaction = noop,
	onReply,
}: Readonly<CommentActionsProps>) {
	return (
		<EmojiReactionBar
			aria-label="Comment actions"
			className="mt-2"
			leading={
				<Button aria-label="Reply" onClick={onReply} shape="circle" size="icon-compact" type="button" variant="ghost">
					<ReplyLeftIcon color="currentColor" label="" />
				</Button>
			}
			onToggleReaction={onToggleReaction}
			reactions={reactions}
			trailing={
				<>
					<Button aria-label="Edit" shape="circle" size="icon-compact" type="button" variant="ghost">
						<EditIcon color="currentColor" label="" />
					</Button>
					<Button aria-label="More actions" shape="circle" size="icon-compact" type="button" variant="ghost">
						<ShowMoreHorizontalIcon color="currentColor" label="" />
					</Button>
				</>
			}
		/>
	);
}
