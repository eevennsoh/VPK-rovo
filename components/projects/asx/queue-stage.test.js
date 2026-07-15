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
const QUEUE_WORKSPACE_SOURCE = fs.readFileSync(
	path.join(__dirname, "components/queue-conversation-workspace.tsx"),
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
	assert.doesNotMatch(ROVO_OVERLAY_SOURCE, /positioning="container"/u);
});

test("Queue stage hosts Jira chrome around ASX-local session navigation", () => {
	assert.match(QUEUE_STAGE_SOURCE, /<AppLayout[\s\S]*product="jira"[\s\S]*hideRovoAction/u);
	assert.match(QUEUE_STAGE_SOURCE, /topNavigationSearchAlignment="sidebar"/u);
	assert.match(QUEUE_STAGE_SOURCE, /<JiraSidebar[\s\S]*sessionNavigation=/u);
	assert.match(QUEUE_STAGE_SOURCE, /createInitialQueueSessions\(ASX_QUEUE_SESSION_SEEDS\)/u);
	assert.match(QUEUE_STAGE_SOURCE, /appendQueueSessionUserMessage/u);
	assert.doesNotMatch(QUEUE_STAGE_SOURCE, /fetch\(|\/api\/rovo|RovoPage/u);
});

test("project shell sidebar overrides retain the product-derived default", () => {
	assert.match(PROJECT_LAYOUT_SOURCE, /sidebarContent\?: React\.ReactNode;/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /topNavigationSearchAlignment = "responsive"/u);
	assert.match(PROJECT_LAYOUT_SOURCE, /<Sidebar[\s\S]*product=\{product\}[\s\S]*content=\{sidebarContent\}/u);
	assert.match(PRODUCT_SIDEBAR_SOURCE, /content\?: React\.ReactNode;/u);
	assert.match(PRODUCT_SIDEBAR_SOURCE, /if \(content\) \{[\s\S]*return content;[\s\S]*switch \(product\)/u);
});

test("Queue workspace reuses fullscreen message and Rovo composer primitives", () => {
	assert.match(QUEUE_WORKSPACE_SOURCE, /import \{ ChatMessages \}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /import \{ RovoAppComposer \}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /data-testid="asx-queue-conversation"/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /showFeedbackActions=\{false\}/u);
	assert.match(QUEUE_WORKSPACE_SOURCE, /showSubmitWhenEmpty/u);
});
