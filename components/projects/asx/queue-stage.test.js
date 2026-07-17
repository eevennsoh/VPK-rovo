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
const ROVO_STAGE_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/rovo-stage.tsx"),
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
const QUEUE_DETAIL_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/queue-detail-panel.tsx"),
	"utf8",
);
const QUEUE_DETAIL_ARTIFACTS_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/queue-detail-artifacts.tsx"),
	"utf8",
);
const ATTACHMENT_PREVIEW_CARD_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../ui-custom/attachment-preview-card.tsx"),
	"utf8",
);
const JIRA_ATTACHMENTS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../jira/components/work-item-modal/attachments-section.tsx"),
	"utf8",
);
const GALLERY_SELECTED_STAGE_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../blocks/gallery/components/gallery-selected-stage.tsx"),
	"utf8",
);
const JIRA_SIDEBAR_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../blocks/product-sidebar/variants/jira.tsx"),
	"utf8",
);
const CHAT_HISTORY_DRAWER_SOURCE = fs.readFileSync(
	path.join(__dirname, "../sidebar-chat/components/chat-history-drawer.tsx"),
	"utf8",
);
const CHAT_COMPOSER_SOURCE = fs.readFileSync(
	path.join(__dirname, "../sidebar-chat/components/chat-composer.tsx"),
	"utf8",
);
const CHAT_PANEL_SOURCE = fs.readFileSync(path.join(__dirname, "../sidebar-chat/page.tsx"), "utf8");
const CHAT_HEADER_SOURCE = fs.readFileSync(
	path.join(__dirname, "../sidebar-chat/components/chat-header.tsx"),
	"utf8",
);
const ROVO_AGENT_BACK_BUTTON_SOURCE = fs.readFileSync(
	path.join(__dirname, "../rovo-core/components/rovo-agent-back-button.tsx"),
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
		/if \(nextSelectedId === "rovo" && selectedId !== "rovo"\) \{\s*resetRovoSurface\(\);\s*\}/u,
	);
	assert.match(ASX_PAGE_SOURCE, /if \(item\.id === "rovo"\) \{\s*resetRovoSurface\(\);\s*\}/u);
	assert.match(ASX_PAGE_SOURCE, /if \(item\.id === "rovo"\) return <RovoStage \/>;/u);
});

test("ASX Rovo stage matches the sidebar chat project dimensions", () => {
	assert.match(ROVO_STAGE_SOURCE, /h-full max-h-\[800px\] min-h-0 w-\[400px\]/u);
	assert.doesNotMatch(ROVO_STAGE_SOURCE, /max-h-\[680px\]|max-w-\[440px\]/u);
});

test("ASX Rovo history reuses the three Queue sessions and swaps agent plus transcript", () => {
	assert.match(ROVO_STAGE_SOURCE, /useState<AsxQueueSession\[\]>\(\(\) => \([\s\S]*ASX_QUEUE_SESSION_SEEDS\.map/u);
	assert.match(ROVO_STAGE_SOURCE, /createAsxQueueHistoryThreads\(orderedHistorySessions\)/u);
	assert.match(ROVO_STAGE_SOURCE, /createAsxQueueSidebarSessionItem\(session\)/u);
	assert.match(ROVO_STAGE_SOURCE, /description: <JiraSessionDescription session=\{session\} \/>/u);
	assert.match(ROVO_STAGE_SOURCE, /meta: <JiraSessionLifecycle status=\{session\.status\} \/>/u);
	assert.match(ROVO_STAGE_SOURCE, /session\.status === "awaiting-input"/u);
	assert.match(ROVO_STAGE_SOURCE, /Awaiting user response/u);
	assert.match(ROVO_STAGE_SOURCE, /<AnimatedDots \/>/u);
	assert.match(ROVO_STAGE_SOURCE, /: <JiraSessionLabel session=\{session\} \/>/u);
	assert.match(ROVO_STAGE_SOURCE, /getThreadPresentation,/u);
	assert.match(ROVO_STAGE_SOURCE, /<JiraSessionRowActions/u);
	assert.match(ROVO_STAGE_SOURCE, /setQueueSessionPinned\(sessions, threadId, !session\.isPinned\)/u);
	assert.match(ROVO_STAGE_SOURCE, /stopQueueSession\(sessions, threadId\)/u);
	assert.match(ROVO_STAGE_SOURCE, /archiveQueueSession\(/u);
	assert.match(ROVO_STAGE_SOURCE, /getThreadActions,/u);
	assert.match(ROVO_STAGE_SOURCE, /pinnedThreadIds,/u);
	assert.match(ROVO_STAGE_SOURCE, /chatHistory=\{chatHistory\}/u);
	assert.match(
		ROVO_STAGE_SOURCE,
		/resetChat\(\);[\s\S]*selectAgent\(session\.agentId, \{ preserveCurrentThread: true \}\);[\s\S]*replaceMessages\(thread\.messages\);[\s\S]*setActiveHistorySessionId\(threadId\);/u,
	);
	assert.match(ROVO_STAGE_SOURCE, /resetAgentToRovo\(\{ preserveCurrentThread: true \}\);[\s\S]*resetChat\(\);/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /createAsxQueueHistoryThreads/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /createAsxQueueSidebarSessionItem/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /type: "question-card"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /export function JiraSessionLabel/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /export function JiraSessionDescription/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /export function JiraSessionLifecycle/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /export function JiraSessionRowActions/u);
	assert.match(CHAT_HISTORY_DRAWER_SOURCE, /presentation\?\.description/u);
	assert.match(CHAT_HISTORY_DRAWER_SOURCE, /presentation\?\.meta/u);
	assert.match(CHAT_HISTORY_DRAWER_SOURCE, />\s*Pinned\s*<\/div>/u);
	assert.match(GALLERY_SELECTED_STAGE_SOURCE, /key=\{`\$\{item\.id\}:\$\{resetKey\}`\}/u);
});

test("ASX Rovo history uses Queue sorting and exposes its controller", () => {
	assert.match(ROVO_STAGE_SOURCE, /useState<ChatHistorySortMode>\("manual"\)/u);
	assert.match(ROVO_STAGE_SOURCE, /sortQueueSessions\(historySessions, sortMode\)/u);
	assert.match(ROVO_STAGE_SOURCE, /createAsxQueueHistoryThreads\(orderedHistorySessions\)/u);
	assert.match(ROVO_STAGE_SOURCE, /onSortModeChange: setSortMode,/u);
	assert.match(ROVO_STAGE_SOURCE, /sortMode,/u);
});

test("ASX Rovo reuses the Queue session context bar above its composer", () => {
	assert.match(QUEUE_WORKSPACE_SOURCE, /export function QueueSessionContextBar/u);
	assert.match(ROVO_STAGE_SOURCE, /import \{ QueueSessionContextBar \} from "\.\/queue-conversation-workspace";/u);
	assert.match(ROVO_STAGE_SOURCE, /dismissQueueSessionFileChanges\(sessions, activeHistorySessionId\)/u);
	assert.match(ROVO_STAGE_SOURCE, /setQueueSessionJiraColumn\(sessions, activeHistorySessionId, jiraColumn\)/u);
	assert.match(
		ROVO_STAGE_SOURCE,
		/composerContextBar=\{activeHistorySession \? \([\s\S]*<QueueSessionContextBar[\s\S]*compact[\s\S]*session=\{activeHistorySession\}/u,
	);
	assert.match(CHAT_PANEL_SOURCE, /composerContextBar=\{composerContextBar\}/u);
	assert.match(CHAT_COMPOSER_SOURCE, /\{composerContextBar\}\s*<ChatContextBar/u);
});

test("ASX Rovo clears the active Queue session when returning to Rovo", () => {
	assert.match(
		ROVO_STAGE_SOURCE,
		/const handleBackToRovo = useCallback\(\(\) => \{\s*setActiveHistorySessionId\(null\);\s*\}, \[\]\);/u,
	);
	assert.match(ROVO_STAGE_SOURCE, /onBackToRovo=\{handleBackToRovo\}/u);
	assert.match(CHAT_PANEL_SOURCE, /<ChatHeader[\s\S]*onBackToRovo=\{onBackToRovo\}/u);
	assert.match(CHAT_HEADER_SOURCE, /<RovoAgentBackButton onBack=\{onBackToRovo\} \/>/u);
	assert.match(
		ROVO_AGENT_BACK_BUTTON_SOURCE,
		/const handleBack = \(\) => \{\s*resetAgentToRovo\(\);\s*onBack\?\.\(\);\s*\};/u,
	);
	assert.match(ROVO_AGENT_BACK_BUTTON_SOURCE, /onClick=\{handleBack\}/u);
});

test("Queue stage hosts Jira chrome around ASX-local session navigation", () => {
	assert.match(QUEUE_STAGE_SOURCE, /<AppLayout[\s\S]*product="jira"[\s\S]*hideRovoAction/u);
	assert.match(QUEUE_STAGE_SOURCE, /shellHeight="parent"/u);
	assert.match(QUEUE_STAGE_SOURCE, /topNavigationSearchAlignment="sidebar"/u);
	assert.match(QUEUE_STAGE_SOURCE, /<JiraSidebar[\s\S]*sessionNavigation=/u);
	assert.match(QUEUE_STAGE_SOURCE, /createInitialQueueSessions\(ASX_QUEUE_SESSION_SEEDS\)/u);
	assert.match(QUEUE_STAGE_SOURCE, /appendQueueSessionUserMessage/u);
	assert.match(QUEUE_STAGE_SOURCE, /question\?\.options\.find\(\(option\) => option\.id === selectedValue\)\?\.label \?\? selectedValue/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /issueKey: session\.issueKey,/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /issueSummary: session\.issueSummary,/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /function createAsxQueueSidebarSessionItem/u);
	assert.match(QUEUE_STAGE_SOURCE, /orderedSessions\.map\(createAsxQueueSidebarSessionItem\)/u);
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
	assert.match(QUEUE_WORKSPACE_SOURCE, /animate=\{\{ paddingRight: isDetailPanelOpen \? DETAIL_PANEL_WIDTH_PX : 0 \}\}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /contentClassName="mx-auto max-w-\[800px\] px-6"/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /className="mx-auto w-full max-w-\[800px\] px-3"/u);
	assert.doesNotMatch(QUEUE_WORKSPACE_SOURCE, /DOMMatrixReadOnly|ResizeObserver|chatBodyShift/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /CHAT_BODY_REDUCED_MOTION_TRANSITION/u);
	assert.doesNotMatch(QUEUE_WORKSPACE_SOURCE, /showSubmitWhenEmpty/u);
});

test("Queue header follows the Rovo custom-agent identity and toggles the detail panel", () => {
	assert.match(QUEUE_HEADER_SOURCE, /flex shrink-0 items-center gap-3 px-3 py-3/u);
	assert.match(QUEUE_HEADER_SOURCE, /<AgentAvatarVisual/u);
	assert.match(QUEUE_HEADER_SOURCE, /\{agent\.name\}/u);
	assert.match(QUEUE_HEADER_SOURCE, /<PanelRightIcon/u);
	assert.match(QUEUE_HEADER_SOURCE, /isDetailPanelOpen \? null : \(/u);
	assert.match(QUEUE_HEADER_SOURCE, /aria-label="Open detail panel"/u);
	assert.doesNotMatch(QUEUE_HEADER_SOURCE, /spaceName|statusPresentation|session\.title|<Lozenge/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /isDetailPanelOpen \? \([\s\S]*<QueueDetailPanel/u);
});

test("Queue detail panel groups session, development, delivery, sources, and output", () => {
	assert.match(
		QUEUE_WORKSPACE_SOURCE,
		/<AnimatePresence initial=\{false\}>[\s\S]*<QueueDetailPanel[\s\S]*agent=\{agent\}[\s\S]*session=\{session\}/u,
	);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<PanelContainer/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<PanelHeader/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /session: AsxQueueSession/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /agent: RovoAgentProfile/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<motion\.div/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /absolute inset-y-0 right-0 z-20 h-full w-80 max-w-full/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /h-full border-l border-border bg-surface/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /useReducedMotion\(\)/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /transform: "translateX\(100%\)"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /duration: 0\.25, ease: \[0, 0\.4, 0, 1\]/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /duration: 0\.2, ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<PanelTitle>Details<\/PanelTitle>/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<PanelActionClose label="Close detail panel" onClick=\{onClose\} \/>/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<section aria-label="Session"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /title="Development"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /title="Delivery"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<Separator className="mx-4 data-horizontal:w-auto" \/>/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /"awaiting-input": "Awaiting user response"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /"awaiting-input": "warning"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<Lozenge variant=\{STATUS_VARIANTS\[session\.status\]\}>/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /label="Session"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /label="Agent"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<Tag\s+type="agent"/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /<AgentAvatarVisual[\s\S]*avatarSrc=\{agent\.avatarSrc\}[\s\S]*sizePx=\{16\}/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /\{agent\.name\}[\s\S]*<\/Tag>/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /label="Jira" value=\{issueDescription\}/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /session\.repository \? <QueueDetailRow/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /session\.pullRequestNumber \? <QueueDetailRow/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /session\.fileChanges \? \(/u);
	assert.doesNotMatch(QUEUE_DETAIL_PANEL_SOURCE, /session\.title|Cloud session|Local session/u);
	assert.doesNotMatch(QUEUE_DETAIL_PANEL_SOURCE, /Environment|environment/u);
	assert.doesNotMatch(QUEUE_DETAIL_PANEL_SOURCE, /shrink-0|max-lg:absolute/u);
	assert.doesNotMatch(QUEUE_DETAIL_PANEL_SOURCE, /m-3|rounded-lg|border border-border/u);
	assert.doesNotMatch(QUEUE_DETAIL_PANEL_SOURCE, /bg-black|text-white|#[0-9a-f]{3,8}/iu);

	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /title="Sources"/u);
	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /title="Output"/u);
	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /<SmartLink[\s\S]*side="left"/u);
	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /variant: "jira"/u);
	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /variant: "confluence"/u);
	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /variant: "loom"/u);
	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /grid grid-cols-2 gap-2/u);
	assert.match(QUEUE_DETAIL_ARTIFACTS_SOURCE, /<AttachmentPreviewCard/u);
	assert.match(JIRA_ATTACHMENTS_SOURCE, /<AttachmentPreviewCard/u);
	assert.match(ATTACHMENT_PREVIEW_CARD_SOURCE, /h-\[104px\]/u);
	assert.match(ATTACHMENT_PREVIEW_CARD_SOURCE, /elevation\.shadow\.raised/u);
});

test("ASX Queue seeds a perpetual running session with an in-progress thinking trace", () => {
	assert.match(QUEUE_SESSIONS_SOURCE, /issueKey: "RFP-104",/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /status: "running",/u);
	assert.match(QUEUE_SESSIONS_SOURCE, /data-thinking-event/u);
	assert.match(QUEUE_DETAIL_PANEL_SOURCE, /running: "Running"/u);
});
