import type {
	AgentConfigFormValue,
	AgentConfigListFieldName,
} from "@/components/ui-custom/agent";
import {
	DEFAULT_SUBAGENTS_BASE_AGENT,
	SUBAGENTS_DEMO_PROMPTS,
	type SubagentPrompt,
	type SubagentsBaseAgent,
} from "@/components/blocks/subagents/data/demo-agents";

// Pure, behavior-preserving helpers shared by the standalone subagents demo
// (components/blocks/subagents/page.tsx) and the studio agent config panel.
// Keeping them here is the single source of truth for both consumers.

export function cloneConfig(config: AgentConfigFormValue): AgentConfigFormValue {
	return {
		...config,
		triggers: config.triggers ? [...config.triggers] : undefined,
		skills: config.skills ? [...config.skills] : undefined,
		tools: config.tools ? [...config.tools] : undefined,
		subagents: config.subagents ? [...config.subagents] : undefined,
		knowledge: config.knowledge ? [...config.knowledge] : undefined,
		conversationStarters: config.conversationStarters ? [...config.conversationStarters] : undefined,
		conversationStarterIcons: config.conversationStarterIcons ? [...config.conversationStarterIcons] : undefined,
	};
}

export function cloneBaseAgent(agent: SubagentsBaseAgent): SubagentsBaseAgent {
	return {
		...agent,
		config: cloneConfig(agent.config),
	};
}

export function cloneSubagentPrompt(prompt: SubagentPrompt): SubagentPrompt {
	return {
		...prompt,
		config: cloneConfig(prompt.config),
	};
}

export function normalizeBaseAgent(agent: SubagentsBaseAgent | undefined): SubagentsBaseAgent {
	return cloneBaseAgent(agent ?? DEFAULT_SUBAGENTS_BASE_AGENT);
}

export function normalizeSubagentPrompts(prompts: ReadonlyArray<SubagentPrompt> | undefined): SubagentPrompt[] {
	return (prompts ?? SUBAGENTS_DEMO_PROMPTS).map(cloneSubagentPrompt);
}

export function getDerivedSubagentNames(prompts: ReadonlyArray<SubagentPrompt>): string[] {
	return prompts
		.map((prompt) => prompt.triggerName.trim())
		.filter(Boolean);
}

export function getBaseConfigWithSubagents(
	baseConfig: AgentConfigFormValue,
	prompts: ReadonlyArray<SubagentPrompt>,
): AgentConfigFormValue {
	return {
		...baseConfig,
		subagents: getDerivedSubagentNames(prompts),
	};
}

export function getListItems(config: AgentConfigFormValue, field: AgentConfigListFieldName): string[] {
	const items = config[field];
	return Array.isArray(items) ? [...items] : [];
}

export function updateConfigListItem(
	config: AgentConfigFormValue,
	field: AgentConfigListFieldName,
	index: number,
	value: string,
): AgentConfigFormValue {
	const items = getListItems(config, field);
	items[index] = value;
	return { ...config, [field]: items };
}

export function createDraftSubagentPrompt(prompts: ReadonlyArray<SubagentPrompt>): SubagentPrompt {
	const nextIndex = prompts.length + 1;
	let id = `subagent-prompt-${nextIndex}`;
	let suffix = nextIndex;
	const existingIds = new Set(prompts.map((prompt) => prompt.id));
	while (existingIds.has(id)) {
		suffix += 1;
		id = `subagent-prompt-${suffix}`;
	}

	return {
		id,
		triggerName: "",
		condition: "",
		config: {
			instructions: "",
			contextDescription: "",
			triggers: [],
			skills: [],
			tools: [],
			knowledge: [],
			conversationStarters: [],
			action: "draft",
		},
	};
}
