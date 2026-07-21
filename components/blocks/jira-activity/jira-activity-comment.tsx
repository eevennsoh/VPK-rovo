"use client";

import type { ReactNode } from "react";

import {
	JiraAgentSessionActivityCard,
	type JiraAgentSessionItem,
} from "@/components/blocks/jira-agent-session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Comment } from "@/components/ui/comment";

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
 * Adapts Jira Activity comment data to the expanded Jira Agent Session card.
 * Human comments repeat their identity inside the card header; agent-session
 * cards continue to use the session identity supplied by their item.
 */
export function JiraActivityComment({
	entry,
	currentUser,
	onSubmitReply,
	onViewSession,
	onReplyRequest,
	action,
}: Readonly<{
	entry: JiraActivityCommentEntry;
	currentUser: JiraActivityActor;
	onSubmitReply: (body: string) => void;
	onViewSession?: (item: JiraAgentSessionItem) => void;
	onReplyRequest?: (entry: JiraActivityCommentEntry) => void;
	action?: ReactNode;
}>) {
	const replies = entry.replies ?? [];
	const allowReply = entry.allowReply ?? true;
	const replyAction = (
		<Button
			onClick={() => onReplyRequest?.(entry)}
			size="compact"
			type="button"
			variant="outline"
		>
			Reply
		</Button>
	);
	const trailingAction =
		entry.actor.kind === "person" ? (
			action ? (
				<div className="flex items-center gap-1">
					{replyAction}
					{action}
				</div>
			) : (
				replyAction
			)
		) : (
			action
		);

	return (
		<JiraAgentSessionActivityCard
			action={trailingAction}
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
						className={
							entry.sessionItem
								? "rounded-xl border border-border bg-bg-input px-3 shadow-[0px_-2px_25px_rgba(30,31,33,0.08)]"
								: undefined
						}
						onSubmit={onSubmitReply}
						placeholder={
							entry.sessionItem ? "Ask, @mention, or / for actions" : "Leave a reply..."
						}
						variant={entry.sessionItem ? "comment" : "reply"}
					/>
				) : undefined
			}
			tag={entry.tag}
			timestamp={entry.timestamp}
		>
			<JiraActivitySegments
				className="text-sm leading-5 text-text"
				segments={entry.body}
			/>
		</JiraAgentSessionActivityCard>
	);
}
