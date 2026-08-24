const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const EVENT_SOURCE = readFileSync(join(__dirname, "jira-activity-event.tsx"), "utf8");
const NODE_SOURCE = readFileSync(join(__dirname, "jira-activity-node.tsx"), "utf8");
const COMMENT_SOURCE = readFileSync(join(__dirname, "jira-activity-comment.tsx"), "utf8");

test("one-line activity events use 12px type without shrinking expanded agent cards", () => {
	assert.match(EVENT_SOURCE, /className="flex min-h-6 min-w-0 items-center py-0\.5 text-xs leading-5 text-text-subtlest"/u);
	assert.match(EVENT_SOURCE, /className="flex min-h-6 min-w-0 items-center gap-2 py-0\.5 text-xs leading-5"/u);
	assert.doesNotMatch(EVENT_SOURCE, /className="flex h-6 /u);
	assert.match(COMMENT_SOURCE, /className="text-sm leading-5 text-text"/u);
});

test("one-line activity timestamps keep 6px spacing around the middot", () => {
	assert.match(
		EVENT_SOURCE,
		/<span[\s\S]*className="ml-1\.5 hidden shrink-0 items-center gap-1\.5 text-text-subtlest group-hover\/activity-event:inline-flex[\s\S]*<span>·<\/span>[\s\S]*<span>\{entry\.timestamp\}<\/span>/u,
	);
	assert.match(
		EVENT_SOURCE,
		/<span>·<\/span>[\s\S]*AutomationIcon[\s\S]*<span>\{entry\.timestamp\}<\/span>/u,
	);
	assert.doesNotMatch(EVENT_SOURCE, /> · \{entry\.timestamp\}</u);
});

test("one-line activity timestamps stay hidden until the event row is hovered or focused", () => {
	assert.match(INDEX_SOURCE, /className="group\/activity-event flex min-w-0 gap-2"/u);
	assert.match(
		EVENT_SOURCE,
		/className="ml-1\.5 hidden shrink-0 items-center gap-1\.5 text-text-subtlest group-hover\/activity-event:inline-flex group-focus-within\/activity-event:inline-flex group-has-\[:focus-visible\]\/activity-event:inline-flex"/u,
	);
	assert.match(EVENT_SOURCE, /<span className="sr-only">\{entry\.timestamp\}<\/span>/u);
	assert.doesNotMatch(
		EVENT_SOURCE,
		/<span className="ml-1\.5 inline-flex items-center gap-1\.5 text-text-subtlest">/u,
	);
});

// The hover-revealed timestamp is decorative only: it carries aria-hidden, and an
// ungated sr-only twin keeps the timestamp in the accessibility tree at all times.
test("the hover-revealed timestamp stays decorative with an always-present sr-only twin", () => {
	assert.match(EVENT_SOURCE, /<span\s+aria-hidden\s+className="ml-1\.5 hidden shrink-0/u);
	assert.match(
		EVENT_SOURCE,
		/\{isAutomated \? <span className="sr-only">Automation<\/span> : null\}\s*<span className="sr-only">\{entry\.timestamp\}<\/span>/u,
	);
});

test("event labels share the timeline node's 24px vertical alignment track", () => {
	assert.match(NODE_SOURCE, /isCard \? "h-10" : "h-6"/u);
	assert.match(EVENT_SOURCE, /<p className="flex min-h-6 min-w-0 items-center py-0\.5[^>]*>\s*<span className="min-w-0">/u);
	assert.doesNotMatch(EVENT_SOURCE, /className="flex h-6 /u);
	assert.match(INDEX_SOURCE, /hideHeader \? "pt-1" : null/u);
	assert.doesNotMatch(INDEX_SOURCE, /entry\.kind === "event" && "pt-0\.5"/u);
});
