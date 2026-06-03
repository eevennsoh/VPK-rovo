const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SERVER_SOURCE = readFileSync(join(__dirname, "..", "server.js"), "utf8");
const NEXT_ROUTE_SOURCE = readFileSync(
	join(__dirname, "..", "..", "app", "api", "studio", "agent-data-flow", "route.ts"),
	"utf8",
);

test("Studio agent data-flow route proxies to the backend refinement endpoint", () => {
	assert.match(NEXT_ROUTE_SOURCE, /path: "\/api\/studio\/agent-data-flow"/u);
	assert.match(NEXT_ROUTE_SOURCE, /readJsonBody<Record<string, unknown>>\(request\)/u);
});

test("Express route refines Mermaid and falls back to baseline", () => {
	assert.match(SERVER_SOURCE, /refineAgentDataFlowMermaid/u);
	assert.match(SERVER_SOURCE, /app\.post\("\/api\/studio\/agent-data-flow"/u);
	assert.match(SERVER_SOURCE, /normalizeAgentDataFlowConfig\(requestBody\.config\)/u);
	assert.match(SERVER_SOURCE, /buildAgentDataFlowMermaid\(config\)/u);
	assert.match(SERVER_SOURCE, /return res\.status\(200\)\.json\(\{ mermaid: baseline \}\);/u);
});
