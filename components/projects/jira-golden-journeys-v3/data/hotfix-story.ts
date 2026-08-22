import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type {
	AgentSession,
	AgentSessionComment,
	AgentSessionStatus,
	JiraWorkItemState,
} from "@/components/blocks/jira-work-item/data/session-state";
import { hydratePreset } from "@/components/blocks/jira-work-item/data/session-state";
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
} from "@/components/projects/jira-golden-journeys-v1/data/jira-design-work-items";
import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";

import { storyEventsForChapter } from "./hotfix-story-events";
import { createJiraGoldenJourneysV3StoryContextResources, RAW_STORY_DESCRIPTION } from "./story-context";
import {
	CLAUDE_CODE,
	CLAUDE_SESSION_TITLE_BY_CHAPTER,
	JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SCRIPT_ID,
	JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_ITEM_ID,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE,
	STORY_AGENT_BY_ID,
	STORY_EPOCH_MS,
	STORY_STATUS_BY_CHAPTER,
	WORK_ITEM_STATUS_BY_CHAPTER,
	type JiraGoldenJourneysV3StoryChapter,
	type JiraGoldenJourneysV3StoryStateOptions,
} from "./story-model";

export {
	JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SCRIPT_ID,
	JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY,
	JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_NUMBER,
	JIRA_GOLDEN_JOURNEYS_V3_REQUIRED_APPROVAL_COUNT,
	JIRA_GOLDEN_JOURNEYS_V3_REVIEWERS,
	JIRA_GOLDEN_JOURNEYS_V3_STATUS_PHASES,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_COMPOSER_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_ITEM_ID,
	JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE,
	createJiraGoldenJourneysV3ReviewerApprovals,
	evaluateJiraGoldenJourneysV3MergeGate,
	resolveJiraGoldenJourneysV3MergeStatus,
} from "./story-model";
export type {
	JiraGoldenJourneysV3ApprovalStep,
	JiraGoldenJourneysV3CiStatus,
	JiraGoldenJourneysV3FixStep,
	JiraGoldenJourneysV3MergeGate,
	JiraGoldenJourneysV3MergeStatus,
	JiraGoldenJourneysV3ReviewerApproval,
	JiraGoldenJourneysV3ReviewStep,
	JiraGoldenJourneysV3StoryChapter,
	JiraGoldenJourneysV3StoryStateOptions,
} from "./story-model";

const GUEST_CHECKOUT_PR_ARTIFACT: ArtifactListItem = {
	id: "guest-checkout-pr",
	title: "Implement guest checkout without account creation",
	source: "Pull request",
	logoName: "github",
	href: JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY,
	pullRequest: {
		number: 1847,
		status: "Open",
		additions: 86,
		deletions: 21,
	},
};

const CHECKLIST_LABELS = [
	"Implement SHOP-4821 in the local terminal",
	"Run focused local checks",
	"Open PR #1847 and request Priya and Jordan",
	"Monitor CI and diagnose the failed check",
	"Repair the failed path and rerun CI to green",
	"Satisfy two required approvals and merge automatically",
] as const;

function completedChecklistCount(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
): number {
	const fixStep = options.fixStep ?? "failed";
	const approvalStep = options.approvalStep ?? 0;
	switch (chapter) {
		case "terminal":
			return 3;
		case "build":
			return 3;
		case "review":
			return options.reviewStep === "failed" ? 4 : 3;
		case "fix":
			return fixStep === "complete" ? 5 : 4;
		case "approve":
			return options.ciStatus !== "passed" ? 4 : approvalStep === 2 ? 6 : 5;
		case "release":
			return options.pullRequestMerged ? 6 : 5;
	}
}

function claudeStatusForChapter(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
): AgentSessionStatus {
	if (chapter === "release" || (chapter === "approve" && (options.approvalStep ?? 0) === 2)) {
		return "completed";
	}
	if (chapter === "fix" && options.fixStep === "repairing") return "running";
	return chapter === "terminal" ? "completed" : "waiting";
}

function claudePreviewForChapter(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
): string {
	switch (chapter) {
		case "terminal":
			return "Guest checkout is implemented and local checks pass. I opened PR #1847 and requested reviews from Priya Narayanan and Jordan Lee.";
		case "build":
			return "PR #1847 is linked to SHOP-4821 and CI has started. I’ll monitor the checks and address any actionable failure.";
		case "review":
			return options.reviewStep === "failed"
				? "Auto-merge is blocked. Lint and typecheck found a nullable deliveryAddress path; unit and browser checks passed."
				: "CI is running on PR #1847. Lint and typecheck, unit tests, and the guest-checkout browser suite are reporting progress.";
		case "fix":
			switch (options.fixStep ?? "failed") {
				case "failed":
					return options.autoFixEnabled
						? "Auto-fix is enabled. I’m preparing to inspect and repair the failed lint and typecheck path."
						: "CI remains failed. Enable Auto-fix CI & address comments to let me repair the actionable check.";
				case "repairing":
					return "I inspected the failed check, narrowed deliveryAddress before order creation, and pushed 9f32a6d. Watching the rerun now.";
				case "complete":
					return "The CI rerun is green. PR #1847 now needs approvals from Priya Narayanan and Jordan Lee before it can merge.";
			}
		case "approve": {
			const approvalStep = options.approvalStep ?? 0;
			if (options.ciStatus !== "passed") {
				return "Required reviews are waiting. CI must be green before Priya Narayanan and Jordan Lee can approve PR #1847.";
			}
			return approvalStep === 0
				? "CI is green. PR #1847 is waiting for two required teammate approvals."
				: approvalStep === 1
					? "Priya Narayanan approved PR #1847. Jordan Lee’s approval is still required."
					: "Priya Narayanan and Jordan Lee approved PR #1847. All merge rules are satisfied.";
		}
		case "release":
			return options.pullRequestMerged
				? "PR #1847 merged automatically after CI passed and both required teammate approvals landed. SHOP-4821 is Done."
				: "PR #1847 has not merged. Release is showing the current rule state without changing it.";
	}
}

function createClaudeSession(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions,
): AgentSession {
	const status = claudeStatusForChapter(chapter, options);
	const previewText = claudePreviewForChapter(chapter, options);
	const completedCount = completedChecklistCount(chapter, options);
	const waitingOn = chapter === "build" || chapter === "review"
		? { kind: "agent" as const, agentId: "github-actions", agentName: "GitHub Actions" }
		: chapter === "approve" && (options.approvalStep ?? 0) < 2
			? { kind: "user" as const }
			: undefined;
	const startedAtMs = STORY_EPOCH_MS - 1_500_000;
	return {
		id: JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SESSION_ID,
		agentId: CLAUDE_CODE.id,
		agentName: CLAUDE_CODE.name,
		agentBrandName: CLAUDE_CODE.brandName,
		title: CLAUDE_SESSION_TITLE_BY_CHAPTER[chapter],
		status,
		command: "Implement SHOP-4821 locally, run checks, open a pull request, request Priya and Jordan, then monitor CI.",
		previewText,
		steps: CHECKLIST_LABELS.map((label, index) => ({
			id: `story-claude-step-${index + 1}`,
			label,
			status: index < completedCount
				? "complete" as const
				: status === "running" && index === completedCount
					? "active" as const
					: "pending" as const,
		})),
		progress: completedCount / CHECKLIST_LABELS.length,
		messages: [
			{
				id: "story-claude-terminal-prompt",
				role: "human",
				authorName: "Venn",
				content: "Implement SHOP-4821 locally, run checks, open a pull request, request Priya and Jordan, then monitor CI.",
				createdAtMs: startedAtMs,
			},
			{
				id: `story-claude-${chapter}-update`,
				role: "agent",
				authorName: CLAUDE_CODE.name,
				content: previewText,
				createdAtMs: STORY_EPOCH_MS - 30_000,
			},
		],
		startedAtMs,
		scriptId: JIRA_GOLDEN_JOURNEYS_V3_CLAUDE_SCRIPT_ID,
		scriptCursor: completedCount,
		stepElapsedMs: 0,
		resumedFromWait: false,
		order: 1,
		progressChecklist: CHECKLIST_LABELS.map((label, index) => ({
			id: `story-claude-progress-${index + 1}`,
			label,
			completed: index < completedCount,
		})),
		outputs: [{
			...GUEST_CHECKOUT_PR_ARTIFACT,
			pullRequest: {
				number: 1847,
				status: options.pullRequestMerged ? "Merged" : "Open",
				additions: 86,
				deletions: 21,
			},
		}],
		...(waitingOn ? { waitingOn } : {}),
	};
}

function createStoryComments(chapter: JiraGoldenJourneysV3StoryChapter): AgentSessionComment[] {
	if (chapter === "terminal") return [];
	return [{
		id: "story-channel-claude-pr-handoff",
		authorName: CLAUDE_CODE.name,
		authorBrandName: CLAUDE_CODE.brandName,
		content: "PR #1847 is open for SHOP-4821. Local checks pass, CI is running, and Priya Narayanan and Jordan Lee are requested reviewers.",
		createdAtMs: STORY_EPOCH_MS - 1_200_000,
	}];
}

export function getJiraGoldenJourneysV3StoryStatus(
	chapter: JiraGoldenJourneysV3StoryChapter,
): JiraForYouStatus {
	return STORY_STATUS_BY_CHAPTER[chapter];
}

export function getJiraGoldenJourneysV3StoryChapterForStatus(
	status: string,
): JiraGoldenJourneysV3StoryChapter | null {
	switch (status) {
		case "To do":
		case "In progress":
			return "build";
		case "Review":
		case "In review":
			return "review";
		case "Done":
			return "release";
		default:
			return null;
	}
}

export function createJiraGoldenJourneysV3StoryWorkItem(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions = {},
): WorkItemData {
	return {
		...JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE,
		description: RAW_STORY_DESCRIPTION,
		status: chapter === "release" && !options.pullRequestMerged
			? "In review"
			: WORK_ITEM_STATUS_BY_CHAPTER[chapter],
	};
}

export function createJiraGoldenJourneysV3StoryState(
	chapter: JiraGoldenJourneysV3StoryChapter,
	options: JiraGoldenJourneysV3StoryStateOptions = {},
): JiraWorkItemState {
	const workItem = createJiraGoldenJourneysV3StoryWorkItem(chapter, options);
	const sessions = chapter === "terminal" ? [] : [createClaudeSession(chapter, options)];
	const preset = sessions.length > 0 ? "running" as const : "filled" as const;
	const base = hydratePreset(preset, workItem);
	return {
		...base,
		preset,
		contextResources: createJiraGoldenJourneysV3StoryContextResources(chapter, workItem),
		metadata: {
			...base.metadata,
			status: workItem.status ?? WORK_ITEM_STATUS_BY_CHAPTER[chapter],
			atlassianProject: "storefront-platform",
			parent: JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE.parent?.code ?? null,
			crew: sessions.map((session) => ({
				id: session.agentId,
				kind: "agent" as const,
				name: session.agentName,
				...(session.agentAvatarSrc ? { avatarUrl: session.agentAvatarSrc } : {}),
				...(session.agentBrandName ? { brandName: session.agentBrandName } : {}),
			})),
		},
		comments: createStoryComments(chapter),
		sessions,
		staticEvents: [...storyEventsForChapter(chapter, options)],
		activeSessionId: sessions[0]?.id ?? null,
		composerPrefill: null,
		elapsedMs: STORY_EPOCH_MS - SESSION_EPOCH_MS,
		nextOrder: sessions.length,
		nextIdCounter: 100,
	};
}

function activeAgentsForChapter(chapter: JiraGoldenJourneysV3StoryChapter): readonly JiraForYouAgent[] {
	return createJiraGoldenJourneysV3StoryState(chapter).sessions
		.filter((session) => session.status !== "completed")
		.flatMap((session) => {
			const agent = STORY_AGENT_BY_ID.get(session.agentId);
			return agent ? [agent] : [];
		});
}

export function createJiraGoldenJourneysV3StoryItem(
	chapter: JiraGoldenJourneysV3StoryChapter,
): JiraForYouItem {
	const agents = activeAgentsForChapter(chapter);
	return {
		id: JIRA_GOLDEN_JOURNEYS_V3_STORY_ITEM_ID,
		title: JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE.title,
		issueType: "story",
		issueKey: JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY,
		spaceName: "Storefront Platform",
		jiraStatus: STORY_STATUS_BY_CHAPTER[chapter],
		tabs: ["assigned", "worked-on", "viewed"],
		...(agents.length > 0 ? { agents, status: "1 agent working" } : {}),
	};
}

export function createJiraGoldenJourneysV3WorkspaceSections(
	chapter: JiraGoldenJourneysV3StoryChapter,
): readonly JiraForYouSection[] {
	const storyItem = createJiraGoldenJourneysV3StoryItem(chapter);
	const targetStatus = STORY_STATUS_BY_CHAPTER[chapter];
	const cleanSections = JIRA_FOR_YOU_SECTIONS.map((section) => ({
		...section,
		items: section.items.filter((item) => item.issueKey !== JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY),
	}));
	const targetIndex = cleanSections.findIndex((section) => section.label === targetStatus);
	if (targetIndex < 0) return cleanSections;
	return cleanSections.map((section, index) => index === targetIndex
		? { ...section, items: [storyItem, ...section.items] }
		: section);
}

function createBoardActivity(session: AgentSession) {
	return {
		id: `${JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY}:${session.agentId}`,
		name: session.agentName,
		...(session.agentAvatarSrc ? { avatarSrc: session.agentAvatarSrc } : {}),
		...(session.agentBrandName ? { agentBrandName: session.agentBrandName } : {}),
		label: session.previewText,
		labels: session.steps.map((step) => step.label),
		message: session.previewText,
		state: session.status === "waiting" ? "awaiting-input" as const : "working" as const,
	};
}

function createJiraGoldenJourneysV3StoryCard(chapter: JiraGoldenJourneysV3StoryChapter): JiraKanbanCardData {
	const state = createJiraGoldenJourneysV3StoryState(chapter);
	const activeSessions = state.sessions.filter((session) => session.status !== "completed");
	return {
		title: JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE.title,
		code: JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY,
		priority: "major",
		assignee: {
			id: "venn",
			name: "Venn",
			avatarSrc: "/avatar-user/venn/venn.png",
		},
		avatarSrc: "/avatar-user/venn/venn.png",
		tags: [
			{ text: "Storefront", color: "blue" },
			{ text: "Feature", color: "purple" },
		],
		...(activeSessions.length > 0 ? { agentActivities: activeSessions.map(createBoardActivity) } : {}),
		...(chapter !== "terminal" ? {
			pullRequestNumber: 1847,
			pullRequestStatus: chapter === "release" ? "merged" as const : "open" as const,
		} : {}),
	};
}

export function createJiraGoldenJourneysV3BoardColumns(
	chapter: JiraGoldenJourneysV3StoryChapter,
	columns: readonly JiraKanbanColumnData[] = JIRA_DESIGN_KANBAN_COLUMNS,
): JiraKanbanColumnData[] {
	const status = STORY_STATUS_BY_CHAPTER[chapter];
	const storyCard = createJiraGoldenJourneysV3StoryCard(chapter);
	return columns.map((column) => {
		const cards = column.cards.filter((card) => card.code !== JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY);
		const nextCards = column.title === status ? [storyCard, ...cards] : cards;
		return { ...column, cards: nextCards, count: nextCards.length };
	});
}

export function getJiraGoldenJourneysV3StoryColumn(
	columns: readonly JiraKanbanColumnData[],
): string | null {
	return columns.find((column) => column.cards.some(
		(card) => card.code === JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY,
	))?.title ?? null;
}

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_BOARD_AGENTS: readonly JiraKanbanAgentData[] = [
	...JIRA_DESIGN_KANBAN_AGENTS,
	{
		id: CLAUDE_CODE.id,
		name: CLAUDE_CODE.name,
		byline: "Coding agent by Anthropic",
		brandName: "claude",
	},
];
