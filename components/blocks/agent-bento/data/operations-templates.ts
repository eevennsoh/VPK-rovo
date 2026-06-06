// Minimal "Start with these agent templates" prompt-starter set, copied from the
// agent-config compact operations bento (`AgentCompactOperationsBento`).

export interface AgentBentoOperationsTemplate {
	description: string;
	iconSrc: string;
	title: string;
}

export const AGENT_BENTO_OPERATIONS_TEMPLATES: ReadonlyArray<AgentBentoOperationsTemplate> = [
	{
		description: "Triage service requests, recommend field updates, and ask for missing details when needed.",
		iconSrc: "/avatar-agent/service-agents/service-triage.svg",
		title: "Service Triage",
	},
	{
		description: "Draft support responses, suggest assignees, and summarize requests for faster resolution.",
		iconSrc: "/avatar-agent/strategy-agents/strategic-insight.svg",
		title: "Service Request Helper",
	},
	{
		description: "Guide incident response, on-call actions, mitigation, status updates, and recovery.",
		iconSrc: "/avatar-agent/dev-agents/code-standardizer.svg",
		title: "Rovo Ops",
	},
	{
		description: "Answer Rovo setup and usage questions with concise guidance and helpful links.",
		iconSrc: "/avatar-agent/product-agents/wildcard-3.svg",
		title: "Rovo Expert",
	},
	{
		description: "Help teammates document working style, communication norms, and collaboration preferences.",
		iconSrc: "/avatar-agent/teamwork-agents/user-manual-writer.svg",
		title: "User Manual Writer",
	},
] as const;
