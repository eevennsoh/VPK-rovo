"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { AgentListItem } from "@/components/blocks/agent-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Comment } from "@/components/ui/comment";

import { JiraActivityCard } from "./jira-activity-card";
import { JiraActivityCommentActions } from "./jira-activity-comment-actions";
import { JiraActivityComposer } from "./jira-activity-composer";
import { JiraActivitySegments } from "./jira-activity-segments";
import type { JiraActivityActor, JiraActivityCommentEntry } from "./jira-activity-types";

function initialsOf(name: string): string {
	return (
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join("") || "?"
	);
}

/**
 * Adapts Jira Activity comment data to the expanded Agent List card.
 * Human comments repeat their identity inside the card header; agent-session
 * cards continue to use the session identity supplied by their item. Both carry
 * an always-visible action row, with the prompt composer disclosed by Reply.
 */
export function JiraActivityComment({
	entry,
	currentUser,
	onSubmitReply,
	onToggleReaction,
	onViewSession,
	action,
	commentActions = "reply-and-reactions",
}: Readonly<{
	entry: JiraActivityCommentEntry;
	currentUser: JiraActivityActor;
	onSubmitReply: (body: string) => void;
	onToggleReaction: (emoji: string) => void;
	onViewSession?: (item: AgentListItem) => void;
	action?: ReactNode;
	commentActions?: "none" | "reactions" | "reply-and-reactions";
}>) {
	const replies = entry.replies ?? [];
	const allowReply = entry.allowReply ?? true;
	const collapsible = commentActions === "reply-and-reactions";
	const [replyOpen, setReplyOpen] = useState(false);
	const composerId = useId();
	const composerVisible = allowReply && (!collapsible || replyOpen);
	const replyButtonRef = useRef<HTMLButtonElement>(null);
	// Only move focus once the viewer has actually toggled Reply, so the initial
	// mount never steals focus from the page.
	const replyToggledRef = useRef(false);

	// Reactions are stored as actor ids; the picker block wants counts, so the
	// view model is derived here at the boundary.
	const reactionSummaries = (entry.reactions ?? []).map((reaction) => ({
		emoji: reaction.emoji,
		count: reaction.actorIds.length,
		reacted: reaction.actorIds.includes(currentUser.id),
	}));

	function toggleReply() {
		replyToggledRef.current = true;
		setReplyOpen((previousOpen) => !previousOpen);
	}

	// Only the collapse direction is handled here. Opening is covered by the
	// composer's own `autoFocus`: the comment variant is a contentEditable tiptap
	// editor that mounts asynchronously, so focusing it from this effect would
	// race the editor's initialisation and silently no-op.
	useEffect(() => {
		if (!replyToggledRef.current || replyOpen) return;
		replyButtonRef.current?.focus();
	}, [replyOpen]);

	return (
		<JiraActivityCard
			action={action}
			agentName={entry.actor.name}
			headerAvatar={
				entry.actor.kind === "person" ? (
					<Avatar aria-hidden size="default">
						{entry.actor.avatarSrc ? <AvatarImage alt="" src={entry.actor.avatarSrc} /> : null}
						<AvatarFallback>{initialsOf(entry.actor.name)}</AvatarFallback>
					</Avatar>
				) : undefined
			}
			headerLayout={entry.actor.kind === "person" ? "stacked" : "inline"}
			item={entry.sessionItem}
			onView={onViewSession}
			details={
				entry.sessionItem
					? undefined
					: entry.collapsible
					? {
							label: entry.collapsible.label,
							children: (
								<JiraActivitySegments
									className="pl-5 text-sm leading-5 text-text-subtle"
									segments={entry.collapsible.content}
								/>
							),
						}
					: undefined
			}
			footerActions={
				commentActions === "none" ? undefined : (
					<JiraActivityCommentActions
						onReply={collapsible && allowReply ? toggleReply : undefined}
						onToggleReaction={onToggleReaction}
						reactions={reactionSummaries}
						replyComposerId={composerVisible ? composerId : undefined}
						replyExpanded={replyOpen}
						replyRef={replyButtonRef}
					/>
				)
			}
			replies={
				replies.length > 0 ? (
					<div className="grid gap-3 p-3">
						{replies.map((reply) => (
							<Comment
								author={reply.actor.name}
								avatarSrc={reply.actor.avatarSrc}
								key={reply.id}
								time={reply.timestamp}
							>
								{reply.body}
							</Comment>
						))}
					</div>
				) : undefined
			}
			replyComposer={
				composerVisible ? (
					<div id={composerId}>
						<JiraActivityComposer
							author={currentUser}
							// In collapsible mode the composer only mounts on a Reply
							// click, so mounting is exactly the moment to take focus.
							autoFocus={collapsible}
							onSubmit={onSubmitReply}
							placeholder={
								entry.sessionItem ? "Ask, @mention, or / for actions" : "Leave a reply..."
							}
							variant="flush"
						/>
					</div>
				) : undefined
			}
			tag={entry.tag}
			timestamp={entry.timestamp}
		>
			<JiraActivitySegments className="text-sm leading-5 text-text" segments={entry.body} />
		</JiraActivityCard>
	);
}
