import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import {
	ROVO_AGENT_SELECTOR_AGENTS,
	ROVO_CUSTOM_AGENT_SELECTOR_AGENTS,
} from "@/app/data/directory/agents";

/** Agent Selector demos render the complete unified Agent Directory catalog. */
export const AGENT_SELECTOR_DEMO_AGENTS: readonly AgentSelectorAgent[] = ROVO_AGENT_SELECTOR_AGENTS;

export const AGENT_SELECTOR_CUSTOM_AGENT_DEMO_AGENTS: readonly AgentSelectorAgent[] =
	ROVO_CUSTOM_AGENT_SELECTOR_AGENTS;
