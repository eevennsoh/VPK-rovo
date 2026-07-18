const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const CARD_SOURCE = readFileSync(
	join(__dirname, "jira-agent-session-card.tsx"),
	"utf8",
);
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const DATA_SOURCE = readFileSync(join(__dirname, "data.ts"), "utf8");

test("running and awaiting sessions shimmer the title; complete is solid", () => {
	assert.match(CARD_SOURCE, /running:\s*\{[^}]*shimmerTitle:\s*true/);
	assert.match(CARD_SOURCE, /"needs-input":\s*\{[^}]*shimmerTitle:\s*true/);
	assert.match(CARD_SOURCE, /complete:\s*\{[^}]*shimmerTitle:\s*false[^}]*showDots:\s*false/);
	assert.match(CARD_SOURCE, /stateMeta\.shimmerTitle \?\s*\(\s*<Shimmer/);
});

test("running drops the redundant label; awaiting overrides the title with dots", () => {
	// The shimmering title alone communicates a running session.
	assert.doesNotMatch(CARD_SOURCE, /Working on it/);
	assert.match(CARD_SOURCE, /running:\s*\{[^}]*titleOverride:\s*null/);
	assert.match(CARD_SOURCE, /"needs-input":\s*\{[^}]*titleOverride:\s*"Awaiting user response"/);
	assert.match(CARD_SOURCE, /"needs-input":\s*\{[^}]*showDots:\s*true/);
	assert.match(CARD_SOURCE, /const titleText = stateMeta\.titleOverride \?\? item\.title;/);
	assert.match(CARD_SOURCE, /stateMeta\.showDots \? <AnimatedDots/);
});

test("only running sessions expose the Stop action", () => {
	assert.match(CARD_SOURCE, /showStop \? \(/);
	assert.match(CARD_SOURCE, /aria-label="Stop agent"/);
	assert.match(CARD_SOURCE, /showStop=\{stateMeta\.showStop\}/);
	assert.match(CARD_SOURCE, /running:\s*\{[^}]*showStop:\s*true/);
});

test("View opens the Rovo floating chat in the demo", () => {
	assert.match(PAGE_SOURCE, /const handleView = useCallback\(\(\) => \{\s*openChat\("floating"\);/);
	assert.match(PAGE_SOURCE, /onView=\{handleView\}/);
	assert.match(PAGE_SOURCE, /chatSurface === "floating" \? <RovoFloatingChat/);
});

test("the leading tile renders the agent avatar at 32px, not an issue-type icon", () => {
	assert.match(
		CARD_SOURCE,
		/<AgentAvatarVisual[\s\S]*avatarSrc=\{item\.agent\.avatarSrc\}[\s\S]*sizePx=\{32\}/,
	);
	assert.doesNotMatch(CARD_SOURCE, /IconTile/);
});

test("the metadata line uses agent name, branch, and asx PR-status colors", () => {
	assert.match(CARD_SOURCE, /\{item\.agent\.name\}/);
	assert.match(CARD_SOURCE, /\{item\.branch\}/);
	assert.match(CARD_SOURCE, /created:\s*\{[\s\S]*?text-icon-success/);
	assert.match(CARD_SOURCE, /merged:\s*\{[\s\S]*?text-icon-accent-purple/);
	// The PR segment only renders when a PR exists (awaiting rows show no PR).
	assert.match(CARD_SOURCE, /prMeta && PrIcon \?/);
	assert.doesNotMatch(CARD_SOURCE, /item\.issueKey|item\.spaceName|ISSUE_TYPE/);
});

test("sample data: PRs on created/merged rows, none on the awaiting row", () => {
	assert.match(DATA_SOURCE, /prStatus: "created"/);
	assert.match(DATA_SOURCE, /prStatus: "merged"/);
	assert.doesNotMatch(DATA_SOURCE, /awaiting-input/);
	assert.match(DATA_SOURCE, /branch: "rovo\//);
});

test("sample data covers one card per state", () => {
	assert.match(DATA_SOURCE, /state: "running"/);
	assert.match(DATA_SOURCE, /state: "needs-input"/);
	assert.match(DATA_SOURCE, /state: "complete"/);
});
