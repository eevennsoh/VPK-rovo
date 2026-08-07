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
	// The helper drives the native card title slots and remains the default for
	// the shared header when a consumer does not lead with the agent identity.
	assert.equal((CARD_SOURCE.match(/\{getSessionTitle\(item\)\}/gu) ?? []).length, 2);
	assert.match(
		CARD_SOURCE,
		/const title = leadWithAgentName \? item\.agent\.name : getSessionTitle\(item\);/u,
	);
	assert.match(CARD_SOURCE, /stateMeta\.showDots \? <AnimatedDots/);
});

test("the awaiting lifecycle glyph is centered inside its tile", () => {
	assert.match(
		CARD_SOURCE,
		/<span className="grid place-items-center leading-none text-icon-information">[\s\S]*?<StatusInformationIcon/u,
	);
});

test("running sessions use the spinner-sized diagonal dot pixel loader", () => {
	assert.match(
		CARD_SOURCE,
		/<PixelLoader[\s\S]*className="size-3 justify-center"[\s\S]*pattern="diagonal-top-left"[\s\S]*shape="dot"[\s\S]*size="small"/u,
	);
	assert.doesNotMatch(CARD_SOURCE, /<Spinner/u);
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
	assert.equal((CARD_SOURCE.match(/<AgentListTime\b/gu) ?? []).length, 2);
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

test("exports a session activity header whose optional View action requires a handler", () => {
	assert.match(
		INDEX_SOURCE,
		/export \{ AgentListActivityHeader \} from "\.\/agent-list-card"/u,
	);
	assert.match(CARD_SOURCE, /title=\{item\.state === "complete" \? "Last update" : "Agent runtime"\}/u);
	assert.match(
		CARD_SOURCE,
		/"pointer-events-none flex shrink-0 items-center gap-2 pl-2 opacity-0[\s\S]*actionVisibilityClass[\s\S]*\{onView \? \(\s*<Button onClick=\{\(\) => onView\(item\)\}[\s\S]*View[\s\S]*<\/Button>/u,
	);
	assert.doesNotMatch(DETAIL_SOURCE, /Activity card/u);
});

test("activity-header lifecycle indicators sit flush right until hover actions expand", () => {
	// Trailing cluster is right-aligned; actions collapse to 0fr so the loader
	// (or awaiting glyph) owns the far edge at rest and only shifts inward when
	// View / collapse controls expand on hover or keyboard focus.
	assert.match(
		CARD_SOURCE,
		/stateMeta\.showLifecycle \|\| hasTrailingActions \? \([\s\S]*className="ml-auto flex shrink-0 items-center"/u,
	);
	assert.match(
		CARD_SOURCE,
		/actionWidthClass[\s\S]*grid-cols-\[0fr\] group-hover\/activity-card:grid-cols-\[1fr\] group-has-\[:focus-visible\]\/activity-card:grid-cols-\[1fr\]/u,
	);
	assert.match(
		CARD_SOURCE,
		/\{stateMeta\.showLifecycle \? <LifecycleIndicator state=\{item\.state\} \/> : null\}[\s\S]*\{hasTrailingActions \?/u,
	);
});

test("activity-header actions stay focusable while hidden so keyboard users can reach View", () => {
	assert.match(
		CARD_SOURCE,
		/\{hasTrailingActions \? \([\s\S]*\{action\}[\s\S]*\) : null\}/u,
	);
	// `display: none` would drop the controls from the tab order, and a hidden
	// descendant can never satisfy the `:focus-visible` reveal condition itself.
	assert.doesNotMatch(CARD_SOURCE, /"hidden -ml-1 shrink-0 items-center gap-2/u);
	assert.doesNotMatch(CARD_SOURCE, /"hidden flex shrink-0 items-center gap-2 pl-2/u);
	assert.match(CARD_SOURCE, /actionVisibilityClass[\s\S]*group-has-\[:focus-visible\]\/activity-card:opacity-100/u);
	assert.match(CARD_SOURCE, /actionVisibilityClass[\s\S]*group-has-\[:focus-visible\]\/activity-card:pointer-events-auto/u);
});

test("the session activity header accepts leading metadata without changing its shared geometry", () => {
	assert.match(CARD_SOURCE, /metadataPrefix\?: ReactNode;/u);
	assert.match(
		CARD_SOURCE,
		/\{metadataPrefix \? \([\s\S]*\{metadataPrefix\}[\s\S]*<MetadataDot \/>[\s\S]*\) : null\}/u,
	);
});

test("the session activity header can lead with the agent identity without repeating it in metadata", () => {
	assert.match(CARD_SOURCE, /leadWithAgentName\?: boolean;/u);
	assert.match(
		CARD_SOURCE,
		/const title = leadWithAgentName \? item\.agent\.name : getSessionTitle\(item\);/u,
	);
	assert.match(
		CARD_SOURCE,
		/\{leadWithAgentName \? null : \([\s\S]*<MetadataDot \/>[\s\S]*\{item\.agent\.name\}[\s\S]*\)\}/u,
	);
});

test("the session activity header separates message time from active runtime", () => {
	assert.match(CARD_SOURCE, /messageTimestamp\?: string;/u);
	assert.match(
		CARD_SOURCE,
		/<span className="shrink-0" title="Message sent">\s*\{messageTimestamp\}\s*<\/span>/u,
	);
	assert.match(
		CARD_SOURCE,
		/\{messageTimestamp && item\.state !== "complete" \? <MetadataDot \/> : null\}/u,
	);
	assert.match(
		CARD_SOURCE,
		/\{messageTimestamp \? "Working for " : null\}\s*<AgentListTime fallback=\{timeFallback\} item=\{item\} \/>/u,
	);
});

test("the session activity header shows who invoked the agent after the timestamp", () => {
	assert.match(TYPES_SOURCE, /export interface AgentListInvoker/u);
	assert.match(TYPES_SOURCE, /invokedBy\?: AgentListInvoker;/u);
	assert.match(CARD_SOURCE, /function InvokerBy/u);
	assert.match(
		CARD_SOURCE,
		/\{messageTimestamp && item\.invokedBy \? \(\s*<InvokerBy invoker=\{item\.invokedBy\} \/>\s*\) : null\}/u,
	);
	assert.match(
		CARD_SOURCE,
		/\{!messageTimestamp && item\.invokedBy \? \(\s*<InvokerBy invoker=\{item\.invokedBy\} \/>\s*\) : null\}/u,
	);
	assert.match(CARD_SOURCE, /<Avatar label=\{invoker\.name\} size="xs">/u);
	assert.match(CARD_SOURCE, /<TooltipContent>\{invoker\.name\}<\/TooltipContent>/u);
	assert.match(DATA_SOURCE, /invokedBy: DEMO_INVOKER/u);
	assert.match(DATA_SOURCE, /name: "Jordan Lee"/u);
});

test("the session activity header can preserve a consumer-provided completed timestamp", () => {
	assert.match(CARD_SOURCE, /fallback = "Just now"/u);
	assert.match(CARD_SOURCE, /timeFallback\?: string;/u);
	assert.match(CARD_SOURCE, /<AgentListTime fallback=\{timeFallback\} item=\{item\} \/>/u);
});
