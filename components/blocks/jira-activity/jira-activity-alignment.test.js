const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const EVENT_SOURCE = readFileSync(join(__dirname, "jira-activity-event.tsx"), "utf8");
const NODE_SOURCE = readFileSync(join(__dirname, "jira-activity-node.tsx"), "utf8");

test("compact activity labels share the timeline node's 24px alignment track", () => {
	assert.match(NODE_SOURCE, /className="flex h-6 shrink-0 items-center justify-center"/u);
	assert.match(EVENT_SOURCE, /className="flex h-6 items-center text-xs leading-4 text-text-subtle"/u);
	assert.match(EVENT_SOURCE, /className="flex h-6 min-w-0 items-center gap-2 text-xs leading-4"/u);
	assert.match(EVENT_SOURCE, /<p className="flex h-6 items-center[^>]*>\s*<span>/u);
	assert.doesNotMatch(INDEX_SOURCE, /entry\.kind === "event" && "pt-0\.5"/u);
});

test("rich activity cards align to the timeline's left edge", () => {
	assert.match(INDEX_SOURCE, /entry\.kind === "event" \? null : "relative -ml-8"/u);
});

test("rich activity cards leave a 4px gap in the connector above and below", () => {
	assert.match(
		INDEX_SOURCE,
		/absolute -top-1 left-2\.5 h-1 w-1 bg-surface/u,
	);
	assert.match(
		INDEX_SOURCE,
		/absolute left-2\.5 h-1 w-1 bg-surface/u,
	);
	assert.match(INDEX_SOURCE, /entry\.kind === "comment" \? "bottom-3" : "bottom-2"/u);
});
