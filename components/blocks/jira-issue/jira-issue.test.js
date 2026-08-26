const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const AGENT_ACTIVITY_SOURCE = readFileSync(join(__dirname, "agent-activity.tsx"), "utf8");
const AGENT_STATES_SOURCE = readFileSync(join(__dirname, "../agent-states/index.tsx"), "utf8");
const COMPLETED_RUNS_SOURCE = readFileSync(join(__dirname, "completed-agent-runs.tsx"), "utf8");
const CHANGED_FILES_SOURCE = readFileSync(join(__dirname, "../jira-activity/jira-activity-changed-files.tsx"), "utf8");
const COUNT_BADGE_SOURCE = readFileSync(join(__dirname, "count-badge.tsx"), "utf8");
const GENERATIVE_SOURCE = readFileSync(join(__dirname, "generative-action-menu.tsx"), "utf8");
const MORE_MENU_SOURCE = readFileSync(join(__dirname, "more-menu.tsx"), "utf8");
const UNCAPTURED_WORK_SOURCE = readFileSync(join(__dirname, "uncaptured-work.tsx"), "utf8");
const ROVO_SPARKLE_SOURCE = readFileSync(join(__dirname, "../../ui-custom/rovo-sparkle/rovo-sparkle.tsx"), "utf8");
const ROVO_SPARKLE_BUTTON_SOURCE = readFileSync(join(__dirname, "../../ui-custom/rovo-sparkle/button.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const DEMO_SOURCE = readFileSync(join(__dirname, "../../website/demos/blocks/jira-issue-demo.tsx"), "utf8");
const DETAILS_SOURCE = readFileSync(join(__dirname, "../../../app/data/details/blocks/jira-issue.ts"), "utf8");
const VARIANT_REGISTRY_SOURCE = readFileSync(join(__dirname, "../../website/registry/blocks-variants.ts"), "utf8");
const RICH_TEXT_EDITOR_CSS_SOURCE = readFileSync(join(__dirname, "../../ui-custom/rich-text-editor/rich-text-editor.css"), "utf8");
const ROOT_CLASS_BLOCK = SOURCE.slice(
	SOURCE.indexOf("const rootClassName = cn("),
	SOURCE.indexOf("function handleSubtasksToggle"),
);
const SUBTASKS_BLOCK = SOURCE.slice(
	SOURCE.indexOf("function JiraIssueSubtasks"),
	SOURCE.indexOf("export function JiraIssue"),
);
const SUMMARY_BLOCK = SOURCE.slice(
	SOURCE.indexOf("function JiraIssueSummary"),
	SOURCE.indexOf("function JiraIssueSubtaskCard"),
);
const RICH_ISSUE_CONTENT_BLOCK = SOURCE.slice(
	SOURCE.indexOf("const richIssueContent ="),
	SOURCE.indexOf("const generativeActionMenu ="),
);

test("Jira issue focus border stays inside the card and uses the focused border token", () => {
	assert.match(SOURCE, /"group\/jira-issue relative w-full min-w-0 border outline-none focus-visible:border-ring"/);
	assert.doesNotMatch(SOURCE, /border: "none"/);
});

test("Jira issue default width can be overridden by a kanban-column demo width class", () => {
	assert.doesNotMatch(SOURCE, /width: "100%"/);
	assert.match(SOURCE, /className,\n\t\)/);
});

test("Jira issue exposes selected and dragging states on the root button", () => {
	assert.match(SOURCE, /active\?: boolean;/);
	assert.match(SOURCE, /data-active=\{active \|\| undefined\}/);
	assert.match(SOURCE, /aria-pressed=\{ariaPressed \?\? selected\}/);
	assert.match(SOURCE, /data-selected=\{selected \|\| undefined\}/);
	assert.match(SOURCE, /data-dragging=\{dragging \|\| undefined\}/);
	assert.match(SOURCE, /cursor: dragging \? "grabbing" : draggable \? "grab" : "default"/);
});

test("Jira issue stroke chrome drops the raised shadow and uses the disabled border token", () => {
	assert.match(SOURCE, /export type JiraIssueChrome = "raised" \| "stroke";/u);
	assert.match(SOURCE, /chrome\?: JiraIssueChrome;/u);
	assert.match(SOURCE, /chrome = "raised",/u);
	assert.match(SOURCE, /const usesStrokeChrome = chrome === "stroke";/u);
	assert.match(SOURCE, /const idleBorderClassName = usesStrokeChrome\s*\n\t\t\? "border-border-disabled hover:border-border group-hover\/jira-issue:border-border"\s*\n\t\t: "border-transparent";/u);
	assert.match(SOURCE, /\.\.\.\(usesStrokeChrome \? undefined : \{ boxShadow: token\("elevation\.shadow\.raised"\) \}\)/u);
	assert.match(SOURCE, /\.\.\.\(usesStrokeChrome \? \{ boxShadow: "none" \} : undefined\)/u);
	assert.match(SOURCE, /usesStrokeChrome: boolean;/u);
	assert.match(SOURCE, /usesStrokeChrome=\{usesStrokeChrome\}/u);
	assert.match(
		SOURCE,
		/className=\{cn\("min-w-0 flex-1", usesStrokeChrome \? "line-clamp-2 min-h-10 text-sm leading-5" : "text-sm"\)\}/u,
	);
	assert.match(SOURCE, /<div className="flex min-w-0 flex-col gap-2">/u);
	assert.match(SOURCE, /<TagGroup className="min-w-0 gap-1 overflow-hidden">/u);
});

test("Jira issue stroke chrome uses the same disabled rest border with or without agents", () => {
	assert.match(SOURCE, /const idleBorderClassName = usesStrokeChrome\s*\n\t\t\? "border-border-disabled hover:border-border group-hover\/jira-issue:border-border"\s*\n\t\t: "border-transparent";/u);
	assert.match(SOURCE, /const agentActivityIdleBorderClassName = usesStrokeChrome\s*\n\t\t\? "border-border-disabled group-hover\/jira-issue-card:border-border"\s*\n\t\t: "border-transparent";/u);
	assert.match(SOURCE, /usesAgentActivityShell\s*\n\t\t\t\? "group\/jira-issue-card border-transparent bg-transparent"/u);
	assert.doesNotMatch(
		SOURCE,
		/hasActiveAgentActivityShell\s*\n\t\t\? "border-border-disabled/u,
	);
	assert.match(
		ROOT_CLASS_BLOCK,
		/const agentActivitySurfaceClassName = cn\([\s\S]*selected[\s\S]*\? "border-border-selected bg-bg-selected"[\s\S]*: active[\s\S]*\? `\$\{agentActivityIdleBorderClassName\} bg-bg-selected`[\s\S]*: `\$\{agentActivityIdleBorderClassName\} bg-surface`/u,
	);
});

test("Jira issue exposes the experimental stroke visual as a catalog example", () => {
	assert.match(PAGE_SOURCE, /variant\?: "default" \| "experimental" \|/u);
	assert.match(PAGE_SOURCE, /const isExperimentalVariant = variant === "experimental";/u);
	assert.match(PAGE_SOURCE, /chrome=\{isExperimentalVariant \? "stroke" : undefined\}/u);
	assert.match(DEMO_SOURCE, /export function JiraIssueDemoExperimental\(\)/u);
	assert.match(DEMO_SOURCE, /<JiraIssuePage variant="experimental" \/>/u);
	assert.match(DETAILS_SOURCE, /title: "Experimental"[\s\S]*demoSlug: "jira-issue-demo-experimental"/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /"jira-issue-demo-experimental": dynamic\(/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /default: mod\.JiraIssueDemoExperimental/u);
});

test("Jira issue owns an uncaptured-work variant with a controlled create action", () => {
	assert.match(SOURCE, /export type JiraIssueVariant = "default" \| "uncaptured-work";/u);
	assert.match(SOURCE, /export interface JiraIssueUncapturedWorkProps/u);
	assert.match(SOURCE, /variant: "uncaptured-work";/u);
	assert.match(SOURCE, /participants: readonly JiraIssueParticipant\[\];/u);
	assert.match(SOURCE, /sourceLink: SmartLinkItem;/u);
	assert.match(SOURCE, /onCreateWorkItem\?: \(\) => void;/u);
	assert.match(SOURCE, /export type JiraIssueProps = JiraIssueDefaultProps \| JiraIssueUncapturedWorkProps;/u);
	assert.match(SOURCE, /if \(props\.variant === "uncaptured-work"\) \{[\s\S]*<JiraIssueUncapturedWork \{\.\.\.props\} \/>/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /data-variant=\{variant\}/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /flex w-full flex-col gap-2 rounded-lg border border-dashed/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /<p className="line-clamp-2 min-h-10 text-sm leading-5">\{summary\}<\/p>/u);
	assert.doesNotMatch(UNCAPTURED_WORK_SOURCE, /<p className="truncate[^"]*">\{summary\}<\/p>/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /import \{ SmartLink \} from "@\/components\/blocks\/smart-link";/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /renderVisual\(sourceLink\.provider\.logo, "footer"\)/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /\{sourceLink\.provider\.name\}/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /<span aria-hidden="true">·<\/span>/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /min-h-5 min-w-0 items-center gap-1.5 text-xs leading-4 text-text-subtle/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /<SmartLink[\s\S]*item=\{sourceLink\}/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /\[&>span:first-child\]:hidden/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /text-xs leading-4 text-text-subtle[\s\S]*hover:text-text-subtle hover:underline/u);
	assert.doesNotMatch(UNCAPTURED_WORK_SOURCE, /hover:text-link/u);
	assert.doesNotMatch(UNCAPTURED_WORK_SOURCE, /\{source\} · \{detail\}/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /<div className="pt-0.5">/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /className="flex items-center justify-between"/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /size="compact"/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /size="sm"/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /\{captured \? "Captured" : "Create work item"\}/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /aria-disabled=\{captured \|\| actionUnavailable\}/u);
	assert.match(UNCAPTURED_WORK_SOURCE, /aria-live="polite"/u);
	assert.match(PAGE_SOURCE, /variant\?: "default" \| "experimental" \| "uncaptured-work" \|/u);
	assert.match(PAGE_SOURCE, /title: "#payments-migration"/u);
	assert.match(PAGE_SOURCE, /provider: \{ name: "Slack", logo: \{ kind: "third-party", name: "slack" \} \}/u);
	assert.match(DEMO_SOURCE, /export function JiraIssueDemoUncapturedWork\(\)/u);
	assert.match(DETAILS_SOURCE, /title: "Uncaptured work"[\s\S]*demoSlug: "jira-issue-demo-uncaptured-work"/u);
	assert.match(VARIANT_REGISTRY_SOURCE, /default: mod\.JiraIssueDemoUncapturedWork/u);
});

test("Jira issue distinguishes an active card background from bulk selection", () => {
	assert.match(ROOT_CLASS_BLOCK, /selected[\s\S]*\? "border-border-selected bg-bg-selected"[\s\S]*: active[\s\S]*\? `\$\{idleBorderClassName\} bg-bg-selected`[\s\S]*: `\$\{idleBorderClassName\} bg-surface`/u);
	assert.match(ROOT_CLASS_BLOCK, /const agentActivitySurfaceClassName = cn\([\s\S]*selected[\s\S]*\? "border-border-selected bg-bg-selected"[\s\S]*: active[\s\S]*\? `\$\{agentActivityIdleBorderClassName\} bg-bg-selected`/u);
	assert.doesNotMatch(SOURCE, /aria-pressed=\{ariaPressed \?\? active\}/u);
});

test("Jira issue reserves a stable title action slot and opens the built-in actions menu", () => {
	assert.match(SOURCE, /import \{ JiraIssueMoreMenu, type JiraIssueMoreAction \} from "@\/components\/blocks\/jira-issue\/more-menu";/u);
	assert.match(SOURCE, /showMoreAction\?: boolean;/u);
	assert.match(SOURCE, /onMoreActionSelect\?: \(action: JiraIssueMoreAction\) => void;/u);
	assert.match(SOURCE, /<div className="size-6 shrink-0" data-slot="jira-issue-more-action" \/>/u);
	assert.match(SOURCE, /<JiraIssueMoreMenu[\s\S]*issueKey=\{issueKey\}[\s\S]*onActionSelect=\{onMoreActionSelect\}[\s\S]*onOpenChange=\{setMoreActionMenuOpen\}/u);
	assert.match(MORE_MENU_SOURCE, /import ShowMoreHorizontalIcon from "@atlaskit\/icon\/core\/show-more-horizontal";/u);
	assert.match(MORE_MENU_SOURCE, /<DropdownMenu onOpenChange=\{onOpenChange\}>/u);
	assert.match(MORE_MENU_SOURCE, /aria-label=\{`More actions for \$\{issueKey\}`\}/u);
	assert.match(MORE_MENU_SOURCE, /pointer-events-none size-6 opacity-0[^"]*group-hover\/jira-issue:pointer-events-auto group-hover\/jira-issue:opacity-100[^"]*group-has-\[:focus-visible\]\/jira-issue:pointer-events-auto group-has-\[:focus-visible\]\/jira-issue:opacity-100[^"]*data-popup-open:pointer-events-auto data-popup-open:opacity-100/u);
	assert.match(MORE_MENU_SOURCE, /motion-reduce:transition-none/u);
	assert.match(MORE_MENU_SOURCE, /<DropdownMenuContent align="start" className="max-h-none w-\[280px\]" side="right" sideOffset=\{8\}>/u);
	for (const label of ["Move work item", "Change status", "Copy link", "Copy key", "Add agent", "Link Confluence item", "Link work item", "Change parent", "Select cover", "Edit labels", "Add flag"]) {
		assert.match(MORE_MENU_SOURCE, new RegExp(`>\\s*${label}\\s*</DropdownMenuItem>`));
	}
	assert.doesNotMatch(MORE_MENU_SOURCE, /Lozenge|>New</u);
});

test("Jira issue renders the more-actions button as a sibling of the card button", () => {
	assert.doesNotMatch(SUMMARY_BLOCK, /<JiraIssueMoreMenu/u);
	assert.match(
		SOURCE,
		/const moreActionMenu = showMoreAction \? \([\s\S]*<div className="absolute right-3 top-3 z-20 size-6">[\s\S]*<JiraIssueMoreMenu/u,
	);
	assert.ok(
		RICH_ISSUE_CONTENT_BLOCK.indexOf("{moreActionMenu}") > RICH_ISSUE_CONTENT_BLOCK.indexOf("</button>"),
		"the menu trigger must render after the card button closes",
	);
});

test("Jira issue suppresses the Rovo sparkle while the more actions menu is open", () => {
	assert.match(SOURCE, /const \[moreActionMenuOpen, setMoreActionMenuOpen\] = useState\(false\);/u);
	assert.match(SOURCE, /const generativeActionRevealActive = !agentActivityHoverOpen[\s\S]*&& !moreActionMenuOpen[\s\S]*&& !generativeActionRevealSuppressed/u);
	assert.match(SOURCE, /onOpenChange=\{setMoreActionMenuOpen\}/u);
});

test("Jira issue exposes agent activity state props", () => {
	assert.match(AGENT_ACTIVITY_SOURCE, /export type JiraIssueAgentActivityMode = "none" \| "working" \| "awaiting-input" \| "completed";/);
	assert.match(AGENT_ACTIVITY_SOURCE, /export type JiraIssueAgentActivityState = "working" \| "awaiting-input" \| "completed";/);
	assert.match(AGENT_ACTIVITY_SOURCE, /export interface JiraIssueAgentActivity \{[\s\S]*id: string;[\s\S]*name: string;[\s\S]*avatarSrc\?: string;[\s\S]*label: string;[\s\S]*labels\?: readonly string\[\];[\s\S]*message\?: string;[\s\S]*cycleIntervalJitterMs\?: number;[\s\S]*cycleIntervalMs\?: number;[\s\S]*question\?: QuestionCardQuestion;[\s\S]*state: JiraIssueAgentActivityState;/);
	assert.match(SOURCE, /export type \{[\s\S]*JiraIssueAgentActivity,[\s\S]*JiraIssueAgentActivityMode,[\s\S]*JiraIssueAgentActivityState,[\s\S]*\} from "@\/components\/blocks\/jira-issue\/agent-activity";/);
	assert.match(SOURCE, /agentActivities\?: readonly JiraIssueAgentActivity\[\];/);
	assert.match(SOURCE, /agentDoneRuns\?: readonly JiraIssueCompletedAgentRun\[\];/);
	assert.match(SOURCE, /export type \{[\s\S]*JiraIssueCompletedAgentRun,[\s\S]*JiraIssueCompletedAgentRunState,[\s\S]*\} from "@\/components\/blocks\/jira-issue\/completed-agent-runs";/);
	assert.match(SOURCE, /agentActivityMode\?: JiraIssueAgentActivityMode;/);
	assert.match(SOURCE, /onAgentActivityQuestionSubmit\?: \(activity: JiraIssueAgentActivity, answers: QuestionCardAnswers\) => void;/);
	assert.match(SOURCE, /onAgentActivityViewChat\?: \(activity: JiraIssueAgentActivity\) => void;/);
	assert.match(SOURCE, /generativeAction\?: JiraIssueGenerativeActionConfig;/);
	assert.match(SOURCE, /export type \{[\s\S]*JiraIssueGenerativeActionConfig,[\s\S]*JiraIssueGenerativeActionRequest,[\s\S]*\} from "@\/components\/blocks\/jira-issue\/generative-action-menu";/);
});

test("Jira issue aggregates active agents into one priority row and an Agent List flyout", () => {
	assert.match(AGENT_ACTIVITY_SOURCE, /import \{ AgentList, type AgentListItem \} from "@\/components\/blocks\/agent-list";/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent";/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /summarizeJiraIssueAgentActivities\(activities\)/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /<span className="ml-px grid size-4 shrink-0 place-items-center text-text-subtlest" aria-hidden="true">\s*<AiAgentIcon label="" \/>/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /<AvatarFallback[\s\S]*\{summary\.activityCount\}/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /className="flex h-6 w-full[^"]*rounded-b-\[6px\] rounded-t-sm[^"]*"/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const isSingleAgent = summary\.activityCount === 1;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /onClick=\{isSingleAgent[\s\S]*\? \(\) => onViewChat\?\.\(activities\[0\]\)[\s\S]*: \(\) => handleOpenChange\(true\)\}/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /<AgentList[\s\S]*flyout="none"[\s\S]*items=\{agentListItems\}[\s\S]*onView=\{handleAgentListView\}[\s\S]*variant="compact"/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /className="w-full border-0 bg-surface-overlay shadow-2xl"/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /className="w-full shadow-overlay"/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /activities\.map\(\(activity, index\)/u);
});

test("Jira issue shows PR metadata with the specified summary-row spacing", () => {
	assert.match(SOURCE, /pullRequestNumber\?: number;[\s\S]*pullRequestStatus\?: JiraIssuePullRequestStatus;/u);
	assert.match(SOURCE, /const inferredPullRequestNumber = agentDoneRuns\.find\(\(run\) => run\.pullRequestNumber\)\?\.pullRequestNumber;/u);
	assert.match(SOURCE, /const resolvedPullRequestNumber = pullRequestNumber \?\? inferredPullRequestNumber;/u);
	assert.match(SOURCE, /<div className="flex items-center gap-2">[\s\S]*<div className="flex items-center gap-1">[\s\S]*<TaskIcon[\s\S]*\{issueKey\}[\s\S]*\{pullRequestNumber \? \([\s\S]*<div className="flex items-center gap-1">[\s\S]*pullRequestStatus === "merged"[\s\S]*text-icon-accent-purple[\s\S]*<MergeSuccessIcon label="Pull request merged" color="currentColor" \/>[\s\S]*text-icon-accent-lime[\s\S]*<PullRequestIcon label="Pull request" color="currentColor" \/>[\s\S]*#\{pullRequestNumber\}/u);
	assert.match(SOURCE, /pullRequestNumber=\{resolvedPullRequestNumber\}/u);
	assert.match(SOURCE, /pullRequestStatus=\{pullRequestStatus\}/u);
});

test("Jira issue uses the 8px large radius token", () => {
	assert.match(SOURCE, /borderRadius: token\("radius\.large"\)/);
	assert.doesNotMatch(SOURCE, /borderRadius: token\("radius\.small"\)/);
});

test("Jira issue switches rich variants to an article with internal controls", () => {
	assert.match(SOURCE, /const hasAgentActivityPresentation = agentActivityMode !== undefined \|\| Boolean\(agentActivities\?\.length\) \|\| hasAgentDoneNotification;/);
	assert.match(SOURCE, /const hasInteractiveContent = showMoreAction \|\| hasSubtasks \|\| Boolean\(parentEpicControl\) \|\| hasAgentActivityPresentation \|\| Boolean\(generativeAction\);/);
	assert.match(SOURCE, /const shouldRenderIssueClickButton = Boolean\(props\.onClick && !parentEpicControl\);/);
	assert.match(SOURCE, /<article[\s\S]*data-selected=\{selected \|\| undefined\}/);
	assert.match(SOURCE, /draggable=\{draggable\}/);
	assert.match(SOURCE, /shouldRenderIssueClickButton \? \([\s\S]*aria-pressed=\{ariaPressed \?\? selected\}/);
	assert.match(SOURCE, /parentEpicControl\?: ReactNode;/);
	assert.match(SOURCE, /parentEpicControl=\{parentEpicControl\}/);
	assert.match(SOURCE, /<p className="text-sm font-semibold leading-5 text-text-subtle">Parent<\/p>/);
	assert.match(SOURCE, /showPriorityIndicator\?: boolean;/);
	assert.match(SOURCE, /\{showPriorityIndicator \? <PriorityIcon label=\{`\$\{priority\} priority`\} color=\{priorityColor\} \/> : null\}/);
	assert.match(SOURCE, /className="w-full p-3 text-left outline-none/);
	assert.match(SOURCE, /<div className="p-3">\{summaryContent\}<\/div>/);
	assert.match(SOURCE, /import \{ JiraIssueCountBadge \} from "@\/components\/blocks\/jira-issue\/count-badge";/);
	assert.match(SOURCE, /import \{ Separator \} from "@\/components\/ui\/separator";/);
	assert.doesNotMatch(SOURCE, /parentEpicControl \? <JiraIssueSeparator \/> : null/);
	assert.doesNotMatch(SOURCE, /overflow: "hidden"/);
	assert.doesNotMatch(ROOT_CLASS_BLOCK, /hover:bg-bg-neutral-subtle-hovered/);
	assert.doesNotMatch(SOURCE, /<p className="mb-1 text-xs font-semibold leading-4 text-text-subtlest">Parent<\/p>/);
	assert.doesNotMatch(SOURCE, /border-b border-border px-4 py-3/);
	assert.doesNotMatch(SOURCE, /className="w-full p-4 text-left outline-none/);
	assert.doesNotMatch(SOURCE, /<div className="p-4">\{summaryContent\}<\/div>/);
});

test("Jira issue renders a reusable generative action command menu", () => {
	assert.match(SOURCE, /import \{[\s\S]*JiraIssueGenerativeActionMenu,[\s\S]*type JiraIssueGenerativeActionConfig,[\s\S]*\} from "@\/components\/blocks\/jira-issue\/generative-action-menu";/);
	assert.match(SOURCE, /generativeAction,/);
	assert.doesNotMatch(SOURCE, /DEFAULT_JIRA_ISSUE_GENERATIVE_ACTION|onSubmit: \(\) => undefined/u);
	assert.match(SOURCE, /const generativeActionMenu = generativeAction \? \([\s\S]*<JiraIssueGenerativeActionMenu[\s\S]*action=\{generativeAction\}[\s\S]*issue=\{\{ issueKey, summary \}\}[\s\S]*revealActive=\{generativeActionRevealActive\}[\s\S]*\/>[\s\S]*\) : null;/);
	assert.match(SOURCE, /const hasInteractiveContent = showMoreAction \|\| hasSubtasks \|\| Boolean\(parentEpicControl\) \|\| hasAgentActivityPresentation \|\| Boolean\(generativeAction\);/);
	assert.match(SOURCE, /\{generativeActionMenu\}/);
	assert.match(SOURCE, /"group\/jira-issue relative w-full min-w-0 overflow-visible outline-none"/);

	assert.match(GENERATIVE_SOURCE, /RovoSparkle,[\s\S]*RovoSparkleButton,[\s\S]*type RovoSparkleActionRequest,/);
	assert.match(GENERATIVE_SOURCE, /import \{ EDITOR_PALETTE_MENTION_SOURCES \} from "@\/components\/blocks\/editor-palette\/data\/mention-sources";/);
	assert.match(GENERATIVE_SOURCE, /import \{ getMentionChildItems \} from "@\/components\/ui-custom\/rich-text-editor";/);
	assert.match(GENERATIVE_SOURCE, /export interface JiraIssueGenerativeActionConfig \{[\s\S]*agents\?: readonly RovoSparkleItem\[\];[\s\S]*ariaLabel\?: string;[\s\S]*onSubmit: \(request: JiraIssueGenerativeActionRequest\) => void \| Promise<void>;[\s\S]*skills\?: readonly RovoSparkleItem\[\];/);
	assert.match(GENERATIVE_SOURCE, /export interface JiraIssueGenerativeActionRequest \{[\s\S]*kind: JiraIssueGenerativeActionKind;[\s\S]*prompt: string;[\s\S]*issue: JiraIssueGenerativeActionIssue;[\s\S]*selectedItem\?: JiraIssueGenerativeActionSelectedItem;/);
	assert.match(GENERATIVE_SOURCE, /export type JiraIssueGenerativeActionSelectedItem = RovoSparkleSelectedItem;/);
	assert.match(GENERATIVE_SOURCE, /agents=\{action\.agents \?\? JIRA_ISSUE_GENERATIVE_AGENTS\}/u);
	assert.match(GENERATIVE_SOURCE, /skills=\{action\.skills \?\? JIRA_ISSUE_GENERATIVE_SKILLS\}/u);
	assert.match(SOURCE, /const \[generativeActionPointerActive, setGenerativeActionPointerActive\] = useState\(false\);/);
	assert.match(SOURCE, /const \[generativeActionFocusActive, setGenerativeActionFocusActive\] = useState\(false\);/);
	assert.match(SOURCE, /const \[generativeActionRevealSuppressed, setGenerativeActionRevealSuppressed\] = useState\(false\);/);
	assert.match(SOURCE, /const \[agentActivityHoverOpen, setAgentActivityHoverOpen\] = useState\(false\);/u);
	assert.match(SOURCE, /const generativeActionRevealActive = !agentActivityHoverOpen[\s\S]*&& !generativeActionRevealSuppressed[\s\S]*&& \(generativeActionPointerActive \|\| generativeActionFocusActive\);/);
	assert.match(SOURCE, /function handleAgentActivityOpenChange\(open: boolean\) \{[\s\S]*setAgentActivityHoverOpen\(open\);[\s\S]*onAgentActivityOpenChange\?\.\(open\);/u);
	assert.match(SOURCE, /const \[generativeActionAnchor, setGenerativeActionAnchor\] = useState<HTMLElement \| null>\(null\);/);
	assert.match(SOURCE, /<JiraIssueGenerativeActionMenu[\s\S]*anchor=\{generativeActionAnchor\}[\s\S]*revealActive=\{generativeActionRevealActive\}/);
	assert.match(SOURCE, /<article[\s\S]*ref=\{setGenerativeActionAnchor\}/);
	assert.match(SOURCE, /onPointerOver=\{handleGenerativeActionPointerOver\}/);
	assert.match(SOURCE, /onPointerOut=\{handleGenerativeActionPointerOut\}/);
	assert.match(
		SOURCE,
		/function handleGenerativeActionPointerOver\(event: PointerEvent<HTMLElement>\) \{[\s\S]*event\.target instanceof Element[\s\S]*event\.target\.closest\("\[data-slot='jira-issue-agent-row'\]"\)[\s\S]*setGenerativeActionRevealSuppressed\(true\);[\s\S]*setGenerativeActionPointerActive\(false\);[\s\S]*return;/,
		"agent rows should suppress the portaled sparkle before their hover cards open",
	);
	assert.match(SOURCE, /onFocusCapture=\{handleGenerativeActionFocusCapture\}/);
	assert.match(SOURCE, /onBlurCapture=\{handleGenerativeActionBlurCapture\}/);
	assert.match(
		SOURCE,
		/function handleGenerativeActionFocusCapture\(event: FocusEvent<HTMLElement>\) \{[\s\S]*event\.target instanceof Element[\s\S]*event\.currentTarget\.contains\(event\.target\)[\s\S]*setGenerativeActionFocusActive\(event\.target\.matches\(":focus-visible"\)\);/,
		"pointer-acquired focus should not pin the sparkle after an agent-row click",
	);
	assert.match(
		SOURCE,
		/function handleGenerativeActionBlurCapture\(event: FocusEvent<HTMLElement>\) \{[\s\S]*event\.target instanceof Node[\s\S]*event\.currentTarget\.contains\(event\.target\)[\s\S]*setGenerativeActionFocusActive\(false\);/,
		"portaled focus events should not masquerade as card focus",
	);
	assert.match(
		SOURCE,
		/function handleGenerativeActionPointerOut\(event: PointerEvent<HTMLElement>\) \{[\s\S]*!event\.currentTarget\.contains\(event\.target as Node\)[\s\S]*const nextTarget = event\.relatedTarget as Node \| null;[\s\S]*event\.currentTarget\.contains\(nextTarget\)[\s\S]*setGenerativeActionPointerActive\(false\);/,
		"the real DOM pointer boundary should win over portaled React descendants",
	);
	assert.match(SOURCE, /<JiraIssueAgentActivityRows[\s\S]*onOpenChange=\{handleAgentActivityOpenChange\}/);
	assert.match(GENERATIVE_SOURCE, /triggerElement\?: ReactElement;/);
	assert.match(GENERATIVE_SOURCE, /const generatedTrigger = triggerPosition \? \([\s\S]*<RovoSparkleButton[\s\S]*hideWhenSelected/);
	assert.match(GENERATIVE_SOURCE, /const resolvedTrigger = triggerElement \?\? generatedTrigger;/);
	assert.match(
		GENERATIVE_SOURCE,
		/className="fixed z-\[150\] overflow-visible before:pointer-events-auto before:absolute/,
		"the portaled sparkle and its hover bridge should stay below z-200 modal blankets",
	);
	assert.doesNotMatch(GENERATIVE_SOURCE, /z-\[550\]/);
	assert.doesNotMatch(GENERATIVE_SOURCE, /mt-2/);
	assert.match(GENERATIVE_SOURCE, /function handleOpenChange\(nextOpen: boolean\) \{[\s\S]*setOpen\(nextOpen\);[\s\S]*onOpenChange\?\.\(nextOpen\);/);
	assert.match(SOURCE, /onOpenChange=\{\(nextOpen\) => setGenerativeActionRevealSuppressed\(!nextOpen\)\}/);
	assert.match(SOURCE, /onTriggerPointerEnter=\{\(\) => setGenerativeActionPointerActive\(true\)\}/);
	assert.match(SOURCE, /onTriggerPointerLeave=\{\(\) => setGenerativeActionPointerActive\(false\)\}/);
	assert.match(GENERATIVE_SOURCE, /window\.addEventListener\("scroll", updateTriggerPosition, true\);/);
	assert.match(GENERATIVE_SOURCE, /if \(!anchor \|\| \(!revealActive && !open\)\) \{[\s\S]*window\.requestAnimationFrame\(trackTriggerPosition\)[\s\S]*window\.cancelAnimationFrame\(animationFrameId\)/);
	assert.match(GENERATIVE_SOURCE, /currentPosition\?\.bridgeHeight === nextPosition\.bridgeHeight[\s\S]*currentPosition\.left === nextPosition\.left[\s\S]*currentPosition\.top === nextPosition\.top/u);
	assert.match(GENERATIVE_SOURCE, /function getJiraIssueGenerativeTriggerPosition\(anchor: HTMLElement\)[\s\S]*anchor\.querySelector<HTMLElement>\("\[data-slot='jira-issue-surface'\]"\)[\s\S]*const top = issueSurface\?\.getBoundingClientRect\(\)\.top \?\? rect\.top;[\s\S]*bridgeHeight: Math\.max\(JIRA_ISSUE_GENERATIVE_TRIGGER_SIZE, rect\.bottom - top\),[\s\S]*left: rect\.right \+ 7,[\s\S]*top,/);
	assert.doesNotMatch(GENERATIVE_SOURCE, /top: rect\.top \+ 1/);
	assert.doesNotMatch(GENERATIVE_SOURCE, /group-hover\/jira-issue|group-focus-within\/jira-issue/);
	assert.match(
		GENERATIVE_SOURCE,
		/overflow-visible before:pointer-events-auto before:absolute before:-left-2 before:top-0 before:h-\[var\(--jira-issue-generative-bridge-height\)\] before:w-2 before:content-\[''\] \[&>span\]:rounded-\[inherit\]/u,
		"the sparkle trigger should bridge its 8px visual gap across the card's full height without clipping the bridge",
	);
	assert.match(GENERATIVE_SOURCE, /"--jira-issue-generative-bridge-height": `\$\{triggerPosition\.bridgeHeight\}px`/u);
	assert.doesNotMatch(GENERATIVE_SOURCE, /delay-200|translate-x/);
	assert.match(GENERATIVE_SOURCE, /size="compact"[\s\S]*visible=\{sparkleVisible\}/);
	assert.match(GENERATIVE_SOURCE, /<RovoSparkle[\s\S]*agents=\{action\.agents \?\? JIRA_ISSUE_GENERATIVE_AGENTS\}[\s\S]*menuTitle="Jira issue actions"[\s\S]*popoverTitle="Jira issue generative actions"[\s\S]*sideOffset=\{hasTriggerElement \? 4 : -24\}[\s\S]*skills=\{action\.skills \?\? JIRA_ISSUE_GENERATIVE_SKILLS\}/);
	assert.match(GENERATIVE_SOURCE, /triggerPortalContainer=\{hasTriggerElement \? null : portalContainer\}/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /import \{ motion, useReducedMotion, type Transition \} from "motion\/react";/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /rotate: shouldReduceMotion \|\| !active \? 0 : 180,[\s\S]*scale: shouldReduceMotion \|\| !active \? 1 : hoverScale/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /<motion\.g[\s\S]*animate=\{\{ opacity: colorActive \? 1 : 0 \}\}/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /animate=\{\{ opacity: selected \? 1 : 0 \}\}[\s\S]*className="text-icon-selected!"/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /if \(selected !== previousSelected\) \{[\s\S]*setInteractionSuppressed\(true\)/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /const SPARKLE_COLOR_ENTER: Transition = \{ duration: 0\.15, ease: \[0\.4, 1, 0\.6, 1\] \}/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /const SPARKLE_COLOR_EXIT: Transition = \{ duration: 0\.25, ease: \[0\.6, 0, 0\.8, 0\.6\] \}/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /const SPARKLE_TRANSFORM_ENTER: Transition = \{ duration: 0\.4, ease: \[0\.4, 0, 0, 1\] \}/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /const SPARKLE_TRANSFORM_EXIT: Transition = \{ duration: 0\.25, ease: \[0\.6, 0, 0\.8, 0\.6\] \}/);
	assert.match(ROVO_SPARKLE_BUTTON_SOURCE, /const colorTransition = shouldReduceMotion[\s\S]*\? SPARKLE_REDUCED/);
	assert.match(ROVO_SPARKLE_SOURCE, /className="rich-text-command-menu-borderless rich-text-command-menu-search-selects"/);
	assert.match(RICH_TEXT_EDITOR_CSS_SOURCE, /\.rich-text-command-menu-search-selects:focus-within \.rich-text-command-menu-item-selected,[\s\S]*\.rich-text-command-menu-search-selects:focus-within \.rich-text-command-menu-item-selected:hover,[\s\S]*background-color: var\(--ds-background-neutral-subtle-hovered, #f1f2f4\);/);
	assert.match(RICH_TEXT_EDITOR_CSS_SOURCE, /\.rich-text-command-menu-search-selects:focus-within \.rich-text-command-menu-item-selected:hover \.rich-text-command-menu-copy \{\s*padding-right: 28px;/);
	assert.match(RICH_TEXT_EDITOR_CSS_SOURCE, /\.rich-text-command-menu-search-selects:focus-within \.rich-text-command-menu-return-shortcut \{\s*display: inline-flex;/);
	assert.match(ROVO_SPARKLE_SOURCE, /emptyState=\{false\}/);
	assert.match(ROVO_SPARKLE_SOURCE, /<RichTextCommandMenuSearchField[\s\S]*icon=\{<RovoColorIcon size="xxsmall" \/>\}[\s\S]*label="Ask Rovo"/);
	assert.match(ROVO_SPARKLE_SOURCE, /const \[selectedIndex, setSelectedIndex\] = useState\(-1\);/);
	assert.match(ROVO_SPARKLE_SOURCE, /function getNextSelectedIndex\(items: readonly RovoSparkleItem\[\], currentIndex: number, direction: -1 \| 1\)/);
	assert.match(ROVO_SPARKLE_SOURCE, /function handleMenuKeyDown\(event: KeyboardEvent<HTMLInputElement>\)[\s\S]*event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"[\s\S]*getNextSelectedIndex\(rows, currentIndex, event\.key === "ArrowDown" \? 1 : -1\)[\s\S]*event\.key === "Enter"[\s\S]*handleSelectItem\(rows\[selectedIndex\]\)/);
	assert.match(ROVO_SPARKLE_SOURCE, /<RichTextSuggestionMenu[\s\S]*onHover=\{setSelectedIndex\}[\s\S]*selectedIndex=\{selectedIndex\}/);
	assert.match(GENERATIVE_SOURCE, /getMentionChildItems\(EDITOR_PALETTE_MENTION_SOURCES, "skill"\)/);
	assert.match(ROVO_SPARKLE_SOURCE, /headingLabel: "Skills"/);
	assert.match(GENERATIVE_SOURCE, /getMentionChildItems\(EDITOR_PALETTE_MENTION_SOURCES, "subagent"\)/);
	assert.match(ROVO_SPARKLE_SOURCE, /headingLabel: "Agents"/);
	assert.match(ROVO_SPARKLE_SOURCE, /function filterItems\(items: readonly RovoSparkleItem\[\], query: string\)/);
	assert.match(ROVO_SPARKLE_SOURCE, /const isFiltering = query\.trim\(\)\.length > 0;/);
	assert.match(ROVO_SPARKLE_SOURCE, /const SECTION_LIMIT = 3;/);
	assert.match(ROVO_SPARKLE_SOURCE, /getSuggestionOverflowFooterItem\(id, "browse-all"\)/);
	assert.ok(
		ROVO_SPARKLE_SOURCE.indexOf("id: AGENTS_HEADING_ID")
			< ROVO_SPARKLE_SOURCE.indexOf("id: SKILLS_HEADING_ID"),
		"agents should appear before skills in the Jira issue palette",
	);
	assert.match(GENERATIVE_SOURCE, /function handleRovoSparkleSubmit\(request: RovoSparkleActionRequest\)/);
	assert.match(GENERATIVE_SOURCE, /return `\$\{prompt\.trim\(\)\}\\n\\nJira issue \$\{issue\.issueKey\}: \$\{issue\.summary\}`;/);
	assert.match(GENERATIVE_SOURCE, /return `Use the "\$\{item\.label\}" skill for Jira issue \$\{issue\.issueKey\}: \$\{issue\.summary\}\.`;/);
	assert.match(GENERATIVE_SOURCE, /return `Ask "\$\{item\.label\}" to help with Jira issue \$\{issue\.issueKey\}: \$\{issue\.summary\}\.`;/);
	assert.match(DETAILS_SOURCE, /name: "generativeAction"/);
});

test("Jira issue uses the VPK Badge primitive for row counts", () => {
	assert.match(COUNT_BADGE_SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/);
	assert.match(COUNT_BADGE_SOURCE, /function JiraIssueCountBadge\(\{ children \}: Readonly<\{ children: ReactNode \}>\) \{\n\treturn \(\n\t\t<Badge className="h-5 min-w-0 rounded-sm px-1\.5 font-semibold text-text-subtle" max=\{false\} variant="neutral">/);
	assert.match(SOURCE, /<JiraIssueCountBadge>\{completedCount\}\/\{totalCount\}<\/JiraIssueCountBadge>/);
	assert.doesNotMatch(COMPLETED_RUNS_SOURCE, /JiraIssueCountBadge|Agent done/u);
	assert.doesNotMatch(COUNT_BADGE_SOURCE, /rounded-sm bg-bg-neutral px-1\.5 py-0\.5 text-xs font-semibold leading-4 text-text-subtle/);
});

test("Jira issue renders one aggregate agent row with prioritized status and a list flyout", () => {
	assert.match(AGENT_ACTIVITY_SOURCE, /import \{ AgentList, type AgentListItem \} from "@\/components\/blocks\/agent-list";/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /import \{ AgentAvatarVisual \} from "@\/components\/ui-custom\/agent-avatar-visual";/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /import \{ Avatar, AvatarFallback \} from "@\/components\/ui\/avatar";/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const summary = summarizeJiraIssueAgentActivities\(activities\);/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const isSingleAgent = summary\.activityCount === 1;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const featuredActivity = summary\.featuredActivityIndex !== null[\s\S]*\? activities\[summary\.featuredActivityIndex\][\s\S]*: undefined;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /featuredActivity \? \([\s\S]*<AgentAvatarVisual[\s\S]*avatarSrc=\{featuredActivity\.avatarSrc\}[\s\S]*label=\{featuredActivity\.name\}[\s\S]*: \([\s\S]*<AiAgentIcon label="" \/>/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const isAwaitingInput = summary\.priorityState === "awaiting-input";/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const shouldCycleSingleAgentLabel = isSingleAgent && !isAwaitingInput;/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /shouldCycleSingleAgentLabel \? \([\s\S]*<JiraIssueCyclingAgentLabel[\s\S]*labels=\{getJiraIssueAgentWorkingLabels\(activities\[0\]\)\}/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /duration=\{JIRA_ISSUE_AGENT_SHIMMER_DURATION\}[\s\S]*spread=\{JIRA_ISSUE_AGENT_SHIMMER_SPREAD\}[\s\S]*\{summary\.label\}[\s\S]*<AnimatedDots \/>/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /<Spinner label="" size="sm" \/>/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /<HoverCard open=\{flyoutOpen\} onOpenChange=\{handleOpenChange\}>[\s\S]*<HoverCardTrigger closeDelay=\{80\} delay=\{120\}/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /<AgentList[\s\S]*flyout="none"[\s\S]*items=\{agentListItems\}[\s\S]*onView=\{handleAgentListView\}[\s\S]*variant="compact"/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /handleOpenChange\(false\);[\s\S]*onViewChat\?\.\(activity\);/u);
	assert.doesNotMatch(AGENT_ACTIVITY_SOURCE, /<AgentStates/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /className=\{cn\("flex w-full min-w-0 flex-col overflow-hidden", hasActivities && "px-1 py-1"\)\}/u);
	assert.match(SOURCE, /"relative w-full min-w-0 overflow-visible rounded-\[10px\] outline-none"/);
	assert.match(SOURCE, /"group\/jira-issue relative w-full min-w-0 overflow-visible outline-none"/);
	assert.match(SOURCE, /const hasAgentDoneNotification = resolvedAgentActivityMode === "completed" && agentDoneRuns\.length > 0;/);
	assert.match(SOURCE, /const hasActiveAgentActivityShell = resolvedAgentActivityMode === "working"[\s\S]*\|\| resolvedAgentActivityMode === "awaiting-input"[\s\S]*\|\| hasAgentDoneNotification;/);
	assert.match(SOURCE, /const agentActivitySurfaceInset = hasActiveAgentActivityShell \? 5 : 0;/);
	assert.match(SOURCE, /const agentActivitySurfaceClassName = cn\([\s\S]*"pointer-events-none absolute border"[\s\S]*`\$\{agentActivityIdleBorderClassName\} bg-surface`/);
	assert.doesNotMatch(SOURCE, /agentActivityShellPadding/);
	assert.doesNotMatch(SOURCE, /agentActivityBackdropOutset/);
	assert.match(SOURCE, /data-agent-activity-mode=\{resolvedAgentActivityMode\}/);
});

test("Jira issue completed agent flyouts retain hover through their visible shadow edge", () => {
	assert.match(
		COMPLETED_RUNS_SOURCE,
		/<HoverCardContent[\s\S]*positionerClassName="z-\[575\] after:pointer-events-auto after:absolute after:-inset-2 after:-z-10 after:content-\[''\]"/u,
	);
});

test("Jira issue aggregates completed agents into a Finished row with failure priority", () => {
	assert.match(COMPLETED_RUNS_SOURCE, /export interface JiraIssueCompletedAgentRun \{[\s\S]*summary: string;[\s\S]*agentName: string;[\s\S]*agentAvatarSrc\?: string;[\s\S]*agentBrandName\?: ThirdPartyLogoName;[\s\S]*issueKey: string;[\s\S]*issueSummary: string;[\s\S]*relativeTime\?: string;[\s\S]*completedAtMs\?: number;[\s\S]*completedSecondsAgo\?: number;[\s\S]*state: JiraIssueCompletedAgentRunState;/);
	assert.match(COMPLETED_RUNS_SOURCE, /completedAtMs: run\.completedAtMs,[\s\S]*completedSecondsAgo: run\.completedSecondsAgo,/u);
	assert.equal((COMPLETED_RUNS_SOURCE.match(/brandName: run\.agentBrandName,/gu) ?? []).length, 3);
	assert.match(COMPLETED_RUNS_SOURCE, /import \{[\s\S]*AgentList,[\s\S]*type AgentListItem,[\s\S]*\} from "@\/components\/blocks\/agent-list";/u);
	assert.match(COMPLETED_RUNS_SOURCE, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent";/u);
	assert.match(COMPLETED_RUNS_SOURCE, /function toCompletedAgentListItem\(run: JiraIssueCompletedAgentRun\): AgentListItem \{[\s\S]*state: "complete",[\s\S]*title: run\.summary,/u);
	assert.match(COMPLETED_RUNS_SOURCE, /const finishedLabel = `\$\{runs\.length\} Finished`;/u);
	assert.match(COMPLETED_RUNS_SOURCE, /const hasFailedRun = runs\.some\(\(run\) => run\.state === "failed"\);/u);
	assert.match(COMPLETED_RUNS_SOURCE, /<section aria-label="Agent review" className="flex w-full min-w-0 flex-col overflow-hidden px-1 py-1">/u);
	assert.match(COMPLETED_RUNS_SOURCE, /<HoverCard open=\{aggregateOpen\} onOpenChange=\{handleAggregateOpenChange\}>[\s\S]*aria-label=\{hasFailedRun \? `\$\{finishedLabel\}, includes errors` : finishedLabel\}[\s\S]*data-slot="jira-issue-agent-row"[\s\S]*<span className="ml-px grid size-4 shrink-0 place-items-center text-text-subtlest" aria-hidden="true">\s*<AiAgentIcon label="" \/>[\s\S]*\{finishedLabel\}[\s\S]*hasFailedRun \? \([\s\S]*<StatusErrorIcon/u);
	assert.match(COMPLETED_RUNS_SOURCE, /className="flex h-6 w-full[^"]*rounded-b-\[6px\] rounded-t-sm[^"]*"/u);
	assert.match(COMPLETED_RUNS_SOURCE, /<AgentList[\s\S]*className="w-full border-0 bg-surface-overlay shadow-2xl"[\s\S]*flyout="none"[\s\S]*items=\{completedItems\}[\s\S]*renderFlyout=\{renderCompletedRunFlyout\}[\s\S]*variant="compact"/u);
	assert.match(COMPLETED_RUNS_SOURCE, /import \{ JiraActivityChangedFiles \}/u);
	assert.match(COMPLETED_RUNS_SOURCE, /function renderCompletedRunFlyout\([\s\S]*item: AgentListItem,[\s\S]*\{ close \}: AgentListCustomFlyoutActions,[\s\S]*\)[\s\S]*<JiraActivityChangedFiles[\s\S]*entry=\{getCompletedRunEntry\(run\)\}[\s\S]*status=\{run\.state\}/u);
	assert.doesNotMatch(COMPLETED_RUNS_SOURCE, /pullRequestNumber=\{run\.pullRequestNumber\}/u);
	assert.match(CHANGED_FILES_SOURCE, /<ArtifactList[\s\S]*onOpen=\{onOutputOpen\}/u);
	assert.match(
		COMPLETED_RUNS_SOURCE,
		/onOutputOpen=\{\(output\) => \{[\s\S]*if \(output\.pullRequest\) \{[\s\S]*close\(\);[\s\S]*handleAggregateOpenChange\(false\);[\s\S]*onReview\?\.\(run\);/u,
		"opening a pull-request review should dismiss its agent flyout first",
	);
	assert.match(SOURCE, /onAgentDoneRunReview\?: \(run: JiraIssueCompletedAgentRun\) => void;/u);
	assert.match(SOURCE, /<JiraIssueAgentDone[\s\S]*onReview=\{onAgentDoneRunReview\}/u);
	assert.match(CHANGED_FILES_SOURCE, /const statusPresentation = status === "failed"[\s\S]*<StatusErrorIcon[\s\S]*: null/u);
	assert.match(COMPLETED_RUNS_SOURCE, /footer=\{[\s\S]*<AgentStatesComposer[\s\S]*onSubmit=\{\(prompt\) => onSubmit\?\.\(run, prompt\)\}/u);
	assert.match(COMPLETED_RUNS_SOURCE, /className="w-full"[\s\S]*variant="jira-issue"/u);
	assert.match(AGENT_STATES_SOURCE, /export function AgentStatesComposer/u);
	assert.doesNotMatch(SOURCE, /showSeparator/);
	assert.match(SOURCE, /<JiraIssueAgentActivityRows[\s\S]*onOpenChange=\{handleAgentActivityOpenChange\}[\s\S]*<AnimatePresence initial=\{false\} mode="popLayout">[\s\S]*key="agent-review"[\s\S]*<JiraIssueAgentDone[\s\S]*onOpenChange=\{handleAgentActivityOpenChange\}[\s\S]*runs=\{agentDoneRuns\}/u);
});

test("Jira issue animates agent state transitions with Motion", () => {
	assert.match(SOURCE, /import \{ AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition \} from "motion\/react";/);
	assert.doesNotMatch(SOURCE, /framer-motion/);
	assert.match(SOURCE, /const JIRA_ISSUE_MOTION_ENTER: Transition = \{ duration: 0\.15, ease: \[0\.4, 1, 0\.6, 1\] \}; \/\/ duration-normal \+ ease-out-practical/);
	assert.match(SOURCE, /const JIRA_ISSUE_MOTION_EXIT: Transition = \{ duration: 0\.1, ease: \[0\.6, 0, 0\.8, 0\.6\] \}; \/\/ duration-fast \+ ease-in/);
	assert.match(SOURCE, /const JIRA_ISSUE_MOTION_LAYOUT: Transition = \{ duration: 0\.2, ease: \[0\.4, 0, 0, 1\] \}; \/\/ duration-medium \+ ease-in-out/);
	assert.match(SOURCE, /const JIRA_ISSUE_MOTION_REDUCED: Transition = \{ duration: 0 \};/);
	assert.match(SOURCE, /const shouldReduceMotion = useReducedMotion\(\);/);
	assert.match(SOURCE, /function getJiraIssuePresenceMotion\(shouldReduceMotion: boolean \| null\)[\s\S]*initial: false/);
	assert.match(AGENT_ACTIVITY_SOURCE, /<AnimatePresence initial=\{false\} mode="popLayout">[\s\S]*\{summary \? \([\s\S]*<motion\.div[\s\S]*key=\{`\$\{summary\.priorityState\}-\$\{summary\.activityCount\}`\}[\s\S]*exit=\{presenceMotion\.exit\}[\s\S]*initial=\{presenceMotion\.initial\}/u);
	assert.match(SOURCE, /const hasIssueRows = hasSubtasks;/);
	assert.match(SOURCE, /const issueRowsClassName = cn\("pt-1", !\(hasSubtasks && resolvedSubtasksExpanded\) && "pb-1"\);/);
	assert.match(SOURCE, /<JiraIssueAgentActivityRows[\s\S]*<AnimatePresence initial=\{false\} mode="popLayout">[\s\S]*key="agent-review"[\s\S]*<JiraIssueAgentDone[\s\S]*runs=\{agentDoneRuns\}/u);
	assert.match(SOURCE, /const usesAgentActivityShell = hasAgentActivityPresentation;/);
	assert.match(SOURCE, /const agentActivityBackdropAnimation = \{[\s\S]*left: 0,[\s\S]*opacity: hasActiveAgentActivityShell \? 1 : 0,[\s\S]*right: 0,[\s\S]*top: 0/);
	assert.match(SOURCE, /an inset of 5 gives the active agent shell a visible 4px reveal/);
	assert.match(SOURCE, /const agentActivitySurfacePosition = agentActivitySurfaceInset - 1;/);
	assert.match(SOURCE, /const agentActivitySurfaceAnimation = \{[\s\S]*bottom: -1,[\s\S]*left: agentActivitySurfacePosition,[\s\S]*right: agentActivitySurfacePosition,[\s\S]*top: agentActivitySurfacePosition/);
	assert.match(SOURCE, /<article[\s\S]*className=\{agentActivityArticleClassName\}[\s\S]*data-agent-activity-mode=\{resolvedAgentActivityMode\}/);
	assert.match(SOURCE, /<motion\.div[\s\S]*className=\{agentActivityShellClassName\}[\s\S]*initial=\{false\}[\s\S]*layout=\{shouldReduceMotion \? false : "size"\}/);
	assert.match(SOURCE, /<motion\.div[\s\S]*aria-hidden="true"[\s\S]*animate=\{shouldReduceMotion \? undefined : agentActivityBackdropAnimation\}[\s\S]*className="pointer-events-none absolute bg-bg-accent-gray-subtlest"/);
	assert.match(SOURCE, /<motion\.div[\s\S]*animate=\{shouldReduceMotion \? undefined : agentActivitySurfaceAnimation\}[\s\S]*className=\{agentActivitySurfaceClassName\}[\s\S]*data-slot="jira-issue-surface"/);
	assert.doesNotMatch(SOURCE, /padding: shouldReduceMotion/);
	assert.match(SOURCE, /<LayoutGroup id=\{agentActivityLayoutGroupId\}>[\s\S]*<JiraIssueAgentActivityRows[\s\S]*activities=\{activeAgentActivities\}[\s\S]*onQuestionSubmit=\{onAgentActivityQuestionSubmit\}[\s\S]*onViewChat=\{onAgentActivityViewChat\}[\s\S]*shouldReduceMotion=\{shouldReduceMotion\}[\s\S]*\/>[\s\S]*<\/LayoutGroup>/);
	assert.match(SOURCE, /transformOrigin: "top center"/);
	assert.match(SOURCE, /const AGENT_ACTIVITY_INNER_STYLE: CSSProperties = \{[\s\S]*transformOrigin: "top center"/);
	assert.doesNotMatch(SOURCE, /layout=\{!shouldReduceMotion\}/);
	assert.match(SOURCE, /layout=\{shouldReduceMotion \? false : "position"\}/);
	assert.match(SOURCE, /style=\{shouldReduceMotion \? undefined : JIRA_ISSUE_MOTION_STYLE\}/);
});

test("Jira issue compensates expanded subtask spacing for the active surface inset", () => {
	assert.match(SOURCE, /hasInsetSurface: boolean;/);
	assert.match(SOURCE, /className=\{cn\("flex flex-col gap-2 px-3 pt-1", hasInsetSurface \? "pb-2" : "pb-3"\)\}/);
	assert.match(SOURCE, /<JiraIssueSubtasks[\s\S]*hasInsetSurface=\{hasActiveAgentActivityShell\}/);
});

test("Jira issue parent epic demo includes issue context and a collapsed subtasks row", () => {
	assert.match(PAGE_SOURCE, /const hasCompactIssueContext = isSubtasksVariant \|\| isParentEpicVariant;/);
	assert.match(PAGE_SOURCE, /const issueKey = isParentEpicVariant \? "JDSN-157" : isSubtasksVariant \? "JDSN-229" : "RFP-101";/);
	assert.match(PAGE_SOURCE, /const summary = isParentEpicVariant[\s\S]*\? "Next best action"[\s\S]*: isSubtasksVariant[\s\S]*\? "Venn's test"/);
	assert.match(PAGE_SOURCE, /issueKey=\{issueKey\}/);
	assert.match(PAGE_SOURCE, /assigneeUnassignedKind=\{hasCompactIssueContext \? "person" : undefined\}/);
	assert.match(PAGE_SOURCE, /showPriorityIndicator=\{!isParentEpicVariant\}/);
	assert.match(PAGE_SOURCE, /subtasks=\{hasCompactIssueContext \? JIRA_ISSUE_DEMO_SUBTASKS : undefined\}/);
	assert.match(PAGE_SOURCE, /summary=\{summary\}/);
});

test("Jira issue agent activity demo is registered in docs and variant registry", () => {
	assert.match(PAGE_SOURCE, /variant\?: "default" \| "experimental" \| "uncaptured-work" \| "subtasks-collapsed" \| "subtasks-expanded" \| "parent-epic" \| "agent-activity-states" \| "agent-activity-states-experimental";/);
	assert.match(PAGE_SOURCE, /const JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES = \[/);
	assert.match(PAGE_SOURCE, /const SERVICE_IMPACT_AGENT_LABELS = \[[\s\S]*"Reading linked design notes"[\s\S]*"Mapping customer-facing impact"/);
	assert.match(PAGE_SOURCE, /const DEPENDENCY_MAPPER_LABELS = \[[\s\S]*"Following linked work items"[\s\S]*"Finding blocked handoffs"/);
	assert.match(PAGE_SOURCE, /id: "service-impact-agent"[\s\S]*labels: SERVICE_IMPACT_AGENT_LABELS,[\s\S]*cycleIntervalMs: 5200,[\s\S]*cycleIntervalJitterMs: 1600/);
	assert.match(PAGE_SOURCE, /id: "dependency-mapper"[\s\S]*labels: DEPENDENCY_MAPPER_LABELS,[\s\S]*cycleIntervalMs: 6800,[\s\S]*cycleIntervalJitterMs: 2200/);
	assert.match(PAGE_SOURCE, /const JIRA_ISSUE_AWAITING_INPUT_ACTIVITIES = \[[\s\S]*\.\.\.JIRA_ISSUE_AGENT_ACTIVITIES\[0\],[\s\S]*label: "Needs input"[\s\S]*state: "awaiting-input"[\s\S]*JIRA_ISSUE_AGENT_ACTIVITIES\[1\]/);
	assert.match(PAGE_SOURCE, /import \{ RovoChatProvider \} from "@\/app\/contexts";/);
	assert.match(PAGE_SOURCE, /import \{ ASX_CHAT_AGENT_PROFILES \} from "@\/components\/projects\/jira-golden-journeys-v0\/data\/agent-chat-data";/);
	assert.match(PAGE_SOURCE, /import \{ AsxRovoOverlay \} from "@\/components\/projects\/jira-golden-journeys-v0\/components\/jira-golden-journeys-v0-rovo-overlay";/);
	assert.match(PAGE_SOURCE, /import \{ useAsxAgentChatDemo \} from "@\/components\/projects\/jira-golden-journeys-v0\/hooks\/use-jira-golden-journeys-v0-agent-chat-demo";/);
	assert.match(PAGE_SOURCE, /import \{[\s\S]*JiraIssue,[\s\S]*type JiraIssueAgentActivity,[\s\S]*type JiraIssueCompletedAgentRun,[\s\S]*type JiraIssueGenerativeActionRequest,[\s\S]*\} from "@\/components\/blocks\/jira-issue";/);
	// The demo drops into the floating chat with the activity's agent already
	// selected (matching ASX), not a blank vanilla Rovo chat.
	assert.doesNotMatch(PAGE_SOURCE, /openChat\("floating"\)/);
	assert.match(PAGE_SOURCE, /const \{ chatContextBar, externalThinkingMessageId, openAgentChat \} = useAsxAgentChatDemo\(\);/);
	assert.match(PAGE_SOURCE, /const openActivityChat = useCallback\(\(activity: JiraIssueAgentActivity\) => \{[\s\S]*openAgentChat\(\{[\s\S]*agentId: activity\.id,[\s\S]*agentName: activity\.name,[\s\S]*question: activity\.question,[\s\S]*\}\);[\s\S]*\}, \[openAgentChat\]\);/);
	assert.match(PAGE_SOURCE, /const handleAgentActivityViewChat = openActivityChat;/);
	assert.match(PAGE_SOURCE, /const handleAgentActivityQuestionSubmit = openActivityChat;/);
	assert.match(PAGE_SOURCE, /const handleGenerativeActionSubmit = useCallback\(\(request: JiraIssueGenerativeActionRequest\) => \{[\s\S]*openAgentChat\(\{[\s\S]*request: request\.prompt,[\s\S]*\}\);[\s\S]*\}, \[openAgentChat\]\);/);
	assert.match(PAGE_SOURCE, /<RovoChatProvider agentProfiles=\{ASX_CHAT_AGENT_PROFILES\}>[\s\S]*<JiraIssueAgentActivityStatesDemo chrome=\{variant === "agent-activity-states-experimental" \? "stroke" : "raised"\} \/>[\s\S]*<\/RovoChatProvider>/);
	assert.doesNotMatch(PAGE_SOURCE, /request-review-agent/);
	assert.match(PAGE_SOURCE, /\{ value: "default", label: "Default" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "single-agent-working", label: "1 agent" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "multiple-agents-working", label: "1-n agents" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "awaiting-user-input", label: "Needs input" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "agent-completed-work", label: "Review" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "agent-dismissed-work", label: "Done" \}/);
	assert.match(PAGE_SOURCE, /className="relative flex h-full min-h-\[480px\] w-full flex-col bg-surface"/);
	assert.match(PAGE_SOURCE, /className="sticky top-0 z-10 w-full bg-surface pb-4 pt-6"/);
	assert.match(PAGE_SOURCE, /className="flex w-full flex-nowrap items-center justify-center gap-2"/);
	assert.match(PAGE_SOURCE, /className="flex flex-1 items-start justify-center overflow-visible px-6 pb-10 pt-6"/);
	assert.doesNotMatch(PAGE_SOURCE, /flex min-h-0 flex-1 items-start justify-center px-6 pb-6 pt-8/);
	assert.doesNotMatch(PAGE_SOURCE, /grid w-full grid-cols-5/);
	assert.doesNotMatch(PAGE_SOURCE, /w-full min-w-0 justify-center overflow-hidden text-ellipsis/);
	assert.doesNotMatch(PAGE_SOURCE, /text-xs/);
	assert.doesNotMatch(PAGE_SOURCE, /\{ value: "single-agent-working", label: "Single agent working" \}/);
	assert.doesNotMatch(PAGE_SOURCE, /\{ value: "multiple-agents-working", label: "Multiple agents working" \}/);
	assert.doesNotMatch(PAGE_SOURCE, /\{ value: "awaiting-user-input", label: "Awaiting user input" \}/);
	assert.doesNotMatch(PAGE_SOURCE, /\{ value: "agent-completed-work", label: "Agent completed work" \}/);
	assert.doesNotMatch(PAGE_SOURCE, /flex flex-wrap items-center justify-center gap-2/);
	assert.match(PAGE_SOURCE, /agentActivityState === "awaiting-user-input"[\s\S]*\? JIRA_ISSUE_AWAITING_INPUT_ACTIVITIES/);
	assert.match(PAGE_SOURCE, /subtasks=\{JIRA_ISSUE_DEMO_SUBTASKS\}/);
	assert.doesNotMatch(PAGE_SOURCE, /subtasks=\{agentActivityState === "agent-completed-work" \? JIRA_ISSUE_DEMO_SUBTASKS : undefined\}/);
	assert.match(PAGE_SOURCE, /setAgentActivityState\(state\.value\)/);
	assert.match(PAGE_SOURCE, /agentDoneRuns=\{agentActivityState === "agent-completed-work" \? JIRA_ISSUE_COMPLETED_AGENT_RUNS : undefined\}/);
	assert.match(PAGE_SOURCE, /generativeAction=\{\{[\s\S]*onSubmit: handleGenerativeActionSubmit,[\s\S]*\}\}/);
	assert.match(PAGE_SOURCE, /onAgentActivityViewChat=\{handleAgentActivityViewChat\}/);
	assert.match(PAGE_SOURCE, /<AsxRovoOverlay[\s\S]*chatContextBar=\{chatContextBar\}[\s\S]*externalThinkingMessageId=\{externalThinkingMessageId\}[\s\S]*onQuestionAnswer=\{pendingChatQuestion \? handleChatQuestionAnswer : undefined\}[\s\S]*\/>/);
	assert.doesNotMatch(PAGE_SOURCE, /<FloatingRovoButton/);
	assert.doesNotMatch(PAGE_SOURCE, /<RovoFloatingChat/);
	assert.match(DEMO_SOURCE, /export function JiraIssueDemoAgentActivityStates\(\)/);
	assert.match(DEMO_SOURCE, /<JiraIssuePage variant="agent-activity-states" \/>/);
	assert.match(DETAILS_SOURCE, /demoSlug: "jira-issue-demo-agent-activity-states"/);
	assert.match(DETAILS_SOURCE, /name: "agentActivities"/);
	assert.match(DETAILS_SOURCE, /name: "agentDoneRuns"/);
	assert.match(DETAILS_SOURCE, /name: "onAgentActivityViewChat"/);
	assert.match(DETAILS_SOURCE, /name: "onAgentDoneRunView"/);
	assert.match(DETAILS_SOURCE, /name: "onAgentDoneRunSubmit"/);
	assert.match(VARIANT_REGISTRY_SOURCE, /"jira-issue-demo-agent-activity-states": dynamic\(/);
	assert.match(VARIANT_REGISTRY_SOURCE, /default: mod\.JiraIssueDemoAgentActivityStates/);
});

test("Jira issue agent activity demo has an experimental stroke-chrome duplicate", () => {
	// The experimental duplicate reuses the same demo component and only swaps
	// the card chrome, so the two sections cannot drift apart.
	assert.match(PAGE_SOURCE, /const isAgentActivityVariant = variant === "agent-activity-states" \|\| variant === "agent-activity-states-experimental";/);
	assert.match(PAGE_SOURCE, /interface JiraIssueAgentActivityStatesDemoProps \{[\s\S]*chrome\?: JiraIssueChrome;[\s\S]*\}/);
	assert.match(PAGE_SOURCE, /function JiraIssueAgentActivityStatesDemo\(\{ chrome = "raised" \}: Readonly<JiraIssueAgentActivityStatesDemoProps> = \{\}\): React\.ReactElement \{/);
	assert.match(PAGE_SOURCE, /<JiraIssue[\s\S]*chrome=\{chrome\}/);
	assert.match(DEMO_SOURCE, /export function JiraIssueDemoAgentActivityStatesExperimental\(\)/);
	assert.match(DEMO_SOURCE, /<JiraIssuePage variant="agent-activity-states-experimental" \/>/);
	assert.match(DETAILS_SOURCE, /id: "agent-activity-states-experimental"[\s\S]*demoSlug: "jira-issue-demo-agent-activity-states-experimental"/);
	assert.match(VARIANT_REGISTRY_SOURCE, /"jira-issue-demo-agent-activity-states-experimental": dynamic\(/);
	assert.match(VARIANT_REGISTRY_SOURCE, /default: mod\.JiraIssueDemoAgentActivityStatesExperimental/);
});

test("Jira issue renders expandable subtasks with nested subtask cards", () => {
	assert.match(SOURCE, /subtasks\?: readonly JiraIssueSubtask\[\];/);
	assert.match(SOURCE, /aria-expanded=\{expanded\}/);
	assert.match(SOURCE, /const subtasksToggleLabel = `\$\{expanded \? "Hide" : "Show"\} \$\{label\.toLowerCase\(\)\}`;/);
	assert.match(SUBTASKS_BLOCK, /<Tooltip>/);
	assert.match(SUBTASKS_BLOCK, /aria-label=\{subtasksToggleLabel\}/);
	assert.match(SUBTASKS_BLOCK, /<TooltipContent>\{subtasksToggleLabel\}<\/TooltipContent>/);
	assert.match(SOURCE, /function JiraIssueSeparator\(\{ inset = 0 \}: Readonly<\{ inset\?: number \}>\) \{[\s\S]*marginLeft: `\$\{inset - 1\}px`,[\s\S]*marginRight: `\$\{inset - 1\}px`,[\s\S]*width: `calc\(100% \+ \$\{2 - inset \* 2\}px\)`,/);
	assert.doesNotMatch(SUBTASKS_BLOCK, /<JiraIssueSeparator \/>/);
	assert.match(SOURCE, /<JiraIssueSeparator inset=\{usesAgentActivityShell \? agentActivitySurfaceInset : 0\} \/>[\s\S]*<div className=\{issueRowsClassName\}>/);
	assert.match(SUBTASKS_BLOCK, /className="flex h-8 w-full items-center justify-between px-3 py-2"/);
	assert.match(SUBTASKS_BLOCK, /className="flex items-center gap-2 text-sm font-medium leading-5 text-text-subtle"/);
	assert.match(SUBTASKS_BLOCK, /<span className="grid size-4 shrink-0 place-items-center text-icon-subtle" aria-hidden="true">\s*<SubtasksIcon label="" size="medium" spacing="none" color="currentColor" \/>/);
	assert.match(SUBTASKS_BLOCK, /className="inline-flex size-6 items-center justify-center rounded-sm/);
	assert.doesNotMatch(SUBTASKS_BLOCK, /className="flex h-12 w-full items-center justify-between px-4"/);
	assert.doesNotMatch(SUBTASKS_BLOCK, /inline-flex size-8 items-center/);
	assert.doesNotMatch(SUBTASKS_BLOCK, /hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring[\s\S]*onClick=\{onToggle\}/);
	assert.doesNotMatch(SOURCE, /role="progressbar"/);
	assert.doesNotMatch(SOURCE, /progressPercent/);
	assert.match(SOURCE, /<JiraIssueSubtaskCard key=\{subtask\.issueKey\} subtask=\{subtask\} \/>/);
	assert.match(SOURCE, /className="border border-transparent bg-surface p-3"/);
	assert.match(SOURCE, /boxShadow: token\("elevation\.shadow\.raised"\)/);
	assert.doesNotMatch(SOURCE, /className="border border-transparent bg-surface px-4 py-3"/);
	assert.doesNotMatch(SOURCE, /rounded-lg border border-border bg-surface px-3 py-3 shadow-sm/);
});

test("Jira issue renders explicit unassigned avatars with the shared placeholder", () => {
	assert.match(SOURCE, /AvatarUnassigned,/);
	assert.match(SOURCE, /assigneeUnassignedKind\?: AvatarUnassignedKind;/);
	assert.match(SOURCE, /function JiraIssueAssignee[\s\S]*if \(assigneeUnassignedKind\) \{[\s\S]*<AvatarUnassigned[\s\S]*kind=\{assigneeUnassignedKind\}[\s\S]*size="sm"/);
});

test("Jira issue assignee avatars honor the shared hexagon shape for agents", () => {
	assert.match(SOURCE, /assigneeAvatarShape\?: NonNullable<AvatarProps\["shape"\]>;/);
	assert.match(SOURCE, /assigneeAvatarShape = "circle"/);
	assert.match(SOURCE, /function JiraIssueAssignee[\s\S]*shape=\{assigneeAvatarShape\}/);
});
