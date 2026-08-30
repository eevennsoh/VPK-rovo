const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

// Source contracts for the agent-session transfer surface: the Unlink/Move/Link
// demo phases, the drop wells, the gooey pull-out, and the split review chin.
// Split out of jira-issue.test.js to keep both files under the 1000-line budget.
const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const AGENT_ACTIVITY_SOURCE = readFileSync(join(__dirname, "agent-activity.tsx"), "utf8");
const COMPLETED_RUNS_SOURCE = readFileSync(join(__dirname, "completed-agent-runs.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
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
	TRANSFER_SOURCE.indexOf("export function JiraIssueAgentSessionNotice("),
);

test("Jira issue agent session transfer adds three demo phases gated to the experimental variant", () => {
	assert.ok(BASE_DEMO_STATES_START >= 0, "the base demo-state list must exist");
	assert.ok(
		TRANSFER_DEMO_STATES_START > BASE_DEMO_STATES_START,
		"the transfer demo-state list must be declared after the base list so it can be concatenated onto it",
	);
	// The three phases are real demo states, not ad-hoc strings.
	assert.match(
		PAGE_SOURCE,
		/type JiraIssueAgentActivityDemoState =[\s\S]*\| "agent-session-unlink"\s*\n\s*\| "agent-session-move"\s*\n\s*\| "agent-session-link";/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const JIRA_ISSUE_AGENT_SESSION_TRANSFER_DEMO_STATES = \[\s*\n\s*\{ value: "agent-session-unlink", label: "Unlink" \},\s*\n\s*\{ value: "agent-session-move", label: "Move" \},\s*\n\s*\{ value: "agent-session-link", label: "Link" \},\s*\n\] as const satisfies readonly \{ value: JiraIssueAgentActivityDemoState; label: string \}\[\];/u,
	);
	assert.match(
		PAGE_SOURCE,
		/function isSessionTransferDemoState\(state: JiraIssueAgentActivityDemoState\): boolean \{\s*\n\s*return state === "agent-session-unlink" \|\| state === "agent-session-move" \|\| state === "agent-session-link";/u,
	);
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
		/const agentSessionTransfer: JiraIssueAgentSessionTransferConfig \| undefined = useMemo\(\s*\n\s*\(\) => \(isTransferPhase && !isLinkPhase\s*\n\s*\? \{ moveWorkItems: JIRA_ISSUE_MOVE_WORK_ITEMS, onMove: handleSessionMove, onUnlink: handleSessionUnlink \}\s*\n\s*: undefined\),/u,
	);
});

test("Jira issue raised agent activity demo still exposes exactly the original six tabs", () => {
	const baseStateCount = (BASE_DEMO_STATES_BLOCK.match(/\{ value: "/gu) ?? []).length;
	assert.equal(baseStateCount, 6, "the raised demo must keep exactly its original six tabs");
	for (const value of ["default", "single-agent-working", "multiple-agents-working", "awaiting-user-input", "agent-completed-work", "agent-dismissed-work"]) {
		assert.match(BASE_DEMO_STATES_BLOCK, new RegExp(`\\{ value: "${value}", label: "[^"]+" \\},`, "u"));
	}
	// The three transfer phases must never leak into the shared base list, which
	// is what the raised (non-experimental) demo renders verbatim.
	for (const value of ["agent-session-unlink", "agent-session-move", "agent-session-link"]) {
		assert.doesNotMatch(BASE_DEMO_STATES_BLOCK, new RegExp(`"${value}"`, "u"));
	}
	assert.match(PAGE_SOURCE, /agentActivityLayout=\{isExperimentalAgentActivityVariant \? "split" : "merged"\}/u);
	assert.match(PAGE_SOURCE, /chrome=\{isExperimentalAgentActivityVariant \? "stroke" : "raised"\}/u);
});

test("Jira issue session transfer drop zones stay mounted and reveal with opacity, not display", () => {
	// Always rendered: the region has no early return and no conditional around
	// either zone, so both stay in the DOM and in the tab order.
	assert.doesNotMatch(TRANSFER_REGION_BLOCK, /return null/u);
	assert.doesNotMatch(TRANSFER_REGION_BLOCK, /\{revealed \? </u);
	assert.doesNotMatch(TRANSFER_REGION_BLOCK, /\{dragging \? </u);
	assert.equal(
		(TRANSFER_REGION_BLOCK.match(/<TransferDropZone/gu) ?? []).length,
		2,
		"the region renders exactly the Unlink and Move zones",
	);
	// Revealed purely through opacity + pointer-events.
	assert.match(
		TRANSFER_SOURCE,
		/const TRANSFER_REVEAL_CLASS =\s*\n\s*"opacity-0 transition-\[opacity,translate\] duration-fast ease-out-practical motion-reduce:transition-none group-hover\/jira-issue-transfer:pointer-events-auto group-hover\/jira-issue-transfer:opacity-100 group-has-\[:focus-visible\]\/jira-issue-transfer:pointer-events-auto group-has-\[:focus-visible\]\/jira-issue-transfer:opacity-100";/u,
	);
	assert.match(
		TRANSFER_REGION_BLOCK,
		/className=\{cn\(\s*"flex flex-col gap-2 pt-2",\s*TRANSFER_REVEAL_CLASS,\s*revealed \? "pointer-events-auto opacity-100" : "pointer-events-none",\s*dragging \? TRANSFER_DRAG_SHIFT_CLASS : null,\s*\)\}/u,
	);
	assert.match(TRANSFER_REGION_BLOCK, /data-slot="jira-issue-session-transfer"/u);
	// `group-focus-within` would pin the reveal open after a click; the repo
	// convention is `group-has-[:focus-visible]`.
	assert.doesNotMatch(TRANSFER_SOURCE, /group-focus-within/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /className="[^"]*\bhidden\b/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /display: *"?none/u);
	// The host card has to carry the group so hover/focus anywhere in the card
	// reveals the zones.
	assert.match(
		TRANSFER_SOURCE,
		/export const JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS = "group\/jira-issue-transfer";/u,
	);
	assert.match(
		PAGE_SOURCE,
		/className=\{cn\("w-full", agentSessionTransfer \? JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS : undefined\)\}/u,
	);
});

test("Jira issue session transfer drop zones are labelled buttons reachable by keyboard", () => {
	assert.match(
		TRANSFER_SOURCE,
		/<button\s*\n\s*aria-label=\{description\}[\s\S]*type="button"/u,
	);
	assert.match(TRANSFER_SOURCE, /description: string;/u);
	// Each zone carries a distinct, action-describing accessible name.
	assert.match(TRANSFER_REGION_BLOCK, /description=\{`Unlink \$\{sessionLabel\} from this work item`\}/u);
	assert.match(TRANSFER_REGION_BLOCK, /description=\{`Move \$\{sessionLabel\} to another work item`\}/u);
	assert.match(TRANSFER_SOURCE, /sessionLabel = "agent session",/u);
	// Keyboard activation runs the same callbacks as a drop.
	// A click and a drop must run the same commit, and both must say WHICH session
	// they acted on — split layout renders one row per agent against one config.
	assert.match(TRANSFER_REGION_BLOCK, /onClick=\{\(\) => config\.onUnlink\?\.\(session\)\}/u);
	assert.match(TRANSFER_REGION_BLOCK, /<PopoverTrigger\s*\n\s*render=\{\s*\n\s*<TransferDropZone/u);
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_BASE_CLASS =\s*\n\s*"[^"]*outline-none[^"]*focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring\/50[^"]*"/u);
	// A drop commits exactly what the zone's own click handler commits. The
	// handlers are read through a committed ref so the arming effect does not
	// resubscribe on every parent render, so assert the ref stays in sync too.
	assert.match(
		TRANSFER_SOURCE,
		/commitRef\.current = \{ onUnlink: config\.onUnlink, session, setMenu \};/u,
	);
	assert.match(
		TRANSFER_SOURCE,
		/if \(dropped === "unlink"\) commitRef\.current\?\.onUnlink\?\.\(commitRef\.current\?\.session\);\s*\n\s*if \(dropped === "move"\) commitRef\.current\?\.setMenu\(true\);/u,
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
		/dissolve=\{\{\s*active: !shouldReduceMotion && drag\.dragging,/u,
	);
	// A pointer drag must not fight Motion's layout projection.
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const rowLayout = shouldReduceMotion \|\| sessionDragging \? false : "position";/u,
	);
});

test("Jira issue move notice timeout is cleared on unmount and on every tab change", () => {
	assert.match(PAGE_SOURCE, /const moveNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> \| null>\(null\);/u);
	assert.match(
		PAGE_SOURCE,
		/const clearMoveNoticeTimeout = useCallback\(\(\) => \{\s*\n\s*if \(moveNoticeTimeoutRef\.current !== null\) \{\s*\n\s*clearTimeout\(moveNoticeTimeoutRef\.current\);\s*\n\s*moveNoticeTimeoutRef\.current = null;/u,
	);
	// Unmount: the cleanup function IS the clear helper.
	assert.match(PAGE_SOURCE, /useEffect\(\(\) => clearMoveNoticeTimeout, \[clearMoveNoticeTimeout\]\);/u);
	// Tab change: every tab click goes through `selectDemoState`, which clears
	// the pending timer before switching phase so a hidden demo cannot advance.
	assert.match(
		PAGE_SOURCE,
		/const selectDemoState = useCallback\(\(value: JiraIssueAgentActivityDemoState\) => \{\s*\n\s*clearMoveNoticeTimeout\(\);\s*\n\s*setMovedWorkItemKey\(null\);\s*\n\s*setAgentActivityState\(value\);\s*\n\s*\}, \[clearMoveNoticeTimeout\]\);/u,
	);
	assert.match(PAGE_SOURCE, /onClick=\{\(\) => selectDemoState\(state\.value\)\}/u);
	// Re-arming also clears first, so overlapping moves cannot stack timers, and
	// the ref is nulled from inside the callback once it has fired.
	assert.match(
		PAGE_SOURCE,
		/const handleSessionMove = useCallback\(\(workItemKey: string\) => \{\s*\n\s*clearMoveNoticeTimeout\(\);\s*\n\s*setMovedWorkItemKey\(workItemKey\);\s*\n\s*moveNoticeTimeoutRef\.current = setTimeout\(\(\) => \{\s*\n\s*moveNoticeTimeoutRef\.current = null;/u,
	);
	assert.match(PAGE_SOURCE, /const JIRA_ISSUE_MOVE_NOTICE_MS = 2400;/u);
	assert.match(PAGE_SOURCE, /\}, JIRA_ISSUE_MOVE_NOTICE_MS\);/u);
});

test("Jira issue agentSessionTransfer is opt-in so existing consumers are unaffected", () => {
	// Optional prop with no default: absent means the whole feature is inert.
	assert.match(SOURCE, /agentSessionTransfer\?: JiraIssueAgentSessionTransferConfig;/u);
	assert.match(SOURCE, /^\tagentSessionTransfer,$/mu);
	assert.doesNotMatch(SOURCE, /agentSessionTransfer = /u);
	// No config -> no drag binding handed to the chin rows.
	assert.match(
		SOURCE,
		/const agentSessionDragBinding: JiraIssueAgentSessionDragBinding \| undefined = agentSessionTransfer\s*\n\s*\? \{ onDragStateChange: setAgentSessionDragState \}\s*\n\s*: undefined;/u,
	);
	// No config -> no `<Gooey>` root and no transfer region in the tree.
	assert.match(
		SOURCE,
		/const agentActivityShellWithTransfer = agentSessionTransfer \? \([\s\S]*<Gooey \{\.\.\.AGENT_SESSION_TRANSFER_GOO\}[\s\S]*<JiraIssueAgentSessionTransfer[\s\S]*\) : agentActivityShell;/u,
	);
	// No config -> the sparkle reveal expression is unchanged in practice.
	assert.match(
		SOURCE,
		/const agentSessionTransferRevealed = Boolean\(agentSessionTransfer\)\s*\n\s*&& \(agentSessionDragState\.dragging \|\| agentSessionTransferMenuOpen\);/u,
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
	// Both outcomes use the ADS filled status pair, so the row reads as a status
	// rather than a bare glyph: StatusErrorIcon / StatusSuccessIcon.
	assert.match(COMPLETED_RUNS_SOURCE, /hasFailed \? \([\s\S]*<StatusErrorIcon[\s\S]*: \([\s\S]*<StatusSuccessIcon/u);
	assert.doesNotMatch(COMPLETED_RUNS_SOURCE, /CheckMarkIcon/u);
	assert.match(COMPLETED_RUNS_SOURCE, /hasFailed \? "text-icon-danger" : "text-icon-success"/u);
	// Each row opens its own run's detail card rather than the shared AgentList.
	assert.match(COMPLETED_RUNS_SOURCE, /<HoverCard open=\{open\} onOpenChange=\{handleOpenChange\}>/u);
	assert.match(SOURCE, /<JiraIssueAgentDone[\s\S]*layout=\{agentActivityLayout\}/u);
});

test("Jira issue session transfer redesigns the drop wells around the drag phase", () => {
	// At rest the wells are the compact 24px solid-stroke affordance; once the
	// session is out of the chin they grow to 48px dashed drop wells.
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_REST_CLASS =\s*\n\s*"h-6 border-solid border-border[^"]*"/u);
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_DRAG_CLASS = "h-12 border-dashed border-border-bold[^"]*"/u);
	assert.match(TRANSFER_SOURCE, /dragging \? TRANSFER_ZONE_DRAG_CLASS : TRANSFER_ZONE_REST_CLASS/u);
	// Pointer over a well paints border, fill, and label blue together.
	assert.match(
		TRANSFER_SOURCE,
		/const TRANSFER_ZONE_ARMED_CLASS = "border-dashed border-border-selected bg-bg-selected text-text-selected";/u,
	);
	assert.match(TRANSFER_SOURCE, /armed \? TRANSFER_ZONE_ARMED_CLASS : null/u);
	// Hit feedback is the armed well widening, not the wells leaning at the
	// cursor: the magnet was removed because a moving drop rect fights the aim.
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_SHARE_REST_CLASS = "flex-1";/u);
	assert.match(TRANSFER_SOURCE, /const TRANSFER_ZONE_SHARE_ARMED_CLASS = "flex-\[1\.7_1_0%\]";/u);
	assert.match(
		TRANSFER_SOURCE,
		/armed \? TRANSFER_ZONE_SHARE_ARMED_CLASS : TRANSFER_ZONE_SHARE_REST_CLASS/u,
	);
	assert.match(TRANSFER_SOURCE, /transition-\[flex-grow,height,background-color,border-color,color\]/u);
	assert.doesNotMatch(TRANSFER_SOURCE, /useMagneticProximity|TRANSFER_MAGNET_DISTANCE_PX/u);
	// The prompt collapses to zero height rather than unmounting, so the wells
	// take its space instead of the region growing.
	assert.match(TRANSFER_SOURCE, /dragging \? "grid-rows-\[0fr\] opacity-0" : "grid-rows-\[1fr\] opacity-100"/u);
	assert.match(TRANSFER_SOURCE, /data-slot="jira-issue-session-transfer-prompt"/u);
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
	assert.match(AGENT_ACTIVITY_SOURCE, /className=\{cn\("min-w-0", isDragging && "absolute inset-x-0 top-0 z-20"\)\}\s*\n\s*style=\{\{ x: dragX, y: dragY \}\}/u);
	// The goo bridges two bodies, so the vacated slot keeps an anchor blob and the
	// opaque chip is held back until the row has travelled clear of it — without
	// both, the pull-out snaps to a hard-edged tag with no visible stretch.
	assert.match(AGENT_ACTIVITY_SOURCE, /const JIRA_ISSUE_SESSION_DRAG_CHIP_DISTANCE_PX = 28;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const isDraggedOut = isDragging\s*\n\s*&& Math\.hypot\(drag\.position\.x, drag\.position\.y\) >= JIRA_ISSUE_SESSION_DRAG_CHIP_DISTANCE_PX;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDragging \? \([\s\S]*<Gooey\.Item observe>[\s\S]*aria-hidden className="pointer-events-none h-6 w-full rounded-md"/u);
	// The merged silhouette has to be painted in the chin's grey, not white.
	assert.match(SOURCE, /const AGENT_SESSION_TRANSFER_GOO = \{[\s\S]*fill: "var\(--color-bg-accent-gray-subtlest\)",/u);
	assert.doesNotMatch(SOURCE, /AGENT_SESSION_TRANSFER_GOO[\s\S]{0,200}fill: "var\(--color-surface\)"/u);
	// Out of the chin the row renders the shared at-mention chip, not a bespoke pill.
	assert.match(AGENT_ACTIVITY_SOURCE, /const isDragging = Boolean\(sessionDrag\) && drag\.dragging;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /import \{ Tag \} from "@\/components\/ui\/tag";/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDraggedOut \? \(\s*\n[\s\S]*<Tag\s*\n\s*color="gray"[\s\S]*variant="editor"/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /isDraggedOut\s*\n\s*\? "w-fit max-w-full justify-start rounded-full bg-surface-raised px-1 shadow-overlay"/u);
});

// --- Review findings on PR #1445 -------------------------------------------

test("Jira issue pointer cancellation aborts the drag instead of committing the armed zone", () => {
	// `pointercancel` used to call the same handler as `pointerup`, so an
	// interrupted pointer published `dragging: false` and the transfer effect
	// read that as a drop — silently unlinking or moving a session the user
	// never released onto a zone.
	assert.match(AGENT_ACTIVITY_SOURCE, /cancelled: boolean;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /function cancelSessionDrag\([\s\S]*drag\.bind\.onPointerCancel\(event\);[\s\S]*publishSessionDrag\(false, undefined, true\);/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /onPointerCancel: cancelSessionDrag,/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /onPointerCancel: endSessionDrag,/u);
	// The commit gate itself must exclude a cancelled gesture.
	assert.match(TRANSFER_SOURCE, /const dropped = dragging \|\| cancelled \? null : armedRef\.current;/u);
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

test("Jira issue transfer callbacks identify which session was dragged", () => {
	// Split layout renders one row per agent against a single shared config, so a
	// bare `onUnlink()` / `onMove(key)` left the host unable to tell which session
	// to act on — and free to update the wrong one.
	assert.match(TRANSFER_SOURCE, /export interface JiraIssueAgentSessionRef \{[\s\S]*id: string;[\s\S]*name: string;/u);
	assert.match(TRANSFER_SOURCE, /onMove\?: \(workItemKey: string, session\?: JiraIssueAgentSessionRef\) => void;/u);
	assert.match(TRANSFER_SOURCE, /onUnlink\?: \(session\?: JiraIssueAgentSessionRef\) => void;/u);
	assert.match(TRANSFER_SOURCE, /session\?: JiraIssueAgentSessionRef;/u);
	assert.match(TRANSFER_SOURCE, /config\.onMove\?\.\(key, session\);/u);
	// The card feeds the dragged row's own activity through as that identity.
	assert.match(SOURCE, /session=\{agentSessionDragState\.activities\[0\]\}/u);
	assert.match(SOURCE, /cancelled=\{agentSessionDragState\.cancelled\}/u);
});
