const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const CARD_SOURCE = readFileSync(
	join(__dirname, "agent-list-card.tsx"),
	"utf8",
);
const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const DEMO_SOURCE = readFileSync(
	join(__dirname, "../../website/demos/blocks/agent-list-demo.tsx"),
	"utf8",
);
const VARIANT_REGISTRY_SOURCE = readFileSync(
	join(__dirname, "../../website/registry/blocks-variants.ts"),
	"utf8",
);
const DATA_SOURCE = readFileSync(join(__dirname, "data.ts"), "utf8");
const DETAIL_SOURCE = readFileSync(
	join(__dirname, "../../../app/data/details/blocks/agent-list.ts"),
	"utf8",
);
const TYPES_SOURCE = readFileSync(
	join(__dirname, "agent-list-types.ts"),
	"utf8",
);

test("awaiting sessions shimmer the title; running and complete are solid", () => {
	assert.match(CARD_SOURCE, /running:\s*\{[^}]*shimmerTitle:\s*false/);
	assert.match(CARD_SOURCE, /"needs-input":\s*\{[^}]*shimmerTitle:\s*true/);
	assert.match(CARD_SOURCE, /complete:\s*\{[^}]*shimmerTitle:\s*false[^}]*showDots:\s*false/);
	assert.match(CARD_SOURCE, /stateMeta\.shimmerTitle \?\s*\(\s*<Shimmer/);
});

test("running drops the redundant label; awaiting swaps the title to the waiting-for-input copy with dots", () => {
	// The shimmering title alone communicates a running session.
	assert.doesNotMatch(CARD_SOURCE, /Working on it/);
	assert.match(CARD_SOURCE, /"needs-input":\s*\{[^}]*showDots:\s*true/);
	assert.doesNotMatch(CARD_SOURCE, /titleOverride|const titleText/);
	// Awaiting sessions name the blocked state instead of the task title, matching
	// the Jira queue card's JiraSessionLabel.
	assert.match(CARD_SOURCE, /const AWAITING_INPUT_TITLE = "Waiting for input";/u);
	assert.match(
		CARD_SOURCE,
		/return item\.state === "needs-input" \? AWAITING_INPUT_TITLE : item\.title;/u,
	);
	// The helper drives every title slot (shimmer + plain, in the card and header).
	assert.equal((CARD_SOURCE.match(/\{getSessionTitle\(item\)\}/gu) ?? []).length, 4);
	assert.match(CARD_SOURCE, /stateMeta\.showDots \? <AnimatedDots/);
});

test("the awaiting lifecycle glyph is centered inside its tile", () => {
	assert.match(
		CARD_SOURCE,
		/<span className="grid place-items-center leading-none text-icon-information">[\s\S]*?<StatusInformationIcon/u,
	);
});

test("session rows expose View without advertising a Stop action", () => {
	assert.doesNotMatch(CARD_SOURCE, /Stop agent|VideoStopOverlayIcon|onStop|showStop/u);
	assert.doesNotMatch(INDEX_SOURCE, /onStop/u);
	assert.doesNotMatch(TYPES_SOURCE, /onStop\?:/u);
	assert.match(CARD_SOURCE, /<Button onClick=\{\(\) => onView\?\.\(item\)\} size="compact" variant="outline">[\s\S]*View/u);
});

test("View opens the Rovo floating chat in the demo", () => {
	assert.match(CARD_SOURCE, /<Button onClick=\{\(\) => onView\?\.\(item\)\} size="compact" variant="outline">\s*View/u);
	assert.match(PAGE_SOURCE, /const handleView = useCallback\(\(\) => \{\s*openChat\("floating"\);/);
	assert.match(PAGE_SOURCE, /composerChatSurface="floating"/);
	assert.match(PAGE_SOURCE, /onView=\{handleView\}/);
	assert.match(PAGE_SOURCE, /chatSurface === "floating" \? <RovoFloatingChat/);
});

test("the leading tile renders the agent or VPK identity at the selected density", () => {
	assert.match(
		CARD_SOURCE,
		/<AgentAvatarVisual[\s\S]*avatarSrc=\{item\.agent\.avatarSrc\}[\s\S]*sizePx=\{isCompact \? 24 : 32\}/,
	);
	assert.match(CARD_SOURCE, /vpkLogo=\{item\.agent\.vpkLogo\}/u);
});

test("the metadata line uses elapsed runtime, agent name, and asx PR-status colors", () => {
	assert.match(CARD_SOURCE, /function AgentListTime[\s\S]*item\.state === "complete" \? \([\s\S]*<RelativeTime[\s\S]*\) : \([\s\S]*<ElapsedTime startedAtMs=\{item\.startedAtMs \?\? seededStartedAtMs\}/u);
	assert.equal((CARD_SOURCE.match(/<AgentListTime item=\{item\} \/>/gu) ?? []).length, 2);
	assert.match(CARD_SOURCE, /<span className="truncate">\{item\.agent\.name\}<\/span>/u);
	assert.match(CARD_SOURCE, /<span className="min-w-0 truncate">\{item\.agent\.name\}<\/span>/u);
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

test("the list exposes generic selected-item state to its native card", () => {
	assert.match(TYPES_SOURCE, /selectedItemId\?: string;/u);
	assert.match(INDEX_SOURCE, /selectedItemId/u);
	assert.match(
		INDEX_SOURCE,
		/isSelected=\{item\.id === selectedItemId\}/u,
	);
	assert.match(CARD_SOURCE, /isSelected\?: boolean;/u);
	assert.match(CARD_SOURCE, /aria-current=\{isSelected \? "true" : undefined\}/u);
	assert.match(CARD_SOURCE, /aria-pressed=\{isSelected\}/u);
	assert.match(CARD_SOURCE, /isSelected && "bg-bg-selected hover:bg-bg-selected-hovered"/u);
});

test("session rows reuse Agent States flyouts on the left", () => {
	assert.match(TYPES_SOURCE, /id\?: string;[\s\S]*name: string;/u);
	assert.match(CARD_SOURCE, /<HoverCard[\s\S]*<HoverCardTrigger/u);
	assert.match(CARD_SOURCE, /<AgentStates/u);
	assert.match(CARD_SOURCE, /side="left"/u);
	assert.match(CARD_SOURCE, /positionerClassName="z-\[575\]/u);
	assert.match(CARD_SOURCE, /state=\{getAgentStatesState\(item\.state\)\}/u);
	assert.match(CARD_SOURCE, /onSubmit=\{onFlyoutSubmit\}/u);
	assert.match(CARD_SOURCE, /name: item\.agent\.name/u);
	assert.match(CARD_SOURCE, /avatarSrc: item\.agent\.avatarSrc/u);
	assert.match(CARD_SOURCE, /closeDelay=\{80\}/u);
	assert.doesNotMatch(CARD_SOURCE, /AgentProfileCard|agentProfile/u);
});

test("Agent States composer submissions open the configured chat surface with sidebar fallback", () => {
	assert.match(TYPES_SOURCE, /composerChatSurface\?: ChatSurface;/u);
	assert.match(TYPES_SOURCE, /onSubmitPrompt\?: \(item: AgentListItem, prompt: string\) => Promise<void> \| void;/u);
	assert.match(INDEX_SOURCE, /composerChatSurface = "sidebar"/u);
	assert.match(INDEX_SOURCE, /if \(onSubmitPrompt\) \{[\s\S]*void onSubmitPrompt\(item, prompt\);[\s\S]*return;/u);
	assert.match(INDEX_SOURCE, /openChat\(composerChatSurface\);/u);
	assert.match(INDEX_SOURCE, /void sendPrompt\(prompt\);/u);
	assert.match(INDEX_SOURCE, /onFlyoutSubmit=\{\(prompt\) => handleFlyoutSubmit\(item, prompt\)\}/u);
	assert.match(DETAIL_SOURCE, /name: "composerChatSurface"/u);
	assert.match(DETAIL_SOURCE, /default: '"sidebar"'/u);
	assert.match(DETAIL_SOURCE, /name: "onSubmitPrompt"/u);
});

test("in-flow View controls immediately replace lifecycle indicators without collisions", () => {
	assert.doesNotMatch(CARD_SOURCE, /absolute inset-y-0 right-0/u);
	assert.match(
		CARD_SOURCE,
		/className="flex min-w-0 flex-1 flex-col items-start justify-center/u,
	);
	assert.match(
		CARD_SOURCE,
		/className="flex w-full min-w-0 items-center gap-0 overflow-hidden"/u,
	);
	assert.match(
		CARD_SOURCE,
		/className="flex w-full min-w-0 items-center gap-1 overflow-hidden text-xs/u,
	);
	assert.match(CARD_SOURCE, /<span className=\{cn\(titleClassName, "text-text"\)\}>/u);
	assert.match(CARD_SOURCE, /className="min-w-0 truncate">\{item\.agent\.name\}<\/span>/u);
	assert.match(CARD_SOURCE, /className="ml-3 hidden shrink-0 items-center group-hover:flex group-focus-within:flex"/u);
	assert.match(CARD_SOURCE, /\{isSelected \? null : \(\s*<CardActions/u);
	assert.doesNotMatch(CARD_SOURCE, /isVisible/u);
	assert.match(
		CARD_SOURCE,
		/!isSelected &&\s*"group-hover:hidden group-focus-within:hidden"/u,
	);
	assert.doesNotMatch(CARD_SOURCE, /transition-\[width,margin,opacity\]/u);
});

test("supports default and compact session rows", () => {
	assert.match(TYPES_SOURCE, /export type AgentListVariant = "default" \| "compact"/u);
	assert.match(TYPES_SOURCE, /variant\?: AgentListVariant/u);
	assert.match(INDEX_SOURCE, /variant = "default"/u);
	assert.match(INDEX_SOURCE, /<AgentListCard[\s\S]*variant=\{variant\}/u);
	assert.match(CARD_SOURCE, /variant === "compact"/u);
	assert.match(CARD_SOURCE, /sizePx=\{isCompact \? 24 : 32\}/u);
	assert.match(CARD_SOURCE, /isCompact \? "text-xs" : "text-sm"/u);
	assert.match(CARD_SOURCE, /isCompact \? "px-3 py-1\.5" : "p-3"/u);
	assert.match(DETAIL_SOURCE, /name: "variant"/u);
	assert.match(DETAIL_SOURCE, /type: '"default" \| "compact"'/u);
	assert.match(DETAIL_SOURCE, /default: '"default"'/u);
});

test("shows the compact variant in the component documentation", () => {
	assert.match(PAGE_SOURCE, /variant = "default"/u);
	assert.match(PAGE_SOURCE, /<AgentListDemo variant=\{variant\} \/>/u);
	assert.match(PAGE_SOURCE, /<AgentList[^>]*variant=\{variant\}/u);
	assert.match(DEMO_SOURCE, /export function AgentListDemoCompact/u);
	assert.match(DEMO_SOURCE, /<Page variant="compact" \/>/u);
	assert.match(DETAIL_SOURCE, /title: "Compact"/u);
	assert.match(DETAIL_SOURCE, /demoSlug: "agent-list-demo-compact"/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"agent-list-demo-compact": dynamic/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /default: mod\.AgentListDemoCompact/u);
});

test("exports the session activity header without owning an activity card shell", () => {
	assert.match(
		INDEX_SOURCE,
		/export \{ AgentListActivityHeader \} from "\.\/agent-list-card"/u,
	);
	assert.match(CARD_SOURCE, /title=\{item\.state === "complete" \? "Last update" : "Agent runtime"\}/u);
	assert.match(CARD_SOURCE, /onClick=\{\(\) => onView\?\.\(item\)\}[\s\S]*View/u);
	assert.doesNotMatch(DETAIL_SOURCE, /Activity card/u);
});
