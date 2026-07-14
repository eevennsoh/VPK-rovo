const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const GENERATIVE_SOURCE = readFileSync(join(__dirname, "generative-action-menu.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const DEMO_SOURCE = readFileSync(join(__dirname, "../../website/demos/blocks/jira-issue-demo.tsx"), "utf8");
const DETAILS_SOURCE = readFileSync(join(__dirname, "../../../app/data/details/blocks/jira-issue.ts"), "utf8");
const REGISTRY_SOURCE = readFileSync(join(__dirname, "../../website/registry/blocks.ts"), "utf8");
const SHIMMER_SOURCE = readFileSync(join(__dirname, "../../ui-custom/shimmer.tsx"), "utf8");
const ROOT_CLASS_BLOCK = SOURCE.slice(
	SOURCE.indexOf("const rootClassName = cn("),
	SOURCE.indexOf("function handleSubtasksToggle"),
);
const SUBTASKS_BLOCK = SOURCE.slice(
	SOURCE.indexOf("function JiraIssueSubtasks"),
	SOURCE.indexOf("export function JiraIssue"),
);

test("Jira issue focus border stays inside the card and uses the focused border token", () => {
	assert.match(SOURCE, /"group\/jira-issue relative w-full border outline-none focus-visible:border-ring"/);
	assert.doesNotMatch(SOURCE, /border: "none"/);
});

test("Jira issue default width can be overridden by a kanban-column demo width class", () => {
	assert.doesNotMatch(SOURCE, /width: "100%"/);
	assert.match(SOURCE, /className,\n\t\)/);
});

test("Jira issue exposes selected and dragging states on the root button", () => {
	assert.match(SOURCE, /aria-pressed=\{ariaPressed \?\? selected\}/);
	assert.match(SOURCE, /data-selected=\{selected \|\| undefined\}/);
	assert.match(SOURCE, /data-dragging=\{dragging \|\| undefined\}/);
	assert.match(SOURCE, /cursor: dragging \? "grabbing" : draggable \? "grab" : "default"/);
});

test("Jira issue exposes agent activity state props", () => {
	assert.match(SOURCE, /export type JiraIssueAgentActivityMode = "none" \| "working" \| "awaiting-input" \| "completed";/);
	assert.match(SOURCE, /export type JiraIssueAgentActivityState = "working" \| "awaiting-input" \| "completed";/);
	assert.match(SOURCE, /export interface JiraIssueAgentActivity \{[\s\S]*id: string;[\s\S]*name: string;[\s\S]*avatarSrc\?: string;[\s\S]*label: string;[\s\S]*labels\?: readonly string\[\];[\s\S]*cycleIntervalJitterMs\?: number;[\s\S]*cycleIntervalMs\?: number;[\s\S]*state: JiraIssueAgentActivityState;/);
	assert.match(SOURCE, /agentActivities\?: readonly JiraIssueAgentActivity\[\];/);
	assert.match(SOURCE, /agentDoneCount\?: number;/);
	assert.match(SOURCE, /agentActivityMode\?: JiraIssueAgentActivityMode;/);
	assert.match(SOURCE, /onAgentActivityViewChat\?: \(activity: JiraIssueAgentActivity\) => void;/);
	assert.match(SOURCE, /generativeAction\?: JiraIssueGenerativeActionConfig;/);
	assert.match(SOURCE, /export type \{[\s\S]*JiraIssueGenerativeActionConfig,[\s\S]*JiraIssueGenerativeActionRequest,[\s\S]*\} from "@\/components\/blocks\/jira-issue\/generative-action-menu";/);
});

test("Jira issue uses the 8px large radius token", () => {
	assert.match(SOURCE, /borderRadius: token\("radius\.large"\)/);
	assert.doesNotMatch(SOURCE, /borderRadius: token\("radius\.small"\)/);
});

test("Jira issue switches rich variants to an article with internal controls", () => {
	assert.match(SOURCE, /const hasAgentActivityPresentation = agentActivityMode !== undefined \|\| Boolean\(agentActivities\?\.length\) \|\| hasAgentDoneNotification;/);
	assert.match(SOURCE, /const hasInteractiveContent = hasSubtasks \|\| Boolean\(parentEpicControl\) \|\| hasAgentActivityPresentation \|\| Boolean\(generativeAction\);/);
	assert.match(SOURCE, /<article[\s\S]*data-selected=\{selected \|\| undefined\}/);
	assert.match(SOURCE, /draggable=\{draggable\}/);
	assert.match(SOURCE, /props\.onClick \? \([\s\S]*aria-pressed=\{ariaPressed \?\? selected\}/);
	assert.match(SOURCE, /parentEpicControl\?: ReactNode;/);
	assert.match(SOURCE, /parentEpicControl=\{parentEpicControl\}/);
	assert.match(SOURCE, /<p className="text-sm font-semibold leading-5 text-text-subtle">Parent<\/p>/);
	assert.match(SOURCE, /showPriorityIndicator\?: boolean;/);
	assert.match(SOURCE, /\{showPriorityIndicator \? <PriorityIcon label=\{`\$\{priority\} priority`\} color=\{priorityColor\} \/> : null\}/);
	assert.match(SOURCE, /className="w-full p-3 text-left outline-none/);
	assert.match(SOURCE, /<div className="p-3">\{summaryContent\}<\/div>/);
	assert.match(SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/);
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
	assert.match(SOURCE, /const generativeActionMenu = generativeAction \? \([\s\S]*<JiraIssueGenerativeActionMenu action=\{generativeAction\} issue=\{\{ issueKey, summary \}\} \/>/);
	assert.match(SOURCE, /const hasInteractiveContent = hasSubtasks \|\| Boolean\(parentEpicControl\) \|\| hasAgentActivityPresentation \|\| Boolean\(generativeAction\);/);
	assert.match(SOURCE, /\{generativeActionMenu\}/);
	assert.match(SOURCE, /"group\/jira-issue relative w-full overflow-visible outline-none"/);

	assert.match(GENERATIVE_SOURCE, /import GenerativeIndicatorIcon from "@atlaskit\/icon-lab\/core\/generative-indicator";/);
	assert.match(GENERATIVE_SOURCE, /import \{ EDITOR_PALETTE_MENTION_SOURCES \} from "@\/components\/blocks\/editor-palette\/data\/mention-sources";/);
	assert.match(GENERATIVE_SOURCE, /RichTextCommandMenuSearchField,[\s\S]*RichTextSuggestionMenu,[\s\S]*getMentionChildItems,/);
	assert.match(GENERATIVE_SOURCE, /export interface JiraIssueGenerativeActionConfig \{[\s\S]*ariaLabel\?: string;[\s\S]*onSubmit: \(request: JiraIssueGenerativeActionRequest\) => void \| Promise<void>;/);
	assert.match(GENERATIVE_SOURCE, /export interface JiraIssueGenerativeActionRequest \{[\s\S]*kind: JiraIssueGenerativeActionKind;[\s\S]*prompt: string;[\s\S]*issue: JiraIssueGenerativeActionIssue;[\s\S]*selectedItem\?: JiraIssueGenerativeActionSelectedItem;/);
	assert.match(GENERATIVE_SOURCE, /className=\{cn\([\s\S]*"absolute top-2 -right-6 z-20 inline-flex size-4[\s\S]*group-hover\/jira-issue:opacity-100 group-focus-within\/jira-issue:opacity-100 data-open:opacity-100/);
	assert.match(GENERATIVE_SOURCE, /<GenerativeIndicatorIcon label="" size="small" spacing="none" color="currentColor" \/>/);
	assert.match(GENERATIVE_SOURCE, /className="inline-flex size-3 items-center justify-center \[&>span\]:size-3 \[&_svg\]:size-3"/);
	assert.match(GENERATIVE_SOURCE, /boxShadow: token\("elevation\.shadow\.overlay"\)/);
	assert.match(GENERATIVE_SOURCE, /<PopoverContent[\s\S]*align="start"[\s\S]*className="z-\[600\] w-\[360px\] gap-0 overflow-hidden border border-border bg-surface-overlay p-0 text-text shadow-xl"[\s\S]*positionerClassName="z-\[600\]"[\s\S]*side="right"[\s\S]*sideOffset=\{8\}/);
	assert.match(GENERATIVE_SOURCE, /className="rich-text-command-menu-embedded"/);
	assert.match(GENERATIVE_SOURCE, /<RichTextCommandMenuSearchField[\s\S]*icon=\{<RovoColorIcon size="xxsmall" \/>\}[\s\S]*label="Ask Rovo"/);
	assert.match(GENERATIVE_SOURCE, /getMentionChildItems\(EDITOR_PALETTE_MENTION_SOURCES, "skill"\)/);
	assert.match(GENERATIVE_SOURCE, /headingLabel: "Skills"/);
	assert.match(GENERATIVE_SOURCE, /getMentionChildItems\(EDITOR_PALETTE_MENTION_SOURCES, "subagent"\)/);
	assert.match(GENERATIVE_SOURCE, /headingLabel: "Agents"/);
	assert.match(GENERATIVE_SOURCE, /return `\$\{prompt\.trim\(\)\}\\n\\nJira issue \$\{issue\.issueKey\}: \$\{issue\.summary\}`;/);
	assert.match(GENERATIVE_SOURCE, /return `Use the "\$\{item\.label\}" skill for Jira issue \$\{issue\.issueKey\}: \$\{issue\.summary\}\.`;/);
	assert.match(GENERATIVE_SOURCE, /return `Ask "\$\{item\.label\}" to help with Jira issue \$\{issue\.issueKey\}: \$\{issue\.summary\}\.`;/);
	assert.match(DETAILS_SOURCE, /name: "generativeAction"/);
});

test("Jira issue uses the VPK Badge primitive for row counts", () => {
	assert.match(SOURCE, /function JiraIssueCountBadge\(\{ children \}: Readonly<\{ children: ReactNode \}>\) \{\n\treturn \(\n\t\t<Badge className="h-5 min-w-0 rounded-sm px-1\.5 font-semibold text-text-subtle" max=\{false\} variant="neutral">/);
	assert.match(SOURCE, /<JiraIssueCountBadge>\{completedCount\}\/\{totalCount\}<\/JiraIssueCountBadge>/);
	assert.match(SOURCE, /<JiraIssueCountBadge>\{count\}<\/JiraIssueCountBadge>/);
	assert.doesNotMatch(SOURCE, /rounded-sm bg-bg-neutral px-1\.5 py-0\.5 text-xs font-semibold leading-4 text-text-subtle/);
});

test("Jira issue renders agent activity rows with shimmer and awaiting-input dots", () => {
	assert.match(SOURCE, /import \{ Shimmer \} from "@\/components\/ui-custom\/shimmer";/);
	assert.match(SOURCE, /import \{ AnimatedDots \} from "@\/components\/ui-custom\/animated-dots";/);
	assert.match(SOURCE, /import \{ HoverCard, HoverCardContent, HoverCardTrigger \} from "@\/components\/ui\/hover-card";/);
	assert.match(SOURCE, /import \{ FloatingComposer \} from "@\/components\/projects\/shared\/components\/floating-composer";/);
	assert.match(SOURCE, /import \{ PromptInputButton, PromptInputSubmit, PromptInputTextarea \} from "@\/components\/ui-custom\/prompt-input";/);
	assert.match(SOURCE, /function JiraIssueAgentActivityRow\(\{\n\tactivity,\n\tindex,\n\tonViewChat,\n\trowCount,/);
	assert.match(SOURCE, /const rowRadiusClassName = rowCount === 1[\s\S]*\? "rounded-sm"[\s\S]*index === 0[\s\S]*\? "rounded-tl-\[6px\] rounded-tr-\[6px\] rounded-bl-\[2px\] rounded-br-\[2px\]"[\s\S]*index === rowCount - 1[\s\S]*\? "rounded-tl-\[2px\] rounded-tr-\[2px\] rounded-bl-\[6px\] rounded-br-\[6px\]"[\s\S]*: "rounded-\[2px\]";/);
	assert.match(SOURCE, /"flex h-6 w-full items-center justify-between gap-2 px-2 py-1 text-left outline-none transition-colors duration-fast ease-out hover:bg-surface-hovered/);
	assert.doesNotMatch(SOURCE, /hover:bg-bg-neutral-hovered/);
	assert.doesNotMatch(SOURCE, /gap-2 rounded-sm px-3 py-1/);
	assert.match(SOURCE, /function JiraIssueAgentActivityPanel/);
	assert.match(SOURCE, /className=\{cn\("flex w-full flex-col overflow-hidden", hasActivities && "px-1 py-1"\)\}/);
	assert.match(SOURCE, /activities\.map\(\(activity, index\) =>/);
	assert.match(SOURCE, /<JiraIssueAgentActivityRow[\s\S]*activity=\{activity\}[\s\S]*index=\{index\}[\s\S]*onViewChat=\{onViewChat\}[\s\S]*rowCount=\{activities\.length\}/);
	assert.match(SOURCE, /const isAwaitingInput = activity\.state === "awaiting-input";/);
	assert.match(SOURCE, /const JIRA_ISSUE_AGENT_WORKING_LABELS = \[[\s\S]*"Figuring out which services are affected"[\s\S]*"Checking dependent components"[\s\S]*"Reviewing linked work items"/);
	assert.match(SOURCE, /function getJiraIssueAgentWorkingLabels\(activity: JiraIssueAgentActivity\): readonly string\[\]/);
	assert.match(SOURCE, /const workingLabels = activity\.labels \?\? JIRA_ISSUE_AGENT_WORKING_LABELS;/);
	assert.match(SOURCE, /function getJiraIssueAgentCycleDelay\(intervalMs: number, jitterMs: number\): number \{[\s\S]*Math\.random\(\) \* Math\.max\(0, jitterMs\)/);
	assert.match(SOURCE, /function JiraIssueCyclingAgentLabel\(\{\n\tcycleIntervalJitterMs,\n\tcycleIntervalMs,\n\tlabels,/);
	assert.match(SOURCE, /const JIRA_ISSUE_AGENT_LABEL_TRANSITION = \{ duration: 0\.2, ease: "easeOut" \} as const;/);
	assert.match(SOURCE, /const JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS = 5200;/);
	assert.match(SOURCE, /const JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS = 1800;/);
	assert.doesNotMatch(SOURCE, /const JIRA_ISSUE_AGENT_LABEL_CYCLE_MS = 550;/);
	assert.doesNotMatch(SOURCE, /window\.setInterval/);
	assert.match(SOURCE, /window\.setTimeout\(\(\) => \{[\s\S]*getJiraIssueAgentCycleDelay\(cycleIntervalMs, cycleIntervalJitterMs\)/);
	assert.match(SOURCE, /<AnimatePresence initial=\{false\} mode="wait">[\s\S]*key=\{label\}[\s\S]*initial=\{shouldReduceMotion \? false : \{ opacity: 0, y: -4 \}\}[\s\S]*exit=\{shouldReduceMotion \? undefined : \{ opacity: 0, y: 4 \}\}/);
	assert.match(SOURCE, /duration=\{JIRA_ISSUE_AGENT_SHIMMER_DURATION\}[\s\S]*spread=\{JIRA_ISSUE_AGENT_SHIMMER_SPREAD\}[\s\S]*wave=\{false\}/);
	assert.match(SOURCE, /initialBackgroundPosition="50% center"/);
	assert.match(SHIMMER_SOURCE, /initialBackgroundPosition\?: string;/);
	assert.match(SHIMMER_SOURCE, /const resolvedInitialBackgroundPosition = initialBackgroundPosition \?\? "100% center";/);
	assert.match(SHIMMER_SOURCE, /const shimmerBackgroundPosition = useMemo\(/);
	assert.match(SHIMMER_SOURCE, /animate=\{\{ backgroundPosition: shimmerBackgroundPosition \}\}/);
	assert.match(SHIMMER_SOURCE, /initial=\{false\}/);
	assert.doesNotMatch(SHIMMER_SOURCE, /usesCssShimmerAnimation/);
	assert.doesNotMatch(SHIMMER_SOURCE, /text-gradient-shimmer/);
	assert.match(SOURCE, /const JIRA_ISSUE_AGENT_SHIMMER_DURATION = 1\.4;/);
	assert.match(SOURCE, /const JIRA_ISSUE_AGENT_SHIMMER_SPREAD = 2;/);
	assert.doesNotMatch(SOURCE, /JIRA_ISSUE_AGENT_SHIMMER_TRANSITION/);
	assert.match(SOURCE, /cycleIntervalJitterMs=\{activity\.cycleIntervalJitterMs \?\? JIRA_ISSUE_AGENT_LABEL_CYCLE_JITTER_MS\}/);
	assert.match(SOURCE, /cycleIntervalMs=\{activity\.cycleIntervalMs \?\? JIRA_ISSUE_AGENT_LABEL_CYCLE_INTERVAL_MS\}/);
	assert.match(SOURCE, /labels=\{workingLabels\}/);
	assert.match(SOURCE, /<span className="inline-flex min-w-0 items-baseline text-sm leading-5 text-text-subtlest">[\s\S]*<AnimatedDots \/>/);
	assert.doesNotMatch(SOURCE, /<AnimatedDots className="-ml-0\.5 \[&>span\]:text-sm" \/>/);
	assert.match(SOURCE, /<span className="-my-1 grid size-6 shrink-0 place-items-center text-icon-information" aria-hidden="true">\s*<StatusInformationIcon label="" size="small" color="currentColor" \/>/);
	assert.match(SOURCE, /<HoverCard closeDelay=\{120\} openDelay=\{120\}>[\s\S]*<HoverCardTrigger[\s\S]*aria-label=\{`\$\{activity\.name\}: \$\{activity\.label\}`\}[\s\S]*<HoverCardContent[\s\S]*className="w-\[520px\] max-w-\[calc\(100vw-48px\)\] rounded-xl border border-border bg-surface-overlay p-0 text-text shadow-xl"[\s\S]*<JiraIssueAgentActivityPanel activity=\{activity\} onViewChat=\{onViewChat\} \/>/);
	assert.match(SOURCE, /<Button[\s\S]*onClick=\{handleViewChat\}[\s\S]*View chat/);
	assert.match(SOURCE, /<FloatingComposer[\s\S]*addButton=\{<AvatarUnassigned kind="person" size="sm" \/>}[\s\S]*aria-label="Reply to agent"[\s\S]*<PromptInputSubmit className="rounded-full" size="icon-sm" \/>[\s\S]*<PromptInputTextarea[\s\S]*placeholder="Add a comment\.\.\."/);
	assert.match(SOURCE, /"relative w-full overflow-visible rounded-\[10px\] outline-none"/);
	assert.match(SOURCE, /"group\/jira-issue relative w-full overflow-visible outline-none"/);
	assert.match(SOURCE, /const hasActiveAgentActivityShell = resolvedAgentActivityMode === "working" \|\| resolvedAgentActivityMode === "awaiting-input";/);
	assert.match(SOURCE, /const agentActivitySurfaceInset = hasActiveAgentActivityShell \? 5 : 0;/);
	assert.match(SOURCE, /const agentActivitySurfaceClassName = cn\([\s\S]*"pointer-events-none absolute border"[\s\S]*"border-transparent bg-surface"/);
	assert.doesNotMatch(SOURCE, /agentActivityShellPadding/);
	assert.doesNotMatch(SOURCE, /agentActivityBackdropOutset/);
	assert.match(SOURCE, /data-agent-activity-mode=\{resolvedAgentActivityMode\}/);
});

test("Jira issue renders completed agent notification inside the issue body", () => {
	assert.match(SOURCE, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent";/);
	assert.match(SOURCE, /function JiraIssueAgentDone\(\{ count \}: Readonly<\{ count: number \}>\)/);
	assert.match(SOURCE, /<section aria-label="Agent done">[\s\S]*className="flex h-8 w-full items-center justify-between px-3 py-2"[\s\S]*<span className="grid size-4 shrink-0 place-items-center text-icon-subtle" aria-hidden="true">\s*<AiAgentIcon label="" size="medium" spacing="none" color="currentColor" \/>[\s\S]*<span>Agent done<\/span>[\s\S]*<JiraIssueCountBadge>\{count\}<\/JiraIssueCountBadge>/);
	assert.doesNotMatch(SOURCE, /showSeparator/);
	assert.match(SOURCE, /key="agent-done"[\s\S]*<JiraIssueAgentDone count=\{agentDoneCount\} \/>/);
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
	assert.match(SOURCE, /<AnimatePresence initial=\{false\} mode="popLayout">[\s\S]*activities\.map\(\(activity, index\) => \([\s\S]*<motion\.div[\s\S]*exit=\{presenceMotion\.exit\}[\s\S]*initial=\{presenceMotion\.initial\}/);
	assert.match(SOURCE, /const hasIssueRows = hasSubtasks \|\| hasAgentDoneNotification;/);
	assert.match(SOURCE, /const issueRowsClassName = cn\("pt-1", \(!\(hasSubtasks && resolvedSubtasksExpanded\) \|\| hasAgentDoneNotification\) && "pb-1"\);/);
	assert.match(SOURCE, /\{hasIssueRows \? \([\s\S]*<JiraIssueSeparator inset=\{usesAgentActivityShell \? agentActivitySurfaceInset : 0\} \/>[\s\S]*<div className=\{issueRowsClassName\}>[\s\S]*<AnimatePresence initial=\{false\} mode="popLayout">[\s\S]*key="agent-done"[\s\S]*<JiraIssueAgentDone count=\{agentDoneCount\} \/>/);
	assert.match(SOURCE, /const usesAgentActivityShell = hasAgentActivityPresentation;/);
	assert.match(SOURCE, /const agentActivityBackdropAnimation = \{[\s\S]*left: 0,[\s\S]*opacity: hasActiveAgentActivityShell \? 1 : 0,[\s\S]*right: 0,[\s\S]*top: 0/);
	assert.match(SOURCE, /an inset of 5 gives the active agent shell a visible 4px reveal/);
	assert.match(SOURCE, /const agentActivitySurfacePosition = agentActivitySurfaceInset - 1;/);
	assert.match(SOURCE, /const agentActivitySurfaceAnimation = \{[\s\S]*bottom: -1,[\s\S]*left: agentActivitySurfacePosition,[\s\S]*right: agentActivitySurfacePosition,[\s\S]*top: agentActivitySurfacePosition/);
	assert.match(SOURCE, /<article[\s\S]*className=\{agentActivityArticleClassName\}[\s\S]*data-agent-activity-mode=\{resolvedAgentActivityMode\}/);
	assert.match(SOURCE, /<motion\.div[\s\S]*className=\{agentActivityShellClassName\}[\s\S]*initial=\{false\}[\s\S]*layout=\{shouldReduceMotion \? false : "size"\}/);
	assert.match(SOURCE, /<motion\.div[\s\S]*aria-hidden="true"[\s\S]*animate=\{shouldReduceMotion \? undefined : agentActivityBackdropAnimation\}[\s\S]*className="pointer-events-none absolute bg-surface-sunken"/);
	assert.match(SOURCE, /<motion\.div[\s\S]*animate=\{shouldReduceMotion \? undefined : agentActivitySurfaceAnimation\}[\s\S]*className=\{agentActivitySurfaceClassName\}[\s\S]*data-slot="jira-issue-surface"/);
	assert.doesNotMatch(SOURCE, /padding: shouldReduceMotion/);
	assert.match(SOURCE, /<LayoutGroup id=\{agentActivityLayoutGroupId\}>[\s\S]*<JiraIssueAgentActivityRows[\s\S]*activities=\{activeAgentActivities\}[\s\S]*onViewChat=\{onAgentActivityViewChat\}[\s\S]*shouldReduceMotion=\{shouldReduceMotion\}[\s\S]*\/>[\s\S]*<\/LayoutGroup>/);
	assert.match(SOURCE, /transformOrigin: "top center"/);
	assert.match(SOURCE, /const agentActivityInnerStyle: CSSProperties = \{[\s\S]*transformOrigin: "top center"/);
	assert.doesNotMatch(SOURCE, /layout=\{!shouldReduceMotion\}/);
	assert.match(SOURCE, /layout=\{shouldReduceMotion \? false : "position"\}/);
	assert.match(SOURCE, /style=\{shouldReduceMotion \? undefined : JIRA_ISSUE_MOTION_STYLE\}/);
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
	assert.match(PAGE_SOURCE, /variant\?: "default" \| "subtasks-collapsed" \| "subtasks-expanded" \| "parent-epic" \| "agent-activity-states";/);
	assert.match(PAGE_SOURCE, /const JIRA_ISSUE_AGENT_ACTIVITY_DEMO_STATES = \[/);
	assert.match(PAGE_SOURCE, /const SERVICE_IMPACT_AGENT_LABELS = \[[\s\S]*"Reading linked design notes"[\s\S]*"Mapping customer-facing impact"/);
	assert.match(PAGE_SOURCE, /const DEPENDENCY_MAPPER_LABELS = \[[\s\S]*"Following linked work items"[\s\S]*"Finding blocked handoffs"/);
	assert.match(PAGE_SOURCE, /id: "service-impact-agent"[\s\S]*labels: SERVICE_IMPACT_AGENT_LABELS,[\s\S]*cycleIntervalMs: 5200,[\s\S]*cycleIntervalJitterMs: 1600/);
	assert.match(PAGE_SOURCE, /id: "dependency-mapper"[\s\S]*labels: DEPENDENCY_MAPPER_LABELS,[\s\S]*cycleIntervalMs: 6800,[\s\S]*cycleIntervalJitterMs: 2200/);
	assert.match(PAGE_SOURCE, /const JIRA_ISSUE_AWAITING_INPUT_ACTIVITIES = \[[\s\S]*\.\.\.JIRA_ISSUE_AGENT_ACTIVITIES\[0\],[\s\S]*label: "Awaiting user input"[\s\S]*state: "awaiting-input"[\s\S]*JIRA_ISSUE_AGENT_ACTIVITIES\[1\]/);
	assert.match(PAGE_SOURCE, /import \{ RovoChatProvider, useRovoChat \} from "@\/app\/contexts";/);
	assert.match(PAGE_SOURCE, /import FloatingRovoButton from "@\/components\/projects\/shared\/components\/floating-rovo-button";/);
	assert.match(PAGE_SOURCE, /import RovoFloatingChat from "@\/components\/projects\/rovo-floating-chat\/components\/rovo-floating-chat";/);
	assert.match(PAGE_SOURCE, /import \{ JiraIssue, type JiraIssueAgentActivity, type JiraIssueGenerativeActionRequest \} from "@\/components\/blocks\/jira-issue";/);
	assert.match(PAGE_SOURCE, /const \{ chatSurface, openChat, sendPrompt \} = useRovoChat\(\);/);
	assert.match(PAGE_SOURCE, /const handleAgentActivityViewChat = useCallback\(\(\) => \{[\s\S]*openChat\("floating"\);[\s\S]*\}, \[openChat\]\);/);
	assert.match(PAGE_SOURCE, /const handleGenerativeActionSubmit = useCallback\(\(request: JiraIssueGenerativeActionRequest\) => \{[\s\S]*openChat\("floating"\);[\s\S]*void sendPrompt\(request\.prompt, \{[\s\S]*messageMetadata: \{[\s\S]*source: "jira-issue-generative-action",[\s\S]*\},[\s\S]*\}\);[\s\S]*\}, \[openChat, sendPrompt\]\);/);
	assert.match(PAGE_SOURCE, /<RovoChatProvider>[\s\S]*<JiraIssueAgentActivityStatesDemo \/>[\s\S]*<\/RovoChatProvider>/);
	assert.doesNotMatch(PAGE_SOURCE, /request-review-agent/);
	assert.match(PAGE_SOURCE, /\{ value: "default", label: "Default" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "single-agent-working", label: "1 agent" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "multiple-agents-working", label: "1-n agents" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "awaiting-user-input", label: "Needs input" \}/);
	assert.match(PAGE_SOURCE, /\{ value: "agent-completed-work", label: "Done" \}/);
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
	assert.match(PAGE_SOURCE, /agentActivityState === "agent-completed-work" \? 2 : 0/);
	assert.match(PAGE_SOURCE, /generativeAction=\{\{[\s\S]*onSubmit: handleGenerativeActionSubmit,[\s\S]*\}\}/);
	assert.match(PAGE_SOURCE, /onAgentActivityViewChat=\{handleAgentActivityViewChat\}/);
	assert.match(PAGE_SOURCE, /\{chatSurface === null \? \([\s\S]*<FloatingRovoButton[\s\S]*forceVisible[\s\S]*positioning="container"[\s\S]*product="jira"[\s\S]*\/>[\s\S]*\) : null\}/);
	assert.match(PAGE_SOURCE, /\{chatSurface === "floating" \? \([\s\S]*<RovoFloatingChat key="floating-chat" \/>[\s\S]*\) : null\}/);
	assert.match(DEMO_SOURCE, /export function JiraIssueDemoAgentActivityStates\(\)/);
	assert.match(DEMO_SOURCE, /<JiraIssuePage variant="agent-activity-states" \/>/);
	assert.match(DETAILS_SOURCE, /demoSlug: "jira-issue-demo-agent-activity-states"/);
	assert.match(DETAILS_SOURCE, /name: "agentActivities"/);
	assert.match(DETAILS_SOURCE, /name: "onAgentActivityViewChat"/);
	assert.match(REGISTRY_SOURCE, /"jira-issue-demo-agent-activity-states": dynamic\(/);
	assert.match(REGISTRY_SOURCE, /default: mod\.JiraIssueDemoAgentActivityStates/);
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
