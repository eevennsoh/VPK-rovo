const test = require("node:test");
const assert = require("node:assert/strict");
const {
	AGENT_RESULT_STREAM_PREFIX,
	MISSING_STUDIO_AGENT_RESULT_ERROR_CODE,
	buildCreationModeContextPrefix,
	buildMissingStudioAgentResultFailureParts,
	extractStudioAgentResultFromText,
	normalizeStudioAgentResult,
	shouldSurfaceMissingStudioAgentResultFailure,
} = require("./studio-agent-result");

test("normalizes a structured Studio agent definition into data-agent-result fields", () => {
	const result = normalizeStudioAgentResult({
		agent: {
			id: "research-briefing-agent",
			name: "Research Briefing Agent",
			sourceLabel: "Generated in Studio",
			description: "Builds concise research briefs from project context.",
			instructions: "Read the supplied context, identify source gaps, and return a sourced briefing.",
			starters: [
				{ label: "Create a launch brief from this context." },
				{ prompt: "Summarize the top three research gaps." },
				"Draft follow-up questions for stakeholders.",
				"Map research blockers to action owners.",
			],
			avatarFallback: {
				initials: "RB",
				backgroundColor: "blue",
			},
			tools: ["Teamwork Graph", "Jira work items"],
		},
	});

	assert.deepEqual(result, {
		agentId: "research-briefing-agent",
		name: "Research Briefing Agent",
		byline: "Generated in Studio",
		sourceLabel: "Generated in Studio",
		description: "Builds concise research briefs from project context.",
		summary: "Builds concise research briefs from project context.",
		instructions: "Read the supplied context, identify source gaps, and return a sourced briefing.",
		contextDescription: "Read the supplied context, identify source gaps, and return a sourced briefing.",
		conversationStarters: [
			"Create a launch brief from this context.",
			"Summarize the top three research gaps.",
			"Draft follow-up questions for stakeholders.",
		],
		avatarFallback: {
			initials: "RB",
			backgroundColor: "blue",
		},
		tools: ["Teamwork Graph", "Jira work items"],
		action: "create",
	});
});

test("derives stable defaults for generated Studio agent definitions", () => {
	const result = normalizeStudioAgentResult({
		name: "Content QA",
		description: "Checks docs and launch copy for quality.",
		context: "Review content for completeness, risk, and tone.",
		conversationStarters: ["Check this launch post."],
	});

	assert.equal(result.agentId, "studio-agent-content-qa");
	assert.equal(result.byline, "Custom agent by You");
	assert.deepEqual(result.avatarFallback, { initials: "CQ" });
	assert.equal(result.action, "create");
});

test("normalizes optional trigger and guardrail fields", () => {
	const result = normalizeStudioAgentResult({
		name: "Deploy Watcher",
		description: "Watches deploys.",
		instructions: "Watch deploy pipelines and alert on failures.",
		conversationStarters: ["Check the latest deploy."],
		tools: ["Bitbucket"],
		trigger: "When a deploy fails",
		guardrail: "Never trigger a rollback without confirmation",
	});

	assert.equal(result.trigger, "When a deploy fails");
	assert.equal(result.guardrail, "Never trigger a rollback without confirmation");
	assert.deepEqual(result.tools, ["Bitbucket"]);
});

test("extracts an AGENT_RESULT marker and removes it from visible text", () => {
	const payload = {
		name: "Ops Triage",
		description: "Triages operational incidents.",
		instructions: "Classify impact, identify owners, and propose next actions.",
		conversationStarters: ["Triage this incident.", "Find the next owner."],
	};
	const extracted = extractStudioAgentResultFromText([
		"Created the profile.",
		`${AGENT_RESULT_STREAM_PREFIX} ${JSON.stringify(payload)}`,
		"Ready to chat.",
	].join("\n"));

	assert.equal(extracted.source, "marker");
	assert.equal(extracted.cleanedText, "Created the profile.\nReady to chat.");
	assert.equal(extracted.payload.agentId, "studio-agent-ops-triage");
	assert.equal(extracted.payload.name, "Ops Triage");
	assert.equal(extracted.payload.action, "create");
});

test("rejects incomplete Studio agent definitions", () => {
	assert.equal(
		normalizeStudioAgentResult({
			name: "Missing Instructions",
			description: "Has no instructions or starters.",
		}),
		null,
	);
	assert.equal(extractStudioAgentResultFromText("Just prose without structured JSON."), null);
});

test("agent creation guidance uses structured result output instead of plan persistence", () => {
	const agentPrefix = buildCreationModeContextPrefix("agent");
	const skillPrefix = buildCreationModeContextPrefix("skill");

	assert.match(agentPrefix, /AGENT_RESULT:/u);
	assert.match(agentPrefix, /Do not call POST \/api\/plan\/agents/u);
	assert.doesNotMatch(agentPrefix, /Once ready, call POST \/api\/plan\/agents/u);
	// Always run one focused clarification round (adaptive up to two), rather
	// than only asking when fields are missing.
	assert.match(agentPrefix, /run ONE focused clarification round FIRST using the ask_user_questions tool/u);
	assert.match(agentPrefix, /never exceed 2 rounds/u);
	assert.doesNotMatch(agentPrefix, /Ask clarifying questions only when required profile fields are missing/u);
	// Richer agents: the result example must request tools, trigger, and guardrail.
	assert.match(agentPrefix, /"tools":\["Jira","Confluence"\]/u);
	assert.match(agentPrefix, /"trigger":/u);
	assert.match(agentPrefix, /"guardrail":/u);
	assert.match(skillPrefix, /Once ready, call POST \/api\/plan\/skills/u);
});

test("missing Studio agent result failure is scoped and retryable", () => {
	assert.equal(
		shouldSurfaceMissingStudioAgentResultFailure({
			creationMode: "agent",
			hasAgentResult: false,
			hasDeferredToolRequest: false,
			hasPlanWidget: false,
			hasQuestionCard: false,
		}),
		true,
	);
	assert.equal(
		shouldSurfaceMissingStudioAgentResultFailure({
			creationMode: "agent",
			hasAgentResult: false,
			hasDeferredToolRequest: false,
			hasPlanWidget: false,
			hasQuestionCard: true,
		}),
		false,
	);
	assert.equal(
		shouldSurfaceMissingStudioAgentResultFailure({
			creationMode: "skill",
			hasAgentResult: false,
			hasDeferredToolRequest: false,
			hasPlanWidget: false,
			hasQuestionCard: false,
		}),
		false,
	);

	const parts = buildMissingStudioAgentResultFailureParts({ id: "missing-agent-result" });
	assert.equal(parts[0].type, "text-start");
	assert.equal(parts[3].type, "data-widget-error");
	assert.equal(parts[3].data.code, MISSING_STUDIO_AGENT_RESULT_ERROR_CODE);
	assert.equal(parts[3].data.canRetry, true);
	assert.equal(parts[3].data.type, "agent-result");
});
