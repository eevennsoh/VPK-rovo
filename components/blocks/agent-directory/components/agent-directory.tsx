"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserAgent,
	type AgentBrowserTemplateBuildOptions,
	type AgentBrowserTemplateBuildResult,
	type AgentBrowserVariant,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import type { AgentTemplatesAgent, AgentTemplatesCategoryId } from "@/components/blocks/agent-templates";
import {
	DEMO_AGENT_TEMPLATES,
	DEMO_AGENT_TEMPLATES_SESSION,
} from "@/components/blocks/agent-templates/data/demo-template-agents";
import { DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS } from "@/components/blocks/agent-directory/data/sidebar-groups";

export type AgentsDirectoryAgent = AgentBrowserAgent;
export type AgentsDirectoryTemplateAgent = AgentTemplatesAgent;
export type AgentsDirectorySidebarGroup = AgentBrowserSidebarGroup;
export type AgentsDirectoryVariant = AgentBrowserVariant;
export type AgentsDirectoryTemplateBuildOptions = AgentBrowserTemplateBuildOptions;
export type AgentsDirectoryTemplateBuildResult = AgentBrowserTemplateBuildResult;

export interface AgentsDirectoryDialogProps {
	agents: readonly AgentsDirectoryAgent[];
	onCreateAgent?: () => void;
	onSelectAgent?: (agent: AgentsDirectoryAgent) => void;
	onSelectTemplateAgent?: (agent: AgentsDirectoryTemplateAgent) => void;
	onBuildTemplateAgent?: (
		agent: AgentsDirectoryTemplateAgent,
		options: AgentsDirectoryTemplateBuildOptions
	) => AgentsDirectoryTemplateBuildResult | null;
	onOpenBuiltTemplateAgentConfig?: (profileId: string) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgents?: readonly AgentsDirectoryAgent[];
	sessionTemplateAgents?: readonly AgentsDirectoryTemplateAgent[];
	sidebarGroups?: readonly AgentsDirectorySidebarGroup[];
	templateAgents?: readonly AgentsDirectoryTemplateAgent[];
	/** Template category selected when the directory first opens (e.g. open straight onto "Planning"). */
	initialTemplateCategory?: AgentTemplatesCategoryId | null;
	title?: string;
	variant?: AgentsDirectoryVariant;
}

const EMPTY_AGENTS_DIRECTORY_AGENTS: readonly AgentsDirectoryAgent[] = [];

function mergeDirectoryAgents({
	agents,
	sessionAgents,
	variant,
}: {
	agents: readonly AgentsDirectoryAgent[];
	sessionAgents: readonly AgentsDirectoryAgent[];
	variant: AgentsDirectoryVariant;
}): readonly AgentsDirectoryAgent[] {
	const byId = new Map<string, AgentsDirectoryAgent>();

	for (const agent of agents) {
		byId.set(agent.id, agent);
	}

	for (const sessionAgent of sessionAgents) {
		const existingAgent = byId.get(sessionAgent.id);
		const normalizedSessionAgent = variant === "experimental"
			? { ...sessionAgent, favorite: true }
			: sessionAgent;
		byId.set(sessionAgent.id, {
			...(existingAgent ?? {}),
			...normalizedSessionAgent,
			attributionKind: normalizedSessionAgent.attributionKind ?? existingAgent?.attributionKind,
			rating: normalizedSessionAgent.rating ?? existingAgent?.rating,
			feedbackCount: normalizedSessionAgent.feedbackCount ?? existingAgent?.feedbackCount,
			chatCount: normalizedSessionAgent.chatCount ?? existingAgent?.chatCount,
			verified: normalizedSessionAgent.verified ?? existingAgent?.verified,
		});
	}

	return [...byId.values()];
}

export function AgentsDirectoryDialog({
	agents,
	onCreateAgent,
	onSelectAgent,
	onSelectTemplateAgent,
	onBuildTemplateAgent,
	onOpenBuiltTemplateAgentConfig,
	open,
	onOpenChange,
	sessionAgents = EMPTY_AGENTS_DIRECTORY_AGENTS,
	sessionTemplateAgents = DEMO_AGENT_TEMPLATES_SESSION,
	sidebarGroups = DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS,
	templateAgents = DEMO_AGENT_TEMPLATES,
	initialTemplateCategory = null,
	title,
	variant = "default",
}: Readonly<AgentsDirectoryDialogProps>) {
	const directoryAgents = useMemo(
		() => mergeDirectoryAgents({ agents, sessionAgents, variant }),
		[agents, sessionAgents, variant],
	);
	const directoryTemplateAgents = useMemo(
		() => [...templateAgents, ...sessionTemplateAgents],
		[sessionTemplateAgents, templateAgents],
	);

	return (
		<AgentBrowserDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			primaryActionLabel="New agent"
			onPrimaryAction={onCreateAgent}
			agents={directoryAgents}
			onSelectAgent={onSelectAgent}
			onSelectTemplateAgent={onSelectTemplateAgent}
			onBuildTemplateAgent={onBuildTemplateAgent}
			onOpenBuiltTemplateAgentConfig={onOpenBuiltTemplateAgentConfig}
			sidebarGroups={sidebarGroups}
			templateAgents={directoryTemplateAgents}
			initialTemplateCategory={initialTemplateCategory}
			variant={variant}
		/>
	);
}
