const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");

test("Jira issue focus border stays inside the card and uses the focused border token", () => {
	assert.match(SOURCE, /"relative border outline-none focus-visible:border-ring"/);
	assert.doesNotMatch(SOURCE, /border: "none"/);
});

test("Jira issue exposes selected and dragging states on the root button", () => {
	assert.match(SOURCE, /aria-pressed=\{ariaPressed \?\? selected\}/);
	assert.match(SOURCE, /data-selected=\{selected \|\| undefined\}/);
	assert.match(SOURCE, /data-dragging=\{dragging \|\| undefined\}/);
	assert.match(SOURCE, /cursor: dragging \? "grabbing" : draggable \? "grab" : "default"/);
});

test("Jira issue renders explicit unassigned avatars with the shared placeholder", () => {
	const unassignedBranch = SOURCE.match(/assigneeUnassignedKind \? \(([\s\S]*?)\) : \(/)?.[1] ?? "";

	assert.match(SOURCE, /AvatarUnassigned,/);
	assert.match(SOURCE, /assigneeUnassignedKind\?: AvatarUnassignedKind;/);
	assert.match(unassignedBranch, /<AvatarUnassigned/);
	assert.match(unassignedBranch, /kind=\{assigneeUnassignedKind\}/);
	assert.match(unassignedBranch, /size="sm"/);
});
