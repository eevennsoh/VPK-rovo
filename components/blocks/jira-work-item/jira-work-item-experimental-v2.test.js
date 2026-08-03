const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

// Contract tests for the `experimental-v2` fork of the Jira Work Item surface.
//
// v2 was created as a full copy of `experimental/` so it can diverge on any
// pixel without risk to v1. These tests protect the two properties that make
// that fork safe rather than merely duplicated:
//
//   1. Isolation — neither tree imports the other, so an edit in one can never
//      change the other's rendered surface.
//   2. A shared model — the session/planner reducer under `data/` stays single-
//      sourced, so behavioral fixes reach both variants.
//
// As v2 diverges, the "starts as a duplicate" assertion below is expected to be
// relaxed; isolation and the shared model are the durable contracts.

const BLOCK_DIR = __dirname;
const V1_DIR = path.join(BLOCK_DIR, "experimental");
const V2_DIR = path.join(BLOCK_DIR, "experimental-v2");

// V2 intentionally diverges in its ArtifactPane-backed metadata rail and its
// persistent-panel header controls. Every other mirrored module stays
// structurally synchronized with v1.
const V2_DIVERGENCES = new Set([
	"components/context-panel.tsx",
	"components/context-editable-header.tsx",
	"components/context-resources.tsx",
	"components/context-title-actions.tsx",
	"components/context-title-bar.tsx",
	"components/details-sections.tsx",
	"components/experimental-breadcrumb-actions.tsx",
	"components/experimental-work-item-dialog.tsx",
	"components/experimental-work-item-layout.tsx",
	"components/details-tab.tsx",
	"components/activity-panel.tsx",
	"components/metadata-rail.tsx",
	"experimental-v2-jira-work-item.tsx",
]);

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

test("experimental v2 exists with a distinctly named composition root", () => {
	assert.ok(fs.existsSync(V2_DIR));

	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");
	assert.match(compositionSource, /export function ExperimentalV2JiraWorkItem\(/u);
	assert.match(compositionSource, /export default ExperimentalV2JiraWorkItem;/u);
	assert.match(compositionSource, /export type ExperimentalV2JiraWorkItemProps/u);
	// The v1 root filename must not linger in v2 — both roots are imported side
	// by side by the block index, so their names have to stay distinct.
	assert.equal(fs.existsSync(path.join(V2_DIR, "experimental-jira-work-item.tsx")), false);
});

test("experimental v2 and v1 are mutually isolated", () => {
	for (const filePath of listSourceFiles(V2_DIR)) {
		assert.doesNotMatch(
			fs.readFileSync(filePath, "utf8"),
			/jira-work-item\/experimental\//u,
			`${path.relative(BLOCK_DIR, filePath)} still imports from the v1 experimental tree`,
		);
	}

	for (const filePath of listSourceFiles(V1_DIR)) {
		assert.doesNotMatch(
			fs.readFileSync(filePath, "utf8"),
			/experimental-v2/u,
			`${path.relative(BLOCK_DIR, filePath)} leaks a v2 reference into the v1 tree`,
		);
	}
});

test("experimental v2 starts as a structural duplicate of v1", () => {
	const v1Files = listSourceFiles(V1_DIR)
		.map((filePath) => path.relative(V1_DIR, filePath))
		.filter((relativePath) => relativePath !== "experimental-jira-work-item.tsx")
		.sort();
	const v2Files = listSourceFiles(V2_DIR)
		.map((filePath) => path.relative(V2_DIR, filePath))
		.filter((relativePath) => relativePath !== "experimental-v2-jira-work-item.tsx")
		.sort();

	assert.deepEqual(v2Files, v1Files);

	// Every remaining file differs from its v1 twin only in the rewritten import path.
	for (const relativePath of v2Files) {
		if (V2_DIVERGENCES.has(relativePath)) {
			continue;
		}
		const v1Source = fs.readFileSync(path.join(V1_DIR, relativePath), "utf8");
		const v2Source = fs.readFileSync(path.join(V2_DIR, relativePath), "utf8");
		const normalizedV2 = v2Source
			.replaceAll("jira-work-item/experimental-v2/", "jira-work-item/experimental/")
			.replaceAll("jira-activity-adapter-v2-harness.cjs", "jira-activity-adapter-harness.cjs");
		assert.equal(normalizedV2, v1Source, `${relativePath} has diverged from its v1 twin`);
	}
});

test("experimental v2 shares the session/planner data layer with v1", () => {
	assert.match(
		readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx"),
		/@\/components\/blocks\/jira-work-item\/data\/session-state/u,
	);
	assert.match(
		readBlockFile("experimental-v2/use-jira-work-item-controller.ts"),
		/@\/components\/blocks\/jira-work-item\/data\/session-state/u,
	);
	// No forked copy of the model lives under v2.
	assert.equal(fs.existsSync(path.join(V2_DIR, "data")), false);
});

test("context popover tab navigation keeps the shared default height and top gap", () => {
	for (const variant of ["experimental", "experimental-v2"]) {
		for (const popover of ["attachments-popover.tsx", "subtasks-popover.tsx", "linked-work-items-popover.tsx"]) {
			const popoverSource = readBlockFile(`${variant}/components/${popover}`);

			assert.match(popoverSource, /<TabsList variant="line" className="mt-2\.5 w-full px-2\.5">/u);
			assert.doesNotMatch(popoverSource, /<TabsList[^>]*\bpt-/u);
		}
	}
});

test("experimental v2 keeps the metadata panel visible and uses compact header bottom padding", () => {
	const dialogSource = readBlockFile("experimental-v2/components/experimental-work-item-dialog.tsx");
	const headerActionsSource = readBlockFile("experimental-v2/components/experimental-breadcrumb-actions.tsx");

	assert.match(dialogSource, /paddingBottom=\{token\("space\.100"\)\}/u);
	assert.match(dialogSource, /closeButtonDisabled=\{presentation === "inline"\}/u);
	assert.doesNotMatch(dialogSource, /showClose=\{presentation !== "inline"\}/u);
	assert.match(headerActionsSource, /aria-label="Collapse"/u);
	assert.match(headerActionsSource, /<ContextHeaderActions \/>[\s\S]*aria-label="Collapse"/u);
	assert.doesNotMatch(headerActionsSource, /Show metadata panel|Hide metadata panel/u);
	assert.doesNotMatch(headerActionsSource, /usePanelLayout|Popover|PanelRightIcon/u);
});

test("experimental v2 aligns the title with Details and renders controls in the resource row", () => {
	const globalCss = fs.readFileSync(path.join(BLOCK_DIR, "../../../app/globals.css"), "utf8");
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");
	const contextPanelSource = readBlockFile("experimental-v2/components/context-panel.tsx");
	const contextResourcesSource = readBlockFile("experimental-v2/components/context-resources.tsx");
	const dialogSource = readBlockFile("experimental-v2/components/experimental-work-item-dialog.tsx");
	const titleActionsSource = readBlockFile("experimental-v2/components/context-title-actions.tsx");
	const titleBarSource = readBlockFile("experimental-v2/components/context-title-bar.tsx");

	assert.match(
		compositionSource,
		/<ContextPanel[\s\S]*primaryCodingAgentId=\{props\.primaryCodingAgentId\}/u,
	);
	assert.match(
		contextPanelSource,
		/<ContextTitleBar \/>[\s\S]*<AiPlannerScope[\s\S]*<ContextResources[\s\S]*descriptionViewMode=\{descriptionViewMode\}[\s\S]*outputs=\{outputs\}[\s\S]*primaryCodingAgentId=\{primaryCodingAgentId\}[\s\S]*onDescriptionViewModeChange=\{setDescriptionViewMode\}/u,
	);
	assert.match(contextPanelSource, /<section aria-label="Work item context" className="flex flex-col gap-2">/u);
	assert.doesNotMatch(contextPanelSource, /<section aria-label="Work item context" className="flex flex-col gap-3">/u);
	assert.match(
		contextResourcesSource,
		/"sticky top-0 z-10 \[container-type:scroll-state\]"[\s\S]*data-jira-work-item-resource-row[\s\S]*className="flex flex-wrap items-start gap-2[^"]*"[\s\S]*data-jira-work-item-resource-row-content[\s\S]*resources\.map\(\(resource\) =>[\s\S]*resource\.renderAddButton[\s\S]*<AnimatedContextTitleActions primaryAgentId=\{primaryCodingAgentId\} \/>/u,
	);
	assert.match(
		contextResourcesSource,
		/const hasPlanner = planner\.status !== "inactive" && planner\.status !== "applied";[\s\S]*hasPlanner[\s\S]*\? "bg-bg-input \[&_\[data-slot=button\]\]:bg-bg-input[^"]*"[\s\S]*: "bg-surface-overlay"/u,
	);
	assert.doesNotMatch(contextResourcesSource, /\[&_\[data-slot=tabs-list\]\]:bg-bg-input/u);
	assert.doesNotMatch(contextResourcesSource, /\[&_\[data-slot=tabs-trigger\]\[data-active\]\]:bg-bg-input/u);
	assert.match(
		contextResourcesSource,
		/import \{ StickyRowScrollFade \} from "@\/components\/visual\/scroll-mask";[\s\S]*data-jira-work-item-resource-row[\s\S]*<StickyRowScrollFade data-slot="jira-work-item-resource-row-scroll-fade" \/>/u,
	);
	assert.doesNotMatch(contextResourcesSource, /<div className="flex flex-col gap-4">/u);
	assert.match(
		globalCss,
		/@container scroll-state\(stuck: top\) \{[\s\S]*\[data-jira-work-item-resource-row-content\] \{[\s\S]*padding-bottom: var\(--ds-space-100, 8px\);/u,
	);
	assert.match(
		globalCss,
		/\[data-jira-work-item-resource-row-content\]::before,[\s\S]*\[data-slot="jira-activity-header"\] > :first-child::before \{[\s\S]*bottom: 100%;[\s\S]*height: 2rem;[\s\S]*background: inherit;/u,
	);
	assert.doesNotMatch(contextResourcesSource, /className="flex flex-wrap items-start gap-1/u);
	assert.match(
		contextResourcesSource,
		/<div className="ml-auto shrink-0">[\s\S]*<EditorToolbarModeTabs[\s\S]*mode=\{descriptionViewMode\}[\s\S]*onModeChange=\{onDescriptionViewModeChange\}/u,
	);
	assert.match(contextResourcesSource, /buttonLabel: "Add attachments",[\s\S]*<AttachmentIcon label="" size="small" \/>/u);
	assert.match(contextResourcesSource, /buttonLabel: "Add subtasks",[\s\S]*<ChildWorkItemsIcon label="" size="small" \/>/u);
	assert.match(contextResourcesSource, /buttonLabel: "Link work item",[\s\S]*<LinkIcon label="" size="small" \/>[\s\S]*<LinkedWorkItemsPopover key="linkedItems" trigger=\{trigger\} \/>/u);
	assert.match(contextResourcesSource, /<Button aria-label=\{resource\.buttonLabel\} size="icon" type="button" variant="outline">[\s\S]*\{resource\.icon\}/u);
	assert.doesNotMatch(contextResourcesSource, /CommitIcon|BranchIcon|aria-label="Commit"|aria-label="Branch"/u);
	assert.doesNotMatch(contextResourcesSource, /<Button size="compact" type="button" variant="outline">/u);
	assert.doesNotMatch(contextResourcesSource, /const empty =|empty\.map/u);
	assert.doesNotMatch(contextResourcesSource, /agentFieldName="attachments"|agentFieldName="subtasks"|agentFieldName="linkedItems"/u);
	assert.match(titleActionsSource, /metadataTogglePending \|\| metadataLayoutAnimating/u);
	assert.match(titleActionsSource, /inert=\{isInteractive \? undefined : true\}/u);
	assert.match(titleActionsSource, /export function ContextHeaderActions\(\)[\s\S]*aria-label="No restrictions"[\s\S]*<EyeOpenIcon[\s\S]*aria-label="Share"/u);
	assert.match(titleActionsSource, /aria-label="No restrictions" size="icon" variant="ghost"/u);
	assert.match(titleActionsSource, /<Button className="gap-2" variant="ghost">[\s\S]*<EyeOpenIcon/u);
	assert.match(titleActionsSource, /aria-label="Share" size="icon" variant="ghost"/u);
	assert.match(titleActionsSource, /export function ContextTitleActions\([\s\S]*aria-label="Open in"[\s\S]*<CodeIcon aria-hidden size="small" \/>[\s\S]*Open in[\s\S]*aria-label="Add"[\s\S]*<AddIcon label="" size="small" \/>/u);
	assert.match(titleActionsSource, /<motion\.div[\s\S]*className="flex shrink-0 items-center gap-2"/u);
	assert.doesNotMatch(titleActionsSource, /export function ContextTitleActions\([\s\S]*<div className="flex shrink-0 items-center gap-2">/u);
	assert.match(titleActionsSource, /\{ id: "claude-code", label: "Claude"[\s\S]*\{ id: "rovo-cli", label: "Rovo"/u);
	assert.match(
		titleActionsSource,
		/name === "cursor" \|\| name === "github-copilot"[\s\S]*"dark:brightness-0 dark:invert"[\s\S]*className=\{darkModeClassName\}/u,
	);
	assert.doesNotMatch(titleActionsSource, /ButtonGroup|Claude \(Local\)|DropdownMenuLabel|Rovo CLI|More open options/u);
	assert.match(
		titleActionsSource,
		/codingAgents\.map\(\(agent\) => \([\s\S]*<DropdownMenuSub key=\{agent\.id\}>[\s\S]*<DropdownMenuSubTrigger className="gap-0\.5 \[&>:last-child\]:opacity-0 hover:\[&>:last-child\]:opacity-100 data-\[highlighted\]:\[&>:last-child\]:opacity-100 data-popup-open:\[&>:last-child\]:opacity-100">[\s\S]*<span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center">[\s\S]*\{agent\.logo\}[\s\S]*\{agent\.label\}[\s\S]*<DropdownMenuSubContent positionerClassName="z-\[503\]">[\s\S]*<DropdownMenuItem>Local<\/DropdownMenuItem>[\s\S]*<DropdownMenuItem>Cloud<\/DropdownMenuItem>/u,
	);
	assert.doesNotMatch(titleActionsSource, /ContextTitleActions\([\s\S]*collapsed = false/u);
	assert.doesNotMatch(titleBarSource, /ContextTitleActions|AnimatedContextTitleActions/u);
	assert.doesNotMatch(titleBarSource, /motion|usePanelLayout|px-6/u);
	assert.doesNotMatch(dialogSource, /ContextTitleBar/u);
	assert.match(dialogSource, /gridTemplateRows: "auto minmax\(0, 1fr\)"/u);
});

test("experimental v2 removes the description row and keeps Activity sticky", () => {
	const activityPanelSource = readBlockFile("experimental-v2/components/activity-panel.tsx");
	const contextEditableHeaderSource = readBlockFile("experimental-v2/components/context-editable-header.tsx");
	const layoutSource = readBlockFile("experimental-v2/components/experimental-work-item-layout.tsx");
	assert.match(
		activityPanelSource,
		/<JiraActivity[\s\S]*className="gap-2"[\s\S]*headerClassName="sticky top-0 z-10 flex min-h-8 items-center bg-surface-overlay \[container-type:scroll-state\]"[\s\S]*headerScrollFade/u,
	);
	assert.match(contextEditableHeaderSource, /showToolbar=\{false\}/u);
	assert.match(contextEditableHeaderSource, /viewMode=\{viewMode\}/u);
	assert.doesNotMatch(
		contextEditableHeaderSource,
		/stuckToolbarScrollFade|toolbarRestingSeparator|toolbarRestingSeparatorLabel|toolbarReveal/u,
	);
	assert.match(
		layoutSource,
		/buildScrollMaskStyle\(\{ fadeTop: false, fadeBottom: showBottomScrollMask \}\)/u,
	);
	assert.doesNotMatch(layoutSource, /showTopScrollMask/u);
});

test("experimental v2 renders filled context resources as conditional metadata sections", () => {
	const metadataRailSource = readBlockFile("experimental-v2/components/metadata-rail.tsx");

	assert.match(metadataRailSource, /const \{ attachments, linkedItems, subtasks \} = contextResources;/u);
	assert.match(metadataRailSource, /if \(attachments\.length > 0\) \{[\s\S]*id: "attachments",[\s\S]*title: "Attachments"/u);
	assert.match(metadataRailSource, /if \(subtasks\.length > 0\) \{[\s\S]*id: "subtasks",[\s\S]*title: "Subtasks"/u);
	assert.match(metadataRailSource, /if \(linkedItems\.length > 0\) \{[\s\S]*id: "linked-items",[\s\S]*title: "Linked work items"/u);
	assert.match(metadataRailSource, /attachments\.map\(toAttachmentSmartLink\)[\s\S]*count: attachments\.length/u);
	assert.match(metadataRailSource, /subtasks\.map\(toSubtaskSmartLink\)[\s\S]*count: subtasks\.length/u);
	assert.match(metadataRailSource, /linkedItems\.map\(toLinkedItemSmartLink\)[\s\S]*count: linkedItems\.length/u);
	assert.match(metadataRailSource, /function ResourceSmartLinks[\s\S]*<ul className="space-y-1">[\s\S]*<SmartLink[\s\S]*align="center"[\s\S]*alignOffset=\{0\}[\s\S]*className="min-w-0 max-w-full"[\s\S]*item=\{item\}[\s\S]*positionerClassName="z-\[600\]"[\s\S]*side="left"/u);
	assert.match(metadataRailSource, /aria-label=\{`Remove \$\{item\.title\}`\}[\s\S]*onClick=\{\(\) => onRemove\(item\.id\)\}[\s\S]*<DeleteIcon/u);
	assert.match(metadataRailSource, /removeContextResource\("attachment", id\)[\s\S]*removeContextResource\("subtask", id\)[\s\S]*removeContextResource\("link", id\)/u);
	assert.match(metadataRailSource, /attachments\.map\(toAttachmentSmartLink\)[\s\S]*subtasks\.map\(toSubtaskSmartLink\)[\s\S]*linkedItems\.map\(toLinkedItemSmartLink\)/u);
	assert.doesNotMatch(metadataRailSource, /AgentFilledSummaryRow|AgentReferenceChip|agentFieldName=/u);
	assert.match(
		metadataRailSource,
		/id: "details",[\s\S]*\.\.\.resourceSections,[\s\S]*id: "automation"[\s\S]*id: "development"[\s\S]*id: "apps"/u,
	);
	assert.match(
		metadataRailSource,
		/\{ content: <DevelopmentSectionContent \/>, id: "development", title: "Development" \}/u,
	);
	assert.doesNotMatch(metadataRailSource, /content: <DevelopmentSection \/>/u);
});

test("experimental v2 keeps its persistent metadata rail open", () => {
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");

	assert.doesNotMatch(compositionSource, /defaultMetadataCollapsed/u);
	assert.match(compositionSource, /<PanelLayoutProvider>/u);
});

test("the block index resolves both experimental surfaces from one map", () => {
	const indexSource = readBlockFile("index.tsx");

	assert.match(indexSource, /export type JiraWorkItemVariant = "default" \| "experimental" \| "experimental-v2";/u);
	assert.match(
		indexSource,
		/const EXPERIMENTAL_SURFACES = \{\s*experimental: ExperimentalJiraWorkItem,\s*"experimental-v2": ExperimentalV2JiraWorkItem,\s*\} as const;/u,
	);
	assert.match(indexSource, /type ExperimentalVariant = keyof typeof EXPERIMENTAL_SURFACES;/u);
	assert.match(indexSource, /const ExperimentalSurface = EXPERIMENTAL_SURFACES\[surface\];/u);
	// One shared view owns the open/close plumbing for every experimental variant.
	assert.equal((indexSource.match(/function JiraWorkItemExperimentalView/gu) ?? []).length, 1);
});
