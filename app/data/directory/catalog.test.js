const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

const VALID_VISUAL_KINDS = new Set(["avatar", "image", "logo", "icon"]);

let modulePromise;
function loadCatalog() {
	modulePromise ??= loadDirectoryModule(`
		export * as dir from "@/app/data/directory";
		export { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
	`);
	return modulePromise;
}

/** Asserts every item has a non-empty string id and that ids are unique within the group. */
function assertUniqueIds(items, label) {
	const seen = new Set();
	for (const item of items) {
		assert.equal(typeof item.id, "string", `${label}: id must be a string`);
		assert.ok(item.id.length > 0, `${label}: id must be non-empty`);
		assert.ok(!seen.has(item.id), `${label}: duplicate id ${item.id}`);
		seen.add(item.id);
	}
}

/** Asserts every item has a non-empty string field. */
function assertStringField(items, field, label) {
	for (const item of items) {
		assert.equal(typeof item[field], "string", `${label}: ${field} must be a string (id=${item.id})`);
		assert.ok(item[field].length > 0, `${label}: ${field} must be non-empty (id=${item.id})`);
	}
}

/**
 * Resolves a serializable directory visual and asserts it rehydrates to a valid
 * runtime visual kind without throwing. `undefined` is allowed — some items (e.g.
 * tools/agents lacking both logo and avatar) intentionally have no visual.
 */
function assertVisualResolves(resolveDirectoryVisual, descriptor, label) {
	const resolved = resolveDirectoryVisual(descriptor);
	if (descriptor === undefined) {
		assert.equal(resolved, undefined, `${label}: undefined descriptor must resolve to undefined`);
		return;
	}
	assert.ok(resolved, `${label}: descriptor must resolve to a visual`);
	assert.ok(
		VALID_VISUAL_KINDS.has(resolved.kind),
		`${label}: resolved visual kind ${resolved.kind} is invalid`,
	);
	if (resolved.kind === "icon") {
		// The serializable `icon` descriptor must rehydrate into a live element.
		assert.ok(resolved.icon, `${label}: icon visual must carry a rehydrated element`);
	}
}

test("skills catalog is valid, uniquely identified, and produces resolvable visuals", async () => {
	const { dir } = await loadCatalog();
	const { DEFAULT_SKILLS, getSkillDirectoryVisual, resolveDirectoryVisual } = dir;

	assert.ok(Array.isArray(DEFAULT_SKILLS) && DEFAULT_SKILLS.length > 0);
	assertUniqueIds(DEFAULT_SKILLS, "skills");
	assertStringField(DEFAULT_SKILLS, "name", "skills");
	assertStringField(DEFAULT_SKILLS, "description", "skills");

	for (const skill of DEFAULT_SKILLS) {
		assertVisualResolves(resolveDirectoryVisual, getSkillDirectoryVisual(skill), `skill ${skill.id}`);
	}
});

test("tools catalog (both groups) is valid, uniquely identified, and produces resolvable visuals", async () => {
	const { dir } = await loadCatalog();
	const { DEMO_TOOLS, DEMO_SESSION_TOOLS, getToolDirectoryVisual, resolveDirectoryVisual } = dir;

	const allTools = [...DEMO_TOOLS, ...DEMO_SESSION_TOOLS];
	assert.ok(DEMO_TOOLS.length > 0 && DEMO_SESSION_TOOLS.length > 0);
	assertUniqueIds(allTools, "tools");
	assertStringField(allTools, "name", "tools");
	assertStringField(allTools, "byline", "tools");

	for (const tool of allTools) {
		// Tools may legitimately have no visual (neither logoName nor avatarSrc).
		assertVisualResolves(resolveDirectoryVisual, getToolDirectoryVisual(tool), `tool ${tool.id}`);
	}
});

test("knowledge catalog is valid, with unique apps and unique nested contents", async () => {
	const { dir } = await loadCatalog();
	const { DEFAULT_KNOWLEDGE_APPS, resolveDirectoryVisual } = dir;

	assert.ok(DEFAULT_KNOWLEDGE_APPS.length > 0);
	assertUniqueIds(DEFAULT_KNOWLEDGE_APPS, "knowledge apps");
	assertStringField(DEFAULT_KNOWLEDGE_APPS, "name", "knowledge apps");
	assertStringField(DEFAULT_KNOWLEDGE_APPS, "providerName", "knowledge apps");

	for (const app of DEFAULT_KNOWLEDGE_APPS) {
		assert.ok(Array.isArray(app.contents), `knowledge ${app.id}: contents must be an array`);
		assertUniqueIds(app.contents, `knowledge ${app.id} contents`);
		assertStringField(app.contents, "name", `knowledge ${app.id} contents`);
		// Every app carries a serializable visual descriptor that must resolve.
		assertVisualResolves(resolveDirectoryVisual, app.visual, `knowledge ${app.id}`);
	}
});

test("people catalog is valid, uniquely identified, and produces resolvable circle avatars", async () => {
	const { dir } = await loadCatalog();
	const { SAMPLE_AGENT_PEOPLE, getPersonDirectoryVisual, resolveDirectoryVisual } = dir;

	assert.ok(SAMPLE_AGENT_PEOPLE.length > 0);
	assertUniqueIds(SAMPLE_AGENT_PEOPLE, "people");
	assertStringField(SAMPLE_AGENT_PEOPLE, "name", "people");

	for (const person of SAMPLE_AGENT_PEOPLE) {
		const visual = getPersonDirectoryVisual(person);
		assert.equal(visual.kind, "avatar");
		assert.equal(visual.shape, "circle");
		assertVisualResolves(resolveDirectoryVisual, visual, `person ${person.id}`);
	}
});

test("teams catalog is valid, uniquely identified, and produces resolvable square avatars", async () => {
	const { dir } = await loadCatalog();
	const { DEMO_TEAMS, getTeamDirectoryVisual, resolveDirectoryVisual } = dir;

	assert.ok(DEMO_TEAMS.length > 0);
	assertUniqueIds(DEMO_TEAMS, "teams");
	assertStringField(DEMO_TEAMS, "name", "teams");
	assertStringField(DEMO_TEAMS, "avatarSrc", "teams");

	for (const team of DEMO_TEAMS) {
		const visual = getTeamDirectoryVisual(team);
		assert.equal(visual.kind, "avatar");
		assert.equal(visual.shape, "square");
		assertVisualResolves(resolveDirectoryVisual, visual, `team ${team.id}`);
	}
});

test("agents + subagents catalogs are valid, uniquely identified, with resolvable visuals", async () => {
	const { dir } = await loadCatalog();
	const {
		ROVO_AGENT_PROFILES,
		DEMO_AGENT_BROWSER_AGENTS,
		DIRECTORY_SUBAGENTS,
		getAgentDirectoryVisual,
		resolveDirectoryVisual,
	} = dir;

	assert.ok(ROVO_AGENT_PROFILES.length > 0);
	assertUniqueIds(ROVO_AGENT_PROFILES, "agents");
	assertStringField(ROVO_AGENT_PROFILES, "name", "agents");
	assertStringField(ROVO_AGENT_PROFILES, "byline", "agents");

	assertUniqueIds(DEMO_AGENT_BROWSER_AGENTS, "agent-browser agents");
	assertUniqueIds(DIRECTORY_SUBAGENTS, "subagents");

	for (const agent of DEMO_AGENT_BROWSER_AGENTS) {
		// Agents may have a logo, an avatar, or neither — all must resolve safely.
		assertVisualResolves(resolveDirectoryVisual, getAgentDirectoryVisual(agent), `agent ${agent.id}`);
	}
});

test("the unified mention catalog exposes all six categories, each non-empty with resolved visuals", async () => {
	const { EDITOR_PALETTE_MENTION_SOURCES } = await loadCatalog();

	const expectedCategories = ["skill", "tool", "subagent", "knowledge", "human", "team"];
	for (const category of expectedCategories) {
		const items = EDITOR_PALETTE_MENTION_SOURCES[category];
		assert.ok(Array.isArray(items), `mention category ${category} must be an array`);
		assert.ok(items.length > 0, `mention category ${category} must be non-empty`);
		assertUniqueIds(items, `mention category ${category}`);

		for (const item of items) {
			assert.equal(item.category, category, `mention item ${item.id} category mismatch`);
			assertStringField([item], "label", `mention category ${category}`);
			// Items carry an already-resolved runtime visual (or none); when present it must be valid.
			if (item.visual) {
				assert.ok(
					VALID_VISUAL_KINDS.has(item.visual.kind),
					`mention item ${item.id} has invalid visual kind ${item.visual.kind}`,
				);
			}
		}
	}

	// No stray extra categories leaked into the catalog.
	assert.deepEqual(
		Object.keys(EDITOR_PALETTE_MENTION_SOURCES).sort(),
		[...expectedCategories].sort(),
	);
});
