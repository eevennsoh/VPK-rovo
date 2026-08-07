const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const EVENT_SOURCE = readFileSync(join(__dirname, "jira-activity-event.tsx"), "utf8");
const NODE_SOURCE = readFileSync(join(__dirname, "jira-activity-node.tsx"), "utf8");
const CARD_SOURCE = readFileSync(join(__dirname, "jira-activity-card.tsx"), "utf8");
const COMMENT_SOURCE = readFileSync(join(__dirname, "jira-activity-comment.tsx"), "utf8");
const CHANGED_FILES_SOURCE = readFileSync(join(__dirname, "jira-activity-changed-files.tsx"), "utf8");
const AGENT_LIST_CARD_SOURCE = readFileSync(
	join(__dirname, "../agent-list/agent-list-card.tsx"),
	"utf8",
);

test("compact activity labels share the timeline node's 24px alignment track", () => {
	// Card avatars use h-10 (4px clearance around size-8); events stay on h-6.
	assert.match(NODE_SOURCE, /isCard \? "h-10" : "h-6"/u);
	assert.match(EVENT_SOURCE, /className="flex h-6 items-center text-xs leading-4 text-text-subtle"/u);
	assert.match(EVENT_SOURCE, /className="flex h-6 min-w-0 items-center gap-2 text-xs leading-4"/u);
	assert.match(EVENT_SOURCE, /<p className="flex h-6 items-center[^>]*>\s*<span>/u);
	assert.doesNotMatch(INDEX_SOURCE, /entry\.kind === "event" && "pt-0\.5"/u);
});

test("spine nodes and comment avatars share one vertical center axis via the node slot", () => {
	// Shared w-8 column: event glyphs and size-8 card avatars both center at x=16.
	assert.match(NODE_SOURCE, /className="flex w-8 shrink-0 flex-col items-center"/u);
	assert.match(NODE_SOURCE, /size\?: "event" \| "card"/u);
	assert.match(NODE_SOURCE, /sizePx=\{32\}/u);
	assert.match(NODE_SOURCE, /sizePx=\{16\}/u);
	assert.match(NODE_SOURCE, /className="min-h-4 w-px flex-1 bg-border"/u);

	// Cards opt into the card-sized node; content is never pull-left offset.
	assert.match(INDEX_SOURCE, /size=\{isCardEntry \? "card" : "event"\}/u);
	assert.doesNotMatch(INDEX_SOURCE, /-ml-9|-ml-8/u);
	assert.doesNotMatch(INDEX_SOURCE, /entry\.kind === "event" \? "px-2"/u);

	// Top-level comments hide their in-card lead; nested replies keep theirs.
	assert.match(COMMENT_SOURCE, /hideLeadAvatar/u);
	assert.match(
		COMMENT_SOURCE,
		/<div className="pt-3 pl-6">\s*<JiraActivityCard[\s\S]*headerAvatar=\{<ActivityActorAvatar actor=\{reply\.actor\} \/>\}/u,
	);
	assert.match(CARD_SOURCE, /hideLeadAvatar\?: boolean/u);
	assert.match(CARD_SOURCE, /hideAvatar=\{hideLeadAvatar\}/u);

	// Out-of-card avatar (h-10) and stacked name/timestamp share one first-row height.
	assert.match(
		CARD_SOURCE,
		/hideLeadAvatar && hasStackedHeader \? "min-h-10" : null/u,
	);
	assert.match(AGENT_LIST_CARD_SOURCE, /hideAvatar \? "min-h-10" : null/u);
});

test("snapshot events and comment copy share the content column left edge", () => {
	// Content starts after w-8 + gap-2 (x=40). No event padding and no card
	// offset, so event copy shares that edge with names. The in-thread reply
	// composer deliberately pulls back across the node+gap to the avatar edge.
	assert.match(INDEX_SOURCE, /className=\{cn\("min-w-0 flex-1", spacingClassName\)\}/u);
	assert.match(NODE_SOURCE, /className="flex w-8 shrink-0 flex-col items-center"/u);
	assert.doesNotMatch(INDEX_SOURCE, /entry\.kind === "event" \? "px-/u);
	assert.match(INDEX_SOURCE, /hideLeadAvatar/u);
	assert.match(CHANGED_FILES_SOURCE, /hideLeadAvatar\?: boolean/u);
	assert.match(CHANGED_FILES_SOURCE, /hideAvatar=\{hideLeadAvatar\}/u);
	assert.match(
		COMMENT_SOURCE,
		/className="-ml-10 w-\[calc\(100%\+2\.5rem\)\]"\s+id=\{composerId\}\s*>/u,
	);
	assert.match(COMMENT_SOURCE, /<div className="pt-3 pl-6">\s*<JiraActivityCard/u);
});

test("rich activity cards leave a 4px gap in the connector above and below", () => {
	// Covers sit on the li over the shared w-8 spine (center x=16 → left-4;
	// w-1 cover centered → left-3.5).
	assert.match(INDEX_SOURCE, /li[\s\S]*className="relative flex gap-2"/u);
	assert.match(
		INDEX_SOURCE,
		/absolute -top-1 left-3\.5 h-1 w-1 bg-surface/u,
	);
	assert.match(
		INDEX_SOURCE,
		/absolute left-3\.5 h-1 w-1 bg-surface/u,
	);
	assert.match(INDEX_SOURCE, /isNextEntryCard \? "bottom-5" : "bottom-4"/u);
	assert.doesNotMatch(INDEX_SOURCE, /left-2\.5/u);
});

test("card boundaries preserve the connector's 16px minimum visible stroke", () => {
	assert.match(INDEX_SOURCE, /const isCardEntry = entry\.kind !== "event"/u);
	assert.match(
		INDEX_SOURCE,
		/const isNextEntryCard = orderedEntries\[index \+ 1\]\?\.kind !== "event" && !isLast/u,
	);
	assert.match(
		INDEX_SOURCE,
		/isCardEntry && isNextEntryCard[\s\S]*\? "pb-6"[\s\S]*isCardEntry \|\| isNextEntryCard \? "pb-5" : "pb-3"/u,
	);
	assert.match(INDEX_SOURCE, /entry\.kind === "comment" \? "pb-4" : "pb-3"/u);
	assert.match(INDEX_SOURCE, /"min-w-0 flex-1"/u);
	assert.doesNotMatch(INDEX_SOURCE, /overflow-visible/u);
});
