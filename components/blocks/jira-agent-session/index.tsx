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
	variant = "default",
	onView,
	selectedItemId,
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
					isSelected={item.id === selectedItemId}
					item={item}
					key={item.id}
					onView={onView}
					variant={variant}
				/>
			))}
		</ul>
	);
}

export { JIRA_AGENT_SESSION_ITEMS } from "./data";
export { JiraAgentSessionActivityHeader } from "./jira-agent-session-card";
export type {
	JiraAgentSessionAgent,
	JiraAgentSessionItem,
	JiraAgentSessionPrStatus,
	JiraAgentSessionProps,
	JiraAgentSessionState,
	JiraAgentSessionVariant,
} from "./jira-agent-session-types";
