const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const CARD_SOURCE = readFileSync(join(__dirname, "agent-session-card.tsx"), "utf8");
const LIST_CARD_SOURCE = readFileSync(
	join(__dirname, "../agent-list/agent-list-card.tsx"),
	"utf8",
);
const COMPACT_CARD_SOURCE = readFileSync(
	join(__dirname, "agent-session-compact-card.tsx"),
	"utf8",
);
const MEDIUM_CARD_SOURCE = readFileSync(
	join(__dirname, "agent-session-medium-card.tsx"),
	"utf8",
);
const MEDIUM_DRAG_SOURCE = readFileSync(
	join(__dirname, "agent-session-medium-drag.tsx"),
	"utf8",
);
const MORE_MENU_SOURCE = readFileSync(
	join(__dirname, "agent-session-medium-more-menu.tsx"),
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

test("renders each session as a solid uncaptured-work card around the shared row", () => {
	assert.match(CARD_SOURCE, /data-testid=\{"agent-session-row-" \+ item.id\}/u);
	// Solid disabled frame. A newly synced card recolours the same border to
	// discovery rather than replacing it. Resting untracked chrome stays disabled.
	assert.match(CARD_SOURCE, /!captured && isNew \? "border-border-discovery" : "border-border-disabled"/u);
	assert.match(CARD_SOURCE, /border border-solid/u);
	assert.doesNotMatch(CARD_SOURCE, /dash-4-2/u);
	assert.doesNotMatch(CARD_SOURCE, /bg-surface-sunken/u);
	assert.doesNotMatch(CARD_SOURCE, /(?<!hover:)bg-surface(?!-sunken|-hovered)/u);
	assert.doesNotMatch(CARD_SOURCE, /bg-bg-accent-gray-subtlest/u);
	assert.doesNotMatch(CARD_SOURCE, /UncapturedWorkChin/u);
	// The row presenter stays owned by Agent List; this block only frames it.
	assert.match(
		CARD_SOURCE,
		/import \{\s*AgentListRow,\s*type AgentListRowHoverActions,\s*\} from "@\/components\/blocks\/agent-list\/agent-list-card";/u,
	);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*hoverActions=\{hoverActions\}/u);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*isCompact=\{false\}/u);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*isSelected=\{isSelected\}/u);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*showHoverActionsWhenSelected/u);
	assert.doesNotMatch(CARD_SOURCE, /isSelected=\{false\}/u);
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
	assert.match(
		TYPES_SOURCE,
		/export type AgentSessionVariant = "large" \| "medium-detached" \| "medium-attached" \| "small";/u,
	);
	assert.match(TYPES_SOURCE, /variant\?: AgentSessionVariant;/u);
	assert.match(INDEX_SOURCE, /variant = "large"/u);
	assert.match(INDEX_SOURCE, /const items = itemsProp \?\? \(isAttached \? AGENT_SESSION_ATTACHED_ITEMS : AGENT_SESSION_ITEMS\);/u);
	assert.match(INDEX_SOURCE, /data-variant=\{variant\}/u);
	assert.match(INDEX_SOURCE, /variant === "large"/u);
	assert.match(INDEX_SOURCE, /<AgentSessionCard/u);
	assert.match(INDEX_SOURCE, /<AgentSessionCompactCard/u);
	assert.match(TYPES_SOURCE, /issueKey\?: string;/u);
	assert.match(INDEX_SOURCE, /issueKey=\{issueKey\}/u);
	assert.match(INDEX_SOURCE, /render=\{<li data-testid=\{"agent-session-row-" \+ item\.id\} \/>\}/u);
});

test("medium matches the 276 by 33 Figma row and reuses shared identity primitives", () => {
	assert.match(MEDIUM_CARD_SOURCE, /import LinkIcon from "@atlaskit\/icon\/core\/link";/u);
	assert.match(MEDIUM_CARD_SOURCE, /import \{ AgentAvatarVisual \} from "@\/components\/ui-custom\/agent-avatar-visual";/u);
	assert.match(MEDIUM_CARD_SOURCE, /import \{ Avatar, AvatarFallback, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(MEDIUM_CARD_SOURCE, /h-\[33px\] w-\[276px\]/u);
	assert.match(MEDIUM_CARD_SOURCE, /items-center gap-2 rounded-\[10px\] border border-transparent px-3/u);
	// Resting surface moved out of the base string when the column-hover
	// highlight added a pressed branch; the rest/hover pair itself is unchanged.
	assert.match(
		MEDIUM_CARD_SOURCE,
		/"bg-bg-accent-gray-subtlest hover:bg-bg-accent-gray-subtlest-hovered"/u,
	);
	assert.match(MEDIUM_CARD_SOURCE, /sizePx=\{16\}/u);
	assert.match(MEDIUM_CARD_SOURCE, /min-w-0 flex-1 truncate text-left text-xs font-normal leading-4 text-text-subtlest/u);
	assert.match(MEDIUM_CARD_SOURCE, /<Icon className="text-icon-subtle" render=\{<LinkIcon label="" size="small" \/>\} \/>/u);
	assert.match(MEDIUM_CARD_SOURCE, /size="icon-compact"/u);
	assert.match(MEDIUM_CARD_SOURCE, /flex shrink-0 items-center gap-0/u);
	assert.match(
		MEDIUM_CARD_SOURCE,
		/className="flex size-6 shrink-0 items-center justify-center -mr-1"/u,
	);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /size-3|w-\[34px\]/u);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /absolute inset-0/u);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /-mx-0\.5/u);
	assert.match(MEDIUM_CARD_SOURCE, /uncapturedWorkLinkLabel\(issueKey \?\? item\.sessionDetails\?\.issueKey\)/u);
	assert.match(MEDIUM_CARD_SOURCE, /aria-label=\{linkLabel\}/u);
	assert.match(MEDIUM_CARD_SOURCE, /<TooltipContent>\{linkLabel\}<\/TooltipContent>/u);
	assert.match(MEDIUM_CARD_SOURCE, /onAttach\?\.\(item\)/u);
	assert.match(MEDIUM_CARD_SOURCE, /<AgentSessionMediumMoreMenu/u);
	assert.match(MEDIUM_CARD_SOURCE, /group\/session-card/u);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /className="[^"]*\bhidden\b/u);
	assert.match(MEDIUM_CARD_SOURCE, /<Avatar.*size="xs"/su);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /\?\? \{ name: "person A" \}/u);
	assert.match(
		MEDIUM_CARD_SOURCE,
		/const identityLabel = invoker === undefined[\s\S]*\? item\.agent\.name[\s\S]*: `\$\{item\.agent\.name\} with \$\{invoker\.name\}`;/u,
	);
	assert.match(MEDIUM_CARD_SOURCE, /invoker === undefined \? null : \(/u);
});

test("medium drag chip is the shared agent mention tag with overlay elevation", () => {
	assert.match(
		MEDIUM_DRAG_SOURCE,
		/import \{ AgentSessionMentionChip \} from "@\/components\/blocks\/jira-issue\/agent-session-mention-chip";/u,
	);
	assert.match(MEDIUM_DRAG_SOURCE, /<AgentSessionMentionChip[\s\S]*elevated[\s\S]*name=\{item\.agent\.name\}/u);
	assert.match(MEDIUM_DRAG_SOURCE, /\{isDragging \? chip : children\(undefined\)\}/u);
	assert.match(
		MEDIUM_DRAG_SOURCE,
		/className="pointer-events-none flex w-fit max-w-full -translate-x-1\/2 -translate-y-1\/2 items-center justify-start"/u,
	);
	assert.match(MEDIUM_DRAG_SOURCE, /useSessionDragChipPointer/u);
	assert.match(MEDIUM_DRAG_SOURCE, /sessionDragChipViewportStyle\(isDragging\)/u);
	assert.match(MEDIUM_DRAG_SOURCE, /-translate-x-1\/2 -translate-y-1\/2/u);
	assert.match(MEDIUM_DRAG_SOURCE, /data-session-chip-centered=""/u);
	assert.doesNotMatch(MEDIUM_DRAG_SOURCE, /bg-surface-raised/u);
	assert.doesNotMatch(MEDIUM_DRAG_SOURCE, /h-\[33px\] w-fit/u);
	assert.doesNotMatch(MEDIUM_DRAG_SOURCE, /from "@\/components\/visual\/gooey"/u);
	assert.doesNotMatch(MEDIUM_DRAG_SOURCE, /<Gooey/u);
});

test("medium drag keeps pointer capture on the motion host instead of swapping a chip button", () => {
	// Replacing `children(sessionDragBind)` with a new chip button on drag-start
	// unmounted the node that called setPointerCapture. pointerup never fired,
	// so the card stuck on an empty grey attach chin.
	assert.doesNotMatch(MEDIUM_DRAG_SOURCE, /isDragging \? chip : children\(sessionDragBind\)/u);
	assert.match(MEDIUM_DRAG_SOURCE, /<motion\.div\s*\n\s*ref=\{hostRef\}/u);
	assert.match(MEDIUM_DRAG_SOURCE, /\{\.\.\.sessionDragBind\}/u);
	assert.match(MEDIUM_DRAG_SOURCE, /window\.addEventListener\("pointerup", onPointerUp\)/u);
	assert.match(MEDIUM_DRAG_SOURCE, /window\.addEventListener\("pointercancel", onPointerCancel\)/u);
});

test("medium drag publishes the attach transfer only after the pointer moves", () => {
	// Publishing on pointerdown grows the card chin under the pill and arms
	// onLink, so a click without movement reattaches the session.
	assert.match(MEDIUM_DRAG_SOURCE, /SESSION_DRAG_PUBLISH_THRESHOLD_PX = 2/u);
	assert.match(MEDIUM_DRAG_SOURCE, /pointerOriginRef\.current = \{ x: event\.clientX, y: event\.clientY \}/u);
	assert.doesNotMatch(
		MEDIUM_DRAG_SOURCE,
		/onPointerDown: \(event: ReactPointerEvent<HTMLElement>\) => \{\s*\n\s*drag\.bind\.onPointerDown\(event\);\s*\n\s*publishSessionDrag\(true, event\);/u,
	);
	assert.match(MEDIUM_DRAG_SOURCE, /if \(moved\) \{\s*\n\s*publishSessionDrag\(true, event\);/u);
});

test("medium more menu collapses until hover so the label can use the slot", () => {
	assert.match(MORE_MENU_SOURCE, /flex h-6 w-0 shrink-0 overflow-hidden/u);
	assert.match(MORE_MENU_SOURCE, /group-hover\/session-card:w-6/u);
	assert.match(MORE_MENU_SOURCE, /group-has-\[:focus-visible\]\/session-card:w-6/u);
	assert.match(MORE_MENU_SOURCE, /group-has-\[:focus-visible\]\/session-card:overflow-visible/u);
	assert.match(
		MORE_MENU_SOURCE,
		/aria-label=\{`More actions for \$\{label\} session`\}[\s\S]*size="icon-compact"/u,
	);
	assert.match(
		MORE_MENU_SOURCE,
		/<Icon className="text-icon-subtle" render=\{<ShowMoreHorizontalIcon label="" size="small" color="currentColor" \/>\} \/>/u,
	);
	assert.doesNotMatch(MORE_MENU_SOURCE, /size-3|grid-cols-\[0fr\]/u);
	assert.doesNotMatch(MORE_MENU_SOURCE, /(?:^|[\s"'`])hidden(?:[\s"'`]|$)/u);
	assert.match(MORE_MENU_SOURCE, /<DropdownMenuContent align="end" className="min-w-0 w-max">/u);
	assert.match(MORE_MENU_SOURCE, /if \(!hasSubtasks && !hasCreateWorkItem\) \{\s*\n\s*return null;/u);
	assert.match(MORE_MENU_SOURCE, /<DropdownMenuItem disabled=\{!hasSubtasks\} onSelect=\{\(\) => onSubtasks\?\.\(\)\}>\s*\n\s*Add as a subtask/u);
	assert.match(MORE_MENU_SOURCE, /<DropdownMenuItem disabled=\{!hasCreateWorkItem\} onSelect=\{\(\) => onCreateWorkItem\?\.\(\)\}>\s*\n\s*Create new/u);
	assert.match(INDEX_SOURCE, /onCreateWorkItem=\{onCreateWorkItem\}/u);
	assert.match(INDEX_SOURCE, /onSubtasks=\{onSubtasks\}/u);
});

test("medium attached reuses the Jira issue agent activity row", () => {
	assert.match(
		COMPACT_CARD_SOURCE,
		/import \{ JiraIssueAgentActivityRows \} from "@\/components\/blocks\/jira-issue\/agent-activity";/u,
	);
	assert.match(COMPACT_CARD_SOURCE, /variant === "medium-attached"/u);
	assert.match(COMPACT_CARD_SOURCE, /<JiraIssueAgentActivityRows/u);
	assert.match(COMPACT_CARD_SOURCE, /usesStrokeChrome/u);
	assert.match(WORK_ITEM_SOURCE, /item\.state === "needs-input" \|\| item\.state === "attention"/u);
	assert.match(COMPACT_CARD_SOURCE, /toJiraIssueAgentActivityFromSession\(item\)/u);
	assert.match(COMPACT_CARD_SOURCE, /const shouldPlayArrival = isArriving && !shouldReduceMotion;/u);
	assert.match(COMPACT_CARD_SOURCE, /data-new=\{isNew \|\| undefined\}/u);
	assert.match(COMPACT_CARD_SOURCE, /isNew \? "ring-1 ring-border-discovery" : null/u);
	assert.match(COMPACT_CARD_SOURCE, /Newly synced, not yet reviewed/u);
	assert.match(COMPACT_CARD_SOURCE, /initial=\{shouldPlayArrival \? \{ opacity: 0, y: AGENT_SESSION_ARRIVAL_OFFSET_PX \} : false\}/u);
	assert.match(INDEX_SOURCE, /const isAttached = variant === "medium-attached";/u);
	assert.match(INDEX_SOURCE, /content=\{isAttached \? "details" : "untracked-work"\}/u);
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
	assert.match(COMPACT_CARD_SOURCE, /onView === undefined \? "Preview" : "Open"/u);
	assert.match(COMPACT_CARD_SOURCE, /onClick=\{onView === undefined \? undefined : \(\) => onView\(item\)\}/u);
	assert.match(COMPACT_CARD_SOURCE, /<AgentSessionNotchMark isArriving=\{isArriving\} isNew=\{isNew\} \/>/u);
	// One 1px hairline, the same weight as a Pulse ruler rule. It never shrinks:
	// the magnified path is meant to outgrow its row. Standalone it has no rail
	// behind it, so `w-3` is its resting length and its own row's hover is the
	// only affordance available to it.
	assert.match(NOTCH_SOURCE, /"h-px shrink-0"/u);
	assert.match(NOTCH_SOURCE, /w-3 transition-\[background-color,scale\]/u);
	assert.doesNotMatch(COMPACT_CARD_SOURCE, /proximity/u);
	assert.match(NOTCH_SOURCE, /isNew \? NOTCH_EMPHASIS : NOTCH_AT_REST/u);
	assert.match(NOTCH_SOURCE, /const NOTCH_EMPHASIS = "scale-x-\[1\.6\] bg-icon";/u);
	assert.match(NOTCH_SOURCE, /"bg-icon-subtlest",/u);
	assert.match(NOTCH_SOURCE, /group-hover\/notch:bg-icon/u);
	assert.match(NOTCH_SOURCE, /toAgentSessionNotchTone\(/u);
	assert.doesNotMatch(NOTCH_SOURCE, /toAgentSessionNotchOpacity|transition-opacity/u);
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
	assert.match(CARD_SOURCE, /visibilityLabel === "Show"/u);
	assert.match(CARD_SOURCE, /<EyeOpenIcon label="" size="small" \/>/u);
	assert.match(CARD_SOURCE, /<EyeOpenStrikethroughIcon label="" size="small" \/>/u);
	assert.match(CARD_SOURCE, /label: visibilityLabel,/u);
	assert.match(CARD_SOURCE, /visibilityLabel = "Hide"/u);
	assert.match(CARD_SOURCE, /import EyeOpenIcon from "@atlaskit\/icon\/core\/eye-open";/u);
	assert.match(CARD_SOURCE, /import EyeOpenStrikethroughIcon from "@atlaskit\/icon\/core\/eye-open-strikethrough";/u);
	assert.match(CARD_SOURCE, /group\/agent-row relative flex w-full cursor-pointer rounded-none p-3 text-left text-text/u);
	assert.doesNotMatch(CARD_SOURCE, /hover:border-border(?!-disabled)/u);
	assert.doesNotMatch(CARD_SOURCE, /focus-within:border-border(?!-disabled)/u);
	assert.match(CARD_SOURCE, /hover:bg-surface-hovered/u);
	assert.match(CARD_SOURCE, /transition-\[border-color,background-color\] duration-xxshort ease-out-practical/u);
	assert.doesNotMatch(CARD_SOURCE, /hover:bg-white/u);
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
	assert.match(TYPES_SOURCE, /onItemHover\?: \(item: AgentSessionItem \| null\) => void;/u);
	assert.match(INDEX_SOURCE, /onItemHover=\{onItemHover\}/u);
	assert.match(CARD_SOURCE, /onPointerEnter=\{\(\) => onItemHover\?\.\(item\)\}/u);
	assert.match(CARD_SOURCE, /onPointerLeave=\{\(\) => onItemHover\?\.\(null\)\}/u);
	assert.match(CARD_SOURCE, /onItemHoverRef\.current\?\.\(null\)/u);
	assert.match(
		CARD_SOURCE,
		/useEffect\(\(\) => \{\s*onItemHoverRef\.current = onItemHover;\s*\}, \[onItemHover\]\)/u,
	);
	assert.match(CARD_SOURCE, /onItemHover\?\.\(null\);\s*onToggleVisibility\?\.\(item\)/u);
	// The shared row fades actions in; uncaptured-work snaps them on.
	assert.match(LIST_CARD_SOURCE, /group-data-\[variant=uncaptured-work\]\/agent-row:transition-none/u);
	assert.match(CARD_SOURCE, /data-variant="uncaptured-work"/u);
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
	assert.match(INDEX_SOURCE, /content=\{isAttached \? "details" : "untracked-work"\}/u);
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

test("every size variant opens the shared agent-session flyout", () => {
	// Large connects inside AgentSessionCard; attached compact variants connect
	// at the list-item boundary so Medium attached, Medium detached, and Small
	// keep their geometry while every session still opens the shared surface.
	assert.match(CARD_SOURCE, /<JiraSessionFlyoutTrigger/u);
	assert.match(
		INDEX_SOURCE,
		/<JiraSessionFlyoutTrigger[\s\S]*render=\{<li data-testid=\{"agent-session-row-" \+ item\.id\} \/>\}[\s\S]*session=\{flyoutSession\}/u,
	);
	assert.match(INDEX_SOURCE, /variant === "medium-detached" \? sessionDrag : undefined/u);
	assert.doesNotMatch(
		INDEX_SOURCE,
		/return variant === "medium-detached" \? \([\s\S]*?\)\s*:\s*\(\s*<JiraSessionFlyoutTrigger/u,
	);
	assert.match(
		INDEX_SOURCE,
		/<JiraSessionFlyoutTrigger[\s\S]*render=\{<li data-testid=\{"agent-session-row-" \+ item\.id\} \/>\}[\s\S]*\{compactCard\}[\s\S]*<\/JiraSessionFlyoutTrigger>/u,
	);
	assert.doesNotMatch(INDEX_SOURCE, /renderMore=/u);
	assert.match(COMPACT_CARD_SOURCE, /onView === undefined && !flyout/u);
	assert.match(MEDIUM_CARD_SOURCE, /onView === undefined && !flyout/u);
	assert.match(
		INDEX_SOURCE,
		/<JiraSessionFlyoutSurface[\s\S]*content=\{isAttached \? "details" : "untracked-work"\}[\s\S]*handle=\{flyoutHandle\}/u,
	);
	assert.doesNotMatch(INDEX_SOURCE, /\{variant === "large" \? \(\s*<JiraSessionFlyoutSurface/u);
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
	assert.match(INDEX_SOURCE, /toJiraIssueAgentActivityFromSession,/u);
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
		/isCodingAgentListItem\(item\)\s*\? onView === undefined\s*\? undefined\s*: handleView/u,
	);
});

test("a card body click toggles a single selected session on blue-subtlest", () => {
	assert.match(TYPES_SOURCE, /selectedItemId\?: string \| null;/u);
	assert.match(TYPES_SOURCE, /onSelectedItemIdChange\?: \(itemId: string \| null\) => void;/u);
	assert.match(INDEX_SOURCE, /selectedItemId: selectedItemIdProp,/u);
	assert.match(INDEX_SOURCE, /const isSelectionControlled = selectedItemIdProp !== undefined;/u);
	assert.match(
		INDEX_SOURCE,
		/const nextId = selectedItemId === item\.id \? null : item\.id;/u,
	);
	assert.match(INDEX_SOURCE, /onSelectedItemIdChange\?\.\(nextId\);/u);
	assert.match(
		INDEX_SOURCE,
		/if \(nextId !== null\) \{\s*\n\s*onView\?\.\(item\);\s*\n\s*\}/u,
	);
	assert.match(INDEX_SOURCE, /isSelected=\{item\.id === selectedItemId\}/u);
	assert.match(CARD_SOURCE, /isSelected\s*\n\s*\? "bg-bg-accent-blue-subtlest"/u);
	assert.match(CARD_SOURCE, /"bg-transparent hover:bg-surface-hovered"/u);
	assert.match(CARD_SOURCE, /data-selected=\{isSelected \|\| undefined\}/u);
	assert.match(CARD_SOURCE, /aria-current=\{isSelected \? "true" : undefined\}/u);
	assert.match(CARD_SOURCE, /isSelected=\{isSelected\}/u);
	assert.match(CARD_SOURCE, /showHoverActionsWhenSelected/u);
	assert.match(
		LIST_CARD_SOURCE,
		/const showHoverActions = \(!isSelected \|\| showHoverActionsWhenSelected\) &&/u,
	);
	// The article owns activation so padding and avatar toggle. RowBody must
	// not also fire handleView, or one click would select then immediately clear.
	assert.match(CARD_SOURCE, /onClick=\{handleArticleClick\}/u);
	assert.match(CARD_SOURCE, /onKeyDown=\{handleArticleKeyDown\}/u);
	assert.match(CARD_SOURCE, /role=\{activateCard === undefined \? undefined : "button"\}/u);
	assert.match(CARD_SOURCE, /event\.target\.closest\("button"\) !== null/u);
	assert.match(CARD_SOURCE, /<AgentListRow[\s\S]*onView=\{undefined\}/u);
	assert.match(LIST_CARD_SOURCE, /event\.stopPropagation\(\);\s*\n\s*action\.onClick\(\)/u);
	assert.doesNotMatch(CARD_SOURCE, /isSelected=\{false\}/u);
	assert.doesNotMatch(CARD_SOURCE, /bg-bg-selected/u);
	assert.doesNotMatch(CARD_SOURCE, /bg-\[var\(--ds-/u);
});

test("ships demo data and catalog entries for every attachment and size variant", () => {
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
	assert.match(DEMO_SOURCE, /export function AgentSessionDemoMediumDetached\(\)/u);
	assert.match(DEMO_SOURCE, /export function AgentSessionDemoMediumAttached\(\)/u);
	assert.match(DEMO_SOURCE, /export function AgentSessionDemoSmall\(\)/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"agent-session-demo-medium-detached": dynamic\(/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"agent-session-demo-medium-attached": dynamic\(/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"agent-session-demo-small": dynamic\(/u);
	assert.match(DETAIL_SOURCE, /title: "Medium detached"/u);
	assert.match(DETAIL_SOURCE, /title: "Medium attached"/u);
	assert.match(DETAIL_SOURCE, /title: "Small"/u);
	assert.match(DETAIL_SOURCE, /name: "variant"/u);
	assert.match(DETAIL_SOURCE, /type: '"large" \| "medium-detached" \| "medium-attached" \| "small"'/u);
	assert.match(
		DETAIL_SOURCE,
		/import \{ AgentSession \} from "@\/components\/blocks\/agent-session";/u,
	);
	assert.doesNotMatch(DEMO_SOURCE, /AgentSessionDemoMultiLink/u);
	assert.doesNotMatch(VARIANT_REGISTRY_SOURCE, /agent-session-demo-multi-link/u);
	assert.doesNotMatch(DETAIL_SOURCE, /agent-session-demo-multi-link/u);
});

test("large uncaptured-work cards stack as one solid well", () => {
	// No gap, first card rounded on top, last on the bottom, shared edges
	// collapsed to a single stroke. A single card is both first and last, so
	// it keeps a full rounded frame.
	assert.match(INDEX_SOURCE, /variant === "large"\s*\n\s*\? "gap-0"\s*\n\s*: variant === "medium-detached"\s*\n\s*\? undefined\s*\n\s*: "gap-2"/u);
	assert.match(INDEX_SOURCE, /gap: token\("space\.025"\)/u);
	assert.match(INDEX_SOURCE, /data-stack=\{variant === "large" \? "well" : undefined\}/u);
	assert.match(CARD_SOURCE, /\[li:first-child_&\]:rounded-t-lg/u);
	assert.match(CARD_SOURCE, /\[li:last-child_&\]:rounded-b-lg/u);
	assert.match(CARD_SOURCE, /\[li:not\(:last-child\)_&\]:border-b-0/u);
	assert.match(CARD_SOURCE, /border border-solid/u);
	assert.doesNotMatch(CARD_SOURCE, /dash-4-2/u);
	assert.doesNotMatch(CARD_SOURCE, /rounded-none border bg-transparent/u);
	assert.doesNotMatch(CARD_SOURCE, /rounded-lg border p-3/u);
	assert.doesNotMatch(INDEX_SOURCE, /flex flex-col gap-2/u);
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
