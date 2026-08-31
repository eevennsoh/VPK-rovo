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
	assert.match(PAGE_SOURCE, /openAgentChat\(\{[\s\S]*agentId: activity\.id,[\s\S]*issueKey: card\.code/u);
	assert.match(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*externalThinkingMessageId=\{externalThinkingMessageId\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*insights=/u);
});

test("the board opts into the experimental Jira issue split agent rows", () => {
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*agentActivityLayout="split"/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /agentActivityLayout\?: JiraIssueAgentActivityLayout;/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*agentActivityLayout=\{agentActivityLayout\}/u,
	);
});

test("the board puts agent and skill assignment in each card's More actions menu", () => {
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*cardGenerativeActionPresentation="more-actions"/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /cardGenerativeActionPresentation\?: JiraIssueGenerativeActionPresentation;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<ExperimentalJiraKanban[\s\S]*cardGenerativeActionPresentation=\{cardGenerativeActionPresentation\}/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /cardGenerativeActionPresentation = "sparkle",/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /<JiraIssue[\s\S]*generativeActionPresentation=\{cardGenerativeActionPresentation\}/u);
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
	assert.match(PAGE_SOURCE, /agentSessionAssigneeIdAliases=\{JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showAgentSessionColumn\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /capturedItemIds: capturedLooseWorkIds,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /toPulseSessionHandlers/u);

	const columnIndex = EXPERIMENTAL_BOARD_SOURCE.indexOf("<AgentSessionColumn {...agentSessionColumn} />");
	const scrollportIndex = EXPERIMENTAL_BOARD_SOURCE.indexOf("<section");
	assert.ok(columnIndex > 0, "expected the board to render the Agent Session column");
	assert.ok(columnIndex < scrollportIndex, "expected untracked work to stay pinned before the status scrollport");
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /agentSessionColumn \? "ps-2" : "ps-6"/u);
});

test("the board's single AI entry point is the Omnibar, scrubbing the PAY sprint week", () => {
	assert.match(PAGE_SOURCE, /<Omnibar[\s\S]*positioning="viewport"/u);
	assert.match(PAGE_SOURCE, /<Omnibar[\s\S]*timelineEntries=\{SCRUBBER_DEMO_ENTRIES\}/u);
	// Two bottom-anchored Rovo affordances would compete for the same job, so the
	// launcher is hidden — but the floating chat stays reachable from card actions,
	// which is why `chat` is left on `auto`.
	assert.match(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*launcher="hidden"/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*chat="hidden"/u);
});

test("the Omnibar block gates the timeline behind entries rather than always rendering it", () => {
	const OMNIBAR_SOURCE = readProjectFile("components/blocks/omnibar/components/omnibar.tsx");
	const OMNIBAR_BAR_SOURCE = readProjectFile("components/blocks/omnibar/components/omnibar-bar.tsx");

	// No entries means no toggle, so every existing consumer keeps today's bar.
	assert.match(OMNIBAR_SOURCE, /const timeline = timelineEntries\s*\?/u);
	assert.match(OMNIBAR_BAR_SOURCE, /\{timeline \? \(/u);
	// Only the horizontal axis takes the editor cell; `y` docks a sibling rail.
	assert.match(OMNIBAR_BAR_SOURCE, /timeline\?\.isTimeline === true && timeline\.axis === "x"/u);
	assert.match(OMNIBAR_SOURCE, /timelineAxis === "y"/u);
});

test("the Omnibar send control stays disabled when the host wires no onSubmit", () => {
	// Regression: v4 is the first consumer to mount the Omnibar without `onSubmit`, and
	// `OmnibarBar` used to omit `submitDisabled`. `RovoComposerActionButton` resolves
	// `disabled` as `submitDisabled || !canSubmit`, so the button enabled itself on the
	// first keystroke and then did nothing — `handleSubmit` returns early with no consumer.
	const OMNIBAR_SOURCE = readProjectFile("components/blocks/omnibar/components/omnibar.tsx");
	const OMNIBAR_BAR_SOURCE = readProjectFile("components/blocks/omnibar/components/omnibar-bar.tsx");

	assert.match(OMNIBAR_SOURCE, /<OmnibarBar[\s\S]*submitDisabled=\{onSubmit === undefined\}/u);
	assert.match(
		OMNIBAR_BAR_SOURCE,
		/<RovoComposerActionButton[\s\S]*submitDisabled=\{submitDisabled\}/u,
		"the bar must forward submitDisabled, not just accept it",
	);
	// The runtime guard stays too: Enter reaches requestSubmit() without touching the button.
	assert.match(OMNIBAR_SOURCE, /if \(!prompt \|\| onSubmit === undefined\) \{/u);
	// v4 deliberately has no onSubmit, which is what makes the guard reachable there.
	assert.doesNotMatch(PAGE_SOURCE, /<Omnibar[\s\S]*onSubmit=/u);
});
