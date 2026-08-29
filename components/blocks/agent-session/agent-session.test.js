const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const CARD_SOURCE = readFileSync(join(__dirname, "agent-session-card.tsx"), "utf8");
const DATA_SOURCE = readFileSync(join(__dirname, "data.ts"), "utf8");
const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const TYPES_SOURCE = readFileSync(join(__dirname, "agent-session-types.ts"), "utf8");
const WORK_ITEM_SOURCE = readFileSync(join(__dirname, "agent-session-work-item.ts"), "utf8");
const DEMO_SOURCE = readFileSync(
	join(__dirname, "../../website/demos/blocks/agent-session-demo.tsx"),
	"utf8",
);
const REGISTRY_SOURCE = readFileSync(
	join(__dirname, "../../website/registry/blocks.ts"),
	"utf8",
);
const DETAIL_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/details/blocks/agent-session.ts"),
	"utf8",
);
const MANIFEST_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/component-manifest.ts"),
	"utf8",
);
const RAIL_SOURCE = readFileSync(
	join(
		__dirname,
		"../jira-kanban/experimental/pulse/components/pulse-rail.tsx",
	),
	"utf8",
);

test("renders each session as a dashed uncaptured-work card around the shared row", () => {
	assert.match(CARD_SOURCE, /data-testid=\{"agent-session-row-" \+ item.id\}/u);
	assert.match(CARD_SOURCE, /border-dashed border-border-disabled/u);
	assert.match(CARD_SOURCE, /bg-surface-sunken/u);
	// The row presenter stays owned by Agent List; this block only frames it.
	assert.match(
		CARD_SOURCE,
		/import \{ AgentListRow \} from "@\/components\/blocks\/agent-list\/agent-list-card";/u,
	);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*hideHoverActions/u);
	assert.match(CARD_SOURCE, /<UncapturedWorkChin/u);
});

test("the chin owns every action, so no row renders a competing flyout", () => {
	assert.doesNotMatch(INDEX_SOURCE, /flyout=|Flyout\b/u);
	assert.doesNotMatch(CARD_SOURCE, /flyout=|Flyout\b/u);
	assert.match(INDEX_SOURCE, /<AgentSessionCard/u);
	assert.match(INDEX_SOURCE, /capturedItemIds\?\.has\(item\.id\)/u);
	assert.match(
		INDEX_SOURCE,
		/suggestedWorkItemKey=\{getSuggestedWorkItemKey\?\.\(item\) \?\? suggestedAgentSessionWorkItemKey\(item\)\}/u,
	);
	assert.match(WORK_ITEM_SOURCE, /item.sessionDetails\?\.issueKey/u);
});

// Fast Refresh can only preserve a component's state when its file exports
// nothing but components, so the chin's suggestion helper lives on its own.
test("the card file exports only a component", () => {
	assert.doesNotMatch(CARD_SOURCE, /suggestedAgentSessionWorkItemKey/u);
	assert.match(WORK_ITEM_SOURCE, /export function suggestedAgentSessionWorkItemKey/u);
	assert.match(WORK_ITEM_SOURCE, /item.sessionDetails\?\.issueKey/u);
	assert.match(
		INDEX_SOURCE,
		/import \{ suggestedAgentSessionWorkItemKey \} from "\.\/agent-session-work-item";/u,
	);
});

test("Resume is gated on host capability before the clipboard write", () => {
	// The chin copies the command before `onCopyResume` ever runs, so a row the
	// host cannot resume must render no control rather than a failing one.
	assert.match(
		CARD_SOURCE,
		/const canResume = \(isResumable\?\.\(item\) \?\? true\) && resumeCommand\.length > 0;/u,
	);
	assert.match(CARD_SOURCE, /onCopyResume=\{canResume\s*\?\s*\(\) => \{/u);
	assert.match(CARD_SOURCE, /onDismiss !== undefined \|\| canResume;/u);
	assert.match(CARD_SOURCE, /toAgentListResumeCommand\(item\)/u);
});

test("reuses the Agent List row model instead of forking a parallel one", () => {
	assert.match(
		TYPES_SOURCE,
		/import type \{ AgentListItem \} from "@\/components\/blocks\/agent-list";/u,
	);
	assert.match(TYPES_SOURCE, /export type AgentSessionItem = AgentListItem;/u);
	assert.match(INDEX_SOURCE, /isCodingAgentListItem\(item\)/u);
});

test("ships demo data and a catalog entry", () => {
	assert.match(DATA_SOURCE, /export const AGENT_SESSION_ITEMS/u);
	assert.match(DATA_SOURCE, /id: "lw-scope-thread"/u);
	assert.match(DATA_SOURCE, /brandName: "claude"/u);
	assert.match(DATA_SOURCE, /issueKey: "PAY-101"/u);
	assert.match(PAGE_SOURCE, /<AgentSession/u);
	assert.match(DEMO_SOURCE, /@\/components\/blocks\/agent-session\/page/u);
	assert.match(REGISTRY_SOURCE, /"agent-session": dynamic/u);
	assert.match(MANIFEST_SOURCE, /blockComponent\("agent-session", "Agent Session"\)/u);
	assert.match(DETAIL_SOURCE, /export const AGENT_SESSION_DETAIL/u);
	assert.match(
		DETAIL_SOURCE,
		/import \{ AgentSession \} from "@\/components\/blocks\/agent-session";/u,
	);
});

test("Pulse's uncaptured column renders sessions through this block", () => {
	assert.match(
		RAIL_SOURCE,
		/import \{ AgentSession \} from "@\/components\/blocks\/agent-session";/u,
	);
	assert.match(
		RAIL_SOURCE,
		/<JiraIssue[\s\S]*variant="uncaptured-work"[\s\S]*<AgentSession[\s\S]*items=\{sessionItems\}/u,
	);
	assert.doesNotMatch(RAIL_SOURCE, /<AgentList\b/u);
	assert.doesNotMatch(RAIL_SOURCE, /variant="uncaptured"/u);
});
