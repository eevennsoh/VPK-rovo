const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PAGE_SOURCE = readProjectFile("components/projects/jira-golden-journeys-v4/page.tsx");
const JIRA_HEADER_SOURCE = readProjectFile("components/projects/jira/components/jira-header.tsx");
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

test("the board reuses Jira's tab bar and only shows board content on the Board tab", () => {
	assert.match(JIRA_HEADER_SOURCE, /export function JiraViewTabs/u);
	assert.match(JIRA_HEADER_SOURCE, /className=\{isFirst \? "ml-3 flex-none" : "flex-none"\}/u);
	assert.match(JIRA_HEADER_SOURCE, /<JiraViewTabs selectedTab=\{selectedTab\} onTabChange=\{onTabChange\} \/>/u);
	assert.match(PAGE_SOURCE, /import \{ JiraViewTabs \} from "@\/components\/projects\/jira\/components\/jira-header"/u);
	assert.match(PAGE_SOURCE, /const \[selectedTab, setSelectedTab\] = useState\(1\)/u);
	assert.match(
		PAGE_SOURCE,
		/viewTabs=\{<JiraViewTabs selectedTab=\{selectedTab\} onTabChange=\{setSelectedTab\} \/>\}/u,
	);
	assert.match(PAGE_SOURCE, /showBoardContent=\{selectedTab === 1\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showBoardContent\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showBoardControls=\{showBoardContent\}/u);
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
