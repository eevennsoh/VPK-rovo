const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Jira Agents centers blank-card placeholders and preserves requested title groups", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const itemsSource = readProjectFile("components/projects/jira-agents/data/gallery-items.ts");

	assert.match(pageSource, /<Gallery[^>]*stagePosition="center"[^>]*title="Jira Agents"/u);
	assert.match(itemsSource, /title: "Jira For You",\s*titleLines: \["Jira", "For You"\]/u);
	assert.match(itemsSource, /title: "Kanban & List",\s*titleLines: \["Kanban", "& List"\]/u);
});
