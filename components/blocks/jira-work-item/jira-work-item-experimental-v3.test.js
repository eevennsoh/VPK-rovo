const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

// Contract tests for the `experimental-v3` fork of the Jira Work Item surface.
//
// v3 was created as a full copy of the v2 tree so it could diverge on any pixel
// without risk to v2 (which itself forked v1). These tests protect the two
// properties that make that fork safe rather than merely duplicated:
//
//   1. Isolation — no tree imports another, so an edit in one can never change
//      another's rendered surface.
//   2. A shared model — the session/planner reducer under `data/` stays single-
//      sourced, so behavioral fixes reach every variant.
//
// The original "starts as a structural duplicate of v2" and root byte-parity
// assertions have been retired: v3 has now diverged by design (one scroll-linked
// section nav replacing the rail toggle and the pull-request tab strip), so
// pinning sameness would have meant listing nearly every file as an exception —
// an assertion that asserts nothing. They are replaced below by contracts on
// what v3 actually is. Isolation and the shared model remain the durable ones.

const BLOCK_DIR = __dirname;
const V1_DIR = path.join(BLOCK_DIR, "experimental");
const V2_DIR = path.join(BLOCK_DIR, "experimental-v2");
const V3_DIR = path.join(BLOCK_DIR, "experimental-v3");

function readBlockFile(relativePath) {
	return fs.readFileSync(path.join(BLOCK_DIR, relativePath), "utf8");
}

/** Repo-relative paths of every `.ts`/`.tsx`/`.js` file under `dir`, recursively. */
function listSourceFiles(dir) {
	return fs
		.readdirSync(dir, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && /\.(?:tsx?|js)$/u.test(entry.name))
		.map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
}

test("experimental v3 exists with a distinctly named composition root", () => {
	assert.ok(fs.existsSync(V3_DIR));

	const compositionSource = readBlockFile("experimental-v3/experimental-v3-jira-work-item.tsx");
	assert.match(compositionSource, /export function ExperimentalV3JiraWorkItem\(/u);
	assert.match(compositionSource, /export default ExperimentalV3JiraWorkItem;/u);
	assert.match(compositionSource, /export type ExperimentalV3JiraWorkItemProps/u);

	// The older root filenames must not linger in v3 — all three roots are
	// imported side by side by the block index, so their names have to stay
	// distinct.
	assert.equal(fs.existsSync(path.join(V3_DIR, "experimental-jira-work-item.tsx")), false);
	assert.equal(fs.existsSync(path.join(V3_DIR, "experimental-v2-jira-work-item.tsx")), false);
});

test("experimental v3 is isolated from v1 and v2", () => {
	for (const filePath of listSourceFiles(V3_DIR)) {
		const source = fs.readFileSync(filePath, "utf8");
		const relativePath = path.relative(BLOCK_DIR, filePath);

		assert.doesNotMatch(source, /jira-work-item\/experimental\//u, `${relativePath} still imports from the v1 experimental tree`);
		assert.doesNotMatch(source, /experimental-v2/u, `${relativePath} still references the v2 tree`);
		assert.doesNotMatch(source, /ExperimentalV2/u, `${relativePath} still references a v2 identifier`);
	}

	for (const olderDir of [V1_DIR, V2_DIR]) {
		for (const filePath of listSourceFiles(olderDir)) {
			assert.doesNotMatch(
				fs.readFileSync(filePath, "utf8"),
				/experimental-v3|ExperimentalV3/u,
				`${path.relative(BLOCK_DIR, filePath)} leaks a v3 reference into an older tree`,
			);
		}
	}
});

test("the v3 surface has one section nav, not a rail toggle plus a PR tab strip", () => {
	// v3's divergence: Description / Activity / Insights (+ Guide / Files under
	// a guided PR) became a single scroll-linked nav in the left column,
	// replacing both the metadata rail's Details/Activity toggle and the
	// pull-request tab strip.
	assert.equal(fs.existsSync(path.join(V3_DIR, "components/metadata-rail-toggle.tsx")), false);
	assert.equal(fs.existsSync(path.join(V3_DIR, "components/context-title-meta.tsx")), false);
	assert.equal(fs.existsSync(path.join(V3_DIR, "lib/metadata-rail-view.ts")), false);

	for (const filePath of listSourceFiles(V3_DIR)) {
		const relativePath = path.relative(BLOCK_DIR, filePath);
		if (relativePath.endsWith(".test.js")) continue;
		assert.doesNotMatch(
			fs.readFileSync(filePath, "utf8"),
			/data-jira-work-item-metadata-rail-toggle|MetadataRailToggle/u,
			`${relativePath} still references the removed metadata rail toggle`,
		);
	}

	const navSource = readBlockFile("experimental-v3/components/work-item-section-nav.tsx");
	// Links + aria-current, never ARIA tabs: on a stacked page every section is
	// on screen at once, so tab semantics would misdescribe the surface.
	assert.match(navSource, /<nav\b/u);
	assert.match(navSource, /href=\{`#\$\{sectionElementId\(section\.id\)\}`\}/u);
	assert.match(navSource, /aria-current=\{section\.id === activeSectionId \? "location" : undefined\}/u);
	assert.doesNotMatch(navSource, /role="tab"|aria-selected=|aria-controls=|<TabsTrigger/u);

	const detailViewSource = readBlockFile(
		"experimental-v3/components/pull-request-detail/pull-request-detail-view.tsx",
	);
	assert.doesNotMatch(detailViewSource, /<TabsList|<TabsContent|tabNavigation/u);
});

test("the v3 control row is consolidated and Reporter moved back to Details", () => {
	const resourcesSource = readBlockFile("experimental-v3/components/context-resources.tsx");
	assert.match(
		resourcesSource,
		/<StatusPill[\s\S]*<ContextTitleActions[\s\S]*aria-label="Add to work item"/u,
		"control row order must be status, coding agent, then the plus menu",
	);
	assert.match(resourcesSource, /const \[selectedAgentId, setSelectedAgentId\] = useState<CodingAgentId \| null>/u);
	assert.match(resourcesSource, /compact \? \([\s\S]*<ContextTitleActionsSubmenu[\s\S]*<DropdownMenuSeparator \/>[\s\S]*resources\.map/u);
	assert.doesNotMatch(
		resourcesSource,
		/PullRequestsSelect|pullRequestEntries|selectedPullRequestIdentity|onPullRequestSelect|onPullRequestClear|pullRequestSelected/u,
	);
	assert.doesNotMatch(
		resourcesSource,
		/showDescriptionTools|Copy work item as markdown|EditorToolbarModeTabs|aria-label="Copy work item as markdown"/u,
	);

	// The read-only pull-request Tag dissolved into the interactive Select.
	assert.match(
		readBlockFile("experimental-v3/components/pull-requests-select.tsx"),
		/span[\s\S]*className="shrink-0 text-xs font-normal text-text-subtlest"[\s\S]*\{pullRequestCount\}/u,
	);

	const detailsTabSource = readBlockFile("experimental-v3/components/details-tab.tsx");
	assert.match(
		detailsTabSource,
		/label="Reporter">[\s\S]*<PersonRowField[\s\S]*ariaLabel="Change reporter"[\s\S]*onChange=\{\(person\) => onChange\(\{ reporter: person \}\)\}[\s\S]*value=\{draft\.reporter\}/u,
	);
	assert.match(
		detailsTabSource,
		/import \{ ArtifactProjectField \} from "@\/components\/blocks\/artifact-pane\/artifact-project-field";/u,
	);
	assert.match(
		detailsTabSource,
		/<ArtifactProjectField onChange=\{\(id\) => onChange\(\{ atlassianProject: id \}\)\} value=\{draft\.atlassianProject\} \/>/u,
	);

	const titleBarSource = readBlockFile("experimental-v3/components/context-title-bar.tsx");
	assert.doesNotMatch(titleBarSource, /<StatusPill|<ContextTitleMeta|<PersonLabel/u);
	assert.match(
		titleBarSource,
		/"min-w-0 self-stretch px-6"[\s\S]*compact \? "pb-0" : "pb-4"/u,
	);
	assert.match(
		titleBarSource,
		/<ContextEditableTitle compact=\{compact\} \/>[\s\S]*\{controlRow\(compact\)\}/u,
	);
	assert.match(titleBarSource, /useWorkItemHeaderVariant\(\)/u);
	assert.match(titleBarSource, /data-header-variant=\{variant\}/u);
	assert.match(titleBarSource, /layout=\{layout\}/u);
	const titleTreatmentSource = readBlockFile(
		"experimental-v3/components/inline-edit-treatment.ts",
	);
	assert.match(
		titleTreatmentSource,
		/CONTEXT_TITLE_FONT_STYLE = \{[\s\S]*font: token\("font\.heading\.xxlarge"\)[\s\S]*lineHeight: "2\.75rem"/u,
	);
	assert.match(
		titleTreatmentSource,
		/CONTEXT_TITLE_COMPACT_FONT_STYLE = \{[\s\S]*font: token\("font\.heading\.small"\)/u,
	);
	assert.match(
		readBlockFile("experimental-v3/components/context-editable-header.tsx"),
		/font-medium!/u,
	);
	assert.doesNotMatch(titleTreatmentSource, /fontWeight/u);
	assert.doesNotMatch(
		titleTreatmentSource,
		/font: token\("font\.heading\.medium"\)/u,
	);

	const resourcesSourceWithCompactState = readBlockFile(
		"experimental-v3/components/context-resources.tsx",
	);
	assert.match(
		resourcesSourceWithCompactState,
		/compact \? null : \([\s\S]*<ContextTitleActions[\s\S]*selectedAgentId=\{selectedAgentId\}/u,
	);
	const titleActionsSource = readBlockFile("experimental-v3/components/context-title-actions.tsx");
	assert.match(titleActionsSource, /export function ContextTitleActionsSubmenu/u);
	assert.match(titleActionsSource, /positionerClassName="z-\[503\]"/u);
	assert.match(titleActionsSource, /<DropdownMenuSubTrigger className="gap-3">[\s\S]*className="inline-flex size-6 shrink-0 items-center justify-center/u);
	assert.match(titleActionsSource, /CODING_AGENTS\.map[\s\S]*<DropdownMenuItem[\s\S]*elemBefore=/u);
	assert.doesNotMatch(titleActionsSource, /DropdownMenuRadioGroup|DropdownMenuRadioItem/u);
	assert.match(titleActionsSource, /<DropdownMenuSubTrigger className="gap-3">[\s\S]*Open in[\s\S]*<DropdownMenuSubContent/u);
	assert.match(
		resourcesSourceWithCompactState,
		/style=\{compact \? \{ containerType: "normal" \} : undefined\}/u,
	);
});

test("the v3 dialog owns one fixed chrome row", () => {
	const dialogSource = readBlockFile("experimental-v3/components/experimental-work-item-dialog.tsx");
	assert.match(dialogSource, /grid-rows-\[auto_minmax\(0,1fr\)\]/u);
	assert.match(
		dialogSource,
		/data-jira-work-item-header-band[\s\S]*<ContextTitleBar controlRow=\{controlRow\} \/>[\s\S]*\{navigation\}/u,
	);
	assert.doesNotMatch(dialogSource, /position:\s*sticky|sticky top-0/u);

	const navSource = readBlockFile("experimental-v3/components/work-item-section-nav.tsx");
	assert.match(navSource, /data-work-item-section-nav/u);
	assert.match(navSource, /data-work-item-header-navigation/u);
	assert.match(navSource, /useWorkItemHeaderVariant/u);
	assert.match(navSource, /data-header-variant=\{variant\}/u);
	assert.match(navSource, /"group\/work-item-navigation @container\/resource-row border-b transition-colors/u);
	assert.match(navSource, /variant === "compact" \? "border-border-disabled" : "border-transparent"/u);
	assert.match(navSource, /className="flex items-center gap-1 px-4\.5"/u);
	assert.doesNotMatch(navSource, /ml-auto/u);
	assert.match(navSource, /from "@\/components\/ui\/tabs-experimental"/u);
	assert.match(navSource, /tabsExperimentalListClass/u);
	assert.match(navSource, /tabsExperimentalTriggerClass/u);
	assert.doesNotMatch(navSource, /tabsLineListOverflowClass/u);
	assert.match(navSource, /FOCUS_RING_CLIP_GUTTER/u);
	assert.match(
		navSource,
		/"box-content min-w-0 overflow-x-auto overflow-y-hidden",\s*FOCUS_RING_CLIP_GUTTER/u,
	);
	assert.match(navSource, /NAV_LINK_CLASS = tabsExperimentalTriggerClass/u);
	assert.doesNotMatch(navSource, /export const NAV_LINK_CLASS/u);
	assert.doesNotMatch(navSource, /font\.heading\.xxsmall/u);
	assert.match(navSource, /NAV_LIST_CLASS = cn\([\s\S]*tabsExperimentalListClass/u);
	assert.doesNotMatch(navSource, /NAV_LIST_CLASS = "[^"]*border-b/u);
	assert.doesNotMatch(navSource, /sticky top-0/u);
	assert.doesNotMatch(navSource, /@\[860px\]\/agentlayout:static/u);
	assert.doesNotMatch(navSource, /-mx-6 -mt-6 px-6 pt-6/u);

	const compositionSource = readBlockFile("experimental-v3/experimental-v3-jira-work-item.tsx");
	assert.match(
		compositionSource,
		/navigation=\{\([\s\S]*<WorkItemSectionNav[\s\S]*endControl=\{\([\s\S]*<PullRequestsSelect/u,
	);
	assert.doesNotMatch(compositionSource, /header=\{|<ContextHeader/u);

	const layoutSource = readBlockFile("experimental-v3/components/experimental-work-item-layout.tsx");
	assert.doesNotMatch(layoutSource, /header: ReactNode|chrome: ReactNode|chrome=\{header\}/u);
	assert.match(layoutSource, /<StickyRowScrollFade/u);
	assert.match(layoutSource, /data-jira-work-item-column-chrome/u);
	assert.match(
		layoutSource,
		/data-jira-work-item-column-chrome[\s\S]*@\[860px\]\/agentlayout:overflow-y-auto @\[860px\]\/agentlayout:overscroll-y-none @\[860px\]\/agentlayout:px-6 @\[860px\]\/agentlayout:pt-6 @\[860px\]\/agentlayout:pb-6"[\s\S]*data-jira-work-item-scroll-region/u,
	);
	assert.match(layoutSource, /setWideScrollContainer\(element\)/u);
	assert.match(layoutSource, /setNarrowScrollContainer\(element\)/u);

	const contextPanelSource = readBlockFile("experimental-v3/components/context-panel.tsx");
	assert.doesNotMatch(contextPanelSource, /ContextHeader|data-jira-work-item-context-header|WorkItemSectionNav/u);

	const spyHookSource = readBlockFile("experimental-v3/hooks/use-scroll-spy-sections.ts");
	assert.match(
		spyHookSource,
		/export const SCROLL_SPY_STICKY_HEADER_SELECTOR =\s*"\[data-jira-work-item-pull-request-detail-header\]"/u,
	);
	assert.doesNotMatch(spyHookSource, /data-work-item-section-nav/u);

	// Read the applied style rather than mirroring the breakpoint in JS, so the
	// resolver cannot drift from the container query that drives it.
	const navigationSource = readBlockFile("experimental-v3/context-section-navigation.tsx");
	assert.match(navigationSource, /useSyncExternalStore/u);
	assert.match(
		navigationSource,
		/\(scrollContainer\?\.scrollTop \?\? 0\) >= collapseOffset \? "compact" : "expanded"/u,
	);
	assert.match(
		navigationSource,
		/getComputedStyle\(wideScrollContainer\)\.display !== "contents"/u,
	);
	assert.match(navigationSource, /new ResizeObserver\(syncActiveScroller\)/u);
	assert.match(navigationSource, /if \(!active \|\| !wideScrollContainer \|\| !narrowScrollContainer\)/u);
	assert.match(navigationSource, /\[active, narrowScrollContainer, wideScrollContainer\]/u);
	assert.match(
		dialogSource,
		/<motion\.div[\s\S]*data-jira-work-item-header-band[\s\S]*layout=\{headerLayout\}[\s\S]*<ContextTitleBar controlRow=\{controlRow\} \/>/u,
	);
	assert.match(
		readBlockFile("experimental-v3/experimental-v3-jira-work-item.tsx"),
		/<SectionNavigationProvider active=\{open\}>/u,
	);

	const stickyShellSource = readBlockFile(
		"experimental-v3/components/pull-request-detail/pull-request-sticky-header-shell.tsx",
	);
	assert.match(stickyShellSource, /@\[860px\]\/agentlayout:sticky @\[860px\]\/agentlayout:top-0/u);
	assert.doesNotMatch(stickyShellSource, /"sticky top-0/u);

	// Regression: the block's docs page mounts three v3 examples at once, so
	// fixed section ids would make `aria-labelledby` ambiguous and point every
	// anchor at the first demo.
	assert.match(navigationSource, /const instanceId = useId\(\)/u);
	assert.match(
		readBlockFile("experimental-v3/lib/work-item-section-tabs.ts"),
		/workItemSectionElementId\(\s*instanceId: string,\s*sectionId: WorkItemSectionId,\s*\): string \{\s*return `work-item-section-\$\{instanceId\}-\$\{sectionId\}`/u,
	);

	assert.match(spyHookSource, /\}, \[sectionIds, stickyHeaderSelector\]\);/u);
	assert.doesNotMatch(spyHookSource, /sectionIdsRef/u);
});

test("PR select shares the section navigation list without becoming a section", () => {
	const navSource = readBlockFile("experimental-v3/components/work-item-section-nav.tsx");
	assert.match(
		navSource,
		/<ul className=\{NAV_LIST_CLASS\}>[\s\S]*\{endControl != null \? \([\s\S]*<li[\s\S]*data-work-item-navigation-end-control[\s\S]*\{endControl\}[\s\S]*<\/li>[\s\S]*<\/ul>/u,
	);
	assert.doesNotMatch(navSource, /<\/nav>\s*\) : null\}\s*\{endControl != null/u);
	assert.match(navSource, /onSectionSelect\?\.\(\);/u);

	const selectSource = readBlockFile("experimental-v3/components/pull-requests-select.tsx");
	assert.match(selectSource, /tabsExperimentalTriggerClass/u);
	assert.doesNotMatch(selectSource, /font\.heading\.xxsmall/u);
	assert.match(selectSource, /className="inline-flex h-full min-w-0 items-stretch"/u);
	assert.match(selectSource, /const HOVER_CLOSE_DELAY_MS = 100/u);
	assert.match(selectSource, /<Select[\s\S]*onOpenChange=\{handleOpenChange\}[\s\S]*open=\{open\}/u);
	assert.match(
		selectSource,
		/onMouseEnter=\{handleTriggerMouseEnter\}[\s\S]*onMouseLeave=\{scheduleHoverClose\}/u,
	);
	assert.match(selectSource, /retainHoverOpenOnTriggerPressRef/u);
	assert.match(selectSource, /onPointerDownCapture[\s\S]*hoverOpenedRef\.current/u);
	assert.match(
		selectSource,
		/<SelectContent[\s\S]*onMouseEnter=\{cancelHoverClose\}[\s\S]*onMouseLeave=\{scheduleHoverClose\}/u,
	);
	assert.match(selectSource, /data-popup-open:rounded-md/u);
	assert.match(selectSource, /group-data-\[header-variant=compact\]\/work-item-navigation:data-popup-open:rounded-b-none/u);
	assert.match(selectSource, /data-\[variant=none\]:border-x-\[6px\]! data-\[variant=none\]:border-x-transparent!/u);
	assert.doesNotMatch(selectSource, /data-popup-open:bg-bg-neutral-subtle-hovered!/u);
	assert.match(selectSource, /variant="none"/u);
	assert.match(selectSource, /const TRIGGER_LABEL = "Pull requests"/u);
	assert.match(selectSource, /aria-current=\{selectedIdentity \? "location" : undefined\}/u);
	assert.match(
		selectSource,
		/<span[\s\S]*className="shrink-0 text-xs font-normal text-text-subtlest"[\s\S]*\{pullRequestCount\}/u,
	);
	assert.doesNotMatch(selectSource, /<Badge|pullRequestMetricBadgeVariant|lime: "success"|summarizePullRequestTagMetrics/u);
	assert.doesNotMatch(selectSource, /"1 Open"/u);
	assert.match(
		navSource,
		/<span[\s\S]*className=\{cn\([\s\S]*"shrink-0 text-xs font-normal"[\s\S]*section\.id === activeSectionId \? "text-text" : "text-text-subtlest"[\s\S]*\{activityCount\}/u,
	);
	assert.doesNotMatch(navSource, /<Badge>\{activityCount\}<\/Badge>/u);
	assert.doesNotMatch(selectSource, /Review pull request/u);
	assert.doesNotMatch(selectSource, /PullRequestIcon|@atlaskit\/icon\/core\/pull-request/u);
	assert.doesNotMatch(selectSource, /@max-\[36rem\]\/resource-row:hidden/u);
	assert.doesNotMatch(selectSource, /data-variant=default|variant="default"|SelectTag/u);

	const sectionTabsSource = readBlockFile("experimental-v3/lib/work-item-section-tabs.ts");
	assert.match(
		sectionTabsSource,
		/export type WorkItemSectionId = "description" \| "activity" \| "insights" \| "guide" \| "files"/u,
	);
	assert.match(
		sectionTabsSource,
		/id: "description", label: "Description"[\s\S]*id: "activity", label: "Activity"[\s\S]*id: "insights", label: "Insights"/u,
	);
	assert.doesNotMatch(
		readBlockFile("experimental-v3/components/work-item-body.tsx"),
		/id="insights"/u,
	);
	assert.match(
		readBlockFile("experimental-v3/components/context-panel.tsx"),
		/selectedPullRequestEntry \? \([\s\S]*<PullRequestDetailView[\s\S]*insightsSelected \? \([\s\S]*<InsightsPanel[\s\S]*<WorkItemBody/u,
	);
	assert.match(
		readBlockFile("experimental-v3/context-section-navigation.tsx"),
		/export function usePublishActivityCount\(count: number\): void \{\s*const \{ setActivityCount \} = useSectionNavigation\(\);\s*useEffect\(\(\) => \{\s*setActivityCount\(count\);\s*\}, \[count, setActivityCount\]\);/u,
	);
	assert.doesNotMatch(
		readBlockFile("experimental-v3/context-section-navigation.tsx"),
		/return \(\) => setActivityCount\(null\)/u,
	);
	assert.match(
		readBlockFile("experimental-v3/components/insights-panel.tsx"),
		/data-work-item-insights-panel/u,
	);
	assert.doesNotMatch(
		readBlockFile("experimental-v3/components/insights-panel.tsx"),
		/Summary|Key decisions|Sources|coming soon|chart/u,
	);
	const contextPillsSource = readBlockFile("experimental-v3/components/activity-composer-context-pills.tsx");
	assert.match(contextPillsSource, /justify-between/u);
	assert.match(contextPillsSource, /onSectionSelect\?\.\(\);\s*selectSection\("insights"\)/u);
	assert.match(contextPillsSource, /setNewInsightsDismissed\(true\)/u);
	assert.match(
		readBlockFile("experimental-v3/components/activity-composer-new-insights-pill.tsx"),
		/data-jira-work-item-new-insights-pill/u,
	);
	assert.match(
		readBlockFile("experimental-v3/components/activity-composer-new-insights-pill.tsx"),
		/@atlaskit\/icon\/core\/lightbulb/u,
	);
	assert.doesNotMatch(sectionTabsSource, /pull-request/u);

	const compositionSource = readBlockFile("experimental-v3/experimental-v3-jira-work-item.tsx");
	assert.match(
		compositionSource,
		/<WorkItemSectionNav[\s\S]*endControl=\{\([\s\S]*<PullRequestsSelect[\s\S]*entries=\{pullRequestEntries\}/u,
	);
	assert.match(
		compositionSource,
		/<WorkItemSectionNav[\s\S]*onSectionSelect=\{selectedPullRequestIdentity \? handlePullRequestClear : undefined\}[\s\S]*<ActivityComposer[\s\S]*onSectionSelect=\{selectedPullRequestIdentity \? handlePullRequestClear : undefined\}/u,
	);
	assert.doesNotMatch(compositionSource, /showDescriptionTools|descriptionViewMode|onDescriptionViewModeChange/u);
});

test("experimental v3 does not render a closed-state floating Rovo launcher", () => {
	const sessionSurfaceSource = readBlockFile("experimental-v3/components/floating-session-surface.tsx");
	assert.match(sessionSurfaceSource, /<AsxRovoOverlay[\s\S]*launcher="hidden"/u);
	assert.doesNotMatch(sessionSurfaceSource, /launcherContainer|LAUNCHER_PLACEMENT|onLauncherClick/u);
	assert.doesNotMatch(sessionSurfaceSource, /data-jira-work-item-dialog-body/u);
});

test("experimental v3 shares the session/planner data layer", () => {
	assert.match(
		readBlockFile("experimental-v3/experimental-v3-jira-work-item.tsx"),
		/@\/components\/blocks\/jira-work-item\/data\/session-state/u,
	);
	assert.match(
		readBlockFile("experimental-v3/use-jira-work-item-controller.ts"),
		/@\/components\/blocks\/jira-work-item\/data\/session-state/u,
	);
	// No forked copy of the model lives under v3.
	assert.equal(fs.existsSync(path.join(V3_DIR, "data")), false);

	const fixturesSource = readBlockFile("data/session-fixtures.ts");
	const sessionStateSource = readBlockFile("data/session-state.ts");
	assert.match(fixturesSource, /export const FILLED_ATLASSIAN_PROJECT = STOREFRONT_PLATFORM_PROJECT\.id/u);
	assert.equal(
		(sessionStateSource.match(/atlassianProject: FILLED_ATLASSIAN_PROJECT/gu) ?? []).length,
		2,
	);
});

test("Activity sort hover-reveals from the section group, not a local copy", () => {
	const sectionSource = readBlockFile("experimental-v3/components/work-item-section.tsx");
	const activityPanelSource = readBlockFile("experimental-v3/components/activity-panel.tsx");
	const headerSource = fs.readFileSync(
		path.join(BLOCK_DIR, "../jira-activity/jira-activity-header.tsx"),
		"utf8",
	);

	assert.match(sectionSource, /id === "activity" \? "group\/activity"/u);
	assert.match(activityPanelSource, /<JiraActivityViewControl/u);
	assert.match(activityPanelSource, /hideHeader/u);
	assert.doesNotMatch(activityPanelSource, /Show oldest|ACTIVITY_SORT_TRIGGER_REVEAL_CLASS/u);
	assert.match(headerSource, /ACTIVITY_SORT_TRIGGER_REVEAL_CLASS/u);
	assert.match(headerSource, /group-hover\/activity:opacity-100/u);
});

test("experimental v3 header Actions menu copies the work item as markdown", () => {
	const overflowMenuSource = readBlockFile(
		"experimental-v3/components/experimental-header-overflow-menu.tsx",
	);
	const descriptionSource = readBlockFile(
		"experimental-v3/components/context-editable-header.tsx",
	);

	assert.match(
		overflowMenuSource,
		/\[\{ label: "Permission" \}, \{ label: "Watch", count: 1 \}, \{ label: "Share" \}\]/u,
	);
	assert.match(
		overflowMenuSource,
		/\{ label: "Copy work item as markdown", action: "copy-markdown" \}/u,
	);
	assert.match(
		overflowMenuSource,
		/\{ label: "Copy work item as markdown", action: "copy-markdown" \},[\s\S]*\{ label: "Print" \},[\s\S]*\{ label: "Export to", submenu: \["Excel", "Word", "XML"\] \}/u,
	);
	assert.match(overflowMenuSource, /aria-label="Actions"/u);
	assert.match(
		overflowMenuSource,
		/const markdown = `# \$\{workItemCode\}: \$\{title\}\$\{description \? `\\n\\n\$\{description\}` : ""\}`;/u,
	);
	assert.match(overflowMenuSource, /navigator\.clipboard\.writeText\(markdown\)/u);
	assert.match(overflowMenuSource, /case "copy-markdown":/u);
	assert.doesNotMatch(
		readBlockFile("experimental-v3/components/context-resources.tsx"),
		/Copy work item as markdown|EditorToolbarModeTabs/u,
	);
	assert.match(descriptionSource, /viewMode="rendered"/u);
	assert.doesNotMatch(descriptionSource, /onViewModeChange/u);
});

test("the v3 lib test suite is registered so it actually runs in CI", () => {
	// Tests under `components/**` are inert unless they are explicitly listed in
	// the unit-test manifest, so a forked test file is worthless until it is
	// classified. Every v2 lib test that runs must have a running v3 twin.
	const manifestSource = fs.readFileSync(path.join(BLOCK_DIR, "../../../scripts/js-unit-test-manifest.mjs"), "utf8");
	const registeredV2Tests = [...manifestSource.matchAll(/"components\/blocks\/jira-work-item\/experimental-v2\/lib\/([\w-]+\.test\.js)"/gu)].map(
		(match) => match[1],
	);

	assert.ok(registeredV2Tests.length > 0, "expected the v2 lib tests to be registered in the unit-test manifest");

	for (const testFile of registeredV2Tests) {
		assert.match(
			manifestSource,
			new RegExp(`"components/blocks/jira-work-item/experimental-v3/lib/${testFile}"`, "u"),
			`${testFile} runs for v2 but its v3 twin is not registered in the unit-test manifest`,
		);
		assert.ok(
			fs.existsSync(path.join(V3_DIR, "lib", testFile)),
			`${testFile} is registered for v3 but the file does not exist`,
		);
	}
});
