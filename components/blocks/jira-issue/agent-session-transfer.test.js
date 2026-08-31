const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

// Source contracts for the agent-session transfer surface: the Unlink/Link
// demo phases, the drop well, the gooey pull-out, and the split review chin.
// Split out of jira-issue.test.js to keep both files under the 1000-line budget.
const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const AGENT_ACTIVITY_SOURCE = readFileSync(join(__dirname, "agent-activity.tsx"), "utf8");
const COMPLETED_RUNS_SOURCE = readFileSync(join(__dirname, "completed-agent-runs.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
// The drag state/binding types and the idle constant live outside the component
// file so a value export cannot defeat Fast Refresh (only-export-components).
const DRAG_SOURCE = readFileSync(join(__dirname, "agent-session-drag.ts"), "utf8");
const TRANSFER_SOURCE = readFileSync(join(__dirname, "agent-session-transfer.tsx"), "utf8");
const MAGNETIC_PROXIMITY_SOURCE = readFileSync(
	join(__dirname, "../../ui-custom/hooks/use-magnetic-proximity.ts"),
	"utf8",
);
const BASE_DEMO_STATES_START = PAGE_SOURCE.indexOf("const JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES = [");
const TRANSFER_DEMO_STATES_START = PAGE_SOURCE.indexOf(
	"const JIRA_ISSUE_AGENT_SESSION_TRANSFER_DEMO_STATES = [",
);
const BASE_DEMO_STATES_BLOCK = PAGE_SOURCE.slice(BASE_DEMO_STATES_START, TRANSFER_DEMO_STATES_START);
const TRANSFER_REGION_BLOCK = TRANSFER_SOURCE.slice(
	TRANSFER_SOURCE.indexOf("export function JiraIssueAgentSessionTransfer("),
);

test("Jira issue agent session transfer adds two demo phases gated to the experimental variant", () => {
	assert.ok(BASE_DEMO_STATES_START >= 0, "the base demo-state list must exist");
	assert.ok(
		TRANSFER_DEMO_STATES_START > BASE_DEMO_STATES_START,
		"the transfer demo-state list must be declared after the base list so it can be concatenated onto it",
	);
	// The two phases are real demo states, not ad-hoc strings.
	assert.match(
		PAGE_SOURCE,
		/type JiraIssueAgentActivityDemoState =[\s\S]*\| "agent-session-unlink"\s*\n\s*\| "agent-session-link";/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const JIRA_ISSUE_AGENT_SESSION_TRANSFER_DEMO_STATES = \[\s*\n\s*\{ value: "agent-session-unlink", label: "Unlink" \},\s*\n\s*\{ value: "agent-session-link", label: "Link" \},\s*\n\] as const satisfies readonly \{ value: JiraIssueAgentActivityDemoState; label: string \}\[\];/u,
	);
	assert.match(
		PAGE_SOURCE,
		/function isSessionTransferDemoState\(state: JiraIssueAgentActivityDemoState\): boolean \{\s*\n\s*return state === "agent-session-unlink" \|\| state === "agent-session-link";/u,
	);
	// Move is gone: no demo phase, no work-item fixtures, no move commit path.
	assert.doesNotMatch(PAGE_SOURCE, /agent-session-move|JIRA_ISSUE_MOVE_WORK_ITEMS|onMove/u);
	// Gating: the extra tabs only exist when the demo is told to show them, and
	// only the experimental (stroke) variant asks for that.
	assert.match(PAGE_SOURCE, /showSessionTransferStates\?: boolean;/u);
	assert.match(PAGE_SOURCE, /showSessionTransferStates = false,/u);
	assert.match(
		PAGE_SOURCE,
		/const demoStates = showSessionTransferStates\s*\n\s*\? \[\.\.\.JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES, \.\.\.JIRA_ISSUE_AGENT_SESSION_TRANSFER_DEMO_STATES\]\s*\n\s*: JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES;/u,
	);
	assert.match(
		PAGE_SOURCE,
		/<JiraIssueAgentActivityStatesDemo[\s\S]*showSessionTransferStates=\{isExperimentalAgentActivityVariant\}/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const isTransferPhase = showSessionTransferStates && isSessionTransferDemoState\(agentActivityState\);/u,
	);
	// A transfer phase is what mounts the transfer config; nothing else does.
	assert.match(
		PAGE_SOURCE,
		/const agentSessionTransfer: JiraIssueAgentSessionTransferConfig \| undefined = useMemo\(\s*\n\s*\(\) => \(isTransferPhase && !isLinkPhase \? \{ onUnlink: handleSessionUnlink \} : undefined\),/u,
	);
});

test("Jira issue unlink hands the session to the Link phase, detached under the work item", () => {
	// Dropping on the well is the only commit, and it lands the session in the
	// detached card that renders below the issue.
	assert.match(
		PAGE_SOURCE,
		/const handleSessionUnlink = useCallback\(\(\) => \{\s*\n\s*setAgentActivityState\("agent-session-link"\);\s*\n\s*\}, \[\]\);/u,
	);
	assert.match(PAGE_SOURCE, /\{isLinkPhase \? \(\s*\n\s*<JiraIssueDetachedAgentSession/u);
	// The Link phase drops the transfer region, so the detached card is not
	// offered another drop well while it is already off the card.
	assert.match(PAGE_SOURCE, /const isLinkPhase = isTransferPhase && agentActivityState === "agent-session-link";/u);
});

test("Jira issue raised agent activity demo still exposes exactly the original six tabs", () => {
	const baseStateCount = (BASE_DEMO_STATES_BLOCK.match(/\{ value: "/gu) ?? []).length;
	assert.equal(baseStateCount, 6, "the raised demo must keep exactly its original six tabs");
	for (const value of ["default", "single-agent-working", "multiple-agents-working", "awaiting-user-input", "agent-completed-work", "agent-dismissed-work"]) {
		assert.match(BASE_DEMO_STATES_BLOCK, new RegExp(`\\{ value: "${value}", label: "[^"]+" \\},`, "u"));
	}
	// The transfer phases must never leak into the shared base list, which is
	// what the raised (non-experimental) demo renders verbatim.
	for (const value of ["agent-session-unlink", "agent-session-link"]) {
		assert.doesNotMatch(BASE_DEMO_STATES_BLOCK, new RegExp(`"${value}"`, "u"));
	}
	assert.match(PAGE_SOURCE, /agentActivityLayout=\{isExperimentalAgentActivityVariant \? "split" : "merged"\}/u);
	assert.match(PAGE_SOURCE, /chrome=\{isExperimentalAgentActivityVariant \? "stroke" : "raised"\}/u);
});

test("Jira issue session transfer drop zone stays mounted and reveals with opacity, not display", () => {
	// Always rendered: the region has no early return and no conditional around
	// the zone, so it stays in the DOM and in the tab order.
	assert.doesNotMatch(TRANSFER_REGION_BLOCK, /return null/u);
	assert.doesNotMatch(TRANSFER_REGION_BLOCK, /\{dragging \? </u);
	assert.equal(
		(TRANSFER_REGION_BLOCK.match(/<TransferDropZone/gu) ?? []).length,
		1,
		"the region renders exactly the one Unlink zone",
	);
	// Revealed purely through opacity + pointer-events.
	assert.match(
		TRANSFER_SOURCE,
		/const TRANSFER_REVEAL_CLASS =\s*\n\s*"opacity-0 transition-\[opacity,translate\] duration-fast ease-out-practical motion-reduce:transition-none group-has-\[\[data-slot=jira-issue-agent-row\]:hover\]\/jira-issue-transfer:pointer-events-auto group-has-\[\[data-slot=jira-issue-agent-row\]:hover\]\/jira-issue-transfer:opacity-100 group-has-\[\[data-slot=jira-issue-session-transfer\]:hover\]\/jira-issue-transfer:pointer-events-auto group-has-\[\[data-slot=jira-issue-session-transfer\]:hover\]\/jira-issue-transfer:opacity-100 group-has-\[:focus-visible\]\/jira-issue-transfer:pointer-events-auto group-has-\[:focus-visible\]\/jira-issue-transfer:opacity-100";/u,
	);
	assert.match(
		TRANSFER_REGION_BLOCK,
		/className=\{cn\(\s*"flex flex-col pt-2",\s*TRANSFER_REVEAL_CLASS,\s*dragging \? "pointer-events-auto opacity-100" : "pointer-events-none",\s*dragging \? TRANSFER_DRAG_SHIFT_CLASS : null,\s*\)\}/u,
	);
	assert.match(TRANSFER_REGION_BLOCK, /data-slot="jira-issue-session-transfer"/u);
	// `group-focus-within` would pin the reveal open after a click; the repo
	// convention is `group-has-[:focus-visible]`.
	assert.doesNotMatch(TRANSFER_SOURCE, /group-focus-within/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /className="[^"]*\bhidden\b/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /display: *"?none/u);
	// The host card has to carry the group so an agent row anywhere inside it can
	// drive the reveal.
	assert.match(
		TRANSFER_SOURCE,
		/export const JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS = "group\/jira-issue-transfer";/u,
	);
	assert.match(
		PAGE_SOURCE,
		/className=\{cn\("w-full", agentSessionTransfer \? JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS : undefined\)\}/u,
	);
});

test("Jira issue session transfer well is offered by the session row, not the whole card", () => {
	// A bare `group-hover` meant hovering the summary, the tags, or the subtasks
	// row put a drop target under the pointer for a session it had never
	// touched. The reveal now needs an agent session row under the pointer.
	assert.doesNotMatch(TRANSFER_SOURCE, /group-hover\/jira-issue-transfer/u);
	assert.match(TRANSFER_SOURCE, /group-has-\[\[data-slot=jira-issue-agent-row\]:hover\]\/jira-issue-transfer:opacity-100/u);
	// The row's slot is the hook, so it has to still be on the row the gesture
	// starts from.
	assert.match(AGENT_ACTIVITY_SOURCE, /data-slot="jira-issue-agent-row"/u);
	// Travel path: the region itself is the second trigger, so crossing its own
	// `pt-2` gap on the way to the well does not drop the reveal. It is
	// `pointer-events-none` at rest, so it cannot self-trigger from nothing.
	assert.match(
		TRANSFER_SOURCE,
		/group-has-\[\[data-slot=jira-issue-session-transfer\]:hover\]\/jira-issue-transfer:opacity-100/u,
	);
	assert.match(TRANSFER_REGION_BLOCK, /dragging \? "pointer-events-auto opacity-100" : "pointer-events-none"/u);
	// Keyboard reveal stays card-wide: the well is tabbable, and narrowing focus
	// to the row would leave it reachable while invisible.
	assert.match(TRANSFER_SOURCE, /group-has-\[:focus-visible\]\/jira-issue-transfer:opacity-100/u);
});

test("Jira issue session transfer drop zone is a labelled button reachable by keyboard", () => {
	assert.match(
		TRANSFER_SOURCE,
		/<button\s*\n\s*aria-label=\{description\}[\s\S]*type="button"/u,
	);
	assert.match(TRANSFER_SOURCE, /description: string;/u);
	// The zone carries an action-describing accessible name, and its visible
	// label states the gesture now that there is no separator prompt above it.
	assert.match(TRANSFER_REGION_BLOCK, /description=\{`Unlink \$\{sessionLabel\} from this work item`\}/u);
	assert.match(TRANSFER_REGION_BLOCK, /label=\{config\.unlinkLabel \?\? "Drag here to unlink"\}/u);
	assert.match(TRANSFER_SOURCE, /sessionLabel = "agent session",/u);
	// Keyboard activation runs the same callback as a drop, and both must say
	// WHICH session they acted on — split layout renders one row per agent
	// against one config.
	assert.match(TRANSFER_REGION_BLOCK, /onClick=\{\(\) => config\.onUnlink\?\.\(session\)\}/u);
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_BASE_CLASS =\s*\n\s*"[^"]*outline-none[^"]*focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring\/50[^"]*"/u);
	// A drop commits exactly what the zone's own click handler commits. The
	// handler is read through a committed ref so the arming effect does not
	// resubscribe on every parent render, so assert the ref stays in sync too.
	assert.match(TRANSFER_SOURCE, /commitRef\.current = \{ onUnlink: config\.onUnlink, session \};/u);
	assert.match(TRANSFER_SOURCE, /if \(dropped\) commitRef\.current\?\.onUnlink\?\.\(commitRef\.current\?\.session\);/u);
});

test("Jira issue keyboard unlink preserves the focused split-row session", () => {
	assert.match(DRAG_SOURCE, /onFocusedActivitiesChange: \(activities: readonly JiraIssueAgentActivity\[\]\) => void;/u);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/onFocus: \(\) => sessionDrag\.onFocusedActivitiesChange\(activities\),/u,
	);
	assert.match(
		SOURCE,
		/onFocusedActivitiesChange: \(activities\) => setAgentSessionDragState\(\(current\) => \(\{[\s\S]*\.\.\.current,[\s\S]*activities,[\s\S]*\}\)\),/u,
	);
});

test("Jira issue session transfer motion honours reduced motion at every layer", () => {
	// CSS transitions on the region and the zones.
	assert.match(TRANSFER_SOURCE, /const TRANSFER_REVEAL_CLASS =[\s\S]*motion-reduce:transition-none/u);
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_BASE_CLASS =[\s\S]*motion-reduce:transition-none"/u);
	// The magnet hook gates itself rather than pushing the decision onto callers,
	// and pins both motion values to 0 when reduced motion is on.
	assert.match(MAGNETIC_PROXIMITY_SOURCE, /const shouldReduceMotion = useReducedMotion\(\);/u);
	assert.match(
		MAGNETIC_PROXIMITY_SOURCE,
		/if \(shouldReduceMotion\) \{\s*\n\s*magnetX\.set\(0\);\s*\n\s*magnetY\.set\(0\);\s*\n\s*return;\s*\n\s*\}/u,
	);
	assert.match(MAGNETIC_PROXIMITY_SOURCE, /shouldReduceMotion,\s*targetRef,?\s*\]\);/u);
	// liquid-gooey only honours reduced motion on its non-observed path, so the
	// dissolve is gated by the caller.
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/dissolve=\{\{\s*active: !shouldReduceMotion && drag\.dragging && !isDraggedOut,/u,
	);
	// A pointer drag must not fight Motion's layout projection.
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const rowLayout = shouldReduceMotion \|\| sessionDragging \? false : "position";/u,
	);
});

test("Jira issue agent activity demo runs no background timers", () => {
	// The Move phase parked a confirmation timer that could advance a hidden
	// demo; the tab handler had to clear it on every switch. With Move gone the
	// demo is timer-free, so a plain state setter is enough — keep it that way.
	assert.doesNotMatch(PAGE_SOURCE, /setTimeout|setInterval/u);
	assert.match(PAGE_SOURCE, /onClick=\{\(\) => setAgentActivityState\(state\.value\)\}/u);
});

test("Jira issue agentSessionTransfer is opt-in so existing consumers are unaffected", () => {
	// Optional prop with no default: absent means the whole feature is inert.
	assert.match(SOURCE, /agentSessionTransfer\?: JiraIssueAgentSessionTransferConfig;/u);
	assert.match(SOURCE, /^\tagentSessionTransfer,$/mu);
	assert.doesNotMatch(SOURCE, /agentSessionTransfer = /u);
	// No config -> no drag binding handed to the chin rows.
	assert.match(
		SOURCE,
		/const agentSessionDragBinding: JiraIssueAgentSessionDragBinding \| undefined = agentSessionTransfer[\s\S]*onDragStateChange: setAgentSessionDragState,[\s\S]*onFocusedActivitiesChange:[\s\S]*: undefined;/u,
	);
	// No config -> no `<Gooey>` root and no transfer region in the tree.
	assert.match(
		SOURCE,
		/const agentActivityShellWithTransfer = agentSessionTransfer \? \([\s\S]*<Gooey \{\.\.\.AGENT_SESSION_TRANSFER_GOO\}[\s\S]*<JiraIssueAgentSessionTransfer[\s\S]*\) : agentActivityShell;/u,
	);
	// No config -> the sparkle reveal expression is unchanged in practice.
	assert.match(
		SOURCE,
		/const agentSessionTransferRevealed = Boolean\(agentSessionTransfer\) && agentSessionDragState\.dragging;/u,
	);
	// No binding -> the chin row keeps its plain click behaviour and skips the
	// gooey wrapper entirely.
	assert.match(AGENT_ACTIVITY_SOURCE, /sessionDrag\?: JiraIssueAgentSessionDragBinding;/u);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/function withSessionDragGoo\(node: ReactElement\) \{\s*\n\s*if \(!sessionDrag\) \{\s*\n\s*return node;\s*\n\s*\}/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const sessionDragBind = sessionDrag\s*\n\s*\? \{[\s\S]*onPointerUp: endSessionDrag,\s*\n\s*\}\s*\n\s*: undefined;/u,
	);
	assert.match(AGENT_ACTIVITY_SOURCE, /\{\.\.\.\(sessionDragBind \?\? \{ onClick: handleOpenChat \}\)\}/u);
	// The demo only opts in for the experimental variant's transfer phases.
	assert.match(PAGE_SOURCE, /agentSessionTransfer=\{agentSessionTransfer\}/u);
});

test("Jira issue splits the finished review chin into one row per completed run", () => {
	// Merged stays the default so every existing consumer keeps the aggregate
	// "N Finished" row; only an explicit split opt-in fans the runs out.
	assert.match(COMPLETED_RUNS_SOURCE, /layout = "merged",/u);
	assert.match(COMPLETED_RUNS_SOURCE, /layout\?: JiraIssueAgentActivityLayout;/u);
	assert.match(COMPLETED_RUNS_SOURCE, /if \(layout === "split"\) \{[\s\S]*props\.runs\.map\(\(run\) => \([\s\S]*<JiraIssueCompletedRunRow/u);
	assert.match(COMPLETED_RUNS_SOURCE, /return <JiraIssueAgentDoneMerged \{\.\.\.props\} \/>;/u);
	// Split rows reuse the working-row chrome so Review reads like 1-n agents.
	assert.match(COMPLETED_RUNS_SOURCE, /function JiraIssueCompletedRunRow\(/u);
	assert.match(COMPLETED_RUNS_SOURCE, /<JiraIssueCompletedRunRow[\s\S]*key=\{run\.id\}/u);
	assert.match(COMPLETED_RUNS_SOURCE, /className="flex h-6 w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1[^"]*"/u);
	assert.match(COMPLETED_RUNS_SOURCE, /<AgentAvatarVisual[\s\S]*avatarSrc=\{run\.agentAvatarSrc\}[\s\S]*label=\{run\.agentName\}[\s\S]*sizePx=\{16\}/u);
	// Per-run outcome icon replaces the aggregate's failure-only indicator.
	// Failed stays the filled error status; finished uses the large-stroke
	// ADS dot in information color, not the smaller tree Node glyph.
	assert.match(COMPLETED_RUNS_SOURCE, /import StrokeWeightLargeIcon from "@atlaskit\/icon\/core\/stroke-weight-large";/u);
	assert.match(COMPLETED_RUNS_SOURCE, /hasFailed \? \([\s\S]*<StatusErrorIcon[\s\S]*: \([\s\S]*<StrokeWeightLargeIcon/u);
	assert.doesNotMatch(COMPLETED_RUNS_SOURCE, /StatusSuccessIcon/u);
	assert.doesNotMatch(COMPLETED_RUNS_SOURCE, /CheckMarkIcon/u);
	assert.doesNotMatch(COMPLETED_RUNS_SOURCE, /NodeIcon/u);
	assert.match(COMPLETED_RUNS_SOURCE, /hasFailed \? "text-icon-danger" : "text-icon-information"/u);
	// Each row opens its own run's detail card rather than the shared AgentList.
	assert.match(COMPLETED_RUNS_SOURCE, /<HoverCard open=\{open\} onOpenChange=\{handleOpenChange\}>/u);
	assert.match(SOURCE, /<JiraIssueAgentDone[\s\S]*layout=\{agentActivityLayout\}/u);
});

test("Jira issue session transfer redesigns the drop well around the drag phase", () => {
	// At rest the well is the compact 24px solid-stroke affordance; once the
	// session is out of the chin it grows to a 48px dashed drop well.
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_REST_CLASS =\s*\n\s*"h-6 border-solid border-border[^"]*"/u);
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_DRAG_CLASS = "h-12 border-dashed border-border-bold[^"]*"/u);
	assert.match(TRANSFER_SOURCE, /dragging \? TRANSFER_ZONE_DRAG_CLASS : TRANSFER_ZONE_REST_CLASS/u);
	// Pointer over the well paints border, fill, and label blue together. With a
	// single zone this is the whole hit feedback: the armed-share widening only
	// read against a sibling competing for the row, so it is gone with Move.
	assert.match(
		TRANSFER_SOURCE,
		/const TRANSFER_ZONE_ARMED_CLASS = "border-dashed border-border-selected bg-bg-selected text-text-selected";/u,
	);
	assert.match(TRANSFER_SOURCE, /armed \? TRANSFER_ZONE_ARMED_CLASS : null/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /TRANSFER_ZONE_SHARE_|flex-\[1\.7/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /flex-grow/u);
	assert.match(TRANSFER_SOURCE, /transition-\[height,background-color,border-color,color\]/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /useMagneticProximity|TRANSFER_MAGNET_DISTANCE_PX/u);
	// The "Drag here to" separator is gone; the well's own label carries the
	// instruction, so there is no collapsing prompt row left to animate.
	assert.doesNotMatch(TRANSFER_SOURCE, /jira-issue-session-transfer-prompt|grid-rows-\[0fr\]|Drag here to"/u);
	assert.match(TRANSFER_SOURCE, /const TRANSFER_DRAG_SHIFT_CLASS = "translate-y-2";/u);
	// Size and colour changes are token-driven and reduced-motion safe.
	assert.doesNotMatch(TRANSFER_SOURCE, /duration-\[|duration-200|duration-150/u);
});

test("Jira issue dragged session reads as the at-mention chip it becomes", () => {
	// The pointer offset drives motion values; the springs are what renders, so
	// the chip trails the cursor and the gooey filter draws that lag as a tail.
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const JIRA_ISSUE_SESSION_DRAG_SPRING = \{ damping: 26, mass: 0\.6, stiffness: 420, restDelta: 0\.01 \} as const;/u,
	);
	assert.match(AGENT_ACTIVITY_SOURCE, /const springX = useSpring\(dragOffsetX, JIRA_ISSUE_SESSION_DRAG_SPRING\);/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const dragX = shouldReduceMotion \? dragOffsetX : springX;/u);
	// A raw transform string would bypass the spring entirely.
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /transform: `translate\(\$\{drag\.position/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDragging && \(isDraggedOut \? "left-0 w-fit" : "inset-x-0"\),/u);
	// The goo bridges two bodies, so the vacated slot keeps an anchor blob while
	// the row travels — without it the pull-out has no visible stretch at all.
	assert.match(AGENT_ACTIVITY_SOURCE, /const JIRA_ISSUE_SESSION_DRAG_CHIP_DISTANCE_PX = 12;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const isDraggedOut = isDragging\s*\n\s*&& Math\.hypot\(drag\.position\.x, drag\.position\.y\) >= JIRA_ISSUE_SESSION_DRAG_CHIP_DISTANCE_PX;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDragging && !isDraggedOut \? \([\s\S]*<Gooey\.Item observe>[\s\S]*aria-hidden className="pointer-events-none h-6 w-full rounded-md"/u);
});

test("Jira issue at-mention chip snaps clear of the goo instead of dragging it along", () => {
	// Three things kept grey liquid painted under a tag that is meant to be free:
	// the anchor blob still bridging to it, the dissolve still melting it into a
	// neighbour, and — the loudest one — a full-width wrapper, since the liquid
	// tracks the WRAPPER's rect, not the pill's. All three are gated on
	// `isDraggedOut` now.
	assert.match(AGENT_ACTIVITY_SOURCE, /\{isDragging && !isDraggedOut \? \(/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /active: !shouldReduceMotion && drag\.dragging && !isDraggedOut,/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDraggedOut \? "left-0 w-fit" : "inset-x-0"/u);
	// The item itself stays mounted: swapping it out mid-gesture would drop the
	// button's pointer capture and kill the drag, so the liquid is inset under
	// the opaque pill rather than unregistered.
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const JIRA_ISSUE_SESSION_DRAG_CHIP_MORPH = \{ advanced: \{ blobInset: 14, bridgeGrow: 0 \} \} as const;/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/morph=\{isDraggedOut \? JIRA_ISSUE_SESSION_DRAG_CHIP_MORPH : JIRA_ISSUE_SESSION_DRAG_MORPH\}/u,
	);
});

test("Jira issue dragged session paints its goo in the chin's grey", () => {
	// The merged silhouette has to be painted in the chin's grey, not white.
	assert.match(SOURCE, /const AGENT_SESSION_TRANSFER_GOO = \{[\s\S]*fill: "var\(--color-bg-accent-gray-subtlest\)",/u);
	assert.doesNotMatch(SOURCE, /AGENT_SESSION_TRANSFER_GOO[\s\S]{0,200}fill: "var\(--color-surface\)"/u);
	// Out of the chin the row renders the shared at-mention chip, not a bespoke pill.
	assert.match(AGENT_ACTIVITY_SOURCE, /const isDragging = Boolean\(sessionDrag\) && drag\.dragging;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /import \{ Tag \} from "@\/components\/ui\/tag";/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDraggedOut \? \(\s*\n[\s\S]*<Tag\s*\n\s*color="gray"[\s\S]*variant="editor"/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDraggedOut\s*\n\s*\? "w-fit max-w-full justify-start rounded-full bg-surface-raised px-1"/u);
});

test("Jira issue at-mention chip floats on overlay elevation, not a dead utility", () => {
	// `shadow-overlay` is not a utility in this theme — `--ds-shadow-overlay` is
	// only mapped onto `--shadow-2xl` — so the class silently rendered no shadow
	// and the chip read as flat against the card. (The source still names it in a
	// comment, so match a class position, not the bare word.)
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /[\s"']shadow-overlay[\s"']/u);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const JIRA_ISSUE_SESSION_DRAG_CHIP_STYLE: CSSProperties = \{\s*\n\s*boxShadow: token\("elevation\.shadow\.overlay"\),\s*\n\};/u,
	);
	assert.match(AGENT_ACTIVITY_SOURCE, /import \{ token \} from "@\/lib\/tokens";/u);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/style=\{isDraggedOut \? JIRA_ISSUE_SESSION_DRAG_CHIP_STYLE : undefined\}/u,
	);
});

test("Jira issue card hugs its content the moment the chip leaves the chin", () => {
	// The slot only reserves the row height while the session is still bridging
	// out; once the chip is free it collapses AND eats the row list's gutter from
	// the inside, so the grey backdrop closes instead of holding an empty band.
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/isDragging && \(isDraggedOut \? "h-0" : "h-6"\),/u,
	);
	// The row flags itself; the list closes its gutter off that flag with `:has()`.
	assert.match(AGENT_ACTIVITY_SOURCE, /data-session-chip-out=\{isDraggedOut \|\| undefined\}/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /hasActivities && "px-1 py-1 has-\[\[data-session-chip-out\]\]:py-0",/u);
});

test("Jira issue chip handover collapses in one commit, so the hit test measures the settled well", () => {
	// Publishing the flip up to the row list through a `useEffect` cost an extra
	// render (react-doctor no-pass-live-state-to-parent) and — worse — landed the
	// 32px collapse in a LATER commit than the one the transfer region's hit test
	// measures. Releasing without a further pointer move then committed against
	// the well's pre-collapse rect: unlinking outside the visible well, or
	// failing to unlink inside it. The row absorbs the gutter itself instead.
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /onSessionDraggedOutChange/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /sessionDraggedOut/u);
	// No state crosses the row/list boundary for the handover at all.
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /useEffect\([\s\S]{0,120}isDraggedOut/u);
	// The hit test still keys only off the gesture, which is only sound because
	// the target no longer moves in a commit the gesture does not drive.
	assert.match(TRANSFER_SOURCE, /\}, \[cancelled, dragging, pointer\]\);/u);
});

// --- Review findings on PR #1445 -------------------------------------------

test("Jira issue pointer cancellation aborts the drag instead of committing the armed zone", () => {
	// `pointercancel` used to call the same handler as `pointerup`, so an
	// interrupted pointer published `dragging: false` and the transfer effect
	// read that as a drop — silently unlinking or moving a session the user
	// never released onto a zone.
	assert.match(DRAG_SOURCE, /cancelled: boolean;/u);
	assert.match(DRAG_SOURCE, /export const JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /^export const /mu);
	assert.match(AGENT_ACTIVITY_SOURCE, /function cancelSessionDrag\([\s\S]*drag\.bind\.onPointerCancel\(event\);[\s\S]*publishSessionDrag\(false, undefined, true\);/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /onPointerCancel: cancelSessionDrag,/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /onPointerCancel: endSessionDrag,/u);
	// The commit gate itself must exclude a cancelled gesture.
	assert.match(TRANSFER_SOURCE, /const dropped = dragging \|\| cancelled \? false : armedRef\.current;/u);
	assert.match(TRANSFER_SOURCE, /\}, \[cancelled, dragging, pointer\]\);/u);
});

test("Jira issue session rows do not install the shared hook's incomplete keyboard drag", () => {
	// The pointer-drag hook nudges position with arrow keys, but only the pointer
	// handlers publish transfer state, so keyboard movement would displace a
	// focused row with no way to arm, drop, or reset it. Keyboard users reach the
	// drop zones directly — they are tabbable buttons running the same callbacks.
	assert.match(AGENT_ACTIVITY_SOURCE, /const \{ onKeyDown: _ignoredPointerDragKeyDown, \.\.\.dragBindWithoutKeyboard \} = drag\.bind;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /\.\.\.dragBindWithoutKeyboard,/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /\n\t\t\t\.\.\.drag\.bind,/u);
});

test("Jira issue transfer callback identifies which session was dragged", () => {
	// Split layout renders one row per agent against a single shared config, so a
	// bare `onUnlink()` left the host unable to tell which session to act on —
	// and free to update the wrong one.
	assert.match(TRANSFER_SOURCE, /export interface JiraIssueAgentSessionRef \{[\s\S]*id: string;[\s\S]*name: string;/u);
	assert.match(TRANSFER_SOURCE, /onUnlink\?: \(session\?: JiraIssueAgentSessionRef\) => void;/u);
	assert.match(TRANSFER_SOURCE, /session\?: JiraIssueAgentSessionRef;/u);
	// The card feeds the dragged row's own activity through as that identity.
	assert.match(SOURCE, /session=\{agentSessionDragState\.activities\[0\]\}/u);
	assert.match(SOURCE, /cancelled=\{agentSessionDragState\.cancelled\}/u);
});
