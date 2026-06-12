const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

const { loadCjsModuleFromText } = require(
	path.join(process.cwd(), "scripts", "lib", "esbuild-cjs-loader.js"),
);

// demo-agent-builder is a pure TS module (no React/DOM); bundle it to CJS so the
// classifier + builders can be exercised under `node --test`.
let modulePromise;
function loadModule() {
	modulePromise ??= esbuild
		.build({
			entryPoints: [
				path.join(process.cwd(), "components/projects/studio/lib/demo-agent-builder.ts"),
			],
			bundle: true,
			format: "cjs",
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			loader: { ".css": "empty", ".json": "json" },
			write: false,
		})
		.then((result) => loadCjsModuleFromText(result.outputFiles[0].text));
	return modulePromise;
}

const CANONICAL =
	"add a trigger to send a slack message about the summary of the OKR every Friday 9am";

test("canonical example → scheduled trigger (NOT slack) with fake instruction + name", async () => {
	const { classifyAgentBuildIntent, buildAgentUpdatePatch } = await loadModule();

	const intent = classifyAgentBuildIntent(CANONICAL);
	assert.ok(intent.isBuildIntent, "should be a build intent");
	assert.ok(intent.kinds.includes("trigger"), "should detect a trigger");
	assert.equal(intent.appNames.length, 0, "slack is the trigger destination, not an app");

	const patch = buildAgentUpdatePatch(CANONICAL, {});
	assert.ok(Array.isArray(patch.triggerDefinitions) && patch.triggerDefinitions.length === 1);
	const def = patch.triggerDefinitions[0];
	assert.equal(def.providerId, "scheduled", "cadence must win over the slack destination");
	assert.ok(def.prompt && def.prompt.length > 0, "fake instruction present");
	assert.ok(def.automationName && def.automationName.length > 0, "fake automation name present");
	// Tri-field invariant: triggers/trigger derived + index-aligned with defs.
	assert.equal(patch.triggers.length, patch.triggerDefinitions.length);
	assert.equal(patch.trigger, patch.triggers[0]);
});

test("tool mention resolves to an APP and populates both facets", async () => {
	const { buildAgentUpdatePatch } = await loadModule();
	const patch = buildAgentUpdatePatch("give it Jira tools", {});
	assert.deepEqual(patch.apps, ["Jira"]);
	assert.ok(patch.tools.includes("Jira"), "tool facet populated from app");
	assert.ok(
		patch.knowledge.some((entry) => /jira/i.test(entry)),
		"knowledge facet populated from app",
	);
});

test("knowledge mention also resolves to an APP", async () => {
	const { classifyAgentBuildIntent, buildAgentUpdatePatch } = await loadModule();
	const intent = classifyAgentBuildIntent("connect Confluence as a knowledge source");
	assert.ok(intent.appNames.includes("Confluence"));
	const patch = buildAgentUpdatePatch("connect Confluence as a knowledge source", {});
	assert.ok(patch.apps.includes("Confluence"));
});

test("skill mention adds a skill", async () => {
	const { buildAgentUpdatePatch } = await loadModule();
	const patch = buildAgentUpdatePatch("add the review pull request skill", {});
	assert.ok(Array.isArray(patch.skills) && patch.skills.length >= 1);
	assert.ok(patch.skills.some((s) => /pull request/i.test(s)));
});

test("subagent mention adds a subagent", async () => {
	const { classifyAgentBuildIntent } = await loadModule();
	const intent = classifyAgentBuildIntent("add a research subagent to help");
	assert.ok(intent.kinds.includes("subagent"));
	assert.ok(intent.subagentNames.length >= 1);
});

test("conversation starter request is detected with a count", async () => {
	const { buildAgentUpdatePatch } = await loadModule();
	const patch = buildAgentUpdatePatch("add 2 conversation starters", {});
	assert.ok(Array.isArray(patch.conversationStarters) && patch.conversationStarters.length >= 2);
});

test("multi-digit starter count clamps to the pool max (#10)", async () => {
	const { classifyAgentBuildIntent, buildAgentUpdatePatch } = await loadModule();
	// "12" must parse as twelve (not fall back to 3) and clamp to the max of 6.
	assert.equal(classifyAgentBuildIntent("add 12 conversation starters").starterCount, 6);
	const patch = buildAgentUpdatePatch("add 12 conversation starters", {});
	assert.ok(Array.isArray(patch.conversationStarters));
	assert.ok(patch.conversationStarters.length <= 6, "clamped to the pool size");
	assert.ok(patch.conversationStarters.length >= 3, "more than the single-digit fallback");
});

test("instruction directive is captured", async () => {
	const { buildAgentUpdatePatch } = await loadModule();
	const patch = buildAgentUpdatePatch("always respond in a concise, friendly tone", {});
	assert.ok(typeof patch.instructions === "string" && patch.instructions.length > 0);
});

test("rename sets the name", async () => {
	const { classifyAgentBuildIntent } = await loadModule();
	const intent = classifyAgentBuildIntent("rename it to OKR Reporter");
	assert.equal(intent.nameHint, "OKR Reporter");
});

test("multi-intent clause → trigger + app", async () => {
	const { classifyAgentBuildIntent } = await loadModule();
	const intent = classifyAgentBuildIntent("add a Jira trigger and connect Confluence");
	assert.ok(intent.kinds.includes("trigger"));
	assert.ok(intent.appNames.includes("Confluence"));
	assert.equal(intent.triggerSpecs[0].providerId, "jira");
});

test("update unions with existing draft — no clobber, no dupes", async () => {
	const { buildAgentUpdatePatch } = await loadModule();
	const current = {
		apps: ["Slack"],
		triggerDefinitions: [
			{ id: "scheduled-every-hour-1", providerId: "scheduled", eventId: "every-hour" },
		],
		triggers: ["Every hour"],
	};
	const patch = buildAgentUpdatePatch("give it Jira tools and add a trigger every weekday morning", current);
	assert.ok(patch.apps.includes("Slack") && patch.apps.includes("Jira"), "existing + new apps");
	assert.ok(patch.triggerDefinitions.length === 2, "existing + new trigger");
	// No duplicate app even if requested again.
	const again = buildAgentUpdatePatch("give it Slack tools", { apps: ["Slack"] });
	assert.deepEqual(again.apps, ["Slack"]);
});

test("trigger ids stay unique after a middle trigger was removed (#4)", async () => {
	const { buildAgentUpdatePatch } = await loadModule();
	// Simulate a draft where the surviving trigger keeps the `-2` suffix (its
	// predecessor `-1` was removed). The naive `length + index + 1` would compute
	// index 2 here and collide; the max-suffix derivation must skip past it.
	const current = {
		triggerDefinitions: [
			{
				id: "scheduled-custom-schedule-2",
				providerId: "scheduled",
				eventId: "custom-schedule",
				params: {},
			},
		],
	};
	const patch = buildAgentUpdatePatch(
		"add a trigger to summarize updates every Friday 9am",
		current,
	);
	assert.equal(patch.triggerDefinitions.length, 2, "existing + new trigger");
	const ids = patch.triggerDefinitions.map((def) => def.id);
	assert.equal(new Set(ids).size, ids.length, "no duplicate trigger ids");
	assert.ok(ids.includes("scheduled-custom-schedule-2"), "surviving id preserved");
});

test("create returns a believable fresh agent", async () => {
	const { buildAgentCreateResult } = await loadModule();
	const result = buildAgentCreateResult(CANONICAL);
	assert.equal(result.action, "create");
	assert.ok(result.name && result.name.length > 0);
	assert.ok(result.summary && result.summary.length > 0);
	assert.ok(Array.isArray(result.conversationStarters) && result.conversationStarters.length >= 3);
	// The named trigger flows into the create too.
	assert.ok(Array.isArray(result.triggerDefinitions) && result.triggerDefinitions.length === 1);
	assert.equal(result.triggerDefinitions[0].providerId, "scheduled");
});

test("chit-chat is NOT a build intent", async () => {
	const { classifyAgentBuildIntent } = await loadModule();
	assert.equal(classifyAgentBuildIntent("hello there, how are you?").isBuildIntent, false);
	assert.equal(classifyAgentBuildIntent("what can you do?").isBuildIntent, false);
});

test("planDeterministicAgentBuild → update when an agent is open", async () => {
	const { planDeterministicAgentBuild } = await loadModule();
	const outcome = planDeterministicAgentBuild("give it Jira tools", { apps: [] });
	assert.equal(outcome.handled, true);
	assert.equal(outcome.mode, "update");
	assert.ok(outcome.patch && outcome.patch.apps.includes("Jira"));
	assert.ok(outcome.assistantReply && /added/i.test(outcome.assistantReply));
	assert.equal(outcome.createResult, undefined);
});

test("planDeterministicAgentBuild → create when no agent is open", async () => {
	const { planDeterministicAgentBuild } = await loadModule();
	const outcome = planDeterministicAgentBuild(CANONICAL, null);
	assert.equal(outcome.handled, true);
	assert.equal(outcome.mode, "create");
	assert.ok(outcome.createResult && outcome.createResult.action === "create");
	assert.ok(outcome.assistantReply && /created/i.test(outcome.assistantReply));
	assert.equal(outcome.patch, undefined);
});

test("planDeterministicAgentBuild → not handled for chit-chat", async () => {
	const { planDeterministicAgentBuild } = await loadModule();
	const outcome = planDeterministicAgentBuild("thanks, that's great", { apps: [] });
	assert.equal(outcome.handled, false);
	assert.equal(outcome.mode, "none");
});
