import assert from "node:assert/strict";
import test from "node:test";

import { AGENT_TEAM_LINES, pickAgentTeamLine } from "./agent-team-lines.ts";

test("the line set is non-empty", () => {
	assert.ok(AGENT_TEAM_LINES.length > 0);
});

test("pickAgentTeamLine always returns a known line", () => {
	for (let i = 0; i < 50; i += 1) {
		assert.ok(AGENT_TEAM_LINES.includes(pickAgentTeamLine()));
	}
});

test("pickAgentTeamLine avoids repeating the previous line", () => {
	const previous = AGENT_TEAM_LINES[0];
	for (let i = 0; i < 50; i += 1) {
		assert.notEqual(pickAgentTeamLine(previous), previous);
	}
});
