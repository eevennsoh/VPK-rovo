"use client";

import LightbulbIcon from "@atlaskit/icon/core/lightbulb";

import { Icon } from "@/components/ui/icon";
import { ContextBarPill } from "@/components/ui-custom/context-bar";

interface ActivityComposerNewInsightsPillProps {
	count: number;
	onSelect: () => void;
}

function newInsightsLabel(count: number): string {
	return `${count} new ${count === 1 ? "insight" : "insights"}`;
}

/**
 * Outlined notification on the composer pill row. Same `ContextBarPill` as
 * Assign agents / Use skills, with a surface+border treatment so it reads as
 * a notice rather than another action.
 */
export function ActivityComposerNewInsightsPill({
	count,
	onSelect,
}: Readonly<ActivityComposerNewInsightsPillProps>) {
	if (count < 1) return null;
	const label = newInsightsLabel(count);

	return (
		<ContextBarPill
			aria-label={label}
			className="border border-border bg-surface hover:bg-surface-hovered active:bg-surface-pressed"
			data-jira-work-item-new-insights-pill
			icon={<Icon aria-hidden render={<LightbulbIcon label="" size="small" />} />}
			onClick={onSelect}
		>
			{label}
		</ContextBarPill>
	);
}
