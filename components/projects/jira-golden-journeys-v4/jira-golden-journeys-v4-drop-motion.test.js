const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const SESSION_DROP_RECEIPT_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/lib/session-drop-receipt.ts",
);
const SESSION_FUSION_OVERLAY_STATE_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/lib/session-fusion-overlay-state.ts",
);
const JIRA_LINKING_DROP_SOURCE = readProjectFile("components/blocks/jira-linking/drop.ts");
const JIRA_LINKING_FLIGHT_SOURCE = readProjectFile(
	"components/blocks/jira-linking/jira-linking-flight.tsx",
);

test("create-well and card-link drops stagger, and linking uses automatic arc direction", () => {
	assert.match(SESSION_DROP_RECEIPT_SOURCE, /drop: "stagger"/u);
	assert.match(SESSION_FUSION_OVERLAY_STATE_SOURCE, /playback: "stagger"/u);
	assert.match(JIRA_LINKING_DROP_SOURCE, /direction: "automatic"/u);
	assert.doesNotMatch(
		JIRA_LINKING_DROP_SOURCE,
		/arcStrength: -0\.42/u,
		"negative strength was the old clockwise lock; automatic direction needs a positive well-matching strength",
	);
	assert.match(
		JIRA_LINKING_FLIGHT_SOURCE,
		/arc\(resolveJiraLinkingArcOptions\(profile\)\)/u,
	);
	assert.doesNotMatch(
		JIRA_LINKING_FLIGHT_SOURCE,
		/direction: "cw"|direction: "ccw"/u,
	);
});
