const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");

test("Jira Toolbar uses the video action order and keeps Assign agents direct", () => {
	const selectAllIndex = SOURCE.indexOf("Select all");
	const assignIndex = SOURCE.indexOf("Assign agents");
	const editIndex = SOURCE.indexOf("Edit fields");
	const statusIndex = SOURCE.indexOf("Change status");

	assert.ok(selectAllIndex < assignIndex);
	assert.ok(assignIndex < editIndex);
	assert.ok(editIndex < statusIndex);
	assert.doesNotMatch(SOURCE, /More actions|EllipsisIcon/u);
});

test("Jira Toolbar only renders Merge for multi-selection", () => {
	assert.match(SOURCE, /selectedCount > 1 \? \([\s\S]*?Merge[\s\S]*?\) : null/u);
});

test("Jira Toolbar owns functional status, agent assignment, and clear callbacks", () => {
	assert.match(SOURCE, /onAgentAssignmentChange\(agentId, !selectedAgentIdSet\.has\(agentId\)\)/u);
	assert.match(SOURCE, /onSelect=\{\(\) => onStatusChange\(status\)\}/u);
	assert.match(SOURCE, /aria-label="Clear selection"[\s\S]*onClick=\{onClearSelection\}/u);
	assert.match(SOURCE, /event\.key === "Escape"[\s\S]*onClearSelection\(\)/u);
	assert.doesNotMatch(SOURCE, /addEventListener\("keydown", handleKeyDown, true\)/u);
});

test("Jira Toolbar uses token motion with a reduced-motion path", () => {
	assert.match(SOURCE, /duration: 0\.25,[\s\S]*ease: \[0, 0\.4, 0, 1\]/u);
	assert.match(SOURCE, /duration: 0\.2,[\s\S]*ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.match(SOURCE, /useReducedMotion\(\)/u);
	assert.match(SOURCE, /style=\{\{ willChange: "transform, opacity" \}\}/u);
});

test("Jira Toolbar keeps only the toolbar inverse while popups inherit the app theme", () => {
	assert.match(SOURCE, /bg-bg-neutral-bold shadow-xl/u);
	assert.match(SOURCE, /data-color-mode="light"/u);
	assert.doesNotMatch(SOURCE, /POPUP_THEME_PROPS|"data-color-mode": "dark"/u);
	assert.match(SOURCE, /max-w-\[calc\(100vw-2rem\)\][\s\S]*overflow-x-auto/u);
});
