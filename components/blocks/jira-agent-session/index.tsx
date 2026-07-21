"use client";

import { cn } from "@/lib/utils";

import { JIRA_AGENT_SESSION_ITEMS } from "./data";
import { JiraAgentSessionCard } from "./jira-agent-session-card";
import type {
	JiraAgentSessionItem,
	JiraAgentSessionProps,
} from "./jira-agent-session-types";

export function JiraAgentSession({
	className,
	items = JIRA_AGENT_SESSION_ITEMS,
	onView,
	onStop,
}: Readonly<JiraAgentSessionProps>) {
	return (
		<ul
			className={cn(
				"divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface",
				className,
			)}
		>
			{items.map((item: JiraAgentSessionItem) => (
				<JiraAgentSessionCard
					item={item}
					key={item.id}
					onStop={onStop}
					onView={onView}
				/>
			))}
		</ul>
	);
}

export { JIRA_AGENT_SESSION_ITEMS } from "./data";
export { JiraAgentSessionActivityCard } from "./jira-agent-session-activity-card";
export type {
	JiraAgentSessionActivityCardProps,
	JiraAgentSessionAgent,
	JiraAgentSessionItem,
	JiraAgentSessionPrStatus,
	JiraAgentSessionProps,
	JiraAgentSessionState,
} from "./jira-agent-session-types";
