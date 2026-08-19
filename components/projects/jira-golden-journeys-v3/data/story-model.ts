import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { StaticTimelineEvent } from "@/components/blocks/jira-work-item/data/session-state";
import {
	DEFAULT_PULL_REQUEST_FIX_AGENT_ID,
	type PullRequestFixAgentId,
} from "@/components/blocks/pull-request-fix";
import type { JiraForYouAgent, JiraForYouStatus } from "@/components/projects/jira-for-you/jira-for-you-types";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { ROVO_LOGO_DATA_URI } from "@/components/ui/data/rovo-logo";
import { RAW_STORY_DESCRIPTION } from "./story-context";

export type JiraGoldenJourneysV3StoryChapter =
	| "intake"
	| "plan"
	| "build"
	| "review"
	| "fix"
	| "approve"
	| "release";

/**
 * Review CI reveal: start → widen → unit green → browser green → lint failure.
 * Reduced motion jumps straight to `failed`.
 */
export type JiraGoldenJourneysV3ReviewStep =
	| "queued"
	| "running"
	| "unit-passed"
	| "settling"
	| "failed";
/**
 * Fix continues from Review's failed PR: await PullRequestFix submit → repair → green.
 * Defaults to `failed` (same created-PR screen as Review end).
 */
export type JiraGoldenJourneysV3FixStep = "failed" | "repairing" | "complete";
/**
 * Staged Build reveal from Plan end:
 * ready (orient) → implement+PR → verify+screenshot → former Handoff end state.
 */
export type JiraGoldenJourneysV3BuildStep = "ready" | "implementing" | "verifying" | "complete";
export type JiraGoldenJourneysV3DescriptionSkillPhase =
	| "idle"
	| "running"
	| "awaiting-confirmation"
	| "applied"
	| "dismissed";

export interface JiraGoldenJourneysV3StoryStateOptions {
	descriptionSkillPhase?: JiraGoldenJourneysV3DescriptionSkillPhase;
	descriptionImproved?: boolean;
	pullRequestApproved?: boolean;
	reviewStep?: JiraGoldenJourneysV3ReviewStep;
	/** Fix-only progression after Review failure. Defaults to `failed`. */
	fixStep?: JiraGoldenJourneysV3FixStep;
	/**
	 * Coding agent selected in PullRequestFix (defaults to Codex). Drives the
	 * CI-repair session, activity actor, and lead waitingOn during Fix.
	 */
	fixAgentId?: PullRequestFixAgentId;
	/** Build-only staged progression. Defaults to `complete` (former Handoff end). */
	buildStep?: JiraGoldenJourneysV3BuildStep;
}

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS = [
	{ label: "Intake", value: "intake" },
	{ label: "Plan", value: "plan" },
	{ label: "Build", value: "build" },
	{ label: "Review", value: "review" },
	{ label: "Fix", value: "fix" },
	{ label: "Approve", value: "approve" },
	{ label: "Release", value: "release" },
] as const satisfies readonly { label: string; value: JiraGoldenJourneysV3StoryChapter }[];

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_ITEM_ID = "shop-4821-guest-checkout";
export const JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY = "SHOP-4821";
export const JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY = "https://github.com/eevensoh/vpk-rovo/pull/1847";

export const STORY_EPOCH_MS = Date.UTC(2026, 7, 5, 2, 0, 0);
/** Matches the `story-created` timeline event — one hour before the story clock. */
export const STORY_CREATED_AT_MS = STORY_EPOCH_MS - 3_600_000;

export const STORY_STATUS_BY_CHAPTER = {
	intake: "To do",
	plan: "In progress",
	build: "In progress",
	review: "In review",
	fix: "In progress",
	approve: "In review",
	release: "Done",
} as const satisfies Record<JiraGoldenJourneysV3StoryChapter, JiraForYouStatus>;

export const WORK_ITEM_STATUS_BY_CHAPTER = {
	intake: "To do",
	plan: "In progress",
	build: "In progress",
	review: "In review",
	fix: "In progress",
	approve: "In review",
	release: "Done",
} as const satisfies Record<JiraGoldenJourneysV3StoryChapter, string>;

export const CLAUDE_SESSION_TITLE_BY_CHAPTER = {
	plan: "Plan guest checkout with Code Planner",
	build: "Verify implementation and prepare the pull request",
	review: "Monitor automated CI review",
	fix: "Repair the failed CI path and rerun checks",
	approve: "Await Venn's guided human approval",
	release: "Release guest checkout to production",
} as const satisfies Record<Exclude<JiraGoldenJourneysV3StoryChapter, "intake">, string>;

/** Status pill options for the guest-checkout work item (board workflow order). */
export const JIRA_GOLDEN_JOURNEYS_V3_STATUS_PHASES = [
	"To do",
	"In progress",
	"In review",
	"Done",
] as const satisfies readonly string[];

/**
 * A story agent needs exactly one avatar source, not necessarily an SVG path:
 * third-party coding agents render from `brandName` via the shared logo set, so
 * they opt out of `JiraForYouAgent`'s required `avatarSrc` rather than carrying
 * a placeholder path. Agents that have both (Claude Code) keep both.
 */
export type JiraGoldenJourneysV3StoryAgent = Omit<JiraForYouAgent, "avatarSrc" | "id"> & {
	/** Required here, unlike the directory type: session and actor ids derive from it. */
	id: string;
} & (
		| { avatarSrc: string; brandName?: ThirdPartyLogoName }
		| { avatarSrc?: string; brandName: ThirdPartyLogoName }
	);

export const CODE_PLANNER = {
	id: "code-planner",
	name: "Code Planner",
	avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
} satisfies JiraGoldenJourneysV3StoryAgent;

export const CLAUDE_CODE = {
	id: "claude-code",
	name: "Claude Code",
	avatarSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
	brandName: "claude",
} satisfies JiraGoldenJourneysV3StoryAgent;

export const ROVO = {
	id: "skill:improve-description",
	name: "Rovo",
	avatarSrc: ROVO_LOGO_DATA_URI,
} satisfies JiraGoldenJourneysV3StoryAgent;

export const ROVO_DEV = {
	id: "rovo",
	name: "Rovo",
	avatarSrc: ROVO_LOGO_DATA_URI,
} satisfies JiraGoldenJourneysV3StoryAgent;

/** PullRequestFix picker agents mapped into story session / activity shapes. */
export const FIX_CODEX = {
	id: "codex",
	name: "Codex",
	brandName: "openai-codex",
} satisfies JiraGoldenJourneysV3StoryAgent;

export const FIX_CURSOR = {
	id: "cursor",
	name: "Cursor",
	brandName: "cursor",
} satisfies JiraGoldenJourneysV3StoryAgent;

export const FIX_GEMINI = {
	id: "gemini",
	name: "Gemini",
	brandName: "google-gemini",
} satisfies JiraGoldenJourneysV3StoryAgent;

export const FIX_GITHUB_COPILOT = {
	id: "github-copilot",
	name: "GitHub Copilot",
	brandName: "github-copilot",
} satisfies JiraGoldenJourneysV3StoryAgent;

export const FIX_ROVO_CLI = {
	id: "rovo-cli",
	name: "Rovo",
	avatarSrc: ROVO_LOGO_DATA_URI,
} satisfies JiraGoldenJourneysV3StoryAgent;

export const ROVO_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-rovo",
	name: ROVO_DEV.name,
	kind: "agent",
	avatarSrc: ROVO_DEV.avatarSrc,
};

export const JIRA_GOLDEN_JOURNEYS_V3_DESCRIPTION_SKILL_SESSION_ID = "story-session-skill:improve-description";
export const JIRA_GOLDEN_JOURNEYS_V3_DESCRIPTION_SKILL_SCRIPT_ID = "shop-4821-improve-description";
/** Distinct from the lead Claude session so Claude can also be the repair agent. */
export const JIRA_GOLDEN_JOURNEYS_V3_CI_REPAIR_SESSION_ID = "story-session-ci-repair";
export const JIRA_GOLDEN_JOURNEYS_V3_CI_REPAIR_SCRIPT_ID = "shop-4821-ci-fix";

export const DEFAULT_JIRA_GOLDEN_JOURNEYS_V3_FIX_AGENT_ID: PullRequestFixAgentId =
	DEFAULT_PULL_REQUEST_FIX_AGENT_ID;

const FIX_AGENTS_BY_ID: ReadonlyMap<PullRequestFixAgentId, JiraGoldenJourneysV3StoryAgent> = new Map<
	PullRequestFixAgentId,
	JiraGoldenJourneysV3StoryAgent
>([
	["claude-code", CLAUDE_CODE],
	["codex", FIX_CODEX],
	["cursor", FIX_CURSOR],
	["gemini", FIX_GEMINI],
	["github-copilot", FIX_GITHUB_COPILOT],
	["rovo-cli", FIX_ROVO_CLI],
]);

/** Resolve the PullRequestFix coding agent used for the CI-repair beat. */
export function resolveFixAgent(
	options: Pick<JiraGoldenJourneysV3StoryStateOptions, "fixAgentId"> = {},
): JiraGoldenJourneysV3StoryAgent {
	return FIX_AGENTS_BY_ID.get(options.fixAgentId ?? DEFAULT_JIRA_GOLDEN_JOURNEYS_V3_FIX_AGENT_ID)
		?? FIX_CODEX;
}

export function createFixAgentActor(agent: JiraGoldenJourneysV3StoryAgent): StaticTimelineEvent["actor"] {
	return {
		id: `static-fix-${agent.id}`,
		name: agent.name,
		kind: "agent",
		...(agent.brandName ? { brandName: agent.brandName } : { avatarSrc: agent.avatarSrc }),
	};
}

export const STORY_AGENTS = [CODE_PLANNER, CLAUDE_CODE, ROVO_DEV] as const;
export const STORY_AGENT_BY_ID = new Map(STORY_AGENTS.map((agent) => [agent.id, agent]));

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_COMPOSER_AGENTS: readonly AgentSelectorAgent[] = [
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

export function shouldStartJiraGoldenJourneysV3Plan(
	chapter: JiraGoldenJourneysV3StoryChapter,
	agentIds: readonly string[],
	descriptionImproved = false,
): boolean {
	if (chapter !== "intake" || !descriptionImproved) return false;
	const mentionedAgentIds = new Set(agentIds);
	return JIRA_GOLDEN_JOURNEYS_V3_STORY_COMPOSER_AGENTS.every((agent) => mentionedAgentIds.has(agent.id));
}

export const JIRA_GOLDEN_JOURNEYS_V3_STORY_WORK_ITEM_BASE: WorkItemData = {
	code: JIRA_GOLDEN_JOURNEYS_V3_STORY_ISSUE_KEY,
	title: "Add guest checkout to the storefront",
	createdAtMs: STORY_CREATED_AT_MS,
	description: RAW_STORY_DESCRIPTION,
	status: "To do",
	priority: "High",
	assignee: {
		name: "Venn",
		avatarUrl: "/avatar-user/venn/venn.png",
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

export const VENN_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-venn",
	name: "Venn",
	kind: "person",
	avatarSrc: "/avatar-user/venn/venn.png",
};

/** Primary human actor in the jira-golden-journeys-v3 story narrative (Venn). */
export const HUMAN_ACTOR = VENN_ACTOR;

export const CLAUDE_CODE_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-claude-code",
	name: CLAUDE_CODE.name,
	kind: "agent",
	brandName: CLAUDE_CODE.brandName,
};

export const GITHUB_ACTOR: StaticTimelineEvent["actor"] = {
	id: "static-github",
	name: "GitHub",
	kind: "app",
	brandName: "github",
};
