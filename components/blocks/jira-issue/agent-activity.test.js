const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const AGENT_ACTIVITY_SOURCE = readFileSync(join(__dirname, "agent-activity.tsx"), "utf8");

test("Needs input titles stay solid; only cycling tool-call labels shimmer", () => {
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/isAwaitingInput \? \(\s*<span[\s\S]*\{summary\.label\}[\s\S]*<AnimatedDots/u,
	);
	assert.doesNotMatch(
		AGENT_ACTIVITY_SOURCE,
		/isAwaitingInput \? \([\s\S]*?<Shimmer[\s\S]*?\{summary\.label\}/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const isCycling = !shouldReduceMotion && labels\.length > 1;/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/isCycling \? \(\s*<Shimmer[\s\S]*duration=\{JIRA_ISSUE_AGENT_SHIMMER_DURATION\}[\s\S]*spread=\{JIRA_ISSUE_AGENT_SHIMMER_SPREAD\}[\s\S]*\{label\}[\s\S]*<\/Shimmer>\s*\) : label/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/if \(!isCycling\) \{\s*return undefined;/u,
	);
});
