const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const JIRA_ISSUE_SOURCE = readFileSync(join(__dirname, "..", "jira-issue", "index.tsx"), "utf8");
const COLUMN_DRAG_SOURCE = SOURCE.slice(
	SOURCE.indexOf("const handleColumnDragOver"),
	SOURCE.indexOf("<BoardColumn", SOURCE.indexOf("const handleColumnDragOver")),
);

test("Kanban demo preserves the rounded docs frame and leaves scrolling to the board", () => {
	assert.match(PAGE_SOURCE, /rounded-lg bg-surface p-4 md:p-5/u);
	assert.doesNotMatch(PAGE_SOURCE, /overflow-x-auto/u);
	assert.match(SOURCE, /overflowX: "auto"/u);
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

test("Kanban cards expose and render Jira issue agent lifecycle presentation", () => {
	assert.match(SOURCE, /agentActivities\?: readonly JiraIssueAgentActivity\[\];/);
	assert.match(SOURCE, /agentActivityMode\?: JiraIssueAgentActivityMode;/);
	assert.match(SOURCE, /agentDoneCount\?: number;/);
	assert.match(SOURCE, /agentActivities=\{card\.agentActivities\}/);
	assert.match(SOURCE, /agentActivityMode=\{card\.agentActivityMode\}/);
	assert.match(SOURCE, /agentDoneCount=\{card\.agentDoneCount\}/);
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
});

test("Kanban derives visible column counts from rendered cards", () => {
	assert.match(SOURCE, /count=\{column\.cards\.length\}/);
	assert.doesNotMatch(SOURCE, /count=\{column\.count\}/);
});
