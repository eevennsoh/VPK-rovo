"use client";

import type { ReactNode } from "react";

import { usePublishSections } from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import { buildWorkItemSectionTabs } from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-section-tabs";

const WORK_ITEM_SECTION_TABS = buildWorkItemSectionTabs({ guidedReview: null });

/** Insights column: a sourced briefing when the host supplies insight data. */
export function InsightsPanel({
	activity,
	hasInsights,
}: Readonly<{
	activity: ReactNode;
	hasInsights: boolean;
}>) {
	usePublishSections(WORK_ITEM_SECTION_TABS);

	return hasInsights ? activity : null;
}
