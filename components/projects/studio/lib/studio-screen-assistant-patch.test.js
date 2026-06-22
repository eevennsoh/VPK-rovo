const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { loadDirectoryModule } = require(
	path.join(process.cwd(), "app/data/directory/__tests__/load-directory-module.js"),
);

/**
 * Coverage for the Studio draft-patch contract used by on-screen assistants
 * (voice cursor + Ask Rovo sidebar) to configure the agent draft. The normalizer
 * resolves capability arrays to catalog display names, validates avatar/modes,
 * derives subagents from prompts, and builds automation rules.
 *
 * `studio-agent-draft-patch.ts` imports the real `@/app/data/directory` catalog
 * (via the id resolver) plus the avatar/subagent/trigger data layers, so - like
 * `studio-agent-creation-context.test.js` — it cannot be `require()`d directly
 * under `node --test`. We bundle a tiny re-export entry to CJS through the shared
 * directory harness (heavy UI deps mocked) and assert against the real catalogs.
 */

let normalizeAgentDraftPatch;
let prepareStudioAgentDraftPatch;
let DEFAULT_SKILLS;
let AGENT_AVATAR_OPTION_SRCS;

test.before(async () => {
	const mod = await loadDirectoryModule(`
		export { normalizeAgentDraftPatch, prepareStudioAgentDraftPatch } from "@/components/projects/studio/lib/studio-agent-draft-patch";
		export { DEFAULT_SKILLS } from "@/app/data/directory";
		export { AGENT_AVATAR_OPTION_SRCS } from "@/components/blocks/agent-2/data/agent-avatar-options";
	`);
	normalizeAgentDraftPatch = mod.normalizeAgentDraftPatch;
	prepareStudioAgentDraftPatch = mod.prepareStudioAgentDraftPatch;
	DEFAULT_SKILLS = mod.DEFAULT_SKILLS;
	AGENT_AVATAR_OPTION_SRCS = mod.AGENT_AVATAR_OPTION_SRCS;
});

test("keeps the legacy text/tools/conversationStarters contract (regression)", () => {
	assert.deepEqual(
		normalizeAgentDraftPatch({
			action: "update",
			agentId: "should-not-change",
			conversationStarters: ["Summarize this", "", 42, "Draft next steps"],
			description: "  Helps teams triage work  ",
			name: "  Triage Copilot  ",
			tools: ["Jira", "  Confluence  "],
			unknown: "ignored",
		}),
		{
			action: "update",
			conversationStarters: ["Summarize this", "Draft next steps"],
			description: "Helps teams triage work",
			name: "Triage Copilot",
			tools: ["Jira", "Confluence"],
		},
	);
	assert.equal(normalizeAgentDraftPatch({ agentId: "ignored", name: "" }), null);
	assert.equal(normalizeAgentDraftPatch(null), null);
});

test("resolves capability arrays to catalog display names and drops unknowns", () => {
	const realSkillName = DEFAULT_SKILLS[0].name;
	const realSkillId = DEFAULT_SKILLS[0].id;

	// A real id resolves to its display name (what the manual picker stores).
	const byId = normalizeAgentDraftPatch({ skills: [realSkillId] });
	assert.deepEqual(byId, { skills: [realSkillName] });

	// A real name round-trips, and an unmatched value is dropped.
	const byName = normalizeAgentDraftPatch({ skills: [realSkillName, "totally-made-up-zzz"] });
	assert.deepEqual(byName, { skills: [realSkillName] });

	// A present-but-empty array clears the field (whole-array replacement).
	assert.deepEqual(normalizeAgentDraftPatch({ skills: ["nope-not-real-xyz"] }), { skills: [] });
});

test("validates avatarSrc against the catalog option paths", () => {
	const validSrc = AGENT_AVATAR_OPTION_SRCS[0];
	assert.deepEqual(normalizeAgentDraftPatch({ avatarSrc: validSrc }), { avatarSrc: validSrc });
	assert.equal(normalizeAgentDraftPatch({ avatarSrc: "/avatar-agent/not/real.svg" }), null);
});

test("enum-validates the mode fields", () => {
	assert.deepEqual(
		normalizeAgentDraftPatch({
			memoryMode: "on",
			reasoningMode: "opus-4.6",
			knowledgeMode: "all",
		}),
		{ memoryMode: "on", reasoningMode: "opus-4.6", knowledgeMode: "all" },
	);
	// Invalid mode values are dropped (not coerced).
	assert.equal(
		normalizeAgentDraftPatch({ memoryMode: "maybe", reasoningMode: "gpt-2", knowledgeMode: "some" }),
		null,
	);
});

test("derives the subagents chip list from subagentPrompts", () => {
	const patch = normalizeAgentDraftPatch({
		subagentPrompts: [
			{ triggerName: "Reviewer", condition: "when asked to review", config: { instructions: "Review code" } },
			{ triggerName: "", condition: "ignored — no trigger name" },
		],
	});
	assert.equal(patch.subagentPrompts.length, 1);
	assert.equal(patch.subagentPrompts[0].triggerName, "Reviewer");
	assert.deepEqual(patch.subagents, ["Reviewer"]);
});

test("builds automation rules from a validated structured triggers array", () => {
	const patch = normalizeAgentDraftPatch({
		automationRules: [
			{
				name: "Triage new work",
				triggers: [
					{ providerId: "jira", eventId: "work-item-created" },
					{ providerId: "bogus-provider", eventId: "nope" },
				],
			},
			{ name: "Empty", triggers: [{ providerId: "bogus", eventId: "bogus" }] },
		],
	});
	assert.equal(patch.automationRules.length, 1);
	assert.equal(patch.automationRules[0].name, "Triage new work");
	assert.equal(patch.automationRules[0].triggers.length, 1);
	assert.equal(patch.automationRules[0].triggers[0].providerId, "jira");
});

test("NL trigger phrases set the triggers field without clobbering automationRules", () => {
	const patch = normalizeAgentDraftPatch({ triggers: ["When a Jira work item is created"] });
	assert.deepEqual(patch.triggers, ["When a Jira work item is created"]);
	// The stateless normalizer must NOT rebuild automationRules from phrases —
	// updateSessionAgentDraft shallow-merges, so that would drop a draft's existing
	// custom rules. Only an explicit automationRules array replaces them.
	assert.equal(patch.automationRules, undefined);
});

test("prepares draft patches with shell-owned summary mirroring and trigger hydration", () => {
	const patch = prepareStudioAgentDraftPatch({
		currentDraft: {
			automationRules: [],
			description: "Old description",
			triggers: [],
		},
		rawPatch: {
			description: "Updated description",
			triggers: ["When a Jira work item is created"],
		},
	});

	assert.equal(patch.description, "Updated description");
	assert.equal(patch.summary, "Updated description");
	assert.ok(Array.isArray(patch.automationRules));
	assert.ok(patch.automationRules.length > 0);
	assert.ok(Array.isArray(patch.triggers));
	assert.ok(patch.triggers.length > 0);
});
