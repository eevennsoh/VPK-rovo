"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatSessionTimestamp, type HumanActivityEvent } from "@/components/blocks/agent-sessions/data/session-state";

interface ActivityHumanEventProps {
	event: HumanActivityEvent;
}

function initialsOf(name: string): string {
	const initials = name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "?";
}

/** One human comment row in the Activity feed: circle avatar, author, time, content. */
export function ActivityHumanEvent({ event }: Readonly<ActivityHumanEventProps>) {
	return (
		<article className="flex gap-2">
			<Avatar size="sm" className="shrink-0">
				{event.author.avatarUrl ? <AvatarImage src={event.author.avatarUrl} alt="" /> : null}
				<AvatarFallback>{initialsOf(event.author.name)}</AvatarFallback>
			</Avatar>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex items-baseline gap-2">
					<span className="min-w-0 truncate text-sm font-semibold text-text">{event.author.name}</span>
					<span className="shrink-0 text-xs text-text-subtlest">{formatSessionTimestamp(event.createdAtMs)}</span>
				</div>
				<p className="text-sm whitespace-pre-line break-words text-text-subtle">{event.content}</p>
			</div>
		</article>
	);
}
