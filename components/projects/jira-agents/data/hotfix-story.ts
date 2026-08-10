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
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
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
	| "fixing"
	| "review"
	| "done";

export const JIRA_AGENTS_STORY_CHAPTERS = [
	{ label: "Brief", value: "brief" },
	{ label: "Plan", value: "plan" },
	{ label: "Working", value: "working" },
	{ label: "Handoff", value: "handoff" },
	{ label: "Fixing", value: "fixing" },
	{ label: "Review", value: "review" },
	{ label: "Done", value: "done" },
] as const satisfies readonly { label: string; value: JiraAgentsStoryChapter }[];

export const JIRA_AGENTS_STORY_ITEM_ID = "shop-4821-guest-checkout";
export const JIRA_AGENTS_STORY_ISSUE_KEY = "SHOP-4821";

const STORY_EPOCH_MS = Date.UTC(2026, 7, 5, 2, 0, 0);
/** Matches the `story-created` timeline event — one hour before the story clock. */
const STORY_CREATED_AT_MS = STORY_EPOCH_MS - 3_600_000;

const STORY_STATUS_BY_CHAPTER = {
	brief: "To do",
	plan: "In progress",
	working: "In progress",
	handoff: "In progress",
	fixing: "In progress",
	review: "In review",
	done: "Done",
} as const satisfies Record<JiraAgentsStoryChapter, JiraForYouStatus>;

const WORK_ITEM_STATUS_BY_CHAPTER = {
	brief: "To do",
	plan: "In progress",
	working: "In progress",
	handoff: "In progress",
	fixing: "In progress",
	review: "In review",
	done: "Done",
} as const satisfies Record<JiraAgentsStoryChapter, string>;

/** Status pill options for the guest-checkout work item (board workflow order). */
export const JIRA_AGENTS_STATUS_PHASES = [
	"To do",
	"In progress",
	"In review",
	"Done",
] as const satisfies readonly string[];

type JiraAgentsStoryAgent = JiraForYouAgent & { brandName?: ThirdPartyLogoName };

const CODE_PLANNER = {
	id: "code-planner",
	name: "Code Planner",
	avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
} satisfies JiraAgentsStoryAgent;

const CLAUDE_CODE = {
	id: "claude-code",
	name: "Claude Code",
	avatarSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
	brandName: "claude",
} satisfies JiraAgentsStoryAgent;

const STORY_AGENTS = [CODE_PLANNER, CLAUDE_CODE] as const;
const STORY_AGENT_BY_ID = new Map(STORY_AGENTS.map((agent) => [agent.id, agent]));

export const JIRA_AGENTS_STORY_COMPOSER_AGENTS: readonly AgentSelectorAgent[] = [
	{
		id: CLAUDE_CODE.id,
		name: CLAUDE_CODE.name,
		byline: "Coding agent by Anthropic",
		brandName: "claude",
	},
	{
		id: CODE_PLANNER.id,
		name: CODE_PLANNER.name,
		byline: "Designs the checkout architecture, API contract, and delivery plan",
		avatarSrc: CODE_PLANNER.avatarSrc,
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
	createdAtMs: STORY_CREATED_AT_MS,
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
		"#### Guest checkout flow",
		"```mermaid",
		"flowchart TD",
		'\tcart["Cart / sign-in"] --> guest{"Continue as guest?"}',
		'\tguest -->|yes| details["Email, address, shipping"]',
		'\tguest -->|no| account["Sign in or create account"]',
		'\tdetails --> payment["Tokenized payment"]',
		'\tpayment --> validate{"Server validation"}',
		'\tvalidate -->|ok| order["Create order"]',
		'\tvalidate -->|recoverable error| details',
		'\torder --> confirm["Confirmation"]',
		"```",
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

const CLAUDE_CODE_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-claude-code",
	name: CLAUDE_CODE.name,
	kind: "agent",
	brandName: CLAUDE_CODE.brandName,
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
	agent: JiraAgentsStoryAgent;
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
			...(agent.brandName ? { brandName: agent.brandName } : { avatarSrc: agent.avatarSrc }),
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
		createdAtMs: STORY_CREATED_AT_MS,
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
		actor: CLAUDE_CODE_ACTOR,
		icon: "delegated",
		showActor: false,
		showTimestamp: false,
		segments: [
			{ type: "agent-mention", text: CLAUDE_CODE.name, brandName: CLAUDE_CODE.brandName },
			{ type: "agent-mention", text: CODE_PLANNER.name, avatarSrc: CODE_PLANNER.avatarSrc },
			{ type: "text", text: " Started working" },
		],
		createdAtMs: STORY_EPOCH_MS - 2_880_000,
	},
];

const WORKING_EVENTS: readonly StaticTimelineEvent[] = PLAN_EVENTS;

const HANDOFF_EVENT: StaticTimelineEvent = {
	id: "story-changed-files",
	kind: "changed-files",
	actor: CLAUDE_CODE_ACTOR,
	summary: "Changed 12 files",
	description: "Implemented the guest order service plus the storefront delivery, payment, validation, confirmation, and post-purchase account flows against Code Planner's contract.",
	branch: "feature/shop-4821-guest-checkout",
	tag: { text: "Implementation complete", color: "green" },
	sessionItem: createStoryArtifactSession({
		id: "story-claude-checkout",
		title: "Implemented guest checkout end to end",
		state: "complete",
		agent: CLAUDE_CODE,
		branch: "feature/shop-4821-guest-checkout",
		elapsedSeconds: 482,
	}),
	outputs: [
		{
			id: "guest-checkout-implementation",
			title: "Guest checkout implementation",
			source: "Agent output",
			owner: CLAUDE_CODE.name,
			iconName: "ai-chat",
		},
	],
	createdAtMs: STORY_EPOCH_MS - 1_320_000,
};

const FAILED_PR_CHECKS = [
	{
		id: "lint-types",
		name: "Lint and typecheck",
		status: "failed",
		details: "Failed after 42s · deliveryAddress may be null",
		url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471001",
	},
	{
		id: "unit-tests",
		name: "Unit tests",
		status: "passed",
		details: "418 tests in 2m 46s",
		url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002",
	},
	{
		id: "browser-tests",
		name: "Guest checkout browser tests",
		status: "passed",
		details: "5 scenarios in 1m 32s",
		url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003",
	},
] as const;

const PASSED_PR_CHECKS = [
	{
		id: "lint-types",
		name: "Lint and typecheck",
		status: "passed",
		details: "Completed in 1m 18s",
		url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471001",
	},
	{
		id: "unit-tests",
		name: "Unit tests",
		status: "passed",
		details: "418 tests in 2m 46s",
		url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002",
	},
	{
		id: "browser-tests",
		name: "Guest checkout browser tests",
		status: "passed",
		details: "5 scenarios in 1m 32s",
		url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003",
	},
] as const;

const FAILED_CI_EVENT: StaticTimelineEvent = {
	id: "story-ci-failed",
	kind: "event",
	actor: GITHUB_ACTOR,
	icon: "linked",
	segments: [
		{ type: "text", text: "blocked PR #1847 after " },
		{ type: "code", text: "lint-and-typecheck" },
		{ type: "text", text: " reported " },
		{ type: "lozenge", text: "1 failed", variant: "danger" },
	],
	createdAtMs: STORY_EPOCH_MS - 1_140_000,
};

const FIXING_PR_EVENT: StaticTimelineEvent = {
	id: "story-pr-fixing",
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
		repository: "eevensoh/vpk-rovo",
		branch: "feature/guest-checkout",
		targetBranch: "main",
		url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
		authorName: "Venn",
		createdAtMs: STORY_EPOCH_MS - 1_200_000,
		updatedAtMs: STORY_EPOCH_MS - 1_140_000,
		reviewDecision: "review-required",
		mergeState: "blocked",
		checks: FAILED_PR_CHECKS,
	},
	createdAtMs: STORY_EPOCH_MS - 1_200_000,
};

const FIXING_EVENTS: readonly StaticTimelineEvent[] = [
	...WORKING_EVENTS,
	HANDOFF_EVENT,
	FIXING_PR_EVENT,
	FAILED_CI_EVENT,
];

const REVIEW_EVENTS: readonly StaticTimelineEvent[] = [
	...WORKING_EVENTS,
	HANDOFF_EVENT,
	FAILED_CI_EVENT,
	{
		id: "story-regression-matrix",
		kind: "changed-files",
		actor: CLAUDE_CODE_ACTOR,
		summary: "Acceptance matrix passed",
		description: "Verified guest purchase, validation errors, inventory changes, declined payments, duplicate submissions, confirmation, and optional post-purchase account creation.",
		branch: "#1847",
		tag: { text: "18 checks passing", color: "green" },
		sessionItem: createStoryArtifactSession({
			id: "story-test-report",
			title: "Acceptance matrix passed",
			state: "complete",
			agent: CLAUDE_CODE,
			branch: "#1847",
			elapsedSeconds: 438,
		}),
		outputs: [
			{
				id: "acceptance-report",
				title: "SHOP-4821 acceptance report",
				source: "Test artifact",
				owner: CLAUDE_CODE.name,
				iconName: "page",
			},
		],
		createdAtMs: STORY_EPOCH_MS - 1_020_000,
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
			repository: "eevensoh/vpk-rovo",
			branch: "feature/guest-checkout",
			targetBranch: "main",
			url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
			// Viewer is Venn (`JIRA_WORK_ITEM_CURRENT_USER`); "By me" sorts on authorName.
			authorName: "Venn",
			createdAtMs: STORY_EPOCH_MS - 1_200_000,
			updatedAtMs: STORY_EPOCH_MS - 900_000,
			reviewDecision: "approved",
			mergeState: "ready",
			checks: PASSED_PR_CHECKS,
		},
		createdAtMs: STORY_EPOCH_MS - 900_000,
	},
	statusEvent("story-moved-review", "In progress", "In review", STORY_EPOCH_MS - 840_000),
];

const DONE_EVENTS: readonly StaticTimelineEvent[] = [
	...REVIEW_EVENTS,
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
			repository: "eevensoh/vpk-rovo",
			branch: "feature/guest-checkout",
			targetBranch: "main",
			url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
			authorName: "Venn",
			createdAtMs: STORY_EPOCH_MS - 1_200_000,
			updatedAtMs: STORY_EPOCH_MS - 480_000,
		},
		createdAtMs: STORY_EPOCH_MS - 480_000,
	},
	statusEvent("story-moved-done", "In review", "Done", STORY_EPOCH_MS - 240_000),
];

function createSession(
	agent: JiraAgentsStoryAgent,
	status: AgentSessionStatus,
	order: number,
	options: {
		command: string;
		commandAuthorName?: string;
		imageAttachment?: AgentSession["imageAttachment"];
		previewText: string;
		progressChecklist?: AgentSession["progressChecklist"];
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
		agentBrandName: agent.brandName,
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
				authorName: options.commandAuthorName ?? "Venn",
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
		...(options.progressChecklist ? { progressChecklist: options.progressChecklist } : {}),
		...(options.imageAttachment ? { imageAttachment: options.imageAttachment } : {}),
		...(options.waitingOn ? { waitingOn: options.waitingOn } : {}),
		...(options.threadReplies ? { threadReplies: options.threadReplies } : {}),
	};
}

function createStorySessions(chapter: JiraAgentsStoryChapter): AgentSession[] {
	if (chapter === "brief") return [];

	const plannerStatus: AgentSessionStatus = chapter === "plan" ? "running" : "completed";
	const claudeStatus: AgentSessionStatus = chapter === "done" ? "completed" : "running";
	const completedChecklistItems = {
		plan: 0,
		working: 1,
		handoff: 3,
		fixing: 3,
		review: 4,
		done: 5,
	} as const satisfies Record<Exclude<JiraAgentsStoryChapter, "brief">, number>;
	const checklistLabels = [
		"Consult Code Planner on the secure API and validation contract",
		"Implement guest checkout end to end",
		"Verify the final design and attach a screenshot",
		"Open the pull request and fix its CI checks",
		"Summarize the approved outcome",
	] as const;
	const progressChecklist = checklistLabels.map((label, index) => ({
		id: `story-claude-progress-${index + 1}`,
		label,
		completed: index < completedChecklistItems[chapter],
	}));

	const claude = createSession(CLAUDE_CODE, claudeStatus, 0, {
		title: "Lead guest checkout implementation",
		command: "Take the lead on implementing guest checkout. Consult Code Planner on the secure API and validation contract first, then implement and verify the work.",
		previewText: chapter === "plan"
			? "I'm taking the lead on SHOP-4821. Code Planner, review this work item and define the secure API contract, server-owned validation rules, idempotency behavior, and recoverable error handling before I implement it."
			: chapter === "working"
				? "Code Planner's contract is ready. I'm implementing the guest order service and storefront flow with server-owned pricing, inventory, payment validation, and idempotent order creation."
				: chapter === "handoff"
					? "Guest checkout is implemented. I've verified the final desktop and mobile flow and attached the final guest checkout design screenshot."
					: chapter === "fixing"
						? "PR #1847 is open, but it cannot be merged yet. The lint-and-typecheck job found a nullable delivery-address path, so I'm fixing that failure and rerunning all three CI checks before review."
						: chapter === "review"
							? "The CI failure is fixed. All three pipeline checks and all 18 acceptance checks pass, so PR #1847 is ready for review with the evidence attached."
							: "Guest checkout is implemented and verified. Shoppers can continue as guests, recoverable failures preserve safe input, and the server owns pricing, inventory, payment validation, and idempotent order creation. PR #1847 is merged with all 18 acceptance checks passing; the final design screenshot is attached.",
		progressChecklist,
		imageAttachment: chapter === "handoff" || chapter === "fixing" || chapter === "review" || chapter === "done"
			? {
				src: "/illustration/jira-agents/guest-checkout-final.png",
				alt: "Final guest checkout design",
				filename: "guest-checkout-final.png",
			}
			: undefined,
	});
	const planner = createSession(CODE_PLANNER, plannerStatus, 1, {
		title: "Consult on the guest checkout contract",
		commandAuthorName: CLAUDE_CODE.name,
		command: "Review SHOP-4821 and define the secure request and response contract, server-owned validation rules, idempotency behavior, and recoverable error handling I should implement.",
		previewText: plannerStatus === "completed"
			? "Consultation complete. Use a server-owned guest-order endpoint that recalculates pricing, discounts, tax, shipping, and inventory. Require an idempotency key and return field-safe errors for address, inventory, and payment failures. The OpenAPI contract and validation matrix are ready."
			: "Reviewing the checkout requirements and preparing the API contract, validation matrix, and idempotency rules for Claude Code.",
	});

	return [claude, planner];
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
	const showAcknowledgementReactions = chapter === "plan";
	const actorIds = showAcknowledgementReactions
		? activeAgentIds(sessions).map(getAgentActivityActorId)
		: [];
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
			authorName: "Venn",
			content: "@Claude Code take the lead on implementing guest checkout. Consult @Code Planner on the secure API and validation contract first, then implement and verify the work.",
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
		case "fixing":
			return FIXING_EVENTS;
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
					status: chapter === "handoff" || chapter === "fixing" || chapter === "review" || chapter === "done" ? "done" : "inprogress",
				},
				{
					type: "Story",
					key: "SHOP-4823",
					summary: "Build and integrate the storefront checkout flow",
					description: "Add a responsive Continue as guest path from cart and sign-in through delivery, shipping, payment, and confirmation. Preserve safe shopper input after recoverable errors, meet keyboard and screen-reader requirements, and offer account creation only after the order succeeds.",
					priority: "high",
					assignee: "Veronica Rodriguez",
					assigneeAvatarUrl: "/avatar-human/veronica-rodriguez.png",
					status: chapter === "done" ? "done" : chapter === "handoff" || chapter === "fixing" || chapter === "review" ? "inprogress" : "todo",
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
				...(session.agentBrandName ? { brandName: session.agentBrandName } : {}),
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
		agentBrandName: session.agentBrandName,
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
		...(chapter === "fixing" || chapter === "review" || chapter === "done"
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
		id: CLAUDE_CODE.id ?? "claude-code",
		name: CLAUDE_CODE.name,
		byline: "Coding agent by Anthropic",
		brandName: "claude",
	},
	{
		id: CODE_PLANNER.id ?? "code-planner",
		name: CODE_PLANNER.name,
		byline: "Checkout architecture and API planning agent",
		avatarSrc: CODE_PLANNER.avatarSrc,
	},
];
