const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PAGE_SOURCE = readProjectFile("components/projects/jira-golden-journeys-v4/page.tsx");
const EXPERIMENTAL_PAGE_SOURCE = [
	readProjectFile("components/blocks/jira-kanban/experimental/page.tsx"),
	readProjectFile("components/blocks/jira-kanban/experimental/experimental-page-types.ts"),
].join("\n");
const EXPERIMENTAL_BOARD_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/experimental-jira-kanban.tsx",
);
const ARRIVAL_HOOK_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/hooks/use-created-card-arrival.ts",
);
const ARRIVAL_MOTION_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/components/created-card-arrival-motion.tsx",
);

test("board session creation is route-owned and reveals the created cards once", () => {
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/onBoardAgentSessionCreate\?: \(\s*session: AgentSessionItem,\s*columnTitle: string,\s*\) => string \| undefined;/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const handleBoardAgentSessionCreate = useCallback\([\s\S]*consumeDetachedAgentSession\(session\)[\s\S]*createBoardFromAgentSession\(\{\s*activity,\s*columnTitle,\s*session,\s*\}\)/u,
	);
	assert.match(PAGE_SOURCE, /onBoardAgentSessionCreate=\{handleBoardAgentSessionCreate\}/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/useBoardCreatedCardArrival\(\{\s*captureSession: agentSessionHandlers\.onCreateWorkItem,\s*onCreate: onBoardAgentSessionCreate,\s*\}\)/u,
	);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/createdCardArrivalIdRef\.current \+= 1;[\s\S]*setCreatedCardArrival\(\(current\) => \([\s\S]*cardCodes: \[\.\.\.current\.cardCodes, cardCode\][\s\S]*cardCodes: \[cardCode\]/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*createdCardArrival=\{createdCardArrival \?\? undefined\}[\s\S]*onCreatedCardArrivalComplete=\{handleCreatedCardArrivalComplete\}/u,
	);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/setCreatedCardArrival\(\(current\) => current\?\.id === arrivalId \? null : current\)/u,
	);
});

test("the created-card arrival scrolls its column to the bottom and uses reduced-motion-safe Motion", () => {
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/useCreatedCardArrivalScroll\(\{[\s\S]*arrival: createdCardArrival,[\s\S]*cardCount: count,[\s\S]*onCardListRef: cardListRef,[\s\S]*title,/u,
	);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/useLayoutEffect\(\(\) => \{[\s\S]*lastScrolledArrivalIdRef\.current === arrival\.id[\s\S]*arrivedCardCount < arrival\.cardCodes\.length[\s\S]*cardList\.scrollTo\(\{ behavior: "auto", top: cardList\.scrollHeight \}\)[\s\S]*lastScrolledArrivalIdRef\.current = arrival\.id/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/<CreatedCardArrivalMotion[\s\S]*arrival=\{createdCardArrival\?\.columnTitle === column\.title[\s\S]*cardCode=\{card\.code\}/u,
	);
	assert.match(ARRIVAL_MOTION_SOURCE, /animate=\{isArriving\s*\? \{ opacity: 1, y: 0 \}/u);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/initial=\{isArriving && !shouldReduceMotion \? \{ opacity: 0, y: 8 \} : false\}/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/const JIRA_KANBAN_CARD_ARRIVE_REDUCED: Transition = \{ duration: 0 \};[\s\S]*shouldReduceMotion[\s\S]*JIRA_KANBAN_CARD_ARRIVE_REDUCED[\s\S]*JIRA_KANBAN_CARD_ARRIVE/u,
	);
});

test("the created-card arrival holds its blue agent backdrop before returning to grey", () => {
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/const JIRA_KANBAN_CREATED_CARD_BACKDROP_HOLD_MS = 600; \/\/ duration-slowest/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/\[&_\[data-slot=jira-issue-agent-backdrop\]\]:transition-colors[\s\S]*\[&_\[data-slot=jira-issue-agent-backdrop\]\]:duration-normal[\s\S]*\[&_\[data-slot=jira-issue-agent-backdrop\]\]:ease-out-practical/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/isArriving && "\[&_\[data-slot=jira-issue-agent-backdrop\]\]:bg-bg-accent-blue-subtlest"/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/motion-reduce:\[&_\[data-slot=jira-issue-agent-backdrop\]\]:transition-none[\s\S]*data-created-card-backdrop=\{isArriving \|\| undefined\}/u,
	);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/window\.setTimeout\(\(\) => \{[\s\S]*onComplete\?\.\(arrivalId\)[\s\S]*JIRA_KANBAN_CREATED_CARD_BACKDROP_HOLD_MS/u,
	);
	assert.match(ARRIVAL_HOOK_SOURCE, /window\.clearTimeout\(holdTimeoutRef\.current\)/u);
});
