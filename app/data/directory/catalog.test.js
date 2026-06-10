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
	const {
		ATLASSIAN_SKILL_COLLECTION_IDS,
		DEFAULT_SKILLS,
		getSkillCollection,
		getSkillDirectoryVisual,
		resolveDirectoryVisual,
		SKILL_COLLECTIONS,
	} = dir;

	assert.ok(Array.isArray(DEFAULT_SKILLS) && DEFAULT_SKILLS.length > 0);
	assertUniqueIds(DEFAULT_SKILLS, "skills");
	assertStringField(DEFAULT_SKILLS, "name", "skills");
	assertStringField(DEFAULT_SKILLS, "description", "skills");

	const VALID_SOURCES = new Set([
		"2p", "3p", "default", "custom", "platform",
		"teamwork", "software", "strategy", "service", "product",
	]);
	const VALID_COLLECTIONS = new Set(Object.keys(SKILL_COLLECTIONS));
	const collectionIds = new Set();

	for (const skill of DEFAULT_SKILLS) {
		assertVisualResolves(resolveDirectoryVisual, getSkillDirectoryVisual(skill), `skill ${skill.id}`);

		if (skill.source !== undefined) {
			assert.ok(VALID_SOURCES.has(skill.source), `skill ${skill.id}: invalid source ${skill.source}`);
		}
		assert.ok(skill.collectionId, `skill ${skill.id}: collectionId is required`);
		assert.ok(VALID_COLLECTIONS.has(skill.collectionId), `skill ${skill.id}: invalid collectionId ${skill.collectionId}`);
		assert.equal(typeof skill.collectionDescription, "string", `skill ${skill.id}: collectionDescription must be a string`);
		assert.ok(skill.collectionDescription.length > 0, `skill ${skill.id}: collectionDescription must be non-empty`);
		assert.ok(Array.isArray(skill.collectionProducts), `skill ${skill.id}: collectionProducts must be an array`);
		assert.ok(skill.collectionProducts.length > 0, `skill ${skill.id}: collectionProducts must be non-empty`);
		assert.equal(typeof skill.collectionDocsUrl, "string", `skill ${skill.id}: collectionDocsUrl must be a string`);
		assert.equal(typeof skill.teammateCount, "number", `skill ${skill.id}: teammateCount must be a number`);
		assert.equal(typeof skill.verified, "boolean", `skill ${skill.id}: verified must be a boolean`);
		collectionIds.add(skill.collectionId);

		const collection = getSkillCollection(skill);
		assert.equal(collection.id, skill.collectionId, `skill ${skill.id}: collection metadata id mismatch`);
		assert.ok(collection.iconClassName.startsWith("text-icon-accent-"), `skill ${skill.id}: collection must expose ADS icon class`);
		assert.ok(collection.slashClassName.startsWith("bg-border-accent-"), `skill ${skill.id}: collection must expose ADS border class`);
		// 2p/3p app skills render the publisher's company brand mark, not a glyph.
		if (skill.source === "2p" || skill.source === "3p") {
			const visual = getSkillDirectoryVisual(skill);
			assert.equal(
				visual.kind,
				"image",
				`skill ${skill.id}: ${skill.source} source must resolve to a company logo image`,
			);
		}
	}

	for (const collectionId of ATLASSIAN_SKILL_COLLECTION_IDS) {
		assert.ok(collectionIds.has(collectionId), `skills catalog should include ${collectionId} collection skills`);
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
		assert.equal(typeof tool.teammateCount, "number", `tool ${tool.id}: teammateCount must be a number`);
		assert.equal(typeof tool.toolCount, "number", `tool ${tool.id}: toolCount must be a number`);
		assert.equal(typeof tool.publisherName, "string", `tool ${tool.id}: publisherName must be a string`);
		assert.equal(typeof tool.verified, "boolean", `tool ${tool.id}: verified must be a boolean`);
		// Tools may legitimately have no visual (neither logoName nor avatarSrc).
		const visual = getToolDirectoryVisual(tool);
		assertVisualResolves(resolveDirectoryVisual, visual, `tool ${tool.id}`);

		if (!tool.logoName && tool.avatarSrc?.startsWith("/avatar-project/")) {
			assert.equal(visual.kind, "avatar", `tool ${tool.id}: project avatar must use Avatar visuals`);
			assert.equal(visual.shape, "square", `tool ${tool.id}: project avatar must stay square`);
		}
	}
});

test("knowledge catalog is valid, with unique apps and unique nested contents", async () => {
	const { dir } = await loadCatalog();
	const { DEFAULT_KNOWLEDGE_APPS, resolveDirectoryVisual } = dir;

	assert.ok(DEFAULT_KNOWLEDGE_APPS.length > 0);
	assertUniqueIds(DEFAULT_KNOWLEDGE_APPS, "knowledge apps");
	assertStringField(DEFAULT_KNOWLEDGE_APPS, "name", "knowledge apps");
	assertStringField(DEFAULT_KNOWLEDGE_APPS, "description", "knowledge apps");
	assertStringField(DEFAULT_KNOWLEDGE_APPS, "providerName", "knowledge apps");

	for (const app of DEFAULT_KNOWLEDGE_APPS) {
		assert.ok(Array.isArray(app.contents), `knowledge ${app.id}: contents must be an array`);
		assertUniqueIds(app.contents, `knowledge ${app.id} contents`);
		assertStringField(app.contents, "name", `knowledge ${app.id} contents`);
		assertStringField(app.contents, "description", `knowledge ${app.id} contents`);
		assertStringField(app.contents, "type", `knowledge ${app.id} contents`);
		assert.equal(typeof app.starCount, "number", `knowledge ${app.id}: starCount must be a number`);
		assert.equal(typeof app.teammateCount, "number", `knowledge ${app.id}: teammateCount must be a number`);
		assert.equal(typeof app.verified, "boolean", `knowledge ${app.id}: verified must be a boolean`);
		// Every app carries a serializable visual descriptor that must resolve.
		assertVisualResolves(resolveDirectoryVisual, app.visual, `knowledge ${app.id}`);

		for (const content of app.contents) {
			assertVisualResolves(resolveDirectoryVisual, content.visual, `knowledge ${app.id} content ${content.id}`);
			if (content.type === "space") {
				assert.equal(content.visual.kind, "avatar", `knowledge ${app.id} content ${content.id}: spaces use project avatars`);
				assert.equal(content.visual.shape, "square", `knowledge ${app.id} content ${content.id}: space avatars stay square`);
				assert.ok(
					content.visual.src.startsWith("/avatar-project/"),
					`knowledge ${app.id} content ${content.id}: space avatar must use /avatar-project/`,
				);
			}
		}
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
		assert.equal(typeof agent.rating, "number", `agent ${agent.id}: rating must be a number`);
		assert.equal(typeof agent.feedbackCount, "number", `agent ${agent.id}: feedbackCount must be a number`);
		assert.equal(typeof agent.chatCount, "number", `agent ${agent.id}: chatCount must be a number`);
		assert.equal(typeof agent.verified, "boolean", `agent ${agent.id}: verified must be a boolean`);
		// Agents may have a logo, an avatar, or neither — all must resolve safely.
		assertVisualResolves(resolveDirectoryVisual, getAgentDirectoryVisual(agent), `agent ${agent.id}`);
	}
});

test("the unified mention catalog exposes all six categories, each non-empty with resolved visuals", async () => {
	const { EDITOR_PALETTE_MENTION_SOURCES } = await loadCatalog();

	const expectedCategories = ["app", "skill", "tool", "subagent", "knowledge", "human", "team"];
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
