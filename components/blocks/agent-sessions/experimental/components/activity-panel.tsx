"use client";

import Heading from "@/components/ui/heading";

import { ActivityComposer } from "./activity-composer";
import { ActivityEventList } from "./activity-event-list";

/**
 * Activity panel for the experimental Agent Sessions block: an "Activity" heading,
 * the unified comment/command composer (with local `@agent` / `/skill` suggestions),
 * and the chronological human + agent event feed below it — mirroring the Jira
 * work-item convention of the composer above the thread. All data comes from the
 * foundation hooks; the panel takes no props.
 */
export function ActivityPanel() {
	return (
		<section aria-labelledby="agent-sessions-activity-heading" className="flex flex-col gap-3">
			<Heading id="agent-sessions-activity-heading" size="small" as="h3">
				Activity
			</Heading>
			<ActivityComposer />
			<ActivityEventList />
		</section>
	);
}
