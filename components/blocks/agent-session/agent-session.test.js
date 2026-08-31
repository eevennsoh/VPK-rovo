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
const FLYOUT_SOURCE = readFileSync(
	join(__dirname, "../product-sidebar/variants/jira-session-flyout.tsx"),
	"utf8",
);
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
	// Dashed means "uncaptured". The colour is conditional, because a newly
	// synced card recolours the same dash rather than replacing it. Captured
	// sessions drop the dash for a solid frame.
	assert.match(CARD_SOURCE, /dash-4-2 \[--dash-color:var\(--color-border-discovery\)\]/u);
	assert.match(CARD_SOURCE, /dash-4-2 \[--dash-color:var\(--color-border-disabled\)\]/u);
	assert.match(CARD_SOURCE, /border border-solid border-border/u);
	assert.doesNotMatch(CARD_SOURCE, /bg-surface-sunken/u);
	assert.doesNotMatch(CARD_SOURCE, /bg-surface(?!-sunken)/u);
	assert.doesNotMatch(CARD_SOURCE, /bg-bg-accent-gray-subtlest/u);
	assert.doesNotMatch(CARD_SOURCE, /UncapturedWorkChin/u);
	// The row presenter stays owned by Agent List; this block only frames it.
	assert.match(
		CARD_SOURCE,
		/import \{\s*AgentListRow,\s*type AgentListRowHoverActions,\s*\} from "@\/components\/blocks\/agent-list\/agent-list-card";/u,
	);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*hoverActions=\{hoverActions\}/u);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*isCompact=\{false\}/u);
});

test("large uncaptured-work Rovo rows use the same 32px hexagon as other agents", () => {
	const listCardSource = readFileSync(
		join(__dirname, "../agent-list/agent-list-card.tsx"),
		"utf8",
	);
	assert.match(
		listCardSource,
		/<AgentAvatarVisual[\s\S]*avatarSrc=\{agent\.avatarSrc\}[\s\S]*sizePx=\{sizePx\}/u,
	);
	assert.match(listCardSource, /vpkLogo=\{agent\.vpkLogo\}/u);
	assert.match(listCardSource, /<AgentListIdentity[\s\S]*sizePx=\{isCompact \? 24 : 32\}/u);
	assert.doesNotMatch(listCardSource, /CATALOG_VPK_LOGO_SIZE_PX|agentVisualSizePx/u);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*isCompact=\{false\}/u);
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
	assert.match(NOTCH_SOURCE, /h-0\.5 w-3 rounded-full/u);
	assert.match(NOTCH_SOURCE, /isNew \? NOTCH_EMPHASIS : NOTCH_AT_REST/u);
	assert.match(ARRIVAL_MOTION_SOURCE, /duration: 0\.25,\s*ease: \[0, 0\.4, 0, 1\]/u);
});

test("the row reveals Resume plus a Hide / Show eye where Agent List puts Archive", () => {
	// The hover pair is the Agent List row's own generic slot, not a fork of its
	// markup — the card only supplies the two action descriptors.
	assert.match(
		CARD_SOURCE,
		/import \{\s*AgentListRow,\s*type AgentListRowHoverActions,\s*\} from "@\/components\/blocks\/agent-list\/agent-list-card";/u,
	);
	assert.match(CARD_SOURCE, /const hoverActions: AgentListRowHoverActions = \{/u);
	assert.match(CARD_SOURCE, /label: copiedResume \? "Copied" : "Resume",/u);
	assert.match(CARD_SOURCE, /icon: <EyeOpenIcon label="" size="small" \/>,\s*label: visibilityLabel,/u);
	assert.match(CARD_SOURCE, /visibilityLabel = "Hide"/u);
	assert.match(CARD_SOURCE, /import EyeOpenIcon from "@atlaskit\/icon\/core\/eye-open";/u);
	assert.match(CARD_SOURCE, /group\/agent-row relative flex w-full cursor-pointer rounded-none bg-transparent p-3 text-left text-text/u);
	assert.match(CARD_SOURCE, /hover:border-border/u);
	assert.match(CARD_SOURCE, /focus-within:border-border/u);
	assert.match(CARD_SOURCE, /transition-\[border-color\] duration-xxshort ease-out-practical/u);
	assert.doesNotMatch(CARD_SOURCE, /hover:bg-/u);
	assert.doesNotMatch(CARD_SOURCE, /focus-within:bg-/u);
	assert.doesNotMatch(CARD_SOURCE, /active:bg-/u);
	assert.doesNotMatch(CARD_SOURCE, /hover:shadow-md/u);
	assert.doesNotMatch(CARD_SOURCE, /group\/agent-row group\/uncaptured-work/u);
	// The eye always renders and calls the optional handler; the column supplies
	// Hide vs Show so the tooltip matches the action.
	assert.match(CARD_SOURCE, /onToggleVisibility\?\.\(item\)/u);
	assert.match(INDEX_SOURCE, /onToggleVisibility=\{onToggleVisibility\}/u);
	assert.match(INDEX_SOURCE, /visibilityLabel=\{visibilityLabel\}/u);
	assert.match(TYPES_SOURCE, /onToggleVisibility\?: \(item: AgentSessionItem\) => void;/u);
	assert.match(TYPES_SOURCE, /visibilityLabel\?: string;/u);
});

test("the untracked-work flyout owns capture, so the card has no footer chin", () => {
	assert.match(
		CARD_SOURCE,
		/import \{\s*JiraSessionFlyoutTrigger,\s*type JiraSessionFlyoutHandle,\s*\} from "@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout";/u,
	);
	assert.match(CARD_SOURCE, /<JiraSessionFlyoutTrigger/u);
	assert.match(CARD_SOURCE, /closeDelay=\{160\}/u);
	assert.match(INDEX_SOURCE, /<JiraSessionFlyoutSurface/u);
	assert.match(INDEX_SOURCE, /capturedSessionIds=\{capturedItemIds\}/u);
	assert.match(INDEX_SOURCE, /content="untracked-work"/u);
	assert.match(INDEX_SOURCE, /const \[flyoutHandle\] = useState\(createJiraSessionFlyoutHandle\);/u);
	assert.match(INDEX_SOURCE, /bindAgentSessionFlyoutActions/u);
	assert.match(INDEX_SOURCE, /capturedItemIds\?\.has\(item\.id\)/u);
	assert.match(
		INDEX_SOURCE,
		/resolveAgentSessionWorkItemKey\(\s*item,\s*getSuggestedWorkItemKey,\s*getSuggestedWorkItemKeys,/u,
	);
	assert.doesNotMatch(CARD_SOURCE, /UncapturedWorkChin/u);
	assert.doesNotMatch(INDEX_SOURCE, /UncapturedWorkChin/u);
});

test("sessions share one moving untracked-work flyout instead of a popup per row", () => {
	// Same contract as agent-session-flyout / Agent List: one payload handle, one
	// surface, and a stable trigger host so Base UI can slide the popup between
	// rows. Motion layout on the trigger host remounts it, which closes the card.
	assert.equal(INDEX_SOURCE.match(/<JiraSessionFlyoutSurface\b/gu)?.length, 1);
	assert.equal(INDEX_SOURCE.match(/createJiraSessionFlyoutHandle/gu)?.length, 2);
	assert.doesNotMatch(CARD_SOURCE, /createJiraSessionFlyoutHandle|createHoverCardHandle|<HoverCard\b/u);
	assert.match(CARD_SOURCE, /<JiraSessionFlyoutTrigger[\s\S]*handle=\{flyoutHandle\}[\s\S]*render=\{<div className="w-full" \/>\}/u);
	assert.doesNotMatch(CARD_SOURCE, /<JiraSessionFlyoutTrigger[\s\S]*render=\{\s*<motion\.li/u);
	assert.match(CARD_SOURCE, /<motion\.li[\s\S]*<JiraSessionFlyoutTrigger/u);
	assert.match(INDEX_SOURCE, /onAddAsSubtask=\{flyoutActions\.onAddAsSubtask\}/u);
	assert.match(INDEX_SOURCE, /onCreateWorkItem=\{flyoutActions\.onCreateWorkItem\}/u);
	assert.match(INDEX_SOURCE, /onLinkWorkItem=\{flyoutActions\.onLinkWorkItem\}/u);
});

// Fast Refresh can only preserve a component's state when its file exports
// nothing but components, so the flyout's suggestion helper lives on its own.
test("the card file exports only a component", () => {
	assert.doesNotMatch(CARD_SOURCE, /suggestedAgentSessionWorkItemKey/u);
	assert.match(WORK_ITEM_SOURCE, /export function suggestedAgentSessionWorkItemKey/u);
	assert.match(WORK_ITEM_SOURCE, /item.sessionDetails\?\.issueKey/u);
	assert.match(
		INDEX_SOURCE,
		/import \{\s*bindAgentSessionFlyoutActions,\s*resolveAgentSessionWorkItemKey,\s*toAgentSessionUntrackedWorkFlyoutItem,\s*\} from "\.\/agent-session-work-item";/u,
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
	assert.match(DATA_SOURCE, /brandName: "cursor"/u);
	assert.match(DATA_SOURCE, /vpkLogo: "rovo"/u);
	assert.doesNotMatch(DATA_SOURCE, /Venn’s MacBook/u);
	assert.doesNotMatch(DATA_SOURCE, /timeLabel: "3 mins ago"/u);
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
	assert.doesNotMatch(DEMO_SOURCE, /AgentSessionDemoMultiLink/u);
	assert.doesNotMatch(VARIANT_REGISTRY_SOURCE, /agent-session-demo-multi-link/u);
	assert.doesNotMatch(DETAIL_SOURCE, /agent-session-demo-multi-link/u);
});

test("large uncaptured-work cards stack as one dashed well", () => {
	// Figma 3039:2911: no gap, first card rounded on top, last on the bottom,
	// shared edges collapsed, 4px dash / 2px gap. A single card is both first
	// and last, so it keeps a full rounded frame.
	assert.match(INDEX_SOURCE, /variant === "large" \? "gap-0" : "gap-2"/u);
	assert.match(INDEX_SOURCE, /data-stack=\{variant === "large" \? "well" : undefined\}/u);
	assert.match(CARD_SOURCE, /\[li:first-child_&\]:rounded-t-lg/u);
	assert.match(CARD_SOURCE, /\[li:last-child_&\]:rounded-b-lg/u);
	assert.match(CARD_SOURCE, /\[li:not\(:last-child\)_&\]:\[--dash-bottom-size:0px\]/u);
	assert.match(CARD_SOURCE, /\[li:not\(:last-child\)_&\]:border-b-0/u);
	assert.match(CARD_SOURCE, /dash-4-2/u);
	assert.doesNotMatch(CARD_SOURCE, /rounded-none border bg-transparent/u);
	assert.doesNotMatch(CARD_SOURCE, /rounded-lg border p-3/u);
	assert.doesNotMatch(INDEX_SOURCE, /flex flex-col gap-2/u);
	const themeSource = readFileSync(join(__dirname, "../../../app/tailwind-theme.css"), "utf8");
	assert.match(themeSource, /@utility dash-4-2/u);
	assert.match(themeSource, /--border-dash-length: 4px/u);
	assert.match(themeSource, /--border-dash-gap: 2px/u);
	assert.match(themeSource, /repeating-linear-gradient/u);
});

test("the untracked-work flyout offers the first candidate key", () => {
	assert.match(DATA_SOURCE, /export const AGENT_SESSION_MULTI_LINK_KEYS/u);
	assert.match(DATA_SOURCE, /"lw-scope-thread": \["PAY-101", "PAY-121", "PAY-104"\]/u);
	assert.match(DATA_SOURCE, /issueStatus: "Done"/u);
	assert.match(DATA_SOURCE, /issueStatus: "In review"/u);
	assert.match(TYPES_SOURCE, /getSuggestedWorkItemKeys\?: \(item: AgentSessionItem\) => readonly string\[\] \| undefined;/u);
	assert.match(TYPES_SOURCE, /onLinkWorkItem\?: \(item: AgentSessionItem, workItemKey\?: string\) => void;/u);
	assert.match(WORK_ITEM_SOURCE, /export function resolveAgentSessionWorkItemKey/u);
	assert.match(WORK_ITEM_SOURCE, /const firstKey = getSuggestedWorkItemKeys\?\.\(item\)\?\.\[0\];/u);
	assert.match(INDEX_SOURCE, /onLinkWorkItem=\{flyoutActions\.onLinkWorkItem\}/u);
	assert.match(PAGE_SOURCE, /onSubtasks=\{handleCapture\}/u);
	assert.match(WORK_ITEM_SOURCE, /export function bindAgentSessionFlyoutActions/u);
	assert.match(WORK_ITEM_SOURCE, /capturedItemIds\?: ReadonlySet<string>;/u);
	assert.match(
		WORK_ITEM_SOURCE,
		/actions\.onLinkWorkItem\?\.\(item, workItemKey\.length > 0 \? workItemKey : undefined\)/u,
	);
	assert.match(WORK_ITEM_SOURCE, /actions\.onCreateWorkItem\?\.\(item\)/u);
	assert.match(WORK_ITEM_SOURCE, /actions\.onSubtasks\?\.\(item\)/u);
	assert.match(WORK_ITEM_SOURCE, /if \(isCaptured\(session\)\) \{\s*return;/u);
	assert.match(
		WORK_ITEM_SOURCE,
		/if \(trimmed === undefined \|\| trimmed\.length === 0 \|\| trimmed === session\.issueKey\)/u,
	);
	assert.match(WORK_ITEM_SOURCE, /return \{ \.\.\.session, issueKey: trimmed \};/u);
	assert.match(FLYOUT_SOURCE, /capturedSessionIds\?: ReadonlySet<string>;/u);
	assert.match(FLYOUT_SOURCE, /const linkLabel = hasIssueKey \? `Link to \$\{issueKey\}` : "Link work item";/u);
	assert.match(FLYOUT_SOURCE, /captureLocked \|\| onLinkWorkItem === undefined/u);
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

