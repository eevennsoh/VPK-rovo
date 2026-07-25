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
				assistant: [
					"I reviewed the full deck outline against the latest Vitafleet strategy memo and the launch brief. The story is coherent and the overall narrative is ready for a final review, but I found three claims that still need explicit executive approval before the deck can be shared broadly.",
					"**What is ready**\n- The opening frames the customer problem and Vitafleet vision clearly.\n- The product principles now map directly to the launch outcomes in the strategy memo.\n- The roadmap section uses the latest sequencing and removes the older milestone language.",
					"**What still needs input**\n1. Confirm the projected adoption range on the market-opportunity slide.\n2. Approve the customer quote selected for the vision section.\n3. Decide whether the partner expansion target belongs in the main narrative or the appendix.",
					"Once those decisions are recorded, I’ll update the affected slides, run a final consistency pass across the speaker notes, and prepare a presentation-ready PDF. I’ve also queued a shorter leadership version so the same approved narrative can be reused without creating a second source of truth.",
				].join("\n\n"),
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
				assistant: [
					"I finished the launch-readiness pass for CRM-318. The dashboard itself is in good shape: the latest branch matches the acceptance criteria, all five automated checks are passing, and the regression checklist is complete for the primary analytics journeys.",
					"**What I verified**\n- Campaign, channel, and region filters return the expected totals across the standard reporting windows.\n- Saved dashboard views survive a refresh and preserve the selected comparison period.\n- Empty, partial, and delayed-data states use the approved guidance instead of showing misleading zero values.\n- The updated attribution labels are consistent between the summary cards, trend charts, and exported report.\n- Keyboard navigation and focus order remain intact after the dashboard refinements.",
					"**Two dependencies are still blocking rollout**\n1. **Audience mapping refresh:** the production mapping table is one revision behind the dataset used for validation. Shipping before that refresh could place a small group of recently renamed segments under the wrong parent audience.\n2. **Finance sign-off:** Finance still needs to approve the revised attribution schema, particularly the treatment of influenced pipeline when a campaign touches more than one opportunity stage.",
					"Neither blocker requires another UI change. The implementation can remain at the current commit while the data owner refreshes the mapping table and Finance records its decision. I linked the relevant acceptance criteria and PR notes in the details panel so both approvals can be checked against the same evidence.",
					"**What I’m doing next**\nI’m keeping the readiness checklist open and will re-run the audience, attribution, and export checks as soon as both approvals land. If the refreshed mapping produces the same totals and Finance accepts the schema as written, I’ll mark CRM-318 ready to release, attach the completed regression checklist, and post a concise handoff for the rollout owner.",
					"My recommendation is to hold the rollout rather than launch behind a partial-data caveat. The remaining work is narrow, the current build is stable, and waiting for these two confirmations avoids creating a trust issue in the first week of dashboard use.",
				].join("\n\n"),
				status: "awaiting-input",
			},
			"code-reviewer": {
				assistant: [
					"I reviewed the latest implementation branch for CRM-318 and confirmed that the aggregation pipeline changes are safe. The query boundary is clearer, the updated grouping logic preserves the existing totals, and the branch does not introduce a new client-side transformation path.",
					"**Review findings**\n- The campaign and channel aggregations now share the same normalized input model.\n- The comparison-period calculation handles month and quarter boundaries consistently.\n- Loading and error states remain isolated from the chart rendering path.\n- The focused regression coverage exercises the new grouping and export behavior.",
					"I left two follow-ups. First, null campaign metadata should be normalized before it reaches the grouping helper so an incomplete record cannot create an unlabeled series. Second, the anomaly threshold tests should include values exactly on the lower and upper boundary, not only values on either side.",
					"Both follow-ups are small and local to the data boundary. Once they are addressed, I’ll re-read the final diff, re-run the focused checks, and confirm that the PR is ready to merge without widening the scope of CRM-318.",
				].join("\n\n"),
				status: "running",
			},
			"feedback-analyzer": {
				assistant: [
					"I clustered the latest field feedback for CRM-318 into three themes: adoption, trust, and discoverability. The feedback is directionally positive, especially from teams replacing manual weekly reports, but users want more context before they rely on the dashboard for planning decisions.",
					"**What users are saying**\n- **Adoption:** saved views and exports remove repeated setup work for weekly reviews.\n- **Trust:** users want to understand why a value is marked anomalous before escalating it.\n- **Discoverability:** several users missed the comparison-period control on their first visit.\n- **Language:** attribution labels are accurate, but some readers interpret “influenced” as “sourced.”",
					"The strongest ask is a clearer explanation of how the anomaly score is calculated. A short explanation beside the score, supported by a deeper help link, would address most of the trust questions without adding noise to every chart.",
					"Next I’m separating launch-critical feedback from follow-up improvements. I’ll turn the anomaly explanation and attribution-language concern into concrete recommendations, then attach the remaining discoverability ideas to the post-launch backlog with the original feedback evidence preserved.",
				].join("\n\n"),
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
				assistant: [
					"I completed the latest PERF-27 benchmark sweep and refreshed the historical trendline with the new results. Median performance remains inside the agreed budget, but the 95th percentile has regressed enough to warrant investigation before the next platform rollout.",
					"**Current result**\n- Median request latency is effectively unchanged.\n- The 95th percentile is 14% slower than the last stable baseline.\n- The regression appears only under the high-concurrency profile.\n- Memory use and error rate remain within their expected ranges.",
					"I isolated the API fan-out step as the main contributor. Individual downstream calls are not materially slower; the extra time comes from one dependent request waiting for work that can begin earlier in the sequence.",
					"Next I’m validating that finding with a narrower trace and a reordered prototype. If the prototype removes the tail-latency increase without changing response semantics, I’ll package the evidence and recommended sequence change for the service owner.",
				].join("\n\n"),
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
				assistant: [
					"I drafted a smaller-surface refactor plan for WEB-461. The plan keeps the route shell focused on composition, moves normalization into a typed boundary, and preserves the current behavior while each responsibility changes owners.",
					"**Proposed sequence**\n1. Capture the existing normalization cases in focused contract tests.\n2. Extract the normalization helper without changing its call sites.\n3. Move route-specific mapping behind a small adapter.\n4. Replace the repeated conditional branches with the normalized model.\n5. Remove the old local helpers after every caller has migrated.",
					"This order keeps the diff reviewable and avoids a half-migrated state where both the route and the new helper own the same decisions. It also gives us a clear checkpoint after each step, so a behavior change can be traced to one boundary rather than the entire refactor.",
					"Next I’m checking the plan against the current regression coverage and file ownership. I’ll then turn it into implementation-sized tasks with explicit verification for the parsing boundary, route output, and user-visible behavior.",
				].join("\n\n"),
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
				assistant: [
					"I traced the intermittent PAY-88 suite failures to a race between fixture seeding and checkout retries. The checkout can begin a retry while the shared fixture is still publishing its final state, which explains why the failure disappears when the same test is run by itself.",
					"The evidence points to one ownership boundary rather than a general timing problem: successful runs wait for the fixture-ready signal, while failing runs depend on a fixed delay and occasionally observe the previous checkout state.",
					"My recommended fix is to make the retry wait for the existing readiness condition and remove the fixed delay from this path. After that, I’ll repeat the scenario under parallel load and add focused browser coverage for the retry transition so the original race remains reproducible as a regression test.",
				].join("\n\n"),
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
				assistant: [
					"I mapped the GROW-204 onboarding flow into three focused browser scenarios: a first-time setup, an invited-user handoff, and a returning user resuming incomplete work. Together they cover the critical journey without importing brittle fixture state into every test.",
					"Each scenario starts from a small explicit boundary, verifies the user-visible milestone, and cleans up only the data it creates. Shared helpers will cover authentication and seed setup, while product decisions stay readable in the individual specs.",
					"Next I’m identifying the smallest stable selectors and the existing test utilities we can reuse. I’ll then draft the first-time setup scenario as the reference pattern before adding the two variants, with failure screenshots and accessibility assertions included from the start.",
				].join("\n\n"),
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
				assistant: [
					"I reviewed the QA-56 component inventory and identified the boundaries where focused regression tests buy the most protection: asynchronous loading states, selected-row semantics, and token-driven visual variants.",
					"The first test set should cover state transitions rather than implementation details: loading to populated, populated to empty, selection moving between rows, and keyboard focus returning after a transient surface closes. A smaller visual matrix can then protect the semantic variants that have previously drifted between themes.",
					"Next I’m ranking the components by user impact and change frequency, then mapping each one to the lightest suitable test layer. The output will be a sequenced test plan that starts with the highest-risk shared behavior and avoids duplicating coverage already owned by browser journeys.",
				].join("\n\n"),
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
				assistant: [
					"I backfilled the PLAT-12 rollout history and summarized the checkpoints that made the continuous integration pipeline stable enough to become the default merge gate.",
					"The rollout moved through three clear stages: an opt-in validation period, a required check for a small pilot group, and full branch-protection enforcement after failure rates and queue times stabilized. The final stage also added ownership guidance so teams knew where to route infrastructure failures versus product-test failures.",
					"The completed summary includes the adoption timeline, the reliability signals used at each checkpoint, and the remaining follow-ups around peak queue time. I’m doing one final evidence pass now so the rollout record can serve as a reusable template for future organization-wide checks.",
				].join("\n\n"),
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
				assistant: [
					"I grouped the completed DS-73 accessibility improvements into navigation, focus visibility, and copy clarity, then compared the support themes from before and after the rollout.",
					"Keyboard navigation produced the clearest improvement: users can now move through the primary workflow without losing their place when a panel opens or closes. Stronger focus treatment reduced uncertainty in dense screens, while the revised instructions removed several ambiguous action labels reported by screen-reader users.",
					"The outcome summary separates observed improvements from areas that still need measurement. Next I’m attaching the assistive-technology findings and turning the two remaining copy questions into follow-up recommendations for the design-system owners.",
				].join("\n\n"),
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
				assistant: [
					"I closed the INT-119 integration readiness checklist and confirmed that the launch requirements are complete across authentication, request limits, error handling, and partner-facing documentation.",
					"The production configuration matches the approved contract, the fallback behavior has been exercised for unavailable and rate-limited responses, and the support handoff includes the identifiers needed to trace a request across our boundary and the partner API.",
					"Two partner contracts still need monitoring after launch: one has a lower burst allowance than our internal default, and the other can return a delayed completion callback during regional maintenance. Neither blocks release, but both are recorded with owners, thresholds, and escalation steps.",
					"Next I’m preparing the first-week monitoring view and a concise launch handoff. If those two contract signals stay within their expected ranges, INT-119 can move from heightened monitoring into the standard integration health review.",
				].join("\n\n"),
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
