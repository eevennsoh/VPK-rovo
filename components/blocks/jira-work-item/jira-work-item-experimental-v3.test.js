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
	// v3's divergence: Description / Activity (+ Guide / Files under a guided PR)
	// became a single scroll-linked nav in the left column, replacing both the
	// metadata rail's Details/Activity toggle and the pull-request tab strip.
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
		/<StatusPill[\s\S]*<PullRequestsSelect[\s\S]*<ContextTitleActions[\s\S]*aria-label="Add to work item"/u,
		"control row order must be status, pull requests, coding agent, then the plus menu",
	);

	// The read-only pull-request Tag dissolved into the interactive Select.
	assert.match(
		readBlockFile("experimental-v3/components/pull-requests-select.tsx"),
		/summarizePullRequestTagMetrics/u,
	);

	const detailsTabSource = readBlockFile("experimental-v3/components/details-tab.tsx");
	assert.match(
		detailsTabSource,
		/label="Reporter">[\s\S]*<PersonReadOnlyValue placeholder="Unassigned" value=\{draft\.reporter \?\? null\} \/>/u,
	);

	const titleBarSource = readBlockFile("experimental-v3/components/context-title-bar.tsx");
	assert.doesNotMatch(titleBarSource, /<StatusPill|<ContextTitleMeta|<PersonLabel/u);
});

test("the v3 section nav pins in narrow mode and tracks the active scroller", () => {
	const navSource = readBlockFile("experimental-v3/components/work-item-section-nav.tsx");
	// Narrow flattens the column chrome into the page scroller, so the nav has to
	// pin itself; wide already has it as a fixed sibling above the scrollport.
	assert.match(navSource, /sticky top-0/u);
	assert.match(navSource, /@\[860px\]\/agentlayout:static/u);
	assert.match(navSource, /data-work-item-section-nav/u);

	const layoutSource = readBlockFile("experimental-v3/components/experimental-work-item-layout.tsx");
	assert.match(layoutSource, /setWideScrollContainer\(element\)/u);
	assert.match(layoutSource, /setNarrowScrollContainer\(element\)/u);

	// Regression: a sticky element pins within its containing block, so every
	// ancestor between the nav and the page scroller must be `display: contents`
	// in narrow mode. When ContextHeader was a plain `shrink-0` block the nav
	// stuck inside that header-height box and scrolled off with it.
	const contextPanelSource = readBlockFile("experimental-v3/components/context-panel.tsx");
	assert.match(
		contextPanelSource,
		/className="contents @\[860px\]\/agentlayout:block @\[860px\]\/agentlayout:shrink-0"[\s\S]*data-jira-work-item-context-header/u,
	);

	// Read the applied style rather than mirroring the breakpoint in JS, so the
	// resolver cannot drift from the container query that drives it.
	const navigationSource = readBlockFile("experimental-v3/context-section-navigation.tsx");
	assert.match(
		navigationSource,
		/getComputedStyle\(wideScrollContainer\)\.display !== "contents"/u,
	);
	assert.match(navigationSource, /new ResizeObserver\(syncActiveScroller\)/u);

	// Regression: the nav pins at `top-0` with a higher z-index than the
	// pull-request header. Below 860px both are in the same scrollport, so the
	// header must not also pin or the nav covers its title and actions.
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

	// Render must stay pure — the shared spy closes over its id list rather than
	// mirroring it into a ref that render would have to mutate.
	const spyHookSource = readBlockFile("experimental-v3/hooks/use-scroll-spy-sections.ts");
	assert.match(spyHookSource, /\}, \[sectionIds, stickyHeaderSelector\]\);/u);
	assert.doesNotMatch(spyHookSource, /sectionIdsRef/u);
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
