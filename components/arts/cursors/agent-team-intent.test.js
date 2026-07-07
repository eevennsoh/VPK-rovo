import assert from "node:assert/strict";
import test from "node:test";

import { detectAgentTeamIntent } from "./agent-team-intent.ts";

test("detects explicit 'team of agents' phrasing", () => {
	assert.equal(detectAgentTeamIntent("create me a team of agents"), true);
	assert.equal(detectAgentTeamIntent("Can you spin up a team of bots?"), true);
	assert.equal(detectAgentTeamIntent("I want a TEAM OF AGENTS"), true);
});

test("detects a creation verb paired with plural agents", () => {
	assert.equal(detectAgentTeamIntent("make a few agents for me"), true);
	assert.equal(detectAgentTeamIntent("build some agents"), true);
	assert.equal(detectAgentTeamIntent("generate three agents"), true);
});

test("does not fan out for a single agent or unrelated speech", () => {
	// Singular — one agent should not multiply into a team.
	assert.equal(detectAgentTeamIntent("create an agent"), false);
	assert.equal(detectAgentTeamIntent("open the agent settings"), false);
	// Plural agents without a creation verb.
	assert.equal(detectAgentTeamIntent("the agents are ready"), false);
	// Unrelated.
	assert.equal(detectAgentTeamIntent("what's the weather today"), false);
});

test("handles empty and nullish input", () => {
	assert.equal(detectAgentTeamIntent(""), false);
	assert.equal(detectAgentTeamIntent(null), false);
	assert.equal(detectAgentTeamIntent(undefined), false);
});
