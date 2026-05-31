import type {
	AgentTemplatesAgent,
	AgentTemplatesCategoryId,
} from "../components/agent-templates";
import type { CardDirectoryCapability } from "@/components/ui-custom/card-directory";

type DemoTemplateSource = NonNullable<AgentTemplatesAgent["sources"]>[number];
type DemoTemplateSkill = NonNullable<AgentTemplatesAgent["skills"]>[number];
type DemoTemplateCollaborator = NonNullable<AgentTemplatesAgent["collaborators"]>[number];

type DemoTemplateConfig = {
	id: string;
	categoryId: AgentTemplatesCategoryId;
	name: string;
	description: string;
	avatarSrc: string;
	publisher: string;
	attributionKind?: AgentTemplatesAgent["attributionKind"];
	publisherLogoSrc?: string;
	templatePrompt?: string;
	verified?: boolean;
	sources?: readonly DemoTemplateSource[];
	skills?: readonly DemoTemplateSkill[];
	capabilities?: readonly CardDirectoryCapability[];
	remix: string;
	updated: string;
	peopleOffset: number;
	collaboratorOverflow?: number;
};

const SOURCE = {
	bitbucket: { id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
	figma: { id: "figma", label: "Figma", provider: "teams", iconSrc: "/3p/figma/24.svg" },
	amplitude: { id: "amplitude", label: "Amplitude", provider: "teams", iconSrc: "/3p/amplitude/24.svg" },
	confluence: { id: "confluence", label: "Confluence", provider: "confluence" },
	github: { id: "github", label: "GitHub", provider: "teams", iconSrc: "/3p/github/24.svg" },
	googleDrive: { id: "google-drive", label: "Google Drive", provider: "google-drive" },
	jira: { id: "jira", label: "Jira", provider: "jira" },
	jiraProductDiscovery: { id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
	jiraServiceManagement: { id: "jira-service-management", label: "Jira Service Management", provider: "jira-service-management" },
	loom: { id: "loom", label: "Loom", provider: "loom" },
	microsoftTeams: { id: "microsoft-teams", label: "Microsoft Teams", provider: "teams", iconSrc: "/3p/microsoft-teams/24.svg" },
	monday: { id: "monday", label: "Monday", provider: "teams", iconSrc: "/3p/monday/24.svg" },
	pagerDuty: { id: "pagerduty", label: "PagerDuty", provider: "teams", iconSrc: "/3p/pagerduty/24.svg" },
	powerBi: { id: "powerbi", label: "Power BI", provider: "teams", iconSrc: "/3p/powerbi/24.svg" },
	salesforce: { id: "salesforce", label: "Salesforce", provider: "salesforce" },
	slack: { id: "slack", label: "Slack", provider: "teams", iconSrc: "/3p/slack/24.svg" },
	smartSheet: { id: "smartsheet", label: "Smartsheet", provider: "teams", iconSrc: "/3p/smartsheet/24.svg" },
	trello: { id: "trello", label: "Trello", provider: "trello" },
} satisfies Record<string, DemoTemplateSource>;

const SOURCE_SEQUENCE: readonly DemoTemplateSource[] = [
	SOURCE.jira,
	SOURCE.confluence,
	SOURCE.googleDrive,
	SOURCE.slack,
	SOURCE.loom,
	SOURCE.figma,
	SOURCE.bitbucket,
	SOURCE.github,
	SOURCE.salesforce,
	SOURCE.jiraProductDiscovery,
	SOURCE.jiraServiceManagement,
	SOURCE.trello,
	SOURCE.amplitude,
	SOURCE.microsoftTeams,
	SOURCE.pagerDuty,
	SOURCE.powerBi,
	SOURCE.smartSheet,
	SOURCE.monday,
];

const SKILL_COLORS = [
	"product",
	"strategy",
	"teamwork",
	"software",
	"service",
	"platform",
	"2p3p",
	"default",
] satisfies readonly NonNullable<DemoTemplateSkill["color"]>[];

const SKILL_LABELS: Record<AgentTemplatesCategoryId, readonly string[]> = {
	brainstorm: [
		"decision-framing",
		"planning",
		"rubric-building",
		"option-mapping",
		"assumption-check",
		"tradeoff-analysis",
		"hypothesis-shaping",
		"research-scan",
		"idea-ranking",
		"constraint-mapping",
		"opportunity-sizing",
		"confidence-scoring",
		"concept-briefing",
		"facilitation",
		"next-step-planning",
		"evidence-gap-check",
		"risk-spotting",
		"stakeholder-input",
		"experiment-shaping",
		"goal-alignment",
	],
	analyze: [
		"signal-detection",
		"synthesis",
		"briefing",
		"feedback-clustering",
		"sentiment-mapping",
		"theme-mining",
		"transcript-review",
		"funnel-diagnosis",
		"research-synthesis",
		"trend-analysis",
		"evidence-linking",
		"insight-prioritization",
		"quote-selection",
		"anomaly-scan",
		"source-tracing",
		"impact-mapping",
		"segment-compare",
		"need-finding",
		"metric-context",
		"decision-brief",
	],
	review: [
		"triage",
		"handoff",
		"risk-review",
		"incident-routing",
		"queue-health",
		"escalation-drafting",
		"sla-check",
		"owner-mapping",
		"policy-lookup",
		"process-review",
		"service-summary",
		"on-call-briefing",
		"postmortem-scan",
		"dependency-check",
		"readiness-review",
		"support-reply",
		"status-update",
		"runbook-match",
		"compliance-note",
		"knowledge-gap",
	],
	summarize: [
		"drafting",
		"editing",
		"audience-fit",
		"release-note-grouping",
		"executive-summary",
		"tone-matching",
		"translation-review",
		"social-adaptation",
		"prd-outline",
		"message-polish",
		"changelog-writing",
		"content-briefing",
		"decision-summary",
		"meeting-recap",
		"stakeholder-update",
		"brand-review",
		"accessibility-copy",
		"clarity-pass",
		"narrative-structure",
		"action-extraction",
	],
	create: [
		"work-breakdown",
		"sequencing",
		"readiness",
		"sprint-scope",
		"blocker-scan",
		"bug-reporting",
		"epic-shaping",
		"owner-routing",
		"queue-cleanup",
		"progress-summary",
		"dependency-map",
		"acceptance-criteria",
		"task-slicing",
		"milestone-planning",
		"risk-log",
		"handoff-plan",
		"capacity-check",
		"workflow-design",
		"prioritization",
		"status-drafting",
	],
};

const PICK_STEPS = [7, 11, 13, 17, 19] as const;
type CapabilityIcon = NonNullable<CardDirectoryCapability["icon"]>;
// Each tab draws capability icons from its own themed, diverse pool, so the whole
// tab reads differently from the others (planning vs insights vs operations vs
// writing vs work management). Every pool holds nine icons; capability icons are
// assigned by tab position in `withTabVariedCapabilityIcons` so no two cards in a
// tab share the same set.
const CATEGORY_CAPABILITY_ICONS: Record<AgentTemplatesCategoryId, readonly CapabilityIcon[]> = {
	brainstorm: ["lightbulb", "compass", "roadmap", "scales", "target", "question", "discovery", "branch", "objective"],
	analyze: ["trend", "chartBar", "chartPie", "dashboard", "data", "filter", "search", "pulse", "bubble"],
	review: ["check", "shield", "alert", "queue", "onCall", "incident", "handoff", "support", "refresh"],
	summarize: ["draft", "document", "quote", "translate", "megaphone", "text", "book", "highlight", "list"],
	create: ["work", "board", "epic", "subtasks", "timeline", "calendar", "checklist", "dependency", "milestone"],
};
// Walking each nine-icon pool by a stride coprime with the pool size gives every
// card a distinct, well-spread set: the five picks never repeat within a card, and
// consecutive cards in a tab share at most one icon.
const CAPABILITY_ICON_STRIDE = 2;

const CATEGORY_CAPABILITY_DETAIL: Record<AgentTemplatesCategoryId, readonly [string, string]> = {
	brainstorm: ["Compares options, confidence, constraints, and open questions", "Turns the strongest path into a facilitation-ready brief"],
	analyze: ["Clusters patterns, quotes, anomalies, and measurable impact", "Packages the signal into a decision-ready insight brief"],
	review: ["Flags risk, owners, service state, and handoff gaps", "Prepares the follow-through note for the right queue or team"],
	summarize: ["Preserves audience, tone, source context, and decisions", "Shapes the summary into a polished stakeholder-ready draft"],
	create: ["Breaks work into owners, scope, dependencies, and readiness", "Turns the plan into update-ready work items and next steps"],
};

const PEOPLE: readonly DemoTemplateCollaborator[] = [
	{ name: "Michael Chu", src: "/avatar-human/michael-chu.png" },
	{ name: "Melanie Lee", src: "/avatar-human/melanie-lee.png" },
	{ name: "David Hsieh", src: "/avatar-human/david-hsieh.png" },
	{ name: "Aoife Burke", src: "/avatar-human/aoife-burke.png" },
	{ name: "Andrew Park", src: "/avatar-human/andrew-park.png" },
	{ name: "Christine Sanchez", src: "/avatar-human/christine-sanchez.png" },
	{ name: "Maia Ma", src: "/avatar-human/maia-ma.png" },
	{ name: "Brian Lin", src: "/avatar-human/brian-lin.png" },
	{ name: "Liam Estrada", src: "/avatar-human/liam-estrada.png" },
	{ name: "Issac Varghese", src: "/avatar-human/issac-varghese.png" },
	{ name: "Kayla Parajuli", src: "/avatar-human/kayla-parajuli.png" },
	{ name: "Luna Delacour", src: "/avatar-human/luna-delacour.png" },
];

function pickCollaborators(offset: number): readonly DemoTemplateCollaborator[] {
	return [0, 1, 2].map((step) => PEOPLE[(offset + step) % PEOPLE.length]);
}

function getTemplateSeed(value: string): number {
	return Array.from(value).reduce((hash, character) => (
		(hash * 31 + character.charCodeAt(0)) % 9973
	), 17);
}

function pickDeterministicItems<T>(items: readonly T[], seed: number, count: number): readonly T[] {
	const step = PICK_STEPS[seed % PICK_STEPS.length] ?? 1;
	const start = seed % items.length;

	return Array.from({ length: count }, (_, index) => {
		const item = items[(start + index * step) % items.length];
		if (item === undefined) {
			throw new Error("Template source data is empty.");
		}
		return item;
	});
}

function defaultSources(id: string, categoryId: AgentTemplatesCategoryId): readonly DemoTemplateSource[] {
	const seed = getTemplateSeed(`${categoryId}:${id}:sources`);
	const sourceCount = 2 + (seed % 7);

	return pickDeterministicItems(SOURCE_SEQUENCE, seed, sourceCount);
}

function defaultSkills(id: string, categoryId: AgentTemplatesCategoryId): readonly DemoTemplateSkill[] {
	const seed = getTemplateSeed(`${categoryId}:${id}:skills`);
	const skillCount = 3 + (seed % 8);

	return pickDeterministicItems(SKILL_LABELS[categoryId], seed, skillCount).map((label, index) => ({
		color: SKILL_COLORS[(seed + index) % SKILL_COLORS.length],
		label,
	}));
}

function defaultCapabilities({
	categoryId,
	description,
	id,
	name,
	sources,
}: {
	categoryId: AgentTemplatesCategoryId;
	description: string;
	id: string;
	name: string;
	sources: readonly DemoTemplateSource[];
}): readonly CardDirectoryCapability[] {
	const seed = getTemplateSeed(`${categoryId}:${id}:capabilities`);
	const [categoryInsight, categoryOutput] = CATEGORY_CAPABILITY_DETAIL[categoryId];
	const sourceLabel = sources[seed % sources.length]?.label ?? "trusted sources";

	// Labels only — capability icons are assigned per tab position by
	// `withTabVariedCapabilityIcons` so every card in a tab looks distinct.
	return [
		{ label: description.replace(/\.$/u, "") },
		{ label: `Connects ${sourceLabel} context for ${name}` },
		{ label: categoryInsight },
		{ label: `Recommends next moves for ${name}` },
		{ label: categoryOutput },
	];
}

function buildTemplatePrompt({
	name,
	description,
	sources,
	skills,
	capabilities,
}: {
	name: string;
	description: string;
	sources: readonly DemoTemplateSource[];
	skills: readonly DemoTemplateSkill[];
	capabilities: readonly CardDirectoryCapability[];
}): string {
	const appList = sources.map((source) => source.label).join(", ");
	const skillList = skills.map((skill) => skill.label).join(", ");
	const featureList = capabilities.map((capability) => capability.label).join("; ");

	return `Use the ${name} template to create a Studio agent. ${description} Connect it to ${appList}. Include skills for ${skillList}. It should support these features: ${featureList}. Keep the agent focused, reusable, and ready for me to review before sending.`;
}

function demoTemplateAgent({
	id,
	categoryId,
	name,
	description,
	avatarSrc,
	publisher,
	attributionKind = "team",
	publisherLogoSrc,
	templatePrompt,
	verified = false,
	sources,
	skills,
	capabilities,
	remix,
	updated,
	peopleOffset,
	collaboratorOverflow = 3,
}: DemoTemplateConfig): AgentTemplatesAgent {
	const resolvedSources = sources ?? defaultSources(id, categoryId);
	const resolvedSkills = skills ?? defaultSkills(id, categoryId);
	const resolvedCapabilities = capabilities ?? defaultCapabilities({
		categoryId,
		description,
		id,
		name,
		sources: resolvedSources,
	});

	return {
		id,
		categoryId,
		name,
		byline: `${name} by ${publisher}`,
		publisher,
		attributionKind,
		publisherLogoSrc,
		avatarSrc,
		description,
		verified,
		capabilities: resolvedCapabilities,
		sources: resolvedSources,
		skills: resolvedSkills,
		templatePrompt: templatePrompt ?? buildTemplatePrompt({
			name,
			description,
			sources: resolvedSources,
			skills: resolvedSkills,
			capabilities: resolvedCapabilities,
		}),
		stats: [
			{ label: "Remix", value: remix },
			{ label: "Last update", value: updated },
		],
		collaborators: pickCollaborators(peopleOffset),
		collaboratorOverflow,
	};
}

/**
 * Assigns capability icons by each agent's position within its tab. Walking the
 * category's themed icon pool by a coprime stride gives every card a distinct,
 * well-spread icon set — so within a tab no two tiles look alike, and the themed
 * pools keep each tab visually different from the others.
 */
function withTabVariedCapabilityIcons(
	agents: readonly AgentTemplatesAgent[],
): readonly AgentTemplatesAgent[] {
	const tabPosition = new Map<AgentTemplatesCategoryId, number>();

	return agents.map((agent) => {
		const { categoryId, capabilities } = agent;
		if (!categoryId || !capabilities) return agent;

		const pool = CATEGORY_CAPABILITY_ICONS[categoryId];
		const start = tabPosition.get(categoryId) ?? 0;
		tabPosition.set(categoryId, start + 1);

		return {
			...agent,
			capabilities: capabilities.map((capability, row) => ({
				...capability,
				icon: pool[(start + row * CAPABILITY_ICON_STRIDE) % pool.length],
			})),
		};
	});
}

// Demo data aligned to the Studio HomeStarterBento buckets. Each active tab
// renders up to eight expanded card-directory agents from its matching category.
export const DEMO_AGENT_TEMPLATES: readonly AgentTemplatesAgent[] = withTabVariedCapabilityIcons([
	demoTemplateAgent({
		id: "decision-director",
		categoryId: "brainstorm",
		name: "Decision Director",
		description: "Review DACI decisions, close context gaps, and suggest the next decision-ready resources.",
		avatarSrc: "/avatar-agent/teamwork-agents/decision-director.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "1.8K",
		updated: "2 weeks ago",
		peopleOffset: 0,
	}),
	demoTemplateAgent({
		id: "okr-generator",
		categoryId: "brainstorm",
		name: "OKR Generator",
		description: "Create and review clear, measurable OKRs against examples, team priorities, and outcome guidance.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-2.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "1.2K",
		updated: "6 days ago",
		peopleOffset: 1,
	}),
	demoTemplateAgent({
		id: "opportunity-explorer",
		categoryId: "brainstorm",
		name: "Opportunity Explorer",
		description: "Explore non-obvious directions before committing.",
		avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
		publisher: "Product Strategy",
		attributionKind: "team",
		remix: "940",
		updated: "4 days ago",
		peopleOffset: 2,
	}),
	demoTemplateAgent({
		id: "experiment-planner",
		categoryId: "brainstorm",
		name: "Experiment Planner",
		description: "Turn ideas into experiments and decision points.",
		avatarSrc: "/avatar-agent/service-agents/wildcard-1.svg",
		publisher: "Growth Programs",
		remix: "830",
		updated: "1 week ago",
		peopleOffset: 3,
	}),
	demoTemplateAgent({
		id: "tradeoff-mapper",
		categoryId: "brainstorm",
		name: "Tradeoff Mapper",
		description: "Compare options by upside, cost, and risk.",
		avatarSrc: "/avatar-agent/strategy-agents/wildcard-2.svg",
		publisher: "Decision Systems",
		remix: "760",
		updated: "3 days ago",
		peopleOffset: 4,
	}),
	demoTemplateAgent({
		id: "assumption-tester",
		categoryId: "brainstorm",
		name: "Assumption Tester",
		description: "Stress-test ideas against weak assumptions.",
		avatarSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
		publisher: "Product Discovery",
		remix: "690",
		updated: "5 days ago",
		peopleOffset: 5,
	}),
	demoTemplateAgent({
		id: "criteria-builder",
		categoryId: "brainstorm",
		name: "Criteria Builder",
		description: "Define practical criteria for choosing a path.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-3.svg",
		publisher: "Planning Systems",
		remix: "540",
		updated: "1 month ago",
		peopleOffset: 6,
	}),
	demoTemplateAgent({
		id: "brainstorm-facilitator",
		categoryId: "brainstorm",
		name: "Brainstorm Facilitator",
		description: "Guide teams from loose prompts to ranked concepts.",
		avatarSrc: "/avatar-agent/teamwork-agents/brainstorm-facilitator.svg",
		publisher: "Team Practices",
		remix: "510",
		updated: "2 days ago",
		peopleOffset: 7,
	}),

	demoTemplateAgent({
		id: "customer-insights",
		categoryId: "analyze",
		name: "Customer Insights",
		description: "Synthesize feedback into themes, customer needs, risks, and recommended product actions.",
		avatarSrc: "/avatar-agent/teamwork-agents/customer-insights.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "2.1K",
		updated: "2 weeks ago",
		peopleOffset: 2,
	}),
	demoTemplateAgent({
		id: "jira-theme-analyzer",
		categoryId: "analyze",
		name: "Jira Theme Analyzer",
		description: "Scan Jira work items to find themes, candidate epics, and patterns worth acting on.",
		avatarSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		sources: [SOURCE.jira, SOURCE.jiraProductDiscovery, SOURCE.confluence],
		remix: "1.6K",
		updated: "5 days ago",
		peopleOffset: 3,
	}),
	demoTemplateAgent({
		id: "transcript-insights-reporter",
		categoryId: "analyze",
		name: "Transcript Insights Reporter",
		description: "Turn transcripts into decisions, insights, recommendations, owners, and follow-up actions.",
		avatarSrc: "/avatar-agent/strategy-agents/wildcard-1.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		sources: [SOURCE.loom, SOURCE.confluence, SOURCE.googleDrive],
		remix: "1.1K",
		updated: "6 days ago",
		peopleOffset: 4,
	}),
	demoTemplateAgent({
		id: "meeting-insights",
		categoryId: "analyze",
		name: "Meeting Insights",
		description: "Find decisions, action items, highlights, and useful context across meeting notes.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-6.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		sources: [SOURCE.loom, SOURCE.confluence, SOURCE.googleDrive],
		remix: "990",
		updated: "1 week ago",
		peopleOffset: 5,
	}),
	demoTemplateAgent({
		id: "trend-spotter",
		categoryId: "analyze",
		name: "Trend Spotter",
		description: "Spot emerging trends across notes and feedback.",
		avatarSrc: "/avatar-agent/service-agents/wildcard-5.svg",
		publisher: "Market Insights",
		remix: "870",
		updated: "3 days ago",
		peopleOffset: 6,
	}),
	demoTemplateAgent({
		id: "sentiment-mapper",
		categoryId: "analyze",
		name: "Sentiment Mapper",
		description: "Map sentiment shifts across customer signals.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-4.svg",
		publisher: "Customer Voice",
		remix: "780",
		updated: "2 days ago",
		peopleOffset: 7,
	}),
	demoTemplateAgent({
		id: "funnel-analyzer",
		categoryId: "analyze",
		name: "Funnel Analyzer",
		description: "Trace product drop-offs, connect them to feedback, and suggest the next investigation.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-5.svg",
		publisher: "Amplitude",
		attributionKind: "company",
		publisherLogoSrc: "/3p/amplitude/16.svg",
		sources: [SOURCE.amplitude, SOURCE.jiraProductDiscovery, SOURCE.confluence],
		remix: "660",
		updated: "1 month ago",
		peopleOffset: 8,
	}),
	demoTemplateAgent({
		id: "research-synthesizer",
		categoryId: "analyze",
		name: "Research Synthesizer",
		description: "Pull research into a single, decision-ready brief.",
		avatarSrc: "/avatar-agent/teamwork-agents/work-organizer.svg",
		publisher: "Alex Kim",
		attributionKind: "person",
		remix: "610",
		updated: "4 days ago",
		peopleOffset: 9,
	}),

	demoTemplateAgent({
		id: "service-triage",
		categoryId: "review",
		name: "Service Triage",
		description: "Triage service requests, recommend field updates, and ask for missing details when needed.",
		avatarSrc: "/avatar-agent/service-agents/service-triage.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "1.4K",
		updated: "1 week ago",
		peopleOffset: 4,
	}),
	demoTemplateAgent({
		id: "service-request-helper",
		categoryId: "review",
		name: "Service Request Helper",
		description: "Draft support responses, suggest assignees, and summarize requests for faster resolution.",
		avatarSrc: "/avatar-agent/strategy-agents/strategic-insight.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		sources: [SOURCE.jiraServiceManagement, SOURCE.salesforce, SOURCE.microsoftTeams],
		remix: "1.3K",
		updated: "3 days ago",
		peopleOffset: 5,
	}),
	demoTemplateAgent({
		id: "rovo-ops",
		categoryId: "review",
		name: "Rovo Ops",
		description: "Guide incident response, on-call actions, mitigation, status updates, and recovery.",
		avatarSrc: "/avatar-agent/dev-agents/code-standardizer.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		sources: [SOURCE.bitbucket, SOURCE.jira, SOURCE.confluence, SOURCE.pagerDuty],
		remix: "1.1K",
		updated: "2 weeks ago",
		peopleOffset: 6,
	}),
	demoTemplateAgent({
		id: "rovo-expert",
		categoryId: "review",
		name: "Rovo Expert",
		description: "Answer Rovo setup and usage questions with concise guidance and helpful links.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-3.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "970",
		updated: "4 days ago",
		peopleOffset: 7,
	}),
	demoTemplateAgent({
		id: "user-manual-writer",
		categoryId: "review",
		name: "User Manual Writer",
		description: "Help teammates document working style, communication norms, and collaboration preferences.",
		avatarSrc: "/avatar-agent/teamwork-agents/user-manual-writer.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "850",
		updated: "6 days ago",
		peopleOffset: 8,
	}),
	demoTemplateAgent({
		id: "knowledge-base-guide",
		categoryId: "review",
		name: "Knowledge Base Guide",
		description: "Answer policy and process questions from trusted context.",
		avatarSrc: "/avatar-agent/teamwork-agents/workflow-builder.svg",
		publisher: "Operations",
		remix: "790",
		updated: "1 month ago",
		peopleOffset: 9,
	}),
	demoTemplateAgent({
		id: "incident-recap-writer",
		categoryId: "review",
		name: "Incident Recap Writer",
		description: "Compile post-incident timelines, decisions, and follow-ups.",
		avatarSrc: "/avatar-agent/service-agents/rca-agent.svg",
		publisher: "Reliability",
		remix: "620",
		updated: "2 days ago",
		peopleOffset: 10,
	}),
	demoTemplateAgent({
		id: "teamwork-coach",
		categoryId: "review",
		name: "Teamwork Coach",
		description: "Review collaboration patterns and suggest healthier rituals.",
		avatarSrc: "/avatar-agent/teamwork-agents/teamwork-coach.svg",
		publisher: "Team Practices",
		remix: "570",
		updated: "5 days ago",
		peopleOffset: 11,
	}),

	demoTemplateAgent({
		id: "product-requirements-guide",
		categoryId: "summarize",
		name: "Product Requirements Guide",
		description: "Create and review PRDs with customer empathy, evidence, acceptance criteria, and direct feedback.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-1.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "1.7K",
		updated: "2 weeks ago",
		peopleOffset: 6,
	}),
	demoTemplateAgent({
		id: "release-notes-drafter",
		categoryId: "summarize",
		name: "Release Notes Drafter",
		description: "Convert Jira work items into grouped release notes for customers and stakeholders.",
		avatarSrc: "/avatar-agent/dev-agents/deployment-summarizer.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		sources: [SOURCE.jira, SOURCE.bitbucket, SOURCE.confluence],
		remix: "1.2K",
		updated: "4 days ago",
		peopleOffset: 7,
	}),
	demoTemplateAgent({
		id: "brand-voice-crafter",
		categoryId: "summarize",
		name: "Brand Voice Crafter",
		description: "Draft or review content against brand voice, tone guidance, and audience needs.",
		avatarSrc: "/avatar-agent/strategy-agents/wildcard-3.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "1K",
		updated: "1 week ago",
		peopleOffset: 8,
	}),
	demoTemplateAgent({
		id: "social-media-writer",
		categoryId: "summarize",
		name: "Social Media Writer",
		description: "Draft social posts, improve engagement, and adapt messages by channel and audience.",
		avatarSrc: "/avatar-agent/service-agents/wildcard-4.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "880",
		updated: "2 days ago",
		peopleOffset: 9,
	}),
	demoTemplateAgent({
		id: "global-translator",
		categoryId: "summarize",
		name: "Global Translator",
		description: "Translate writing while preserving meaning, tone, accessibility, and audience context.",
		avatarSrc: "/avatar-agent/teamwork-agents/global-translator.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "810",
		updated: "6 days ago",
		peopleOffset: 10,
	}),
	demoTemplateAgent({
		id: "executive-briefing-writer",
		categoryId: "summarize",
		name: "Executive Briefing Writer",
		description: "Condense dense context for leadership updates.",
		avatarSrc: "/avatar-agent/service-agents/wildcard-5.svg",
		publisher: "Leadership Operations",
		remix: "730",
		updated: "3 days ago",
		peopleOffset: 11,
	}),
	demoTemplateAgent({
		id: "stakeholder-update-builder",
		categoryId: "summarize",
		name: "Stakeholder Update Builder",
		description: "Package progress into stakeholder-ready updates.",
		avatarSrc: "/avatar-agent/service-agents/ops-guide.svg",
		publisher: "Program Management",
		remix: "680",
		updated: "1 month ago",
		peopleOffset: 0,
	}),
	demoTemplateAgent({
		id: "team-recap",
		categoryId: "summarize",
		name: "Team Recap",
		description: "Turn busy channels into concise weekly summaries.",
		avatarSrc: "/avatar-agent/teamwork-agents/team-recap.svg",
		publisher: "Team Communications",
		remix: "590",
		updated: "5 days ago",
		peopleOffset: 1,
	}),

	demoTemplateAgent({
		id: "work-item-planner",
		categoryId: "create",
		name: "Work Item Planner",
		description: "Break large projects, epics, or workstreams into sequenced tasks, owners, and next steps.",
		avatarSrc: "/avatar-agent/service-agents/wildcard-2.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "1.9K",
		updated: "2 weeks ago",
		peopleOffset: 8,
	}),
	demoTemplateAgent({
		id: "work-item-organizer",
		categoryId: "create",
		name: "Work Item Organizer",
		description: "Find, move, update, and organize Jira work items across sprints, epics, and stale queues.",
		avatarSrc: "/avatar-agent/teamwork-agents/work-organizer.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "1.5K",
		updated: "1 week ago",
		peopleOffset: 9,
	}),
	demoTemplateAgent({
		id: "bug-report-assistant",
		categoryId: "create",
		name: "Bug Report Assistant",
		description: "Write concise bug reports with reproduction steps, impact, expected behavior, and triage notes.",
		avatarSrc: "/avatar-agent/dev-agents/code-vulnerability-scanner-npm-yarn.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		sources: [SOURCE.jira, SOURCE.bitbucket, SOURCE.confluence],
		remix: "1.1K",
		updated: "5 days ago",
		peopleOffset: 10,
	}),
	demoTemplateAgent({
		id: "blocker-checker",
		categoryId: "create",
		name: "Blocker Checker",
		description: "Detect blocked work, explain the evidence, and recommend the clearest unblocking move.",
		avatarSrc: "/avatar-agent/strategy-agents/wildcard-4.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "960",
		updated: "2 days ago",
		peopleOffset: 11,
	}),
	demoTemplateAgent({
		id: "readiness-checker",
		categoryId: "create",
		name: "Readiness Checker",
		description: "Review work items against a team's definition of ready and suggest missing details.",
		avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "850",
		updated: "6 days ago",
		peopleOffset: 0,
	}),
	demoTemplateAgent({
		id: "progress-tracker",
		categoryId: "create",
		name: "Progress Tracker",
		description: "Summarize in-flight projects, priorities, owners, progress, and work that needs attention.",
		avatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
		publisher: "Atlassian",
		attributionKind: "company",
		verified: true,
		remix: "820",
		updated: "4 days ago",
		peopleOffset: 1,
	}),
	demoTemplateAgent({
		id: "sprint-capacity-planner",
		categoryId: "create",
		name: "Sprint Capacity Planner",
		description: "Recommend balanced sprint scope using capacity, velocity, issue size, and delivery risk.",
		avatarSrc: "/avatar-agent/product-agents/wildcard-2.svg",
		publisher: "Smartsheet",
		attributionKind: "company",
		publisherLogoSrc: "/3p/smartsheet/16.svg",
		sources: [SOURCE.jira, SOURCE.smartSheet, SOURCE.confluence],
		remix: "700",
		updated: "1 month ago",
		peopleOffset: 2,
	}),
	demoTemplateAgent({
		id: "workflow-synthesizer",
		categoryId: "create",
		name: "Workflow Synthesizer",
		description: "Turns scattered requests into durable operating workflows.",
		avatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
		publisher: "Revenue Operations",
		remix: "640",
		updated: "3 days ago",
		peopleOffset: 3,
	}),
]);

// Kept as a separate export for the docs demo API; tab content now lives in the
// category-aligned catalog above so every tab can cap at eight expanded cards.
export const DEMO_AGENT_TEMPLATES_SESSION: readonly AgentTemplatesAgent[] = [];
