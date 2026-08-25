"use client";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import { AgentSelector, type AgentSelectorAgent } from "@/components/blocks/agent-selector";
import { WORK_ITEM_PINNED_ITEMS_LABEL } from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-picker-options";

/** Dropdown chrome shared by Assign agents and the Details Agents row. */
export const WORK_ITEM_AGENT_SELECTOR_MENU = {
	align: "start",
	className: "max-h-none w-[360px] overflow-hidden p-0",
	positionerClassName: "z-[502]",
	sideOffset: 8,
} as const;

interface WorkItemAgentSelectorProps {
	agents?: readonly AgentSelectorAgent[];
	onAgentToggle: (agentId: string) => void;
	onBrowseAgents: () => void;
	onCreateAgent: () => void;
	onPinnedAgentIdsChange: (agentIds: readonly string[]) => void;
	onQueryChange: (query: string) => void;
	pinnedAgentIds: readonly string[];
	query: string;
}

/** Palette AgentSelector used by the Activity composer pill and Details Agents. */
export function WorkItemAgentSelector({
	agents = ROVO_AGENT_SELECTOR_AGENTS,
	onAgentToggle,
	onBrowseAgents,
	onCreateAgent,
	onPinnedAgentIdsChange,
	onQueryChange,
	pinnedAgentIds,
	query,
}: Readonly<WorkItemAgentSelectorProps>) {
	return (
		<AgentSelector
			agents={agents}
			onAgentToggle={onAgentToggle}
			onBrowseAgents={onBrowseAgents}
			onCreateAgent={onCreateAgent}
			onPinnedAgentIdsChange={onPinnedAgentIdsChange}
			onQueryChange={onQueryChange}
			pinnedAgentIds={pinnedAgentIds}
			pinnedItemsLabel={WORK_ITEM_PINNED_ITEMS_LABEL}
			query={query}
			searchVariant="palette"
			selectionMode="single"
		/>
	);
}
