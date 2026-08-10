import {
	ROVO_AGENT_ID,
	ROVO_AGENT_PROFILES,
	type RovoAgentProfile,
} from "@/app/data/directory/agents";
import type { JiraForYouItem } from "@/components/projects/jira-for-you";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";

export interface AsxAgentChatScenario {
	agentId: string;
	agentName: string;
	issueKey: string;
	issueSummary: string;
	intro?: string;
	playbackVariant?: "jira-description-improvement" | "static-result";
	question?: QuestionCardQuestion;
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
	keepThinkingActiveAfterLastFrame?: boolean;
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

const ASX_FOR_YOU_AGENT_BY_ITEM_ID: Readonly<Record<string, {
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
export function buildAsxForYouAgentChatScenario(item: JiraForYouItem): AsxAgentChatScenario {
	const agent = ASX_FOR_YOU_AGENT_BY_ITEM_ID[item.id] ?? {
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

function buildAsxQuestionCardParts(
	scenario: AsxAgentChatScenario,
	runId: string,
): RovoUIMessage["parts"] | null {
	if (!scenario.question) return null;

	const toolCallId = `asx-agent-question-${runId}`;
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

function createThinkingStatus({
	content,
	label,
	timestamp,
	toolCallId,
}: Readonly<{
	content: string;
	label: string;
	timestamp: string;
	toolCallId: string;
}>): RovoUIMessage["parts"][number] {
	return {
		type: "data-thinking-status",
		data: {
			activity: "data",
			content,
			label,
			source: "fallback",
			timestamp,
			toolCallId,
		},
	};
}

function createThinkingEvent({
	input,
	label,
	output,
	outputPreview,
	phase,
	timestamp,
	toolCallId,
	toolName,
}: Readonly<{
	input?: unknown;
	label: string;
	output?: unknown;
	outputPreview?: string;
	phase: "start" | "result";
	timestamp: string;
	toolCallId: string;
	toolName: string;
}>): RovoUIMessage["parts"][number] {
	return {
		type: "data-thinking-event",
		id: `${toolCallId}-${phase}`,
		data: {
			eventId: `${toolCallId}-${phase}`,
			phase,
			toolName,
			label,
			toolCallId,
			...(input !== undefined ? { input } : {}),
			...(output !== undefined ? { output } : {}),
			...(outputPreview ? { outputPreview } : {}),
			timestamp,
		},
	};
}

function buildJiraDescriptionTraceParts(
	scenario: AsxAgentChatScenario,
	runId: string,
	now: number,
): ReadonlyArray<RovoUIMessage["parts"]> {
	const parts: RovoUIMessage["parts"] = [];
	const snapshots: RovoUIMessage["parts"][] = [];
	const timestamp = (offsetMs: number) => new Date(now + offsetMs).toISOString();
	const appendSnapshot = (...nextParts: RovoUIMessage["parts"]) => {
		parts.push(...nextParts.flat());
		snapshots.push([...parts]);
	};
	const tools = [
		{
			id: `jira-context-${runId}`,
			toolName: "jira.read_work_item_context",
			label: "Reading the current work item",
			content: "Reviewing the existing outcome, known constraints, and initial acceptance criteria without changing the description.",
			input: { issueKey: scenario.issueKey, fields: ["description", "comments", "attachments"] },
			output: { issueKey: scenario.issueKey, descriptionState: "initial-draft", attachmentCount: 2 },
			outputPreview: "Current description and supporting product evidence reviewed.",
		},
		{
			id: `twg-context-${runId}`,
			toolName: "twg.lookup_work_item_delivery_context",
			label: "Connecting related delivery context",
			content: "Using Teamwork Graph to correlate the reporter, checkout research, design brief, and storefront ownership signals.",
			input: { issueKey: scenario.issueKey, relationshipDepth: 2 },
			output: { sources: ["Jira", "Confluence", "Figma"], relatedSignals: 4 },
			outputPreview: "Found 4 relevant delivery signals across Jira, Confluence, and Figma.",
		},
		{
			id: `requirements-${runId}`,
			toolName: "confluence.search_checkout_requirements",
			label: "Checking product requirements",
			content: "Comparing the draft against checkout-funnel research and the guest-checkout product brief.",
			input: { query: "guest checkout safeguards recovery accessibility", issueKey: scenario.issueKey },
			output: { matchedRequirements: 6, missingFromDraft: ["server validation", "recoverable errors", "mobile web"] },
			outputPreview: "Identified three implementation-critical details missing from the initial draft.",
		},
		{
			id: `draft-${runId}`,
			toolName: "jira.draft_work_item_description",
			label: "Drafting the improved description",
			content: "Structuring a clearer user outcome, delivery scope, proposed flow, and testable acceptance criteria.",
			input: { issueKey: scenario.issueKey, mode: "suggestion-only", preserveOriginal: true },
			output: { status: "drafted", workItemUpdated: false },
			outputPreview: "Improved description drafted; the work item remains unchanged.",
		},
	] as const;

	tools.forEach((tool, index) => {
		const offset = index * 800;
		appendSnapshot(
			createThinkingStatus({
				content: tool.content,
				label: tool.label,
				timestamp: timestamp(offset),
				toolCallId: tool.id,
			}),
			createThinkingEvent({
				input: tool.input,
				label: tool.label,
				phase: "start",
				timestamp: timestamp(offset),
				toolCallId: tool.id,
				toolName: tool.toolName,
			}),
		);
		appendSnapshot(createThinkingEvent({
			label: tool.label,
			output: tool.output,
			outputPreview: tool.outputPreview,
			phase: "result",
			timestamp: timestamp(offset + 500),
			toolCallId: tool.id,
			toolName: tool.toolName,
		}));
	});

	return snapshots;
}

function buildJiraDescriptionPlayback(
	scenario: AsxAgentChatScenario,
	runId: string,
	now: number,
): Pick<AsxAgentChatPlayback, "frames" | "keepThinkingActiveAfterLastFrame"> {
	const traceSnapshots = buildJiraDescriptionTraceParts(scenario, runId, now);
	const finalTrace = traceSnapshots.at(-1) ?? [];
	const questionCardParts = buildAsxQuestionCardParts(scenario, runId);

	if (questionCardParts) {
		const askToolCallId = `ask-user-${runId}`;
		const timestamp = new Date(now + 3_400).toISOString();
		return {
			frames: [{
				delayMs: 0,
				parts: [
					...finalTrace,
					createThinkingStatus({
						content: "The suggestion is ready. Waiting for Venn to decide whether Jira should apply it.",
						label: "Awaiting user response",
						timestamp,
						toolCallId: askToolCallId,
					}),
					createThinkingEvent({
						input: { questions: [scenario.question?.label] },
						label: "Confirming the description update",
						phase: "start",
						timestamp,
						toolCallId: askToolCallId,
						toolName: "ask_user_questions",
					}),
					{ type: "data-turn-complete", data: { timestamp } },
					...questionCardParts,
				],
			}],
		};
	}

	return {
		frames: traceSnapshots.map((parts, index) => ({
			delayMs: index === 0 ? 0 : 400,
			parts,
		})),
		keepThinkingActiveAfterLastFrame: true,
	};
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
	const questionCardParts = buildAsxQuestionCardParts(scenario, runId);
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
	const jiraDescriptionPlayback = scenario.playbackVariant === "jira-description-improvement"
		? buildJiraDescriptionPlayback(scenario, runId, now)
		: null;
	const staticResultParts = scenario.playbackVariant === "static-result"
		? [{ type: "text" as const, text: result, state: "done" as const }]
		: null;

	return {
		assistantMessageId,
		...(jiraDescriptionPlayback ?? {}),
		userMessage: {
			id: `asx-agent-user-${runId}`,
			role: "user",
			parts: [{ type: "text", text: getScenarioRequest(scenario), state: "done" }],
		},
		frames: jiraDescriptionPlayback?.frames ?? (staticResultParts
			? [{ delayMs: 0, parts: staticResultParts }]
			: questionCardParts ? [{ delayMs: 0, parts: questionCardParts }] : [
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
		]),
	};
}
