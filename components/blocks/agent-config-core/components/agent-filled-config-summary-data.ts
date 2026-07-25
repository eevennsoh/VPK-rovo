import {
	getAgentAutomationItems,
	getNonEmptyConfigItems,
	type AgentConfigFormValue,
} from "@/components/blocks/agent-config-core/lib/agent-config-model";

export function hasFilledAgentConfig(config: AgentConfigFormValue): boolean {
	return (
		getAgentAutomationItems(config).length > 0 ||
		getNonEmptyConfigItems(config.skills).length > 0 ||
		getNonEmptyConfigItems(config.tools).length > 0 ||
		getNonEmptyConfigItems(config.subagents).length > 0 ||
		getNonEmptyConfigItems(config.knowledge).length > 0 ||
		getNonEmptyConfigItems(config.conversationStarters).length > 0
	);
}
