"use client";

import TimelineIcon from "@atlaskit/icon/core/timeline";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * End-slot badge for Pulse activity newer than the last visit.
 *
 * Hidden once the reader opens the timeline. Uses the shared Badge primitive
 * for the numeric count — ADS badges are for numbers, not a custom dot.
 */
export function TimelineActivityBadge({
	compact = false,
	onSelect,
	unreadCount,
}: Readonly<{
	compact?: boolean;
	onSelect: () => void;
	unreadCount: number;
}>) {
	if (unreadCount <= 0) {
		return null;
	}

	const label = unreadCount === 1
		? "Timeline, 1 new update since you last viewed"
		: `Timeline, ${unreadCount} new updates since you last viewed`;

	return (
		<Button
			aria-label={label}
			onClick={onSelect}
			size={compact ? "icon" : undefined}
			variant="outline"
		>
			<Icon render={<TimelineIcon label="" />} />
			{compact ? null : "Timeline"}
			<Badge variant="information">{unreadCount}</Badge>
		</Button>
	);
}
