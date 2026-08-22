"use client";

import { JiraInsightsContent, type JiraInsightSource } from "@/components/blocks/jira-insights";
import {
	usePublishSections,
	useSectionNavigation,
} from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import { buildWorkItemSectionTabs } from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-section-tabs";

const WORK_ITEM_SECTION_TABS = buildWorkItemSectionTabs({ guidedReview: null });

/** Insights body swap: a sourced briefing when the host supplies insight data. */
export function InsightsPanel({
	hasInsights,
	onSourceSelect,
}: Readonly<{
	hasInsights: boolean;
	onSourceSelect?: (source: JiraInsightSource) => void;
}>) {
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
			{hasInsights ? <JiraInsightsContent onSourceSelect={onSourceSelect} /> : null}
		</section>
	);
}
