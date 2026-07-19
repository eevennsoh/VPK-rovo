"use client";

import {
	JiraActivityComposer,
	JIRA_ACTIVITY_CURRENT_USER,
	JIRA_ACTIVITY_ENTRIES,
	type JiraActivityCommentEntry,
} from "@/components/blocks/jira-activity";
import { JiraActivitySegments } from "@/components/blocks/jira-activity/jira-activity-segments";
import { JiraAgentSessionActivityCard } from "@/components/blocks/jira-agent-session";
import Page from "@/components/blocks/jira-agent-session/page";

export default function JiraAgentSessionDemo() {
	return <Page />;
}

export function JiraAgentSessionActivityCardDemo() {
	const entry = JIRA_ACTIVITY_ENTRIES.find(
		(candidate): candidate is JiraActivityCommentEntry =>
			candidate.kind === "comment" && candidate.id === "root-cause",
	);

	if (!entry) return null;

	return (
		<div className="flex w-full justify-center p-6">
			<div className="w-full max-w-2xl">
				<JiraAgentSessionActivityCard
					agentName={entry.actor.name}
					item={entry.sessionItem}
					replyComposer={
						<JiraActivityComposer
							author={JIRA_ACTIVITY_CURRENT_USER}
							className="rounded-xl border border-border bg-bg-input px-3 shadow-[0px_-2px_25px_rgba(30,31,33,0.08)]"
							onSubmit={() => {}}
							placeholder="Ask, @mention, or / for actions"
						/>
					}
					tag={entry.tag}
					timestamp={entry.timestamp}
				>
					<JiraActivitySegments
						className="text-sm leading-5 text-text"
						segments={entry.body}
					/>
				</JiraAgentSessionActivityCard>
			</div>
		</div>
	);
}
