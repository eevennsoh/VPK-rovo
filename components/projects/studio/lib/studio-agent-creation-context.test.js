const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { loadDirectoryModule } = require(
	path.join(process.cwd(), "app/data/directory/__tests__/load-directory-module.js"),
);

/**
 * Coverage for the Studio agent-creation context builders.
 *
 * `studio-agent-creation-context.ts` now imports the `@/app/data/directory`
 * catalog (to project real ids into the prompt), so it can no longer be
 * `require()`d directly under `node --test`. We bundle it (and its catalog deps)
 * to CJS via the shared directory test harness, then assert against the real
 * derived projection + prompt copy — no brittle source-text matching of the
 * catalog data itself.
 *
 * Tests stay scoped to this owned module and the shared read-only data layer so
 * the file never touches Wave-2 call sites, matching the isolation contract.
 */

async function loadContextModule() {
	return loadDirectoryModule(`
		export {
			buildCatalogProjection,
			buildStudioAgentCreationContext,
			buildStudioAgentCreationContinuationContext,
			buildCreationTemplateContextFromAgent,
			buildCreationTemplateContextFromStarter,
			applyTemplateDefaultsToResult,
			resolveTemplateConfigForResult,
		} from "@/components/projects/studio/lib/studio-agent-creation-context";
		export { DEMO_TOOLS, DEMO_SESSION_TOOLS, DEFAULT_SKILLS } from "@/app/data/directory";
	`);
}

/** Parse `- <id>: <name> — <descriptor>` lines into ids, scoped to a group heading. */
function idsUnderHeading(projection, heading) {
	const lines = projection.split("\n");
	const start = lines.findIndex((line) => line.startsWith(`${heading} (`));
	assert.notEqual(start, -1, `expected a "${heading}" group heading in the projection`);

	const ids = [];
	for (let i = start + 1; i < lines.length; i += 1) {
		const line = lines[i];
		// Stop at the next group heading or the closing marker.
		if (/^[a-z]+ \(\d/.test(line) || line === "[End Catalog]") {
			break;
		}
		// Id ends at the first ": " (colon+space) before the name. Use a non-greedy
		// capture so ids that contain a colon (knowledge `app:all`) parse correctly.
		const match = /^- (.+?): /.exec(line);
		if (match && match[1] !== "(none available)") {
			ids.push(match[1]);
		}
	}
	return ids;
}

// --- Catalog projection (the scoping mechanism) ---

test("full projection is non-empty and bounded per group", async () => {
	const mod = await loadContextModule();
	const projection = mod.buildCatalogProjection();

	assert.match(projection, /^\[Catalog\]/u);
	assert.match(projection, /\[End Catalog\]$/u);

	for (const heading of ["tools", "skills", "knowledge", "subagents"]) {
		const ids = idsUnderHeading(projection, heading);
		assert.ok(ids.length > 0, `expected the full projection to list some ${heading}`);
		// PROJECTION_GROUP_LIMIT in the module is 24; assert the bound holds.
		assert.ok(ids.length <= 24, `${heading} group should be bounded (<=24), got ${ids.length}`);
	}
});

test("each projection group is sorted by id (deterministic)", async () => {
	const mod = await loadContextModule();
	const projection = mod.buildCatalogProjection();

	for (const heading of ["tools", "skills", "knowledge", "subagents"]) {
		const ids = idsUnderHeading(projection, heading);
		const sorted = [...ids].sort((a, b) => a.localeCompare(b));
		assert.deepEqual(ids, sorted, `${heading} group should be sorted by id`);
	}
});

test("scoped projection includes only the selected categories' tools/skills and excludes others", async () => {
	const mod = await loadContextModule();

	const selected = "software-development";
	const excluded = "hr-and-team-building";

	// Real catalog ground truth for the assertions below.
	const allTools = [...mod.DEMO_TOOLS, ...mod.DEMO_SESSION_TOOLS];
	const inScopeToolIds = new Set(
		allTools.filter((tool) => tool.categoryId === selected).map((tool) => tool.id),
	);
	const outOfScopeToolIds = new Set(
		allTools.filter((tool) => tool.categoryId === excluded).map((tool) => tool.id),
	);
	const inScopeSkillIds = new Set(
		mod.DEFAULT_SKILLS.filter((skill) => skill.categoryId === selected).map((skill) => skill.id),
	);
	const outOfScopeSkillIds = new Set(
		mod.DEFAULT_SKILLS.filter((skill) => skill.categoryId === excluded).map((skill) => skill.id),
	);

	// Guard: the fixtures must actually exercise inclusion AND exclusion.
	assert.ok(inScopeToolIds.size > 0, "expected some tools in the selected category");
	assert.ok(outOfScopeToolIds.size > 0, "expected some tools in the excluded category");
	assert.ok(inScopeSkillIds.size > 0, "expected some skills in the selected category");
	assert.ok(outOfScopeSkillIds.size > 0, "expected some skills in the excluded category");

	const projection = mod.buildCatalogProjection([selected]);

	const toolIds = idsUnderHeading(projection, "tools");
	const skillIds = idsUnderHeading(projection, "skills");

	// Every listed tool/skill belongs to the selected category (subject to the
	// per-group bound), and none belong to the excluded category.
	for (const id of toolIds) {
		assert.ok(inScopeToolIds.has(id), `scoped tool "${id}" should be in category "${selected}"`);
		assert.ok(!outOfScopeToolIds.has(id), `scoped tools should exclude "${excluded}" tool "${id}"`);
	}
	for (const id of skillIds) {
		assert.ok(inScopeSkillIds.has(id), `scoped skill "${id}" should be in category "${selected}"`);
		assert.ok(!outOfScopeSkillIds.has(id), `scoped skills should exclude "${excluded}" skill "${id}"`);
	}

	// Sanity: at least one selected-category id actually made it into the output.
	assert.ok(toolIds.length > 0, "scoped projection should still list selected-category tools");
	assert.ok(skillIds.length > 0, "scoped projection should still list selected-category skills");
});

test("scoping keeps domain-neutral knowledge + subagents (no categoryId in data)", async () => {
	const mod = await loadContextModule();

	const full = mod.buildCatalogProjection();
	const scoped = mod.buildCatalogProjection(["software-development"]);

	// Knowledge apps and subagents carry no categoryId, so scoping must not drop
	// them — the scoped projection lists the same domain-neutral ids as the full one.
	for (const heading of ["knowledge", "subagents"]) {
		assert.deepEqual(
			idsUnderHeading(scoped, heading),
			idsUnderHeading(full, heading),
			`${heading} should be unaffected by category scoping`,
		);
	}
});

// --- Output contract (real ids + tokens + mode fields) ---

test("both builders embed the catalog projection and the real-ids contract", async () => {
	const mod = await loadContextModule();

	const initial = mod.buildStudioAgentCreationContext("Build me a triage agent");
	const continuation = mod.buildStudioAgentCreationContinuationContext(undefined, {
		categoryIds: ["software-development"],
	});

	for (const [label, text] of [
		["initial", initial],
		["continuation", continuation],
	]) {
		assert.match(text, /\[Catalog\]/u, `${label} context should embed the catalog projection`);
		assert.match(
			text,
			/@\[category:id\]/u,
			`${label} context should require @[category:id] instruction tokens`,
		);
		// Real-id arrays for all four config categories.
		assert.match(text, /- tools: array of REAL tool ids/u, `${label} should require real tool ids`);
		assert.match(text, /- skills: array of REAL skill ids/u, `${label} should require real skill ids`);
		assert.match(text, /- knowledge: array of REAL knowledge-app ids/u, `${label} should require real knowledge ids`);
		assert.match(text, /- subagents: array of REAL subagent ids/u, `${label} should require real subagent ids`);
		// Conversation starters + triggers.
		assert.match(text, /- conversationStarters: 3 starter prompts/u);
		assert.match(text, /- conversationStarterIcons:/u);
		assert.match(text, /- triggers: 0 to 3 short lines/u);
		// Mode fields.
		assert.match(text, /- memoryMode: "on" or "off"/u, `${label} should require memoryMode`);
		assert.match(text, /- reasoningMode: one of "quick-auto"/u, `${label} should require reasoningMode`);
		assert.match(text, /- knowledgeMode: "all", "custom", or "none"/u, `${label} should require knowledgeMode`);
		// Honor-named-sources rule (apps unification): every app the user names must be wired up.
		assert.match(text, /Honor named sources:/u, `${label} should include the honor-named-sources rule`);
	}

	// The initial turn uses the full catalog; the scoped continuation announces its scope.
	assert.match(initial, /Full catalog\./u);
	assert.match(continuation, /Scoped to categories: software-development\./u);
});

test("reasoningMode enumeration matches the agent editor's option set", async () => {
	const mod = await loadContextModule();
	const text = mod.buildStudioAgentCreationContext("Build an agent");

	for (const value of ["quick-auto", "deep-auto", "gemini-flash-3", "gpt-5.4", "sonnet-4.6", "opus-4.6"]) {
		assert.match(text, new RegExp(`"${value.replace(/\./g, "\\.")}"`, "u"), `reasoningMode should list "${value}"`);
	}
});

// --- Clarification flow (preserved behavior) ---

test("buildStudioAgentCreationContext always asks one focused clarification round before building", async () => {
	const mod = await loadContextModule();
	const context = mod.buildStudioAgentCreationContext("Build a customer feedback agent");

	assert.match(context, /\[Studio Agent Creation Request\]/u);
	assert.match(context, /Original user brief:/u);
	assert.match(context, /Build a customer feedback agent/u);
	assert.match(
		context,
		/ALWAYS run ONE focused clarification round FIRST using the existing ask_user_questions\/question-card flow/u,
	);
	assert.match(context, /Do not skip this round and do not build the agent yet on this turn/u);
	assert.match(context, /Do NOT emit an AGENT_RESULT marker before the user has answered/u);
});

test("buildStudioAgentCreationContinuationContext caps rounds and re-includes the template", async () => {
	const mod = await loadContextModule();

	const withTemplate = mod.buildStudioAgentCreationContinuationContext({
		name: "Customer Insights",
		apps: ["Jira"],
	});
	assert.match(withTemplate, /Source: \/studio prompt input clarification answer\./u);
	assert.match(withTemplate, /\[Template context\]/u);
	assert.match(withTemplate, /- Connected apps: Jira/u);
	assert.match(withTemplate, /never exceed 2 rounds total/u);

	const withoutTemplate = mod.buildStudioAgentCreationContinuationContext();
	assert.doesNotMatch(withoutTemplate, /\[Template context\]/u);
});

// --- Template provenance distillation (preserved behavior) ---

test("buildStudioAgentCreationContext includes template provenance when provided", async () => {
	const mod = await loadContextModule();
	const context = mod.buildStudioAgentCreationContext("Build it", {
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

test("template context surfaces bound ids and tokenized body when present", async () => {
	const mod = await loadContextModule();

	const text = mod.buildStudioAgentCreationContinuationContext({
		name: "Bug Triage",
		toolIds: ["jira", "github"],
		skillIds: ["triage-bugs"],
		tokenizedBody: "## Instructions\nTriage with @[tool:jira].",
	});

	assert.match(text, /Bound catalog ids/u);
	assert.match(text, /tools=\[jira, github\]/u);
	assert.match(text, /skills=\[triage-bugs\]/u);
	assert.match(text, /@\[tool:jira\]/u);
});

test("buildCreationTemplateContextFromAgent distils labels, dedupes apps, and drops empties", async () => {
	const mod = await loadContextModule();
	const result = mod.buildCreationTemplateContextFromAgent({
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

	assert.deepEqual(mod.buildCreationTemplateContextFromAgent({ name: "Bare" }), { name: "Bare" });
});

test("buildCreationTemplateContextFromStarter enriches from the matching template config", async () => {
	const mod = await loadContextModule();
	// "Release Notes Drafter" matches a real template, so the starter carries the
	// SAME rich defaults as the Browse-all remix path: bound ids + tokenized chipped
	// body + names/triggers/modes (not just hero labels).
	const withHero = mod.buildCreationTemplateContextFromStarter({
		title: "Release Notes Drafter",
		description: "Drafts release notes",
		hero: { sources: [{ label: "Bitbucket" }], skills: [{ label: "Summarize" }] },
	});

	assert.equal(withHero.name, "Release Notes Drafter");
	assert.equal(withHero.description, "Drafts release notes");
	assert.deepEqual(withHero.apps, ["Bitbucket"]);
	assert.deepEqual(withHero.skills, ["Summarize"]);
	// Enrichment from the template config:
	assert.ok(Array.isArray(withHero.toolIds) && withHero.toolIds.length > 0, "toolIds attached");
	assert.ok(Array.isArray(withHero.skillIds) && withHero.skillIds.includes("draft-release-notes"));
	assert.ok(Array.isArray(withHero.triggers) && withHero.triggers.length > 0, "triggers attached");
	assert.equal(typeof withHero.tokenizedBody, "string");
	assert.match(withHero.tokenizedBody, /@\[/, "tokenized chipped body attached");
	assert.ok(Array.isArray(withHero.toolNames) && withHero.toolNames.length > 0, "display names attached");

	// A title that matches no template carries only the hero-derived fields.
	assert.deepEqual(
		mod.buildCreationTemplateContextFromStarter({ title: "No Such Template XYZ", description: "" }),
		{ name: "No Such Template XYZ" },
	);
});

test("applyTemplateDefaultsToResult backfills a thin template-based result", async () => {
	const mod = await loadContextModule();
	// A thin model result (matches template by id, with the generated -2 suffix).
	const thin = {
		agentId: "decision-director-2",
		name: "Decision Director",
		instructions: "You are Decision Director. Help with decisions.", // no @[ chips
		tools: [],
		skills: [],
		knowledge: [],
		subagents: [],
		triggers: [],
	};
	const out = mod.applyTemplateDefaultsToResult(thin);
	assert.ok(out.skills.length > 0, "skills backfilled from template");
	assert.ok(out.tools.length > 0, "tools backfilled from template");
	assert.ok(out.knowledge.length > 0, "knowledge backfilled from template");
	assert.ok(out.subagents.length > 0, "subagents backfilled from template");
	assert.match(out.instructions, /@\[/, "chip-less body replaced with the template's chipped body");
	assert.ok(out.triggers.length > 0, "triggers backfilled from template");
});

test("applyTemplateDefaultsToResult preserves model-populated fields and no-ops off-template", async () => {
	const mod = await loadContextModule();
	// Model already produced a chipped body + skills -> keep them.
	const rich = {
		agentId: "decision-director",
		name: "Decision Director",
		instructions: "## Instructions\nUse @[skill:explore-ideas].",
		skills: ["Prioritize ideas"],
		tools: [],
	};
	const keptRich = mod.applyTemplateDefaultsToResult(rich);
	assert.deepEqual(keptRich.skills, ["Prioritize ideas"], "model skills preserved");
	assert.equal(keptRich.instructions, rich.instructions, "chipped body preserved");
	// Off-template result is returned unchanged.
	const scratch = { agentId: "totally-custom-thing", name: "My Bespoke Bot", instructions: "Plain.", skills: [] };
	assert.deepEqual(mod.applyTemplateDefaultsToResult(scratch), scratch);
});
