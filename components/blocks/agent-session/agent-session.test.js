const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const CARD_SOURCE = readFileSync(join(__dirname, "agent-session-card.tsx"), "utf8");
const COMPACT_CARD_SOURCE = readFileSync(
	join(__dirname, "agent-session-compact-card.tsx"),
	"utf8",
);
const MEDIUM_CARD_SOURCE = readFileSync(
	join(__dirname, "agent-session-medium-card.tsx"),
	"utf8",
);
const NOTCH_SOURCE = readFileSync(join(__dirname, "agent-session-notch.tsx"), "utf8");
const ARRIVAL_MOTION_SOURCE = readFileSync(
	join(__dirname, "agent-session-arrival-motion.ts"),
	"utf8",
);
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
const VARIANT_REGISTRY_SOURCE = readFileSync(
	join(__dirname, "../../website/registry/blocks-variants.ts"),
	"utf8",
);

test("renders each session as a dashed uncaptured-work card around the shared row", () => {
	assert.match(CARD_SOURCE, /data-testid=\{"agent-session-row-" \+ item.id\}/u);
	// Dashed always — it means "uncaptured". The colour is conditional, because a
	// newly synced card recolours the same dash rather than replacing it.
	assert.match(CARD_SOURCE, /border border-dashed/u);
	assert.match(CARD_SOURCE, /isNew \? "border-border-discovery" : "border-border-disabled"/u);
	assert.match(CARD_SOURCE, /bg-surface-sunken/u);
	// The row presenter stays owned by Agent List; this block only frames it.
	assert.match(
		CARD_SOURCE,
		/import \{\s*AgentListRow,\s*type AgentListRowHoverActions,\s*\} from "@\/components\/blocks\/agent-list\/agent-list-card";/u,
	);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*hoverActions=\{hoverActions\}/u);
	assert.match(CARD_SOURCE, /<UncapturedWorkChin/u);
});

test("large remains the default while every card receives the selected size variant", () => {
	assert.match(TYPES_SOURCE, /export type AgentSessionVariant = "large" \| "medium" \| "small";/u);
	assert.match(TYPES_SOURCE, /variant\?: AgentSessionVariant;/u);
	assert.match(INDEX_SOURCE, /variant = "large"/u);
	assert.match(INDEX_SOURCE, /data-variant=\{variant\}/u);
	assert.match(INDEX_SOURCE, /variant === "large"/u);
	assert.match(INDEX_SOURCE, /<AgentSessionCard/u);
	assert.match(INDEX_SOURCE, /<AgentSessionCompactCard/u);
	assert.match(INDEX_SOURCE, /<li data-testid=\{"agent-session-row-" \+ item\.id\} key=\{item\.id\}>/u);
});

test("medium matches the 276 by 33 Figma row and reuses shared identity primitives", () => {
	assert.match(MEDIUM_CARD_SOURCE, /import AddIcon from "@atlaskit\/icon\/core\/add";/u);
	assert.match(MEDIUM_CARD_SOURCE, /import \{ AgentAvatarVisual \} from "@\/components\/ui-custom\/agent-avatar-visual";/u);
	assert.match(MEDIUM_CARD_SOURCE, /import \{ Avatar, AvatarFallback, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(MEDIUM_CARD_SOURCE, /h-\[33px\] w-\[276px\]/u);
	assert.match(MEDIUM_CARD_SOURCE, /rounded-\[10px\] bg-bg-accent-gray-subtlest px-3/u);
	assert.match(MEDIUM_CARD_SOURCE, /sizePx=\{16\}/u);
	assert.match(MEDIUM_CARD_SOURCE, /w-\[160px\] truncate text-left text-xs font-normal leading-4/u);
	assert.match(MEDIUM_CARD_SOURCE, /<AddIcon label="" size="small" \/>/u);
	assert.match(MEDIUM_CARD_SOURCE, /<Avatar.*size="xs"/su);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /\?\? \{ name: "person A" \}/u);
	assert.match(
		MEDIUM_CARD_SOURCE,
		/const label = invoker === undefined \? item\.agent\.name : `\$\{item\.agent\.name\} with \$\{invoker\.name\}`;/u,
	);
	assert.match(MEDIUM_CARD_SOURCE, /invoker === undefined \? null : \(/u);
});

test("medium preserves newly synced state and its one-shot arrival beat", () => {
	assert.match(MEDIUM_CARD_SOURCE, /const shouldPlayArrival = isArriving && !shouldReduceMotion;/u);
	assert.match(MEDIUM_CARD_SOURCE, /data-new=\{isNew \|\| undefined\}/u);
	assert.match(MEDIUM_CARD_SOURCE, /isNew \? "ring-1 ring-border-discovery" : null/u);
	assert.match(MEDIUM_CARD_SOURCE, /Newly synced, not yet reviewed/u);
	assert.match(MEDIUM_CARD_SOURCE, /initial=\{shouldPlayArrival \? \{ opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX \} : false\}/u);
	assert.match(MEDIUM_CARD_SOURCE, /animate=\{shouldPlayArrival \? \{ opacity: 1, y: 0 \} : undefined\}/u);
	assert.match(INDEX_SOURCE, /isArriving=\{beatItemIds\?\.has\(item\.id\) \?\? false\}/u);
	assert.match(INDEX_SOURCE, /isNew=\{newItemIds\?\.has\(item\.id\) \?\? false\}/u);
});

test("small is the collapsed-column notch and stays keyboard operable when view is wired", () => {
	assert.match(COMPACT_CARD_SOURCE, /variant === "small"/u);
	assert.match(COMPACT_CARD_SOURCE, /import \{ AgentSessionNotchMark \} from "\.\/agent-session-notch";/u);
	assert.match(COMPACT_CARD_SOURCE, /flex h-5 w-8 items-center justify-center/u);
	assert.match(COMPACT_CARD_SOURCE, /aria-label=\{`Open \$\{item\.agent\.name\} session: \$\{item\.title\}`\}/u);
	assert.match(COMPACT_CARD_SOURCE, /onClick=\{\(\) => onView\(item\)\}/u);
	assert.match(COMPACT_CARD_SOURCE, /<AgentSessionNotchMark isArriving=\{isArriving\} isNew=\{isNew\} \/>/u);
	// One 1px hairline, the same weight as a Pulse ruler rule. It never shrinks:
	// the magnified path is meant to outgrow its row. Standalone it has no rail
	// behind it, so `w-3` is its resting length and its own row's hover is the
	// only affordance available to it.
	assert.match(NOTCH_SOURCE, /"h-px shrink-0"/u);
	assert.match(NOTCH_SOURCE, /w-3 transition-\[background-color,scale\]/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /proximity/u);
	assert.match(NOTCH_SOURCE, /isNew \? NOTCH_EMPHASIS : NOTCH_AT_REST/u);
	assert.match(ARRIVAL_MOTION_SOURCE, /duration: 0\.25,\s*ease: \[0, 0\.4, 0, 1\]/u);
});

test("the row reveals Resume plus a show/hide eye where Agent List puts Archive", () => {
	// The hover pair is the Agent List row's own generic slot, not a fork of its
	// markup — the card only supplies the two action descriptors.
	assert.match(
		CARD_SOURCE,
		/import \{\s*AgentListRow,\s*type AgentListRowHoverActions,\s*\} from "@\/components\/blocks\/agent-list\/agent-list-card";/u,
	);
	assert.match(CARD_SOURCE, /const hoverActions: AgentListRowHoverActions = \{/u);
	assert.match(CARD_SOURCE, /label: copiedResume \? "Copied" : "Resume",/u);
	assert.match(CARD_SOURCE, /icon: <EyeOpenIcon label="" size="small" \/>,\s*label: "Show\/hide",/u);
	assert.match(CARD_SOURCE, /import EyeOpenIcon from "@atlaskit\/icon\/core\/eye-open";/u);
	// The card is two hit areas: `group/agent-row` scopes the reveal to the sunken
	// top region so hovering the chin below cannot pop Resume open above it.
	assert.match(CARD_SOURCE, /className="group\/agent-row bg-surface-sunken p-3"/u);
	assert.doesNotMatch(CARD_SOURCE, /group\/agent-row group\/uncaptured-work/u);
	// Placeholder today: the eye always renders and calls the optional handler.
	assert.match(CARD_SOURCE, /onToggleVisibility\?\.\(item\)/u);
	assert.match(INDEX_SOURCE, /onToggleVisibility=\{onToggleVisibility\}/u);
	assert.match(TYPES_SOURCE, /onToggleVisibility\?: \(item: AgentSessionItem\) => void;/u);
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
	// The hover Resume button copies the command before `onCopyResume` ever runs,
	// so a row the host cannot resume must render no control rather than a
	// failing one. The eye stays regardless — it is not a resume affordance.
	assert.match(
		CARD_SOURCE,
		/const canResume = \(isResumable\?\.\(item\) \?\? true\) && resumeCommand\.length > 0;/u,
	);
	assert.match(CARD_SOURCE, /primary: canResume\s*\?\s*\{/u);
	assert.match(CARD_SOURCE, /: undefined,\s*secondary: \{/u);
	// A consumer wiring only onSubtasks still needs the chin, or that control
	// would be unreachable.
	assert.match(CARD_SOURCE, /const showChin = captured \|\| hasWorkItemActions \|\| onSubtasks !== undefined;/u);
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

test("a coding session body is read-only when the host omits onView", () => {
	assert.match(
		INDEX_SOURCE,
		/isCodingAgentListItem\(item\)\s*\? onView === undefined\s*\? undefined\s*: handleCodingView/u,
	);
});

test("ships demo data and catalog entries for all three size variants", () => {
	assert.match(DATA_SOURCE, /export const AGENT_SESSION_ITEMS/u);
	assert.match(DATA_SOURCE, /id: "lw-scope-thread"/u);
	assert.match(DATA_SOURCE, /brandName: "claude"/u);
	assert.match(DATA_SOURCE, /issueKey: "PAY-101"/u);
	assert.match(PAGE_SOURCE, /<AgentSession/u);
	assert.match(DEMO_SOURCE, /@\/components\/blocks\/agent-session\/page/u);
	assert.match(REGISTRY_SOURCE, /"agent-session": dynamic/u);
	assert.match(MANIFEST_SOURCE, /blockComponent\("agent-session", "Agent Session"\)/u);
	assert.match(DETAIL_SOURCE, /export const AGENT_SESSION_DETAIL/u);
	assert.match(DEMO_SOURCE, /export function AgentSessionDemoMedium\(\)/u);
	assert.match(DEMO_SOURCE, /export function AgentSessionDemoSmall\(\)/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"agent-session-demo-medium": dynamic\(/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"agent-session-demo-small": dynamic\(/u);
	assert.match(DETAIL_SOURCE, /title: "Medium"/u);
	assert.match(DETAIL_SOURCE, /title: "Small"/u);
	assert.match(DETAIL_SOURCE, /name: "variant"/u);
	assert.match(DETAIL_SOURCE, /type: '"large" \| "medium" \| "small"'/u);
	assert.match(
		DETAIL_SOURCE,
		/import \{ AgentSession \} from "@\/components\/blocks\/agent-session";/u,
	);
});

// A session usually touches more than the ticket it started from, so the chin
// can offer several candidates — one linkable row each.
test("the multi-link variant renders one chin row per candidate work item", () => {
	assert.match(DATA_SOURCE, /export const AGENT_SESSION_MULTI_LINK_KEYS/u);
	assert.match(DATA_SOURCE, /"lw-scope-thread": \["PAY-101", "PAY-121", "PAY-104"\]/u);
	assert.match(TYPES_SOURCE, /getSuggestedWorkItemKeys\?: \(item: AgentSessionItem\) => readonly string\[\] \| undefined;/u);
	assert.match(TYPES_SOURCE, /onLinkWorkItem\?: \(item: AgentSessionItem, workItemKey\?: string\) => void;/u);
	assert.match(INDEX_SOURCE, /suggestedWorkItemKeys=\{getSuggestedWorkItemKeys\?\.\(item\)\}/u);
	// The picked row's key must reach the host, not just the fact that a link ran.
	assert.match(
		INDEX_SOURCE,
		/onLinkWorkItem=\{onLinkWorkItem === undefined \? undefined : \(workItemKey\) => onLinkWorkItem\(item, workItemKey\)\}/u,
	);
	assert.match(CARD_SOURCE, /suggestedWorkItemKeys=\{suggestedWorkItemKeys\}/u);
	assert.match(PAGE_SOURCE, /variant\?: AgentSessionVariant \| "multi-link"/u);
	assert.match(PAGE_SOURCE, /AGENT_SESSION_MULTI_LINK_KEYS\[item\.id\]/u);
	assert.match(DEMO_SOURCE, /export function AgentSessionDemoMultiLink\(\)/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"agent-session-demo-multi-link": dynamic\(/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /default: mod\.AgentSessionDemoMultiLink/u);
	assert.match(DETAIL_SOURCE, /demoSlug: "agent-session-demo-multi-link"/u);
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
