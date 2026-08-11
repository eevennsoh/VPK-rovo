"use client";

import { useLayoutEffect, useMemo, useState } from "react";

import {
	JiraActivity,
	type JiraActivityEntry,
	type JiraActivityFilter,
	type JiraActivitySortOrder,
} from "@/components/blocks/jira-activity";
import { jiraActivityReducer } from "@/components/blocks/jira-activity/lib/jira-activity-reducer";
import { useSetActivityRailChrome } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import {
	adaptPullRequestActivity,
	getPullRequestActivityRevision,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-activity-adapter";
import type { PullRequestActivity } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-detail-data";
import { GUIDED_REVIEW_CURRENT_REVIEWER_ID } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-review-submit";

/** Signed-in guided-review reviewer (Priya) for Activity Reply authorship. */
const PULL_REQUEST_ACTIVITY_CURRENT_USER = {
	id: GUIDED_REVIEW_CURRENT_REVIEWER_ID,
	name: "Priya Narayanan",
	kind: "person" as const,
	avatarSrc: "/avatar-user/priya-hansra/color/asow-strategy-orange.png",
};

/**
 * SCM Activity timeline for the pull-request rail. Reuses Jira Activity's
 * chronological feed with PR-scoped filters (Latest / Oldest / Comments) and
 * review-thread Reply + Resolve.
 */
export function PullRequestActivityPanel({
	activity,
}: Readonly<{
	activity: readonly PullRequestActivity[];
}>) {
	const setActivityRailChrome = useSetActivityRailChrome();
	const [sortOrder, setSortOrder] = useState<JiraActivitySortOrder>("ascending");
	const [filter, setFilter] = useState<JiraActivityFilter>("all");
	const adaptedEntries = useMemo(() => adaptPullRequestActivity(activity), [activity]);
	const activityKey = useMemo(
		() => getPullRequestActivityRevision(activity),
		[activity],
	);
	const [entries, setEntries] = useState<readonly JiraActivityEntry[]>(adaptedEntries);

	useLayoutEffect(() => {
		setEntries(adaptedEntries);
	}, [activityKey, adaptedEntries]);

	useLayoutEffect(() => {
		if (!setActivityRailChrome) return undefined;
		setActivityRailChrome({
			count: entries.length,
			filter,
			filterMode: "pull-request",
			onFilterChange: setFilter,
			onSortOrderChange: setSortOrder,
			sortOrder,
		});
		return () => setActivityRailChrome(null);
	}, [entries.length, filter, setActivityRailChrome, sortOrder]);

	return (
		<div className="px-3" data-jira-work-item-pull-request-activity>
			<JiraActivity
				className="gap-2"
				composer={null}
				currentUser={PULL_REQUEST_ACTIVITY_CURRENT_USER}
				entries={entries}
				filter={filter}
				hideHeader
				key={activityKey}
				onEntriesChange={setEntries}
				onResolveComment={(entry) => {
					setEntries((current) => (
						jiraActivityReducer(
							{ entries: current },
							{ type: "toggle-resolved", entryId: entry.id },
						).entries
					));
				}}
				onSubmitReply={(entry, body) => {
					setEntries((current) => (
						jiraActivityReducer(
							{ entries: current },
							{
								type: "add-reply",
								entryId: entry.id,
								reply: {
									id: crypto.randomUUID(),
									actor: PULL_REQUEST_ACTIVITY_CURRENT_USER,
									timestamp: "Just now",
									body,
								},
							},
						).entries
					));
				}}
				sortOrder={sortOrder}
			/>
		</div>
	);
}
