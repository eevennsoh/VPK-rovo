const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

/**
 * Binding integrity tests for `agent-templates.json` / `agent-templates.ts`.
 *
 * Every template carries REAL catalog ids (toolIds/skillIds/knowledgeIds/
 * subagentIds) plus a tokenized `instructionsBody`. These tests assert that each
 * bound id and each `@[category:id]` token resolves against the actual runtime
 * catalogs, and that the mode fields use the allowed value sets. The catalogs
 * and the typed loader pull in React/Atlaskit, so they're bundled through the
 * shared esbuild harness rather than `require()`d — same pattern as
 * `catalog.test.js` and `resolve-ids.test.js`.
 */

let modulePromise;
function loadFixture() {
	modulePromise ??= loadDirectoryModule(`
		export {
			AGENT_TEMPLATE_CONFIGS,
			AGENT_TEMPLATE_CATEGORY_IDS,
			DEMO_TOOLS,
			DEMO_SESSION_TOOLS,
			DEFAULT_SKILLS,
			DEFAULT_KNOWLEDGE_APPS,
			ROVO_AGENT_PROFILES,
		} from "@/app/data/directory";
		export { extractInstructionTokens } from "@/app/data/directory/resolve-ids";
	`);
	return modulePromise;
}

// Allowed mode value sets, mirrored from
// components/blocks/agent/components/agent.tsx (REASONING_MODE_SECTIONS,
// KNOWLEDGE_MODE_OPTIONS, MEMORY_MODE_OPTIONS).
const REASONING_MODES = new Set([
	"quick-auto",
	"deep-auto",
	"gemini-flash-3",
	"gpt-5.4",
	"sonnet-4.6",
	"opus-4.6",
]);
const KNOWLEDGE_MODES = new Set(["all", "custom", "none"]);
const MEMORY_MODES = new Set(["on", "off"]);

// category → which catalog id-set a token of that category must resolve against.
async function buildCatalogSets() {
	const fx = await loadFixture();
	return {
		tool: new Set([...fx.DEMO_TOOLS, ...fx.DEMO_SESSION_TOOLS].map((t) => t.id)),
		skill: new Set(fx.DEFAULT_SKILLS.map((s) => s.id)),
		knowledge: new Set(fx.DEFAULT_KNOWLEDGE_APPS.map((k) => k.id)),
		subagent: new Set(fx.ROVO_AGENT_PROFILES.map((a) => a.id)),
	};
}

test("every template has the binding fields with sane shapes", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	assert.ok(AGENT_TEMPLATE_CONFIGS.length > 0, "expected templates");

	for (const t of AGENT_TEMPLATE_CONFIGS) {
		for (const field of ["toolIds", "skillIds", "knowledgeIds", "subagentIds", "conversationStarters", "triggers"]) {
			assert.ok(Array.isArray(t[field]), `${t.id}.${field} must be an array`);
		}
		assert.equal(typeof t.instructionsBody, "string", `${t.id}.instructionsBody must be a string`);
		assert.ok(t.instructionsBody.length > 0, `${t.id}.instructionsBody must be non-empty`);
		// Curated list sizes per the task spec.
		assert.ok(
			t.conversationStarters.length >= 2 && t.conversationStarters.length <= 4,
			`${t.id}.conversationStarters must have 2-4 items`,
		);
		assert.ok(t.triggers.length <= 3, `${t.id}.triggers must have 0-3 items`);
		if (t.conversationStarterIcons !== undefined) {
			assert.equal(
				t.conversationStarterIcons.length,
				t.conversationStarters.length,
				`${t.id}.conversationStarterIcons must pair 1:1 with conversationStarters`,
			);
		}
	}
});

test("every bound tool/skill/knowledge/subagent id resolves against the real catalogs", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	const sets = await buildCatalogSets();
	const pairs = [
		["toolIds", sets.tool, "tool"],
		["skillIds", sets.skill, "skill"],
		["knowledgeIds", sets.knowledge, "knowledge"],
		["subagentIds", sets.subagent, "subagent"],
	];

	const failures = [];
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		for (const [field, set, catName] of pairs) {
			for (const id of t[field]) {
				if (!set.has(id)) failures.push(`${t.id}.${field}: "${id}" not in ${catName} catalog`);
			}
			// ids unique within a list.
			assert.equal(new Set(t[field]).size, t[field].length, `${t.id}.${field} has duplicate ids`);
		}
	}
	assert.deepEqual(failures, [], `unresolved bound ids:\n${failures.join("\n")}`);
});

test("every instructionsBody token resolves against its catalog", async () => {
	const { AGENT_TEMPLATE_CONFIGS, extractInstructionTokens } = await loadFixture();
	const sets = await buildCatalogSets();

	const failures = [];
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		const tokens = extractInstructionTokens(t.instructionsBody);
		assert.ok(tokens.length > 0, `${t.id}.instructionsBody should reference at least one token`);
		for (const { category, id } of tokens) {
			if (!sets[category].has(id)) {
				failures.push(`${t.id}.instructionsBody: @[${category}:${id}] not in ${category} catalog`);
			}
		}
	}
	assert.deepEqual(failures, [], `unresolved instructionsBody tokens:\n${failures.join("\n")}`);
});

test("mode fields use the allowed value sets", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		assert.ok(REASONING_MODES.has(t.reasoningMode), `${t.id}.reasoningMode "${t.reasoningMode}" not allowed`);
		assert.ok(KNOWLEDGE_MODES.has(t.knowledgeMode), `${t.id}.knowledgeMode "${t.knowledgeMode}" not allowed`);
		assert.ok(MEMORY_MODES.has(t.memoryMode), `${t.id}.memoryMode "${t.memoryMode}" not allowed`);
	}
});

test("categoryId is one of the owned template categories", async () => {
	const { AGENT_TEMPLATE_CONFIGS, AGENT_TEMPLATE_CATEGORY_IDS } = await loadFixture();
	const allowed = new Set(AGENT_TEMPLATE_CATEGORY_IDS);
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		assert.ok(allowed.has(t.categoryId), `${t.id}.categoryId "${t.categoryId}" not in AGENT_TEMPLATE_CATEGORY_IDS`);
	}
});

test("template ids are unique across the catalog", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	const ids = AGENT_TEMPLATE_CONFIGS.map((t) => t.id);
	assert.equal(new Set(ids).size, ids.length, "duplicate template ids found");
});
