"use client";

import { ExperimentalAgentSessions } from "@/components/blocks/agent-sessions/experimental/experimental-agent-sessions";

import type { JiraForYouItem } from "./jira-for-you-types";
import { mapJiraForYouItemToWorkItem } from "./jira-for-you-work-item-data";

interface JiraForYouWorkItemViewProps {
	item: JiraForYouItem;
}

export function JiraForYouWorkItemView({
	item,
}: Readonly<JiraForYouWorkItemViewProps>) {
	return (
		<main
			aria-label={`Work item: ${item.issueKey}`}
			className="flex min-h-0 w-full flex-1 overflow-hidden"
			data-testid="jira-for-you-work-item-view"
		>
			<ExperimentalAgentSessions
				defaultMetadataCollapsed
				initialPreset="filled"
				inlineSurface="fill"
				key={item.id}
				presentation="inline"
				workItem={mapJiraForYouItemToWorkItem(item)}
			/>
		</main>
	);
}
