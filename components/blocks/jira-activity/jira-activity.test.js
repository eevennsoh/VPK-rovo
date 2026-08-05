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
const COMMENT_ACTIONS_SOURCE = fs.readFileSync(
	path.join(__dirname, "jira-activity-comment-actions.tsx"),
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
	assert.match(CHANGED_FILES_SOURCE, /import \{[\s\S]*AgentListActivityHeader,[\s\S]*type AgentListItem,[\s\S]*\} from "@\/components\/blocks\/agent-list";/u);
	assert.match(CHANGED_FILES_SOURCE, /className="grid gap-4 p-3"[\s\S]*<AgentListActivityHeader/u);
	assert.doesNotMatch(CHANGED_FILES_SOURCE, /flex h-14 min-w-0 items-center/u);
	assert.doesNotMatch(CHANGED_FILES_SOURCE, /StatusSuccessIcon|\? "Done"/u);
	assert.doesNotMatch(CHANGED_FILES_SOURCE, /pullRequestNumber|Ready for review/u);
	assert.match(CHANGED_FILES_SOURCE, /metadataPrefix=\{statusPresentation \? \([\s\S]*\{statusPresentation\.label\}/u);
	assert.match(CHANGED_FILES_SOURCE, /timeFallback=\{entry\.timestamp\}/u);
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
	assert.match(CHANGED_FILES_SOURCE, /type AgentListItem,/u);
	assert.match(CHANGED_FILES_SOURCE, /onView\?: \(item: AgentListItem\) => void/u);
	assert.match(INDEX_SOURCE, /<JiraActivityChangedFiles entry=\{entry\} onView=\{onViewSession\} \/>/u);
	// A short generated-work summary renders as its own paragraph above the outputs.
	assert.match(
		CHANGED_FILES_SOURCE,
		/<p className="text-sm leading-5 text-text">\{entry\.description\}<\/p>/u,
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
	assert.match(INDEX_SOURCE, /onViewSession\?: \(item: AgentListItem\) => void/u);
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

test("the header omits the separator and collapse control", () => {
	assert.doesNotMatch(HEADER_SOURCE, /relative h-6 min-w-2 flex-1/u);
	assert.doesNotMatch(HEADER_SOURCE, /aria-label=\{collapsed \? "Expand activity" : "Collapse activity"\}/u);
	assert.doesNotMatch(HEADER_SOURCE, /onCollapsedChange/u);
});

test("Jira Activity supports externally controlled collapse state", () => {
	assert.match(INDEX_SOURCE, /collapsed\?: boolean/u);
	assert.doesNotMatch(INDEX_SOURCE, /defaultCollapsed/u);
	assert.doesNotMatch(INDEX_SOURCE, /onCollapsedChange/u);
	assert.match(INDEX_SOURCE, /const collapsed = controlledCollapsed \?\? false;/u);
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
		/import \{\s*AgentListActivityHeader,[\s\S]*type AgentListItem,[\s\S]*\} from "@\/components\/blocks\/agent-list"/u,
	);
	assert.match(CARD_SOURCE, /<AgentListActivityHeader/u);
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

test("human comments keep the stacked identity header and the flush composer geometry", () => {
	assert.match(COMMENT_SOURCE, /import \{ Avatar, AvatarFallback, AvatarImage \}/u);
	assert.match(COMMENT_SOURCE, /entry\.actor\.kind === "person"/u);
	assert.match(
		COMMENT_SOURCE,
		/headerLayout=\{entry\.actor\.kind === "person" \? "stacked" : "inline"\}/u,
	);
	assert.match(COMMENT_SOURCE, /<Avatar aria-hidden size="default">/u);
	assert.match(COMMENT_SOURCE, /<AvatarImage alt="" src=\{entry\.actor\.avatarSrc\}/u);
	// Reply is a disclosure the comment owns via `commentActions`, not a callback
	// the consuming surface has to wire up.
	assert.doesNotMatch(COMMENT_SOURCE, /onReplyRequest/u);
	// Flush composer: no floating border/radius/shadow, aligned to the card's padding.
	assert.match(COMMENT_SOURCE, /border-0 rounded-none bg-transparent px-4 py-3 shadow-none/u);
});

test("the activity card hosts the action row in the body grid, not the bordered footer", () => {
	// `action` is a header slot, so the reply/reaction row gets its own slot that
	// lands last in the body grid and inherits the card's gap for both geometries.
	assert.match(CARD_SOURCE, /footerActions\?: ReactNode;/u);
	assert.match(CARD_SOURCE, /^\tfooterActions,$/mu);
	assert.match(CARD_SOURCE, /\{detailsContent\}[\s\S]*\{footerActions\}[\s\S]*\{showFooter \? \(/u);
	// Nothing renders it inside the `border-t` footer branch.
	assert.doesNotMatch(CARD_SOURCE, /\{showFooter \? \([\s\S]*\{footerActions\}/u);
	assert.match(CARD_SOURCE, /hasExpandedLayout \? "gap-4 p-3" : "gap-2 p-3"/u);
});

test("the comment action row pairs Reply with the shared emoji reaction bar", () => {
	assert.match(
		COMMENT_ACTIONS_SOURCE,
		/import ReplyLeftIcon from "@atlaskit\/icon-lab\/core\/reply-left";/u,
	);
	assert.match(
		COMMENT_ACTIONS_SOURCE,
		/import \{ EmojiReactionBar \} from "@\/components\/blocks\/emoji-picker\/components\/emoji-reaction-bar";/u,
	);
	assert.match(COMMENT_ACTIONS_SOURCE, /<EmojiReactionBar/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-label="Comment actions"/u);
	// Reply is an icon button: label on the Button, empty label on the icon.
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-label="Reply"/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-expanded=\{replyExpanded\}/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /aria-controls=\{replyComposerId\}/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /<ReplyLeftIcon color="currentColor" label="" \/>/u);
	// Always visible — never a hover-reveal.
	assert.doesNotMatch(COMMENT_ACTIONS_SOURCE, /opacity-0|group-hover/u);
	// Omitting `onReply` is how `allowReply: false` drops the button.
	assert.match(COMMENT_ACTIONS_SOURCE, /onReply\?: \(\) => void;/u);
	assert.match(COMMENT_ACTIONS_SOURCE, /onReply \? \(/u);
	assert.match(COMMENT_SOURCE, /<JiraActivityCommentActions/u);
	assert.match(COMMENT_SOURCE, /footerActions=\{/u);
});

test("Reply discloses the composer, defaulting to reply-and-reactions", () => {
	assert.match(
		INDEX_SOURCE,
		/commentActions\?: "none" \| "reactions" \| "reply-and-reactions";/u,
	);
	assert.match(INDEX_SOURCE, /commentActions = "reply-and-reactions",/u);
	assert.match(INDEX_SOURCE, /commentActions=\{commentActions\}/u);
	// The comment stands alone with the same default.
	assert.match(COMMENT_SOURCE, /commentActions = "reply-and-reactions",/u);
	assert.match(COMMENT_SOURCE, /const allowReply = entry\.allowReply \?\? true;/u);
	assert.match(
		COMMENT_SOURCE,
		/const collapsible = commentActions === "reply-and-reactions";/u,
	);
	assert.match(
		COMMENT_SOURCE,
		/const composerVisible = allowReply && \(!collapsible \|\| replyOpen\);/u,
	);
	// The composer only mounts when visible, and aria-controls never dangles.
	assert.match(COMMENT_SOURCE, /composerVisible \? \(\s*<div id=\{composerId\}>/u);
	assert.match(COMMENT_SOURCE, /replyComposerId=\{composerVisible \? composerId : undefined\}/u);
	assert.match(COMMENT_SOURCE, /const composerId = useId\(\);/u);
	// "none" drops the row entirely; Reply is withheld when the entry opted out.
	assert.match(COMMENT_SOURCE, /commentActions === "none" \? undefined : \(/u);
	assert.match(COMMENT_SOURCE, /onReply=\{collapsible && allowReply \? toggleReply : undefined\}/u);
});

test("toggling a reaction routes through the reducer with the current user's id", () => {
	assert.match(
		INDEX_SOURCE,
		/onToggleReaction\?: \(entry: JiraActivityCommentEntry, emoji: string\) => void/u,
	);
	assert.match(
		INDEX_SOURCE,
		/function handleToggleReaction\([\s\S]*if \(onToggleReaction\) \{[\s\S]*onToggleReaction\(entry, emoji\);[\s\S]*return;[\s\S]*applyAction\(\{[\s\S]*type: "toggle-reaction",[\s\S]*entryId: entry\.id,[\s\S]*emoji,[\s\S]*actorId: currentUser\.id,/u,
	);
	assert.match(
		INDEX_SOURCE,
		/onToggleReaction=\{\(emoji\) => handleToggleReaction\(entry, emoji\)\}/u,
	);
	assert.match(INDEX_SOURCE, /\bJiraActivityReaction,/u);
	// Stored actor ids are normalized into the picker block's count view model.
	assert.match(
		COMMENT_SOURCE,
		/\(entry\.reactions \?\? \[\]\)\.map\(\(reaction\) => \(\{[\s\S]*emoji: reaction\.emoji,[\s\S]*count: reaction\.actorIds\.length,[\s\S]*reacted: reaction\.actorIds\.includes\(currentUser\.id\),/u,
	);
});

test("the sample feed seeds reactions on a human comment", () => {
	const seeded = JIRA_ACTIVITY_ENTRIES.filter(
		(entry) => entry.kind === "comment" && (entry.reactions?.length ?? 0) > 0,
	);
	assert.ok(seeded.length > 0, "expected at least one comment with seeded reactions");
	const [comment] = seeded;
	assert.equal(comment.actor.kind, "person");
	assert.ok(comment.reactions.length >= 2, "expected more than one reaction glyph");
	// One reaction the viewer has pressed (count > 1) and one they have not, so
	// the demo shows both pill states.
	const pressed = comment.reactions.filter((reaction) =>
		reaction.actorIds.includes(JIRA_ACTIVITY_CURRENT_USER.id),
	);
	const unpressed = comment.reactions.filter(
		(reaction) => !reaction.actorIds.includes(JIRA_ACTIVITY_CURRENT_USER.id),
	);
	assert.ok(pressed.length > 0, "expected a reaction the current user has pressed");
	assert.ok(unpressed.length > 0, "expected a reaction the current user has not pressed");
	assert.ok(pressed[0].actorIds.length > 1, "pressed reaction should aggregate actors");
	for (const reaction of comment.reactions) {
		assert.equal(new Set(reaction.actorIds).size, reaction.actorIds.length);
	}
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
	assert.match(COMPOSER_SOURCE, /<PromptInputSubmit/u);
	assert.match(COMPOSER_SOURCE, /aria-label="Send"/u);
	assert.match(COMPOSER_SOURCE, /disabled=\{!canSubmit\}/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /RovoComposerActionButton|realtimeVoice/u);
});

test("disclosing Reply focuses the composer through the editor's own autofocus", () => {
	// The comment variant is a contentEditable tiptap editor that initialises
	// asynchronously (prompt-input.tsx maps `autoFocus` onto tiptap's
	// `autofocus: "end"`). Focusing a ref from a parent effect races that
	// initialisation and silently no-ops, so the disclosure must not try.
	assert.match(COMPOSER_SOURCE, /autoFocus\?: boolean;/u);
	assert.match(COMPOSER_SOURCE, /autoFocus = false,/u);
	assert.match(COMPOSER_SOURCE, /<PromptInputTextarea[\s\S]*autoFocus=\{autoFocus\}/u);
	// Only mounts on a Reply click in collapsible mode, so mounting is the moment
	// to take focus; in the always-mounted modes it must never steal focus.
	assert.match(COMMENT_SOURCE, /autoFocus=\{collapsible\}/u);
	assert.doesNotMatch(COMMENT_SOURCE, /textareaRef/u);
	// Collapsing still returns focus to the Reply button, which is a plain button.
	assert.match(
		COMMENT_SOURCE,
		/if \(!replyToggledRef\.current \|\| replyOpen\) return;\s*replyButtonRef\.current\?\.focus\(\);/u,
	);
});
