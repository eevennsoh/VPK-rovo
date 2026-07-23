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
import type { AsxQueueSession } from "@/components/projects/jira-queue/data/queue-sessions";
import type { RovoAppDocument } from "@/lib/rovo-app-types";

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
		id: "claude-code",
		name: "Claude Code",
			byline: "Coding agent by Anthropic",
			brandName: "claude",
			description: "Claude Code is an agentic coding tool that reads your codebase, edits files, runs commands, and integrates with your development tools.",
			starters: [],
			contextDescription: "Answer as Claude Code for the selected JGP Jira issue and pull request.",
	},
	{
		id: "cursor",
		name: "Cursor",
		byline: "Coding agent",
		avatarSrc: getDeterministicAgentAvatarSrc("cursor"),
		description: "Implements scoped Jira engineering tasks and prepares code changes for human review.",
		starters: [],
		contextDescription: "Answer as Cursor for the selected JGP Jira issue.",
	},
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
	{
		id: "unit-test-creator",
		name: "Unit Test Creator",
		byline: "JGP demo agent by Rovo",
		avatarSrc: "/avatar-agent/dev-agents/unit-test-creator.svg",
		description: "Creates focused regression coverage and review-ready test artifacts for Jira work items.",
		starters: [],
		contextDescription: "Answer as Unit Test Creator for the selected JGP Jira issue.",
	},
] as const satisfies readonly RovoAgentProfile[];

export const JGP_CLAUDE_CODE_AGENT_PROFILE: RovoAgentProfile = JGP_AGENT_PROFILES[0];

/** Static profiles supplied to the JGP-local provider so chat can select demo agents. */
export const JGP_CHAT_AGENT_PROFILES: readonly RovoAgentProfile[] = [
	...ROVO_AGENT_PROFILES,
	...JGP_AGENT_PROFILES,
];

function queueMessage(id: string, role: "assistant" | "user", text: string): RovoUIMessage {
	return { id, role, parts: [{ type: "text", text, state: "done" }] };
}

const JGP_252_ARTIFACT_DOCUMENT_ID = "jgp-252-clear-focus-code";

/** Static route-owned code preview for the mobile PR-review session. */
export const JGP_ROVO_ARTIFACT_DOCUMENTS: Readonly<Record<string, RovoAppDocument>> = {
	[JGP_252_ARTIFACT_DOCUMENT_ID]: {
		id: JGP_252_ARTIFACT_DOCUMENT_ID,
		threadId: "jgp-252-pr-review",
		title: "JGP-252 Clear focus action",
		kind: "code",
		previewSummary: "Adds an explicit Clear focus action and restores the full board without disturbing keyboard focus.",
		sourceMessageId: "jgp-252-agent",
		createdAt: "2026-07-23T00:18:00.000Z",
		updatedAt: "2026-07-23T00:18:00.000Z",
		versions: [{
			id: "jgp-252-clear-focus-v1",
			title: "Clear focus action",
			changeLabel: "PR #842",
			createdAt: "2026-07-23T00:18:00.000Z",
			content: `export function AssigneeFocusToolbar({ focusedAssignee, onClearFocus }: Props) {
	return focusedAssignee ? (
		<Button appearance="subtle" onClick={onClearFocus}>
			Clear focus
		</Button>
	) : null;
}`,
		}],
	},
};

/** Route-owned mobile Rovo snapshots for Sarah's global-session story. */
export const JGP_ROVO_SESSION_SEEDS: readonly AsxQueueSession[] = [
	{
		id: "jgp-251-persistence-question",
		spaceId: "jira-board-focus-workflows",
		agentId: "cursor",
		host: "cloud",
		issueKey: "JGP-251",
		issueSummary: "Remember assignee focus per board",
		title: "Remember assignee focus per board",
		status: "awaiting-input",
		isPinned: false,
		jiraColumn: "In progress",
		manualRank: 1,
		priority: "low",
		priorityRank: 1,
		updatedRank: 1,
		assignee: { name: "Sarah" },
		question: {
			prompt: "Should assignee focus persist when someone returns to this board?",
			questions: [{
				id: "focus-persistence",
				kind: "single-select",
				label: "How should assignee focus be remembered?",
				description: "This determines whether the saved focus follows the person or stays scoped to the current board.",
				options: [
					{ id: "per-board", label: "Remember per board", description: "Restore the last focused assignee separately for each board." },
					{ id: "global", label: "Remember everywhere", description: "Use the same focused assignee across every board." },
					{ id: "session-only", label: "Only this visit", description: "Clear focus when the board is closed." },
				],
			}],
		},
		messages: [
			queueMessage("jgp-251-user", "user", "Implement saved assignee focus for this board."),
			queueMessage("jgp-251-agent", "assistant", "I have the board preference storage ready, but one product decision changes the data scope and restore behavior."),
		],
	},
	{
		id: "jgp-252-pr-review",
		spaceId: "jira-board-focus-workflows",
		agentId: "cursor",
		host: "cloud",
		issueKey: "JGP-252",
		issueSummary: "Add a Clear focus action",
		title: "Add a Clear focus action",
		status: "pr-open",
		isPinned: false,
		jiraColumn: "Done",
		manualRank: 2,
		priority: "low",
		priorityRank: 2,
		updatedRank: 2,
		assignee: { name: "Sarah" },
		repository: "atlassian/jira-cloud",
		branch: "cursor/jgp-252-clear-focus-action",
		pullRequestNumber: 842,
		pullRequestTitle: "JGP-252 Add a Clear focus action",
		commit: "6f4c2ab",
		checks: "5 checks passing",
		fileChanges: {
			additions: 42,
			deletions: 8,
			files: [
				"src/boards/assignee-focus/assignee-focus-toolbar.tsx",
				"src/boards/assignee-focus/assignee-focus-toolbar.test.tsx",
			],
			isDismissed: false,
		},
		messages: [
			queueMessage("jgp-252-user", "user", "Add a clear action so I can return to the full board after focusing on one assignee."),
			{
				id: "jgp-252-agent",
				role: "assistant",
				parts: [
					{ type: "text", text: "I added the Clear focus action, kept keyboard focus stable, and updated the focused tests. PR **#842** is open with all five checks passing. Open the code artifact to review the implementation, then move the Jira work item to Done when you are happy.", state: "done" },
					{
						type: "data-artifact-result",
						data: {
							action: "create",
							documentId: JGP_252_ARTIFACT_DOCUMENT_ID,
							kind: "code",
							threadId: "jgp-252-pr-review",
							title: "JGP-252 Clear focus action",
						},
					},
				],
			},
		],
	},
];

const JGP_FOR_YOU_AGENT_BY_ITEM_ID: Readonly<Record<string, {
	agentId: string;
	agentName: string;
}>> = {
	"jgp-251": { agentId: "cursor", agentName: "Cursor" },
	"jgp-252": { agentId: "cursor", agentName: "Cursor" },
	"jgp-253": { agentId: "cursor", agentName: "Cursor" },
	"jgp-254": { agentId: "cursor", agentName: "Cursor" },
	"jgp-255": { agentId: "cursor", agentName: "Cursor" },
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
