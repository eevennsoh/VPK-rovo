"use client";

import Heading from "@/components/ui/heading";

import { ActivityEventList } from "./activity-event-list";

/**
 * Activity panel for the experimental Agent Sessions block: an "Activity" heading
 * above the chronological human + agent event feed. The comment/command composer is
 * no longer rendered here — it now lives in the pinned footer at the bottom of the
 * Activity column (owned by ExperimentalWorkItemLayout's `composer` slot), so it stays
 * visible while this feed scrolls. All data comes from the foundation hooks; the panel
 * takes no props.
 */
export function ActivityPanel() {
	return (
		<section aria-labelledby="agent-sessions-activity-heading" className="flex flex-col gap-3">
			<Heading id="agent-sessions-activity-heading" size="small" as="h3">
				Activity
			</Heading>
			<ActivityEventList />
		</section>
	);
}
