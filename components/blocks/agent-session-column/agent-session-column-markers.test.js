const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const RAIL_SOURCE = readFileSync(join(__dirname, "agent-session-column-rail.tsx"), "utf8");
const TYPES_SOURCE = readFileSync(join(__dirname, "agent-session-column-types.ts"), "utf8");
const PANEL_DEMO_SOURCE = readFileSync(
	join(__dirname, "agent-session-column-panel-demo.tsx"),
	"utf8",
);
const DETAIL_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/details/blocks/agent-session-column.ts"),
	"utf8",
);

test("collapsed markers default to circles and can retain the previous line treatment", () => {
	assert.match(TYPES_SOURCE, /export type AgentSessionColumnNotchShape = "circle" \| "line";/u);
	assert.match(TYPES_SOURCE, /notchShape\?: AgentSessionColumnNotchShape;/u);
	assert.match(INDEX_SOURCE, /notchShape = "circle",/u);
	assert.match(INDEX_SOURCE, /<AgentSessionColumnRail[\s\S]{0,600}?notchShape=\{notchShape\}/u);
	assert.match(RAIL_SOURCE, /notchShape = "circle",/u);
	assert.match(RAIL_SOURCE, /notchShape === "line"\s*\? \(\s*<AgentSessionNotchMark/u);
	assert.match(RAIL_SOURCE, /:\s*\(\s*<AgentSessionUserNotch/u);
	assert.match(
		RAIL_SOURCE,
		/`scale\(\$\{toAgentSessionUserNotchDiameter\(value, isNew\) \/ 4\}\)`/u,
	);
	assert.match(
		RAIL_SOURCE,
		/import \{ AgentSessionNotchMark \} from "@\/components\/blocks\/agent-session\/agent-session-notch";/u,
	);
	assert.match(DETAIL_SOURCE, /name: "notchShape"/u);
	assert.match(DETAIL_SOURCE, /default: '"circle"'/u);
	assert.match(PANEL_DEMO_SOURCE, /useState<AgentSessionColumnNotchShape>\("circle"\)/u);
	assert.match(PANEL_DEMO_SOURCE, /aria-label="Collapsed marker shape"/u);
	assert.match(PANEL_DEMO_SOURCE, /<ToggleGroupItem value="circle">Circle<\/ToggleGroupItem>/u);
	assert.match(PANEL_DEMO_SOURCE, /<ToggleGroupItem value="line">Line<\/ToggleGroupItem>/u);
	assert.match(PANEL_DEMO_SOURCE, /notchShape=\{notchShape\}/u);
});

test("the increment count keeps the default collapsed-count color", () => {
	assert.match(INDEX_SOURCE, /text=\{newCount > 0 \? `\+\$\{newCount\}` : String\(sessionCount\)\}/u);
	assert.match(INDEX_SOURCE, /"text-text-subtlest",/u);
	assert.doesNotMatch(INDEX_SOURCE, /text-text-discovery/u);
});
