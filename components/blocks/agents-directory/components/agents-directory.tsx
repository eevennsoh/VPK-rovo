"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import type { AgentTemplatesAgent, AgentTemplatesCategoryId } from "@/components/blocks/agent-templates";
import {
	DEMO_AGENT_TEMPLATES,
	DEMO_AGENT_TEMPLATES_SESSION,
} from "@/components/blocks/agent-templates/data/demo-template-agents";
import { DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS } from "@/components/blocks/agents-directory/data/sidebar-groups";

export type AgentsDirectoryAgent = AgentBrowserAgent;
export type AgentsDirectoryTemplateAgent = AgentTemplatesAgent;
export type AgentsDirectorySidebarGroup = AgentBrowserSidebarGroup;

export interface AgentsDirectoryDialogProps {
	agents: readonly AgentsDirectoryAgent[];
	onCreateAgent?: () => void;
	onSelectAgent?: (agent: AgentsDirectoryAgent) => void;
	onSelectTemplateAgent?: (agent: AgentsDirectoryTemplateAgent) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgents?: readonly AgentsDirectoryAgent[];
	sessionTemplateAgents?: readonly AgentsDirectoryTemplateAgent[];
	sidebarGroups?: readonly AgentsDirectorySidebarGroup[];
	templateAgents?: readonly AgentsDirectoryTemplateAgent[];
	/** Template category selected when the directory first opens (e.g. open straight onto "Planning"). */
	initialTemplateCategory?: AgentTemplatesCategoryId | null;
	title?: string;
}

const EMPTY_AGENTS_DIRECTORY_AGENTS: readonly AgentsDirectoryAgent[] = [];

export function AgentsDirectoryDialog({
	agents,
	onCreateAgent,
	onSelectAgent,
	onSelectTemplateAgent,
	open,
	onOpenChange,
	sessionAgents = EMPTY_AGENTS_DIRECTORY_AGENTS,
	sessionTemplateAgents = DEMO_AGENT_TEMPLATES_SESSION,
	sidebarGroups = DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS,
	templateAgents = DEMO_AGENT_TEMPLATES,
	initialTemplateCategory = null,
	title,
}: Readonly<AgentsDirectoryDialogProps>) {
	const directoryAgents = useMemo(
		() => [...agents, ...sessionAgents],
		[agents, sessionAgents],
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
			sidebarGroups={sidebarGroups}
			templateAgents={directoryTemplateAgents}
			initialTemplateCategory={initialTemplateCategory}
		/>
	);
}
