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
const HEADER_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-header.tsx"),
	"utf8",
);
const EVENT_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-event.tsx"),
	"utf8",
);
const COMMENT_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-comment.tsx"),
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

test("the header shows an activity count and a text-link sort control", () => {
	// Count with singular/plural wording.
	assert.match(HEADER_SOURCE, /\{count\}\s*\{count === 1 \? "Activity" : "Activities"\}/u);
	// Sort surfaced as newest/oldest wording driving the underlying order.
	assert.match(HEADER_SOURCE, /ascending: "Show oldest first"/u);
	assert.match(HEADER_SOURCE, /descending: "Show latest first"/u);
	// Sort trigger is a borderless text link, not a bordered pill.
	assert.match(HEADER_SOURCE, /hover:underline/u);
	assert.match(HEADER_SOURCE, /text-text-subtlest \[&_svg\]:text-icon-subtlest/u);
	// Its portal clears the work-item dialog's z-index.
	assert.match(HEADER_SOURCE, /positionerClassName="z-\[502\]"/u);
});

test("the header pins a hover-reveal collapse control to the separator corner", () => {
	assert.match(HEADER_SOURCE, /collapsed: boolean/u);
	assert.match(HEADER_SOURCE, /onCollapsedChange: \(next: boolean\) => void/u);
	// The separator stays continuous while the fixed outline button overlays it.
	assert.match(HEADER_SOURCE, /absolute inset-x-0 top-1\/2 h-px/u);
	assert.match(HEADER_SOURCE, /absolute top-1\/2 right-1\.5 -translate-y-1\/2 opacity-0/u);
	assert.match(HEADER_SOURCE, /variant="outline"/u);
	assert.match(HEADER_SOURCE, /className="relative z-10 bg-surface hover:bg-surface active:bg-surface/u);
	assert.match(HEADER_SOURCE, /aria-expanded:hover:bg-surface aria-expanded:active:bg-surface/u);
	assert.match(HEADER_SOURCE, /before:-inset-x-1\.5 before:bg-surface/u);
	assert.match(HEADER_SOURCE, /collapsed\s*\? "visible pointer-events-auto opacity-100"/u);
	assert.match(HEADER_SOURCE, /group-hover\/jira-activity:visible/u);
	assert.match(HEADER_SOURCE, /collapsed && "rotate-180"/u);
	assert.doesNotMatch(HEADER_SOURCE, /-rotate-90/u);
	assert.doesNotMatch(HEADER_SOURCE, /requestAnimationFrame|pointermove/u);
});

test("Jira Activity wires collapse state and hides the body when collapsed", () => {
	assert.match(INDEX_SOURCE, /collapsed\?: boolean/u);
	assert.match(INDEX_SOURCE, /defaultCollapsed\?: boolean/u);
	assert.match(INDEX_SOURCE, /onCollapsedChange\?: \(next: boolean\) => void/u);
	assert.match(INDEX_SOURCE, /group\/jira-activity/u);
	// Timeline and composer are gated behind the collapsed flag.
	assert.match(INDEX_SOURCE, /\{collapsed \? null : \(\s*<ol/u);
	assert.match(INDEX_SOURCE, /count=\{entries\.length\}/u);
});

test("one-line activity events use 12px type without shrinking expanded agent cards", () => {
	assert.match(EVENT_SOURCE, /className="text-xs leading-4 text-text-subtle"/u);
	assert.match(COMMENT_SOURCE, /className="text-sm leading-5 text-text"/u);
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
