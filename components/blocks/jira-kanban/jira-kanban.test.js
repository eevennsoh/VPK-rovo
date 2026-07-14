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
	assert.match(JIRA_ISSUE_SOURCE, /"relative border outline-none focus-visible:border-ring"/);
	assert.doesNotMatch(JIRA_ISSUE_SOURCE, /border: "none"/);
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
	const unassignedBranch = JIRA_ISSUE_SOURCE.match(/assigneeUnassignedKind \? \(([\s\S]*?)\) : \(/)?.[1] ?? "";

	assert.match(JIRA_ISSUE_SOURCE, /AvatarUnassigned,/);
	assert.match(JIRA_ISSUE_SOURCE, /assigneeUnassignedKind\?: AvatarUnassignedKind;/);
	assert.match(SOURCE, /assigneeUnassignedKind=\{card\.avatarUnassignedKind\}/);
	assert.match(unassignedBranch, /<AvatarUnassigned/);
	assert.match(unassignedBranch, /kind=\{assigneeUnassignedKind\}/);
	assert.match(unassignedBranch, /size="sm"/);
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
