const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const DETAILS_SOURCE = readFileSync(
	join(process.cwd(), "app/data/details/blocks/jira-list.ts"),
	"utf8",
);
const REGISTRY_SOURCE = readFileSync(
	join(process.cwd(), "components/website/registry/blocks.ts"),
	"utf8",
);
const COMPONENTS_SOURCE = readFileSync(
	join(process.cwd(), "app/data/components.ts"),
	"utf8",
);
const MANIFEST_SOURCE = readFileSync(
	join(process.cwd(), "app/data/component-manifest.ts"),
	"utf8",
);

test("JiraList exposes the expected table headers and sticky footer content", () => {
	assert.match(SOURCE, />Work<\/TableHead>/u);
	assert.match(SOURCE, />Status<\/TableHead>/u);
	assert.match(SOURCE, />Assignee<\/TableHead>/u);
	assert.match(SOURCE, />Agent sessions<\/TableHead>/u);
	assert.match(SOURCE, />Goals<\/TableHead>/u);
	assert.match(SOURCE, />Priority<\/TableHead>/u);
	assert.match(SOURCE, />Labels<\/TableHead>/u);
	assert.match(SOURCE, />Due date<\/TableHead>/u);
	assert.match(SOURCE, /Contributors/u);
	assert.match(SOURCE, /Select all work items/u);
	assert.match(SOURCE, /\{visibleCount\} of/u);
});

test("JiraList uses shared Jira priority and issue-type icon maps", () => {
	assert.match(SOURCE, /export type JiraListPriority = JiraIssuePriority;/u);
	assert.match(SOURCE, /const PRIORITY_ICONS = \{\s*major: PriorityMajorIcon,/u);
	assert.match(SOURCE, /const ISSUE_TYPE_ICONS = \{\s*epic: EpicIcon,/u);
	assert.match(SOURCE, /subtask: SubtasksIcon,/u);
	assert.match(SOURCE, /bug: BugIcon,/u);
});

test("JiraList sample page keeps expand and selection state local to the demo", () => {
	assert.match(PAGE_SOURCE, /const \[expandedIssueKeys, setExpandedIssueKeys\]/u);
	assert.match(PAGE_SOURCE, /const \[selectedIssueKeys, setSelectedIssueKeys\]/u);
	assert.match(PAGE_SOURCE, /onToggleExpand=\{handleToggleExpand\}/u);
	assert.match(PAGE_SOURCE, /selectedIssueKeys=\{selectedIssueKeys\}/u);
});

test("JiraList is registered in block docs and manifests", () => {
	assert.match(DETAILS_SOURCE, /export const JIRA_LIST_DETAIL/u);
	assert.match(REGISTRY_SOURCE, /"jira-list"[\s\S]*jira-list-demo/u);
	assert.match(COMPONENTS_SOURCE, /blockComponent\("jira-list", "Jira List"\)/u);
	assert.match(MANIFEST_SOURCE, /blockComponent\("jira-list", "Jira List"\)/u);
});
