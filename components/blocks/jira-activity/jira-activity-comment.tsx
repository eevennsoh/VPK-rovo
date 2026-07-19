"use client";

import { useState, type ReactNode } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { Comment } from "@/components/ui/comment";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

import { JiraActivityComposer } from "./jira-activity-composer";
import { JiraActivitySegments } from "./jira-activity-segments";
import type { JiraActivityActor, JiraActivityCommentEntry } from "./jira-activity-types";

/**
 * Bordered comment card: header (name/time/tag), rich body, an optional
 * collapsible detail section, submitted replies, and a reply composer. The
 * actor avatar is intentionally not repeated here — the timeline spine already
 * shows it beside the card.
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
	const [detailOpen, setDetailOpen] = useState(false);
	const replies = entry.replies ?? [];
	const allowReply = entry.allowReply ?? true;
	const showFooter = replies.length > 0 || allowReply;

	return (
		<div className="w-full overflow-hidden rounded-lg border border-border bg-surface">
			<div className="grid gap-2 p-3">
				<div className="flex min-w-0 items-start justify-between gap-2">
					<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5">
						<span className="font-medium text-text">{entry.actor.name}</span>
						<span className="text-text-subtle">{entry.timestamp}</span>
						{entry.tag ? <Tag color={entry.tag.color ?? "gray"}>{entry.tag.text}</Tag> : null}
					</div>
					{action ? <div className="shrink-0">{action}</div> : null}
				</div>

				<JiraActivitySegments
					className="text-sm leading-5 text-text"
					segments={entry.body}
				/>

				{entry.collapsible ? (
					<div className="grid gap-1">
						<button
							aria-expanded={detailOpen}
							className="flex items-center gap-1 self-start rounded-xs text-sm font-medium text-text focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
							onClick={() => setDetailOpen((prev) => !prev)}
							type="button"
						>
							<Icon
								aria-hidden
								className={cn(
									"text-icon-subtle transition-transform duration-fast ease-out-practical motion-reduce:transition-none",
									detailOpen && "rotate-90",
								)}
								render={<ChevronRightIcon color="currentColor" label="" size="small" />}
							/>
							{entry.collapsible.label}
						</button>
						{detailOpen ? (
							<JiraActivitySegments
								className="pl-5 text-sm leading-5 text-text-subtle"
								segments={entry.collapsible.content}
							/>
						) : null}
					</div>
				) : null}
			</div>

			{showFooter ? (
				<div className="border-t border-border">
					{replies.length > 0 ? (
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
					) : null}
					{allowReply ? (
						<JiraActivityComposer
							author={currentUser}
							onSubmit={onSubmitReply}
							placeholder="Leave a reply..."
							variant="reply"
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
}
