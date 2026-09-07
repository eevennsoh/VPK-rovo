const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PAGE_SOURCE = readProjectFile("components/projects/jira-golden-journeys-v4/page.tsx");
const LIST_HOOK_SOURCE = readProjectFile(
	"components/projects/jira-golden-journeys-v4/hooks/use-jira-golden-journeys-v4-list.ts",
);
const EXPERIMENTAL_PAGE_SOURCE = [
	readProjectFile("components/blocks/jira-kanban/experimental/page.tsx"),
	readProjectFile("components/blocks/jira-kanban/experimental/experimental-page-types.ts"),
].join("\n");

test("dropping an untracked session in a board gap creates a work item at that index", () => {
	// The board twin of the list create: dropping an untracked session into a
	// card gap mints a work item at that index with the session already linked.
	assert.match(PAGE_SOURCE, /onBoardAgentSessionCreate=\{handleBoardAgentSessionCreate\}/u);
	assert.match(PAGE_SOURCE, /createFromBoardAgentSession/u);
	assert.match(LIST_HOOK_SOURCE, /createBoardWorkItemsFromSessions/u);
});

test("a board-gap cohort travels in one call so the sessions land in drag order", () => {
	// The whole cohort travels in one call, so the gap anchor is resolved once
	// and the sessions land in drag order instead of stacking in reverse.
	assert.match(LIST_HOOK_SOURCE, /entries: input\.entries/u);
	assert.match(LIST_HOOK_SOURCE, /setSelectedIssueKeys\(new Set\(result\.issueKeys\)\)/u);
	assert.match(PAGE_SOURCE, /entries: sessions\.map\(\(session\) => \(\{/u);
});

test("a board without the create capability never draws an insertion line", () => {
	// `toBoardGapCreatePort` returns undefined when the host supplies no create
	// callback, so a board without the capability never draws an insertion line
	// it cannot honour.
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/onBoardGapCreate: toBoardGapCreatePort\(handleCaptureLooseWork, onBoardAgentSessionCreate\)/u,
	);
});
