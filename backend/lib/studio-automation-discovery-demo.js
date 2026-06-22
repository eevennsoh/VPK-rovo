const DEMO_WIDGET_TYPE = "studio-automation-artifact-list";
const DEMO_SESSION_PREFIX = "studio-automation-discovery";
const {
	STUDIO_AUTOMATION_DISCOVERY_DEMO_USER: DEMO_USER,
	buildStudioAutomationDiscoveryWidgetPayload: buildStudioAutomationDiscoveryDataWidgetPayload,
} = require("./studio-automation-discovery-demo-data");

const SOURCE_KEYWORDS = [
	"slack",
	"jira",
	"confluence",
	"loom",
	"figma",
	"github",
	"bitbucket",
	"calendar",
	"atlas",
	"twg",
	"teamwork graph",
];

const WORK_INTENT_KEYWORDS = [
	"recent work",
	"work history",
	"last 30 days",
	"30 day",
	"past month",
	"manual workflow",
	"manual workflows",
	"repeated workflow",
	"repeated workflows",
	"automation",
	"automations",
	"agentic",
	"agent",
	"agents",
];

const DEMO_INITIAL_QUESTION_SESSION_ID = `${DEMO_SESSION_PREFIX}-questions`;
const DEMO_FOLLOWUP_QUESTION_SESSION_ID = `${DEMO_SESSION_PREFIX}-followup-questions`;
const DEMO_QUESTION_TOOL_NAME = "ask_user_questions";
const DEMO_INITIAL_QUESTION_TITLE = "Shape the automation discovery";
const DEMO_FOLLOWUP_QUESTION_TITLE = "Confirm draft boundaries";
const CLARIFICATION_LABELS_BY_QUESTION = {
	priority: new Map([
		["operational-impact", "Operational impact"],
		["operational impact", "Operational impact"],
		["presentation-clarity", "Presentation clarity"],
		["presentation clarity", "Presentation clarity"],
		["quick-win", "Quick wins"],
		["quick wins", "Quick wins"],
	]),
	"source-weighting": new Map([
		["twg-core-sources", "TWG plus Confluence, Jira, Slack"],
		["twg core sources", "TWG plus Confluence, Jira, Slack"],
		["twg plus confluence jira slack", "TWG plus Confluence, Jira, Slack"],
		["twg plus confluence, jira, slack", "TWG plus Confluence, Jira, Slack"],
		["loom-first", "Loom and design artifacts first"],
		["loom first", "Loom and design artifacts first"],
		["loom and design artifacts first", "Loom and design artifacts first"],
		["calendar-cadence", "Calendar cadence first"],
		["calendar cadence", "Calendar cadence first"],
		["calendar cadence first", "Calendar cadence first"],
	]),
	conservatism: new Map([
		["conservative", "Conservative create, defer weak signals"],
		["conservative create defer weak signals", "Conservative create, defer weak signals"],
		["conservative create, defer weak signals", "Conservative create, defer weak signals"],
		["balanced", "Balanced"],
		["aggressive", "Create more drafts"],
		["create more drafts", "Create more drafts"],
	]),
	"creation-boundary": new Map([
		["create-high-confidence-three", "Create the high-confidence three"],
		["create high confidence three", "Create the high-confidence three"],
		["create the high confidence three", "Create the high-confidence three"],
		["loom-and-lifecycle-first", "Create Loom and lifecycle first"],
		["loom and lifecycle first", "Create Loom and lifecycle first"],
		["create-all-candidates", "Create every plausible candidate"],
		["create all candidates", "Create every plausible candidate"],
	]),
	"approval-boundary": new Map([
		["draft-for-approval", "Draft for approval only"],
		["draft for approval", "Draft for approval only"],
		["draft for approval only", "Draft for approval only"],
		["low-risk-autoclose", "Allow low-risk auto-close"],
		["low risk autoclose", "Allow low-risk auto-close"],
		["allow low risk auto close", "Allow low-risk auto-close"],
		["no-autonomous-actions", "No autonomous actions"],
		["no autonomous actions", "No autonomous actions"],
	]),
	"hero-moment": new Map([
		["generated-agent-drafts", "Generated agent drafts"],
		["generated agent drafts", "Generated agent drafts"],
		["evidence-and-skips", "Evidence, skips, and deferrals"],
		["evidence and skips", "Evidence, skips, and deferrals"],
		["differences-between-agents", "Differences between the agents"],
		["differences between agents", "Differences between the agents"],
	]),
};

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function normalizePromptText(value) {
	return getNonEmptyString(value)
		?.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.replace(/\s+/g, " ")
		.trim() || "";
}

function countMatches(text, keywords) {
	return keywords.reduce((count, keyword) => (
		text.includes(keyword) ? count + 1 : count
	), 0);
}

function createStudioAutomationDiscoverySessionId(baseSessionId) {
	const timestamp = Date.now().toString(36);
	const entropy = Math.random().toString(36).slice(2, 8);
	return `${baseSessionId}-${timestamp}-${entropy}`;
}

function isStudioAutomationDiscoveryPrompt(prompt) {
	const normalized = normalizePromptText(prompt);
	if (!normalized) {
		return false;
	}

	const sourceMatches = countMatches(normalized, SOURCE_KEYWORDS);
	const workIntentMatches = countMatches(normalized, WORK_INTENT_KEYWORDS);
	const hasRecentWorkSignal =
		/\b(?:last|past|recent)\s+(?:30|thirty)\s+days?\b/u.test(normalized) ||
		/\b(?:last|past|recent)\s+month\b/u.test(normalized) ||
		normalized.includes("work history") ||
		normalized.includes("recent work");
	const hasAutomationSignal =
		normalized.includes("manual workflow") ||
		normalized.includes("repeated workflow") ||
		normalized.includes("automation") ||
		normalized.includes("agentic") ||
		/\bcreate\s+(?:an?\s+)?agents?\b/u.test(normalized);

	return (
		hasRecentWorkSignal &&
		hasAutomationSignal &&
		sourceMatches >= 3 &&
		workIntentMatches >= 3
	);
}

function isStudioAutomationDiscoverySession(sessionId) {
	return getNonEmptyString(sessionId)?.startsWith(DEMO_SESSION_PREFIX) === true;
}

function isStudioAutomationDiscoveryInitialSession(sessionId) {
	const normalized = getNonEmptyString(sessionId);
	return normalized === DEMO_INITIAL_QUESTION_SESSION_ID ||
		normalized?.startsWith(`${DEMO_INITIAL_QUESTION_SESSION_ID}-`) === true;
}

function isStudioAutomationDiscoveryFollowupSession(sessionId) {
	const normalized = getNonEmptyString(sessionId);
	return normalized === DEMO_FOLLOWUP_QUESTION_SESSION_ID ||
		normalized?.startsWith(`${DEMO_FOLLOWUP_QUESTION_SESSION_ID}-`) === true;
}

function isStudioAutomationDiscoveryDismissalPrompt(prompt) {
	const normalized = normalizePromptText(prompt);
	return (
		normalized.includes("dismissed the clarification questions") &&
		(
			normalized.includes(normalizePromptText(DEMO_INITIAL_QUESTION_TITLE)) ||
			normalized.includes(normalizePromptText(DEMO_FOLLOWUP_QUESTION_TITLE))
		)
	);
}

function isStudioAutomationDiscoveryInitialDismissalPrompt(prompt) {
	const normalized = normalizePromptText(prompt);
	return (
		normalized.includes("dismissed the clarification questions") &&
		normalized.includes(normalizePromptText(DEMO_INITIAL_QUESTION_TITLE))
	);
}

function isStudioAutomationDiscoveryFollowupDismissalPrompt(prompt) {
	const normalized = normalizePromptText(prompt);
	return (
		normalized.includes("dismissed the clarification questions") &&
		normalized.includes(normalizePromptText(DEMO_FOLLOWUP_QUESTION_TITLE))
	);
}

function buildStudioAutomationDiscoveryQuestionCardPayload({
	sessionId = createStudioAutomationDiscoverySessionId(DEMO_INITIAL_QUESTION_SESSION_ID),
	toolCallId,
} = {}) {
	return {
		type: "question-card",
		sessionId,
		round: 1,
		maxRounds: 2,
		title: DEMO_INITIAL_QUESTION_TITLE,
		description: "These choices tune how Studio turns your recent work patterns into draft agents.",
		directive: "Pick the recommended defaults if you want the presentation flow to continue quickly.",
		requiredCount: 3,
		questions: [
			{
				id: "priority",
				label: "What should Studio optimize for first?",
				description: "This decides how repeated workflows are ranked.",
				required: true,
				kind: "single-select",
				placeholder: "Describe another ranking priority",
				options: [
					{
						id: "operational-impact",
						label: "Operational impact",
						description: "Prioritize high-frequency work that drains your week.",
						recommended: true,
					},
					{
						id: "presentation-clarity",
						label: "Presentation clarity",
						description: "Prioritize workflows that best show the agent builder vision.",
					},
					{
						id: "quick-win",
						label: "Quick wins",
						description: "Prioritize simple trigger-to-action automations.",
					},
				],
			},
			{
				id: "source-weighting",
				label: "Which evidence should carry the most weight?",
				description: "This shapes the visible analysis trace.",
				required: true,
				kind: "single-select",
				placeholder: "Name another source weighting",
				options: [
					{
						id: "twg-core-sources",
						label: "TWG plus Confluence, Jira, Slack",
						description: "Use TWG as the correlation layer over your core work systems.",
						recommended: true,
					},
					{
						id: "loom-first",
						label: "Loom and design artifacts first",
						description: "Weight async design sharebacks and prototype feedback highest.",
					},
					{
						id: "calendar-cadence",
						label: "Calendar cadence first",
						description: "Weight recurring meetings and weekly rhythms highest.",
					},
				],
			},
			{
				id: "conservatism",
				label: "How conservative should Studio be before creating an agent?",
				description: "This decides what gets created versus skipped or deferred.",
				required: true,
				kind: "single-select",
				placeholder: "Describe another confidence level",
				options: [
					{
						id: "conservative",
						label: "Conservative create, defer weak signals",
						description: "Create only when recurrence and trigger/action fit are clear.",
						recommended: true,
					},
					{
						id: "balanced",
						label: "Balanced",
						description: "Create strong candidates and keep lower-confidence ones as follow-ups.",
					},
					{
						id: "aggressive",
						label: "Create more drafts",
						description: "Prefer more draft agents even if some need later refinement.",
					},
				],
			},
		],
		toolCallId,
		deferredToolCallId: toolCallId,
		tool_call_id: toolCallId,
	};
}

function buildStudioAutomationDiscoveryFollowupQuestionCardPayload({
	sessionId = createStudioAutomationDiscoverySessionId(DEMO_FOLLOWUP_QUESTION_SESSION_ID),
	toolCallId,
} = {}) {
	return {
		type: "question-card",
		sessionId,
		round: 2,
		maxRounds: 2,
		title: DEMO_FOLLOWUP_QUESTION_TITLE,
		description: "Studio found five plausible workflows and needs one more boundary check before creating drafts.",
		directive: "Use the recommended defaults to keep the flow focused on three rich agent drafts.",
		requiredCount: 3,
		questions: [
			{
				id: "creation-boundary",
				label: "Which candidates should become drafts now?",
				description: "This decides whether Studio creates only the strongest candidates or broadens the first pass.",
				required: true,
				kind: "single-select",
				placeholder: "Describe another creation boundary",
				options: [
					{
						id: "create-high-confidence-three",
						label: "Create the high-confidence three",
						description: "Create only the three candidates with clear recurrence, triggers, and safe review boundaries.",
						recommended: true,
					},
					{
						id: "loom-and-lifecycle-first",
						label: "Create Loom and lifecycle first",
						description: "Create two operational drafts now and leave weekly synthesis as a follow-up.",
					},
					{
						id: "create-all-candidates",
						label: "Create every plausible candidate",
						description: "Also draft lower-confidence design-support and Atlas-sync variants.",
					},
				],
			},
			{
				id: "approval-boundary",
				label: "How should risky actions behave?",
				description: "This sets the action boundary for posting, closing tickets, and publishing updates.",
				required: true,
				kind: "single-select",
				placeholder: "Describe another approval model",
				options: [
					{
						id: "draft-for-approval",
						label: "Draft for approval only",
						description: "Prepare posts, DMs, ticket changes, and Atlas updates but require approval before action.",
						recommended: true,
					},
					{
						id: "low-risk-autoclose",
						label: "Allow low-risk auto-close",
						description: "Let lifecycle triage close obvious prototype cleanup tickets automatically.",
					},
					{
						id: "no-autonomous-actions",
						label: "No autonomous actions",
						description: "Keep every output as a recommendation or draft.",
					},
				],
			},
			{
				id: "hero-moment",
				label: "What should the final moment emphasize?",
				description: "This keeps the presentation ending crisp.",
				required: true,
				kind: "single-select",
				placeholder: "Describe another ending emphasis",
				options: [
					{
						id: "generated-agent-drafts",
						label: "Generated agent drafts",
						description: "Make the three clickable Studio drafts the hero moment.",
						recommended: true,
					},
					{
						id: "evidence-and-skips",
						label: "Evidence, skips, and deferrals",
						description: "Emphasize why Studio created some agents and deliberately skipped others.",
					},
					{
						id: "differences-between-agents",
						label: "Differences between the agents",
						description: "Emphasize how each draft uses a different automation primitive.",
					},
				],
			},
		],
		toolCallId,
		deferredToolCallId: toolCallId,
		tool_call_id: toolCallId,
	};
}

function normalizeAnswerLookupKey(value) {
	return getNonEmptyString(value)
		?.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.replace(/\s+/g, " ")
		.trim() || null;
}

function pickAnswerLabel(answers, questionId, fallback) {
	const value = answers && typeof answers === "object" ? answers[questionId] : null;
	const allowedLabels = CLARIFICATION_LABELS_BY_QUESTION[questionId];
	const normalize = (candidate) => {
		const key = normalizeAnswerLookupKey(candidate);
		if (!key) {
			return null;
		}
		return allowedLabels?.get(key) || null;
	};
	if (Array.isArray(value)) {
		return normalize(value[0]) || fallback;
	}
	return normalize(value) || fallback;
}

function resolveStudioAutomationDiscoveryAnswers(clarificationSubmission) {
	const answers = clarificationSubmission?.answers || {};
	return {
		priority: pickAnswerLabel(answers, "priority", "Operational impact"),
		sourceWeighting: pickAnswerLabel(answers, "source-weighting", "TWG plus Confluence, Jira, Slack"),
		conservatism: pickAnswerLabel(answers, "conservatism", "Conservative create, defer weak signals"),
	};
}

function resolveStudioAutomationDiscoveryFollowupAnswers(clarificationSubmission) {
	const answers = clarificationSubmission?.answers || {};
	return {
		creationBoundary: pickAnswerLabel(answers, "creation-boundary", "Create the high-confidence three"),
		approvalBoundary: pickAnswerLabel(answers, "approval-boundary", "Draft for approval only"),
		heroMoment: pickAnswerLabel(answers, "hero-moment", "Generated agent drafts"),
	};
}

function createContentRow(content, input, outputPreview) {
	return { content, input, outputPreview };
}

function buildStudioAutomationDiscoveryTrace({
	clarificationSubmission,
	followupSubmission,
	phase = "complete",
} = {}) {
	const resolvedAnswers = resolveStudioAutomationDiscoveryAnswers(clarificationSubmission);
	const resolvedFollowupAnswers = resolveStudioAutomationDiscoveryFollowupAnswers(followupSubmission);
	const traceId = `studio-automation-discovery-${Date.now()}`;
	const discoveryTrace = [
		{
			toolName: "identity.resolve_user",
			toolCallId: `${traceId}-identity`,
			label: "Resolving current user",
			contentRows: [
				createContentRow(
					"Confirming your Studio identity before reading recent work.",
					{ query: "me", source: "Teamwork Graph identity" },
					`Current Studio user (${DEMO_USER.email})`,
				),
			],
			input: { query: "me" },
			outputPreview: `Current Studio user, ${DEMO_USER.role}`,
			delayMs: 1200,
		},
		{
			toolName: "teamwork_graph.get_work_summary_for_user",
			toolCallId: `${traceId}-work-summary`,
			label: "Pulling 30-day activity",
			contentRows: [
				createContentRow(
					"Scanning your recent work window across connected Atlassian activity.",
					{
						userId: DEMO_USER.ari,
						startTime: "2026-05-17T00:00:00Z",
						endTime: "2026-06-16T23:59:59Z",
					},
					"Found Loom-forward design iteration, Confluence/Atlas updates, Slack coordination, and Jira lifecycle cleanup.",
				),
				createContentRow(
					"Ranking activity by recurrence and trigger-to-action fit.",
					{ priority: resolvedAnswers.priority },
					"Highest recurrence: Loom distribution, weekly digests, and agent cleanup triage.",
				),
			],
			input: { userId: DEMO_USER.ari, window: "30d" },
			outputPreview: "30-day work profile loaded.",
			delayMs: 1700,
		},
		{
			toolName: "parallel.source_scan",
			toolCallId: `${traceId}-source-scan`,
			label: "Scanning source apps",
			contentRows: [
				createContentRow(
					"Running source scans in parallel across the systems named in the prompt.",
					{ sources: ["Slack", "Jira", "Confluence", "Loom", "Figma", "GitHub", "Calendar"] },
					"Source scan complete: strong signals in Loom, Slack, Confluence/Atlas, and Jira.",
				),
				createContentRow(
					"Cycling through each source to separate recurring workflow signals from one-off collaboration.",
					{ cycle: ["Slack channels", "Jira tickets", "Confluence pages", "Loom videos", "Figma files", "GitHub activity"] },
					"One-off design exploration separated from repeated distribution, triage, and update loops.",
				),
			],
			input: { sources: ["Slack", "Jira", "Confluence", "Loom", "Figma", "GitHub", "Calendar"] },
			outputPreview: "Parallel source scan complete.",
			delayMs: 2600,
		},
		{
			toolName: "loom.scan_recent_videos",
			toolCallId: `${traceId}-loom`,
			label: "Reading Loom sharebacks",
			contentRows: [
				createContentRow(
					"Looking for repeated async design-shareback loops.",
					{ examples: ["Agent builder - 5 Jun", "Agent builder - 9 Jun", "Agent builder - 12 Jun"] },
					"Pattern found: new Looms every 3-4 days followed by manual Slack, stakeholder, and Atlas distribution.",
				),
				createContentRow(
					"Checking each Loom against the channels and projects it later touched.",
					{ cycle: ["Loom", "Slack sprint channels", "Stakeholder DMs", "Atlas project updates"] },
					"The same post-shareback routing happens often enough for a distribution primitive.",
				),
			],
			input: { creator: DEMO_USER.email, window: "30d" },
			outputPreview: "Loom distribution is the strongest repeated workflow.",
			delayMs: 2900,
		},
		{
			toolName: "jira.search_agent_reaper",
			toolCallId: `${traceId}-jira`,
			label: "Checking lifecycle tickets",
			contentRows: [
				createContentRow(
					"Checking whether Jira activity is product delivery work or a repeatable lifecycle batch.",
					{ jql: "assignee = currentUser() AND updated >= -30d AND reporter = agent-reaper-bot" },
					"Pattern found: 15 inactive-agent cleanup tickets are a low-risk triage automation candidate.",
				),
				createContentRow(
					"Cross-checking reaper tickets against active project and prototype signals.",
					{ cycle: ["Jira", "Studio agent inventory", "TWG project edges", "Slack approval summary"] },
					"Lifecycle triage has a clear trigger and a review boundary for ambiguous agents.",
				),
			],
			input: { assignee: DEMO_USER.accountId, reporter: "agent-reaper-bot" },
			outputPreview: "Inactive agent triage is a quick-win lifecycle workflow.",
			delayMs: 2900,
		},
		{
			toolName: "confluence.atlas_update_scan",
			toolCallId: `${traceId}-confluence`,
			label: "Reviewing updates and docs",
			contentRows: [
				createContentRow(
					"Looking across Confluence, Atlas updates, and sprint-channel summaries for repeated synthesis work.",
					{ projects: ["Agents creation experience vision", "Studio v2", "Rovo powered by Skills"] },
					"Pattern found: weekly sprint and Atlas updates reuse Loom links, design decisions, feedback, and next-focus bullets.",
				),
				createContentRow(
					"Cycling across weekly artifacts to see whether the update shape repeats.",
					{ cycle: ["Confluence", "Atlas", "Slack", "Loom", "Calendar"] },
					"The weekly synthesis pattern repeats, but should stay draft-for-approval.",
				),
			],
			input: { user: "currentUser()", window: "30d" },
			outputPreview: "Weekly synthesis is frequent and draftable.",
			delayMs: 2900,
		},
		{
			toolName: "twg.search_work_patterns",
			toolCallId: `${traceId}-twg`,
			label: "Correlating with Teamwork Graph",
			contentRows: [
				createContentRow(
					"Using TWG as the correlation layer across artifacts, channels, projects, and collaborators.",
					{
						sourceWeighting: resolvedAnswers.sourceWeighting,
						collaborators: ["Kate Archbold", "Luke Ellery", "Sarah Ingles", "Purav Bhardwaj"],
					},
					"TWG grouped three automation-ready workflows and separated weaker candidates needing more evidence.",
				),
				createContentRow(
					"Checking that each candidate has a clear trigger, action set, and review boundary.",
					{ conservatism: resolvedAnswers.conservatism },
					"Create: 3 rich drafts. Skip: broad broadcasts and novel design-support replies. Defer: design crit prep and Atlas sync variants.",
				),
				createContentRow(
					"Pausing before generation because the create/skip boundary affects what Studio drafts next.",
					{ nextStep: DEMO_FOLLOWUP_QUESTION_TITLE },
					"Need one more input round before creating the agents.",
				),
			],
			input: {
				user: DEMO_USER.ari,
				sources: ["TWG", "Loom", "Slack", "Confluence", "Jira", "Atlas"],
			},
			outputPreview: "Three high-confidence automation candidates selected.",
			delayMs: 3600,
		},
		{
			toolName: "studio.rank_automation_candidates",
			toolCallId: `${traceId}-rank`,
			label: "Ranking automation candidates",
			contentRows: [
				createContentRow(
					"Scoring candidates by recurrence, time saved, trigger clarity, and approval safety.",
					{ candidates: ["Loom distribution", "Inactive agent triage", "Weekly sprint/Atlas digest", "Design support triage", "Design crit prep"] },
					"Top three are distinct enough to become separate Studio agents.",
				),
				createContentRow(
					"Separating create-now candidates from candidates that need more evidence.",
					{ createNow: 3, skip: 2, needsEvidence: 2 },
					"Ready to confirm the draft boundary before generation.",
				),
			],
			input: { priority: resolvedAnswers.priority },
			outputPreview: "Three candidates selected pending your boundary check.",
			delayMs: 3200,
		},
	];
	const generationTrace = [
		{
			toolName: "studio.resolve_creation_boundaries",
			toolCallId: `${traceId}-creation-boundaries`,
			label: "Applying draft boundaries",
			contentRows: [
				createContentRow(
					"Applying your boundary choices before draft creation.",
					{
						creationBoundary: resolvedFollowupAnswers.creationBoundary,
						approvalBoundary: resolvedFollowupAnswers.approvalBoundary,
						heroMoment: resolvedFollowupAnswers.heroMoment,
					},
					"Proceeding with three approval-gated drafts and keeping lower-confidence candidates out of the artifact list.",
				),
				createContentRow(
					"Cycling through the final create, skip, and needs-evidence buckets.",
					{
						create: ["Loom distribution", "Inactive agent triage", "Weekly sprint/Atlas digest"],
						skip: ["Design support auto-replies", "Broad stakeholder broadcasts"],
						needsEvidence: ["Design crit prep", "Atlas sync variants"],
					},
					"The final response will keep the generated agents as the hero moment.",
				),
			],
			input: {
				creationBoundary: resolvedFollowupAnswers.creationBoundary,
				approvalBoundary: resolvedFollowupAnswers.approvalBoundary,
			},
			outputPreview: "Draft boundaries resolved.",
			delayMs: 3200,
		},
		{
			toolName: "studio.create_agent_drafts",
			toolCallId: `${traceId}-create-agents`,
			label: "Creating agent drafts",
			contentRows: [
				createContentRow(
					"Creating the Loom Distribution Agent draft.",
					{ primitive: "multi-channel distribution", trigger: "new Loom from your account" },
					"Drafted Loom summary, Slack routing, stakeholder FYI, and Atlas update approval flow.",
				),
				createContentRow(
					"Creating the Inactive Agent Triage Agent draft.",
					{ primitive: "lifecycle triage", trigger: "agent-reaper-bot Jira issue" },
					"Drafted keep-list checks, low-risk auto-close rules, and review escalation summary.",
				),
				createContentRow(
					"Creating the Weekly Sprint/Atlas Digest Agent draft.",
					{ primitive: "weekly synthesis", trigger: "Friday 9am or on demand" },
					"Drafted weekly evidence gathering, sprint update, Atlas update, and approval guardrails.",
				),
			],
			input: { draftCount: 3 },
			outputPreview: "Three Studio agent drafts created.",
			delayMs: 9200,
		},
	];
	if (phase === "discovery") {
		return discoveryTrace;
	}
	if (phase === "generation") {
		return generationTrace;
	}
	return [...discoveryTrace, ...generationTrace];
}

function buildStudioAutomationDiscoveryWidgetPayload() {
	return buildStudioAutomationDiscoveryDataWidgetPayload({ widgetType: DEMO_WIDGET_TYPE });
}

function buildStudioAutomationDiscoveryFinalText() {
	return [
		"Found three high-confidence automation opportunities in your recent work patterns.",
		"",
		"**Created or extended**",
		"- Loom Distribution Agent: drafts multi-channel sharebacks when you publish a design Loom.",
		"- Inactive Agent Triage Agent: handles low-risk agent-reaper-bot cleanup and escalates only uncertain tickets.",
		"- Weekly Sprint/Atlas Digest Agent: drafts sprint and Atlas updates from Loom, Confluence, Slack, Jira, and calendar signals.",
		"",
		"**Deliberately skipped**",
		"- Design support auto-replies because those answers need your product judgment.",
		"- Broad stakeholder broadcasts because the audience rules are not specific enough yet.",
		"",
		"**Needs more evidence before creation**",
		"- Design crit prep and Atlas sync variants need clearer recurrence and source-confidence signals before becoming agents.",
	].join("\n");
}

module.exports = {
	DEMO_QUESTION_TOOL_NAME,
	DEMO_SESSION_PREFIX,
	DEMO_WIDGET_TYPE,
	buildStudioAutomationDiscoveryFinalText,
	buildStudioAutomationDiscoveryFollowupQuestionCardPayload,
	buildStudioAutomationDiscoveryQuestionCardPayload,
	buildStudioAutomationDiscoveryTrace,
	buildStudioAutomationDiscoveryWidgetPayload,
	isStudioAutomationDiscoveryDismissalPrompt,
	isStudioAutomationDiscoveryFollowupDismissalPrompt,
	isStudioAutomationDiscoveryFollowupSession,
	isStudioAutomationDiscoveryInitialDismissalPrompt,
	isStudioAutomationDiscoveryInitialSession,
	isStudioAutomationDiscoveryPrompt,
	isStudioAutomationDiscoverySession,
	resolveStudioAutomationDiscoveryAnswers,
	resolveStudioAutomationDiscoveryFollowupAnswers,
};
