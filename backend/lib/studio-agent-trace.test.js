const test = require("node:test");
const assert = require("node:assert/strict");
const {
	buildStudioAgentCreationTrace,
	__internals: {
		detectMentionedTools,
		parseTemplateSetupFromContext,
		connectableProvidersFromTriggers,
		joinNames,
		summarizeQAExchange,
		deriveAgentNameHint,
		deriveAgentBriefFocus,
		buildProgressionRows,
		MIN_PROGRESSION_ROWS,
		MAX_PROGRESSION_ROWS,
		truncate,
	},
} = require("./studio-agent-trace");

const TEMPLATE_CONTEXT = [
	"[Template context]",
	"- Setup for narration (display names): tools=[Confluence, Jira]; skills=[Explore ideas, Prioritize ideas]; knowledge=[Confluence, Jira]; subagents=[Strategic insight, Feedback analyzer]; modes=[deep step-by-step reasoning, memory across sessions, all connected knowledge]",
	"- Trigger events for narration: A new DACI doc is shared in Confluence | An alert pages on-call in PagerDuty",
	"[End template context]",
].join("\n");

test("turn 1 stops at the clarification round with an open ask step", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a research agent.",
		messages: [],
	});

	const labels = steps.map((step) => step.label);
	assert.deepEqual(labels, [
		"Reading agent brief",
		"Preparing clarification questions",
	]);
	assert.match(steps[0].content, /research agent/u);

	// The ask step is left "open" (no step-level output) so the trace writer
	// emits no result event and the tool resolves to awaiting-input.
	const askStep = steps.find(
		(step) => step.label === "Preparing clarification questions",
	);
	assert.equal(askStep.toolName, "ask_user_questions");
	assert.equal(askStep.output, undefined);
	assert.equal(askStep.outputPreview, undefined);
});

test("turn 2 emits the full build skeleton with stable ordering", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a research agent.",
		messages: [{ role: "user", content: "Build a research agent." }],
		isFollowUpTurn: true,
	});

	const labels = steps.map((step) => step.label);
	assert.deepEqual(labels, [
		"Reading agent brief",
		"Reviewing agent details",
		"Selecting agent tools",
		"Drafting agent instructions",
		"Naming agent profile",
		"Saving agent profile",
	]);
	const nameStep = steps.find((step) => step.label === "Naming agent profile");
	assert.match(nameStep.content, /name, byline, and profile-card summary/u);
});

test("first turn ends with the ask_user_questions clarification step", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a research agent.",
		messages: [{ role: "user", content: "Build a research agent." }],
	});

	const clarifyStep = steps.find(
		(step) => step.label === "Preparing clarification questions",
	);
	assert.ok(clarifyStep, "expected a clarification step on the first turn");
	assert.equal(clarifyStep.toolName, "ask_user_questions");
	// Turn 1 stops at the clarification round — no build steps yet, and the ask
	// step is the final step so the turn ends awaiting the user.
	const labels = steps.map((step) => step.label);
	assert.equal(labels.includes("Drafting agent instructions"), false);
	assert.equal(labels[labels.length - 1], "Preparing clarification questions");
});

test("isFollowUpTurn override forces the build steps even with empty history", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a research agent.",
		messages: [],
		isFollowUpTurn: true,
	});
	const labels = steps.map((step) => step.label);
	assert.equal(labels.includes("Preparing clarification questions"), false);
	for (const buildLabel of [
		"Selecting agent tools",
		"Drafting agent instructions",
		"Naming agent profile",
		"Saving agent profile",
	]) {
		assert.ok(labels.includes(buildLabel), `expected ${buildLabel}`);
	}
});

test("isFollowUpTurn=false override forces the turn-1 ask flow even with prior assistant turns", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "AI research",
		messages: [
			{ role: "user", content: "Build a research agent." },
			{ role: "assistant", content: "What domain should it focus on?" },
		],
		isFollowUpTurn: false,
	});
	const labels = steps.map((step) => step.label);
	assert.deepEqual(labels, [
		"Reading agent brief",
		"Preparing clarification questions",
	]);
});

test("follow-up turns omit the ask_user_questions clarification step", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "AI research, focused on papers.",
		messages: [
			{ role: "user", content: "Build a research agent." },
			{ role: "assistant", content: "What domain should it focus on?" },
		],
	});

	const labels = steps.map((step) => step.label);
	assert.equal(labels.includes("Preparing clarification questions"), false);
	assert.equal(
		steps.some((step) => step.toolName === "ask_user_questions"),
		false,
	);
});

test("buildStudioAgentCreationTrace inserts 'Reviewing agent details' when a prior assistant question exists", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Frontend bugs, please.",
		messages: [
			{ role: "user", content: "Make me a triage agent." },
			{ role: "assistant", content: "What domain should it focus on?" },
		],
	});

	const labels = steps.map((step) => step.label);
	assert.deepEqual(labels, [
		"Reading agent brief",
		"Reviewing agent details",
		"Selecting agent tools",
		"Drafting agent instructions",
		"Naming agent profile",
		"Saving agent profile",
	]);

	const reviewStep = steps[1];
	assert.match(reviewStep.content, /agent profile draft/u);
	assert.match(reviewStep.outputPreview, /What domain/);
	assert.match(reviewStep.outputPreview, /Frontend bugs/);
});

test("buildStudioAgentCreationTrace skips 'Reviewing agent details' when there is no prior assistant turn", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Make me an agent.",
		messages: [{ role: "user", content: "Hi" }],
	});

	const labels = steps.map((step) => step.label);
	assert.equal(labels.includes("Reviewing agent details"), false);
});

test("each step has the shape writeThinkingTraceSteps consumes", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a Confluence summarizer agent.",
	});

	for (const step of steps) {
		assert.equal(typeof step.toolName, "string");
		assert.equal(typeof step.toolCallId, "string");
		assert.equal(typeof step.label, "string");
		assert.ok(step.toolCallId.length > 0);
		assert.ok(step.label.length > 0);
	}
});

test("detectMentionedTools picks up multi-tool prompts", () => {
	assert.deepEqual(
		detectMentionedTools("Pull Jira issues, post to Slack, drop a Confluence page."),
		["Jira", "Confluence", "Slack"],
	);
});

test("detectMentionedTools returns empty when no integrations are mentioned", () => {
	assert.deepEqual(detectMentionedTools("Just a friendly chat agent."), []);
});

test("detectMentionedTools handles empty/non-string input safely", () => {
	assert.deepEqual(detectMentionedTools(""), []);
	assert.deepEqual(detectMentionedTools(undefined), []);
	assert.deepEqual(detectMentionedTools(null), []);
});

test("Selecting tools step reflects detected integrations in the input + preview", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "An agent that watches GitHub PRs and pings Slack on review requests.",
		isFollowUpTurn: true,
	});
	const selectStep = steps.find((s) => s.label === "Selecting agent tools");
	assert.ok(selectStep);
	assert.deepEqual(selectStep.input.selected.sort(), ["GitHub", "Slack"].sort());
	assert.match(selectStep.outputPreview, /GitHub/);
	assert.match(selectStep.outputPreview, /Slack/);
});

test("Selecting tools step reports a sensible fallback when no integrations are mentioned", () => {
	const steps = buildStudioAgentCreationTrace({ userPrompt: "Just a helpful tutor.", isFollowUpTurn: true });
	const selectStep = steps.find((s) => s.label === "Selecting agent tools");
	assert.match(selectStep.outputPreview, /tool-neutral/i);
});

test("deriveAgentNameHint extracts an explicit '<adjective> agent' phrase from the prompt", () => {
	assert.equal(deriveAgentNameHint("Build a research-briefing agent please"), "research-briefing agent");
	assert.equal(deriveAgentNameHint("I need a Jira triage agent"), "Jira triage agent");
});

test("deriveAgentNameHint falls back to a verb-based summary when no explicit pattern is present", () => {
	const hint = deriveAgentNameHint("It summarizes weekly standups for the team");
	assert.match(hint, /agent that summari/i);
});

test("deriveAgentNameHint returns the generic placeholder when nothing matches", () => {
	assert.equal(deriveAgentNameHint(""), "an agent");
	assert.equal(deriveAgentNameHint(undefined), "an agent");
});

test("deriveAgentBriefFocus keeps trace copy contextual to the requested agent", () => {
	assert.equal(deriveAgentBriefFocus("Build a Jira triage agent for support."), "Jira triage agent");
	// A short, single-clause brief with no explicit "X agent" name is reused as-is.
	assert.equal(
		deriveAgentBriefFocus("Track weekly release readiness"),
		"Track weekly release readiness",
	);
	assert.equal(deriveAgentBriefFocus(""), "the agent");
});

test("deriveAgentBriefFocus falls back to a generic focus for long or structured briefs", () => {
	// Too long to read as a single-line subtitle → generic focus, not a truncated dump.
	assert.equal(
		deriveAgentBriefFocus(
			"Track weekly release readiness across the frontend platform team and surface blockers early.",
		),
		"the agent",
	);
	// Multi-sentence prose → generic focus.
	assert.equal(
		deriveAgentBriefFocus("Do this thing. Then do that thing."),
		"the agent",
	);
});

test("deriveAgentBriefFocus stays short enough for a single-line subtitle", () => {
	const focus = deriveAgentBriefFocus(
		"Track weekly release readiness across the frontend platform team and surface blockers early.",
	);
	assert.ok(focus.length <= 48, `expected focus <= 48 chars, got ${focus.length}: ${focus}`);
});

test("deriveAgentBriefFocus ignores the clarification-answers payload from follow-up turns", () => {
	const followUp =
		'Here are my clarification answers for "Answer these questions to continue": - Who is the audience? Support agents. - Tone? Friendly.';
	assert.equal(deriveAgentBriefFocus(followUp), "the agent");
});

test("buildProgressionRows always leads with the primary row and appends in order", () => {
	const primary = { content: "primary" };
	const detail = [{ content: "A" }, { content: "B" }, { content: "C" }];
	// random() = 0 → 0 extra rows
	assert.deepEqual(buildProgressionRows(primary, detail, () => 0), [primary]);
	// random() ≈ 1 → max extra rows (capped at 3 so total ≤ 4)
	assert.deepEqual(buildProgressionRows(primary, detail, () => 0.999), [
		primary,
		{ content: "A" },
		{ content: "B" },
		{ content: "C" },
	]);
	// Empty detail → only the primary row.
	assert.deepEqual(buildProgressionRows(primary, [], () => 0.999), [primary]);
	// Blank/invalid detail rows are skipped, never shrinking below the primary.
	assert.deepEqual(
		buildProgressionRows(primary, [{ content: "" }, { content: "  " }], () => 0.999),
		[primary],
	);
});

test("buildProgressionRows never exceeds the 1–4 row bounds across the random range", () => {
	const primary = { content: "primary" };
	const detail = ["A", "B", "C", "D", "E", "F"].map((content) => ({ content }));
	for (let i = 0; i <= 20; i += 1) {
		const rows = buildProgressionRows(primary, detail, () => i / 20);
		assert.ok(
			rows.length >= MIN_PROGRESSION_ROWS && rows.length <= MAX_PROGRESSION_ROWS,
			`row count ${rows.length} out of bounds for random ${i / 20}`,
		);
		assert.equal(rows[0], primary);
	}
});

test("buildStudioAgentCreationTrace attaches 1–4 stacked contentRows per step", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a Jira triage agent",
		isFollowUpTurn: true,
		random: () => 0.999,
	});
	for (const step of steps) {
		assert.ok(Array.isArray(step.contentRows), `${step.label} should have contentRows`);
		assert.ok(
			step.contentRows.length >= 1 && step.contentRows.length <= 4,
			`${step.label} contentRows out of bounds: ${step.contentRows.length}`,
		);
		// Each row is a structured { content, ... } object.
		for (const row of step.contentRows) {
			assert.equal(typeof row.content, "string");
			assert.ok(row.content.trim().length > 0, `${step.label} has a blank row`);
		}
		// content stays in sync with the lead row's text for single-string consumers.
		assert.equal(step.content, step.contentRows[0].content);
	}
});

test("summarizeQAExchange combines the most recent assistant question and the user's current answer", () => {
	const summary = summarizeQAExchange(
		[
			{ role: "user", content: "First message" },
			{ role: "assistant", content: "Got it — which team owns this?" },
		],
		"Frontend platform.",
	);
	assert.match(summary, /which team/);
	assert.match(summary, /Frontend platform/);
});

test("summarizeQAExchange ignores assistant turns without question marks", () => {
	const summary = summarizeQAExchange(
		[{ role: "assistant", content: "Sounds good." }],
		"Frontend platform.",
	);
	// Falls back to just the answer.
	assert.match(summary, /Frontend platform/);
	assert.equal(/Sounds good/.test(summary), false);
});

test("truncate adds an ellipsis only when content exceeds the limit", () => {
	assert.equal(truncate("short", 50), "short");
	const long = "a".repeat(200);
	const truncated = truncate(long, 50);
	assert.equal(truncated.length, 50);
	assert.equal(truncated.endsWith("…"), true);
});

test("toolCallIds are unique within a single trace so generated eventIds don't collide", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "Build a research agent.",
		messages: [{ role: "assistant", content: "What domain?" }, { role: "user", content: "AI" }],
	});
	const ids = steps.map((s) => s.toolCallId);
	assert.equal(new Set(ids).size, ids.length, `expected unique toolCallIds, got ${ids.join(", ")}`);
});

test("parseTemplateSetupFromContext extracts exact names, modes, and triggers", () => {
	const setup = parseTemplateSetupFromContext(TEMPLATE_CONTEXT);
	assert.ok(setup, "should parse a template context");
	assert.deepEqual(setup.tools, ["Confluence", "Jira"]);
	assert.deepEqual(setup.skills, ["Explore ideas", "Prioritize ideas"]);
	assert.deepEqual(setup.subagents, ["Strategic insight", "Feedback analyzer"]);
	assert.equal(setup.modes.length, 3);
	assert.deepEqual(setup.triggers, [
		"A new DACI doc is shared in Confluence",
		"An alert pages on-call in PagerDuty",
	]);
	// From-scratch (no template context) returns null so the caller falls back.
	assert.equal(parseTemplateSetupFromContext(""), null);
	assert.equal(parseTemplateSetupFromContext("just a plain brief"), null);
});

test("connectableProvidersFromTriggers picks providers that require connection", () => {
	assert.deepEqual(
		connectableProvidersFromTriggers(["An alert pages on-call in PagerDuty", "A message in #launch"]),
		["Slack", "PagerDuty"],
	);
	// Jira/Confluence/scheduled don't require connection.
	assert.deepEqual(connectableProvidersFromTriggers(["A Jira issue is created"]), []);
});

test("joinNames renders an oxford-comma list", () => {
	assert.equal(joinNames(["A"]), "A");
	assert.equal(joinNames(["A", "B"]), "A and B");
	assert.equal(joinNames(["A", "B", "C"]), "A, B, and C");
});

test("build turn narrates the real template setup (names, connect, triggers, modes)", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "build it",
		contextDescription: TEMPLATE_CONTEXT,
		isFollowUpTurn: true,
	});
	const labels = steps.map((s) => s.label);
	assert.ok(labels.includes("Selecting agent tools"));
	assert.ok(labels.includes("Connecting integrations"), "connect step present when triggers name a connectable provider");
	assert.ok(labels.includes("Configuring triggers"), "configure-triggers step present");

	const select = steps.find((s) => s.label === "Selecting agent tools");
	assert.match(select.content, /Confluence/);
	assert.match(select.content, /Explore ideas/);

	const connect = steps.find((s) => s.label === "Connecting integrations");
	assert.match(connect.content, /PagerDuty/);

	const draft = steps.find((s) => s.label === "Drafting agent instructions");
	const draftRows = draft.contentRows.map((r) => r.content).join(" ");
	assert.match(draftRows, /Confluence|Jira/); // knowledge grounding row
});

test("from-scratch build turn falls back to prompt-keyword narration", () => {
	const steps = buildStudioAgentCreationTrace({
		userPrompt: "an agent that watches Jira",
		contextDescription: "",
		isFollowUpTurn: true,
	});
	const labels = steps.map((s) => s.label);
	assert.ok(labels.includes("Selecting agent tools"));
	assert.equal(labels.includes("Connecting integrations"), false);
	assert.equal(labels.includes("Configuring triggers"), false);
});
