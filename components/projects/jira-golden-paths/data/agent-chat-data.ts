import {
	ROVO_AGENT_ID,
	ROVO_AGENT_PROFILES,
	type RovoAgentProfile,
} from "@/app/data/directory/agents";
import type { JiraForYouItem } from "@/components/blocks/jira-for-you";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";

export interface JgpAgentChatScenario {
	agentId: string;
	agentName: string;
	issueKey: string;
	issueSummary: string;
	intro?: string;
	question?: QuestionCardQuestion;
	request?: string;
	result?: string;
}

export interface JgpAgentChatPlaybackFrame {
	delayMs: number;
	parts: RovoUIMessage["parts"];
}

export interface JgpAgentChatPlayback {
	assistantMessageId: string;
	frames: readonly JgpAgentChatPlaybackFrame[];
	userMessage: RovoUIMessage;
}

const JGP_AGENT_PROFILES = [
	{
		id: "rfp-drafter",
		name: "RFP Drafter",
		byline: "JGP demo agent by Rovo",
		avatarSrc: getDeterministicAgentAvatarSrc("rfp-drafter"),
		description: "Drafts response narratives and prepares concise RFP handoffs for review.",
		starters: [],
		contextDescription: "Answer as RFP Drafter for the selected JGP Jira issue.",
	},
	{
		id: "service-impact-agent",
		name: "Service impact agent",
		byline: "JGP demo agent by Rovo",
		avatarSrc: "/avatar-agent/service-agents/rca-agent.svg",
		description: "Maps affected services, owners, and customer-facing impact for Jira work items.",
		starters: [],
		contextDescription: "Answer as Service impact agent for the selected JGP Jira issue.",
	},
	{
		id: "dependency-mapper",
		name: "Dependency mapper",
		byline: "JGP demo agent by Rovo",
		avatarSrc: "/avatar-agent/teamwork-agents/work-item-planner.svg",
		description: "Finds dependent components, linked work, and blocked handoffs.",
		starters: [],
		contextDescription: "Answer as Dependency mapper for the selected JGP Jira issue.",
	},
] as const satisfies readonly RovoAgentProfile[];

/** Static profiles supplied to the JGP-local provider so chat can select demo agents. */
export const JGP_CHAT_AGENT_PROFILES: readonly RovoAgentProfile[] = [
	...ROVO_AGENT_PROFILES,
	...JGP_AGENT_PROFILES,
];

const JGP_FOR_YOU_AGENT_BY_ITEM_ID: Readonly<Record<string, {
	agentId: string;
	agentName: string;
}>> = {
	"vitafleet-presentation": { agentId: "readiness-checker", agentName: "Readiness checker" },
	"crm-analytics-dashboard": { agentId: "feedback-analyzer", agentName: "Feedback analyzer" },
	"performance-benchmarking": { agentId: "progress-tracker", agentName: "Progress tracker" },
	"refactor-readability": { agentId: "code-planner", agentName: "Code planner" },
	"payment-suite-failures": { agentId: "code-reviewer", agentName: "Code reviewer" },
	"onboarding-e2e-coverage": { agentId: "code-planner", agentName: "Code planner" },
	"critical-component-testing": { agentId: "code-reviewer", agentName: "Code reviewer" },
	"ci-pipeline": { agentId: "progress-tracker", agentName: "Progress tracker" },
	"enhance-accessibility": { agentId: "feedback-analyzer", agentName: "Feedback analyzer" },
	"third-party-apis": { agentId: "readiness-checker", agentName: "Readiness checker" },
};

/** Maps each For You fixture to a deterministic selected-agent chat playback. */
export function buildJgpForYouAgentChatScenario(item: JiraForYouItem): JgpAgentChatScenario {
	const agent = JGP_FOR_YOU_AGENT_BY_ITEM_ID[item.id] ?? {
		agentId: ROVO_AGENT_ID,
		agentName: "Rovo",
	};

	return {
		...agent,
		issueKey: item.issueKey,
		issueSummary: item.title,
		request: `Show me the latest update on ${item.issueKey}.`,
		result: [
			`${agent.agentName} checked **${item.issueKey}** and confirmed its current Jira status is **${item.jiraStatus}**.`,
			`I reviewed the available ${item.spaceName} context and prepared the next useful handoff for this work item.`,
		].join("\n\n"),
	};
}

/** Builds the persistent, non-dismissible work-item context shown in JGP chat. */
export function buildJgpAgentChatContextBar(
	scenario: JgpAgentChatScenario,
): ChatContextBarDescriptor {
	return {
		iconName: "work-item",
		label: `${scenario.issueKey}: ${scenario.issueSummary}`,
		showDismissPlaceholder: false,
		signature: `jira-golden-paths-work-item:${scenario.issueKey}`,
	};
}

function getScenarioRequest(scenario: JgpAgentChatScenario): string {
	return scenario.request ?? `Continue working on ${scenario.issueKey}: ${scenario.issueSummary}.`;
}

function getScenarioResult(scenario: JgpAgentChatScenario): string {
	if (scenario.result) return scenario.result;

	return [
		`I finished a first pass for **${scenario.issueKey}** with the context available on the work item.`,
		"I mapped the relevant requirements, checked the linked evidence, and prepared a concise handoff for Review.",
	].join("\n\n");
}

function buildJgpQuestionCardParts(
	scenario: JgpAgentChatScenario,
	runId: string,
): RovoUIMessage["parts"] | null {
	if (!scenario.question) return null;

	const toolCallId = `jira-golden-paths-agent-question-${runId}`;
	return [
		{
			type: "text",
			text: scenario.intro ?? "I found a decision point that needs your input before I can continue with the implementation notes.",
			state: "done",
		},
		{
			type: "data-widget-data",
			data: {
				type: "question-card",
				payload: {
					type: "question-card",
					sessionId: toolCallId,
					round: 1,
					maxRounds: 1,
					title: "Answer to continue",
					requiredCount: 1,
					toolCallId,
					questions: [{ ...scenario.question, required: true }],
				},
			},
		},
	];
}

/**
 * Builds a deterministic local thinking -> generating -> completed transcript.
 * The ids vary per playback, while the visible content and timing stay stable.
 */
export function buildJgpAgentChatPlayback(
	scenario: JgpAgentChatScenario,
	runId: string,
	now = Date.now(),
): JgpAgentChatPlayback {
	const assistantMessageId = `jira-golden-paths-agent-assistant-${runId}`;
	const questionCardParts = buildJgpQuestionCardParts(scenario, runId);
	const toolCallId = `jira-golden-paths-agent-work-${runId}`;
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
			id: `jira-golden-paths-agent-user-${runId}`,
			role: "user",
			parts: [{ type: "text", text: getScenarioRequest(scenario), state: "done" }],
		},
		frames: questionCardParts ? [{ delayMs: 0, parts: questionCardParts }] : [
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
