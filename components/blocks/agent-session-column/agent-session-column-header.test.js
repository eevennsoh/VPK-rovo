const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const HEADER_SOURCE = readFileSync(
	join(__dirname, "agent-session-column-header.tsx"),
	"utf8",
);
const SELECTION_COPY_SOURCE = readFileSync(
	join(__dirname, "untracked-selection.ts"),
	"utf8",
);
const SELECTION_HOOK_SOURCE = readFileSync(
	join(__dirname, "use-untracked-selection.ts"),
	"utf8",
);

test("selecting a session slides in a check-circle select-all control", () => {
	assert.match(
		HEADER_SOURCE,
		/import CheckCircleUncheckedIcon from "@atlaskit\/icon\/core\/check-circle-unchecked";/u,
	);
	assert.match(HEADER_SOURCE, /import CheckCircleIcon from "@atlaskit\/icon\/core\/check-circle";/u);
	assert.match(HEADER_SOURCE, /allSelected \? CheckCircleIcon : CheckCircleUncheckedIcon/u);
	assert.match(HEADER_SOURCE, /transition-\[width,margin\] duration-normal ease-in-out/u);
	assert.match(HEADER_SOURCE, /motion-reduce:transition-none/u);
	assert.match(HEADER_SOURCE, /inert=\{!expanded\}/u);
	assert.match(HEADER_SOURCE, /aria-hidden=\{expanded \? undefined : true\}/u);
	assert.match(HEADER_SOURCE, /onAction\("select-all"\)/u);
	assert.match(HEADER_SOURCE, /case "enclosed":\s*\n\s*return "ms-2 me-4 w-6 has-\[:focus-visible\]:overflow-visible";/u);
	assert.match(HEADER_SOURCE, /case "caption":\s*\n\s*return "ms-5 me-4 w-6 has-\[:focus-visible\]:overflow-visible";/u);
	assert.match(HEADER_SOURCE, /pointer-events-none ms-0 me-0 w-0/u);
	assert.doesNotMatch(HEADER_SOURCE, /me-1\.5 w-6/u);
	assert.match(HEADER_SOURCE, /\[&>span:last-child\]:pl-4/u);
	assert.match(SELECTION_COPY_SOURCE, /select: "Select all"/u);
	assert.match(SELECTION_COPY_SOURCE, /deselect: "Deselect all"/u);
	assert.doesNotMatch(HEADER_SOURCE, /select-all: CheckCircle/u);
	assert.match(SELECTION_HOOK_SOURCE, /id === "select-all"/u);
	assert.match(SELECTION_HOOK_SOURCE, /type: "select-all"/u);
	assert.match(SELECTION_HOOK_SOURCE, /dispatch\(\{ type: "clear" \}\)/u);
});

test("the selecting header omits collapse so Clear and Deselect all can exit", () => {
	const columnChrome = HEADER_SOURCE.slice(
		HEADER_SOURCE.indexOf("function renderColumnChrome"),
		HEADER_SOURCE.indexOf("function renderPanelChrome"),
	);
	assert.match(columnChrome, /<SelectAllSlot/u);
	assert.match(
		columnChrome,
		/isSelecting \? \([\s\S]*<HeaderIconButton[\s\S]*\) : \([\s\S]*<CollapseButton/u,
	);
	const panelSelecting = HEADER_SOURCE.slice(HEADER_SOURCE.indexOf("function renderPanelChrome"));
	const panelSelectingBranch = panelSelecting.slice(panelSelecting.lastIndexOf('case "selecting":'));
	assert.doesNotMatch(panelSelectingBranch, /ShrinkHorizontalIcon/u);
	assert.match(panelSelectingBranch, /<SelectAllButton/u);
	assert.match(panelSelectingBranch, /<PanelAction/u);
});
