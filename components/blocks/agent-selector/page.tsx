"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EditIcon from "@atlaskit/icon/core/edit";
import { useState, type ReactElement } from "react";

import { AgentSelector, type AgentSelectorAction } from "@/components/blocks/agent-selector";
import { AGENT_SELECTOR_CUSTOM_AGENT_DEMO_AGENTS, AGENT_SELECTOR_DEMO_AGENTS } from "@/components/blocks/agent-selector/data/demo-agents";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { RovoColorIcon } from "@/components/ui/logo";

interface AgentSelectorPageProps {
	presentation?: "dropdown" | "standalone";
	variant?: "default" | "selected-agent-actions" | "jira";
}

const AGENT_SELECTOR_STANDALONE_SURFACE_CLASS =
	"w-[360px] overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl";

export default function AgentSelectorPage({
	presentation = "dropdown",
	variant = "default",
}: Readonly<AgentSelectorPageProps> = {}): ReactElement {
	const [open, setOpen] = useState(true);
	const [selectedAgentIds, setSelectedAgentIds] = useState<readonly string[]>(
		variant === "selected-agent-actions" ? ["ai-insights-agent"] : ["github-copilot"]
	);
	const [pinnedAgentIds, setPinnedAgentIds] = useState<readonly string[]>([]);
	// Jira kanban use case: agents actively running on the work item render in a
	// top "In progress" section with a stop-on-hover control (instead of a tick);
	// stopping removes the agent from the section.
	const [inProgressAgentIds, setInProgressAgentIds] = useState<readonly string[]>(
		variant === "jira" ? ["github-copilot", "readiness-checker"] : []
	);
	const agents = variant === "selected-agent-actions" ? AGENT_SELECTOR_CUSTOM_AGENT_DEMO_AGENTS : AGENT_SELECTOR_DEMO_AGENTS;
	const selectedAgentActions: readonly AgentSelectorAction[] = variant === "selected-agent-actions"
		? [
			{
				id: "chat-with-rovo",
				icon: <RovoColorIcon aria-hidden className="mx-auto block" size="xxsmall" />,
				label: "Chat with Rovo",
				onSelect: () => setOpen(false),
			},
			{
				id: "edit-agent",
				icon: <Icon className="size-4" render={<EditIcon label="" />} />,
				label: "Edit agent",
				onSelect: () => setOpen(false),
			},
		]
		: [];

	function selectAgent(agentId: string) {
		setSelectedAgentIds([agentId]);
	}

	const selector = (
		<AgentSelector
			agents={agents}
			heading={variant === "selected-agent-actions" ? "Switch to another agent" : undefined}
			onAgentToggle={selectAgent}
			onBrowseAgents={() => undefined}
			onCreateAgent={() => undefined}
			selectionMode="single"
			onPinnedAgentIdsChange={setPinnedAgentIds}
			pinnedAgentIds={pinnedAgentIds}
			showSelectedTickInSingleSelect={variant === "default" || variant === "selected-agent-actions"}
			inProgressAgentIds={inProgressAgentIds}
			onStopAgent={(agentId) =>
				setInProgressAgentIds((ids) => ids.filter((id) => id !== agentId))
			}
			selectedAgentActions={selectedAgentActions}
			selectedAgentIds={selectedAgentIds}
		/>
	);

	if (presentation === "standalone") {
		return (
			<div className={AGENT_SELECTOR_STANDALONE_SURFACE_CLASS} data-agent-selector-demo="standalone">
				{selector}
			</div>
		);
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger
				render={
					<Button aria-label="Select agent" variant="outline" />
				}
			>
				Select agent
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="max-h-none w-[360px] overflow-hidden p-0" portalled={false} sideOffset={8}>
				{selector}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { AgentSelector } from "@/components/blocks/agent-selector";
export type { AgentSelectorAction, AgentSelectorAgent, AgentSelectorProps } from "@/components/blocks/agent-selector";
