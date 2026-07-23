"use client";

import type { ReactNode } from "react";

import type { JiraAgentSessionItem } from "@/components/blocks/jira-agent-session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Comment } from "@/components/ui/comment";

import { JiraActivityCard } from "./jira-activity-card";
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

// The reply composer sits flush inside the card's footer: the card's own
// `border-t` is the only divider, so the composer drops the floating
// border/radius/shadow it carries by default and aligns its leading/trailing
// controls to the card's 16px content padding.
const FLUSH_COMPOSER_CLASSNAME = "border-0 rounded-none bg-transparent px-4 py-3 shadow-none";

/**
 * Adapts Jira Activity comment data to the expanded Jira Agent Session card.
 * Human comments repeat their identity inside the card header; agent-session
 * cards continue to use the session identity supplied by their item. Both human
 * and agent comments expose an inline prompt composer as a flush card footer.
 */
export function JiraActivityComment({
	entry,
	currentUser,
	onSubmitReply,
	onViewSession,
	action,
}: Readonly<{
	entry: JiraActivityCommentEntry;
	currentUser: JiraActivityActor;
	onSubmitReply: (body: string) => void;
	onViewSession?: (item: JiraAgentSessionItem) => void;
	action?: ReactNode;
}>) {
	const replies = entry.replies ?? [];
	const allowReply = entry.allowReply ?? true;

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
				allowReply ? (
					<JiraActivityComposer
						author={currentUser}
						className={FLUSH_COMPOSER_CLASSNAME}
						onSubmit={onSubmitReply}
						placeholder={
							entry.sessionItem ? "Ask, @mention, or / for actions" : "Leave a reply..."
						}
						variant="comment"
					/>
				) : undefined
			}
			tag={entry.tag}
			timestamp={entry.timestamp}
		>
			<JiraActivitySegments className="text-sm leading-5 text-text" segments={entry.body} />
		</JiraActivityCard>
	);
}
