"use client";

import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { useMemo, useState } from "react";

import { AGENT_SESSIONS_ROSTER } from "@/components/blocks/agent-sessions/data/session-agents";
import {
	useAgentSessionsActions,
	useAgentSessionsMeta,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { AgentSelector } from "@/components/blocks/agent-selector";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgentLaunchSelectorProps {
	/** Trigger label. Defaults to "Add agent"; use "Start work" for the empty state. */
	label?: string;
}

/**
 * "Add agent" affordance for the sessions rail. Opens a controlled DropdownMenu
 * hosting the shared AgentSelector in single-select mode. Selecting an agent
 * launches its session immediately, then closes the menu and resets the query.
 * Agents that already have a running/waiting session are disabled so the same
 * agent is not launched twice concurrently.
 */
export function AgentLaunchSelector({ label = "Add agent" }: Readonly<AgentLaunchSelectorProps>) {
	const { orderedSessions, workItem } = useAgentSessionsMeta();
	const actions = useAgentSessionsActions();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");

	const activeAgentIds = useMemo(
		() =>
			orderedSessions
				.filter((session) => session.status === "running" || session.status === "waiting")
				.map((session) => session.agentId),
		[orderedSessions],
	);

	const handleOpenChange = (nextOpen: boolean) => {
		setIsOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	};

	const handleAgentToggle = (agentId: string) => {
		if (activeAgentIds.includes(agentId)) {
			return;
		}
		const agent = AGENT_SESSIONS_ROSTER.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return;
		}
		actions.launchSession({ id: agent.id, name: agent.name, avatarSrc: agent.avatarSrc });
		setIsOpen(false);
		setQuery("");
	};

	const handleFooterAction = () => {
		setIsOpen(false);
		setQuery("");
	};

	return (
		<DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`Open agent selector for ${workItem.code}`}
						className="gap-2"
						variant="outline"
					/>
				}
			>
				<AddIcon label="" size="small" />
				{label}
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="max-h-none w-[360px] overflow-hidden p-0"
				positionerClassName="z-[502]"
				sideOffset={8}
			>
				<AgentSelector
					agents={AGENT_SESSIONS_ROSTER}
					disabledAgentIds={activeAgentIds}
					onAgentToggle={handleAgentToggle}
					onBrowseAgents={handleFooterAction}
					onCreateAgent={handleFooterAction}
					onQueryChange={setQuery}
					query={query}
					selectionMode="single"
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
