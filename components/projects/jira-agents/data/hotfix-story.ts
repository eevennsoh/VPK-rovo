import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { AgentListItem, AgentListState } from "@/components/blocks/agent-list";
import type {
	AgentSession,
	AgentSessionComment,
	AgentSessionStatus,
	JiraWorkItemPreset,
	JiraWorkItemState,
	StaticTimelineEvent,
} from "@/components/blocks/jira-work-item/data/session-state";
import {
	getAgentActivityActorId,
	hydratePreset,
} from "@/components/blocks/jira-work-item/data/session-state";
import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import type {
	JiraKanbanAgentData,
	JiraKanbanCardData,
	JiraKanbanColumnData,
} from "@/components/blocks/jira-kanban";
import type {
	JiraForYouAgent,
	JiraForYouItem,
	JiraForYouSection,
	JiraForYouStatus,
} from "@/components/projects/jira-for-you/jira-for-you-types";
import { JIRA_FOR_YOU_SECTIONS } from "@/components/projects/jira-for-you/data";
import {
	JIRA_DESIGN_KANBAN_AGENTS,
	JIRA_DESIGN_KANBAN_COLUMNS,
} from "@/components/projects/jira-golden-journeys/data/jira-design-work-items";

export type JiraAgentsStoryChapter =
	| "brief"
	| "plan"
	| "working"
	| "handoff"
	| "review"
	| "done";

export const JIRA_AGENTS_STORY_CHAPTERS = [
	{ label: "Brief", value: "brief" },
	{ label: "Plan", value: "plan" },
	{ label: "Working", value: "working" },
	{ label: "Handoff", value: "handoff" },
	{ label: "Review", value: "review" },
	{ label: "Done", value: "done" },
] as const satisfies readonly { label: string; value: JiraAgentsStoryChapter }[];

export const JIRA_AGENTS_STORY_ITEM_ID = "shop-4821-guest-checkout";
export const JIRA_AGENTS_STORY_ISSUE_KEY = "SHOP-4821";

const STORY_EPOCH_MS = Date.UTC(2026, 7, 5, 2, 0, 0);

const STORY_STATUS_BY_CHAPTER = {
	brief: "To do",
	plan: "In progress",
	working: "In progress",
	handoff: "In progress",
	review: "In review",
	done: "Done",
} as const satisfies Record<JiraAgentsStoryChapter, JiraForYouStatus>;

const WORK_ITEM_STATUS_BY_CHAPTER = {
	brief: "To do",
	plan: "In progress",
	working: "In progress",
	handoff: "In progress",
	review: "In review",
	done: "Done",
} as const satisfies Record<JiraAgentsStoryChapter, string>;

const CODE_PLANNER = {
	id: "code-planner",
	name: "Code Planner",
	avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
} satisfies JiraForYouAgent;

const GITHUB_COPILOT = {
	id: "github-copilot",
	name: "GitHub Copilot",
	avatarSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
} satisfies JiraForYouAgent;

const UNIT_TEST_CREATOR = {
	id: "unit-test-creator",
	name: "Unit Test Creator",
	avatarSrc: "/avatar-agent/dev-agents/unit-test-creator.svg",
} satisfies JiraForYouAgent;

const STORY_AGENTS = [CODE_PLANNER, GITHUB_COPILOT, UNIT_TEST_CREATOR] as const;
const STORY_AGENT_BY_ID = new Map(STORY_AGENTS.map((agent) => [agent.id, agent]));

export const JIRA_AGENTS_STORY_COMPOSER_AGENTS: readonly AgentSelectorAgent[] = [
	{
		id: CODE_PLANNER.id,
		name: CODE_PLANNER.name,
		byline: "Designs the checkout architecture, API contract, and delivery plan",
		avatarSrc: CODE_PLANNER.avatarSrc,
	},
	{
		id: GITHUB_COPILOT.id,
		name: GITHUB_COPILOT.name,
		byline: "Implements the checkout service and storefront experience",
		avatarSrc: GITHUB_COPILOT.avatarSrc,
	},
	{
		id: UNIT_TEST_CREATOR.id,
		name: UNIT_TEST_CREATOR.name,
		byline: "Builds and runs guest-checkout acceptance coverage",
		avatarSrc: UNIT_TEST_CREATOR.avatarSrc,
	},
];

export function shouldStartJiraAgentsPlan(
	chapter: JiraAgentsStoryChapter,
	agentIds: readonly string[],
): boolean {
	if (chapter !== "brief") return false;
	const mentionedAgentIds = new Set(agentIds);
	return JIRA_AGENTS_STORY_COMPOSER_AGENTS.every((agent) => mentionedAgentIds.has(agent.id));
}

export const JIRA_AGENTS_STORY_WORK_ITEM_BASE: WorkItemData = {
	code: JIRA_AGENTS_STORY_ISSUE_KEY,
	title: "Add guest checkout to the storefront",
	description: [
		"Checkout-funnel research shows that mandatory account creation is the largest avoidable source of abandonment for first-time shoppers. We need to remove that barrier without weakening pricing, inventory, payment, or order-creation controls.",
		"",
		"#### User outcome",
		"As a first-time shopper, I can complete a purchase without registering so that I can place my order quickly and decide whether to create an account afterward.",
		"",
		"#### Scope",
		"- Offer Continue as guest from the cart and sign-in step on desktop and mobile web.",
		"- Collect email, delivery address, shipping method, and tokenized payment details.",
		"- Recalculate prices, discounts, taxes, shipping, and inventory on the server before payment.",
		"",
		"#### Acceptance criteria",
		"1. An eligible shopper can purchase without signing in or creating an account.",
		"2. Server validation rejects stale pricing, unavailable inventory, invalid addresses, and unusable payment tokens before order creation.",
		"3. Declined payments and recoverable validation errors do not clear safe customer input.",
	].join("\n"),
	status: "To do",
	priority: "High",
	assignee: {
		name: "Jordan Lee",
		avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
	},
	reporter: {
		name: "Maya Chen",
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
	},
	parent: { code: "SHOP-4800", title: "Reduce storefront checkout abandonment" },
	labels: ["storefront", "checkout", "feature"],
	startDate: "Aug 5, 2026",
	dueDate: "Aug 19, 2026",
};

const HUMAN_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-jordan-lee",
	name: "Jordan Lee",
	kind: "person",
	avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
};

const CODE_PLANNER_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-code-planner",
	name: CODE_PLANNER.name,
	kind: "agent",
	avatarSrc: CODE_PLANNER.avatarSrc,
};

const GITHUB_COPILOT_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-github-copilot",
	name: GITHUB_COPILOT.name,
	kind: "agent",
	avatarSrc: GITHUB_COPILOT.avatarSrc,
};

const UNIT_TEST_CREATOR_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-unit-test-creator",
	name: UNIT_TEST_CREATOR.name,
	kind: "agent",
	avatarSrc: UNIT_TEST_CREATOR.avatarSrc,
};

const GITHUB_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-github",
	name: "GitHub",
	kind: "app",
	brandName: "github",
};

function createStoryArtifactSession({
	agent,
	branch,
	elapsedSeconds,
	id,
	state,
	title,
}: {
	agent: JiraForYouAgent;
	branch: string;
	elapsedSeconds: number;
	id: string;
	state: AgentListState;
	title: string;
}): AgentListItem {
	return {
		id,
		title,
		state,
		agent: {
			id: agent.id,
			name: agent.name,
			avatarSrc: agent.avatarSrc,
		},
		branch,
		elapsedSeconds,
	};
}

function statusEvent(
	id: string,
	from: string,
	to: string,
	createdAtMs: number,
): StaticTimelineEvent {
	return {
		id,
		kind: "event",
		actor: HUMAN_ACTOR,
		icon: "status",
		segments: [
			{ type: "text", text: "moved from " },
			{ type: "lozenge", text: from },
			{ type: "transition-arrow" },
			{ type: "lozenge", text: to },
		],
		createdAtMs,
	};
}

const BRIEF_EVENTS: readonly StaticTimelineEvent[] = [
	{
		id: "story-created",
		kind: "event",
		actor: HUMAN_ACTOR,
		icon: "created",
		segments: [{ type: "text", text: "created the feature story from the storefront conversion roadmap" }],
		createdAtMs: STORY_EPOCH_MS - 3_600_000,
	},
	{
		id: "story-impact-labelled",
		kind: "event",
		actor: HUMAN_ACTOR,
		icon: "label",
		segments: [
			{ type: "text", text: "added " },
			{ type: "label", text: "guest-checkout", color: "blue" },
			{ type: "text", text: " and " },
			{ type: "label", text: "feature", color: "purple" },
		],
		createdAtMs: STORY_EPOCH_MS - 3_480_000,
	},
];

const PLAN_EVENTS: readonly StaticTimelineEvent[] = [
	...BRIEF_EVENTS,
	statusEvent("story-moved-in-progress", "To do", "In progress", STORY_EPOCH_MS - 3_000_000),
	{
		id: "story-lead-delegated",
		kind: "event",
		actor: CODE_PLANNER_ACTOR,
		icon: "delegated",
		segments: [
			{ type: "text", text: "claimed the lead, delegated implementation to " },
			{ type: "link", text: "GitHub Copilot" },
			{ type: "text", text: " and acceptance coverage to " },
			{ type: "link", text: "Unit Test Creator" },
		],
		createdAtMs: STORY_EPOCH_MS - 2_880_000,
	},
];

const WORKING_EVENTS: readonly StaticTimelineEvent[] = [
	...PLAN_EVENTS,
	{
		id: "story-telemetry",
		kind: "changed-files",
		actor: CODE_PLANNER_ACTOR,
		summary: "Planned the guest checkout architecture",
		description: "Defined the OpenAPI contract, server-owned validation rules, idempotency behavior, and delivery sequence for the checkout service and storefront.",
		tag: { text: "Technical plan", color: "blue" },
		sessionItem: createStoryArtifactSession({
			id: "story-checkout-plan",
			title: "Planned the guest checkout architecture",
			state: "running",
			agent: CODE_PLANNER,
			branch: JIRA_AGENTS_STORY_ISSUE_KEY,
			elapsedSeconds: 312,
		}),
		outputs: [
			{
				id: "checkout-technical-plan",
				title: "Guest checkout technical plan",
				source: "Agent output",
				owner: CODE_PLANNER.name,
				iconName: "ai-chat",
			},
			{
				id: "checkout-openapi-contract",
				title: "Guest checkout OpenAPI contract",
				source: "Agent snapshot",
				owner: CODE_PLANNER.name,
				iconName: "ai-chat",
			},
			{
				id: "checkout-validation-rules",
				title: "Checkout validation rules",
				source: "Confluence page",
				owner: CODE_PLANNER.name,
				iconName: "page",
			},
		],
		createdAtMs: STORY_EPOCH_MS - 2_460_000,
	},
];

const HANDOFF_EVENT: StaticTimelineEvent = {
	id: "story-root-cause-handoff",
	kind: "changed-files",
	actor: CODE_PLANNER_ACTOR,
	summary: "Shared the checkout contract with GitHub Copilot",
	description: "Posted the request schema, validation errors, order response, and idempotency behavior so the storefront can integrate without duplicating pricing or inventory logic.",
	branch: "#SHOP-4821",
	tag: { text: "Handoff", color: "purple" },
	sessionItem: createStoryArtifactSession({
		id: "story-planner-handoff",
		title: "Shared the checkout contract with GitHub Copilot",
		state: "complete",
		agent: CODE_PLANNER,
		branch: JIRA_AGENTS_STORY_ISSUE_KEY,
		elapsedSeconds: 642,
	}),
	outputs: [
		{
			id: "guest-checkout-contract",
			title: "Guest checkout API contract",
			source: "Agent output",
			owner: CODE_PLANNER.name,
			iconName: "ai-chat",
		},
	],
	createdAtMs: STORY_EPOCH_MS - 1_800_000,
};

const REVIEW_EVENTS: readonly StaticTimelineEvent[] = [
	...WORKING_EVENTS,
	HANDOFF_EVENT,
	{
		id: "story-changed-files",
		kind: "changed-files",
		actor: GITHUB_COPILOT_ACTOR,
		summary: "Changed 12 files",
		description: "Implemented the guest order service plus the storefront delivery, payment, validation, confirmation, and post-purchase account flows against the approved contract.",
		branch: "feature/shop-4821-guest-checkout",
		tag: { text: "Ready for review", color: "green" },
		sessionItem: {
			id: "story-copilot-checkout",
			title: "Implement guest checkout end to end",
			state: "complete",
			agent: {
				id: GITHUB_COPILOT.id,
				name: GITHUB_COPILOT.name,
				avatarSrc: GITHUB_COPILOT.avatarSrc,
			},
			branch: "feature/shop-4821-guest-checkout",
			elapsedSeconds: 482,
			prStatus: "created",
		},
		outputs: [
			{
				id: "guest-checkout-implementation",
				title: "Guest checkout implementation",
				source: "Agent output",
				owner: GITHUB_COPILOT.name,
				iconName: "ai-chat",
			},
		],
		createdAtMs: STORY_EPOCH_MS - 1_200_000,
	},
	{
		id: "story-pr-opened",
		kind: "event",
		actor: GITHUB_ACTOR,
		icon: "linked",
		segments: [],
		pullRequest: {
			number: 1847,
			title: "Add guest checkout to the storefront",
			status: "Open",
			additions: 86,
			deletions: 21,
		},
		createdAtMs: STORY_EPOCH_MS - 1_080_000,
	},
	statusEvent("story-moved-review", "In progress", "In review", STORY_EPOCH_MS - 960_000),
];

const DONE_EVENTS: readonly StaticTimelineEvent[] = [
	...REVIEW_EVENTS,
	{
		id: "story-regression-matrix",
		kind: "changed-files",
		actor: UNIT_TEST_CREATOR_ACTOR,
		summary: "Acceptance matrix passed",
		description: "Verified guest purchase, validation errors, inventory changes, declined payments, duplicate submissions, confirmation, and optional post-purchase account creation.",
		branch: "#1847",
		tag: { text: "18 checks passing", color: "green" },
		sessionItem: createStoryArtifactSession({
			id: "story-test-report",
			title: "Acceptance matrix passed",
			state: "complete",
			agent: UNIT_TEST_CREATOR,
			branch: "#1847",
			elapsedSeconds: 438,
		}),
		outputs: [
			{
				id: "acceptance-report",
				title: "SHOP-4821 acceptance report",
				source: "Test artifact",
				owner: UNIT_TEST_CREATOR.name,
				iconName: "page",
			},
		],
		createdAtMs: STORY_EPOCH_MS - 600_000,
	},
	{
		id: "story-pr-merged",
		kind: "event",
		actor: GITHUB_ACTOR,
		icon: "linked",
		segments: [],
		pullRequest: {
			number: 1847,
			title: "Add guest checkout to the storefront",
			status: "Merged",
			additions: 86,
			deletions: 21,
		},
		createdAtMs: STORY_EPOCH_MS - 480_000,
	},
	{
		id: "story-release-verified",
		kind: "changed-files",
		actor: CODE_PLANNER_ACTOR,
		summary: "Started the feature-flag rollout",
		description: "Guest checkout is enabled for 10% of storefront traffic; order creation, payment success, and checkout completion metrics are healthy.",
		tag: { text: "10% rollout", color: "green" },
		sessionItem: createStoryArtifactSession({
			id: "story-checkout-rollout",
			title: "Started the feature-flag rollout",
			state: "complete",
			agent: CODE_PLANNER,
			branch: "#1847",
			elapsedSeconds: 812,
		}),
		outputs: [
			{
				id: "rollout-note",
				title: "Guest checkout rollout note",
				source: "Feature flag report",
				owner: CODE_PLANNER.name,
				iconName: "globe",
			},
		],
		createdAtMs: STORY_EPOCH_MS - 360_000,
	},
	statusEvent("story-moved-done", "In review", "Done", STORY_EPOCH_MS - 240_000),
];

function createSession(
	agent: JiraForYouAgent,
	status: AgentSessionStatus,
	order: number,
	options: {
		command: string;
		previewText: string;
		title: string;
		waitingOn?: AgentSession["waitingOn"];
		threadReplies?: AgentSession["threadReplies"];
	},
): AgentSession {
	const completed = status === "completed";
	const waiting = status === "waiting";
	const steps = [
		{ id: `${agent.id}-context`, label: "Read the shared work-item context", status: "complete" as const },
		{
			id: `${agent.id}-work`,
			label: options.title,
			status: completed ? "complete" as const : waiting ? "pending" as const : "active" as const,
		},
		{
			id: `${agent.id}-handoff`,
			label: "Share the result with the agent team",
			status: completed ? "complete" as const : "pending" as const,
		},
	];

	return {
		id: `story-session-${agent.id}`,
		agentId: agent.id ?? "unknown-agent",
		agentName: agent.name,
		agentAvatarSrc: agent.avatarSrc,
		title: options.title,
		status,
		command: options.command,
		previewText: options.previewText,
		steps,
		progress: completed ? 1 : waiting ? 1 / 3 : 1 / 2,
		messages: [
			{
				id: `story-session-${agent.id}-prompt`,
				role: "human",
				authorName: "You",
				content: options.command,
				createdAtMs: STORY_EPOCH_MS - 2_700_000 + order * 60_000,
			},
			{
				id: `story-session-${agent.id}-update`,
				role: "agent",
				authorName: agent.name,
				authorAvatarSrc: agent.avatarSrc,
				content: options.previewText,
				createdAtMs: STORY_EPOCH_MS - 2_640_000 + order * 60_000,
			},
		],
		startedAtMs: STORY_EPOCH_MS - 2_700_000 + order * 60_000,
		scriptId: `shop-4821-${agent.id}`,
		scriptCursor: completed ? 3 : 1,
		stepElapsedMs: 0,
		resumedFromWait: false,
		order,
		...(options.waitingOn ? { waitingOn: options.waitingOn } : {}),
		...(options.threadReplies ? { threadReplies: options.threadReplies } : {}),
	};
}

function createStorySessions(chapter: JiraAgentsStoryChapter): AgentSession[] {
	if (chapter === "brief") return [];

	const plannerStatus: AgentSessionStatus = chapter === "plan" || chapter === "working"
		? "running"
		: "completed";
	const copilotStatus: AgentSessionStatus = chapter === "plan" || chapter === "handoff"
		? "running"
		: chapter === "working"
			? "waiting"
			: "completed";
	const testStatus: AgentSessionStatus = chapter === "plan" || chapter === "working" || chapter === "review"
		? "running"
		: chapter === "handoff"
			? "waiting"
			: "completed";

	const planner = createSession(CODE_PLANNER, plannerStatus, 0, {
		title: "Plan the guest checkout architecture",
		command: "Lead the technical plan, define the secure checkout API and validation contract, then hand it to GitHub Copilot.",
		previewText: plannerStatus === "completed"
			? "Technical plan approved with the OpenAPI contract, server-owned validation, idempotency, and delivery sequence."
			: "Designing the checkout contract, validation rules, idempotency behavior, and implementation sequence…",
	});
	const copilot = createSession(GITHUB_COPILOT, copilotStatus, 1, {
		title: "Implement guest checkout end to end",
		command: "Implement the checkout service and storefront flow after Code Planner confirms the request, response, and validation-error contract.",
		previewText: copilotStatus === "waiting"
			? "Waiting for Code Planner to publish the checkout API contract."
			: copilotStatus === "completed"
				? "Guest checkout is ready on feature/shop-4821-guest-checkout and PR #1847 is open."
				: "Implementing the guest order service and storefront checkout against the approved contract…",
		waitingOn: copilotStatus === "waiting"
			? {
				kind: "agent",
				agentId: CODE_PLANNER.id ?? "code-planner",
				agentName: CODE_PLANNER.name,
				agentAvatarSrc: CODE_PLANNER.avatarSrc,
			}
			: undefined,
		threadReplies: chapter === "handoff" || chapter === "review" || chapter === "done"
			? [{
				id: "story-planner-to-copilot",
				agentId: CODE_PLANNER.id ?? "code-planner",
				agentName: CODE_PLANNER.name,
				agentAvatarSrc: CODE_PLANNER.avatarSrc,
				content: "The guest checkout technical plan is approved. I attached the OpenAPI contract and validation rules, including idempotency, pricing, inventory, and payment errors. You can start the full-stack implementation.",
				createdAtMs: STORY_EPOCH_MS - 1_740_000,
			}]
			: undefined,
	});
	const test = createSession(UNIT_TEST_CREATOR, testStatus, 2, {
		title: "Verify guest checkout acceptance coverage",
		command: "Build checkout acceptance tests from the story criteria, then verify GitHub Copilot's integrated branch when it is ready.",
		previewText: testStatus === "waiting"
			? "Acceptance suite is ready. Waiting for GitHub Copilot to share the integrated branch."
			: testStatus === "completed"
				? "Acceptance matrix passed: 18 checks cover guest purchase, validation, payment, confirmation, and account creation."
				: chapter === "review"
					? "Running the guest checkout acceptance matrix against PR #1847…"
					: "Building deterministic cases for valid orders, validation failures, inventory changes, declined payments, and duplicate submissions…",
		waitingOn: testStatus === "waiting"
			? {
				kind: "agent",
				agentId: GITHUB_COPILOT.id ?? "github-copilot",
				agentName: GITHUB_COPILOT.name,
				agentAvatarSrc: GITHUB_COPILOT.avatarSrc,
			}
			: undefined,
		threadReplies: chapter === "review" || chapter === "done"
			? [{
				id: "story-copilot-to-tests",
				agentId: GITHUB_COPILOT.id ?? "github-copilot",
				agentName: GITHUB_COPILOT.name,
				agentAvatarSrc: GITHUB_COPILOT.avatarSrc,
				content: "The integrated guest checkout is on feature/shop-4821-guest-checkout. Please run the acceptance matrix against PR #1847.",
				createdAtMs: STORY_EPOCH_MS - 900_000,
			}]
			: undefined,
	});

	return [planner, copilot, test];
}

function activeAgentIds(sessions: readonly AgentSession[]): string[] {
	return sessions
		.filter((session) => session.status !== "completed")
		.map((session) => session.agentId);
}

function createStoryComments(
	chapter: JiraAgentsStoryChapter,
	sessions: readonly AgentSession[],
): AgentSessionComment[] {
	const actorIds = activeAgentIds(sessions).map(getAgentActivityActorId);
	return [
		{
			id: "story-channel-brief",
			authorName: "Jordan Lee",
			authorAvatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			content: "Checkout-funnel research identifies mandatory registration as the largest avoidable drop-off for first-time shoppers. During rollout, track guest completion, payment failures, duplicate orders, and checkout-related support contacts.",
			createdAtMs: STORY_EPOCH_MS - 3_240_000,
			threadReplies: [{
				id: "story-channel-brief-maya-reply",
				authorName: "Maya Chen",
				authorAvatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
				content: "Agreed. If the email already belongs to an account, let the shopper finish as a guest and offer sign-in or account linking only after the order is confirmed. That keeps this release focused and avoids pulling account recovery into checkout.",
				createdAtMs: STORY_EPOCH_MS - 240_000,
			}],
		},
		...(chapter === "brief" ? [] : [{
			id: "story-channel-orchestration",
			authorName: "You",
			content: "@Code Planner lead the technical plan and API contract, @GitHub Copilot implement guest checkout end to end, and @Unit Test Creator build the acceptance proof. Share contracts and handoffs in this work item so everyone has the same context.",
			createdAtMs: STORY_EPOCH_MS - 2_940_000,
			...(actorIds.length > 0
				? { reactions: [{ emoji: "👀", actorIds }] }
				: {}),
		} satisfies AgentSessionComment]),
	];
}

function storyEventsForChapter(chapter: JiraAgentsStoryChapter): readonly StaticTimelineEvent[] {
	switch (chapter) {
		case "brief":
			return BRIEF_EVENTS;
		case "plan":
			return PLAN_EVENTS;
		case "working":
			return WORKING_EVENTS;
		case "handoff":
			return [...WORKING_EVENTS, HANDOFF_EVENT];
		case "review":
			return REVIEW_EVENTS;
		case "done":
			return DONE_EVENTS;
	}
}

export function getJiraAgentsStoryStatus(chapter: JiraAgentsStoryChapter): JiraForYouStatus {
	return STORY_STATUS_BY_CHAPTER[chapter];
}

export function getJiraAgentsStoryChapterForStatus(status: string): JiraAgentsStoryChapter | null {
	switch (status) {
		case "To do":
			return "brief";
		case "In progress":
			return "working";
		case "Review":
		case "In review":
			return "review";
		case "Done":
			return "done";
		default:
			return null;
	}
}

export function createJiraAgentsStoryWorkItem(chapter: JiraAgentsStoryChapter): WorkItemData {
	return {
		...JIRA_AGENTS_STORY_WORK_ITEM_BASE,
		status: WORK_ITEM_STATUS_BY_CHAPTER[chapter],
	};
}

export function createJiraAgentsStoryState(chapter: JiraAgentsStoryChapter): JiraWorkItemState {
	const workItem = createJiraAgentsStoryWorkItem(chapter);
	const sessions = createStorySessions(chapter);
	const preset: JiraWorkItemPreset = sessions.length > 0 ? "running" : "filled";
	const base = hydratePreset(preset, workItem);

	return {
		...base,
		preset,
		contextResources: {
			title: workItem.title,
			description: workItem.description ?? "",
			tldr: [
				"Shoppers can complete a purchase without creating an account or signing in.",
				"The server owns pricing, inventory, payment-token validation, and idempotent order creation.",
				"Acceptance requires accessible delivery and payment forms, recoverable errors, one order per submission, confirmation, optional post-purchase registration, and a feature-flag rollout.",
			],
			nextSteps: [
				{ id: "story-next-plan", label: "Plan the checkout architecture", command: "Define secure guest order creation and publish the OpenAPI contract." },
				{ id: "story-next-implement", label: "Implement guest checkout", command: "Build the checkout service and storefront delivery, payment, and confirmation flows." },
				{ id: "story-next-verify", label: "Run acceptance coverage", command: "Verify successful checkout, validation failures, payment errors, and duplicate submissions." },
			],
			attachments: [
				{
					id: "story-attachment-product-brief",
					name: "guest-checkout-product-brief",
					displayName: "Guest checkout product brief",
					ext: "pdf",
					date: "5 Aug 2026, 11:04 AM",
					thumbnailKind: "document",
					sourceLabel: "Product brief",
				},
				{
					id: "story-attachment-wireframes",
					name: "guest-checkout-wireframes",
					displayName: "Guest checkout wireframes",
					ext: "fig",
					date: "5 Aug 2026, 11:12 AM",
					thumbnailKind: "file",
					sourceLabel: "Design spec",
				},
			],
			subtasks: [
				{
					type: "Task",
					key: "SHOP-4824",
					summary: "Define guest checkout requirements and success metrics",
					description: "Turn the checkout-abandonment research into a scoped requirement set: which steps a guest must complete, which validation errors are recoverable, and the conversion and error-rate targets the delivered flow has to hit.",
					priority: "medium",
					assignee: "Anthony Chen",
					assigneeAvatarUrl: "/avatar-human/anthony-chen.png",
					status: "done",
				},
				{
					type: "Task",
					key: "SHOP-4822",
					summary: "Build guest checkout and order-creation API",
					description: "Create a guest checkout API that recalculates inventory, pricing, discounts, tax, and shipping before payment. Use tokenized payments and an idempotency key so retries cannot create duplicate orders, and return recoverable validation errors without requiring an account.",
					priority: "high",
					assignee: "Priya Hansra",
					assigneeAvatarUrl: "/avatar-human/priya-hansra.png",
					status: chapter === "handoff" || chapter === "review" || chapter === "done" ? "done" : "inprogress",
				},
				{
					type: "Story",
					key: "SHOP-4823",
					summary: "Build and integrate the storefront checkout flow",
					description: "Add a responsive Continue as guest path from cart and sign-in through delivery, shipping, payment, and confirmation. Preserve safe shopper input after recoverable errors, meet keyboard and screen-reader requirements, and offer account creation only after the order succeeds.",
					priority: "high",
					assignee: "Veronica Rodriguez",
					assigneeAvatarUrl: "/avatar-human/veronica-rodriguez.png",
					status: chapter === "done" ? "done" : chapter === "handoff" || chapter === "review" ? "inprogress" : "todo",
				},
			],
			linkedItems: [
				{
					id: "story-link-research",
					key: "SHOP-4760",
					summary: "Research checkout abandonment and guest conversion",
					description: "Combine checkout-funnel analytics, session replays, and support themes to identify why first-time shoppers leave before payment. The completed research recommends removing mandatory registration while keeping pricing, inventory, payment, and order validation server-authoritative.",
					type: "Task",
					relationship: "relates to",
					assignee: "Anthony Chen",
					assigneeAvatarUrl: "/avatar-human/anthony-chen.png",
					priority: "medium",
					status: "done",
				},
			],
		},
		metadata: {
			...base.metadata,
			status: WORK_ITEM_STATUS_BY_CHAPTER[chapter],
			atlassianProject: "storefront-platform",
			parent: JIRA_AGENTS_STORY_WORK_ITEM_BASE.parent?.code ?? null,
			crew: sessions.map((session) => ({
				id: session.agentId,
				kind: "agent" as const,
				name: session.agentName,
				avatarUrl: session.agentAvatarSrc,
			})),
		},
		comments: createStoryComments(chapter, sessions),
		sessions,
		staticEvents: [...storyEventsForChapter(chapter)],
		activeSessionId: null,
		composerPrefill: null,
		elapsedMs: STORY_EPOCH_MS - SESSION_EPOCH_MS,
		nextOrder: sessions.length,
		nextIdCounter: 100,
	};
}

function activeAgentsForChapter(chapter: JiraAgentsStoryChapter): readonly JiraForYouAgent[] {
	const state = createJiraAgentsStoryState(chapter);
	return state.sessions
		.filter((session) => session.status !== "completed")
		.flatMap((session) => {
			const agent = STORY_AGENT_BY_ID.get(session.agentId);
			return agent ? [agent] : [];
		});
}

export function createJiraAgentsStoryItem(chapter: JiraAgentsStoryChapter): JiraForYouItem {
	const agents = activeAgentsForChapter(chapter);
	return {
		id: JIRA_AGENTS_STORY_ITEM_ID,
		title: JIRA_AGENTS_STORY_WORK_ITEM_BASE.title,
		issueType: "story",
		issueKey: JIRA_AGENTS_STORY_ISSUE_KEY,
		spaceName: "Storefront Platform",
		jiraStatus: STORY_STATUS_BY_CHAPTER[chapter],
		tabs: ["assigned", "worked-on", "viewed"],
		...(agents.length > 0 ? { agents } : {}),
		...(agents.length > 0
			? { status: `${agents.length} agent${agents.length === 1 ? "" : "s"} working` }
			: {}),
	};
}

export function createJiraAgentsWorkspaceSections(
	chapter: JiraAgentsStoryChapter,
): readonly JiraForYouSection[] {
	const storyItem = createJiraAgentsStoryItem(chapter);
	const targetStatus = STORY_STATUS_BY_CHAPTER[chapter];
	const cleanSections = JIRA_FOR_YOU_SECTIONS.map((section) => ({
		...section,
		items: section.items.filter((item) => item.issueKey !== JIRA_AGENTS_STORY_ISSUE_KEY),
	}));
	const targetIndex = cleanSections.findIndex((section) => section.label === targetStatus);

	if (targetIndex >= 0) {
		return cleanSections.map((section, index) => index === targetIndex
			? { ...section, items: [storyItem, ...section.items] }
			: section);
	}

	const doneIndex = cleanSections.findIndex((section) => section.label === "Done");
	const insertionIndex = doneIndex >= 0 ? doneIndex : cleanSections.length;
	return [
		...cleanSections.slice(0, insertionIndex),
		{
			id: `jira-agents-${targetStatus.toLocaleLowerCase().replaceAll(" ", "-")}`,
			label: targetStatus,
			collapsible: true,
			items: [storyItem],
		},
		...cleanSections.slice(insertionIndex),
	];
}

function createBoardActivity(session: AgentSession) {
	const waitingAgent = session.waitingOn?.kind === "agent" ? session.waitingOn.agentName : null;
	return {
		id: `${JIRA_AGENTS_STORY_ISSUE_KEY}:${session.agentId}`,
		name: session.agentName,
		avatarSrc: session.agentAvatarSrc,
		label: waitingAgent ? `Waiting for ${waitingAgent}` : session.previewText,
		labels: session.steps.map((step) => step.label),
		message: session.previewText,
		state: session.status === "waiting" ? "awaiting-input" as const : "working" as const,
	};
}

function createJiraAgentsStoryCard(chapter: JiraAgentsStoryChapter): JiraKanbanCardData {
	const state = createJiraAgentsStoryState(chapter);
	const activeSessions = state.sessions.filter((session) => session.status !== "completed");
	return {
		title: JIRA_AGENTS_STORY_WORK_ITEM_BASE.title,
		code: JIRA_AGENTS_STORY_ISSUE_KEY,
		priority: "major",
		assignee: {
			id: "jordan-lee",
			name: "Jordan Lee",
			avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		},
		avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		tags: [
			{ text: "Storefront", color: "blue" },
			{ text: "Feature", color: "purple" },
		],
		...(activeSessions.length > 0
			? { agentActivities: activeSessions.map(createBoardActivity) }
			: {}),
		...(chapter === "review" || chapter === "done"
			? {
				pullRequestNumber: 1847,
				pullRequestStatus: chapter === "done" ? "merged" as const : "open" as const,
			}
			: {}),
	};
}

export function createJiraAgentsBoardColumns(
	chapter: JiraAgentsStoryChapter,
	columns: readonly JiraKanbanColumnData[] = JIRA_DESIGN_KANBAN_COLUMNS,
): JiraKanbanColumnData[] {
	const status = STORY_STATUS_BY_CHAPTER[chapter];
	const storyCard = createJiraAgentsStoryCard(chapter);
	return columns.map((column) => {
		const cards = column.cards.filter((card) => card.code !== JIRA_AGENTS_STORY_ISSUE_KEY);
		const nextCards = column.title === status ? [storyCard, ...cards] : cards;
		return { ...column, cards: nextCards, count: nextCards.length };
	});
}

export function getJiraAgentsStoryColumn(
	columns: readonly JiraKanbanColumnData[],
): string | null {
	return columns.find((column) => column.cards.some(
		(card) => card.code === JIRA_AGENTS_STORY_ISSUE_KEY,
	))?.title ?? null;
}

export const JIRA_AGENTS_STORY_BOARD_AGENTS: readonly JiraKanbanAgentData[] = [
	...JIRA_DESIGN_KANBAN_AGENTS,
	{
		id: CODE_PLANNER.id ?? "code-planner",
		name: CODE_PLANNER.name,
		byline: "Checkout architecture and API planning agent",
		avatarSrc: CODE_PLANNER.avatarSrc,
	},
	{
		id: GITHUB_COPILOT.id ?? "github-copilot",
		name: GITHUB_COPILOT.name,
		byline: "Full-stack checkout implementation agent",
		avatarSrc: GITHUB_COPILOT.avatarSrc,
	},
	{
		id: UNIT_TEST_CREATOR.id ?? "unit-test-creator",
		name: UNIT_TEST_CREATOR.name,
		byline: "Guest checkout verification engineer",
		avatarSrc: UNIT_TEST_CREATOR.avatarSrc,
	},
];
