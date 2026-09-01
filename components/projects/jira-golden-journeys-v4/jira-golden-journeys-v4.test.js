const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PAGE_SOURCE = readProjectFile("components/projects/jira-golden-journeys-v4/page.tsx");
const JIRA_HEADER_SOURCE = readProjectFile("components/projects/jira/components/jira-header.tsx");
const JIRA_TABS_SOURCE = readProjectFile("components/projects/jira/data/tabs.ts");
const EXPERIMENTAL_HEADER_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/experimental-board-header.tsx",
);
const EXPERIMENTAL_PAGE_SOURCE = readProjectFile("components/blocks/jira-kanban/experimental/page.tsx");
const EXPERIMENTAL_BOARD_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/experimental-jira-kanban.tsx",
);
const EXPERIMENTAL_CARD_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/experimental-jira-kanban-card.tsx",
);

test("the route renders the Payments board directly inside Jira app chrome", () => {
	assert.match(PAGE_SOURCE, /import AppLayout from "@\/components\/projects\/page"/u);
	assert.match(PAGE_SOURCE, /<AppLayout[\s\S]*defaultSidebarOpen=\{false\}[\s\S]*product="jira"/u);
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage/u);
	assert.match(PAGE_SOURCE, /createJiraGoldenJourneysV4PayBoardColumns/u);
	assert.match(PAGE_SOURCE, /JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS/u);
	assert.match(PAGE_SOURCE, /JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES/u);
	assert.match(PAGE_SOURCE, /overflow-hidden bg-surface \[&>div\]:min-h-0/u);
});

test("the route no longer renders gallery or presentation phases", () => {
	assert.doesNotMatch(PAGE_SOURCE, /Gallery|GalleryItem/u);
	assert.doesNotMatch(PAGE_SOURCE, /StoryControls|PresentationChapter/u);
	assert.doesNotMatch(PAGE_SOURCE, /TrackLearnStage|BuildStage|TerminalStory/u);
	assert.doesNotMatch(PAGE_SOURCE, /onCardClick=|onInsightsWorkItemClick=/u);
});

test("the board disables Insights while keeping card agent chat in the Jira shell", () => {
	assert.match(PAGE_SOURCE, /insightsEnabled=\{false\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /PULSE_|InsightsNudge|boardRef|timelineLastViewedAt/u);
	assert.match(PAGE_SOURCE, /onCardAgentActivityViewChat=\{handleViewChat\}/u);
	assert.match(PAGE_SOURCE, /onCardAgentDoneRunView=\{handleViewCompletedRun\}/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/onCardAgentDoneRunView\?: JiraKanbanProps\["onCardAgentDoneRunView"\];/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*onCardAgentDoneRunView=\{onCardAgentDoneRunView\}/u,
	);
	assert.match(PAGE_SOURCE, /openAgentChat\(\{[\s\S]*agentId: activity\.id,[\s\S]*issueKey: card\.code/u);
	assert.match(PAGE_SOURCE, /const handleViewCompletedRun = useCallback\([\s\S]*agentId: run\.agentName\.toLowerCase\(\)\.replace\(\/\\s\+\/g, "-"\),[\s\S]*issueKey: run\.issueKey/u);
	assert.match(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*externalThinkingMessageId=\{externalThinkingMessageId\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*insights=/u);
});

test("the route imports the Pulse session guard used by its resume callback", () => {
	assert.match(
		PAGE_SOURCE,
		/import \{ isPulseAgentSession, type PulseLooseWork \} from "@\/components\/blocks\/jira-kanban\/experimental\/pulse\/types";/u,
	);
	assert.match(PAGE_SOURCE, /if \(!isPulseAgentSession\(item\)\) return;/u);
});

test("the board opts into the experimental Jira issue split agent rows", () => {
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*agentActivityLayout="split"/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /agentActivityLayout\?: JiraIssueAgentActivityLayout;/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*agentActivityLayout=\{agentActivityLayout\}/u,
	);
});

test("the board enables board-wide Jira issue agent-session transfer", () => {
	assert.match(PAGE_SOURCE, /import \{ linkJiraKanbanAgentSession, moveJiraKanbanAgentSession, unlinkJiraKanbanAgentSession \} from "@\/components\/blocks\/jira-kanban\/state"/u);
	assert.match(PAGE_SOURCE, /setBoardColumns\(\(columns\) => unlinkJiraKanbanAgentSession\(columns, card\.code, session\.id\)\)/u);
	assert.match(PAGE_SOURCE, /setBoardColumns\(\(columns\) => linkJiraKanbanAgentSession\(columns, card\.code, activity\)\)/u);
	assert.match(
		PAGE_SOURCE,
		/setBoardColumns\(\(columns\) => moveJiraKanbanAgentSession\(\s*columns,\s*sourceCard\.code,\s*targetCard\.code,\s*session\.id,?\s*\)\)/u,
	);
	assert.match(PAGE_SOURCE, /onCardAgentSessionLink=\{handleAgentSessionLink\}/u);
	assert.match(PAGE_SOURCE, /onCardAgentSessionMove=\{handleAgentSessionMove\}/u);
	assert.match(PAGE_SOURCE, /onCardAgentSessionUnlink=\{handleAgentSessionUnlink\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onCardAgentSessionMove\?: ExperimentalJiraKanbanProps\["onCardAgentSessionMove"\];/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/const handleCardAgentSessionMove: ExperimentalJiraKanbanProps\["onCardAgentSessionMove"\][\s\S]*onCardAgentSessionMove\?\.\(\s*session,\s*sourceCard,\s*targetCard,\s*sourceColumnTitle,\s*targetColumnTitle,?\s*\);/u,
	);
	const moveHandlerStart = EXPERIMENTAL_PAGE_SOURCE.indexOf("const handleCardAgentSessionMove:");
	const unlinkHandlerStart = EXPERIMENTAL_PAGE_SOURCE.indexOf("const handleCardAgentSessionUnlink:");
	assert.ok(moveHandlerStart > 0 && unlinkHandlerStart > moveHandlerStart);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE.slice(moveHandlerStart, unlinkHandlerStart),
		/setCapturedLooseWorkIds/u,
		"moving an already-linked session must not change its captured status",
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onCardAgentSessionUnlink\?: ExperimentalJiraKanbanProps\["onCardAgentSessionUnlink"\];/u);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/const canTransferAgentSession = canUnlinkAgentSession \|\| canLinkAgentSession \|\| isBoardDropTarget;/u,
	);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /sessionTransferAfter=\{\(localSessionDrag\) =>/u);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/sessionDrag=\{canLinkAgentSession[\s\S]*\? detachedSessionDrag \?\? localSessionDrag[\s\S]*: undefined\}/u,
	);
});

test("unlinked agent sessions remain detached beneath their source Jira card", () => {
	assert.match(PAGE_SOURCE, /const \[detachedAgentSessionsByCard, setDetachedAgentSessionsByCard\] = useState/u);
	assert.match(PAGE_SOURCE, /toJiraGoldenJourneysV4DetachedAgentSession\(activity, card\)/u);
	assert.match(PAGE_SOURCE, /setDetachedAgentSessionsByCard\(\(current\) =>/u);
	assert.match(PAGE_SOURCE, /detachedAgentSessionsByCard=\{detachedAgentSessionsByCard\}/u);
	assert.match(
		PAGE_SOURCE,
		/const activity = detachedActivitiesByIdRef\.current\[session\.id\]\s*\?\? toJiraIssueDemoAttachedActivity\(session\);/u,
		"re-attaching a complete detached fixture must normalize it to an active chin row",
	);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /<AgentSession[\s\S]*variant="medium-detached"/u);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/<AgentSession[\s\S]*style=\{\{ marginTop: token\("space\.025"\) \}\}/u,
	);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/className="has-\[\[data-session-dragging\]\]:relative has-\[\[data-session-dragging\]\]:z-30"/u,
		"the detached-session Motion stacking context must rise above the Jira issue shell while dragging",
	);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/resolveRelatedJiraIssueAgentActivityMode\(\s*\n\s*card\.agentActivityMode,\s*\n\s*detachedAgentSessions\.length > 0,/u,
	);
});

test("attaching a session removes every detached copy before linking it", () => {
	assert.match(
		PAGE_SOURCE,
		/Object\.entries\(current\)[\s\S]*sessions\.filter\(\(candidate\) => candidate\.id !== session\.id\)/u,
	);
	assert.match(
		PAGE_SOURCE,
		/if \(nextSessions\.length > 0\) \{[\s\S]*next\[cardCode\] = nextSessions;[\s\S]*\}/u,
	);
});

test("Jira session flyouts are suspended for both session and whole-card drags", () => {
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/import \{ JiraSessionFlyoutSuspensionProvider \} from "@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout";/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/const sessionFlyoutsSuspended = sessionDragTransaction !== null \|\| draggedCardCode !== null;/u,
	);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /<JiraSessionFlyoutSuspensionProvider[\s\S]*suspended=\{sessionFlyoutsSuspended\}[\s\S]*<ExperimentalJiraKanbanCard/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /<\/JiraSessionFlyoutSuspensionProvider>/u);
});

test("the board puts agent and skill assignment in each card's More actions menu", () => {
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*cardGenerativeActionPresentation="more-actions"/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /cardGenerativeActionPresentation\?: JiraIssueGenerativeActionPresentation;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<ExperimentalJiraKanban[\s\S]*cardGenerativeActionPresentation=\{cardGenerativeActionPresentation\}/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /cardGenerativeActionPresentation = "sparkle",/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /<ExperimentalJiraKanbanCard[\s\S]*generativeActionPresentation=\{cardGenerativeActionPresentation\}/u);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /<JiraIssue[\s\S]*generativeActionPresentation=\{generativeActionPresentation\}/u);
});

test("the Jira tab bar groups Board and List under one Work items destination", () => {
	assert.match(JIRA_HEADER_SOURCE, /export function JiraViewTabs/u);
	assert.match(JIRA_HEADER_SOURCE, /className=\{isFirst \? "ml-4 flex-none" : "flex-none"\}/u);
	assert.match(JIRA_HEADER_SOURCE, /<IconComponent[\s\S]*label=""/u);
	assert.match(JIRA_HEADER_SOURCE, /<JiraViewTabs selectedTab=\{selectedTab\} onTabChange=\{onTabChange\} \/>/u);
	assert.match(JIRA_TABS_SOURCE, /import WorkItemIcon from "@atlaskit\/icon\/core\/work-item"/u);
	assert.match(JIRA_TABS_SOURCE, /\{ label: "Work items", icon: WorkItemIcon, hasContent: true \}/u);
	assert.doesNotMatch(JIRA_TABS_SOURCE, /label: "(?:Board|List)"/u);
	assert.match(PAGE_SOURCE, /import \{ JiraViewTabs \} from "@\/components\/projects\/jira\/components\/jira-header"/u);
	assert.match(
		PAGE_SOURCE,
		/viewTabs=\{<JiraViewTabs selectedTab=\{selectedTab\} onTabChange=\{setSelectedTab\} \/>\}/u,
	);
	assert.match(PAGE_SOURCE, /showBoardContent=\{selectedTab === 1\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showBoardContent\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showBoardControls=\{showBoardContent\}/u);
});

test("the Work items header switches between Board and List views with their icons", () => {
	assert.match(PAGE_SOURCE, /const \[activeView, setActiveView\] = useState<"board" \| "list">\("board"\)/u);
	assert.match(PAGE_SOURCE, /activeView=\{activeView\}/u);
	assert.match(PAGE_SOURCE, /onViewChange=\{setActiveView\}/u);
	assert.match(PAGE_SOURCE, /renderListContent=\{\(columns\) =>/u);
	assert.match(PAGE_SOURCE, /<JiraList[\s\S]*rows=\{listRows\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /activeView\?: ExperimentalJiraKanbanView;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /renderListContent\?: \(columns: readonly JiraKanbanColumnData\[\]\) => ReactNode;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /activeView === "list" && renderListContent/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<BoardFilterPopover[\s\S]*surfaceLabel=\{activeView\}/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /import \{ Tabs, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs"/u);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /ToggleGroup/u);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/<TabsList aria-label="Work items view">[\s\S]*<TabsTrigger value="board">[\s\S]*<BoardIcon[\s\S]*Board[\s\S]*<TabsTrigger value="list">[\s\S]*<TableIcon[\s\S]*List/u,
	);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /<TabsList[^>]*className=|<TabsTrigger[^>]*className=/u);
	// More board controls stays in the left control cluster, immediately after
	// Insights and before the far-right Board/List switcher.
	const filterControlIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("{filterControl}");
	const viewMenuIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("<BoardViewMenu");
	const modeToggleIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("{modeToggle}");
	const viewSwitcherIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf('aria-label="Work items view"');
	const overflowIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf('aria-label={`More ${surfaceLabel} controls`}');
	assert.ok(filterControlIndex > 0 && filterControlIndex < viewMenuIndex);
	assert.ok(viewMenuIndex > 0 && viewMenuIndex < modeToggleIndex);
	assert.ok(modeToggleIndex > 0 && modeToggleIndex < overflowIndex);
	assert.ok(overflowIndex > 0 && overflowIndex < viewSwitcherIndex);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/\{filterControl\}\s*<BoardViewMenu[\s\S]*?\{modeToggle\}[\s\S]*?<Button aria-disabled aria-label=\{`More \$\{surfaceLabel\} controls`\}/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_HEADER_SOURCE,
		/<div className="flex items-center gap-1">\s*<BoardViewMenu/u,
	);
});

test("the board keeps 24px between the Jira tabs and filter controls", () => {
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/\{viewTabs \? <div className="mt-2">\{viewTabs\}<\/div> : null\}[\s\S]*<div className="mt-6 flex flex-wrap items-center gap-2 px-6">/u,
	);
});

test("the route pins the shared Agent Session column beside Jira statuses", () => {
	assert.match(PAGE_SOURCE, /showAgentSessionColumn/u);
	assert.match(PAGE_SOURCE, /defaultAgentSessionColumnCollapsed/u);
	assert.match(PAGE_SOURCE, /agentSessionAssigneeIdAliases=\{JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showAgentSessionColumn\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /defaultAgentSessionColumnCollapsed\?: boolean;/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/const \[agentSessionColumnCollapsed, setAgentSessionColumnCollapsed\] = useState\(defaultAgentSessionColumnCollapsed\);/u,
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /defaultCollapsed: agentSessionColumnCollapsed,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onCollapsedChange: setAgentSessionColumnCollapsed,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /capturedItemIds: capturedLooseWorkIds,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /toPulseSessionHandlers/u);

	const columnIndex = EXPERIMENTAL_BOARD_SOURCE.indexOf("<AgentSessionColumn");
	const scrollportIndex = EXPERIMENTAL_BOARD_SOURCE.indexOf("<section");
	assert.ok(columnIndex > 0, "expected the board to render the Agent Session column");
	assert.ok(columnIndex < scrollportIndex, "expected untracked work to stay pinned before the status scrollport");
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /agentSessionColumn \? "ps-2" : "ps-6"/u);
});

test("the board's AI entry point is the floating Rovo button, not the Omnibar", () => {
	// AppLayout hides its own launcher so JgpRovoOverlay owns the single FAB.
	assert.match(PAGE_SOURCE, /<AppLayout[\s\S]*hideFloatingRovo[\s\S]*product="jira"/u);
	assert.match(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*externalThinkingMessageId=\{externalThinkingMessageId\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*launcher=/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*chat="hidden"/u);
	assert.doesNotMatch(PAGE_SOURCE, /Omnibar|SCRUBBER_DEMO_ENTRIES|handleOmnibar/u);
	assert.doesNotMatch(PAGE_SOURCE, /useRovoChat|isSidebarChatOpen/u);
});
