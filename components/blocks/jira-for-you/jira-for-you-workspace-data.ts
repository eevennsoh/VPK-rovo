import {
	getRovoAgentProfile,
	type RovoAgentProfile,
} from "@/app/data/directory/agents";
import type { SmartLinkItem } from "@/components/blocks/smart-link/components/smart-link";
import { SMART_LINK_MODAL_ACTIONS } from "@/components/blocks/smart-link/data/smart-link-actions";
import type { JiraSidebarSessionStatus } from "@/components/blocks/product-sidebar/variants/jira";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

import type {
	JiraForYouAgent,
	JiraForYouItem,
	JiraForYouSection,
	JiraForYouStatus,
} from "./jira-for-you-types";
import type {
	JiraForYouWorkspaceAgentSession,
	JiraForYouWorkspaceData,
	JiraForYouWorkspaceItemDetails,
	JiraForYouWorkspaceItemData,
	JiraForYouWorkspaceOutput,
} from "./jira-for-you-workspace-types";
import { mapJiraForYouItemToWorkItem } from "./jira-for-you-work-item-data";

const OUTPUT_ILLUSTRATIONS = [
	"checklist",
	"content-design",
	"customer",
	"develop",
	"guidelines",
	"integration",
	"lightbulb",
	"platform",
	"playbook",
	"project-management",
] as const;

type WorkspaceSourceBuilder = (
	item: JiraForYouItem,
	title: string,
) => SmartLinkItem;

interface WorkspaceSourceSeed {
	builder: keyof typeof WORKSPACE_SOURCE_BUILDERS;
	title: string;
}

interface WorkspaceAgentSeed {
	assistant: string;
	composerPlaceholder?: string;
	messages?: readonly RovoUIMessage[];
	status?: JiraSidebarSessionStatus;
}

interface WorkspaceItemSeed {
	agentSessions?: Readonly<Record<string, WorkspaceAgentSeed>>;
	branch?: string;
	checks?: string;
	host?: "cloud" | "local";
	outputs?: readonly string[];
	pullRequestNumber?: number;
	pullRequestTitle?: string;
	repository?: string;
	sessionTitle?: string;
	sources?: readonly WorkspaceSourceSeed[];
	worktreePath?: string;
}

const WORKSPACE_SOURCE_BUILDERS = {
	confluence: (item, title) => ({
		id: `${item.id}-confluence-${title}`,
		href: `#${item.id}-confluence`,
		title,
		variant: "confluence",
		provider: { name: "Confluence", logo: { kind: "atlassian", name: "confluence" } },
		icon: { kind: "atlassian", name: "confluence" },
		description: `Planning context curated for ${item.issueKey}.`,
		date: "Updated today",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	github: (item, title) => ({
		id: `${item.id}-github-${title}`,
		href: `#${item.id}-github`,
		title,
		variant: "generic",
		provider: { name: "GitHub", logo: { kind: "third-party", name: "github" } },
		icon: { kind: "third-party", name: "github" },
		description: `Development trail for ${item.issueKey}.`,
		metadata: [{ label: "Opened today" }],
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	drive: (item, title) => ({
		id: `${item.id}-drive-${title}`,
		href: `#${item.id}-drive`,
		title,
		variant: "file",
		provider: { name: "Google Drive", logo: { kind: "third-party", name: "google-drive" } },
		icon: { kind: "third-party", name: "google-drive" },
		description: `Supporting workbook referenced while updating ${item.issueKey}.`,
		metadata: [{ label: "Refreshed 2 hours ago" }],
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	slack: (item, title) => ({
		id: `${item.id}-slack-${title}`,
		href: `#${item.id}-slack`,
		title,
		variant: "generic",
		provider: { name: "Slack", logo: { kind: "third-party", name: "slack" } },
		icon: { kind: "third-party", name: "slack" },
		description: `Owner thread used for the latest ${item.issueKey} handoff.`,
		metadata: [{ label: "Last reply 1 hour ago" }],
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	website: (item, title) => ({
		id: `${item.id}-website-${title}`,
		href: `#${item.id}-website`,
		title,
		variant: "article",
		provider: { name: item.spaceName, logo: { kind: "text", label: item.spaceName[0] ?? "W", tone: "information" } },
		icon: { kind: "text", label: item.spaceName[0] ?? "W", tone: "information" },
		description: `Reference page consulted while advancing ${item.issueKey}.`,
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
} satisfies Record<string, WorkspaceSourceBuilder>;

const DEFAULT_WORKSPACE_SOURCES: readonly WorkspaceSourceSeed[] = [
	{ builder: "confluence", title: "Execution notes" },
	{ builder: "drive", title: "Working evidence matrix" },
	{ builder: "slack", title: "Owner handoff thread" },
];

const WORKSPACE_ITEM_SEEDS: Readonly<Record<string, WorkspaceItemSeed>> = {
	"vitafleet-presentation": {
		host: "cloud",
		outputs: ["vitafleet-vision-deck.pdf", "speaker-notes.docx"],
		repository: "atlassian/vitafleet-launch",
		sessionTitle: "Validate the Vitafleet vision deck",
		sources: [
			{ builder: "confluence", title: "Vitafleet vision brief" },
			{ builder: "drive", title: "Presentation outline v7" },
			{ builder: "slack", title: "#vitafleet-launch approvals" },
		],
		agentSessions: {
			"readiness-checker": {
				assistant:
					"I reviewed the deck outline against the latest Vitafleet strategy memo, highlighted three claims that still need executive approval, and queued the final narrative for your review.",
				status: "awaiting-input",
			},
		},
	},
	"crm-analytics-dashboard": {
		branch: "rovo/crm-318-dashboard-review",
		checks: "5 checks passing",
		host: "local",
		outputs: ["crm-318-review-notes.docx", "dashboard-regression-checklist.xlsx"],
		pullRequestNumber: 3184,
		pullRequestTitle: "CRM-318 analytics dashboard refinements",
		repository: "atlassian/revenue-platform",
		sessionTitle: "Review CRM analytics dashboard",
		sources: [
			{ builder: "github", title: "PR #3184 dashboard refinements" },
			{ builder: "confluence", title: "Analytics acceptance criteria" },
		],
		worktreePath: "~/src/revenue-platform/.worktrees/crm-318-review",
		agentSessions: {
			"readiness-checker": {
				assistant:
					"I finished the launch-readiness pass for CRM-318 and flagged two dependencies still blocking the dashboard rollout: the audience mapping refresh and the finance sign-off for the attribution schema.",
				status: "awaiting-input",
			},
			"code-reviewer": {
				assistant:
					"I reviewed the latest implementation branch for CRM-318, confirmed the aggregation pipeline changes are safe, and left two follow-ups around null campaign metadata and threshold edge cases.",
				status: "running",
			},
			"feedback-analyzer": {
				assistant:
					"I clustered the latest field feedback for CRM-318 into adoption, trust, and discoverability themes. The strongest ask is a clearer explanation of how the anomaly score is calculated.",
				status: "running",
			},
		},
	},
	"performance-benchmarking": {
		host: "local",
		outputs: ["perf-27-benchmark-summary.pdf", "latency-comparison.xlsx"],
		repository: "atlassian/data-platform",
		sessionTitle: "Track benchmark regressions",
		sources: [
			{ builder: "drive", title: "Benchmark history workbook" },
			{ builder: "confluence", title: "Performance budget policy" },
		],
		agentSessions: {
			"progress-tracker": {
				assistant:
					"I completed the latest benchmark sweep, refreshed the historical trendline, and isolated the API fan-out step as the main contributor to the 95th percentile regression.",
			},
		},
	},
	"refactor-readability": {
		branch: "rovo/web-461-readability-plan",
		host: "local",
		outputs: ["web-461-refactor-plan.docx"],
		repository: "atlassian/web-app",
		sessionTitle: "Plan readability refactor",
		sources: [
			{ builder: "confluence", title: "Refactor proposal" },
			{ builder: "github", title: "Draft branch notes" },
		],
		agentSessions: {
			"code-planner": {
				assistant:
					"I drafted a smaller-surface refactor plan for WEB-461 that extracts the normalization logic first, keeps the route shell shallow, and preserves the current regression coverage while the behavior moves.",
			},
		},
	},
	"payment-suite-failures": {
		host: "cloud",
		outputs: ["pay-88-failure-analysis.pdf"],
		repository: "atlassian/payments-suite",
		sessionTitle: "Investigate flaky payment tests",
		sources: [
			{ builder: "github", title: "Flake investigation branch" },
			{ builder: "slack", title: "#payments-ci alerts" },
		],
		agentSessions: {
			"code-reviewer": {
				assistant:
					"I traced the intermittent suite failures to a race between fixture seeding and checkout retries. The next step is a small retry-boundary fix before we widen the browser coverage.",
			},
		},
	},
	"onboarding-e2e-coverage": {
		host: "local",
		outputs: ["grow-204-test-plan.docx", "critical-journeys.xlsx"],
		repository: "atlassian/growth-app",
		sessionTitle: "Scope onboarding e2e coverage",
		sources: [
			{ builder: "confluence", title: "Onboarding test map" },
			{ builder: "website", title: "Onboarding experience preview" },
		],
		agentSessions: {
			"code-planner": {
				assistant:
					"I mapped the onboarding flow into three focused browser scenarios so we can add coverage without importing brittle fixture state into the suite.",
			},
		},
	},
	"critical-component-testing": {
		host: "cloud",
		outputs: ["qa-56-test-priorities.pdf"],
		sessionTitle: "Prioritize critical component tests",
		sources: [
			{ builder: "confluence", title: "Critical component inventory" },
			{ builder: "slack", title: "#quality-engineering planning" },
		],
		agentSessions: {
			"code-reviewer": {
				assistant:
					"I identified the component boundaries where focused regression tests buy the most protection: async loading states, selected-row semantics, and token-driven visual variants.",
			},
		},
	},
	"ci-pipeline": {
		host: "cloud",
		outputs: ["plat-12-rollout-summary.pdf"],
		sessionTitle: "Summarize CI rollout",
		sources: [
			{ builder: "confluence", title: "CI rollout timeline" },
			{ builder: "github", title: "Pipeline rollout PR" },
		],
		agentSessions: {
			"progress-tracker": {
				assistant:
					"I backfilled the CI rollout history for PLAT-12 and summarized the checkpoints that made the pipeline stable enough to adopt as the default merge gate.",
			},
		},
	},
	"enhance-accessibility": {
		host: "cloud",
		outputs: ["ds-73-a11y-outcomes.pdf", "design-system-follow-ups.docx"],
		sessionTitle: "Assess accessibility outcomes",
		sources: [
			{ builder: "confluence", title: "Accessibility follow-up notes" },
			{ builder: "drive", title: "Assistive tech findings" },
		],
		agentSessions: {
			"feedback-analyzer": {
				assistant:
					"I grouped the accessibility improvements from DS-73 into navigation, focus visibility, and copy clarity, then highlighted which changes lowered support friction the most.",
			},
		},
	},
	"third-party-apis": {
		host: "local",
		outputs: ["int-119-launch-checklist.pdf"],
		repository: "atlassian/integrations-hub",
		sessionTitle: "Wrap third-party API rollout",
		sources: [
			{ builder: "confluence", title: "Integration launch checklist" },
			{ builder: "website", title: "Partner API reference" },
		],
		agentSessions: {
			"readiness-checker": {
				assistant:
					"I closed the integration readiness checklist for INT-119 and documented the two partner contracts that still need monitoring after the feature ships.",
			},
		},
	},
};

function message(id: string, role: "assistant" | "user", text: string): RovoUIMessage {
	return {
		id,
		role,
		parts: [{ type: "text", text, state: "done" }],
	};
}

function pickIllustration(seed: string): string {
	let hash = 0;
	for (let index = 0; index < seed.length; index += 1) {
		hash = (hash * 31 + seed.charCodeAt(index)) | 0;
	}
	return OUTPUT_ILLUSTRATIONS[Math.abs(hash) % OUTPUT_ILLUSTRATIONS.length] ?? "checklist";
}

function resolveWorkspaceAgentProfile(agent: JiraForYouAgent): RovoAgentProfile {
	if (!agent.id) {
		throw new Error(`Jira For You workspace agent "${agent.name}" needs a canonical directory id.`);
	}

	const profile = getRovoAgentProfile(agent.id);
	if (profile.id !== agent.id) {
		throw new Error(`Missing canonical Jira For You agent profile "${agent.id}".`);
	}

	return profile;
}

function mapJiraStatusToSidebarStatus(status: JiraForYouStatus): JiraSidebarSessionStatus {
	switch (status) {
		case "Review":
		case "To do":
			return "awaiting-input";
		case "In progress":
			return "running";
		case "In review":
			return "pr-open";
		case "Done":
			return "merged";
		default: {
			const exhaustiveStatus: never = status;
			return exhaustiveStatus;
		}
	}
}

function buildSources(
	item: JiraForYouItem,
	sourceSeeds: readonly WorkspaceSourceSeed[],
): SmartLinkItem[] {
	return sourceSeeds.map(({ builder, title }) => WORKSPACE_SOURCE_BUILDERS[builder](item, title));
}

function buildOutputs(item: JiraForYouItem, outputTitles: readonly string[]): JiraForYouWorkspaceOutput[] {
	return outputTitles.map((title, index) => ({
		id: `${item.id}-output-${index}`,
		illustration: pickIllustration(`${item.id}-${title}`),
		title,
	}));
}

function buildFallbackMessages(
	item: JiraForYouItem,
	agent: JiraForYouAgent,
	assistantText: string,
): readonly RovoUIMessage[] {
	const userRequest = item.status
		? `Give me the latest update on ${item.issueKey} and tell me what ${agent.name} is doing next.`
		: `Open the latest workspace summary for ${item.issueKey}.`;

	return [
		message(`${item.id}-${agent.id}-user`, "user", userRequest),
		message(`${item.id}-${agent.id}-assistant`, "assistant", assistantText),
	];
}

function createAgentSession(
	item: JiraForYouItem,
	agent: JiraForYouAgent,
	itemSeed: WorkspaceItemSeed | undefined,
): JiraForYouWorkspaceAgentSession {
	const profile = resolveWorkspaceAgentProfile(agent);
	const agentId = profile.id;
	const agentSeed = itemSeed?.agentSessions?.[agentId];
	const sidebarStatus = mapJiraStatusToSidebarStatus(item.jiraStatus);
	const assistantText = agentSeed?.assistant ?? [
		`${profile.name} reviewed **${item.issueKey}** and prepared the next step for **${item.title}**.`,
		item.status
			? `Current live status: ${item.status}.`
			: `The work item is still tracked in **${item.jiraStatus}** and is ready for the next handoff.`,
	].join("\n\n");
	return {
		composerPlaceholder: agentSeed?.composerPlaceholder ?? `Message ${profile.name}`,
		id: agentId,
		messages: agentSeed?.messages ?? buildFallbackMessages(item, agent, assistantText),
		profile,
		status: agentSeed?.status ?? sidebarStatus,
	};
}

function createWorkspaceItemDetails(
	item: JiraForYouItem,
	itemSeed: WorkspaceItemSeed | undefined,
	primaryAgentProfile: RovoAgentProfile,
): JiraForYouWorkspaceItemDetails {
	const status = mapJiraStatusToSidebarStatus(item.jiraStatus);
	const sourceSeeds = itemSeed?.sources ?? DEFAULT_WORKSPACE_SOURCES;
	const outputTitles = itemSeed?.outputs ?? [
		`${item.issueKey.toLowerCase()}-workspace-summary.pdf`,
		`${item.issueKey.toLowerCase()}-handoff-notes.docx`,
	];

	return {
		outputs: buildOutputs(item, outputTitles),
		session: {
			agentAvatarSrc: primaryAgentProfile.avatarSrc,
			agentName: primaryAgentProfile.name,
			branch: itemSeed?.branch,
			checks: itemSeed?.checks,
			host: itemSeed?.host ?? (status === "merged" ? "local" : "cloud"),
			id: `${item.id}-work-item`,
			issueKey: item.issueKey,
			issueSummary: item.title,
			priority: "medium",
			pullRequestNumber: itemSeed?.pullRequestNumber,
			pullRequestTitle: itemSeed?.pullRequestTitle,
			repository: itemSeed?.repository,
			status,
			title: itemSeed?.sessionTitle ?? `${item.issueKey}: ${item.title}`,
			worktreePath: itemSeed?.worktreePath,
		},
		sources: buildSources(item, sourceSeeds),
	};
}

function createWorkspaceItemData(item: JiraForYouItem): JiraForYouWorkspaceItemData {
	const itemSeed = WORKSPACE_ITEM_SEEDS[item.id];
	if (!item.agents?.length) {
		return {
			item,
			kind: "unassigned",
			workItem: mapJiraForYouItemToWorkItem(item),
		};
	}

	const agentSessions = item.agents.map((agent) => createAgentSession(item, agent, itemSeed));
	const primaryAgentSession = agentSessions[0];
	if (!primaryAgentSession) {
		throw new Error(`Assigned Jira For You item "${item.id}" has no canonical agent profile.`);
	}

	return {
		agentSessions,
		defaultAgentId: primaryAgentSession.id,
		details: createWorkspaceItemDetails(
			item,
			itemSeed,
			primaryAgentSession.profile,
		),
		item,
		kind: "assigned",
	};
}

export function createJiraForYouWorkspaceData(
	sections: readonly JiraForYouSection[],
): JiraForYouWorkspaceData {
	const items = sections.flatMap((section) => section.items);
	const itemIds: string[] = [];
	const itemsById: Record<string, JiraForYouWorkspaceItemData> = {};

	for (const item of items) {
		itemIds.push(item.id);
		itemsById[item.id] = createWorkspaceItemData(item);
	}

	return {
		itemIds,
		itemsById,
	};
}
