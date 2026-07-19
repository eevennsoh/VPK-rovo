"use client";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import { useState } from "react";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import { AgentSelector } from "@/components/blocks/agent-selector";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ContextBarPill } from "@/components/ui-custom/context-bar";

interface ActivityComposerAgentContextPillProps {
	onSelectAgent: (agentName: string) => void;
}

/** Opens the shared agent selector and inserts the chosen agent into the activity composer. */
export function ActivityComposerAgentContextPill({
	onSelectAgent,
}: Readonly<ActivityComposerAgentContextPillProps>) {
	const [isOpen, setIsOpen] = useState(false);
	const [pinnedAgentIds, setPinnedAgentIds] = useState<readonly string[]>([]);
	const [query, setQuery] = useState("");

	const handleOpenChange = (nextOpen: boolean) => {
		setIsOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	};

	const handleAgentToggle = (agentId: string) => {
		const agent = ROVO_AGENT_SELECTOR_AGENTS.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return;
		}
		onSelectAgent(agent.name);
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
					<ContextBarPill
						className="motion-reduce:transition-none"
						icon={<Icon aria-hidden render={<AiAgentIcon label="" size="small" />} />}
					/>
				}
			>
				Assign agents
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="max-h-none w-[360px] overflow-hidden p-0"
				positionerClassName="z-[502]"
				sideOffset={8}
			>
				<AgentSelector
					agents={ROVO_AGENT_SELECTOR_AGENTS}
					onAgentToggle={handleAgentToggle}
					onBrowseAgents={handleFooterAction}
					onCreateAgent={handleFooterAction}
					onPinnedAgentIdsChange={setPinnedAgentIds}
					onQueryChange={setQuery}
					query={query}
					pinnedAgentIds={pinnedAgentIds}
					selectionMode="single"
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
