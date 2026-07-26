import type { WorkItemData } from "@/app/contexts/context-work-item-modal";

import type { JiraForYouItem } from "./jira-for-you-types";

export function mapJiraForYouItemToWorkItem(
	item: JiraForYouItem,
): WorkItemData {
	return {
		code: item.issueKey,
		description: `${item.title} in ${item.spaceName}.`,
		status: item.jiraStatus,
		title: item.title,
	};
}
