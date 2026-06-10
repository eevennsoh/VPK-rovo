const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

let modulePromise;
function load() {
	modulePromise ??= loadDirectoryModule(`
		export { DIRECTORY_APPS, getAppById, getAppDirectoryVisual } from "@/app/data/directory/apps";
		export { repairGeneratedAgentCatalog } from "@/app/data/directory/repair-agent-result";
		export {
			resolveCatalogIds,
			repairInstructionTokens,
		} from "@/app/data/directory/resolve-ids";
	`);
	return modulePromise;
}

test("DIRECTORY_APPS unions tools and knowledge-only apps with facet flags", async () => {
	const { DIRECTORY_APPS } = await load();

	assert.ok(DIRECTORY_APPS.length > 80, "expected the union to be larger than the tools catalog");

	// Every app declares both facet flags, and at least one facet is present.
	for (const app of DIRECTORY_APPS) {
		assert.equal(typeof app.hasToolFacet, "boolean", `${app.id} missing hasToolFacet`);
		assert.equal(typeof app.hasKnowledgeFacet, "boolean", `${app.id} missing hasKnowledgeFacet`);
		assert.ok(app.hasToolFacet || app.hasKnowledgeFacet, `${app.id} has no facet`);
		if (app.hasKnowledgeFacet) {
			assert.ok(app.knowledgeApp, `${app.id} marked knowledge but has no knowledgeApp`);
		}
	}

	// Ids are unique across the union.
	const ids = DIRECTORY_APPS.map((app) => app.id);
	assert.equal(new Set(ids).size, ids.length, "duplicate app ids in the union");
});

test("getAppById resolves demo apps and aliases sharepoint", async () => {
	const { getAppById } = await load();

	// Tool-only.
	for (const id of ["gmail", "salesforce", "slack", "google-calendar"]) {
		const app = getAppById(id);
		assert.ok(app, `${id} should resolve`);
		assert.equal(app.hasToolFacet, true, `${id} should have a tool facet`);
		assert.equal(app.hasKnowledgeFacet, false, `${id} should be tool-only`);
	}

	// Dual facet.
	const jira = getAppById("jira");
	assert.ok(jira && jira.hasToolFacet && jira.hasKnowledgeFacet, "jira should have both facets");

	// Knowledge-only.
	const projects = getAppById("projects");
	assert.ok(projects, "projects should resolve as an app");
	assert.equal(projects.hasToolFacet, false, "projects is knowledge-only");
	assert.equal(projects.hasKnowledgeFacet, true, "projects has a knowledge facet");

	// SharePoint alias: knowledge id `sharepoint` collapses onto the tool id.
	const viaAlias = getAppById("sharepoint");
	const viaTool = getAppById("microsoft-sharepoint");
	assert.ok(viaAlias && viaTool, "both sharepoint ids should resolve");
	assert.equal(viaAlias.id, viaTool.id, "sharepoint should alias to one app record");
	assert.equal(viaAlias.id, "microsoft-sharepoint");
});

test("@[app:id] tokens resolve and repair against the union", async () => {
	const { resolveCatalogIds, repairInstructionTokens } = await load();

	assert.deepEqual(resolveCatalogIds(["gmail", "projects"], "app"), ["gmail", "projects"]);

	const { resolved, markdown } = repairInstructionTokens(
		"Check @[app:gmail] each morning and review @[app:projects].",
	);
	assert.deepEqual(resolved.app, ["gmail", "projects"]);
	assert.ok(markdown.includes("@[app:gmail]"), "valid app token should be preserved");
});

test("repair derives apps[] from facet arrays and expands explicit app tokens", async () => {
	const { repairGeneratedAgentCatalog } = await load();

	const out = repairGeneratedAgentCatalog({
		tools: ["Jira", "Slack"],
		knowledge: ["Projects - all content"],
		instructions: "Use @[app:gmail] every morning.",
	});

	// Membership derived from facets + the explicit @[app:gmail] token.
	assert.deepEqual([...out.apps].sort(), ["Gmail", "Jira", "Projects", "Slack"]);
	// The explicit app token expanded into the tool facet.
	assert.ok(out.tools.includes("Gmail"), "explicit @[app:gmail] should add the Gmail tool");
	// A lone @[tool:jira]-style facet is NOT force-expanded into knowledge.
	assert.ok(!out.knowledge.includes("Jira - all content"), "tool-only facet must not gain knowledge");
});

test("repair leaves a from-scratch agent untouched", async () => {
	const { repairGeneratedAgentCatalog } = await load();
	const out = repairGeneratedAgentCatalog({ instructions: "No references here." });
	assert.equal(out.apps, undefined);
	assert.equal(out.tools, undefined);
	assert.equal(out.knowledge, undefined);
});
