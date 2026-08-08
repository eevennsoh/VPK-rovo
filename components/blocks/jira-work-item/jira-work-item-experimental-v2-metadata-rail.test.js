const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

// Metadata-rail / Activity-chrome / Pull requests contracts for experimental-v2.
// Split from jira-work-item-experimental-v2.test.js to stay under the 1000-line budget.

const BLOCK_DIR = __dirname;

function readBlockFile(relativePath) {
	return fs.readFileSync(path.join(BLOCK_DIR, relativePath), "utf8");
}

test("experimental v2 removes the description row and relocates Activity chrome to the rail toggle", () => {
	const activityPanelSource = readBlockFile("experimental-v2/components/activity-panel.tsx");
	const contextEditableHeaderSource = readBlockFile("experimental-v2/components/context-editable-header.tsx");
	const layoutSource = readBlockFile("experimental-v2/components/experimental-work-item-layout.tsx");
	assert.match(activityPanelSource, /useSetActivityRailChrome/u);
	assert.match(activityPanelSource, /hideHeader=\{hideHeader\}/u);
	assert.match(
		activityPanelSource,
		/headerClassName=\{\s*hideHeader\s*\?\s*undefined\s*:\s*"sticky top-0 z-10 flex min-h-8 items-center bg-surface-overlay \[container-type:scroll-state\]"/u,
	);
	assert.match(activityPanelSource, /headerScrollFade=\{!hideHeader\}/u);
	assert.match(activityPanelSource, /setActivityRailChrome\(\{[\s\S]*count: entries\.length/u);
	assert.match(
		activityPanelSource,
		/mapActivityEventsToJiraEntries\(meta\.activityEvents, activityReferenceTimeMs\)/u,
	);
	assert.match(contextEditableHeaderSource, /showToolbar=\{false\}/u);
	assert.match(contextEditableHeaderSource, /viewMode=\{viewMode\}/u);
	assert.doesNotMatch(
		contextEditableHeaderSource,
		/stuckToolbarScrollFade|toolbarRestingSeparator|toolbarRestingSeparatorLabel|toolbarReveal/u,
	);
	// Left column no longer hosts Activity — only Context scrolls there.
	assert.doesNotMatch(layoutSource, /activity: ReactNode|useHasActivity|\{activity\}/u);
	// Chrome outside scrollport: progressive top+bottom masks on body scrollports.
	assert.match(
		layoutSource,
		/function useColumnScrollMask\([\s\S]*buildScrollMaskStyle\(\{[\s\S]*fadeTop: showTopScrollMask,[\s\S]*fadeBottom: showBottomScrollMask/u,
	);
	assert.doesNotMatch(layoutSource, /data-jira-work-item-header-scroll-mask|buildScrollMaskBlurLayerStyles\("top"\)/u);
	assert.doesNotMatch(layoutSource, /showMetadataTopScrollMask|data-jira-work-item-metadata-scroll-mask|metadataScrollRef/u);
	assert.match(
		layoutSource,
		/const \{ ref: leftScrollRef, style: leftScrollMaskStyle \} = useColumnScrollMask\(\);/u,
	);
	assert.match(
		readBlockFile("experimental-v2/components/metadata-rail.tsx"),
		/buildScrollMaskStyle\(\{[\s\S]*fadeTop: showTopScrollMask,[\s\S]*fadeBottom: showBottomScrollMask/u,
	);
});

test("experimental v2 renders filled context resources as conditional metadata sections", () => {
	const metadataRailSource = readBlockFile("experimental-v2/components/metadata-rail.tsx");
	const automationTabSource = readBlockFile("experimental-v2/components/automation-tab.tsx");
	const detailsSectionsSource = readBlockFile("experimental-v2/components/details-sections.tsx");
	const setToRecurSource = readBlockFile("experimental-v2/components/set-to-recur-popover.tsx");

	assert.match(metadataRailSource, /const \{ attachments, linkedItems, subtasks \} = contextResources;/u);
	assert.match(metadataRailSource, /if \(attachments\.length > 0\) \{[\s\S]*id: "attachments",[\s\S]*title: "Attachments"/u);
	assert.match(metadataRailSource, /if \(subtasks\.length > 0\) \{[\s\S]*id: "subtasks",[\s\S]*title: <SubtasksSectionTitle done=\{doneSubtasks\} total=\{subtasks\.length\} \/>/u);
	assert.match(metadataRailSource, /if \(linkedItems\.length > 0\) \{[\s\S]*id: "linked-items",[\s\S]*title: "Linked work items"/u);
	assert.match(metadataRailSource, /attachments\.map\(toAttachmentSmartLink\)[\s\S]*count: attachments\.length/u);
	assert.match(metadataRailSource, /subtasks\.map\(toSubtaskSmartLink\)[\s\S]*count: `\$\{doneSubtasks\}\/\$\{subtasks\.length\}`/u);
	assert.match(metadataRailSource, /const doneSubtasks = subtasks\.filter\(\(subtask\) => subtask\.status === "done"\)\.length;/u);
	assert.match(metadataRailSource, /<ProgressCircle aria-hidden size="xs" value=\{total > 0 \? Math\.round\(\(done \/ total\) \* 100\) : 0\} variant="outline" \/>/u);
	assert.match(metadataRailSource, /linkedItems\.map\(toLinkedItemSmartLink\)[\s\S]*count: linkedItems\.length/u);
	assert.equal((metadataRailSource.match(/kind: "icon-tile", icon: <WorkItemIcon label="" size="medium" \/>, tone: "information"/gu) ?? []).length, 2);
	assert.match(metadataRailSource, /assignee: subtask\.assignee[\s\S]*name: subtask\.assignee, src: subtask\.assigneeAvatarUrl/u);
	assert.doesNotMatch(metadataRailSource, /fallbackAssignee|assignee: toSmartLinkAssignee|metadata: \[\{ label: linkedItem\.relationship \}\]/u);
	assert.match(metadataRailSource, /actions: SMART_LINK_MODAL_ACTIONS/u);
	assert.match(metadataRailSource, /status: toWorkItemStatus\(linkedItem\.status\)/u);
	assert.match(metadataRailSource, /description: subtask\.description \?\?/u);
	assert.match(metadataRailSource, /description: linkedItem\.description \?\?/u);
	assert.match(metadataRailSource, /assignee: linkedItem\.assignee[\s\S]*name: linkedItem\.assignee, src: linkedItem\.assigneeAvatarUrl/u);
	assert.match(metadataRailSource, /priority: linkedItem\.priority/u);
	assert.match(metadataRailSource, /function ResourceSmartLinks[\s\S]*<ul className="space-y-1">[\s\S]*<SmartLink[\s\S]*align="center"[\s\S]*alignOffset=\{0\}[\s\S]*className="min-w-0 max-w-full"[\s\S]*item=\{item\}[\s\S]*onRemove=\{\(\) => onRemove\(item\.id\)\}[\s\S]*positionerClassName="z-\[600\]"[\s\S]*removeButtonLabel=\{`Remove \$\{item\.title\}`\}[\s\S]*removeVariant="overlay"[\s\S]*side="left"/u);
	assert.match(metadataRailSource, /removeVariant="overlay"[\s\S]*showStatus[\s\S]*side="left"/u);
	assert.match(metadataRailSource, /removeContextResource\("attachment", id\)[\s\S]*removeContextResource\("subtask", id\)[\s\S]*removeContextResource\("link", id\)/u);
	assert.doesNotMatch(metadataRailSource, /DeleteIcon|@atlaskit\/icon\/core\/delete|<Tag/u);
	assert.match(metadataRailSource, /attachments\.map\(toAttachmentSmartLink\)[\s\S]*subtasks\.map\(toSubtaskSmartLink\)[\s\S]*linkedItems\.map\(toLinkedItemSmartLink\)/u);
	assert.doesNotMatch(metadataRailSource, /AgentFilledSummaryRow|AgentReferenceChip|agentFieldName=/u);
	assert.match(
		metadataRailSource,
		/id: "details",[\s\S]*\.\.\.resourceSections,[\s\S]*id: "automation"[\s\S]*id: "development"/u,
	);
	assert.doesNotMatch(metadataRailSource, /id: "apps"|title: "Apps"|<AppsSection/u);
	assert.match(metadataRailSource, /<ArtifactPane[\s\S]*showSeparators=\{false\}[\s\S]*sections=\{/u);
	assert.match(metadataRailSource, /collapsible: false,[\s\S]*content: <DetailsTab draft=\{draft\} onChange=\{actions\.updateMetadata\} people=\{people\} \/>/u);
	assert.match(metadataRailSource, /content: <AutomationTab rules=\{automationRules\} \/>,[\s\S]*count: automationRules\.length \|\| undefined,[\s\S]*headerAction: \{ label: "Manage automations" \},[\s\S]*id: "automation"/u);
	assert.match(
		metadataRailSource,
		/import \{ CONNECTED_REPOSITORY_COUNT \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/development-repositories"/u,
	);
	assert.match(
		metadataRailSource,
		/<DevelopmentSectionContent \/>[\s\S]*count: CONNECTED_REPOSITORY_COUNT \|\| undefined,[\s\S]*headerAction: \{ label: "Manage dev tools" \},[\s\S]*id: "development",[\s\S]*title: "Repositories"/u,
	);
	// Attachments / Automation / Repositories all use numeric counts (`· N`).
	assert.match(metadataRailSource, /count: attachments\.length,/u);
	assert.match(metadataRailSource, /count: automationRules\.length \|\| undefined,/u);
	assert.doesNotMatch(
		metadataRailSource,
		/title: "Development"|formatConnectedRepositoryCountLabel|\b\d+ Repos?\b/u,
	);
	assert.doesNotMatch(metadataRailSource, /content: <DevelopmentSection \/>/u);
	assert.doesNotMatch(automationTabSource, /From Automation/u);
	assert.doesNotMatch(automationTabSource, /AutomationTile|core\/branch/u);
	assert.match(automationTabSource, /rules = \[\][\s\S]*const hasRules = rules\.length > 0/u);
	assert.match(automationTabSource, /hasRules \? \([\s\S]*<AutomationRuleRows rules=\{rules\} \/>[\s\S]*\) : \([\s\S]*Create an automation to perform tasks/u);
	assert.match(automationTabSource, /<IconTile[\s\S]*<AutomationIcon label="" size="small" color="currentColor" \/>[\s\S]*size="small"[\s\S]*variant=\{rule\.iconVariant\}/u);
	assert.match(automationTabSource, /function CreateAutomationRow[\s\S]*<AddIcon label="" size="small" \/>[\s\S]*size="small"[\s\S]*variant="gray"[\s\S]*Create automation/u);
	assert.match(automationTabSource, /<CreateAutomationRow \/>[\s\S]*<AutomationRuleRows rules=\{rules\} \/>/u);
	assert.match(automationTabSource, /className="min-w-0 flex-1 truncate text-sm text-text"/u);
	assert.match(automationTabSource, /<Button variant="outline">\s*Add manually triggered automation\s*<\/Button>/u);
	assert.doesNotMatch(automationTabSource, /<Button[^>]*(?:w-full|disabled)[^>]*>\s*Add manually triggered automation/u);
	assert.match(automationTabSource, /latestRule\?\.lastRunAt[\s\S]*`\$\{latestRule\.title\} · \$\{latestRule\.lastRunAt\}`[\s\S]*View automation history/u);
	assert.match(automationTabSource, /latestRule\?\.lastRunAt \? \([\s\S]*className="size-3 shrink-0 text-icon-success \[&_svg\]:size-3!"[\s\S]*<StatusSuccessIcon label="" size="small" \/>/u);
	assert.match(automationTabSource, /Recent rule runs[\s\S]*\{recentRunByline\}[\s\S]*ChevronRightIcon/u);
	assert.match(automationTabSource, /<SetToRecurRow \/>/u);
	assert.doesNotMatch(automationTabSource, /Manage automations/u);
	assert.doesNotMatch(automationTabSource, /border-t border-border/u);
	assert.match(setToRecurSource, /Set to recur[\s\S]*config\.frequency[\s\S]*config\.day[\s\S]*config\.timing[\s\S]*No schedule set[\s\S]*ChevronRightIcon/u);
	assert.doesNotMatch(setToRecurSource, /RefreshIcon|core\/refresh/u);
	assert.match(detailsSectionsSource, /truncate text-sm font-medium text-text[\s\S]*truncate text-xs text-text-subtlest/u);
	assert.doesNotMatch(detailsSectionsSource, /<CollapsibleSection title="Apps">/u);
});

test("experimental v2 keeps its persistent metadata rail open", () => {
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");

	assert.doesNotMatch(compositionSource, /defaultMetadataCollapsed/u);
	assert.match(compositionSource, /<PanelLayoutProvider>/u);
});

test("experimental v2 title PR Tag opens the metadata-rail pull-requests panel", () => {
	const titleMetaSource = readBlockFile("experimental-v2/components/context-title-meta.tsx");
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");

	// Count comes from the same pullRequestEntries fed into MetadataRailProvider.
	assert.match(
		compositionSource,
		/<MetadataRailProvider pullRequestCount=\{pullRequestEntries\.length\}>/u,
	);
	assert.match(
		titleMetaSource,
		/import \{ useMetadataRail \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/context-metadata-rail"/u,
	);
	assert.match(
		titleMetaSource,
		/import \{ Tag \} from "@\/components\/ui\/tag"/u,
	);
	assert.match(
		titleMetaSource,
		/import PullRequestIcon from "@atlaskit\/icon\/core\/pull-request"/u,
	);
	// Status → PR Tag → Reported by; hide when zero; click selects pull-requests view.
	assert.match(
		titleMetaSource,
		/setPanelView\("pull-requests"\)/u,
	);
	assert.match(
		titleMetaSource,
		/<StatusPill[\s\S]*pullRequestCount > 0 \? \([\s\S]*data-jira-work-item-title-pull-requests[\s\S]*onClick=\{openPullRequestsPanel\}[\s\S]*metadata\.reporter/u,
	);
});

test("experimental v2 metadata rail toggles Details, Activity, and Pull requests with Details default", () => {
	const metadataRailSource = readBlockFile("experimental-v2/components/metadata-rail.tsx");
	const metadataRailToggleSource = readBlockFile("experimental-v2/components/metadata-rail-toggle.tsx");
	const metadataRailContextSource = readBlockFile("experimental-v2/context-metadata-rail.tsx");
	const contextResourcesSource = readBlockFile("experimental-v2/components/context-resources.tsx");
	const layoutSource = readBlockFile("experimental-v2/components/experimental-work-item-layout.tsx");
	const pullRequestsPanelSource = readBlockFile("experimental-v2/components/pull-requests-panel.tsx");
	const pullRequestSortControlSource = readBlockFile(
		"experimental-v2/components/pull-request-sort-control.tsx",
	);
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");

	// Shared view state lives in MetadataRailProvider (not local MetadataRail state).
	assert.match(
		metadataRailContextSource,
		/useState<MetadataRailView>\("details"\)/u,
	);
	assert.match(
		readBlockFile("experimental-v2/lib/metadata-rail-view.ts"),
		/export type MetadataRailView = "details" \| "activity" \| "pull-requests"/u,
	);
	assert.match(
		metadataRailContextSource,
		/import type \{ MetadataRailView \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/metadata-rail-view"/u,
	);
	assert.match(
		compositionSource,
		/<MetadataRailProvider pullRequestCount=\{pullRequestEntries\.length\}>/u,
	);
	assert.match(
		metadataRailSource,
		/import \{ useMetadataRail \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/context-metadata-rail"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{ JIRA_WORK_ITEM_CURRENT_USER \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/jira-activity-adapter"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{ PullRequestsPanel \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/components\/pull-requests-panel"/u,
	);
	// Toggle lives at the top of the metadata rail (not the left-column resources row).
	assert.match(
		metadataRailSource,
		/import \{ MetadataRailToggle \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/components\/metadata-rail-toggle"/u,
	);
	assert.match(
		metadataRailSource,
		/data-jira-work-item-column-shell[\s\S]*data-jira-work-item-column-chrome[\s\S]*<MetadataRailToggle \/>[\s\S]*data-jira-work-item-scroll-region[\s\S]*data-jira-work-item-column-body[\s\S]*data-jira-work-item-metadata-rail-body/u,
	);
	// Same progressive top+bottom mask as the left description scrollport.
	assert.match(
		metadataRailSource,
		/buildScrollMaskStyle\(\{[\s\S]*fadeTop: showTopScrollMask,[\s\S]*fadeBottom: showBottomScrollMask/u,
	);
	assert.match(
		metadataRailSource,
		/relative min-h-0 min-w-0 flex-1 overflow-y-auto/u,
	);
	// Activity/PR chrome live in MetadataRailToggle; scroll mask lives on the rail body scrollport.
	assert.doesNotMatch(
		metadataRailSource,
		/import \{ StickyRowScrollFade \}|<StickyRowScrollFade|<JiraActivityViewControl|<PullRequestSortControl/u,
	);
	assert.doesNotMatch(metadataRailSource, /from "@\/components\/ui\/toggle-group"|<ToggleGroup[\s>]/u);
	assert.doesNotMatch(contextResourcesSource, /MetadataRailToggle/u);
	assert.match(
		layoutSource,
		/@container\/agentlayout group\/metadata-rail/u,
	);
	assert.match(
		metadataRailToggleSource,
		/import \{ ButtonGroup \} from "@\/components\/ui\/button-group"/u,
	);
	assert.match(
		metadataRailToggleSource,
		/import \{ Button \} from "@\/components\/ui\/button"/u,
	);
	// Segmented control: equal-width shells; label selects panel; Activity/PR inset ghost chevrons open sort.
	assert.match(
		metadataRailToggleSource,
		/data-jira-work-item-metadata-rail-toggle[\s\S]*data-jira-work-item-metadata-rail-toggle-content[\s\S]*<ButtonGroup[\s\S]*aria-label="Work item panel"[\s\S]*className="w-full"[\s\S]*MetadataRailPanelSegment[\s\S]*label="Details"[\s\S]*label="Activity"[\s\S]*activityChrome != null \? \([\s\S]*<JiraActivityViewControl[\s\S]*trigger="chevron"[\s\S]*pullRequestCount > 0 \? \([\s\S]*label="Pull requests"[\s\S]*<PullRequestSortControl[\s\S]*trigger="chevron"/u,
	);
	assert.match(
		metadataRailToggleSource,
		/selectPanel\("activity"\)[\s\S]*selectPanel\("pull-requests"\)/u,
	);
	assert.match(
		metadataRailToggleSource,
		/onOpenChange=\{\(open\) => \{[\s\S]*if \(open\) \{[\s\S]*selectPanel\("activity"\)/u,
	);
	assert.match(
		metadataRailToggleSource,
		/onOpenChange=\{\(open\) => \{[\s\S]*if \(open\) \{[\s\S]*selectPanel\("pull-requests"\)/u,
	);
	// No trailing standalone "Show by me" / Activity text-link control.
	assert.doesNotMatch(
		metadataRailToggleSource,
		/justify-between|activePanelView === "activity" && activityChrome|activePanelView === "pull-requests" \?/u,
	);
	assert.doesNotMatch(metadataRailToggleSource, /from "@\/components\/ui\/toggle-group"|<ToggleGroup[\s>]/u);
	// Toggle is non-scrolling chrome (sibling above the body scrollport).
	assert.doesNotMatch(metadataRailToggleSource, /StickyRowScrollFade|sticky top-0|container-type:scroll-state/u);
	assert.match(metadataRailToggleSource, /shrink-0 @\[860px\]\/agentlayout:pb-7/u);
	assert.match(
		metadataRailToggleSource,
		/flex w-full items-center px-3[\s\S]*data-jira-work-item-metadata-rail-toggle-content/u,
	);
	assert.doesNotMatch(
		metadataRailToggleSource,
		/px-3 pt-1 pb-3|pt-1 pb-3/u,
	);
	// Chrome→body gap is chrome pb only — outer flex must not stack gap-2 on the toggle.
	assert.match(
		metadataRailSource,
		/data-jira-work-item-column-chrome[\s\S]*<MetadataRailToggle \/>/u,
	);
	assert.doesNotMatch(
		metadataRailSource,
		/<div className="flex min-w-0 flex-col gap-2">\s*<MetadataRailToggle/u,
	);
	assert.match(
		metadataRailSource,
		/className="\[&>div:first-child\]:pt-0"/u,
	);
	// Hover/focus-visible reveal: rail body hover + self hover/focus-visible
	// (no body focus-within — click-focus in rail fields must not stick opacity).
	assert.match(
		metadataRailToggleSource,
		/opacity-0 transition-opacity duration-normal ease-out[\s\S]*hover:opacity-100 has-\[:focus-visible\]:opacity-100 has-\[\[aria-expanded=true\]\]:opacity-100[\s\S]*group-has-\[\[data-jira-work-item-metadata-rail-body\]:hover\]\/metadata-rail:opacity-100[\s\S]*motion-reduce:transition-none/u,
	);
	assert.doesNotMatch(
		metadataRailToggleSource,
		/group-has-\[\[data-jira-work-item-metadata-rail-body\]:focus-within\]/u,
	);
	assert.doesNotMatch(metadataRailToggleSource, /focus-within:opacity-100/u);
	// Toggle is rail-scoped — no full-bleed header width / negative-margin alignment tricks.
	assert.doesNotMatch(
		metadataRailToggleSource,
		/@\[860px\]\/agentlayout:w-\[var\(--metadata-panel-offset\)\]|@\[860px\]\/agentlayout:-mr-6/u,
	);
	assert.match(metadataRailSource, /ActivityRailChromeProvider/u);
	assert.match(
		metadataRailToggleSource,
		/import \{\s*JiraActivityViewControl,\s*\} from "@\/components\/blocks\/jira-activity"/u,
	);
	assert.match(
		metadataRailToggleSource,
		/import \{ PullRequestSortControl \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/components\/pull-request-sort-control"/u,
	);
	assert.match(
		metadataRailToggleSource,
		/<JiraActivityViewControl[\s\S]*trigger="chevron"/u,
	);
	// Chevron selected chrome is menu-open (`aria-expanded`), not segment `pressed`.
	assert.doesNotMatch(
		metadataRailToggleSource,
		/<JiraActivityViewControl[\s\S]*pressed=\{activePanelView === "activity"\}/u,
	);
	// Pull requests uses a dedicated sort control (By me default); Activity keeps its view filters.
	assert.match(
		metadataRailContextSource,
		/useState<PullRequestSortMode>\(DEFAULT_PULL_REQUEST_SORT_MODE\)/u,
	);
	assert.match(
		metadataRailToggleSource,
		/<PullRequestSortControl[\s\S]*sortMode=\{pullRequestSortMode\}[\s\S]*trigger="chevron"/u,
	);
	assert.match(pullRequestSortControlSource, /"by-me": "Show by me"/u);
	assert.match(pullRequestSortControlSource, /"latest-activity": "Show latest activity"/u);
	assert.match(pullRequestSortControlSource, /"newest-created": "Show newest created"/u);
	assert.match(pullRequestSortControlSource, /"oldest-created": "Show oldest created"/u);
	assert.match(pullRequestSortControlSource, /"largest-change": "Show largest change"/u);
	assert.match(pullRequestSortControlSource, /"by-me": "By me"/u);
	assert.match(pullRequestSortControlSource, /"latest-activity": "Latest activity"/u);
	assert.match(pullRequestSortControlSource, /"newest-created": "Newest created"/u);
	assert.match(pullRequestSortControlSource, /"oldest-created": "Oldest created"/u);
	assert.match(pullRequestSortControlSource, /"largest-change": "Largest change"/u);
	assert.match(
		pullRequestSortControlSource,
		/SORT_MENU_ORDER: readonly PullRequestSortMode\[\] = \[\s*"by-me",\s*"latest-activity",\s*"newest-created",\s*"oldest-created",\s*"largest-change",\s*\]/u,
	);
	assert.match(pullRequestSortControlSource, /trigger = "label"/u);
	assert.match(pullRequestSortControlSource, /trigger\?: "label" \| "chevron"/u);
	assert.match(
		pullRequestSortControlSource,
		/data-jira-work-item-metadata-rail-sort-trigger="pull-requests"/u,
	);
	assert.match(pullRequestSortControlSource, /event\.stopPropagation\(\)/u);
	// Shell owns segment selected chrome; chevron must not set aria-pressed.
	assert.doesNotMatch(
		pullRequestSortControlSource,
		/isChevron \? \([\s\S]*aria-pressed=\{pressed \|\| undefined\}/u,
	);
	// Joined bordered ButtonGroup shells (equal flex) — not muted-track raised pills / Tabs.
	assert.doesNotMatch(metadataRailToggleSource, /PANEL_VIEW_TOGGLE_CLASS|PANEL_VIEW_TOGGLE_ITEM_CLASS|bg-muted p-0\.5/u);
	assert.doesNotMatch(
		metadataRailToggleSource,
		/from "@\/components\/ui\/tabs"|<Tabs[\s>]|TabsList|TabsTrigger|TabsContent/u,
	);
	assert.match(metadataRailToggleSource, /PANEL_SEGMENT_SHELL_CLASS[\s\S]*flex min-w-0 flex-1 items-center rounded-md[\s\S]*border border-border/u);
	// Focus recolors the shell border only (no ring halo); trailing segments
	// restore border-l. Label/chevron suppress Button’s ring-3 halo.
	assert.match(
		metadataRailToggleSource,
		/PANEL_SEGMENT_SHELL_CLASS[\s\S]*has-\[\[data-jira-work-item-metadata-rail-panel-label\]:focus-visible\]:border-ring/u,
	);
	assert.match(
		metadataRailToggleSource,
		/PANEL_SEGMENT_SHELL_CLASS[\s\S]*has-\[\[data-jira-work-item-metadata-rail-sort-trigger\]:focus-visible\]:border-ring/u,
	);
	assert.doesNotMatch(
		metadataRailToggleSource,
		/PANEL_SEGMENT_SHELL_CLASS[\s\S]*has-\[\[data-jira-work-item-metadata-rail-panel-label\]:focus-visible\]:ring-3/u,
	);
	assert.match(
		metadataRailToggleSource,
		/PANEL_SEGMENT_FOCUS_LEFT_BORDER_CLASS[\s\S]*border-l!/u,
	);
	assert.match(
		metadataRailToggleSource,
		/PANEL_SEGMENT_LABEL_CLASS[\s\S]*focus-visible:border-transparent focus-visible:ring-0!/u,
	);
	assert.match(
		metadataRailToggleSource,
		/data-jira-work-item-metadata-rail-panel-label=""/u,
	);
	assert.match(metadataRailToggleSource, /PANEL_SEGMENT_LABEL_CLASS[\s\S]*variant="ghost"/u);
	// Details: fill shell + center label. Activity/PR: centered packed unit, 6px gap.
	assert.match(
		metadataRailToggleSource,
		/hasSortControl \? cn\("justify-center", PANEL_SEGMENT_FOCUS_LEFT_BORDER_CLASS\) : null/u,
	);
	assert.match(
		metadataRailToggleSource,
		/hasSortControl \? \([\s\S]*flex min-w-0 items-center gap-1\.5[\s\S]*PANEL_SEGMENT_LABEL_CLASS, "pe-0"[\s\S]*\{sortControl\}[\s\S]*\) : \([\s\S]*PANEL_SEGMENT_LABEL_CLASS, "flex-1"/u,
	);
	// Default h-8 (32px) label height matches left ContextResources chrome; chevron stays inset compact.
	assert.match(
		metadataRailToggleSource,
		/className=\{cn\(PANEL_SEGMENT_LABEL_CLASS,[\s\S]*size="default"[\s\S]*variant="ghost"/u,
	);
	assert.match(
		metadataRailToggleSource,
		/<ButtonGroup[^>]*className="w-full"/u,
	);
	// Shell inset on top/right/bottom (`my-1 me-1`); label→icon gap is segment `gap-1.5`.
	assert.match(
		pullRequestSortControlSource,
		/CHEVRON_TRIGGER_CLASS =\s*"my-1 me-1 shrink-0 border-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0! focus-visible:ring-offset-0!"/u,
	);
	assert.doesNotMatch(
		pullRequestSortControlSource,
		/CHEVRON_TRIGGER_CLASS[\s\S]*aria-expanded:border-transparent/u,
	);
	assert.match(
		pullRequestSortControlSource,
		/isChevron \? \([\s\S]*className=\{CHEVRON_TRIGGER_CLASS\}[\s\S]*size="icon-compact"[\s\S]*variant="ghost"/u,
	);
	// Panels stay mounted (hidden/inert) so Activity local state survives toggles.
	assert.match(
		metadataRailSource,
		/hidden=\{activePanelView !== "details"\}[\s\S]*inert=\{activePanelView !== "details" \? true : undefined\}[\s\S]*<ArtifactPane/u,
	);
	assert.match(
		metadataRailSource,
		/activity != null \? \(\s*<div[\s\S]*?className="overflow-visible px-3"[\s\S]*?hidden=\{activePanelView !== "activity"\}[\s\S]*inert=\{activePanelView !== "activity" \? true : undefined\}[\s\S]*\{activity\}/u,
	);
	assert.match(
		metadataRailSource,
		/pullRequestCount > 0 \? \(\s*<div[\s\S]*?hidden=\{activePanelView !== "pull-requests"\}[\s\S]*inert=\{activePanelView !== "pull-requests" \? true : undefined\}[\s\S]*<PullRequestsPanel[\s\S]*borderless=\{borderless\}[\s\S]*currentUserName=\{JIRA_WORK_ITEM_CURRENT_USER\.name\}[\s\S]*entries=\{pullRequestEntries\}[\s\S]*sortMode=\{pullRequestSortMode\}/u,
	);
	// PR phases reuse ArtifactPane disclosure chrome (same as Details Attachments/etc.).
	assert.match(
		pullRequestsPanelSource,
		/import \{ ArtifactPane, type ArtifactPaneSectionItem \} from "@\/components\/blocks\/artifact-pane"/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/groupPullRequestsByPhase\(entries, sortMode, currentUserName\)[\s\S]*data-jira-work-item-pull-requests/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/<ArtifactPane[\s\S]*aria-label="Pull requests"[\s\S]*borderless=\{borderless\}[\s\S]*data-jira-work-item-pull-requests[\s\S]*showSeparators=\{false\}/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/count: count > 0 \? count : undefined[\s\S]*title: <PhaseSectionTitle label=\{section\.label\} phaseId=\{section\.id\} \/>/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/data-jira-work-item-pull-request-phase=\{section\.id\}/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/data-jira-work-item-pull-request-empty[\s\S]*No pull requests/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/data-jira-work-item-pull-request-card=\{number\}/u,
	);
	// PR rows reuse the shared Smart Link pull-request variant (chip + flyout).
	assert.match(
		pullRequestsPanelSource,
		/import \{\s*SmartLink,\s*toPullRequestSmartLink,\s*type SmartLinkAvatar,\s*type SmartLinkItem,\s*\} from "@\/components\/blocks\/smart-link"/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/toPullRequestSmartLink\(\{[\s\S]*href: pullRequest\.url[\s\S]*author: resolvePullRequestAuthor\(entry\)/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/<SmartLink[\s\S]*item=\{item\}[\s\S]*showStatus[\s\S]*side="left"/u,
	);
	assert.doesNotMatch(
		pullRequestsPanelSource,
		/PullRequestActorAvatar|PullRequestRepoPill|GithubLogo|AgentAvatarVisual/u,
	);
	// Phase glyphs live in ArtifactPane title ReactNode; Needs review uses warning info.
	assert.match(
		pullRequestsPanelSource,
		/PHASE_ICON[\s\S]*approved[\s\S]*needs-review[\s\S]*StatusInformationIcon[\s\S]*text-icon-warning[\s\S]*open[\s\S]*draft[\s\S]*merged-30d[\s\S]*closed-30d/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/import StatusInformationIcon from "@atlaskit\/icon\/core\/status-information"/u,
	);
	// No Accordion/Badge list chrome; no clock glyph for Needs your review.
	assert.doesNotMatch(pullRequestsPanelSource, /Badge|Accordion|ClockIcon|Merged last 30 days|Closed last 30 days/u);
	assert.doesNotMatch(
		metadataRailSource,
		/panelView === "details" \?/u,
	);
	assert.match(
		compositionSource,
		/<MetadataRail[\s\S]*activity=\{<ActivityPanel activitySessionThread=\{activitySessionThread\} \/>\}/u,
	);
	// Activity lives only in the metadata rail Details/Activity toggle — not under description.
	assert.equal(
		(compositionSource.match(/<ActivityPanel activitySessionThread=\{activitySessionThread\} \/>/gu) ?? []).length,
		1,
	);
	// Layout slots are header/context/composer/metadata — no left-column activity prop.
	assert.match(
		compositionSource,
		/<ExperimentalWorkItemLayout\n\s*header=\{[\s\S]*?\n\s*context=\{[\s\S]*?\n\s*composer=\{[\s\S]*?\n\s*fillContainer=\{[\s\S]*?\n\s*metadata=\{/u,
	);
});

test("experimental v2 keeps pull-request selection transient at the composition layer", () => {
	const adapterSource = readBlockFile("experimental-v2/lib/jira-activity-adapter.ts");
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");
	const contextPanelSource = readBlockFile("experimental-v2/components/context-panel.tsx");
	const contextResourcesSource = readBlockFile("experimental-v2/components/context-resources.tsx");
	const metadataRailSource = readBlockFile("experimental-v2/components/metadata-rail.tsx");
	const pullRequestsPanelSource = readBlockFile("experimental-v2/components/pull-requests-panel.tsx");
	const persistedStateSource = readBlockFile("data/session-state.ts");

	// Dedupe and selection use one repository-aware identity contract.
	assert.match(adapterSource, /export function getPullRequestIdentity\(/u);
	assert.match(adapterSource, /const identity = getPullRequestIdentity\(event\.pullRequest\);/u);
	assert.doesNotMatch(adapterSource, /function pullRequestIdentity\(/u);
	assert.match(
		compositionSource,
		/useState<string \| null>\(null\)[\s\S]*selectPullRequestEntries\(activityEvents, SESSION_EPOCH_MS \+ elapsedMs\)[\s\S]*pullRequestEntries\.find\([\s\S]*getPullRequestIdentity\(entry\.pullRequest\) === selectedPullRequestIdentity/u,
	);
	assert.match(
		compositionSource,
		/setSelectedPullRequestIdentity\(\(currentIdentity\) => \([\s\S]*currentIdentity === identity \? null : identity/u,
	);
	assert.match(
		compositionSource,
		/<JiraWorkItemProvider[\s\S]*<ExperimentalV2JiraWorkItemContent[\s\S]*key=\{props\.initialStateRevision\}/u,
	);
	assert.doesNotMatch(persistedStateSource, /selectedPullRequest|pullRequestIdentity/u);

	// The metadata rail receives current entries and does not own/reset selection
	// when its Details / Activity / Pull requests view changes.
	assert.match(
		compositionSource,
		/<MetadataRail[\s\S]*pullRequestEntries=\{pullRequestEntries\}[\s\S]*selectedPullRequestIdentity=\{selectedPullRequestIdentity\}[\s\S]*onPullRequestSelect=\{handlePullRequestSelect\}/u,
	);
	assert.doesNotMatch(metadataRailSource, /selectPullRequestEntries|setSelectedPullRequestIdentity/u);
	assert.match(
		metadataRailSource,
		/<PullRequestsPanel[\s\S]*entries=\{pullRequestEntries\}[\s\S]*selectedIdentity=\{selectedPullRequestIdentity\}[\s\S]*onSelectEntry=\{onPullRequestSelect\}/u,
	);

	// Each SmartLink becomes an aria-pressed selectable button through its shared
	// onActivate/selected API; the list item retains stable inspection attributes.
	assert.match(
		pullRequestsPanelSource,
		/data-jira-work-item-pull-request-card=\{number\}[\s\S]*data-jira-work-item-pull-request-identity=\{identity\}[\s\S]*data-selected=\{selected \? "true" : undefined\}/u,
	);
	assert.match(
		pullRequestsPanelSource,
		/<SmartLink[\s\S]*item=\{item\}[\s\S]*onActivate=\{\(\) => onSelectEntry\(entry\)\}[\s\S]*selected=\{selected\}/u,
	);

	assert.match(
		compositionSource,
		/<ContextPanel[\s\S]*selectedPullRequestEntry=\{selectedPullRequestEntry\}[\s\S]*onPullRequestBack=\{\(\) => setSelectedPullRequestIdentity\(null\)\}/u,
	);
	assert.match(
		contextPanelSource,
		/const selectedPullRequestKey = selectedPullRequestEntry\?\.pullRequest[\s\S]*getPullRequestIdentity\(selectedPullRequestEntry\.pullRequest\)[\s\S]*<PullRequestDetailView[\s\S]*entry=\{selectedPullRequestEntry\}[\s\S]*key=\{selectedPullRequestKey\}[\s\S]*onBack=\{onPullRequestBack\}[\s\S]*<AiPlannerScope[\s\S]*<ContextEditableDescription/u,
	);
	assert.match(
		contextResourcesSource,
		/<AnimatedContextTitleActions primaryAgentId=\{primaryCodingAgentId\} \/>[\s\S]*\{pullRequestSelected \? null : \([\s\S]*aria-label="Copy work item as markdown"[\s\S]*<EditorToolbarModeTabs/u,
	);
});
