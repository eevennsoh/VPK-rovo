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
	assert.match(
		layoutSource,
		/buildScrollMaskStyle\(\{ fadeTop: showTopScrollMask, fadeBottom: showBottomScrollMask \}\)/u,
	);
	assert.match(
		layoutSource,
		/buildScrollMaskBlurLayerStyles\("top"\)[\s\S]*showTopScrollMask \? \([\s\S]*\[margin-right:var\(--metadata-panel-offset\)\][\s\S]*data-jira-work-item-header-scroll-mask[\s\S]*style=\{contentStyle\}[\s\S]*from-surface-overlay to-transparent/u,
	);
	assert.match(
		layoutSource,
		/ref: metadataScrollRef,[\s\S]*showBottomScrollMask: showMetadataBottomScrollMask,[\s\S]*const metadataScrollMaskStyle = useMemo\([\s\S]*fadeTop: false,[\s\S]*fadeBottom: showMetadataBottomScrollMask/u,
	);
	assert.doesNotMatch(layoutSource, /showMetadataTopScrollMask|data-jira-work-item-metadata-scroll-mask/u);
	assert.match(
		layoutSource,
		/ref=\{metadataScrollRef\}[\s\S]*style=\{\{[\s\S]*\.\.\.metadataScrollMaskStyle,[\s\S]*willChange:/u,
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

test("experimental v2 metadata rail toggles Details, Activity, and Pull requests with Details default", () => {
	const metadataRailSource = readBlockFile("experimental-v2/components/metadata-rail.tsx");
	const pullRequestsPanelSource = readBlockFile("experimental-v2/components/pull-requests-panel.tsx");
	const pullRequestSortControlSource = readBlockFile(
		"experimental-v2/components/pull-request-sort-control.tsx",
	);
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");

	assert.match(
		metadataRailSource,
		/useState<MetadataRailView>\("details"\)/u,
	);
	assert.match(
		metadataRailSource,
		/type MetadataRailView = "details" \| "activity" \| "pull-requests"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{\s*JIRA_WORK_ITEM_CURRENT_USER,\s*selectPullRequestEntries,\s*\} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/jira-activity-adapter"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{\s*DEFAULT_PULL_REQUEST_SORT_MODE,\s*type PullRequestSortMode,\s*\} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/pull-request-phases"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{ PullRequestsPanel \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/components\/pull-requests-panel"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{ StickyRowScrollFade \} from "@\/components\/visual\/scroll-mask"/u,
	);
	assert.match(
		metadataRailSource,
		/<div[\s\S]*className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-surface-overlay px-3 pt-1 pb-3 \[container-type:scroll-state\]"[\s\S]*data-jira-work-item-metadata-rail-toggle[\s\S]*<ToggleGroup[\s\S]*aria-label="Work item panel"[\s\S]*multiple=\{false\}[\s\S]*size="sm"[\s\S]*value=\{\[activePanelView\]\}[\s\S]*variant="outline"[\s\S]*<ToggleGroupItem value="details">[\s\S]*Details[\s\S]*<ToggleGroupItem value="activity">[\s\S]*\$\{activityCount\} \$\{activityCount === 1 \? "Activity" : "Activities"\}[\s\S]*pullRequestCount > 0 \? \([\s\S]*<ToggleGroupItem value="pull-requests">[\s\S]*\$\{pullRequestCount\} \$\{pullRequestCount === 1 \? "Pull request" : "Pull requests"\}[\s\S]*<StickyRowScrollFade data-slot="jira-work-item-metadata-rail-scroll-fade" \/>/u,
	);
	assert.match(metadataRailSource, /ActivityRailChromeProvider/u);
	assert.match(
		metadataRailSource,
		/import \{ JiraActivityViewControl \} from "@\/components\/blocks\/jira-activity"/u,
	);
	assert.match(
		metadataRailSource,
		/import \{ PullRequestSortControl \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/components\/pull-request-sort-control"/u,
	);
	assert.match(
		metadataRailSource,
		/activePanelView === "activity" && activityChrome != null \? \([\s\S]*<JiraActivityViewControl[\s\S]*menuAlign="end"/u,
	);
	// Pull requests uses a dedicated sort control (By me default); Activity keeps its view filters.
	assert.match(
		metadataRailSource,
		/useState<PullRequestSortMode>\(DEFAULT_PULL_REQUEST_SORT_MODE\)/u,
	);
	assert.match(
		metadataRailSource,
		/activePanelView === "pull-requests" \? \([\s\S]*<PullRequestSortControl[\s\S]*sortMode=\{pullRequestSortMode\}/u,
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
	// Joined outline filter segments (ToggleGroupDemoFilter) — not muted-track raised pills.
	assert.doesNotMatch(metadataRailSource, /PANEL_VIEW_TOGGLE_CLASS|PANEL_VIEW_TOGGLE_ITEM_CLASS|bg-muted p-0\.5/u);
	assert.doesNotMatch(
		metadataRailSource,
		/from "@\/components\/ui\/tabs"|<Tabs[\s>]|TabsList|TabsTrigger|TabsContent/u,
	);
	assert.match(metadataRailSource, /variant="outline"/u);
	assert.doesNotMatch(
		metadataRailSource,
		/<ToggleGroup[^>]*className="[^"]*w-full|<ToggleGroupItem[^>]*className="[^"]*flex-1/u,
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
		/<MetadataRail[\s\S]*activity=\{<ActivityPanel activitySessionThread=\{props\.activitySessionThread\} \/>\}/u,
	);
	// Activity lives only in the metadata rail Details/Activity toggle — not under description.
	assert.equal(
		(compositionSource.match(/<ActivityPanel activitySessionThread=\{props\.activitySessionThread\} \/>/gu) ?? []).length,
		1,
	);
	// Layout slots are header/context/composer/metadata — no left-column activity prop.
	assert.match(
		compositionSource,
		/<ExperimentalWorkItemLayout\n\s*header=\{[\s\S]*?\n\s*context=\{[\s\S]*?\n\s*composer=\{[\s\S]*?\n\s*fillContainer=\{[\s\S]*?\n\s*metadata=\{/u,
	);
});

