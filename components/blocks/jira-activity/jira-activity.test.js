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
const SEGMENTS_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-segments.tsx"),
	"utf8",
);
const COMMENT_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-comment.tsx"),
	"utf8",
);
const CARD_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-card.tsx"),
	"utf8",
);
const CHANGED_FILES_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-changed-files.tsx"),
	"utf8",
);
const NODE_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-node.tsx"),
	"utf8",
);
const DEMO_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../website/demos/blocks/jira-activity-demo.tsx"),
	"utf8",
);
const DETAIL_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../app/data/details/blocks/jira-activity.ts"),
	"utf8",
);
const VARIANT_REGISTRY_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../website/registry/blocks-variants.ts"),
	"utf8",
);

test("sample feed covers all three entry kinds", () => {
	const kinds = new Set(JIRA_ACTIVITY_ENTRIES.map((entry) => entry.kind));
	assert.ok(kinds.has("event"));
	assert.ok(kinds.has("comment"));
	assert.ok(kinds.has("changed-files"));
});

test("changed-files activity renders agent outputs with the compact Artifact List variant", () => {
	const changedFiles = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.kind === "changed-files");
	assert.ok(changedFiles?.sessionItem, "expected an agent session summary");
	assert.equal(changedFiles.sessionItem.title, "Conduct performance benchmarking");
	assert.deepEqual(
		changedFiles.outputs.map((output) => output.title),
		["Audience Engagement Report", "Chat summary title"],
	);
	assert.match(
		CHANGED_FILES_SOURCE,
		/import \{ ArtifactList, type ArtifactListItem \} from "@\/components\/ui-custom\/artifact-list";/u,
	);
	assert.match(CHANGED_FILES_SOURCE, /items=\{entry\.outputs\}/u);
	assert.match(CHANGED_FILES_SOURCE, /variant="compact"/u);
	assert.match(CHANGED_FILES_SOURCE, /import \{ ElapsedTime, RelativeTime \} from "@\/components\/ui\/elapsed-time";/u);
	assert.match(CHANGED_FILES_SOURCE, /function JiraActivitySessionTime[\s\S]*item\.state === "complete" \? \([\s\S]*<RelativeTime[\s\S]*secondsAgo=\{item\.completedSecondsAgo\}[\s\S]*timestampMs=\{item\.completedAtMs\}[\s\S]*\) : \([\s\S]*<ElapsedTime startedAtMs=\{item\.startedAtMs \?\? seededStartedAtMs\}/u);
	assert.match(CHANGED_FILES_SOURCE, /entry\.sessionItem\.agent\.name/u);
	assert.doesNotMatch(CHANGED_FILES_SOURCE, /StatusSuccessIcon|\? "Done"/u);
	assert.doesNotMatch(CHANGED_FILES_SOURCE, /pullRequestNumber|Ready for review/u);
	assert.match(CHANGED_FILES_SOURCE, /statusPresentation \? \([\s\S]*\{statusPresentation\.label\}[\s\S]*<JiraActivitySessionTime[\s\S]*·[\s\S]*entry\.sessionItem\.agent\.name/u);
	assert.match(CHANGED_FILES_SOURCE, /className="flex shrink-0 items-center gap-1 text-text"/u);
	assert.doesNotMatch(CHANGED_FILES_SOURCE, /flex shrink-0 items-center gap-1 font-medium/u);
	assert.equal(changedFiles.sessionItem.completedSecondsAgo, 5 * 60);
	assert.match(CHANGED_FILES_SOURCE, /function JiraActivityViewAction[\s\S]*const handleView = \(\) => onView\?\.\(item\);/u);
	assert.match(CHANGED_FILES_SOURCE, /aria-label=\{`\$\{viewActionLabel\} \$\{item\.agent\.name\}`\}/u);
	assert.match(CHANGED_FILES_SOURCE, /\{viewActionLabel\}[\s\S]*viewActionLabel === "Open" \? <LinkExternalIcon label="" size="small" \/> : null/u);
	assert.doesNotMatch(CHANGED_FILES_SOURCE, /ButtonGroup|Open with \$\{item\.agent\.name\}/u);
	assert.match(CHANGED_FILES_SOURCE, /<JiraActivityViewAction[\s\S]*item=\{entry\.sessionItem\}[\s\S]*onView=\{onView\}[\s\S]*viewActionLabel=\{viewActionLabel\}/u);
	assert.match(CHANGED_FILES_SOURCE, /openLabel=\{outputOpenLabel\}/u);
	assert.match(CHANGED_FILES_SOURCE, /variant\?: "activity" \| "jira-issue";/u);
	assert.match(CHANGED_FILES_SOURCE, /isJiraIssue \? "rounded-xl" : "overflow-hidden rounded-lg border border-border"/u);
	assert.match(CHANGED_FILES_SOURCE, /entry\.outputs\.length > 0 \? "p-3" : "px-3 pb-3 pt-0"/u);
	assert.match(INDEX_SOURCE, /<JiraActivityChangedFiles entry=\{entry\} onView=\{onViewSession\} \/>/u);
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
	// The rich session comment is agent-authored; a human snapshot comment also
	// exists in the feed, so target the agent comment specifically.
	const comment = JIRA_ACTIVITY_ENTRIES.find(
		(entry) => entry.kind === "comment" && entry.actor.kind === "agent",
	);
	assert.ok(comment, "expected an agent comment entry");
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

test("status events use the neutral Project status icon", () => {
	assert.match(
		NODE_SOURCE,
		/import ProjectStatusIcon from "@atlaskit\/icon\/core\/project-status"/u,
	);
	assert.match(NODE_SOURCE, /status: ProjectStatusIcon/u);
	assert.match(NODE_SOURCE, /"in-progress": ProjectStatusIcon/u);
	assert.match(NODE_SOURCE, /className="text-icon-subtle"/u);
	assert.doesNotMatch(NODE_SOURCE, /ClockIcon|text-icon-warning/u);
});

test("Teamwork Graph events use the VPK-wrapped functional icon", () => {
	assert.match(
		NODE_SOURCE,
		/import TeamworkGraphIcon from "@atlaskit\/icon-lab\/core\/teamwork-graph";/u,
	);
	assert.match(NODE_SOURCE, /"teamwork-graph": TeamworkGraphIcon/u);
	assert.match(NODE_SOURCE, /<Icon[\s\S]*render=\{<IconComponent color="currentColor" label="" size="small" \/>\}/u);
	assert.doesNotMatch(NODE_SOURCE, /TeamworkGraphMark/u);
});

test("delegated events use the Person assignee icon", () => {
	assert.match(
		NODE_SOURCE,
		/import PersonAssigneeIcon from "@atlaskit\/icon-lab\/core\/person-assignee"/u,
	);
	assert.match(NODE_SOURCE, /delegated: PersonAssigneeIcon/u);
	assert.doesNotMatch(NODE_SOURCE, /ShortcutIcon/u);
});

test("the Medium priority event uses the Agent Sessions priority icon treatment", () => {
	const assigned = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.id === "assigned");
	assert.equal(assigned.kind, "event");
	assert.deepEqual(assigned.segments.at(-1), { type: "priority", text: "Medium" });
	assert.match(SEGMENTS_SOURCE, /PriorityMediumIcon/u);
	assert.match(SEGMENTS_SOURCE, /className="text-icon-warning"/u);
});

test("labels and workflow states render as semantic lozenges", () => {
	const labelled = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.id === "labelled");
	const movedTodo = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.id === "moved-todo");
	const movedProgress = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.id === "moved-progress");
	assert.deepEqual(
		labelled.segments.filter((segment) => segment.type === "lozenge"),
		[
			{ type: "lozenge", text: "Bug", variant: "danger" },
			{ type: "lozenge", text: "UI Polish", variant: "success" },
		],
	);
	assert.deepEqual(
		movedTodo.segments.filter((segment) => segment.type === "lozenge").map((segment) => segment.text),
		["Triage", "Todo"],
	);
	assert.deepEqual(
		movedProgress.segments.filter((segment) => segment.type === "lozenge").map((segment) => segment.text),
		["Todo", "In Progress"],
	);
	assert.deepEqual(
		movedTodo.segments.filter((segment) => segment.type === "transition-arrow"),
		[{ type: "transition-arrow" }],
	);
	assert.deepEqual(
		movedProgress.segments.filter((segment) => segment.type === "transition-arrow"),
		[{ type: "transition-arrow" }],
	);
	assert.match(SEGMENTS_SOURCE, /import ArrowRightIcon from "@atlaskit\/icon\/core\/arrow-right"/u);
	assert.match(SEGMENTS_SOURCE, /className="mx-1 align-middle text-icon-subtle"/u);
	assert.match(SEGMENTS_SOURCE, /<Lozenge className="align-middle"/u);
	assert.doesNotMatch(SEGMENTS_SOURCE, /LABEL_DOT_CLASS/u);
});

test("agent output cards summarize the change and expose a View action", () => {
	// The card can open its owning session, so it accepts an onView handler that
	// the timeline wires from onViewSession.
	assert.match(
		CHANGED_FILES_SOURCE,
		/import type \{ JiraAgentSessionItem \} from "@\/components\/blocks\/jira-agent-session"/u,
	);
	assert.match(CHANGED_FILES_SOURCE, /onView\?: \(item: JiraAgentSessionItem\) => void/u);
	assert.match(INDEX_SOURCE, /<JiraActivityChangedFiles entry=\{entry\} onView=\{onViewSession\} \/>/u);
	// A short generated-work summary renders as its own paragraph above the outputs.
	assert.match(
		CHANGED_FILES_SOURCE,
		/<p className=\{cn\("px-3 text-sm leading-5 text-text", isJiraIssue \? "pb-2" : "pb-3"\)\}>[\s\S]*\{entry\.description\}[\s\S]*<\/p>/u,
	);
	// The ellipsis "More actions" affordance is replaced by a persistent,
	// caller-labelled action. Only the external "Open" treatment gets the
	// external-link icon; in-product custom artifacts use "View".
	assert.match(CHANGED_FILES_SOURCE, /\{viewActionLabel\}/u);
	assert.match(
		CHANGED_FILES_SOURCE,
		/viewActionLabel === "Open" \? <LinkExternalIcon label="" size="small" \/> : null/u,
	);
});

test("Jira Activity exposes controlled entries and replaceable composer contracts", () => {
	assert.match(INDEX_SOURCE, /defaultEntries\?: readonly JiraActivityEntry\[\]/u);
	assert.match(INDEX_SOURCE, /onEntriesChange\?: \(entries: readonly JiraActivityEntry\[\]\) => void/u);
	assert.match(INDEX_SOURCE, /composer\?: ReactNode \| null/u);
	assert.match(INDEX_SOURCE, /renderCommentAction\?: \(entry:/u);
	assert.match(INDEX_SOURCE, /onViewSession\?: \(item: JiraAgentSessionItem\) => void/u);
	assert.match(INDEX_SOURCE, /onViewSession=\{onViewSession\}/u);
	assert.match(INDEX_SOURCE, /composer === undefined/u);
	assert.match(INDEX_SOURCE, /filter\?: JiraActivityFilter/u);
	assert.match(INDEX_SOURCE, /defaultFilter\?: JiraActivityFilter/u);
	assert.match(INDEX_SOURCE, /onFilterChange\?: \(next: JiraActivityFilter\) => void/u);
	assert.match(INDEX_SOURCE, /data-jira-activity-entry-id=\{entry\.id\}/u);
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

test("the header shows agent comments and generated-output cards", () => {
	const expectedAgentCards = JIRA_ACTIVITY_ENTRIES.filter(
		(entry) =>
			entry.actor.kind === "agent" &&
			(entry.kind === "comment" || (entry.kind === "changed-files" && entry.outputs !== undefined)),
	);
	assert.deepEqual(
		expectedAgentCards.map((entry) => entry.kind),
		["comment", "changed-files"],
	);
	assert.match(HEADER_SOURCE, /value="agents-only"/u);
	assert.match(HEADER_SOURCE, />\s*Show agents only\s*</u);
	assert.match(INDEX_SOURCE, /entry\.actor\.kind === "agent"/u);
	assert.match(
		INDEX_SOURCE,
		/entry\.kind === "comment" \|\|[\s\S]*entry\.kind === "changed-files" && entry\.outputs !== undefined/u,
	);
	assert.match(INDEX_SOURCE, /count=\{visibleEntries\.length\}/u);
});

test("the header pins a hover-reveal collapse control to the separator corner", () => {
	assert.match(HEADER_SOURCE, /collapsed: boolean/u);
	assert.match(HEADER_SOURCE, /onCollapsedChange: \(next: boolean\) => void/u);
	// The separator stays continuous while the fixed outline button overlays it.
	assert.match(HEADER_SOURCE, /absolute inset-x-0 top-1\/2 h-px/u);
	assert.match(HEADER_SOURCE, /absolute top-1\/2 right-0 -translate-y-1\/2 opacity-0/u);
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
	assert.match(INDEX_SOURCE, /count=\{visibleEntries\.length\}/u);
});

test("one-line activity events use 12px type without shrinking expanded agent cards", () => {
	assert.match(EVENT_SOURCE, /className="flex h-6 items-center text-xs leading-4 text-text-subtle"/u);
	assert.match(EVENT_SOURCE, /className="flex h-6 min-w-0 items-center gap-2 text-xs leading-4"/u);
	assert.match(COMMENT_SOURCE, /className="text-sm leading-5 text-text"/u);
});

test("event labels share the timeline node's 24px vertical alignment track", () => {
	assert.match(NODE_SOURCE, /className="flex h-6 shrink-0 items-center justify-center"/u);
	assert.match(EVENT_SOURCE, /<p className="flex h-6 items-center[^>]*>\s*<span>/u);
	assert.doesNotMatch(INDEX_SOURCE, /entry\.kind === "event" && "pt-0\.5"/u);
});

test("the linked event uses the Jira Queue pull-request row", () => {
	const linked = JIRA_ACTIVITY_ENTRIES.find((entry) => entry.id === "linked");
	assert.equal(linked.kind, "event");
	assert.deepEqual(linked.pullRequest, {
		number: 1847,
		title: "Fix threaded comment highlight bottom corners",
		status: "Open",
		additions: 148,
		deletions: 37,
	});
	assert.match(EVENT_SOURCE, />Pull request</u);
	assert.match(EVENT_SOURCE, /variant=\{status === "Merged" \? "discovery" : "success"\}/u);
	assert.match(EVENT_SOURCE, /font-mono font-normal text-text-success/u);
	assert.match(EVENT_SOURCE, /font-mono font-normal text-text-danger/u);
	assert.match(EVENT_SOURCE, /min-w-0 flex-1 truncate text-text/u);
});

test("Jira Activity owns the shared activity card used by agent comments", () => {
	assert.match(
		COMMENT_SOURCE,
		/import \{ JiraActivityCard \} from "\.\/jira-activity-card"/u,
	);
	assert.match(COMMENT_SOURCE, /<JiraActivityCard/u);
	assert.match(COMMENT_SOURCE, /<\/JiraActivityCard>/u);
	assert.match(COMMENT_SOURCE, /item=\{entry\.sessionItem\}/u);
	assert.match(COMMENT_SOURCE, /onView=\{onViewSession\}/u);
	assert.match(
		INDEX_SOURCE,
		/export \{ JiraActivityCard, type JiraActivityCardProps \} from "\.\/jira-activity-card"/u,
	);
	assert.match(CARD_SOURCE, /export interface JiraActivityCardProps/u);
	assert.match(CARD_SOURCE, /export function JiraActivityCard/u);
	assert.match(
		CARD_SOURCE,
		/import \{\s*JiraAgentSessionActivityHeader,[\s\S]*type JiraAgentSessionItem,[\s\S]*\} from "@\/components\/blocks\/jira-agent-session"/u,
	);
	assert.match(CARD_SOURCE, /<JiraAgentSessionActivityHeader/u);
	// Both human and agent comments render the shared prompt-input composer.
	assert.match(COMMENT_SOURCE, /variant="comment"/u);
	assert.doesNotMatch(COMMENT_SOURCE, /variant="reply"/u);
	assert.match(
		COMMENT_SOURCE,
		/entry\.sessionItem\s*\? "Ask, @mention, or \/ for actions"\s*:\s*"Leave a reply\.\.\."/u,
	);
	assert.match(COMMENT_SOURCE, /entry\.sessionItem\s*\? undefined\s*:\s*entry\.collapsible/u);
	assert.doesNotMatch(
		COMMENT_SOURCE,
		/w-full overflow-hidden rounded-lg border border-border bg-surface/u,
	);
});

test("documents the standalone activity card under Jira Activity", () => {
	assert.match(DETAIL_SOURCE, /title: "Activity card"/u);
	assert.match(DETAIL_SOURCE, /demoSlug: "jira-activity-demo-activity-card"/u);
	assert.match(DETAIL_SOURCE, /name: "JiraActivityCard"/u);
	assert.match(DEMO_SOURCE, /export function JiraActivityCardDemo/u);
	assert.match(DEMO_SOURCE, /<JiraActivityCard/u);
	assert.match(DEMO_SOURCE, /item=\{entry\.sessionItem\}/u);
	assert.match(DEMO_SOURCE, /placeholder="Ask, @mention, or \/ for actions"/u);
	assert.match(
		DEMO_SOURCE,
		/border-0 rounded-none bg-transparent px-4 py-3 shadow-none/u,
	);
	assert.match(
		VARIANT_REGISTRY_SOURCE,
		/"jira-activity-demo-activity-card"[\s\S]*JiraActivityCardDemo/u,
	);
});

test("controlled timelines can route inline agent replies to their owning session", () => {
	assert.match(INDEX_SOURCE, /onSubmitReply\?: \(entry: JiraActivityCommentEntry, body: string\) => void/u);
	assert.match(INDEX_SOURCE, /onSubmitReply\(entry, body\);/u);
	assert.match(INDEX_SOURCE, /onSubmitReply=\{\(body\) => handleAddReply\(entry, body\)\}/u);
});

test("human comments expose the flush prompt composer instead of a Reply button", () => {
	assert.match(COMMENT_SOURCE, /import \{ Avatar, AvatarFallback, AvatarImage \}/u);
	assert.match(COMMENT_SOURCE, /entry\.actor\.kind === "person"/u);
	assert.match(
		COMMENT_SOURCE,
		/headerLayout=\{entry\.actor\.kind === "person" \? "stacked" : "inline"\}/u,
	);
	assert.match(COMMENT_SOURCE, /<Avatar aria-hidden size="default">/u);
	assert.match(COMMENT_SOURCE, /<AvatarImage alt="" src=\{entry\.actor\.avatarSrc\}/u);
	// The human card no longer renders a Reply button or wires onReplyRequest; the
	// prompt composer is always mounted as a flush footer instead.
	assert.doesNotMatch(COMMENT_SOURCE, /onReplyRequest/u);
	assert.doesNotMatch(COMMENT_SOURCE, />\s*Reply\s*<\/Button>/u);
	assert.doesNotMatch(COMMENT_SOURCE, /from "@\/components\/ui\/button"/u);
	// Flush composer: no floating border/radius/shadow, aligned to the card's padding.
	assert.match(COMMENT_SOURCE, /border-0 rounded-none bg-transparent px-4 py-3 shadow-none/u);
});

test("the sample feed includes a human activity snapshot comment", () => {
	const humanComments = JIRA_ACTIVITY_ENTRIES.filter(
		(entry) => entry.kind === "comment" && entry.actor.kind === "person",
	);
	assert.ok(
		humanComments.length > 0,
		"expected at least one human-authored comment card",
	);
	const snapshot = humanComments[0];
	// A human snapshot is a plain comment (no agent session summary) so it renders
	// the stacked avatar/name/timestamp header rather than the agent-session card.
	assert.equal(snapshot.sessionItem, undefined);
	assert.ok(snapshot.actor.avatarSrc, "human snapshot should carry a photo avatar");
	assert.ok(snapshot.body.length > 0, "human snapshot should have a body");
	// The prompt composer is exposed for human comments (allowReply defaults to true).
	assert.notEqual(snapshot.allowReply, false);
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
