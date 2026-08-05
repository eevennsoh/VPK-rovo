"use client";

import {
	JiraActivity,
	JiraActivityCard,
	JiraActivityComposer,
	JIRA_ACTIVITY_CURRENT_USER,
	JIRA_ACTIVITY_ENTRIES,
	type JiraActivityCommentEntry,
} from "@/components/blocks/jira-activity";
import Page from "@/components/blocks/jira-activity/page";
import { JiraActivitySegments } from "@/components/blocks/jira-activity/jira-activity-segments";

export default function JiraActivityDemo() {
	return <Page />;
}

export function JiraActivityReactionsDemo() {
	return (
		<div className="w-full p-6">
			<div className="mx-auto w-full max-w-2xl">
				<JiraActivity commentActions="reply-and-reactions" />
			</div>
		</div>
	);
}

export function JiraActivityCardDemo() {
	const entry = JIRA_ACTIVITY_ENTRIES.find(
		(candidate): candidate is JiraActivityCommentEntry =>
			candidate.kind === "comment" && candidate.id === "root-cause",
	);

	if (!entry) return null;

	return (
		<div className="flex w-full justify-center p-6">
			<div className="w-full max-w-2xl">
				<JiraActivityCard
					agentName={entry.actor.name}
					item={entry.sessionItem}
					replyComposer={
						<JiraActivityComposer
							author={JIRA_ACTIVITY_CURRENT_USER}
							onSubmit={() => {}}
							placeholder="Ask, @mention, or / for actions"
							variant="flush"
						/>
					}
					tag={entry.tag}
					timestamp={entry.timestamp}
				>
					<JiraActivitySegments
						className="text-sm leading-5 text-text"
						segments={entry.body}
					/>
				</JiraActivityCard>
			</div>
		</div>
	);
}
