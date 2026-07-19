"use client";

import type { ReactNode } from "react";

import { JiraAgentSessionActivityCard } from "@/components/blocks/jira-agent-session";
import { Comment } from "@/components/ui/comment";

import { JiraActivityComposer } from "./jira-activity-composer";
import { JiraActivitySegments } from "./jira-activity-segments";
import type { JiraActivityActor, JiraActivityCommentEntry } from "./jira-activity-types";

/**
 * Adapts Jira Activity comment data to the expanded Jira Agent Session card.
 * The actor avatar stays on the timeline spine, so it is intentionally not
 * repeated inside the card.
 */
export function JiraActivityComment({
	entry,
	currentUser,
	onSubmitReply,
	action,
}: Readonly<{
	entry: JiraActivityCommentEntry;
	currentUser: JiraActivityActor;
	onSubmitReply: (body: string) => void;
	action?: ReactNode;
}>) {
	const replies = entry.replies ?? [];
	const allowReply = entry.allowReply ?? true;

	return (
		<JiraAgentSessionActivityCard
			action={action}
			agentName={entry.actor.name}
			item={entry.sessionItem}
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
