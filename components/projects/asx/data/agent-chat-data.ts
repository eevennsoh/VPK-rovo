import {
	ROVO_AGENT_PROFILES,
	type RovoAgentProfile,
} from "@/app/data/directory/agents";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";

export interface AsxAgentChatScenario {
	agentId: string;
	agentName: string;
	issueKey: string;
	issueSummary: string;
	request?: string;
	result?: string;
}

export interface AsxAgentChatPlaybackFrame {
	delayMs: number;
	parts: RovoUIMessage["parts"];
}

export interface AsxAgentChatPlayback {
	assistantMessageId: string;
	frames: readonly AsxAgentChatPlaybackFrame[];
	userMessage: RovoUIMessage;
}

const ASX_AGENT_PROFILES = [
	{
		id: "rfp-drafter",
		name: "RFP Drafter",
		byline: "ASX demo agent by Rovo",
		avatarSrc: getDeterministicAgentAvatarSrc("rfp-drafter"),
		description: "Drafts response narratives and prepares concise RFP handoffs for review.",
		starters: [],
		contextDescription: "Answer as RFP Drafter for the selected ASX Jira issue.",
	},
	{
		id: "service-impact-agent",
		name: "Service impact agent",
		byline: "ASX demo agent by Rovo",
		avatarSrc: "/avatar-agent/service-agents/rca-agent.svg",
		description: "Maps affected services, owners, and customer-facing impact for Jira work items.",
		starters: [],
		contextDescription: "Answer as Service impact agent for the selected ASX Jira issue.",
	},
	{
		id: "dependency-mapper",
		name: "Dependency mapper",
		byline: "ASX demo agent by Rovo",
		avatarSrc: "/avatar-agent/teamwork-agents/work-item-planner.svg",
		description: "Finds dependent components, linked work, and blocked handoffs.",
		starters: [],
		contextDescription: "Answer as Dependency mapper for the selected ASX Jira issue.",
	},
] as const satisfies readonly RovoAgentProfile[];

/** Static profiles supplied to the ASX-local provider so chat can select demo agents. */
export const ASX_CHAT_AGENT_PROFILES: readonly RovoAgentProfile[] = [
	...ROVO_AGENT_PROFILES,
	...ASX_AGENT_PROFILES,
];

/** Builds the persistent, non-dismissible work-item context shown in ASX chat. */
export function buildAsxAgentChatContextBar(
	scenario: AsxAgentChatScenario,
): ChatContextBarDescriptor {
	return {
		iconName: "work-item",
		label: `${scenario.issueKey}: ${scenario.issueSummary}`,
		showDismissPlaceholder: false,
		signature: `asx-work-item:${scenario.issueKey}`,
	};
}

function getScenarioRequest(scenario: AsxAgentChatScenario): string {
	return scenario.request ?? `Continue working on ${scenario.issueKey}: ${scenario.issueSummary}.`;
}

function getScenarioResult(scenario: AsxAgentChatScenario): string {
	if (scenario.result) return scenario.result;

	return [
		`I finished a first pass for **${scenario.issueKey}** with the context available on the work item.`,
		"I mapped the relevant requirements, checked the linked evidence, and prepared a concise handoff for Review.",
	].join("\n\n");
}

/**
 * Builds a deterministic local thinking -> generating -> completed transcript.
 * The ids vary per playback, while the visible content and timing stay stable.
 */
export function buildAsxAgentChatPlayback(
	scenario: AsxAgentChatScenario,
	runId: string,
	now = Date.now(),
): AsxAgentChatPlayback {
	const assistantMessageId = `asx-agent-assistant-${runId}`;
	const toolCallId = `asx-agent-work-${runId}`;
	const startedAt = new Date(now).toISOString();
	const completedAt = new Date(now + 2_400).toISOString();
	const thinkingStatus = {
		type: "data-thinking-status" as const,
		data: {
			label: `Reviewing ${scenario.issueKey}`,
			content: `${scenario.agentName} is reading the issue context and connected work before preparing an update.`,
			toolCallId,
			activity: "data" as const,
			source: "fallback" as const,
			timestamp: startedAt,
		},
	};
	const toolStart = {
		type: "data-thinking-event" as const,
		id: `${toolCallId}-start`,
		data: {
			eventId: `${toolCallId}-start`,
			phase: "start" as const,
			toolName: "jira.read_work_item_context",
			label: "Reading the work item and linked context",
			toolCallId,
			input: { issueKey: scenario.issueKey, summary: scenario.issueSummary },
			timestamp: startedAt,
		},
	};
	const toolResult = {
		type: "data-thinking-event" as const,
		id: `${toolCallId}-result`,
		data: {
			eventId: `${toolCallId}-result`,
			phase: "result" as const,
			toolName: "jira.read_work_item_context",
			label: "Reading the work item and linked context",
			toolCallId,
			output: { status: "ready-for-handoff", issueKey: scenario.issueKey },
			outputPreview: "Issue context reviewed and handoff prepared.",
			timestamp: completedAt,
		},
	};
	const result = getScenarioResult(scenario);

	return {
		assistantMessageId,
		userMessage: {
			id: `asx-agent-user-${runId}`,
			role: "user",
			parts: [{ type: "text", text: getScenarioRequest(scenario), state: "done" }],
		},
		frames: [
			{ delayMs: 0, parts: [thinkingStatus] },
			{ delayMs: 700, parts: [thinkingStatus, toolStart] },
			{
				delayMs: 900,
				parts: [thinkingStatus, toolStart, { type: "text", text: result.split("\n\n")[0] ?? result, state: "streaming" }],
			},
			{
				delayMs: 800,
				parts: [thinkingStatus, toolStart, toolResult, { type: "text", text: result, state: "done" }],
			},
		],
	};
}
