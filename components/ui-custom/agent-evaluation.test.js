const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "agent-evaluation.tsx"), "utf8");
const COMPONENTS_SOURCE = readFileSync(
	join(__dirname, "..", "..", "app", "data", "components.ts"),
	"utf8",
);
const MANIFEST_SOURCE = readFileSync(
	join(__dirname, "..", "..", "app", "data", "component-manifest.ts"),
	"utf8",
);

test("ui-custom AgentEvaluation remains a compatibility re-export", () => {
	assert.match(SOURCE, /from "@\/components\/blocks\/agent-evaluation"/u);
	assert.match(SOURCE, /AgentEvaluationProps/u);
	assert.match(SOURCE, /AgentEvaluationCompletedRow/u);
});

test("AgentEvaluation catalog ownership moved to blocks", () => {
	assert.doesNotMatch(COMPONENTS_SOURCE, /customComponent\("agent-evaluation", "Agent Evaluation"\)/u);
	assert.doesNotMatch(MANIFEST_SOURCE, /customComponent\("agent-evaluation", "Agent Evaluation"\)/u);
	assert.match(COMPONENTS_SOURCE, /blockComponent\("agent-evaluation", "Agent Evaluation"\)/u);
	assert.match(MANIFEST_SOURCE, /blockComponent\("agent-evaluation", "Agent Evaluation"\)/u);
});
