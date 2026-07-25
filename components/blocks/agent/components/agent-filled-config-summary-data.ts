import {
	getAgentAutomationItems,
	getNonEmptyConfigItems,
	getSkillConfigItems,
	type AgentConfigFormValue,
} from "@/components/blocks/agent/lib/agent-config-model";

export function hasFilledAgentConfig(config: AgentConfigFormValue): boolean {
	return (
		getAgentAutomationItems(config).length > 0 ||
		getSkillConfigItems(config.skills).length > 0 ||
		getNonEmptyConfigItems(config.tools).length > 0 ||
		getNonEmptyConfigItems(config.subagents).length > 0 ||
		getNonEmptyConfigItems(config.knowledge).length > 0 ||
		getNonEmptyConfigItems(config.conversationStarters).length > 0
	);
}
