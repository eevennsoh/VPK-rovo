const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const HEADER_SOURCE = readFileSync(join(__dirname, "board-header.tsx"), "utf8");
const JIRA_ISSUE_SOURCE = readFileSync(join(__dirname, "..", "jira-issue", "index.tsx"), "utf8");
const COLUMN_DRAG_SOURCE = SOURCE.slice(
	SOURCE.indexOf("const handleColumnDragOver"),
	SOURCE.indexOf("<BoardColumn", SOURCE.indexOf("const handleColumnDragOver")),
);

async function loadStateHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
					export {
					createJiraKanbanSelectionState,
					filterJiraKanbanColumnsByAssignee,
					getJiraKanbanAssignees,
					moveJiraKanbanCardsToColumn,
					selectJiraKanbanCard,
					getCommonJiraKanbanAgentIds,
					updateJiraKanbanCardAgentAssignment,
				} from "./components/blocks/jira-kanban/state";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "jira-kanban-state-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

const SELECTION_COLUMNS = [
	{
		title: "Intake",
		count: 3,
		cards: ["RFP-101", "RFP-102", "RFP-103"].map((code) => ({ code })),
	},
	{ title: "Drafting", count: 0, cards: [] },
];

const FILTER_COLUMNS = [
	{
		title: "Intake",
		count: 2,
		cards: [
			{ code: "RFP-101", assignee: { id: "maya", name: "Maya", avatarSrc: "/maya.png" } },
			{ code: "RFP-102", assignee: { id: "jordan", name: "Jordan", avatarSrc: "/jordan.png" } },
		],
	},
	{
		title: "Review",
		count: 2,
		cards: [
			{ code: "RFP-161", assignee: { id: "maya", name: "Maya", avatarSrc: "/maya.png" } },
			{ code: "RFP-162", assignee: { id: "priya", name: "Priya", avatarSrc: "/priya.png" } },
		],
	},
];

test("Kanban demo preserves the rounded docs frame and leaves scrolling to the board", () => {
	assert.match(PAGE_SOURCE, /rounded-lg bg-surface p-4 md:p-5/u);
	assert.doesNotMatch(PAGE_SOURCE, /overflow-x-auto/u);
	assert.match(SOURCE, /overflowX: "auto"/u);
});

test("Kanban block demo includes the shared Jira header and assignee filter", () => {
	assert.match(PAGE_SOURCE, /<JiraKanbanBoardHeader/u);
	assert.match(PAGE_SOURCE, /filterJiraKanbanColumnsByAssignee/u);
	assert.match(PAGE_SOURCE, /boardColumns=\{filteredBoardColumns\}/u);
	assert.match(
		PAGE_SOURCE,
		/setSelection\(createJiraKanbanSelectionState\(\)\);[\s\S]*setDraggedCard\(null\);[\s\S]*setSelectedAssigneeIds\(assigneeIds\);/u,
	);
});

test("Kanban header matches the production board alignment and action groups", () => {
	assert.match(HEADER_SOURCE, /<header className="shrink-0 px-4 pb-4 pt-3">/u);
	assert.doesNotMatch(HEADER_SOURCE, /<header className="[^"]*border-b/u);
	assert.doesNotMatch(HEADER_SOURCE, />Filter by</u);
	assert.match(
		HEADER_SOURCE,
		/<div className="border-r border-border p-3">[\s\S]*<Button aria-disabled variant="outline">[\s\S]*<Icon data-icon="inline-start" render=\{<AddIcon label="" size="small" \/>\} \/>[\s\S]*Add field[\s\S]*\{FILTER_FIELDS\.map/u,
	);
	assert.match(HEADER_SOURCE, /<AvatarUnassigned kind="person" label="Unassigned" size="sm" \/>/u);
	assert.match(HEADER_SOURCE, /aria-label=\{`Filter board by \$\{assignee\.name\}`\}/u);
	assert.match(HEADER_SOURCE, /aria-pressed=\{selectedAssigneeIds\.has\(assignee\.id\)\}/u);
	assert.match(HEADER_SOURCE, /onClick=\{\(\) => toggleAssignee\(assignee\.id\)\}/u);
	assert.match(HEADER_SOURCE, /<Button aria-disabled variant="outline">[\s\S]*Group/u);
	assert.match(HEADER_SOURCE, /<div className="ml-auto flex items-center gap-1">/u);
	assert.match(HEADER_SOURCE, /aria-label="View insights"/u);
	assert.match(HEADER_SOURCE, /aria-label="More board controls"/u);
});

test("Kanban assignee list fades into its fixed selection footer", () => {
	assert.match(HEADER_SOURCE, /import \{ ScrollMask \} from "@\/components\/visual\/scroll-mask";/u);
	assert.match(
		HEADER_SOURCE,
		/<ScrollMask[\s\S]*footer=\{[\s\S]*\{selectedAssigneeIds\.size\} selected[\s\S]*Clear all[\s\S]*footerClassName="bg-popover px-0 pb-0 pt-3"/u,
	);
	assert.doesNotMatch(HEADER_SOURCE, /max-h-64 overflow-y-auto/u);
});

test("Kanban card focus border stays inside the card and uses the focused border token", () => {
	assert.match(JIRA_ISSUE_SOURCE, /"group\/jira-issue relative w-full border outline-none focus-visible:border-ring"/);
	assert.doesNotMatch(JIRA_ISSUE_SOURCE, /border: "none"/);
});

test("Kanban card list gives the first card room for its raised edge", () => {
	assert.match(
		SOURCE,
		/overflowY: "auto",\n\s+paddingTop: token\("space\.050"\),\n\s+paddingBottom: token\("space\.100"\),/,
	);
});

test("Kanban drag-over column border stays inside the column and uses the focused border token", () => {
	assert.match(COLUMN_DRAG_SOURCE, /className="border-2 border-transparent transition-colors"/);
	assert.match(COLUMN_DRAG_SOURCE, /classList\.add\("border-ring"\)/);
	assert.doesNotMatch(COLUMN_DRAG_SOURCE, /ring-offset-2/);
	assert.doesNotMatch(COLUMN_DRAG_SOURCE, /ring-border-bold/);
});

test("Kanban agent stack removes the avatar-group overlap ring", () => {
	assert.match(SOURCE, /<AvatarGroup className="-space-x-1\.5 \*:data-\[slot=avatar\]:ring-0!"/);
	assert.match(SOURCE, /label=\{agent\.name\} shape="hexagon" size="sm"/);
	assert.doesNotMatch(SOURCE, /showHexagonBorder/);
});

test("Kanban third-party agents use the shared hexagonal avatar frame", () => {
	assert.match(
		SOURCE,
		/if \(agent\.brandName\) \{[\s\S]*<Avatar className=\{className\} label=\{agent\.name\} shape="hexagon" size="sm">[\s\S]*<LogoThirdParty borderless label="" name=\{agent\.brandName\} size="xxsmall" \/>/u,
	);
	assert.doesNotMatch(SOURCE, /return <LogoThirdParty className=\{className\}/u);
});

test("Kanban agent assignment icons use selected icon color while the trigger is open", () => {
	assert.match(SOURCE, /className="ml-0\.5 text-icon-subtle group-aria-expanded\/button:text-icon-selected"/);
	assert.match(SOURCE, /className="text-icon-subtle group-aria-expanded\/button:text-icon-selected"/);
});

test("Kanban card renders explicit unassigned avatars with the shared placeholder", () => {
	assert.match(JIRA_ISSUE_SOURCE, /AvatarUnassigned,/);
	assert.match(JIRA_ISSUE_SOURCE, /assigneeUnassignedKind\?: AvatarUnassignedKind;/);
	assert.match(SOURCE, /assigneeUnassignedKind=\{card\.avatarUnassignedKind\}/);
	assert.match(
		JIRA_ISSUE_SOURCE,
		/function JiraIssueAssignee[\s\S]*if \(assigneeUnassignedKind\) \{[\s\S]*<AvatarUnassigned[\s\S]*kind=\{assigneeUnassignedKind\}[\s\S]*size="sm"/,
	);
});

test("Kanban multi-card drag fades every selected card", () => {
	assert.match(SOURCE, /const isSelectedCardBeingDragged = Boolean\(draggedCardCode && isMultiSelection && isSelected\);/);
	assert.match(SOURCE, /dragging=\{isCardBeingDragged \|\| isSelectedCardBeingDragged\}/);
});

test("Kanban multi-card drag uses a move cursor affordance without covering the item count", () => {
	assert.match(SOURCE, /event\.dataTransfer\.effectAllowed = "move";/);
	assert.match(SOURCE, /event\.dataTransfer\.dropEffect = "move";/);
	assert.match(SOURCE, /event\.dataTransfer\.setData\("text\/plain", card\.code\);/);
	assert.match(COLUMN_DRAG_SOURCE, /event\.dataTransfer\.dropEffect = "move";/);
	assert.match(SOURCE, /label\.style\.top = "18px";/);
	assert.match(SOURCE, /label\.style\.background = "var\(--ds-background-neutral-bold\)";/);
	assert.match(SOURCE, /event\.dataTransfer\.setDragImage\(dragImageRef\.current, 0, 0\);/);
});

test("Kanban multi-card drag does not render an extra count badge on the source card", () => {
	assert.doesNotMatch(SOURCE, /groupBadgeCount/);
	assert.doesNotMatch(SOURCE, /dragGroupCount/);
	assert.doesNotMatch(SOURCE, /draggedCardCount/);
});

test("Kanban selection supports a first Shift-click and a subsequent Shift range", async () => {
	const { createJiraKanbanSelectionState, selectJiraKanbanCard } = await loadStateHarness();
	let selection = createJiraKanbanSelectionState();

	selection = selectJiraKanbanCard(selection, SELECTION_COLUMNS, {
		cardCode: "RFP-101",
		columnTitle: "Intake",
		indexInColumn: 0,
		modifiers: { shiftKey: true, metaOrCtrlKey: false },
	});
	assert.deepEqual([...selection.selectedCardCodes], ["RFP-101"]);

	selection = selectJiraKanbanCard(selection, SELECTION_COLUMNS, {
		cardCode: "RFP-103",
		columnTitle: "Intake",
		indexInColumn: 2,
		modifiers: { shiftKey: true, metaOrCtrlKey: false },
	});
	assert.deepEqual([...selection.selectedCardCodes], ["RFP-101", "RFP-102", "RFP-103"]);
});

test("Kanban selected cards move together and keep derived column counts accurate", async () => {
	const { moveJiraKanbanCardsToColumn } = await loadStateHarness();
	const columns = moveJiraKanbanCardsToColumn(
		SELECTION_COLUMNS,
		["RFP-101", "RFP-102"],
		"Drafting",
	);

	assert.deepEqual(columns.find((column) => column.title === "Intake").cards.map((card) => card.code), ["RFP-103"]);
	assert.deepEqual(columns.find((column) => column.title === "Drafting").cards.map((card) => card.code), ["RFP-101", "RFP-102"]);
	assert.equal(columns.find((column) => column.title === "Intake").count, 1);
	assert.equal(columns.find((column) => column.title === "Drafting").count, 2);
});

test("Kanban status changes leave selected cards already in the target column in place", async () => {
	const { moveJiraKanbanCardsToColumn } = await loadStateHarness();
	const columns = moveJiraKanbanCardsToColumn(
		[
			{ title: "Intake", count: 1, cards: [{ code: "RFP-101" }] },
			{ title: "Drafting", count: 2, cards: [{ code: "RFP-141" }, { code: "RFP-142" }] },
		],
		["RFP-101", "RFP-142"],
		"Drafting",
	);

	assert.deepEqual(
		columns.find((column) => column.title === "Drafting").cards.map((card) => card.code),
		["RFP-101", "RFP-141", "RFP-142"],
	);
	assert.equal(columns.find((column) => column.title === "Intake").count, 0);
	assert.equal(columns.find((column) => column.title === "Drafting").count, 3);
});

test("Kanban assignee filtering preserves columns, ordering, and accurate counts", async () => {
	const { filterJiraKanbanColumnsByAssignee } = await loadStateHarness();
	const unfiltered = filterJiraKanbanColumnsByAssignee(FILTER_COLUMNS, new Set());
	const mayaOnly = filterJiraKanbanColumnsByAssignee(FILTER_COLUMNS, new Set(["maya"]));

	assert.deepEqual(unfiltered.map((column) => column.cards.map((card) => card.code)), [
		["RFP-101", "RFP-102"],
		["RFP-161", "RFP-162"],
	]);
	assert.deepEqual(mayaOnly.map((column) => column.title), ["Intake", "Review"]);
	assert.deepEqual(mayaOnly.map((column) => column.cards.map((card) => card.code)), [
		["RFP-101"],
		["RFP-161"],
	]);
	assert.deepEqual(mayaOnly.map((column) => column.count), [1, 1]);
});

test("Kanban multi-assignee filtering uses OR semantics and keeps empty columns", async () => {
	const { filterJiraKanbanColumnsByAssignee } = await loadStateHarness();
	const jordanAndPriya = filterJiraKanbanColumnsByAssignee(
		FILTER_COLUMNS,
		new Set(["jordan", "priya"]),
	);
	const nobody = filterJiraKanbanColumnsByAssignee(FILTER_COLUMNS, new Set(["nobody"]));

	assert.deepEqual(jordanAndPriya.map((column) => column.cards.map((card) => card.code)), [
		["RFP-102"],
		["RFP-162"],
	]);
	assert.deepEqual(nobody.map((column) => column.count), [0, 0]);
	assert.equal(nobody.length, FILTER_COLUMNS.length);
});

test("Kanban derives each assignee once in first-card order", async () => {
	const { getJiraKanbanAssignees } = await loadStateHarness();
	assert.deepEqual(getJiraKanbanAssignees(FILTER_COLUMNS).map((assignee) => assignee.id), [
		"maya",
		"jordan",
		"priya",
	]);
});

test("Kanban demo wires controlled selection and grouped drag state", () => {
	assert.match(PAGE_SOURCE, /selectedCardCodes=\{selection\.selectedCardCodes\}/u);
	assert.match(PAGE_SOURCE, /onCardSelect=\{handleCardSelect\}/u);
	assert.match(PAGE_SOURCE, /const isMultiDrag = selection\.selectedCardCodes\.has\(draggedCard\.card\.code\)/u);
});

test("Kanban composes the Jira Toolbar through explicit selection actions", () => {
	assert.match(SOURCE, /selectionToolbar\?: JiraKanbanSelectionToolbarConfig;/u);
	assert.match(SOURCE, /<JiraToolbar[\s\S]*selectedCount=\{selectedCount\}[\s\S]*selectedStatus=\{selectedStatus\}/u);
	assert.match(PAGE_SOURCE, /selectionToolbar=\{\{[\s\S]*onAgentAssignmentChange: handleSelectedCardsAgentAssignmentChange,[\s\S]*onStatusChange: handleSelectedCardsStatusChange/u);
});

test("Kanban agent assignment helpers apply toggles to every selected card", async () => {
	const {
		getCommonJiraKanbanAgentIds,
		updateJiraKanbanCardAgentAssignment,
	} = await loadStateHarness();
	const selected = new Set(["RFP-101", "RFP-102"]);
	let assignments = updateJiraKanbanCardAgentAssignment({}, selected, "agent-1", true);

	assert.deepEqual(assignments, {
		"RFP-101": ["agent-1"],
		"RFP-102": ["agent-1"],
	});
	assert.deepEqual(getCommonJiraKanbanAgentIds(assignments, selected), ["agent-1"]);

	assignments = updateJiraKanbanCardAgentAssignment(assignments, new Set(["RFP-101"]), "agent-1", false);
	assert.deepEqual(getCommonJiraKanbanAgentIds(assignments, selected), []);
});

test("Kanban cards expose and render Jira issue agent lifecycle presentation", () => {
	assert.match(SOURCE, /agentActivities\?: readonly JiraIssueAgentActivity\[\];/);
	assert.match(SOURCE, /agentActivityMode\?: JiraIssueAgentActivityMode;/);
	assert.match(SOURCE, /agentDoneRuns\?: readonly JiraIssueCompletedAgentRun\[\];/);
	assert.match(SOURCE, /pullRequestNumber\?: number;/);
	assert.match(SOURCE, /pullRequestStatus\?: JiraIssuePullRequestStatus;/);
	assert.match(SOURCE, /agentActivities=\{card\.agentActivities\}/);
	assert.match(SOURCE, /agentActivityMode=\{card\.agentActivityMode\}/);
	assert.match(SOURCE, /agentDoneRuns=\{card\.agentDoneRuns\}/);
	assert.match(SOURCE, /pullRequestNumber=\{card\.pullRequestNumber\}/);
	assert.match(SOURCE, /pullRequestStatus=\{card\.pullRequestStatus\}/);
	assert.match(SOURCE, /agentDoneRuns: card\.agentDoneRuns\?\.map\(\(run\) => \(\{ \.\.\.run \}\)\)/);
});

test("Kanban can animate cards between columns with reduced-motion support", () => {
	assert.match(SOURCE, /animateCardMoves\?: boolean;/u);
	assert.match(SOURCE, /useReducedMotion\(\)/u);
	assert.match(SOURCE, /const shouldAnimateCardMoves = animateCardMoves && !shouldReduceMotion;/u);
	assert.match(SOURCE, /<LayoutGroup id=\{cardLayoutGroupId\}>/u);
	assert.match(SOURCE, /cardMoveAnimation\?: JiraKanbanCardMoveAnimation;/u);
	assert.match(SOURCE, /const JIRA_KANBAN_CARD_MOVE: Transition = \{ duration: 0\.6,/u);
	assert.match(SOURCE, /const JIRA_KANBAN_CARD_DEPART: Transition = \{ duration: 0\.4,/u);
	assert.match(SOURCE, /if \(phase === "arriving"\) return 0\.9;/u);
	assert.match(SOURCE, /if \(phase === "departing"\) return 0\.96;/u);
	assert.match(SOURCE, /\{ scale: getJiraKanbanCardScale\(cardMovePhase\) \}/u);
	assert.match(SOURCE, /initial=\{false\}/u);
	assert.match(SOURCE, /const shouldAnimateCardPosition = shouldAnimateCardMoves && cardMovePhase === undefined;/u);
	assert.match(SOURCE, /layout=\{shouldAnimateCardPosition \? "position" : false\}/u);
	assert.match(SOURCE, /layoutId=\{shouldAnimateCardPosition \? `jira-kanban-card-\$\{card\.code\}` : undefined\}/u);
	assert.doesNotMatch(SOURCE, /layoutId=\{shouldAnimateCardMoves \?/u);
	assert.match(SOURCE, /transition=\{cardMovePhase === "departing" \? JIRA_KANBAN_CARD_DEPART : JIRA_KANBAN_CARD_MOVE\}/u);
});

test("Kanban card interactions preserve card and column context", () => {
	assert.match(
		SOURCE,
		/onCardGenerativeActionSubmit\?: \([\s\S]*request: JiraIssueGenerativeActionRequest,[\s\S]*card: JiraKanbanCardData,[\s\S]*columnTitle: string,[\s\S]*\) => void \| Promise<void>;/,
	);
	assert.match(
		SOURCE,
		/onSubmit: \(request\) =>[\s\S]*onCardGenerativeActionSubmit\(request, card, column\.title\)/,
	);
	assert.match(
		SOURCE,
		/onCardAgentActivityViewChat\?: \([\s\S]*activity: JiraIssueAgentActivity,[\s\S]*card: JiraKanbanCardData,[\s\S]*columnTitle: string,[\s\S]*\) => void;/,
	);
	assert.match(
		SOURCE,
		/\? \(activity\) => onCardAgentActivityViewChat\(activity, card, column\.title\)/,
	);
	assert.match(
		SOURCE,
		/\? \(open\) => onCardAgentActivityOpenChange\(open, card, column\.title\)/,
	);
	assert.match(
		SOURCE,
		/onCardAgentActivityQuestionSubmit\?: \([\s\S]*activity: JiraIssueAgentActivity,[\s\S]*answers: QuestionCardAnswers,[\s\S]*card: JiraKanbanCardData,[\s\S]*columnTitle: string,[\s\S]*\) => void;/,
	);
	assert.match(
		SOURCE,
		/onAgentActivityQuestionSubmit=\{[\s\S]*\? \(activity, answers\) =>[\s\S]*onCardAgentActivityQuestionSubmit\(activity, answers, card, column\.title\)/,
	);
	assert.match(
		SOURCE,
		/onCardAgentDoneRunReview\?: \([\s\S]*run: JiraIssueCompletedAgentRun,[\s\S]*card: JiraKanbanCardData,[\s\S]*columnTitle: string,[\s\S]*\) => void;/,
	);
	assert.match(
		SOURCE,
		/onAgentDoneRunReview=\{[\s\S]*\? \(run\) => onCardAgentDoneRunReview\(run, card, column\.title\)/,
	);
});

test("Kanban derives visible column counts from rendered cards", () => {
	assert.match(SOURCE, /count=\{column\.cards\.length\}/);
	assert.doesNotMatch(SOURCE, /count=\{column\.count\}/);
});
