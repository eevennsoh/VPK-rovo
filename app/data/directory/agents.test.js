const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

const DIR = __dirname;

const AGENTS_SOURCE = fs.readFileSync(path.join(DIR, "agents.ts"), "utf8");
const AGENTS_JSON = JSON.parse(fs.readFileSync(path.join(DIR, "agents.json"), "utf8"));
const SUBAGENTS_JSON = JSON.parse(fs.readFileSync(path.join(DIR, "subagents.json"), "utf8"));
const LEGACY_SNAPSHOT = JSON.parse(
	fs.readFileSync(path.join(DIR, "__snapshots__", "agent-profiles.legacy.json"), "utf8"),
);
const DEMO_AGENTS_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/agent-selector/data/demo-agents.ts"),
	"utf8",
);
const AGENT_SELECTOR_PAGE_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/agent-selector/page.tsx"),
	"utf8",
);

// The two agents the Studio superset adds to the rovo-fed surfaces.
const ADDED_AGENT_IDS = ["release-notes-drafter", "atlassian"];

let agentsModulePromise;
function loadAgents() {
	agentsModulePromise ??= loadDirectoryModule('export * from "@/app/data/directory/agents";');
	return agentsModulePromise;
}

/** Projects an object down to a snapshot entry's own keys for byte-for-byte parity. */
function projectToShape(value, shape) {
	const projected = {};
	for (const key of Object.keys(shape)) {
		projected[key] = value[key];
	}
	return projected;
}

/** Strips the live `icon` component from starters so they compare against JSON. */
function serializeStarters(starters) {
	return (starters ?? []).map(({ id, label, prompt, type }) => ({ id, label, prompt, type }));
}

function serializeProfile(profile, shape) {
	const projected = projectToShape(profile, shape);
	if ("starters" in shape) {
		projected.starters = serializeStarters(profile.starters);
	}
	return projected;
}

test("unified catalog merges the Studio superset (21 agents incl. release-notes-drafter and atlassian)", () => {
	assert.equal(AGENTS_JSON.length, 21);

	const ids = new Set(AGENTS_JSON.map((agent) => agent.id));
	for (const id of ADDED_AGENT_IDS) {
		assert.ok(ids.has(id), `unified catalog must include ${id}`);
	}
	// Rovo Dev remains the built-in default.
	assert.ok(ids.has("rovo-dev"));
});

test("Rovo Dev stays available as the fallback profile but is not a selector example", () => {
	// Catalog + derivations come from agents.json via the loader's map.
	assert.match(AGENTS_SOURCE, /ROVO_AGENT_PROFILES: readonly RovoAgentProfile\[\] =\s*UNIFIED_AGENTS\.map\(toAgentProfile\)/u);
	assert.match(
		AGENTS_SOURCE,
		/ROVO_AGENT_SELECTOR_AGENTS[\s\S]*\.filter\(\(agent\) => agent\.id !== ROVO_AGENT_ID\)[\s\S]*\.map/u,
	);
	assert.match(
		AGENTS_SOURCE,
		/ROVO_CUSTOM_AGENT_SELECTOR_AGENTS: readonly AgentSelectorAgent\[\] = ROVO_AGENT_SELECTOR_AGENTS;/u,
	);

	// The selector excludes Rovo Dev; 20 of the 21 unified agents remain.
	assert.equal(AGENTS_JSON.filter((agent) => agent.id !== "rovo-dev").length, 20);

	assert.doesNotMatch(DEMO_AGENTS_SOURCE, /ROVO_AGENT_ID/u);
	assert.doesNotMatch(DEMO_AGENTS_SOURCE, /rovo-dev/u);
	assert.match(AGENT_SELECTOR_PAGE_SOURCE, /variant === "selected-agent-actions" \? \["ai-insights-agent"\] : \["github-copilot"\]/u);
});

test("the subagent reference catalog resolves curated ids against the unified catalog", () => {
	assert.equal(SUBAGENTS_JSON.length, 11);

	const agentIds = new Set(AGENTS_JSON.map((agent) => agent.id));
	for (const { agentId } of SUBAGENTS_JSON) {
		assert.ok(agentIds.has(agentId), `subagent ${agentId} must exist in the unified catalog`);
	}
});

test("unified directory + selector are a strict superset of the legacy forks (nothing removed, +2 added)", async () => {
	const agents = await loadAgents();

	// --- Directory profiles: the studio fork was already the superset; unified must match it exactly. ---
	const directoryById = new Map(
		agents.ROVO_DIRECTORY_AGENT_PROFILES.map((profile) => [profile.id, profile]),
	);
	const studioDirectory = LEGACY_SNAPSHOT.studio.ROVO_DIRECTORY_AGENT_PROFILES;

	assert.equal(
		agents.ROVO_DIRECTORY_AGENT_PROFILES.length,
		studioDirectory.length,
		"directory length must equal the studio fork",
	);
	for (const legacyProfile of studioDirectory) {
		const unifiedProfile = directoryById.get(legacyProfile.id);
		assert.ok(unifiedProfile, `unified directory must contain ${legacyProfile.id}`);
		assert.deepEqual(
			serializeProfile(unifiedProfile, legacyProfile),
			legacyProfile,
			`directory profile ${legacyProfile.id} must match the studio fork byte-for-byte`,
		);
	}

	// --- Selector agents: must equal the studio fork, and be the rovo fork PLUS exactly the 2 added ids. ---
	const selectorById = new Map(
		agents.ROVO_AGENT_SELECTOR_AGENTS.map((agent) => [agent.id, agent]),
	);
	const studioSelector = LEGACY_SNAPSHOT.studio.ROVO_AGENT_SELECTOR_AGENTS;
	const rovoSelector = LEGACY_SNAPSHOT.rovo.ROVO_AGENT_SELECTOR_AGENTS;

	assert.equal(agents.ROVO_AGENT_SELECTOR_AGENTS.length, studioSelector.length);
	for (const legacyAgent of studioSelector) {
		const unifiedAgent = selectorById.get(legacyAgent.id);
		assert.ok(unifiedAgent, `unified selector must contain ${legacyAgent.id}`);
		assert.deepEqual(
			projectToShape(unifiedAgent, legacyAgent),
			legacyAgent,
			`selector agent ${legacyAgent.id} must match the studio fork`,
		);
	}

	// Strict superset of the rovo fork: every rovo selector id present, identical shape.
	for (const legacyAgent of rovoSelector) {
		const unifiedAgent = selectorById.get(legacyAgent.id);
		assert.ok(unifiedAgent, `unified selector must still contain rovo-fork ${legacyAgent.id}`);
		assert.deepEqual(projectToShape(unifiedAgent, legacyAgent), legacyAgent);
	}

	// The added ids are EXACTLY the 2 accepted additions (unified \ rovo fork).
	const rovoSelectorIds = new Set(rovoSelector.map((agent) => agent.id));
	const addedIds = agents.ROVO_AGENT_SELECTOR_AGENTS
		.map((agent) => agent.id)
		.filter((id) => !rovoSelectorIds.has(id))
		.sort();
	assert.deepEqual(addedIds, [...ADDED_AGENT_IDS].sort());

	// ROVO_CUSTOM_AGENT_SELECTOR_AGENTS aliases the selector list.
	assert.deepEqual(
		agents.ROVO_CUSTOM_AGENT_SELECTOR_AGENTS,
		agents.ROVO_AGENT_SELECTOR_AGENTS,
	);
});
