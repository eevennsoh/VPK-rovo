import assert from "node:assert/strict";
import test from "node:test";

import { ROVO_COLOR_SWATCHES } from "../../../lib/rovo-colors.ts";
import { CURSOR_AGENTS, CURSOR_AGENT_COUNT } from "./cursor-agents.ts";

test("exposes exactly four companion agents", () => {
	assert.equal(CURSOR_AGENTS.length, 4);
	assert.equal(CURSOR_AGENT_COUNT, 4);
});

test("all agent colors are distinct", () => {
	const colors = CURSOR_AGENTS.map((agent) => agent.color);
	assert.equal(new Set(colors).size, colors.length);
});

test("each agent has a non-empty launch word and enough traces", () => {
	for (const agent of CURSOR_AGENTS) {
		assert.ok(agent.launchWord.length > 0);
		assert.ok(agent.traces.length >= 2);
	}
});

// The agent palette is a local mirror of ROVO_COLOR_SWATCHES (cursor-agents.ts
// can't import it directly without tripping tsc's .ts-extension rule). This
// guards that mirror so it can never silently drift from the real swatches.
test("agent colors mirror ROVO_COLOR_SWATCHES in order", () => {
	assert.equal(CURSOR_AGENTS.length, ROVO_COLOR_SWATCHES.length);
	CURSOR_AGENTS.forEach((agent, index) => {
		assert.equal(agent.color, ROVO_COLOR_SWATCHES[index].hex);
		assert.equal(agent.colorLabel, ROVO_COLOR_SWATCHES[index].label);
	});
});
