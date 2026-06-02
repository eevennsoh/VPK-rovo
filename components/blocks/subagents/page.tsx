"use client";

import { startTransition, useMemo, useState } from "react";
import {
	Agent,
	AgentConfigFields,
	type AgentConfigFormValue,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
	AgentContent,
} from "@/components/ui-custom/agent";
import { SubagentsNavigator } from "@/components/blocks/subagents/subagents-navigator";
import {
	DEFAULT_SUBAGENTS_MASTER_AGENT,
	SUBAGENTS_DEMO_AGENTS,
	type SubagentsAgent,
} from "@/components/blocks/subagents/data/demo-agents";
import { cn } from "@/lib/utils";

export interface SubagentsProps {
	className?: string;
	initialActiveAgentId?: string;
	initialAgents?: ReadonlyArray<SubagentsAgent>;
}

function cloneConfig(config: AgentConfigFormValue): AgentConfigFormValue {
	return {
		...config,
		triggers: config.triggers ? [...config.triggers] : undefined,
		skills: config.skills ? [...config.skills] : undefined,
		tools: config.tools ? [...config.tools] : undefined,
		subagents: config.subagents ? [...config.subagents] : undefined,
		knowledge: config.knowledge ? [...config.knowledge] : undefined,
		conversationStarters: config.conversationStarters ? [...config.conversationStarters] : undefined,
	};
}

function cloneAgent(agent: SubagentsAgent): SubagentsAgent {
	return {
		...agent,
		config: cloneConfig(agent.config),
	};
}

function getAgentDisplayName(agent: SubagentsAgent): string {
	return agent.config.name?.trim() || (agent.kind === "master" ? "Master orchestrator" : "Untitled subagent");
}

function syncMasterSubagentNames(agents: ReadonlyArray<SubagentsAgent>): SubagentsAgent[] {
	const subagentNames = agents
		.filter((agent) => agent.kind === "subagent")
		.map(getAgentDisplayName);

	return agents.map((agent) =>
		agent.kind === "master"
			? {
				...agent,
				config: {
					...agent.config,
					subagents: subagentNames,
				},
			}
			: agent
	);
}

function normalizeAgents(agents: ReadonlyArray<SubagentsAgent> | undefined): SubagentsAgent[] {
	const clonedAgents = (agents && agents.length > 0 ? agents : SUBAGENTS_DEMO_AGENTS).map(cloneAgent);
	const masterAgent = clonedAgents.find((agent) => agent.kind === "master") ?? cloneAgent(DEFAULT_SUBAGENTS_MASTER_AGENT);
	const subagents = clonedAgents.filter((agent) => agent.kind === "subagent");
	return syncMasterSubagentNames([masterAgent, ...subagents]);
}

function getListItems(config: AgentConfigFormValue, field: AgentConfigListFieldName): string[] {
	const items = config[field];
	return Array.isArray(items) ? [...items] : [];
}

function updateAgentConfig(
	agents: ReadonlyArray<SubagentsAgent>,
	agentId: string,
	updateConfig: (config: AgentConfigFormValue) => AgentConfigFormValue,
): SubagentsAgent[] {
	return syncMasterSubagentNames(
		agents.map((agent) =>
			agent.id === agentId
				? {
					...agent,
					config: updateConfig(cloneConfig(agent.config)),
				}
				: agent
		),
	);
}

function createDraftSubagent(agents: ReadonlyArray<SubagentsAgent>): {
	agent: SubagentsAgent;
	agents: SubagentsAgent[];
} {
	const nextIndex = agents.filter((agent) => agent.kind === "subagent").length + 1;
	let id = `untitled-subagent-${nextIndex}`;
	let suffix = nextIndex;
	const existingIds = new Set(agents.map((agent) => agent.id));
	while (existingIds.has(id)) {
		suffix += 1;
		id = `untitled-subagent-${suffix}`;
	}

	const agent: SubagentsAgent = {
		id,
		kind: "subagent",
		avatarSrc: "/avatar-agent/teamwork-agents/user-manual-writer.svg",
		config: {
			name: `Untitled subagent ${nextIndex}`,
			description: "",
			summary: "",
			instructions: "",
			contextDescription: "",
			triggers: [],
			skills: [],
			tools: [],
			subagents: [],
			knowledge: [],
			conversationStarters: [],
			agentId: id,
			action: "draft",
		},
	};

	return {
		agent,
		agents: syncMasterSubagentNames([...agents, agent]),
	};
}

export default function Subagents({
	className,
	initialActiveAgentId,
	initialAgents,
}: Readonly<SubagentsProps>) {
	const initialState = useMemo(() => normalizeAgents(initialAgents), [initialAgents]);
	const [agents, setAgents] = useState<SubagentsAgent[]>(() => initialState);
	const [activeAgentId, setActiveAgentId] = useState(() => {
		const initialActiveAgent = initialActiveAgentId
			? initialState.find((agent) => agent.id === initialActiveAgentId)
			: null;
		return initialActiveAgent?.id ?? initialState[0]?.id ?? DEFAULT_SUBAGENTS_MASTER_AGENT.id;
	});
	const activeAgent = agents.find((agent) => agent.id === activeAgentId) ?? agents[0] ?? DEFAULT_SUBAGENTS_MASTER_AGENT;

	function handleSelectAgent(agentId: string) {
		startTransition(() => {
			setActiveAgentId(agentId);
		});
	}

	function handleCreateSubagent() {
		const result = createDraftSubagent(agents);
		startTransition(() => {
			setAgents(result.agents);
			setActiveAgentId(result.agent.id);
		});
	}

	function handleTextChange(field: AgentConfigTextFieldName, value: string) {
		setAgents((currentAgents) =>
			updateAgentConfig(currentAgents, activeAgent.id, (config) => ({
				...config,
				[field]: value,
				...(field === "description" ? { summary: value } : {}),
			})),
		);
	}

	function handleListItemChange(field: AgentConfigListFieldName, index: number, value: string) {
		setAgents((currentAgents) =>
			updateAgentConfig(currentAgents, activeAgent.id, (config) => {
				const items = getListItems(config, field);
				items[index] = value;
				return { ...config, [field]: items };
			}),
		);
	}

	function handleRemoveListItem(field: AgentConfigListFieldName, index: number) {
		setAgents((currentAgents) =>
			updateAgentConfig(currentAgents, activeAgent.id, (config) => ({
				...config,
				[field]: getListItems(config, field).filter((_, itemIndex) => itemIndex !== index),
			})),
		);
	}

	function handleAppendListItem(field: AgentConfigListFieldName) {
		if (field === "subagents") {
			handleCreateSubagent();
			return;
		}

		setAgents((currentAgents) =>
			updateAgentConfig(currentAgents, activeAgent.id, (config) => ({
				...config,
				[field]: [...getListItems(config, field), ""],
			})),
		);
	}

	return (
		<div
			className={cn(
				"relative flex h-full min-h-[852px] overflow-hidden rounded-xl bg-background",
				className,
			)}
		>
			<SubagentsNavigator
				activeAgentId={activeAgent.id}
				agents={agents}
				className="absolute right-4 top-[42%] z-20 hidden md:block"
				onCreateSubagent={handleCreateSubagent}
				onSelectAgent={handleSelectAgent}
			/>
			<div className="flex-1 overflow-y-auto px-6 py-6 pr-20">
				<Agent className="mx-auto flex min-h-[852px] w-full max-w-[720px] flex-col">
					<AgentContent className="flex min-h-0 flex-1 flex-col">
						<AgentConfigFields
							avatarSrc={activeAgent.avatarSrc}
							className="min-h-0 flex-1"
							config={activeAgent.config}
							idPrefix={`subagents-${activeAgent.id}`}
							layout="compact"
							onAppendListItem={handleAppendListItem}
							onListItemChange={handleListItemChange}
							onRemoveListItem={handleRemoveListItem}
							onTextChange={handleTextChange}
							screenAssistantTargetPrefix={`subagents:${activeAgent.id}`}
						/>
					</AgentContent>
				</Agent>
			</div>
		</div>
	);
}

export type { SubagentsAgent } from "@/components/blocks/subagents/data/demo-agents";
