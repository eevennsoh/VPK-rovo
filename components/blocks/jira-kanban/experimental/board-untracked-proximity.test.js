/**
 * Source contracts for View → Agent → Untracked board proximity.
 *
 * The menu lifts Untracked onto the experimental page; Pulse sessions sit
 * under matching Jira cards with the same flyout attach path as the column,
 * exit through AnimatePresence, a column click spotlights the related issue,
 * and a column hover lights that issue's session rows without spotlighting.
 */

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const EXPERIMENTAL_DIR = __dirname;
const PAGE_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "page.tsx"), "utf8");
const BOARD_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "experimental-jira-kanban.tsx"), "utf8");
const CARD_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "experimental-jira-kanban-card.tsx"), "utf8");
const HELPER_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "lib", "board-untracked-sessions.ts"), "utf8");
const SESSION_INDEX_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "..", "..", "agent-session", "index.tsx"),
	"utf8",
);
const MEDIUM_CARD_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "..", "..", "agent-session", "agent-session-medium-card.tsx"),
	"utf8",
);

function withoutComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/[^\n]*/gu, "");
}

test("the experimental page groups Pulse sessions onto the board when Untracked is on", () => {
	assert.match(PAGE_SOURCE, /import \{\s*collectBoardIssueKeys,\s*groupBoardUntrackedSessions,\s*selectBoardUntrackedSessions,\s*\} from "\.\/lib\/board-untracked-sessions"/u);
	assert.match(PAGE_SOURCE, /const \[showUntracked, setShowUntracked\] = useState\(true\)/u);
	assert.match(
		PAGE_SOURCE,
		/showUntracked\s*\?\s*groupBoardUntrackedSessions\(\{\s*boardIssueKeys,\s*capturedItemIds: capturedLooseWorkIds,\s*detachedByCard: detachedAgentSessionsByCard,\s*sessions: agentSessionItems,\s*\}\)\s*:\s*EMPTY_PROXIMITY_SESSIONS/u,
	);
	assert.match(PAGE_SOURCE, /detachedAgentSessionsByCard=\{proximityAgentSessionsByCard\}/u);
	assert.match(HELPER_SOURCE, /session\.sessionDetails\?\.issueKey/u);
	assert.match(HELPER_SOURCE, /capturedItemIds\.has\(session\.id\)/u);
});

test("the Untracked column follows card session link and unlink state", () => {
	assert.match(
		PAGE_SOURCE,
		/const untrackedAgentSessionItems = useMemo\([\s\S]*selectBoardUntrackedSessions\(\{[\s\S]*capturedItemIds: capturedLooseWorkIds,[\s\S]*detachedByCard: detachedAgentSessionsByCard,[\s\S]*sessions: agentSessionItems,/u,
	);
	assert.match(PAGE_SOURCE, /items: untrackedAgentSessionItems/u);
	assert.match(
		PAGE_SOURCE,
		/const handleCardAgentSessionLink:[\s\S]*setCapturedLooseWorkIds\([\s\S]*new Set\(current\)\.add\(session\.id\)/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const handleCardAgentSessionUnlink:[\s\S]*setCapturedLooseWorkIds\([\s\S]*next\.delete\(session\.id\)/u,
	);
	assert.match(PAGE_SOURCE, /onCardAgentSessionLink\?\.\(session, card, columnTitle\)/u);
	assert.match(PAGE_SOURCE, /onCardAgentSessionUnlink\?\.\(session, card, columnTitle\)/u);
});

test("proximity AgentSession forwards the Pulse flyout attach handlers", () => {
	assert.match(CARD_SOURCE, /capturedItemIds=\{capturedItemIds\}/u);
	assert.match(CARD_SOURCE, /onCreateWorkItem=\{onCreateWorkItem\}/u);
	assert.match(CARD_SOURCE, /onLinkWorkItem=\{onSessionLink \|\| onLinkWorkItem/u);
	assert.match(CARD_SOURCE, /onSubtasks=\{onSubtasks\}/u);
	assert.match(CARD_SOURCE, /variant="medium-detached"/u);
	assert.match(PAGE_SOURCE, /proximityAgentSession=\{\{/u);
	assert.match(PAGE_SOURCE, /actionableSessionIds: proximityActionableSessionIds/u);
	assert.match(BOARD_SOURCE, /bindBoardProximitySessionActions\(/u);
	assert.match(BOARD_SOURCE, /capturedItemIds=\{proximityActions\.capturedItemIds\}/u);
	assert.match(BOARD_SOURCE, /onCreateWorkItem=\{proximityActions\.onCreateWorkItem\}/u);
	assert.match(BOARD_SOURCE, /onLinkWorkItem=\{proximityActions\.onLinkWorkItem\}/u);
	assert.match(BOARD_SOURCE, /onSubtasks=\{proximityActions\.onSubtasks\}/u);
	assert.doesNotMatch(BOARD_SOURCE, /onCreateWorkItem=\{agentSessionColumn\?\.onCreateWorkItem\}/u);
});

test("unchecking Untracked exits board-adjacent sessions through the issue presence recipe", () => {
	assert.match(CARD_SOURCE, /import \{ AnimatePresence, motion, useReducedMotion \} from "motion\/react"/u);
	assert.match(
		CARD_SOURCE,
		/import \{\s*getJiraIssuePresenceMotion,\s*JIRA_ISSUE_MOTION_STYLE,\s*\} from "@\/components\/blocks\/jira-issue\/lib"/u,
	);
	assert.match(CARD_SOURCE, /const proximityMotion = getJiraIssuePresenceMotion\(shouldReduceMotion\)/u);
	assert.match(
		withoutComments(CARD_SOURCE),
		/<AnimatePresence>\s*\{detachedAgentSessions\.length > 0 \? \(\s*<motion\.div[\s\S]*exit=\{proximityMotion\.exit\}/u,
	);
	assert.doesNotMatch(BOARD_SOURCE, /data-agent-session-column[\s\S]*showUntracked/u);
});

test("column card hover lights related board sessions without scrolling or spotlighting", () => {
	const boardWithoutComments = withoutComments(BOARD_SOURCE);
	const hoverHandlerStart = boardWithoutComments.indexOf("const handleSessionHover");
	const hoverHandlerBody = boardWithoutComments.slice(
		hoverHandlerStart,
		boardWithoutComments.indexOf("};", hoverHandlerStart),
	);

	assert.notStrictEqual(hoverHandlerStart, -1);
	assert.match(BOARD_SOURCE, /onItemHover=\{handleSessionHover\}/u);
	assert.match(hoverHandlerBody, /setHoveredSessionId\(item\?\.id \?\? null\)/u);
	assert.match(hoverHandlerBody, /agentSessionColumn\?\.onItemHover\?\.\(item\)/u);
	// Hover previews a relationship. Only a click owns focus, scroll, and the
	// `opacity-40` veil, so the hover handler must stay out of all three.
	assert.doesNotMatch(hoverHandlerBody, /setFocusedIssueKey/u);
	assert.doesNotMatch(hoverHandlerBody, /scrollBoardIssueIntoView/u);
	assert.doesNotMatch(BOARD_SOURCE, /hoveredIssueKey/u);
	assert.match(BOARD_SOURCE, /highlightedSessionId=\{hoveredSessionId\}/u);
	assert.match(CARD_SOURCE, /highlightedItemId=\{highlightedSessionId\}/u);
});

test("a hovered column session lights its board twin at the row hover rung", () => {
	// The column and the board render the same session ids, so the twin is found
	// by id rather than by re-deriving the work-item relationship.
	assert.match(SESSION_INDEX_SOURCE, /isHighlighted=\{item\.id === highlightedItemId\}/u);
	// Same rung the row reaches on its own hover, so a remote pointer reads the
	// way a local one would. Notably not the blue the click spotlight owns.
	assert.match(MEDIUM_CARD_SOURCE, /isHighlighted\s*\?\s*"bg-bg-accent-gray-subtlest-hovered"/u);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /bg-bg-accent-blue-subtlest/u);
	assert.match(
		MEDIUM_CARD_SOURCE,
		/:\s*"bg-bg-accent-gray-subtlest hover:bg-bg-accent-gray-subtlest-hovered"/u,
	);
	assert.match(
		MEDIUM_CARD_SOURCE,
		/transition-\[background-color\] duration-normal ease-out-practical motion-reduce:transition-none/u,
	);
});

test("column card click scrolls the related issue and applies the blue-subtlest spotlight", () => {
	assert.match(BOARD_SOURCE, /onView=\{handleSessionView\}/u);
	assert.match(BOARD_SOURCE, /onSelectedItemIdChange=\{handleSessionSelectionChange\}/u);
	assert.match(
		withoutComments(BOARD_SOURCE),
		/const handleSessionSelectionChange = \(itemId: string \| null\) => \{\s*if \(itemId === null\) \{\s*setFocusedIssueKey\(null\);/u,
	);
	assert.match(BOARD_SOURCE, /data-issue-key=\{card\.code\}/u);
	assert.match(BOARD_SOURCE, /spotlightIssueKey === card\.code && "bg-bg-accent-blue-subtlest"/u);
	assert.match(
		BOARD_SOURCE,
		/spotlightIssueKey !== null && spotlightIssueKey !== card\.code && "opacity-40"/u,
	);
	assert.match(
		BOARD_SOURCE,
		/const spotlightIssueKey = resolveVisibleFocusedIssueKey\(focusedIssueKey, boardColumns\)/u,
	);
	assert.match(
		BOARD_SOURCE,
		/transition-\[background-color,opacity\] duration-normal ease-out-practical/u,
	);
	assert.match(BOARD_SOURCE, /motion-reduce:transition-none/u);
	assert.match(
		BOARD_SOURCE,
		/scrollBoardIssueIntoView\(boardScrollportRef\.current, nextKey\)/u,
	);
	assert.match(BOARD_SOURCE, /agentSessionColumn\?\.onView\?\.\(item\)/u);
	assert.match(BOARD_SOURCE, /agentSessionColumn\?\.onSelectedItemIdChange\?\.\(itemId\)/u);
	assert.match(SESSION_INDEX_SOURCE, /if \(nextId !== null\) \{\s*\n\s*onView\?\.\(item\);\s*\n\s*\}/u);
	assert.match(HELPER_SOURCE, /boardScrollport\.scrollBy\(\{\s*behavior: "instant",\s*left:/u);
	assert.match(HELPER_SOURCE, /columnScrollport\.scrollBy\(\{\s*behavior: "instant",\s*top:/u);
	assert.doesNotMatch(HELPER_SOURCE, /scrollIntoView/u);
	assert.doesNotMatch(HELPER_SOURCE, /"smooth"/u);
});

test("Untracked stays frozen beside the independently scrolling Jira status pane", () => {
	const statusScrollportStart = BOARD_SOURCE.indexOf("<section");
	const statusScrollportEnd = BOARD_SOURCE.indexOf("</section>", statusScrollportStart);
	const statusScrollportSource = BOARD_SOURCE.slice(statusScrollportStart, statusScrollportEnd);

	assert.match(BOARD_SOURCE, /const boardScrollportRef = useRef<HTMLElement \| null>\(null\)/u);
	assert.match(
		BOARD_SOURCE,
		/<AgentSessionColumn[\s\S]*<\/div>\s*\) : null\}\s*<section[\s\S]*ref=\{boardScrollportRef\}[\s\S]*data-jira-kanban-scrollport=""[\s\S]*overflowX: "auto"/u,
	);
	assert.doesNotMatch(statusScrollportSource, /AgentSessionColumn/u);
	assert.match(BOARD_SOURCE, /data-jira-kanban-card-list=""/u);
});
