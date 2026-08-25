const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const STORY_SOURCE = readFileSync(join(__dirname, "components/pulse-story.tsx"), "utf8");

test("Pulse attributes every insight to fourteen sources with a static app stack", () => {
	const sourceBlock = STORY_SOURCE.match(
		/const PULSE_SOURCES = \[([\s\S]*?)\] as const satisfies readonly TwgToolSource\[\];/u,
	)?.[1] ?? "";

	assert.equal([...sourceBlock.matchAll(/\{ id:/gu)].length, 14);
	assert.match(STORY_SOURCE, /import \{ TWGAppstack, type TwgToolSource \} from "@\/components\/ui-custom\/twg-appstack";/u);
	assert.match(STORY_SOURCE, /<span aria-hidden className=\{cn\("shrink-0", PULSE_ROW_META\)\}>·<\/span>/u);
	assert.match(STORY_SOURCE, /\{PULSE_SOURCES\.length\}<span className="sr-only"> sources from Jira, Confluence, GitHub, Slack, and 10 more<\/span>/u);
	assert.match(STORY_SOURCE, /<TWGAppstack[\s\S]*animated=\{false\}[\s\S]*aria-hidden[\s\S]*iconSize="xxsmall"[\s\S]*sources=\{PULSE_SOURCES\}/u);
});
