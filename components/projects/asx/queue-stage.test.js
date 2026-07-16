const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ASX_PAGE_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const CARD_KANBAN_STAGE_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/card-kanban-stage.tsx"),
	"utf8",
);
const KANBAN_STAGE_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/kanban-stage.tsx"),
	"utf8",
);
const ROVO_OVERLAY_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/asx-rovo-overlay.tsx"),
	"utf8",
);
const QUEUE_STAGE_SOURCE = fs.readFileSync(path.join(__dirname, "components/queue-stage.tsx"), "utf8");
const QUEUE_SESSIONS_SOURCE = fs.readFileSync(path.join(__dirname, "data/queue-sessions.ts"), "utf8");
const QUEUE_WORKSPACE_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/queue-conversation-workspace.tsx"),
	"utf8",
);
const QUEUE_HEADER_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/queue-conversation-header.tsx"),
	"utf8",
);
const QUEUE_ENVIRONMENT_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/queue-environment-panel.tsx"),
	"utf8",
);
const PROJECT_LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "../page.tsx"), "utf8");
const PRODUCT_SIDEBAR_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../blocks/product-sidebar/page.tsx"),
	"utf8",
);

test("ASX maps only Kanban and Queue to implemented gallery stages", () => {
	assert.match(ASX_PAGE_SOURCE, /title="Agent Sessions Experience"/u);
	assert.match(ASX_PAGE_SOURCE, /if \(item\.id === "kanban"\) return <KanbanStage \/>;/u);
	assert.match(ASX_PAGE_SOURCE, /if \(item\.id === "queue"\) return <QueueStage \/>;/u);
	assert.match(ASX_PAGE_SOURCE, /flex h-full w-full items-center justify-center/u);
	assert.match(ASX_PAGE_SOURCE, /\{item\.title\}/u);
});

test("ASX stages fill the Gallery viewport without margin compensation", () => {
	for (const source of [ASX_PAGE_SOURCE, CARD_KANBAN_STAGE_SOURCE, KANBAN_STAGE_SOURCE, QUEUE_STAGE_SOURCE]) {
		assert.doesNotMatch(source, /-mt-20|-mb-80|100dvh/u);
	}
	assert.match(ASX_PAGE_SOURCE, /flex h-full min-h-0 w-screen/u);
	assert.match(CARD_KANBAN_STAGE_SOURCE, /flex h-full min-h-0 w-screen/u);
	assert.match(KANBAN_STAGE_SOURCE, /flex h-full min-h-0 w-screen/u);
	assert.match(QUEUE_STAGE_SOURCE, /h-full min-h-0 w-screen/u);
	assert.doesNotMatch(QUEUE_STAGE_SOURCE, /pb-56/u);
});

test("Card Kanban controls use the compact Gallery top-bar slot", () => {
	assert.match(ASX_PAGE_SOURCE, /topBarCenter=/u);
	assert.match(ASX_PAGE_SOURCE, /<CardKanbanControls controller=\{cardKanbanController\} \/>/u);
	assert.match(CARD_KANBAN_STAGE_SOURCE, /<ButtonGroup[\s\S]*variant="connected"/u);
	assert.match(CARD_KANBAN_STAGE_SOURCE, /border-l!/u);
	assert.match(CARD_KANBAN_STAGE_SOURCE, /aria-pressed:z-10/u);
	assert.match(CARD_KANBAN_STAGE_SOURCE, /variant="outline"/u);
	assert.match(CARD_KANBAN_STAGE_SOURCE, /size="compact"/u);
	assert.match(CARD_KANBAN_STAGE_SOURCE, /showProgress = true/u);
	assert.doesNotMatch(CARD_KANBAN_STAGE_SOURCE, /<button/u);
});

test("ASX Rovo surfaces render at viewport level above the Gallery dock", () => {
	assert.match(CARD_KANBAN_STAGE_SOURCE, /<AsxRovoOverlay[\s\S]*chatContextBar=\{chatContextBar\}/u);
	assert.match(KANBAN_STAGE_SOURCE, /<AsxRovoOverlay[\s\S]*chatContextBar=\{chatContextBar\}/u);
	assert.match(ROVO_OVERLAY_SOURCE, /createPortal/u);
	assert.match(ROVO_OVERLAY_SOURCE, /document\.body/u);
	assert.match(ROVO_OVERLAY_SOURCE, /<FloatingRovoButton/u);
	assert.match(ROVO_OVERLAY_SOURCE, /<RovoFloatingChat/u);
	assert.match(ROVO_OVERLAY_SOURCE, /chatContextBar=\{chatContextBar\}/u);
	assert.match(ROVO_OVERLAY_SOURCE, /hideComposerSourceAndModelControls/u);
	assert.match(ROVO_OVERLAY_SOURCE, /showAgentBackButton=\{false\}/u);
	assert.match(ROVO_OVERLAY_SOURCE, /showAgentSelector=\{false\}/u);
	assert.match(ROVO_OVERLAY_SOURCE, /showChatHistory=\{false\}/u);
	assert.match(ROVO_OVERLAY_SOURCE, /showNewChatButton=\{false\}/u);
	assert.match(ROVO_OVERLAY_SOURCE, /suppressCustomAgentTabs/u);
	assert.doesNotMatch(ROVO_OVERLAY_SOURCE, /positioning="container"/u);
});

test("ASX Rovo gallery entry and reset restore the default agent plus greeting", () => {
	assert.match(ASX_PAGE_SOURCE, /const \{ resetChat, resetAgentToRovo \} = useRovoChat\(\);/u);
	assert.match(
		ASX_PAGE_SOURCE,
		/const resetRovoSurface = useCallback\(\(\) => \{[\s\S]*resetAgentToRovo\(\);[\s\S]*resetChat\(\);[\s\S]*\}, \[resetAgentToRovo, resetChat\]\);/u,
	);
	assert.match(
		ASX_PAGE_SOURCE,
		/nextSelectedId === "rovo" && selectedId !== "rovo"[\s\S]*resetRovoSurface\(\);/u,
	);
	assert.match(ASX_PAGE_SOURCE, /if \(item\.id === "rovo"\) \{[\s\S]*resetRovoSurface\(\);[\s\S]*\}/u);
	assert.match(ASX_PAGE_SOURCE, /if \(item\.id === "rovo"\) return <RovoStage \/>;/u);
});

test("Queue stage hosts Jira chrome around ASX-local session navigation", () => {
	assert.match(QUEUE_STAGE_SOURCE, /<AppLayout[\s\S]*product="jira"[\s\S]*hideRovoAction/u);
	assert.match(QUEUE_STAGE_SOURCE, /shellHeight="parent"/u);
	assert.match(QUEUE_STAGE_SOURCE, /topNavigationSearchAlignment="sidebar"/u);
	assert.match(QUEUE_STAGE_SOURCE, /<JiraSidebar[\s\S]*sessionNavigation=/u);
	assert.match(QUEUE_STAGE_SOURCE, /createInitialQueueSessions\(ASX_QUEUE_SESSION_SEEDS\)/u);
	assert.match(QUEUE_STAGE_SOURCE, /appendQueueSessionUserMessage/u);
	assert.match(QUEUE_STAGE_SOURCE, /question\?\.options\.find\(\(option\) => option\.id === selectedValue\)\?\.label \?\? selectedValue/u);
	assert.match(QUEUE_STAGE_SOURCE, /issueKey: session\.issueKey,/u);
	assert.match(QUEUE_STAGE_SOURCE, /issueSummary: session\.issueSummary,/u);
	assert.match(QUEUE_STAGE_SOURCE, /function toJiraSidebarSessionItem\(session: AsxQueueSession\)/u);
	assert.match(QUEUE_STAGE_SOURCE, /orderedSessions\.map\(toJiraSidebarSessionItem\)/u);
	assert.match(QUEUE_STAGE_SOURCE, /orderedSessions: orderedSidebarSessions,/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /issueKey: "RFP-101",/u);
	assert.doesNotMatch(QUEUE_STAGE_SOURCE, /relativeTime/u);
	assert.doesNotMatch(QUEUE_SESSIONS_SOURCE, /relativeTime/u);
	assert.match(QUEUE_STAGE_SOURCE, /<QueueConversationWorkspace[\s\S]*key=\{activeSession\.id\}/u);
	assert.doesNotMatch(QUEUE_STAGE_SOURCE, /fetch\(|\/api\/rovo|RovoPage/u);
});

test("project shell sidebar overrides retain the product-derived default", () => {
	assert.match(PROJECT_LAYOUT_SOURCE, /sidebarContent\?: React\.ReactNode;/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /shellHeight\?: "viewport" \| "parent";/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /shellHeight=\{shellHeight\}/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /display: "flex", flex: 1, minHeight: 0/u);
	assert.doesNotMatch(PROJECT_LAYOUT_SOURCE, /display: "flex", height: "100%", position: "relative"/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /topNavigationSearchAlignment = "responsive"/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /<Sidebar[\s\S]*product=\{product\}[\s\S]*content=\{sidebarContent\}/u);
	assert.match(PRODUCT_SIDEBAR_SOURCE, /content\?: React\.ReactNode;/u);
	assert.match(PRODUCT_SIDEBAR_SOURCE, /if \(content\) \{[\s\S]*return content;[\s\S]*switch \(product\)/u);
});

test("Queue workspace reuses fullscreen message and Rovo composer primitives", () => {
	assert.match(QUEUE_WORKSPACE_SOURCE, /import \{ ChatMessages \}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /import \{ RovoAppComposer \}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /AnimatePresence, motion, useReducedMotion, type Transition/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /useRealtimeVoice/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /data-testid="asx-queue-conversation"/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /showFeedbackActions=\{false\}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /onToggleRealtimeVoice=\{handleToggleRealtimeVoice\}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /realtimeVoiceState=\{realtime\.voiceState\}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /hideSourceAndModelControls/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /data-testid="asx-queue-chat-body"/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /const panelWidth = panel\?\.getBoundingClientRect\(\)\.width/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /new DOMMatrixReadOnly\(chatBodyTransform\)\.m41/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /const availableCenter = \(workspaceRect\.left \+ panelLeft\) \/ 2;/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /Math\.min\(0, Math\.max\(leftEdgeShift, centeredShift\)\)/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /animate=\{\{ transform: `translateX\(\$\{chatBodyShift\}px\)` \}\}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /new ResizeObserver\(updateChatBodyShift\)/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /CHAT_BODY_REDUCED_MOTION_TRANSITION/u);
	assert.doesNotMatch(QUEUE_WORKSPACE_SOURCE, /showSubmitWhenEmpty/u);
});

test("Queue header follows the Rovo custom-agent identity and toggles the environment panel", () => {
	assert.match(QUEUE_HEADER_SOURCE, /flex shrink-0 items-center gap-3 px-3 py-3/u);
	assert.match(QUEUE_HEADER_SOURCE, /<AgentAvatarVisual/u);
	assert.match(QUEUE_HEADER_SOURCE, /\{agent\.name\}/u);
	assert.match(QUEUE_HEADER_SOURCE, /<PanelRightIcon/u);
	assert.match(QUEUE_HEADER_SOURCE, /isEnvironmentPanelOpen \? null : \(/u);
	assert.match(QUEUE_HEADER_SOURCE, /aria-label="Open environment panel"/u);
	assert.doesNotMatch(QUEUE_HEADER_SOURCE, /spaceName|statusPresentation|session\.title|<Lozenge/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /isEnvironmentPanelOpen \? \([\s\S]*<QueueEnvironmentPanel/u);
});

test("Queue environment panel uses VPK panel and item primitives", () => {
	assert.match(
		QUEUE_WORKSPACE_SOURCE,
		/<AnimatePresence initial=\{false\}>[\s\S]*<QueueEnvironmentPanel[\s\S]*agent=\{agent\}[\s\S]*session=\{session\}/u,
	);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /<PanelContainer/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /<PanelHeader/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session: AsxQueueSession/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /agent: RovoAgentProfile/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /<motion\.div/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /absolute inset-y-0 right-0 z-20 h-full w-80 max-w-full/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /h-full border-l border-border bg-surface/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /useReducedMotion\(\)/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /transform: "translateX\(100%\)"/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /duration: 0\.25, ease: \[0, 0\.4, 0, 1\]/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /duration: 0\.2, ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /<PanelActionClose label="Close environment panel" onClick=\{onClose\} \/>/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /<ItemGroup/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, />Environment</u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /"awaiting-input": "Awaiting user response"/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /"pr-open": "Pull request open"/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /merged: "Pull request merged"/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /label="Host"/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /label="Agent" value=\{agent\.name\}/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /label="Jira" value=\{issueDescription\}/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session\.repository \? <QueueEnvironmentDetailRow/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session\.branch \? <QueueEnvironmentDetailRow/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session\.worktreePath \? <QueueEnvironmentDetailRow/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session\.pullRequestNumber \? <QueueEnvironmentDetailRow/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session\.commit \? <QueueEnvironmentDetailRow/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session\.checks \? <QueueEnvironmentDetailRow/u);
	assert.match(QUEUE_ENVIRONMENT_PANEL_SOURCE, /session\.fileChanges \? \(/u);
	assert.doesNotMatch(QUEUE_ENVIRONMENT_PANEL_SOURCE, /\+76|Create branch|Commit or push|Create pull request|codex-clipboard-b1551afa/u);
	assert.doesNotMatch(QUEUE_ENVIRONMENT_PANEL_SOURCE, /shrink-0|max-lg:absolute/u);
	assert.doesNotMatch(QUEUE_ENVIRONMENT_PANEL_SOURCE, /m-3|rounded-lg|border border-border/u);
	assert.doesNotMatch(QUEUE_ENVIRONMENT_PANEL_SOURCE, /bg-black|text-white|#[0-9a-f]{3,8}/iu);
});
