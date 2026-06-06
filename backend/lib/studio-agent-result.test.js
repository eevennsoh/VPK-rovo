const test = require("node:test");
const assert = require("node:assert/strict");
const {
	AGENT_RESULT_STREAM_PREFIX,
	MISSING_STUDIO_AGENT_RESULT_ERROR_CODE,
	buildCreationModeContextPrefix,
	buildFallbackStudioAgentResult,
	buildMissingStudioAgentResultFailureParts,
	extractStudioAgentResultFromText,
	normalizeStudioAgentResult,
	shouldBoundStudioAgentGatewayCall,
	shouldSurfaceMissingStudioAgentResultFailure,
	tolerantParseJsonObjectAt,
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

// Regression: real /studio failure. The model emitted an AGENT_RESULT marker
// whose long `instructions` value contained UNESCAPED interior double quotes
// (e.g. "Tech Lead", "Design", "PM"). Strict JSON.parse throws on that, which
// previously dead-ended agent creation with the "couldn't create a selectable
// agent profile" banner. The tolerant fallback must now recover it.
const MALFORMED_INSTRUCTIONS = [
	"## Instructions",
	"",
	"You are Work Item Planner, an AI assistant for Project and Program Managers.",
	"",
	"### Output format",
	"",
	'- Suggest placeholder roles (e.g. "Tech Lead", "Design", "PM") rather than named individuals. Never assign a real person as owner without explicit confirmation.',
	"- Format work items so they are ready to copy into Jira, Linear, or a doc with minimal editing.",
].join("\n");

function buildMalformedAgentResultMarkerText() {
	// Produce a valid serialization, then strip the escaping on the three
	// interior quote pairs to mimic exactly what the model streamed.
	const valid = JSON.stringify({
		agentId: "work-item-planner",
		name: "Work Item Planner",
		byline: "Turns projects and recordings into prioritised, sequenced plans",
		description:
			"Breaks large projects, epics, or workstreams into sequenced tasks, owners, and next steps.",
		instructions: MALFORMED_INSTRUCTIONS,
		conversationStarters: [
			"Here's a Google Drive doc for our platform migration — break it into a sequenced plan?",
			"I recorded a Loom walkthrough of a new epic — turn it into a prioritised breakdown?",
			"Map the dependencies and flag any blockers before we start planning?",
		],
		tools: ["Google Drive", "Slack", "Loom"],
		guardrail: "Never assign a real person as a task owner without explicit confirmation from the user.",
		avatarFallback: { initials: "WP" },
		action: "create",
	})
		.replace('\\"Tech Lead\\"', '"Tech Lead"')
		.replace('\\"Design\\"', '"Design"')
		.replace('\\"PM\\"', '"PM"');

	return `Here's your Work Item Planner agent, ready to review.\n\n${AGENT_RESULT_STREAM_PREFIX} ${valid}`;
}

test("recovers an AGENT_RESULT marker with unescaped interior quotes in instructions", () => {
	const text = buildMalformedAgentResultMarkerText();

	// Confirm the embedded JSON really is invalid (the bug precondition).
	const jsonStart = text.indexOf("{");
	assert.throws(() => JSON.parse(text.slice(jsonStart)));

	const extracted = extractStudioAgentResultFromText(text);
	assert.ok(extracted, "expected the tolerant parser to recover the agent result");
	assert.equal(extracted.source, "marker");
	assert.equal(extracted.payload.name, "Work Item Planner");
	assert.equal(extracted.payload.agentId, "work-item-planner");
	assert.equal(extracted.payload.action, "create");
	assert.deepEqual(extracted.payload.tools, ["Google Drive", "Slack", "Loom"]);
	assert.equal(extracted.payload.conversationStarters.length, 3);
	// Interior quotes are preserved verbatim inside the recovered instructions.
	assert.equal(extracted.payload.instructions, MALFORMED_INSTRUCTIONS);
	assert.ok(extracted.payload.instructions.includes('(e.g. "Tech Lead", "Design", "PM")'));
	assert.equal(extracted.cleanedText, "Here's your Work Item Planner agent, ready to review.");
});

test("tolerant parser leaves valid JSON byte-for-byte equal to JSON.parse", () => {
	const valid = JSON.stringify({
		name: "Ops",
		tags: ["a", "b", "c"],
		nested: { ok: true, count: 2 },
		action: "create",
	});
	const tolerant = tolerantParseJsonObjectAt(valid, 0);
	assert.ok(tolerant);
	assert.deepEqual(tolerant.value, JSON.parse(valid));
	assert.equal(valid[tolerant.endIndex], "}");
});

test("tolerant parser does not merge legitimate string arrays", () => {
	// The danger of naive quote-repair: turning ["one","two"] into one string.
	const malformed = '{"note":"call it "phase one", then ship","tools":["one","two","three"]}';
	assert.throws(() => JSON.parse(malformed));
	const tolerant = tolerantParseJsonObjectAt(malformed, 0);
	assert.ok(tolerant);
	assert.equal(tolerant.value.note, 'call it "phase one", then ship');
	assert.deepEqual(tolerant.value.tools, ["one", "two", "three"]);
});

test("tolerant parser returns null for genuinely unrecoverable input", () => {
	assert.equal(tolerantParseJsonObjectAt('{"name":"x","desc":"unterminated', 0), null);
	assert.equal(tolerantParseJsonObjectAt("not an object", 0), null);
});

test("builds a fallback Studio agent result from original brief and clarification answers", () => {
	const result = buildFallbackStudioAgentResult({
		prompt: [
			"Here are my clarification answers for \"Answer these questions to continue\":",
			"",
			"- Where do support requests come from, and where should the agent act?: Jira Service Management",
		].join("\n"),
		messages: [
			{
				role: "user",
				content:
					"Create an agent that triages incoming support requests, asks for missing priority details, and drafts a clear next action for the team.",
			},
			{
				role: "assistant",
				content: "",
			},
		],
		clarificationAnswers: {
			"Where do support requests come from, and where should the agent act?": [
				"Jira Service Management",
			],
			"What priority details should the agent chase down when missing?": [
				"Both severity and repro details",
			],
			"Who is the primary audience for this agent's responses?": [
				"Both — agent talks to reporters and notifies the team",
			],
			"What tone and guardrails should the agent follow?": [
				"Professional & concise",
			],
		},
	});

	assert.equal(result.name, "Support Request Triage Agent");
	assert.equal(result.action, "create");
	assert.equal(result.agentId, "support-request-triage-agent");
	assert.deepEqual(result.tools, ["Jira Service Management"]);
	assert.equal(result.conversationStarters.length, 3);
	assert.match(result.description, /triages incoming support requests/iu);
	assert.match(result.instructions, /Both severity and repro details/u);
	assert.match(result.instructions, /Professional & concise/u);
	assert.doesNotMatch(result.name, /clarification answers/iu);
});

// --- Regression: /studio agent generation must never hang ---
//
// The recurring stuck-generation bug was caused by bounding the AI Gateway
// call only on post-clarification turns. If the gateway call hung on any other
// agent-creation turn, the stream's execute() awaited forever, the SSE
// response never closed, and the Studio UI latched in the "generating" state
// with no agent result and no error. The predicate below must request bounding
// for EVERY agent-creation turn.

test("shouldBoundStudioAgentGatewayCall bounds every agent-creation turn", () => {
	assert.equal(shouldBoundStudioAgentGatewayCall({ creationMode: "agent" }), true);
});

test("shouldBoundStudioAgentGatewayCall does not bound non-agent turns", () => {
	assert.equal(shouldBoundStudioAgentGatewayCall({ creationMode: "skill" }), false);
	assert.equal(shouldBoundStudioAgentGatewayCall({ creationMode: undefined }), false);
	assert.equal(shouldBoundStudioAgentGatewayCall({}), false);
	assert.equal(shouldBoundStudioAgentGatewayCall(), false);
});

test("a never-resolving gateway call still terminates and yields a fallback agent result", async () => {
	// Mirror the server's bounding semantics: race the (hung) gateway call
	// against a short timeout, then build the deterministic fallback. This
	// proves the turn terminates even when the gateway never resolves.
	const TIMEOUT_MS = 20;
	const neverResolvingGatewayCall = new Promise(() => {});

	const withFallbackTimeout = (promise, timeoutMs) => {
		let timeoutHandle = null;
		const timeoutPromise = new Promise((resolve) => {
			timeoutHandle = setTimeout(
				() => resolve({ timedOut: true, value: "" }),
				timeoutMs,
			);
		});
		const tracked = promise.then(
			(value) => ({ timedOut: false, value }),
			(error) => {
				throw error;
			},
		);
		return Promise.race([tracked, timeoutPromise]).finally(() => {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}
		});
	};

	assert.equal(shouldBoundStudioAgentGatewayCall({ creationMode: "agent" }), true);

	const boundedGatewayCallPromise = withFallbackTimeout(
		neverResolvingGatewayCall,
		TIMEOUT_MS,
	);
	// The self-bounded trace promise the server runs in parallel.
	const scriptedTracePromise = new Promise((resolve) => setTimeout(resolve, 5));

	const [gatewayCallResult] = await Promise.all([
		boundedGatewayCallPromise,
		scriptedTracePromise,
	]);

	assert.equal(gatewayCallResult.timedOut, true);

	// With the bounded call resolved, the server builds a deterministic
	// fallback agent result so a data-agent-result is always emitted.
	const fallback = buildFallbackStudioAgentResult({
		prompt: "Create an agent that drafts release notes from merged PRs.",
		messages: [
			{
				role: "user",
				content: "Create an agent that drafts release notes from merged PRs.",
			},
			{ role: "assistant", content: "" },
		],
		clarificationAnswers: null,
	});

	assert.ok(fallback);
	assert.ok(typeof fallback.name === "string" && fallback.name.length > 0);
	assert.ok(
		typeof fallback.description === "string" && fallback.description.length > 0,
	);
	assert.ok(Array.isArray(fallback.conversationStarters));

	// And if no result and no clarification were produced, the failure surface
	// fires so the user gets a retryable error instead of an endless spinner.
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
});
