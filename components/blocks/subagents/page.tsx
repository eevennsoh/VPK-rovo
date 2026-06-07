"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import {
	Agent,
	AgentConfigFields,
	type AgentConfigFormValue,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
	AgentContent,
} from "@/components/blocks/agent";
import { SubagentsNavigator } from "@/components/blocks/subagents/subagents-navigator";
import { useSubagentsNavigatorTop } from "@/components/projects/studio/hooks/use-subagents-navigator-top";
import { ManageSubagentsDialog } from "@/components/blocks/subagents/components/manage-subagents-dialog";
import {
	cloneConfig,
	createDraftSubagentPrompt,
	getBaseConfigWithSubagents,
	getListItems,
	normalizeBaseAgent,
	normalizeSubagentPrompts,
	updateConfigListItem,
} from "@/components/blocks/subagents/lib/subagent-prompts";
import {
	type SubagentPrompt,
	type SubagentsBaseAgent,
} from "@/components/blocks/subagents/data/demo-agents";
import { cn } from "@/lib/utils";

export interface SubagentsProps {
	className?: string;
	initialActiveSubagentId?: string;
	initialBaseAgent?: SubagentsBaseAgent;
	initialSubagents?: ReadonlyArray<SubagentPrompt>;
}

export default function Subagents({
	className,
	initialActiveSubagentId,
	initialBaseAgent,
	initialSubagents,
}: Readonly<SubagentsProps>) {
	// Keep the floating navigator top-aligned with the first line of the
	// instructions editor (measured relative to this positioned root) instead
	// of a fixed `top` that drifts as the profile/content above reflows.
	const containerRef = useRef<HTMLDivElement | null>(null);
	const navigatorTop = useSubagentsNavigatorTop(containerRef);
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
	const [isManageSubagentsOpen, setIsManageSubagentsOpen] = useState(false);

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

	function handleDeleteSubagent(id: string) {
		setSubagentPrompts((currentPrompts) => currentPrompts.filter((prompt) => prompt.id !== id));
		setActiveSubagentId((currentId) => (currentId === id ? null : currentId));
	}

	function handleReorderSubagents(activeId: string, overId: string) {
		setSubagentPrompts((currentPrompts) => {
			const fromIndex = currentPrompts.findIndex((prompt) => prompt.id === activeId);
			const toIndex = currentPrompts.findIndex((prompt) => prompt.id === overId);
			if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
				return currentPrompts;
			}

			const nextPrompts = [...currentPrompts];
			const [moved] = nextPrompts.splice(fromIndex, 1);
			nextPrompts.splice(toIndex, 0, moved);
			return nextPrompts;
		});
	}

	function handleToggleSubagent(id: string, enabled: boolean) {
		setSubagentPrompts((currentPrompts) =>
			currentPrompts.map((prompt) => (prompt.id === id ? { ...prompt, enabled } : prompt)),
		);
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
			const promptToRemove = namedSubagentPrompts[index];
			if (!promptToRemove) {
				return;
			}

			setSubagentPrompts((currentPrompts) => currentPrompts.filter((prompt) => prompt.id !== promptToRemove.id));
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
			ref={containerRef}
			className={cn(
				"relative flex h-full min-h-[852px] overflow-hidden rounded-xl bg-background",
				className,
			)}
		>
			{/* The wrapper carries the measured `top` so the switcher top-aligns
			    with the first line of the instructions editor. */}
			<div
				className="absolute right-4 z-20 hidden md:block"
				style={{ top: navigatorTop }}
			>
				<SubagentsNavigator
					activeSubagentId={activeSubagentId}
					baseAgent={baseAgent}
					onCreateSubagent={handleCreateSubagent}
					onDeleteSubagent={handleDeleteSubagent}
					onManageSubagents={() => setIsManageSubagentsOpen(true)}
					onSelectBaseAgent={handleSelectBaseAgent}
					onSelectSubagent={handleSelectSubagent}
					onToggleSubagent={handleToggleSubagent}
					subagents={subagentPrompts}
				/>
			</div>
			<div className="flex-1 overflow-y-auto px-6 py-6 pr-20">
				<Agent className="mx-auto flex min-h-[852px] w-full max-w-[720px] flex-col">
					<AgentContent className="flex min-h-0 flex-1 flex-col">
						<AgentConfigFields
							avatarSrc={baseAgent.avatarSrc}
							baseAgentName={baseConfig.name}
							className="min-h-0 flex-1"
							config={activeConfig}
							isSubagent={Boolean(activePrompt)}
							onSelectBaseAgent={handleSelectBaseAgent}
							onSubagentNameChange={handleTriggerNameChange}
							subagentName={activePrompt?.triggerName}
							subagentCondition={activePrompt?.condition}
							onSubagentConditionChange={handleConditionChange}
							idPrefix={`subagents-${activeConfigId}`}
							onAppendListItem={handleAppendListItem}
							onListItemChange={handleListItemChange}
							onManageSubagents={() => setIsManageSubagentsOpen(true)}
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
			<ManageSubagentsDialog
				open={isManageSubagentsOpen}
				onOpenChange={setIsManageSubagentsOpen}
				onCreateSubagent={() => {
					setIsManageSubagentsOpen(false);
					handleCreateSubagent();
				}}
				onDeleteSubagent={handleDeleteSubagent}
				onReorderSubagents={handleReorderSubagents}
				onToggleSubagent={handleToggleSubagent}
				subagents={subagentPrompts}
			/>
		</div>
	);
}

export type { SubagentPrompt, SubagentsBaseAgent } from "@/components/blocks/subagents/data/demo-agents";
