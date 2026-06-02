import type { AgentConfigFormValue } from "@/components/ui-custom/agent";

export type SubagentsAgentKind = "master" | "subagent";

export interface SubagentsAgent {
	id: string;
	kind: SubagentsAgentKind;
	avatarSrc?: string;
	config: AgentConfigFormValue;
}

export const DEFAULT_SUBAGENTS_MASTER_AGENT: SubagentsAgent = {
	id: "master-orchestrator",
	kind: "master",
	avatarSrc: "/avatar-agent/teamwork-agents/blocker-checker.svg",
	config: {
		name: "Policy Checker",
		description:
			"This agent helps employees quickly find and understand company guidelines, HR policies, and benefits information.",
		summary:
			"This agent helps employees quickly find and understand company guidelines, HR policies, and benefits information.",
		instructions:
			"Review policy questions, decide which specialist subagent should help, and return a clear answer with citations to internal guidance.",
		contextDescription: "",
		triggers: ["Company Handbook", "HR policy question"],
		skills: ["Search policies", "Summarize guidance"],
		tools: ["Policy index", "Benefits lookup"],
		subagents: ["Policy Researcher", "Benefits Analyst"],
		knowledge: ["Teamwork Graph", "HR handbook"],
		conversationStarters: [
			"Which leave policy applies to this request?",
			"Summarize benefits eligibility for this employee.",
		],
		agentId: "policy-checker",
		action: "draft",
	},
};

export const SUBAGENTS_DEMO_AGENTS: ReadonlyArray<SubagentsAgent> = [
	DEFAULT_SUBAGENTS_MASTER_AGENT,
	{
		id: "policy-researcher",
		kind: "subagent",
		avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
		config: {
			name: "Policy Researcher",
			description:
				"Finds the most relevant policy sources, checks recency, and extracts the exact passages the master agent needs.",
			summary:
				"Finds the most relevant policy sources, checks recency, and extracts the exact passages the master agent needs.",
			instructions:
				"Search policy knowledge sources, prioritize current official guidance, and return concise source-backed notes to the master agent.",
			contextDescription: "",
			triggers: ["Policy source needed"],
			skills: ["Search policies"],
			tools: ["Policy index"],
			subagents: [],
			knowledge: ["HR handbook"],
			conversationStarters: ["Find the source policy for this question."],
			agentId: "policy-researcher",
			action: "draft",
		},
	},
	{
		id: "benefits-analyst",
		kind: "subagent",
		avatarSrc: "/avatar-agent/service-agents/service-triage.svg",
		config: {
			name: "Benefits Analyst",
			description:
				"Interprets employee benefits questions and prepares eligibility details for the master agent.",
			summary:
				"Interprets employee benefits questions and prepares eligibility details for the master agent.",
			instructions:
				"Review benefit-related questions, identify eligibility rules, and summarize the answer in plain language for the master agent.",
			contextDescription: "",
			triggers: ["Benefits question"],
			skills: ["Summarize guidance"],
			tools: ["Benefits lookup"],
			subagents: [],
			knowledge: ["Benefits handbook"],
			conversationStarters: ["Check benefit eligibility for this scenario."],
			agentId: "benefits-analyst",
			action: "draft",
		},
	},
];
