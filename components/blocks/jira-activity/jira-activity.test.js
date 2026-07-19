const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
	JIRA_ACTIVITY_ENTRIES,
	JIRA_ACTIVITY_CURRENT_USER,
} = require("./data.ts");

const INDEX_SOURCE = fs.readFileSync(path.join(__dirname, "index.tsx"), "utf8");
const COMPOSER_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-composer.tsx"),
	"utf8",
);

test("sample feed covers all three entry kinds", () => {
	const kinds = new Set(JIRA_ACTIVITY_ENTRIES.map((entry) => entry.kind));
	assert.ok(kinds.has("event"));
	assert.ok(kinds.has("comment"));
	assert.ok(kinds.has("changed-files"));
});

test("sample feed documents work by people, AI agents, and apps", () => {
	const actorKinds = new Set(
		JIRA_ACTIVITY_ENTRIES.map((entry) => entry.actor.kind),
	);
	assert.ok(actorKinds.has("person"));
	assert.ok(actorKinds.has("agent"));
	assert.ok(actorKinds.has("app"));
});

test("the current user is a person with an avatar (authors comments/replies)", () => {
	assert.equal(JIRA_ACTIVITY_CURRENT_USER.kind, "person");
	assert.ok(JIRA_ACTIVITY_CURRENT_USER.avatarSrc);
});

test("the comment entry has a rich body and a collapsible section", () => {
	const comment = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.kind === "comment");
	assert.ok(comment, "expected a comment entry");
	assert.ok(comment.collapsible, "comment should have a collapsible section");
	const bodyTypes = new Set(comment.body.map((segment) => segment.type));
	assert.ok(bodyTypes.has("code"), "body should include an inline code chip");
	assert.ok(bodyTypes.has("link"), "body should include a file/link chip");
});

test("agent/app-driven events carry a neutral event icon", () => {
	const labelled = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.id === "labelled");
	assert.equal(labelled.kind, "event");
	assert.equal(labelled.icon, "label");
});

test("Jira Activity exposes controlled entries and replaceable composer contracts", () => {
	assert.match(INDEX_SOURCE, /defaultEntries\?: readonly JiraActivityEntry\[\]/u);
	assert.match(INDEX_SOURCE, /onEntriesChange\?: \(entries: readonly JiraActivityEntry\[\]\) => void/u);
	assert.match(INDEX_SOURCE, /composer\?: ReactNode \| null/u);
	assert.match(INDEX_SOURCE, /renderCommentAction\?: \(entry:/u);
	assert.match(INDEX_SOURCE, /composer === undefined/u);
});

test("the exported comment composer uses the shared floating Rovo prompt", () => {
	assert.match(INDEX_SOURCE, /export \{ JiraActivityComposer, type JiraActivityComposerProps \}/u);
	assert.match(COMPOSER_SOURCE, /value\?: string/u);
	assert.match(COMPOSER_SOURCE, /onValueChange\?: \(value: string\) => void/u);
	assert.match(COMPOSER_SOURCE, /textareaRef\?: Ref<HTMLTextAreaElement>/u);
	assert.match(COMPOSER_SOURCE, /<FloatingComposer/u);
	assert.match(COMPOSER_SOURCE, /<PromptInputButton aria-label="Add" size="icon-sm" variant="ghost">/u);
	assert.match(COMPOSER_SOURCE, /<PromptInputTextarea/u);
	assert.match(COMPOSER_SOURCE, /<RovoComposerActionButton/u);
});
