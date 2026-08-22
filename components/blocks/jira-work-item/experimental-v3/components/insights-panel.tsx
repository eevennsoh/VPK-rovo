"use client";

import {
	usePublishSections,
	useSectionNavigation,
} from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import { buildWorkItemSectionTabs } from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-section-tabs";

const WORK_ITEM_SECTION_TABS = buildWorkItemSectionTabs({ guidedReview: null });

/**
 * Insights body swap. Empty on purpose — the tab is selectable and replaces
 * Description/Activity; the briefing itself is designed later.
 */
export function InsightsPanel() {
	const { sectionElementId, sectionHeadingId } = useSectionNavigation();
	usePublishSections(WORK_ITEM_SECTION_TABS);
	const headingId = sectionHeadingId("insights");

	return (
		<section
			aria-labelledby={headingId}
			className="min-w-0"
			data-work-item-insights-panel
			id={sectionElementId("insights")}
		>
			<h2 className="sr-only" id={headingId}>
				Insights
			</h2>
		</section>
	);
}
