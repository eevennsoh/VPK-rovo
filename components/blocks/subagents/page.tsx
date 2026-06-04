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
	DEFAULT_SUBAGENTS_BASE_AGENT,
	SUBAGENTS_DEMO_PROMPTS,
	type SubagentPrompt,
	type SubagentsBaseAgent,
} from "@/components/blocks/subagents/data/demo-agents";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface SubagentsProps {
	className?: string;
	initialActiveSubagentId?: string;
	initialBaseAgent?: SubagentsBaseAgent;
	initialSubagents?: ReadonlyArray<SubagentPrompt>;
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
		conversationStarterIcons: config.conversationStarterIcons ? [...config.conversationStarterIcons] : undefined,
	};
}

function cloneBaseAgent(agent: SubagentsBaseAgent): SubagentsBaseAgent {
	return {
		...agent,
		config: cloneConfig(agent.config),
	};
}

function cloneSubagentPrompt(prompt: SubagentPrompt): SubagentPrompt {
	return {
		...prompt,
		config: cloneConfig(prompt.config),
	};
}

function normalizeBaseAgent(agent: SubagentsBaseAgent | undefined): SubagentsBaseAgent {
	return cloneBaseAgent(agent ?? DEFAULT_SUBAGENTS_BASE_AGENT);
}

function normalizeSubagentPrompts(prompts: ReadonlyArray<SubagentPrompt> | undefined): SubagentPrompt[] {
	return (prompts ?? SUBAGENTS_DEMO_PROMPTS).map(cloneSubagentPrompt);
}

function getDerivedSubagentNames(prompts: ReadonlyArray<SubagentPrompt>): string[] {
	return prompts
		.map((prompt) => prompt.triggerName.trim())
		.filter(Boolean);
}

function getBaseConfigWithSubagents(
	baseConfig: AgentConfigFormValue,
	prompts: ReadonlyArray<SubagentPrompt>,
): AgentConfigFormValue {
	return {
		...baseConfig,
		subagents: getDerivedSubagentNames(prompts),
	};
}

function getListItems(config: AgentConfigFormValue, field: AgentConfigListFieldName): string[] {
	const items = config[field];
	return Array.isArray(items) ? [...items] : [];
}

function updateConfigListItem(
	config: AgentConfigFormValue,
	field: AgentConfigListFieldName,
	index: number,
	value: string,
): AgentConfigFormValue {
	const items = getListItems(config, field);
	items[index] = value;
	return { ...config, [field]: items };
}

function createDraftSubagentPrompt(prompts: ReadonlyArray<SubagentPrompt>): SubagentPrompt {
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

function SubagentPromptFields({
	condition,
	idPrefix,
	onConditionChange,
	onTriggerNameChange,
	triggerName,
}: Readonly<{
	condition: string;
	idPrefix: string;
	onConditionChange: (value: string) => void;
	onTriggerNameChange: (value: string) => void;
	triggerName: string;
}>) {
	const triggerId = `${idPrefix}-trigger`;
	const conditionId = `${idPrefix}-condition`;

	return (
		<div className="shrink-0 border-t border-border bg-surface py-4">
			<div className="grid gap-2 md:grid-cols-[6rem_minmax(0,1fr)]">
				<label
					className="pt-1.5 text-sm font-semibold leading-5 text-text-subtle"
					htmlFor={triggerId}
				>
					Trigger
				</label>
				<Input
					id={triggerId}
					placeholder="Placeholder"
					value={triggerName}
					onChange={(event) => onTriggerNameChange(event.currentTarget.value)}
				/>
				<label
					className="pt-2 text-sm font-semibold leading-5 text-text-subtle"
					htmlFor={conditionId}
				>
					Condition
				</label>
				<Textarea
					id={conditionId}
					className="min-h-[74px]"
					placeholder="Describe the situation that should trigger this subagent."
					value={condition}
					onChange={(event) => onConditionChange(event.currentTarget.value)}
				/>
			</div>
		</div>
	);
}

export default function Subagents({
	className,
	initialActiveSubagentId,
	initialBaseAgent,
	initialSubagents,
}: Readonly<SubagentsProps>) {
	const initialBaseAgentState = useMemo(() => normalizeBaseAgent(initialBaseAgent), [initialBaseAgent]);
	const initialSubagentPromptState = useMemo(() => normalizeSubagentPrompts(initialSubagents), [initialSubagents]);
	const [baseAgent, setBaseAgent] = useState<SubagentsBaseAgent>(() => initialBaseAgentState);
	const [subagentPrompts, setSubagentPrompts] = useState<SubagentPrompt[]>(() => initialSubagentPromptState);
	const [activeSubagentId, setActiveSubagentId] = useState<string | null>(() => {
		const initialActivePrompt = initialActiveSubagentId
			? initialSubagentPromptState.find((prompt) => prompt.id === initialActiveSubagentId)
			: null;
		return initialActivePrompt?.id ?? null;
	});

	const activePrompt = activeSubagentId
		? subagentPrompts.find((prompt) => prompt.id === activeSubagentId) ?? null
		: null;
	const namedSubagentPrompts = useMemo(
		() => subagentPrompts.filter((prompt) => prompt.triggerName.trim()),
		[subagentPrompts],
	);
	const baseConfig = useMemo(
		() => getBaseConfigWithSubagents(baseAgent.config, subagentPrompts),
		[baseAgent.config, subagentPrompts],
	);
	const activeConfig = activePrompt ? activePrompt.config : baseConfig;
	const activeConfigId = activePrompt ? `prompt-${activePrompt.id}` : "base";
	const activeSubagentListIndex = activePrompt
		? namedSubagentPrompts.findIndex((prompt) => prompt.id === activePrompt.id)
		: -1;

	function handleSelectBaseAgent() {
		startTransition(() => {
			setActiveSubagentId(null);
		});
	}

	function handleSelectSubagent(promptId: string) {
		startTransition(() => {
			setActiveSubagentId(promptId);
		});
	}

	function handleCreateSubagent() {
		const prompt = createDraftSubagentPrompt(subagentPrompts);
		startTransition(() => {
			setSubagentPrompts((currentPrompts) => [...currentPrompts, prompt]);
			setActiveSubagentId(prompt.id);
		});
	}

	function updateBaseConfig(updateConfig: (config: AgentConfigFormValue) => AgentConfigFormValue) {
		setBaseAgent((currentAgent) => ({
			...currentAgent,
			config: updateConfig(cloneConfig(currentAgent.config)),
		}));
	}

	function updateActivePromptConfig(updateConfig: (config: AgentConfigFormValue) => AgentConfigFormValue) {
		if (!activePrompt) {
			updateBaseConfig(updateConfig);
			return;
		}

		setSubagentPrompts((currentPrompts) =>
			currentPrompts.map((prompt) =>
				prompt.id === activePrompt.id
					? {
						...prompt,
						config: updateConfig(cloneConfig(prompt.config)),
					}
					: prompt
			),
		);
	}

	function handleBaseTextChange(field: AgentConfigTextFieldName, value: string) {
		updateBaseConfig((config) => ({
			...config,
			[field]: value,
			...(field === "description" ? { summary: value } : {}),
		}));
	}

	function handleActiveTextChange(field: AgentConfigTextFieldName, value: string) {
		updateActivePromptConfig((config) => ({
			...config,
			[field]: value,
			...(field === "description" ? { summary: value } : {}),
		}));
	}

	function handleListItemChange(field: AgentConfigListFieldName, index: number, value: string) {
		if (!activePrompt && field === "subagents") {
			return;
		}

		updateActivePromptConfig((config) => updateConfigListItem(config, field, index, value));
	}

	function handleRemoveListItem(field: AgentConfigListFieldName, index: number) {
		if (!activePrompt && field === "subagents") {
			const triggerNames = getDerivedSubagentNames(subagentPrompts);
			const triggerName = triggerNames[index];
			if (!triggerName) {
				return;
			}

			setSubagentPrompts((currentPrompts) => {
				let removed = false;
				return currentPrompts.filter((prompt) => {
					if (!removed && prompt.triggerName.trim() === triggerName) {
						removed = true;
						return false;
					}
					return true;
				});
			});
			return;
		}

		updateActivePromptConfig((config) => ({
			...config,
			[field]: getListItems(config, field).filter((_, itemIndex) => itemIndex !== index),
		}));
	}

	function handleAppendListItem(field: AgentConfigListFieldName) {
		if (field === "subagents") {
			handleCreateSubagent();
			return;
		}

		updateActivePromptConfig((config) => ({
			...config,
			[field]: [...getListItems(config, field), ""],
		}));
	}

	function handleSelectConfigListItem(field: AgentConfigListFieldName, index: number) {
		if (field !== "subagents") {
			return;
		}

		const prompt = namedSubagentPrompts[index];
		if (!prompt) {
			return;
		}

		handleSelectSubagent(prompt.id);
	}

	function handleTriggerNameChange(value: string) {
		if (!activePrompt) {
			return;
		}

		setSubagentPrompts((currentPrompts) =>
			currentPrompts.map((prompt) =>
				prompt.id === activePrompt.id
					? { ...prompt, triggerName: value }
					: prompt
			),
		);
	}

	function handleConditionChange(value: string) {
		if (!activePrompt) {
			return;
		}

		setSubagentPrompts((currentPrompts) =>
			currentPrompts.map((prompt) =>
				prompt.id === activePrompt.id
					? { ...prompt, condition: value }
					: prompt
			),
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
				activeSubagentId={activeSubagentId}
				baseAgent={baseAgent}
				className="absolute right-4 top-[42%] z-20 hidden md:block"
				onCreateSubagent={handleCreateSubagent}
				onSelectBaseAgent={handleSelectBaseAgent}
				onSelectSubagent={handleSelectSubagent}
				subagents={subagentPrompts}
			/>
			<div className="flex-1 overflow-y-auto px-6 py-6 pr-20">
				<Agent className="mx-auto flex min-h-[852px] w-full max-w-[720px] flex-col">
					<AgentContent className="flex min-h-0 flex-1 flex-col">
						<AgentConfigFields
							avatarSrc={baseAgent.avatarSrc}
							className="min-h-0 flex-1"
							compactFooterBefore={activePrompt ? (
								<SubagentPromptFields
									condition={activePrompt.condition}
									idPrefix={`subagents-${activePrompt.id}`}
									onConditionChange={handleConditionChange}
									onTriggerNameChange={handleTriggerNameChange}
									triggerName={activePrompt.triggerName}
								/>
							) : null}
							config={activeConfig}
							idPrefix={`subagents-${activeConfigId}`}
							layout="compact"
							onAppendListItem={handleAppendListItem}
							onListItemChange={handleListItemChange}
							onManageSubagents={handleCreateSubagent}
							onProfileTextChange={handleBaseTextChange}
							onRemoveListItem={handleRemoveListItem}
							onSelectListItem={handleSelectConfigListItem}
							onTextChange={handleActiveTextChange}
							profileAvatarSrc={baseAgent.avatarSrc}
							profileConfig={baseConfig}
							screenAssistantTargetPrefix={`subagents:${activeConfigId}`}
							selectedListItemIndexByField={{
								subagents: activeSubagentListIndex >= 0 ? activeSubagentListIndex : undefined,
							}}
						/>
					</AgentContent>
				</Agent>
			</div>
		</div>
	);
}

export type { SubagentPrompt, SubagentsBaseAgent } from "@/components/blocks/subagents/data/demo-agents";
