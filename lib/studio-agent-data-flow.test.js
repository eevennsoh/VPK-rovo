const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	buildAgentDataFlowMermaid,
	buildAgentDataFlowRefinementPrompt,
	extractMemoryReferences,
	extractMermaidCode,
	isValidAgentDataFlowMermaid,
	refineAgentDataFlowMermaid,
} = require("./studio-agent-data-flow");

test("buildAgentDataFlowMermaid includes populated agent setup sections", () => {
	const mermaid = buildAgentDataFlowMermaid({
		name: 'Escalation "Helper"',
		description: "Routes priority work",
		instructions: "Use memory: Support runbook before responding.",
		contextDescription: "Customer support queue",
		trigger: "Ticket enters urgent",
		guardrail: "Never close tickets automatically",
		knowledge: ["Confluence - all content"],
		skills: ["Summarize"],
		tools: ["Jira"],
		subagents: ["Legal reviewer"],
		conversationStarters: ["Draft a response"],
	});

	assert.match(mermaid, /^flowchart LR/u);
	assert.match(mermaid, /Escalation #quot;Helper#quot;/u);
	assert.match(mermaid, /Core setup/u);
	assert.match(mermaid, /Triggers/u);
	assert.match(mermaid, /Knowledge/u);
	assert.match(mermaid, /Memory/u);
	assert.match(mermaid, /Skills/u);
	assert.match(mermaid, /Tools/u);
	assert.match(mermaid, /Subagents/u);
	assert.match(mermaid, /Conversation starters/u);
	assert.match(mermaid, /Support runbook/u);
	assert.equal(isValidAgentDataFlowMermaid(mermaid), true);
});

test("buildAgentDataFlowMermaid omits empty sections and keeps a fallback edge", () => {
	const mermaid = buildAgentDataFlowMermaid({ name: "Blank agent" });

	assert.match(mermaid, /Blank agent/u);
	assert.match(mermaid, /Draft configuration/u);
	assert.doesNotMatch(mermaid, /Knowledge/u);
	assert.equal(isValidAgentDataFlowMermaid(mermaid), true);
});

test("extractMemoryReferences dedupes memory references from instructions", () => {
	assert.deepEqual(
		extractMemoryReferences("Check memory: Support runbook and [[memory: Release notes]] then memory: support runbook."),
		["Support runbook", "Release notes"],
	);
});

test("extractMermaidCode unwraps fences and validates edge-bearing diagrams", () => {
	const fenced = "```mermaid\nflowchart LR\n\ta[\"A\"] --> b[\"B\"]\n```";

	assert.equal(extractMermaidCode(fenced), "flowchart LR\n\ta[\"A\"] --> b[\"B\"]");
	assert.equal(isValidAgentDataFlowMermaid(fenced), true);
	assert.equal(isValidAgentDataFlowMermaid("flowchart LR\n\ta[\"A\"]"), false);
});

test("refineAgentDataFlowMermaid accepts valid model Mermaid and falls back on invalid output", async () => {
	const baselineMermaid = buildAgentDataFlowMermaid({
		name: "Research agent",
		tools: ["Browser"],
	});

	const refined = await refineAgentDataFlowMermaid({
		config: { name: "Research agent" },
		baselineMermaid,
		generateText: async () => "flowchart LR\n\tagent[\"Research\"] --> tools[\"Browser\"]",
	});
	assert.equal(refined.mermaid, "flowchart LR\n\tagent[\"Research\"] --> tools[\"Browser\"]");

	const fallback = await refineAgentDataFlowMermaid({
		config: { name: "Research agent" },
		baselineMermaid,
		generateText: async () => "not mermaid",
	});
	assert.equal(fallback.mermaid, baselineMermaid);
});

test("buildAgentDataFlowRefinementPrompt asks for Mermaid only", () => {
	const prompt = buildAgentDataFlowRefinementPrompt({
		config: { name: "Prompt agent" },
		baselineMermaid: "flowchart LR\n\tagent --> draft",
	});

	assert.match(prompt, /Return Mermaid code only/u);
	assert.match(prompt, /Prompt agent/u);
	assert.match(prompt, /Baseline Mermaid/u);
});
