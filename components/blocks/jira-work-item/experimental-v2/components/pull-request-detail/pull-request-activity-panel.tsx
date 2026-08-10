"use client";

import { useLayoutEffect, useMemo, useState } from "react";

import {
	JiraActivity,
	type JiraActivityFilter,
	type JiraActivitySortOrder,
} from "@/components/blocks/jira-activity";
import { useSetActivityRailChrome } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import {
	adaptPullRequestActivity,
	getPullRequestActivityRevision,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-activity-adapter";
import type { PullRequestActivity } from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-detail-data";

const ALL_ACTIVITY_FILTER: JiraActivityFilter = "all";
const keepAllActivity = () => undefined;

/** Read-only SCM activity using JiraActivity's existing chronological timeline. */
export function PullRequestActivityPanel({
	activity,
}: Readonly<{
	activity: readonly PullRequestActivity[];
}>) {
	const setActivityRailChrome = useSetActivityRailChrome();
	const [sortOrder, setSortOrder] = useState<JiraActivitySortOrder>("ascending");
	const entries = useMemo(() => adaptPullRequestActivity(activity), [activity]);
	const activityKey = useMemo(
		() => getPullRequestActivityRevision(activity),
		[activity],
	);

	useLayoutEffect(() => {
		if (!setActivityRailChrome) return undefined;
		setActivityRailChrome({
			count: entries.length,
			filter: ALL_ACTIVITY_FILTER,
			filterMode: "sort-only",
			onFilterChange: keepAllActivity,
			onSortOrderChange: setSortOrder,
			sortOrder,
		});
		return () => setActivityRailChrome(null);
	}, [entries.length, setActivityRailChrome, sortOrder]);

	return (
		<div className="px-3" data-jira-work-item-pull-request-activity>
			<JiraActivity
				className="gap-2"
				composer={null}
				defaultEntries={entries}
				filter={ALL_ACTIVITY_FILTER}
				hideHeader
				key={activityKey}
				sortOrder={sortOrder}
			/>
		</div>
	);
}
