const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildStudioAgentCreationContext,
	buildStudioAgentCreationContinuationContext,
	buildCreationTemplateContextFromAgent,
	buildCreationTemplateContextFromStarter,
} = require("./studio-agent-creation-context.ts");

test("buildStudioAgentCreationContext always asks one focused, adaptive clarification round", () => {
	const context = buildStudioAgentCreationContext("Build a customer feedback agent");

	assert.match(context, /\[Studio Agent Creation Request\]/u);
	assert.match(context, /Original user brief:/u);
	assert.match(context, /Build a customer feedback agent/u);
	assert.match(context, /Run ONE focused clarification round FIRST using the existing ask_user_questions\/question-card flow/u);
	assert.match(context, /never exceed 2 rounds/u);
	// The old "only ask if unworkable" suppression must be gone.
	assert.doesNotMatch(context, /only ask clarifying questions if the brief truly cannot be turned/u);
});

test("buildStudioAgentCreationContext requests the richer agent field set", () => {
	const context = buildStudioAgentCreationContext("Build an agent");

	assert.match(context, /- conversationStarters: 3 starter prompts/u);
	assert.match(context, /- tools: array of tool\/integration names/u);
	assert.match(context, /- trigger: one line describing when the agent should act/u);
	assert.match(context, /- guardrail: one line describing what the agent must not do/u);
	assert.match(context, /triggers \(when the agent should act\); tools\/integrations/u);
});

test("buildStudioAgentCreationContext omits the template block when no template is provided", () => {
	const context = buildStudioAgentCreationContext("Build an agent");
	assert.doesNotMatch(context, /\[Template context\]/u);
});

test("buildStudioAgentCreationContext includes template provenance when provided", () => {
	const context = buildStudioAgentCreationContext("Build it", {
		name: "Customer Insights",
		category: "analyze",
		description: "Analyzes customer feedback",
		apps: ["Jira", "Confluence"],
		skills: ["Summarize"],
		capabilities: ["Trend detection"],
	});

	assert.match(context, /\[Template context\]/u);
	assert.match(context, /This brief came from the "Customer Insights" template/u);
	assert.match(context, /- Category: analyze/u);
	assert.match(context, /- Connected apps: Jira, Confluence/u);
	assert.match(context, /- Skills: Summarize/u);
	assert.match(context, /- Capabilities: Trend detection/u);
});

test("buildStudioAgentCreationContinuationContext keeps creation mode, caps rounds, and re-includes the template", () => {
	const withTemplate = buildStudioAgentCreationContinuationContext({
		name: "Customer Insights",
		apps: ["Jira"],
	});

	assert.match(withTemplate, /Source: \/studio prompt input clarification answer\./u);
	assert.match(withTemplate, /\[Template context\]/u);
	assert.match(withTemplate, /- Connected apps: Jira/u);
	assert.match(withTemplate, /never exceed 2 rounds total/u);
	assert.match(withTemplate, /- guardrail: one line describing what the agent must not do/u);

	const withoutTemplate = buildStudioAgentCreationContinuationContext();
	assert.doesNotMatch(withoutTemplate, /\[Template context\]/u);
});

test("buildCreationTemplateContextFromAgent distils labels, dedupes apps, and drops empties", () => {
	const result = buildCreationTemplateContextFromAgent({
		name: "Customer Insights",
		categoryId: "analyze",
		description: "Analyzes feedback",
		sources: [{ label: "Jira" }, { label: "Jira" }, { label: "Confluence" }],
		skills: [{ label: "Summarize" }],
		capabilities: [{ label: "Trend detection" }],
	});

	assert.deepEqual(result, {
		name: "Customer Insights",
		category: "analyze",
		description: "Analyzes feedback",
		apps: ["Jira", "Confluence"],
		skills: ["Summarize"],
		capabilities: ["Trend detection"],
	});

	// A bare agent with no detail collapses to just its name.
	assert.deepEqual(buildCreationTemplateContextFromAgent({ name: "Bare" }), { name: "Bare" });
});

test("buildCreationTemplateContextFromStarter reads hero apps/skills and omits absent fields", () => {
	const withHero = buildCreationTemplateContextFromStarter({
		title: "Release Notes Drafter",
		description: "Drafts release notes",
		hero: { sources: [{ label: "Bitbucket" }], skills: [{ label: "Summarize" }] },
	});

	assert.deepEqual(withHero, {
		name: "Release Notes Drafter",
		description: "Drafts release notes",
		apps: ["Bitbucket"],
		skills: ["Summarize"],
	});

	// Starters without a hero (and blank description) collapse to just the title.
	assert.deepEqual(buildCreationTemplateContextFromStarter({ title: "Bare", description: "" }), { name: "Bare" });
});
