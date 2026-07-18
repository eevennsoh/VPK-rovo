import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";

import type { JiraActivityActor } from "./jira-activity-types";

/**
 * Feed header: the "Activity" title with an Unsubscribe control and an avatar
 * group of the people involved in the thread.
 */
export function JiraActivityHeader({
	participants,
	onUnsubscribe,
}: Readonly<{
	participants: readonly JiraActivityActor[];
	onUnsubscribe?: () => void;
}>) {
	return (
		<div className="flex items-center justify-between gap-3">
			<h2 className="text-text" style={{ font: token("font.heading.small") }}>
				Activity
			</h2>
			<div className="flex items-center gap-3">
				<Button onClick={onUnsubscribe} size="compact" type="button" variant="ghost">
					Unsubscribe
				</Button>
				{participants.length > 0 ? (
					<AvatarGroup label="Participants">
						{participants.slice(0, 3).map((participant) => (
							<Avatar key={participant.id} label={participant.name} size="sm">
								{participant.avatarSrc ? (
									<AvatarImage alt="" src={participant.avatarSrc} />
								) : null}
								<AvatarFallback>
									{participant.name.slice(0, 1).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						))}
					</AvatarGroup>
				) : null}
			</div>
		</div>
	);
}
