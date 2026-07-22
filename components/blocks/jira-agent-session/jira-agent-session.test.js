const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const CARD_SOURCE = readFileSync(
	join(__dirname, "jira-agent-session-card.tsx"),
	"utf8",
);
const ACTIVITY_CARD_SOURCE = readFileSync(
	join(__dirname, "jira-agent-session-activity-card.tsx"),
	"utf8",
);
const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const DATA_SOURCE = readFileSync(join(__dirname, "data.ts"), "utf8");
const DEMO_SOURCE = readFileSync(
	join(__dirname, "../../website/demos/blocks/jira-agent-session-demo.tsx"),
	"utf8",
);
const DETAIL_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/details/blocks/jira-agent-session.ts"),
	"utf8",
);
const VARIANT_REGISTRY_SOURCE = readFileSync(
	join(__dirname, "../../website/registry/blocks-variants.ts"),
	"utf8",
);

test("awaiting sessions shimmer the title; running and complete are solid", () => {
	assert.match(CARD_SOURCE, /running:\s*\{[^}]*shimmerTitle:\s*false/);
	assert.match(CARD_SOURCE, /"needs-input":\s*\{[^}]*shimmerTitle:\s*true/);
	assert.match(CARD_SOURCE, /complete:\s*\{[^}]*shimmerTitle:\s*false[^}]*showDots:\s*false/);
	assert.match(CARD_SOURCE, /stateMeta\.shimmerTitle \?\s*\(\s*<Shimmer/);
});

test("running drops the redundant label; awaiting preserves the task title with dots", () => {
	// The shimmering title alone communicates a running session.
	assert.doesNotMatch(CARD_SOURCE, /Working on it/);
	assert.match(CARD_SOURCE, /"needs-input":\s*\{[^}]*showDots:\s*true/);
	assert.doesNotMatch(CARD_SOURCE, /titleOverride|const titleText/);
	assert.equal((CARD_SOURCE.match(/\{item\.title\}/gu) ?? []).length, 4);
	assert.match(CARD_SOURCE, /stateMeta\.showDots \? <AnimatedDots/);
});

test("the awaiting lifecycle glyph is centered inside its tile", () => {
	assert.match(
		CARD_SOURCE,
		/<span className="grid place-items-center leading-none text-icon-information">[\s\S]*?<StatusInformationIcon/u,
	);
});

test("only running sessions expose the Stop action", () => {
	assert.match(CARD_SOURCE, /showStop \? \(/);
	assert.match(CARD_SOURCE, /aria-label="Stop agent"/);
	assert.match(CARD_SOURCE, /showStop=\{stateMeta\.showStop\}/);
	assert.match(CARD_SOURCE, /running:\s*\{[^}]*showStop:\s*true/);
});

test("View opens the Rovo floating chat in the demo", () => {
	assert.match(CARD_SOURCE, /<Button onClick=\{\(\) => onView\?\.\(item\)\} size="compact" variant="outline">\s*View/u);
	assert.match(PAGE_SOURCE, /const handleView = useCallback\(\(\) => \{\s*openChat\("floating"\);/);
	assert.match(PAGE_SOURCE, /onView=\{handleView\}/);
	assert.match(PAGE_SOURCE, /chatSurface === "floating" \? <RovoFloatingChat/);
});

test("the leading tile renders the agent or VPK identity at 32px", () => {
	assert.match(
		CARD_SOURCE,
		/<AgentAvatarVisual[\s\S]*avatarSrc=\{item\.agent\.avatarSrc\}[\s\S]*sizePx=\{32\}/,
	);
	assert.match(CARD_SOURCE, /vpkLogo=\{item\.agent\.vpkLogo\}/u);
});

test("the metadata line uses elapsed runtime, agent name, and asx PR-status colors", () => {
	assert.match(CARD_SOURCE, /function JiraAgentSessionTime[\s\S]*item\.state === "complete" \? \([\s\S]*<RelativeTime[\s\S]*\) : \([\s\S]*<ElapsedTime startedAtMs=\{item\.startedAtMs \?\? seededStartedAtMs\}/u);
	assert.equal((CARD_SOURCE.match(/<JiraAgentSessionTime item=\{item\} \/>/gu) ?? []).length, 2);
	assert.equal(
		(CARD_SOURCE.match(/<span className="truncate">\{item\.agent\.name\}<\/span>/gu) ?? []).length,
		2,
	);
	assert.doesNotMatch(CARD_SOURCE, /<span className="truncate">\{item\.branch\}<\/span>/u);
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

test("exports the expanded activity-card variant and owns its shared shell", () => {
	assert.match(INDEX_SOURCE, /export \{ JiraAgentSessionActivityCard \}/u);
	assert.match(
		ACTIVITY_CARD_SOURCE,
		/w-full overflow-hidden border border-border bg-surface/u,
	);
	assert.match(ACTIVITY_CARD_SOURCE, /hasStackedHeader \? "rounded-xl" : "rounded-lg"/u);
	assert.match(ACTIVITY_CARD_SOURCE, /hasStackedHeader \? "gap-4 p-4" : "gap-2 p-3"/u);
	assert.match(ACTIVITY_CARD_SOURCE, /\? "flex min-w-0 items-center gap-3"/u);
	assert.match(ACTIVITY_CARD_SOURCE, /\{headerAvatar\}/u);
	assert.match(ACTIVITY_CARD_SOURCE, /<div className="min-w-0 flex-1">/u);
	assert.match(ACTIVITY_CARD_SOURCE, /aria-expanded=\{detailsOpen\}/u);
	assert.match(ACTIVITY_CARD_SOURCE, /replyComposer/u);
	assert.match(ACTIVITY_CARD_SOURCE, /<JiraAgentSessionActivityHeader[\s\S]*item=\{item\}/u);
	assert.match(ACTIVITY_CARD_SOURCE, /grid w-full gap-4 rounded-xl border border-border bg-surface p-4/u);
	assert.match(ACTIVITY_CARD_SOURCE, /text-sm leading-5 text-text/u);
	assert.doesNotMatch(ACTIVITY_CARD_SOURCE, /text-base leading-6 text-text/u);
	assert.match(CARD_SOURCE, /title=\{item\.state === "complete" \? "Last update" : "Agent runtime"\}/u);
	assert.match(CARD_SOURCE, /onClick=\{\(\) => onView\?\.\(item\)\}[\s\S]*View/u);
});

test("documents the activity-card variant as a rendered example section", () => {
	assert.match(DETAIL_SOURCE, /title: "Activity card"/u);
	assert.match(DETAIL_SOURCE, /demoSlug: "jira-agent-session-demo-activity-card"/u);
	assert.match(
		VARIANT_REGISTRY_SOURCE,
		/"jira-agent-session-demo-activity-card"[\s\S]*JiraAgentSessionActivityCardDemo/u,
	);
	assert.match(DEMO_SOURCE, /export function JiraAgentSessionActivityCardDemo/u);
	assert.match(DEMO_SOURCE, /<JiraAgentSessionActivityCard/u);
	assert.match(DEMO_SOURCE, /item=\{entry\.sessionItem\}/u);
	assert.match(DEMO_SOURCE, /placeholder="Ask, @mention, or \/ for actions"/u);
	assert.match(DEMO_SOURCE, /rounded-xl border border-border bg-bg-input/u);
});
