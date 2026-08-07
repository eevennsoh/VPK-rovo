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
	// v2 titles use ADS `font.heading.medium`; v1 keeps the text-xl utility treatment.
	"components/inline-edit-treatment.ts",
	"components/detail-field-editors.tsx",
	"components/details-sections.tsx",
	"components/experimental-breadcrumb-actions.tsx",
	"components/experimental-work-item-dialog.tsx",
	"components/experimental-work-item-layout.tsx",
	"components/floating-session-surface.tsx",
	"components/details-tab.tsx",
	"components/activity-panel.tsx",
	"components/activity-composer-context-pills.tsx",
	"components/activity-composer.tsx",
	"components/automation-tab.tsx",
	"components/ai-planner-panel.tsx",
	"components/metadata-rail.tsx",
	"context-jira-work-item.tsx",
	"lib/activity-composer-session-routing.ts",
	"lib/jira-activity-adapter.test.js",
	"lib/jira-activity-adapter.ts",
	"use-jira-work-item-controller.ts",
	// The three context popovers moved to segmented tabs and the shared
	// `context-popover-parts` chrome; v1 keeps its original underline treatment.
	"components/attachments-popover.tsx",
	"components/subtasks-popover.tsx",
	"components/linked-work-items-popover.tsx",
	// v2 opens the agent/skill selectors with the borderless editor-palette
	// search bar so they match the "/" menu and the metadata pickers on the
	// same screen; v1 keeps the boxed CommandInput.
	"components/activity-composer-agent-context-pill.tsx",
	"components/activity-composer-skill-context-pill.tsx",
	"experimental-v2-jira-work-item.tsx",
]);

// Modules that exist only in v2. They have no v1 twin, so they are excluded
// from the structural-duplicate comparison but must still be declared here so
// an accidental new file is caught rather than silently accepted.
const V2_ONLY_FILES = new Set([
	"components/development-repository-picker.tsx",
	"components/experimental-header-overflow-menu.tsx",
	"components/context-popover-parts.tsx",
	// Metadata-rail Pull request toggle panel; v1 has no PR segment.
	"components/pull-requests-panel.tsx",
	"components/pull-request-sort-control.tsx",
	// v2 promotes `@Agent` runs in authored comment copy into mention chips; v1
	// keeps comment bodies as a single plain-text segment.
	"lib/activity-mention-segments.ts",
	// Shared metadata-rail / embedded-chat width for the v2 dialog overlay.
	"lib/layout-constants.ts",
	// v2's Development rail section derives copy-ready git commands from the
	// work item; v1 still renders the connect-a-repository empty state.
	"lib/development-commands.test.js",
	"lib/development-commands.ts",
	// Connected-repo fixtures / helpers live outside the picker component file
	// so Fast Refresh can treat that module as components-only.
	"lib/development-repositories.ts",
	// Phase-section model for the Pull requests metadata panel.
	"lib/pull-request-phases.ts",
	"lib/pull-request-phases.test.js",
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

test("experimental v2 opens the shared agent chat as a full-height sibling column", () => {
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");
	const dialogSource = readBlockFile("experimental-v2/components/experimental-work-item-dialog.tsx");
	const layoutSource = readBlockFile("experimental-v2/components/experimental-work-item-layout.tsx");
	const sessionSurfaceSource = readBlockFile("experimental-v2/components/floating-session-surface.tsx");
	const sharedOverlaySource = fs.readFileSync(
		path.join(BLOCK_DIR, "../../projects/asx/components/asx-rovo-overlay.tsx"),
		"utf8",
	);

	assert.match(
		compositionSource,
		/const agentChatOpen = chatSurface === "floating";[\s\S]*sidebar=\{<FloatingSessionSurface \/>\}[\s\S]*sidebarOpen=\{agentChatOpen\}[\s\S]*aria-hidden=\{agentChatOpen\}[\s\S]*inert=\{agentChatOpen \? true : undefined\}[\s\S]*<MetadataRail[\s\S]*activity=\{<ActivityPanel activitySessionThread=\{props\.activitySessionThread\} \/>\}[\s\S]*automationRules=\{props\.automationRules\}[\s\S]*borderless[\s\S]*\/>/u,
	);
	assert.doesNotMatch(compositionSource, /blanketContent=\{[\s\S]*<FloatingSessionSurface/u);
	assert.match(sessionSurfaceSource, /<AsxRovoOverlay[\s\S]*placement="embedded"/u);
	assert.doesNotMatch(sessionSurfaceSource, /children|createPortal|portalToViewport/u);
	assert.match(sharedOverlaySource, /placement === "embedded"/u);
	assert.match(
		dialogSource,
		/data-jira-work-item-main-column[\s\S]*data-jira-work-item-chat-column/u,
	);
	assert.match(dialogSource, /grid-cols-\[minmax\(0,1fr\)\]/u);
	assert.match(
		dialogSource,
		/METADATA_PANEL_WIDTH[\s\S]*"--work-item-side-panel-width": METADATA_PANEL_WIDTH/u,
	);
	assert.match(
		dialogSource,
		/transition-\[margin-right\][\s\S]*@\[860px\]\/workitemdialog:mr-\[var\(--work-item-side-panel-width\)\][\s\S]*data-jira-work-item-header-column/u,
	);
	assert.match(
		dialogSource,
		/absolute inset-y-0 right-0 z-30[\s\S]*translate-x-full[\s\S]*@\[860px\]\/workitemdialog:w-\[var\(--work-item-side-panel-width\)\][\s\S]*sidebarOpen \? "translate-x-0" : "pointer-events-none"/u,
	);
	assert.match(dialogSource, /transition-\[margin-right\] duration-medium ease-in-out motion-reduce:transition-none/u);
	assert.match(dialogSource, /transition-transform duration-medium ease-in-out[\s\S]*motion-reduce:transition-none/u);
	assert.match(dialogSource, /aria-hidden=\{!sidebarOpen\}[\s\S]*inert=\{sidebarOpen \? undefined : true\}/u);
	assert.match(
		dialogSource,
		/className="grid h-full min-h-0 min-w-0 grid-rows-\[auto_minmax\(0,1fr\)\]"[\s\S]*data-jira-work-item-main-column/u,
	);
	assert.match(layoutSource, /\{metadataCollapsed \? null : \(/u);
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
		.filter((relativePath) => !V2_ONLY_FILES.has(relativePath))
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

test("experimental v2 Development starts with a searchable provider-branded repository picker", () => {
	const detailsSectionsSource = readBlockFile("experimental-v2/components/details-sections.tsx");
	const repositoryPickerSource = readBlockFile("experimental-v2/components/development-repository-picker.tsx");
	const developmentRepositoriesSource = readBlockFile("experimental-v2/lib/development-repositories.ts");

	assert.match(
		detailsSectionsSource,
		/className="flex min-w-0 flex-col gap-1"[\s\S]*<DevelopmentRepositoryPicker \/>[\s\S]*Create branch in Bitbucket Cloud[\s\S]*Create branch in GitHub/u,
	);
	assert.doesNotMatch(detailsSectionsSource, /DevelopmentCopyField|Copy branch command|Copy commit command|Copy work item key/u);
	assert.match(repositoryPickerSource, /<Popover open=\{open\} onOpenChange=\{handleOpenChange\}>/u);
	assert.match(repositoryPickerSource, /className="w-\(--anchor-width\) max-w-\[calc\(100vw-2rem\)\] gap-0 overflow-hidden p-0"/u);
	assert.match(repositoryPickerSource, /label="Search repositories"[\s\S]*All repositories/u);
	assert.match(repositoryPickerSource, /useCommandMenuScrollMask\(\)[\s\S]*rich-text-command-menu rich-text-command-menu-embedded[\s\S]*rich-text-command-menu-list/u);
	assert.match(repositoryPickerSource, /import \{ SearchIcon \} from "@\/components\/ui\/vpk-icons"/u);
	assert.match(repositoryPickerSource, /icon=\{<SearchIcon className="size-4 text-icon-subtle" \/>\}/u);
	assert.match(repositoryPickerSource, /className="h-11 w-full justify-start gap-3 rounded-lg px-2 pe-9 font-normal"/u);
	assert.equal((repositoryPickerSource.match(/inline-flex size-6 shrink-0 items-center justify-center leading-none \[&_svg\]:size-6!/gu) ?? []).length, 1);
	assert.match(repositoryPickerSource, /import LinkExternalIcon from "@atlaskit\/icon\/core\/link-external";/u);
	assert.match(repositoryPickerSource, /import FolderAddIcon from "@atlaskit\/icon-lab\/core\/folder-add";/u);
	assert.match(repositoryPickerSource, /import HardwareAuditIcon from "@atlaskit\/icon-lab\/core\/hardware-audit";/u);
	// Hover/focus-within reveals a far-right open-in-tab control; stopPropagation keeps row select separate.
	assert.match(
		repositoryPickerSource,
		/className="group\/repository-row relative"[\s\S]*href=\{url\}[\s\S]*event\.stopPropagation\(\)[\s\S]*rel="noopener noreferrer"[\s\S]*target="_blank"/u,
	);
	assert.match(
		repositoryPickerSource,
		/pointer-events-none opacity-0 transition-opacity duration-normal ease-out-practical[\s\S]*group-hover\/repository-row:pointer-events-auto group-hover\/repository-row:opacity-100[\s\S]*group-focus-within\/repository-row:pointer-events-auto group-focus-within\/repository-row:opacity-100[\s\S]*focus-visible:pointer-events-auto focus-visible:opacity-100/u,
	);
	assert.match(
		repositoryPickerSource,
		/aria-label=\{`Open \$\{name\} repository`\}[\s\S]*render=\{<LinkExternalIcon label="" size="small" \/>\}/u,
	);
	assert.match(repositoryPickerSource, /className="size-4" render=\{<LinkExternalIcon label="" size="small" \/>\}/u);
	assert.match(repositoryPickerSource, /text-icon-subtle/u);
	assert.match(
		repositoryPickerSource,
		/className="size-6 shrink-0" render=\{<FolderAddIcon label="" \/>\}[\s\S]*Add repositories/u,
	);
	assert.match(
		repositoryPickerSource,
		/className="size-6 shrink-0" render=\{<HardwareAuditIcon label="" \/>\}[\s\S]*Add environment/u,
	);
	assert.doesNotMatch(repositoryPickerSource, /@atlaskit\/icon\/core\/add|render=\{<AddIcon /u);
	assert.match(repositoryPickerSource, /<ChevronDownIcon label="" size="small" \/>/u);
	assert.equal((repositoryPickerSource.match(/<Separator className="mx-2 my-1 data-horizontal:w-auto" \/>/gu) ?? []).length, 1);
	assert.match(
		developmentRepositoriesSource,
		/export const CONNECTED_REPOSITORY_COUNT = DEVELOPMENT_REPOSITORIES\.length;/u,
	);
	assert.doesNotMatch(
		developmentRepositoriesSource,
		/formatConnectedRepositoryCountLabel|\b\d+ Repos?\b/u,
	);
	assert.match(
		repositoryPickerSource,
		/import \{[\s\S]*CONNECTED_REPOSITORY_COUNT[\s\S]*DEVELOPMENT_REPOSITORIES[\s\S]*stripUrlScheme[\s\S]*\} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/development-repositories"/u,
	);
	assert.match(
		repositoryPickerSource,
		/\{CONNECTED_REPOSITORY_COUNT\} Connected repositories/u,
	);
	assert.doesNotMatch(repositoryPickerSource, /selectedRepository|DEFAULT_REPOSITORY_ID|Select repository,/u);
	assert.match(developmentRepositoriesSource, /provider: "github"[\s\S]*provider: "bitbucket"/u);
	assert.match(repositoryPickerSource, /<GithubLogo borderless className="dark:invert \[\[data-color-mode=dark\]_&\]:invert" label="" size="small" \/>/u);
	assert.match(repositoryPickerSource, /<BitbucketLogo appearance="brand" label="" size="small" \/>/u);
	assert.match(developmentRepositoriesSource, /symphony-explainer[\s\S]*proximity[\s\S]*vpk-rovo[\s\S]*vpk-rovodev/u);
	// Full URLs stay on the option data (search / future links); bylines strip the scheme.
	assert.match(developmentRepositoriesSource, /https:\/\/github\.com\/eevensoh\/symphony-explainer[\s\S]*https:\/\/bitbucket\.org\/eevensoh\/vpk-rovodev/u);
	assert.match(repositoryPickerSource, /`\$\{repository\.name\} \$\{repository\.url\}`/u);
	assert.match(developmentRepositoriesSource, /export function stripUrlScheme\(url: string\): string/u);
	assert.ok(
		developmentRepositoriesSource.includes('return url.replace(/^https?:\\/\\//i, "");'),
		"stripUrlScheme should drop a leading http(s):// case-insensitively",
	);
	assert.match(repositoryPickerSource, /\{stripUrlScheme\(url\)\}/u);
	// Tiny behavior check mirroring `stripUrlScheme` (CJS contract test can't import the TSX module).
	const stripUrlScheme = (url) => url.replace(/^https?:\/\//i, "");
	assert.equal(stripUrlScheme("https://github.com/eevensoh/symphony-explainer"), "github.com/eevensoh/symphony-explainer");
	assert.equal(stripUrlScheme("HTTP://bitbucket.org/eevensoh/vpk-rovo"), "bitbucket.org/eevensoh/vpk-rovo");
	assert.equal(stripUrlScheme("github.com/eevensoh/proximity"), "github.com/eevensoh/proximity");
	assert.match(repositoryPickerSource, /const REPOSITORY_LABEL_CLASS = "menu-row-title text-left";/u);
	assert.match(repositoryPickerSource, /const REPOSITORY_DESCRIPTION_CLASS = "menu-row-byline text-left";/u);
	// Byline URL stays hidden until hover/focus — same Motion reveal as AgentSelector.
	assert.match(repositoryPickerSource, /import \{ motion, useReducedMotion, type Variants \} from "motion\/react";/u);
	assert.match(repositoryPickerSource, /const revealByline = isInteractionActive;/u);
	assert.match(repositoryPickerSource, /const copyInstant = Boolean\(prefersReducedMotion\);/u);
	assert.match(repositoryPickerSource, /animate=\{revealByline \? "active" : "idle"\}/u);
	assert.match(repositoryPickerSource, /onMouseEnter=\{\(\) => setIsInteractionActive\(true\)\}/u);
	assert.match(repositoryPickerSource, /onFocus=\{\(\) => setIsInteractionActive\(true\)\}/u);
	assert.match(repositoryPickerSource, /function selectRepository\(\) \{[\s\S]*handleOpenChange\(false\);/u);
	assert.match(repositoryPickerSource, /Add repositories[\s\S]*Add environment/u);
	assert.doesNotMatch(repositoryPickerSource, /Recents|Checkbox|owner|Refresh|DX docs validation|Select multiple/u);
	assert.match(repositoryPickerSource, /positionerClassName="z-\[502\]"/u);
});

test("experimental v2 sticky composer does not mount codebase repo or branch pickers", () => {
	const composerSource = readBlockFile("experimental-v2/components/activity-composer.tsx");
	const developmentRepositoriesSource = readBlockFile("experimental-v2/lib/development-repositories.ts");

	assert.doesNotMatch(composerSource, /ActivityComposerCodebasePickers|activity-composer-codebase-pickers|jira-work-item-composer-codebase/u);
	assert.equal(
		fs.existsSync(path.join(V2_DIR, "components/activity-composer-codebase-pickers.tsx")),
		false,
	);
	// Branch defaults / resolvers were composer-picker-only; Repositories pane keeps the list helpers.
	assert.doesNotMatch(
		developmentRepositoriesSource,
		/DEFAULT_DEVELOPMENT_REPOSITORY_ID|DEVELOPMENT_BRANCHES|DEFAULT_DEVELOPMENT_BRANCH|resolveDevelopmentRepository|resolveDevelopmentBranch/u,
	);
	assert.match(developmentRepositoriesSource, /export const DEVELOPMENT_REPOSITORIES/u);
	assert.match(developmentRepositoriesSource, /export const CONNECTED_REPOSITORY_COUNT/u);
	assert.match(developmentRepositoriesSource, /export function stripUrlScheme/u);
});

test("experimental v2 working-agents menu includes waiting sessions without changing its dismissal contract", () => {
	const contextPillsSource = readBlockFile("experimental-v2/components/activity-composer-context-pills.tsx");
	const composerSource = readBlockFile("experimental-v2/components/activity-composer.tsx");

	assert.match(
		contextPillsSource,
		/<RichTextSuggestionMenu[\s\S]*className="rich-text-command-menu-borderless w-full!"[\s\S]*title="Working agents"/u,
	);
	assert.match(composerSource, /state\.sessions\.filter\(\(session\) => session\.status !== "completed"\)/u);
	assert.match(contextPillsSource, /`Waiting for \$\{session\.waitingOn\.agentName\}`/u);
	assert.match(contextPillsSource, /"code-planner": \[[\s\S]*"Plan the guest checkout architecture"/u);
	assert.match(contextPillsSource, /"claude-code": \[[\s\S]*"Implement and verify guest checkout"/u);
	assert.doesNotMatch(contextPillsSource, /"github-copilot":|"unit-test-creator":/u);
	assert.match(contextPillsSource, /label: session\.agentName,/u);
	assert.match(contextPillsSource, /inlineMetadata: \([\s\S]*<WorkingSessionActivityByline[\s\S]*sessionIndex=\{sessionIndex\}/u);
	assert.match(contextPillsSource, /<AgentAvatarVisual[\s\S]*sizePx=\{24\}/u);
	assert.match(contextPillsSource, /brandName=\{session\.agentBrandName\}/u);
	assert.match(contextPillsSource, /<CyclingByline className="menu-row-title text-text-subtlest">/u);
	assert.match(contextPillsSource, /className="mb-2 flex flex-wrap gap-2"/u);
	assert.match(contextPillsSource, /WORKING_SESSION_ACTIVITY_STAGGER_MS \* \(sessionIndex \+ 1\)/u);
	assert.match(contextPillsSource, /window\.setTimeout\([\s\S]*window\.setInterval\([\s\S]*setActivityCycleIndex\(\(index\) => index \+ 1\)/u);
	assert.match(contextPillsSource, /window\.clearTimeout\(timeoutId\);[\s\S]*window\.clearInterval\(intervalId\);/u);
	assert.doesNotMatch(contextPillsSource, /Math\.random/u);
	assert.match(contextPillsSource, /\{workingSessions\.length\} \{workingSessions\.length === 1 \? "agent" : "agents"\} working/u);
	assert.match(
		contextPillsSource,
		/<ContextBarPill[\s\S]*icon=\{\([\s\S]*<PixelLoader[\s\S]*className="size-3 justify-center"[\s\S]*pattern="diagonal-top-left"[\s\S]*shape="dot"[\s\S]*size="small"/u,
	);
	assert.match(
		contextPillsSource,
		/trailing: session\.status === "waiting"[\s\S]*<span className="text-xs text-text-subtle">Waiting<\/span>[\s\S]*: null/u,
	);
	assert.doesNotMatch(contextPillsSource, /<Spinner/u);
});

test("experimental v2 keeps comment-only composer delivery as the non-target default", () => {
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");
	const contextSource = readBlockFile("experimental-v2/context-jira-work-item.tsx");
	const composerSource = readBlockFile("experimental-v2/components/activity-composer.tsx");

	assert.match(contextSource, /composerDelivery = "comment"/u);
	assert.match(compositionSource, /composerAgents\?: readonly AgentSelectorAgent\[\];/u);
	assert.match(compositionSource, /<ActivityComposer[\s\S]*agents=\{props\.composerAgents\}/u);
	assert.match(composerSource, /const availableAgents = agents \?\? ROVO_AGENT_SELECTOR_AGENTS;/u);
	assert.match(composerSource, /agents[\s\S]*subagent: agents\.map\(mapAgentToMentionItem\)[\s\S]*: EDITOR_PALETTE_MENTION_SOURCES/u);
	assert.match(
		composerSource,
		/findMentionedAvailableAgents\([\s\S]*handledAgentIds,[\s\S]*handledAgentNames,[\s\S]*for \(const invokedAgent of invokedAgents\)[\s\S]*actions\.invokeAgent/u,
	);
	assert.match(
		composerSource,
		/onAgentPromptSubmit\?\.\([\s\S]*\.\.\.handledAgentIds,[\s\S]*\.\.\.invokedAgents\.map\(\(agent\) => agent\.id\)/u,
		"composer should report both active and newly invoked mentioned agents to orchestration callbacks",
	);
	assert.match(
		composerSource,
		/meta\.composerDelivery === "broadcast-active-agents"[\s\S]*actions\.broadcastComment\(text\);[\s\S]*else \{[\s\S]*actions\.addComment\(text\);/u,
	);
});

test("experimental v2 running-agents menu dismisses after focus leaves its wrapper", () => {
	const contextPillsSource = readBlockFile("experimental-v2/components/activity-composer-context-pills.tsx");

	assert.match(contextPillsSource, /window\.addEventListener\("pointerdown", handlePointerDown, true\);/u);
	assert.match(contextPillsSource, /!containerRef\.current\?\.contains\(event\.target\)[\s\S]*onClose\(false\);/u);
	assert.match(contextPillsSource, /window\.addEventListener\("keydown", handleDismissKeyDown\);/u);
	assert.match(contextPillsSource, /event\.key === "Escape"[\s\S]*onClose\(true\);/u);
	assert.match(contextPillsSource, /window\.removeEventListener\("pointerdown", handlePointerDown, true\);/u);
	assert.match(contextPillsSource, /window\.removeEventListener\("keydown", handleDismissKeyDown\);/u);
});

test("context popover tab navigation keeps the shared default height and top gap", () => {
	for (const popover of ["attachments-popover.tsx", "subtasks-popover.tsx", "linked-work-items-popover.tsx"]) {
		const popoverSource = readBlockFile(`experimental/components/${popover}`);

		assert.match(popoverSource, /<TabsList variant="line" className="mt-2\.5 w-full px-2\.5">/u);
		assert.doesNotMatch(popoverSource, /<TabsList[^>]*\bpt-/u);
	}
});

test("experimental v2 context popovers share one segmented tab strip", () => {
	for (const popover of ["attachments-popover.tsx", "subtasks-popover.tsx", "linked-work-items-popover.tsx"]) {
		const popoverSource = readBlockFile(`experimental-v2/components/${popover}`);

		// One shared constant, so the three strips cannot drift apart. `variant="line"`
		// would put them back on the underline treatment v1 uses.
		assert.match(popoverSource, /<TabsList className=\{CONTEXT_POPOVER_TABS_LIST_CLASS\}>/u);
		assert.doesNotMatch(popoverSource, /<TabsList[^>]*variant="line"/u);
	}

	// The grey track is visible, so the strip is inset with a margin. Padding would
	// shrink the labels inside a full-bleed track instead of insetting the track.
	const partsSource = readBlockFile("experimental-v2/components/context-popover-parts.tsx");
	assert.match(partsSource, /CONTEXT_POPOVER_TABS_LIST_CLASS = "mx-2\.5 mt-2\.5 w-\[calc\(100%-1\.25rem\)\]"/u);
});

test("experimental v2 context popovers reuse one AI suggestion panel", () => {
	const partsSource = readBlockFile("experimental-v2/components/context-popover-parts.tsx");

	// Header count + collapse, then the shared "Uses AI" footer with feedback.
	assert.match(partsSource, /export function SuggestionPanel\(/u);
	assert.match(partsSource, /<AiSparkleIcon label="" color="currentColor" \/>/u);
	assert.match(partsSource, /<Footer className="justify-start gap-1 px-2 py-1">/u);
	assert.match(partsSource, /Uses AI\. Verify results\./u);

	// No popover may re-implement the panel locally.
	for (const popover of ["attachments-popover.tsx", "subtasks-popover.tsx", "linked-work-items-popover.tsx"]) {
		const popoverSource = readBlockFile(`experimental-v2/components/${popover}`);
		assert.doesNotMatch(popoverSource, /AiSparkleIcon|ThumbsUpIcon|ThumbsDownIcon/u);
	}
});

test("experimental v2 work item rows use type-coloured Jira glyphs", () => {
	const partsSource = readBlockFile("experimental-v2/components/context-popover-parts.tsx");

	assert.match(partsSource, /Task: \{ Glyph: TaskIcon, tone: "text-icon-accent-blue" \}/u);
	assert.match(partsSource, /Subtask: \{ Glyph: SubtasksIcon, tone: "text-icon-accent-blue" \}/u);
	assert.match(partsSource, /Story: \{ Glyph: StoryIcon, tone: "text-icon-accent-green" \}/u);
	assert.match(partsSource, /Bug: \{ Glyph: BugIcon, tone: "text-icon-accent-red" \}/u);
	assert.match(partsSource, /Epic: \{ Glyph: EpicIcon, tone: "text-icon-accent-purple" \}/u);

	for (const popover of ["subtasks-popover.tsx", "linked-work-items-popover.tsx"]) {
		const popoverSource = readBlockFile(`experimental-v2/components/${popover}`);
		assert.match(popoverSource, /<WorkItemTypeIcon type=\{/u);
	}
});

test("experimental v2 suggested subtasks commit only on confirm", () => {
	const popoverSource = readBlockFile("experimental-v2/components/subtasks-popover.tsx");

	// Checking a box must stay a reversible draft: the add only runs from the
	// Create button, which is disabled until at least one box is checked.
	assert.match(popoverSource, /const createSelectedSuggestions = \(\) => \{/u);
	assert.match(popoverSource, /disabled=\{selectedSuggestions\.length === 0\}/u);
	assert.match(popoverSource, /onClick=\{createSelectedSuggestions\}/u);
	assert.doesNotMatch(popoverSource, /onCheckedChange=\{[^}]*addContextResource/u);
});

test("experimental v2 context popovers compose tooltips with their triggers", () => {
	for (const popover of ["attachments-popover.tsx", "subtasks-popover.tsx", "linked-work-items-popover.tsx"]) {
		const popoverSource = readBlockFile(`experimental-v2/components/${popover}`);

		assert.match(
			popoverSource,
			/tooltip \? \([\s\S]*<Tooltip>[\s\S]*<TooltipTrigger render=\{<span className="inline-flex" \/>\}>[\s\S]*<PopoverTrigger render=\{trigger\} \/>[\s\S]*<TooltipContent positionerClassName="z-\[502\]">\{tooltip\}<\/TooltipContent>/u,
		);
	}
});

test("experimental v2 create-new attachments use reserved content-type icons at 16px", () => {
	const popoverSource = readBlockFile("experimental-v2/components/attachments-popover.tsx");

	// Live doc and Loom have reserved single-purpose glyphs; generic Page/Video
	// stand-ins read as the wrong object type.
	assert.match(popoverSource, /import PageLiveDocIcon from "@atlaskit\/icon-lab\/core\/page-live-doc";/u);
	assert.match(popoverSource, /import LoomIcon from "@atlaskit\/icon-lab\/core\/loom";/u);
	assert.match(popoverSource, /page: \{ Glyph: PageIcon, tone: "text-icon-accent-blue" \}/u);
	assert.match(popoverSource, /"live-doc": \{ Glyph: PageLiveDocIcon, tone: "text-icon-accent-magenta" \}/u);
	assert.match(popoverSource, /whiteboard: \{ Glyph: WhiteboardIcon, tone: "text-icon-accent-teal" \}/u);
	assert.match(popoverSource, /"loom-video": \{ Glyph: LoomIcon, tone: "text-icon-accent-blue" \}/u);

	// `size="small"` is 12px on new-core icons; the menu renders the 16px default.
	assert.match(popoverSource, /<Glyph label="" color="currentColor" \/>/u);
});

test("experimental v2 keeps the metadata panel visible and uses asymmetric header padding", () => {
	const dialogSource = readBlockFile("experimental-v2/components/experimental-work-item-dialog.tsx");
	const headerActionsSource = readBlockFile("experimental-v2/components/experimental-breadcrumb-actions.tsx");

	assert.match(dialogSource, /paddingBottom=\{token\("space\.150"\)\}[\s\S]*paddingTop=\{token\("space\.150"\)\}/u);
	assert.match(dialogSource, /closeButtonDisabled=\{presentation === "inline"\}/u);
	assert.doesNotMatch(dialogSource, /showClose=\{presentation !== "inline"\}/u);
	assert.match(headerActionsSource, /aria-label="Collapse"/u);
	assert.match(headerActionsSource, /<ExperimentalHeaderOverflowMenu \/>[\s\S]*aria-label="Collapse"/u);
	assert.doesNotMatch(headerActionsSource, /ContextHeaderActions/u);
	assert.doesNotMatch(headerActionsSource, /Show metadata panel|Hide metadata panel/u);
	assert.doesNotMatch(headerActionsSource, /usePanelLayout|Popover|PanelRightIcon/u);
});

test("experimental v2 dialog matches Rovo Canvas even viewport inset sizing", () => {
	const dialogSource = readBlockFile("experimental-v2/components/experimental-work-item-dialog.tsx");
	const inlineIndex = dialogSource.indexOf('if (presentation === "inline")');
	const backdropIndex = dialogSource.indexOf("<Dialog.Backdrop");
	const inlineSource = dialogSource.slice(inlineIndex, backdropIndex);
	const popupSource = dialogSource.slice(backdropIndex);

	assert.ok(inlineIndex >= 0 && inlineIndex < backdropIndex);
	assert.match(inlineSource, /max-h-full w-full max-w-none shrink-0 outline-none/u);
	assert.match(inlineSource, /fillsInlineContainer \? "h-full min-h-0 flex-1 shrink" : null/u);
	assert.match(
		popupSource,
		/fixed inset-4 z-\[501\] h-auto w-auto max-w-none origin-center translate-x-0 translate-y-0 outline-none/u,
	);
	assert.doesNotMatch(popupSource, /calc\(100vw/u);
	assert.doesNotMatch(popupSource, /calc\(100vh|100dvh/u);
	assert.doesNotMatch(dialogSource, /max-w-\[1200px\]/u);
});

test("experimental v2 header overflow menu owns the restriction, watcher, and share actions", () => {
	const overflowMenuSource = readBlockFile(
		"experimental-v2/components/experimental-header-overflow-menu.tsx",
	);

	// The three actions moved out of the header row and must lead the menu.
	assert.match(
		overflowMenuSource,
		/\[\{ label: "Permission" \}, \{ label: "Watch", count: 1 \}, \{ label: "Share" \}\]/u,
	);
	assert.match(overflowMenuSource, /\{ label: "Log work", shortcut: "Q" \}/u);
	assert.match(overflowMenuSource, /\{ label: "Stop watching", shortcut: "W" \}/u);
	assert.match(overflowMenuSource, /\{ label: "Export to", submenu: \["Excel", "Word", "XML"\] \}/u);
	// Select cover keeps the chevron affordance but opens no flyout.
	assert.match(overflowMenuSource, /\{ label: "Select cover", chevron: true \}/u);
	assert.doesNotMatch(overflowMenuSource, /Select cover", submenu/u);
	assert.doesNotMatch(overflowMenuSource, /Switch to classic experience/u);
	// Dialog paints at z-[500]/[501]; both popup layers must clear it.
	assert.match(overflowMenuSource, /positionerClassName="z-\[502\]"/u);
	assert.match(overflowMenuSource, /positionerClassName="z-\[503\]"/u);
	// The popup opens to its full height instead of the shared 328px cap.
	assert.match(overflowMenuSource, /className="max-h-\[var\(--available-height\)\]"/u);
	// Separators are derived from group boundaries, never hand-placed.
	assert.match(overflowMenuSource, /\{groupIndex > 0 \? <DropdownMenuSeparator \/> : null\}/u);
});

test("experimental v2 reuses the Artifact Pane labels field", () => {
	const detailsTabSource = readBlockFile("experimental-v2/components/details-tab.tsx");
	const detailFieldEditorsSource = readBlockFile("experimental-v2/components/detail-field-editors.tsx");

	assert.match(
		detailsTabSource,
		/import \{ ArtifactLabelsField \} from "@\/components\/blocks\/artifact-pane\/artifact-labels-field";/u,
	);
	assert.match(
		detailsTabSource,
		/<ArtifactPanePropertyRow icon=\{<TagIcon label="" size="small" \/>\} label="Labels">/u,
	);
	assert.match(
		detailsTabSource,
		/<ArtifactLabelsField onChange=\{\(next\) => onChange\(\{ labels: next \}\)\} value=\{draft\.labels\} \/>/u,
	);
	assert.doesNotMatch(detailFieldEditorsSource, /export function LabelsRowField/u);
});

test("experimental v2 calendars are never narrower than their date triggers", () => {
	const detailFieldEditorsSource = readBlockFile("experimental-v2/components/detail-field-editors.tsx");

	assert.match(detailFieldEditorsSource, /className="w-auto min-w-\(--anchor-width\) p-2"/u);
});

test("experimental v2 reuses the Artifact Pane project field", () => {
	const detailsTabSource = readBlockFile("experimental-v2/components/details-tab.tsx");

	assert.match(
		detailsTabSource,
		/import \{ ArtifactProjectField \} from "@\/components\/blocks\/artifact-pane\/artifact-project-field";/u,
	);
	assert.match(
		detailsTabSource,
		/<ArtifactProjectField onChange=\{\(id\) => onChange\(\{ atlassianProject: id \}\)\} value=\{draft\.atlassianProject\} \/>/u,
	);
	assert.doesNotMatch(detailsTabSource, /function AtlassianProjectEditor/u);
});

test("experimental v2 Details shows Reporter as a read-only property row", () => {
	const detailsTabSource = readBlockFile("experimental-v2/components/details-tab.tsx");
	const titleBarSource = readBlockFile("experimental-v2/components/context-title-bar.tsx");
	const contextPanelSource = readBlockFile("experimental-v2/components/context-panel.tsx");

	assert.match(
		detailsTabSource,
		/label="Assignee"[\s\S]*label="Reporter"[\s\S]*label="Priority"/u,
	);
	assert.match(
		detailsTabSource,
		/<ArtifactPanePropertyRow editable=\{false\} icon=\{<PersonIcon label="" size="small" \/>\} label="Reporter">[\s\S]*<PersonReadOnlyValue placeholder="Unassigned" value=\{draft\.reporter\} \/>/u,
	);
	assert.doesNotMatch(titleBarSource, /ContextTitleMeta|data-jira-work-item-title-meta|Reported/u);
	assert.doesNotMatch(contextPanelSource, /ContextTitleMeta|data-jira-work-item-title-meta/u);
});

test("experimental v2 Details shows Priority as a primary always-visible field", () => {
	const detailsTabSource = readBlockFile("experimental-v2/components/details-tab.tsx");

	// Priority sits with Status / Project / Assignee — outside the See more block.
	assert.match(
		detailsTabSource,
		/label="Assignee"[\s\S]*label="Priority"[\s\S]*\{showMore \?/u,
	);
	assert.doesNotMatch(
		detailsTabSource,
		/\{showMore \? \([\s\S]*label="Priority"/u,
	);
});

test("experimental v2 keeps the status focus ring visible while its menu is open", () => {
	const detailFieldEditorsSource = readBlockFile("experimental-v2/components/detail-field-editors.tsx");

	// `ring-ring/50` (not full opacity) so the open status pill matches the
	// Input/InputGroup focus recipe used by the rest of the Details panel.
	assert.match(
		detailFieldEditorsSource,
		/className="data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring\/50"/u,
	);
});

test("experimental v2 reveals description mode tabs across the description scope", () => {
	const aiPlannerPanelSource = readBlockFile("experimental-v2/components/ai-planner-panel.tsx");
	const contextResourcesSource = readBlockFile("experimental-v2/components/context-resources.tsx");
	const layoutSource = readBlockFile("experimental-v2/components/experimental-work-item-layout.tsx");
	const richTextEditorStyles = fs.readFileSync(
		path.join(BLOCK_DIR, "../../ui-custom/rich-text-editor/rich-text-editor.css"),
		"utf8",
	);

	assert.match(
		aiPlannerPanelSource,
		/className=\{cn\("group\/description-scope flex flex-col gap-6", hasPlanner \? "px-2 pb-2" : null\)\}/u,
	);
	// Layout hover group wraps header + left column only — not the metadata rail.
	assert.match(
		layoutSource,
		/className="group\/description-scope contents">[\s\S]*\{header\}[\s\S]*\{context\}[\s\S]*<\/div>\s*<AnimatePresence[\s\S]*id="experimental-work-item-metadata-panel"/u,
	);
	assert.doesNotMatch(
		layoutSource,
		/className="group\/description-scope[^"]*overflow-y-auto/u,
	);
	assert.doesNotMatch(
		layoutSource,
		/group\/description-scope[\s\S]*id="experimental-work-item-metadata-panel"[\s\S]*group\/description-scope/u,
	);
	assert.match(
		contextResourcesSource,
		/<div className="pointer-events-none ml-auto shrink-0 flex items-center gap-1 opacity-0 transition-opacity duration-normal ease-out group-hover\/description-scope:pointer-events-auto group-hover\/description-scope:opacity-100 group-has-\[:focus-visible\]\/description-scope:pointer-events-auto group-has-\[:focus-visible\]\/description-scope:opacity-100 @\[860px\]\/agentlayout:mr-\[var\(--metadata-panel-offset\)\] motion-reduce:transition-none">[\s\S]*aria-label="Copy work item as markdown"[\s\S]*navigator\.clipboard\.writeText\(markdown\)[\s\S]*<CopyIcon label="" size="small" \/>[\s\S]*Copy work item as markdown[\s\S]*<EditorToolbarModeTabs[\s\S]*mode=\{descriptionViewMode\}[\s\S]*onModeChange=\{onDescriptionViewModeChange\}/u,
	);
	assert.doesNotMatch(contextResourcesSource, /size="compact"/u);
	assert.doesNotMatch(contextResourcesSource, /group-focus-within\/description-scope/u);
	assert.doesNotMatch(contextResourcesSource, /\[&_\[data-slot=tabs-(?:list|trigger)\]\]/u);
	assert.match(
		richTextEditorStyles,
		/\.context-description-tiptap-editor:not\(:focus\) > p:last-child:has\(> br\.ProseMirror-trailingBreak:only-child\) \{\s*display: none;/u,
	);
});

test("experimental v2 gives the title and controls a full-width row above description and Details", () => {
	const globalCss = fs.readFileSync(path.join(BLOCK_DIR, "../../../app/globals.css"), "utf8");
	const compositionSource = readBlockFile("experimental-v2/experimental-v2-jira-work-item.tsx");
	const contextEditableHeaderSource = readBlockFile("experimental-v2/components/context-editable-header.tsx");
	const contextPanelSource = readBlockFile("experimental-v2/components/context-panel.tsx");
	const contextResourcesSource = readBlockFile("experimental-v2/components/context-resources.tsx");
	const dialogSource = readBlockFile("experimental-v2/components/experimental-work-item-dialog.tsx");
	const layoutSource = readBlockFile("experimental-v2/components/experimental-work-item-layout.tsx");
	const modalHeaderSource = fs.readFileSync(
		path.join(BLOCK_DIR, "../../projects/jira/components/work-item-modal/modal-header.tsx"),
		"utf8",
	);
	const titleActionsSource = readBlockFile("experimental-v2/components/context-title-actions.tsx");
	const titleBarSource = readBlockFile("experimental-v2/components/context-title-bar.tsx");

	assert.match(
		compositionSource,
		/useState<EditorToolbarViewMode>\("rendered"\)[\s\S]*header=\{\([\s\S]*<ContextHeader[\s\S]*primaryCodingAgentId=\{props\.primaryCodingAgentId\}[\s\S]*context=\{\([\s\S]*<ContextPanel/u,
	);
	assert.match(
		contextPanelSource,
		/export function ContextHeader\([\s\S]*className="flex min-w-0 flex-col gap-4" data-jira-work-item-context-header[\s\S]*className="flex min-w-0 flex-col items-start gap-1" data-jira-work-item-title-block[\s\S]*<WorkItemKeyCopy \/>[\s\S]*<ContextTitleBar \/>[\s\S]*data-jira-work-item-header-actions[\s\S]*<ContextResources[\s\S]*descriptionViewMode=\{descriptionViewMode\}[\s\S]*outputs=\{outputs\}[\s\S]*primaryCodingAgentId=\{primaryCodingAgentId\}[\s\S]*onDescriptionViewModeChange=\{onDescriptionViewModeChange\}/u,
	);
	assert.doesNotMatch(
		contextPanelSource,
		/selectLatestPullRequestEntry|data-jira-work-item-header-pull-request|JiraActivityEvent/u,
	);
	assert.match(
		contextPanelSource,
		/export function ContextPanel\([\s\S]*<section aria-label="Work item context" className="flex flex-col">[\s\S]*<AiPlannerScope[\s\S]*<ContextEditableDescription/u,
	);
	assert.doesNotMatch(contextPanelSource, /export function ContextPanel\([\s\S]*<ContextTitleBar|export function ContextPanel\([\s\S]*<ContextResources/u);
	assert.match(
		layoutSource,
		/grid-rows-\[auto_minmax\(0,1fr\)\][\s\S]*\{header\}[\s\S]*\[grid-area:2\/1\][\s\S]*\{context\}[\s\S]*\[grid-area:2\/1\][\s\S]*\{metadata\}/u,
	);
	assert.match(
		layoutSource,
		/const contentStyle = \{[\s\S]*"--metadata-panel-offset"[\s\S]*className="order-1 min-w-0[^"]*"[\s\S]*style=\{contentStyle\}[\s\S]*\{header\}/u,
	);
	assert.match(
		layoutSource,
		/import \{ METADATA_PANEL_WIDTH \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/layout-constants"/u,
	);
	assert.match(
		readBlockFile("experimental-v2/lib/layout-constants.ts"),
		/export const METADATA_PANEL_WIDTH = "440px";/u,
	);
	assert.match(
		layoutSource,
		/"--metadata-panel-offset": metadataCollapsed \? "0px" : METADATA_PANEL_WIDTH/u,
	);
	assert.match(
		layoutSource,
		/@\[860px\]\/agentlayout:w-\[440px\][\s\S]*id="experimental-work-item-metadata-panel"/u,
	);
	// Metadata rail: keep pr-6 / pb-8; no pl-2 (was an unused 8px left inset).
	assert.match(
		layoutSource,
		/@\[860px\]\/agentlayout:pr-6 @\[860px\]\/agentlayout:pb-8 @\[860px\]\/agentlayout:\[grid-area:2\/1\]"[\s\S]*id="experimental-work-item-metadata-panel"/u,
	);
	assert.doesNotMatch(
		layoutSource,
		/id="experimental-work-item-metadata-panel"[\s\S]*@\[860px\]\/agentlayout:pl-2|@\[860px\]\/agentlayout:pl-2[\s\S]*id="experimental-work-item-metadata-panel"/u,
	);
	// Keep the metadata rail flush — negative top margin clipped the Details/Activity toggle.
	assert.match(layoutSource, /className="h-full min-w-0">\{metadata\}/u);
	assert.doesNotMatch(layoutSource, /agentlayout:-mt-5">\{metadata\}/u);
	assert.match(
		contextResourcesSource,
		/"sticky top-0 z-10 \[container-type:scroll-state\]"[\s\S]*data-jira-work-item-resource-row[\s\S]*className="flex flex-wrap items-start gap-1[^"]*"[\s\S]*data-jira-work-item-resource-row-content[\s\S]*aria-label="Add to work item"[\s\S]*resources\.map\(\(resource\) =>[\s\S]*resource\.renderPopover[\s\S]*<AnimatedContextTitleActions primaryAgentId=\{primaryCodingAgentId\} \/>/u,
	);
	assert.match(
		contextResourcesSource,
		/const hasPlanner = planner\.status !== "inactive" && planner\.status !== "applied";[\s\S]*hasPlanner[\s\S]*\? "bg-bg-input \[&_\[data-slot=button\]\]:bg-bg-input[^"]*"[\s\S]*: "bg-surface-overlay"/u,
	);
	assert.doesNotMatch(contextResourcesSource, /\[&_\[data-slot=tabs-list\]\]:bg-bg-input/u);
	assert.doesNotMatch(contextResourcesSource, /\[&_\[data-slot=tabs-trigger\]\[data-active\]\]:bg-bg-input/u);
	assert.match(
		contextResourcesSource,
		/import \{ StickyRowScrollFade \} from "@\/components\/visual\/scroll-mask";[\s\S]*data-jira-work-item-resource-row[\s\S]*<StickyRowScrollFade[\s\S]*className=\{hasPlanner \? "\[&>div\]:from-bg-input" : undefined\}[\s\S]*data-slot="jira-work-item-resource-row-scroll-fade"/u,
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
	assert.doesNotMatch(contextResourcesSource, /className="flex flex-wrap items-start gap-2/u);
	assert.match(
		contextResourcesSource,
		/<div className="[^"]*ml-auto shrink-0[^"]*@\[860px\]\/agentlayout:mr-\[var\(--metadata-panel-offset\)\][^"]*">[\s\S]*<EditorToolbarModeTabs[\s\S]*mode=\{descriptionViewMode\}[\s\S]*onModeChange=\{onDescriptionViewModeChange\}/u,
	);
	assert.match(contextResourcesSource, /buttonLabel: "Add attachments",[\s\S]*<AttachmentIcon label="" size="small" \/>/u);
	assert.match(contextResourcesSource, /buttonLabel: "Add subtasks",[\s\S]*<ChildWorkItemsIcon label="" size="small" \/>/u);
	assert.match(contextResourcesSource, /buttonLabel: "Link work items",[\s\S]*<LinkIcon label="" size="small" \/>[\s\S]*<LinkedWorkItemsPopover key="linkedItems" open=\{open\} onOpenChange=\{onOpenChange\} trigger=\{trigger\} \/>/u);
	assert.match(
		contextResourcesSource,
		/<DropdownMenuTrigger[\s\S]*aria-label="Add to work item"[\s\S]*<AddIcon label="" size="small" \/>[\s\S]*resources\.map\(\(resource\) => \([\s\S]*onSelect=\{\(\) => setActiveResourceAction\(resource\.id\)\}[\s\S]*Create commit[\s\S]*Create branch/u,
	);
	assert.match(contextResourcesSource, /<AttachmentsPopover key="attachments" open=\{open\} onOpenChange=\{onOpenChange\} trigger=\{trigger\} \/>/u);
	assert.match(contextResourcesSource, /<SubtasksPopover key="subtasks" open=\{open\} onOpenChange=\{onOpenChange\} trigger=\{trigger\} \/>/u);
	assert.match(contextResourcesSource, /className="pointer-events-none absolute inset-0 opacity-0"[\s\S]*activeResourceAction === resource\.id/u);
	assert.doesNotMatch(contextResourcesSource, /<Button size="compact" type="button" variant="outline">/u);
	assert.doesNotMatch(contextResourcesSource, /const empty =|empty\.map/u);
	assert.doesNotMatch(contextResourcesSource, /agentFieldName="attachments"|agentFieldName="subtasks"|agentFieldName="linkedItems"/u);
	assert.match(titleActionsSource, /metadataTogglePending \|\| metadataLayoutAnimating/u);
	assert.match(titleActionsSource, /inert=\{isInteractive \? undefined : true\}/u);
	// Restriction, watcher, and share moved into the header overflow menu.
	assert.doesNotMatch(titleActionsSource, /ContextHeaderActions|LockUnlockedIcon|EyeOpenIcon|ShareIcon/u);
	assert.match(
		titleActionsSource,
		/export function ContextTitleActions\([\s\S]*useJiraWorkItemMeta\(\)[\s\S]*primaryAgentId \?\? \(initialPreset === "blank" \? null : "claude-code"\)[\s\S]*<ButtonGroup variant="split">[\s\S]*aria-label=\{primaryCodingAgent \? `Open in \$\{primaryCodingAgent\.label\}` : "Open in"\}[\s\S]*className="has-data-\[icon=inline-start\]:pl-2 \[&_\[aria-hidden\]\[data-agent-logo=rovo\]_img\]:size-3! \[&_\[aria-hidden\]\[data-agent-logo=rovo\]_svg\]:size-3! \[&_\[aria-hidden\]\[data-agent-logo=third-party\]_img\]:size-4! \[&_\[aria-hidden\]\[data-agent-logo=third-party\]_svg\]:size-4!"[\s\S]*size="compact"[\s\S]*className="inline-flex size-4 shrink-0 items-center justify-center \[&_span\]:flex! \[&_span\]:items-center! \[&_span\]:justify-center!"[\s\S]*data-agent-logo=\{primaryCodingAgent\?\.id === "rovo-cli" \? "rovo" : primaryCodingAgent \? "third-party" : undefined\}[\s\S]*data-icon=\{primaryCodingAgent \? "inline-start" : undefined\}[\s\S]*primaryCodingAgent\.buttonLogo[\s\S]*<CodeIcon aria-hidden size="small" \/>[\s\S]*primaryCodingAgent \? `Open in \$\{primaryCodingAgent\.label\}` : "Open in"[\s\S]*aria-label="More open options" size="icon-compact"/u,
	);
	assert.doesNotMatch(titleActionsSource, /aria-label=\{primaryCodingAgent[\s\S]*className="gap-0\.5"[\s\S]*variant="outline"/u);
	assert.doesNotMatch(titleActionsSource, /AddIcon|aria-label="Add"/u);
	assert.match(titleActionsSource, /<motion\.div[\s\S]*className="flex shrink-0 items-center gap-1"/u);
	assert.doesNotMatch(titleActionsSource, /export function ContextTitleActions\([\s\S]*<div className="flex shrink-0 items-center gap-2">/u);
	assert.match(
		titleActionsSource,
		/const CODING_AGENTS[\s\S]*\{ id: "claude-code", label: "Claude"[\s\S]*\{ id: "claude-cli", label: "Claude CLI"[\s\S]*\{ id: "codex", label: "Codex"[\s\S]*\{ id: "cursor", label: "Cursor"[\s\S]*\{ id: "gemini", label: "Gemini"[\s\S]*\{ id: "github-copilot", label: "GitHub Copilot"[\s\S]*\{ id: "rovo-cli", label: "Rovo CLI"[\s\S]*\{ id: "vs-code", label: "VS Code"/u,
	);
	assert.match(
		titleActionsSource,
		/name === "cursor" \|\| name === "github-copilot"[\s\S]*"dark:brightness-0 dark:invert"[\s\S]*className=\{darkModeClassName\}/u,
	);
	assert.match(
		titleActionsSource,
		/codingAgents\.map\(\(agent\) => \([\s\S]*<DropdownMenuItem[\s\S]*elemBefore=\{<span aria-hidden className="inline-flex items-center justify-center leading-none">\{agent\.logo\}<\/span>\}[\s\S]*key=\{agent\.id\}[\s\S]*onSelect=\{\(\) => setSelectedAgentId\(agent\.id\)\}[\s\S]*\{agent\.label\}[\s\S]*Copy prompt/u,
	);
	assert.doesNotMatch(titleActionsSource, /byline|menu-row-title|menu-row-byline|className="h-11 py-0"/u);
	assert.match(
		titleActionsSource,
		/<div className="sticky bottom-0 bg-surface-overlay px-1 pb-1">[\s\S]*<DropdownMenuSeparator className="mt-0" \/>[\s\S]*Copy prompt/u,
	);
	assert.doesNotMatch(titleActionsSource, /Configure MCP|Configure Teamwork Graph|\/icons\/mcp\.svg|TeamworkGraphIcon/u);
	assert.doesNotMatch(titleActionsSource, /sticky bottom-0 border-t|<div className="border-t border-border p-1">/u);
	assert.match(
		titleActionsSource,
		/<DropdownMenuContent[\s\S]*className="max-h-\[var\(--available-height\)\] p-0"[\s\S]*<div className="p-1">/u,
	);
	assert.doesNotMatch(titleActionsSource, /max-h-72|overflow-y-auto p-1/u);
	assert.doesNotMatch(titleActionsSource, /DropdownMenuSub|ScreenIcon|CloudIcon/u);
	assert.doesNotMatch(titleActionsSource, /ContextTitleActions\([\s\S]*collapsed = false/u);
	assert.doesNotMatch(titleBarSource, /ContextTitleActions|AnimatedContextTitleActions/u);
	assert.doesNotMatch(titleBarSource, /from "motion\/react"|usePanelLayout|px-6/u);
	assert.match(
		titleBarSource,
		/navigator\.clipboard\?\.writeText\(workItem\.code\)[\s\S]*setCopied\(true\)[\s\S]*setTooltipOpen\(true\)/u,
	);
	assert.match(
		titleBarSource,
		/export function WorkItemKeyCopy\(\)[\s\S]*<TooltipTrigger[\s\S]*delay=\{0\}[\s\S]*render=\{\s*<button\s*type="button"\s*aria-label=\{copied \? "Work item key copied" : "Copy work item key"\}\s*className="group\/work-item-key inline-flex min-w-0 cursor-pointer items-center border-0 bg-transparent p-0 font-mono text-base leading-5 text-text-subtle hover:text-text focus-visible:text-text focus-visible:outline-none"\s*data-jira-work-item-key\s*onClick=\{\(\) => void handleCopyWorkItemKey\(\)\}\s*\/>\s*\}[\s\S]*data-jira-work-item-key-label>\{workItem\.code\}[\s\S]*max-w-0 shrink-0[\s\S]*group-hover\/work-item-key:max-w-6[\s\S]*data-jira-work-item-key-copy-icon[\s\S]*className="ml-1 inline-flex size-4 shrink-0 items-center justify-center \[&_\[data-slot=icon\]\]:size-4 \[&_svg\]:size-4"[\s\S]*className=\{cn\("size-4", copied \? "text-icon-success" : "text-text-subtle"\)\}[\s\S]*render=\{copied \? <StatusSuccessIcon[\s\S]*: <LinkIcon[\s\S]*size="small"[\s\S]*<TooltipContent side="top">[\s\S]*\{copied \? "Work item key copied" : "Copy work item key"\}[\s\S]*<\/TooltipContent>/u,
	);
	assert.doesNotMatch(titleBarSource, /role="button"|tabIndex=\{0\}|onKeyDown=\{handleKeyDown\}/u);
	assert.doesNotMatch(titleBarSource, /from "@\/components\/ui\/button"|<Button[\s\S]*data-jira-work-item-key/u);
	assert.doesNotMatch(titleBarSource, /components\/ui\/tag|<Tag/u);
	assert.match(
		titleBarSource,
		/export function ContextTitleBar\(\)[\s\S]*className="min-w-0 self-stretch @\[860px\]\/agentlayout:mr-\[var\(--metadata-panel-offset\)\]"[\s\S]*data-jira-work-item-title-column[\s\S]*<ContextEditableTitle \/>/u,
	);
	assert.doesNotMatch(titleBarSource, /ContextTitleMeta|data-jira-work-item-title-meta/u);
	assert.doesNotMatch(contextPanelSource, /ContextTitleMeta|data-jira-work-item-title-meta/u);
	assert.doesNotMatch(contextEditableHeaderSource, /readViewFitContainerWidth=\{false\}/u);
	assert.match(
		readBlockFile("experimental-v2/components/inline-edit-treatment.ts"),
		/export const CONTEXT_TITLE_READ_VIEW_CLASS_NAME =\s*"relative h-auto overflow-visible border-0 bg-transparent px-0 py-1 hover:bg-transparent active:bg-transparent focus-visible:border-transparent focus-visible:bg-transparent";/u,
	);
	assert.doesNotMatch(
		readBlockFile("experimental-v2/components/inline-edit-treatment.ts"),
		/export const CONTEXT_TITLE_READ_VIEW_CLASS_NAME =\s*"[^"]*border-2[^"]*"/u,
	);
	assert.doesNotMatch(titleBarSource, /export function ContextTitleBar\(\)[\s\S]*<WorkItemKeyCopy/u);
	assert.doesNotMatch(dialogSource, /breadcrumbLeadingContent|WorkItemKeyCopy/u);
	assert.match(
		modalHeaderSource,
		/breadcrumbLeadingContent\?: ReactNode;[\s\S]*<BreadcrumbItem className="mr-2 shrink-0">[\s\S]*\{breadcrumbLeadingContent\}[\s\S]*<BreadcrumbItem className="min-w-0 max-w-\[240px\] shrink">/u,
	);
	assert.doesNotMatch(dialogSource, /ContextTitleBar/u);
	assert.match(dialogSource, /gridTemplateRows: "minmax\(0, 1fr\)"/u);
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

test("the activity panel gives reactions and human replies somewhere to land", () => {
	const activityPanelSource = readBlockFile("experimental-v2/components/activity-panel.tsx");
	const adapterSource = readBlockFile("experimental-v2/lib/jira-activity-adapter.ts");

	// The timeline is controlled here (entries derive from meta.activityEvents),
	// so JiraActivity's built-in reducer can never apply a reaction: without an
	// explicit callback both branches of `applyAction` are inert and every
	// reaction click would be a silent no-op.
	assert.match(activityPanelSource, /onToggleReaction=\{handleToggleReaction\}/u);
	assert.match(activityPanelSource, /toggleReaction\(entry\.reactions \?\? \[\], emoji, JIRA_WORK_ITEM_CURRENT_USER\.id\)/u);
	assert.match(activityPanelSource, /const reactionActors = useMemo\(\(\) => \{/u);
	assert.match(activityPanelSource, /actors=\{reactionActors\}/u);

	// Human comments now expose Reply (allowReply flipped to true), but they have
	// no session to route into — their drafts must be kept rather than dropped.
	assert.match(adapterSource, /allowReply: true,/u);
	assert.match(activityPanelSource, /onSubmitReply=\{handleSubmitReply\}/u);
	assert.match(activityPanelSource, /actions\.replySession\(event\.sessionId, body\)/u);
	assert.match(activityPanelSource, /setLocalReplies\(\(previous\) => \(\{/u);

	// Local state is overlaid per entry id rather than replacing the derived
	// array, so streaming session updates keep flowing through untouched.
	assert.match(activityPanelSource, /const entries = derivedEntries\.map\(\(entry\) => \{/u);
	assert.doesNotMatch(activityPanelSource, /useState\(derivedEntries\)/u);
});

test("experimental v2 opens the agent and skill pickers with the editor-palette search bar", () => {
	// Both pills are registered v2 divergences, so the structural-duplicate test
	// no longer guards them. Pin the reason for the divergence instead: the
	// selectors must request the borderless palette search field so they match
	// the "/" menu and the Parent/Labels pickers on the same screen.
	for (const relativePath of [
		"experimental-v2/components/activity-composer-agent-context-pill.tsx",
		"experimental-v2/components/activity-composer-skill-context-pill.tsx",
	]) {
		assert.match(readBlockFile(relativePath), /searchVariant="palette"/u, `${relativePath} dropped the palette search bar`);
	}

	// v1 stays on the boxed CommandInput — the divergence is deliberate, not drift.
	for (const relativePath of [
		"experimental/components/activity-composer-agent-context-pill.tsx",
		"experimental/components/activity-composer-skill-context-pill.tsx",
	]) {
		assert.doesNotMatch(readBlockFile(relativePath), /searchVariant=/u, `${relativePath} unexpectedly adopted a search variant`);
	}
});

test("the work-item skill picker has enough skills to scroll and keeps its pinned pair", () => {
	const optionsSource = readBlockFile("experimental-v2/lib/work-item-picker-options.ts");
	const skillIds = [...optionsSource.matchAll(/^\t\tid: "([^"]+)",$/gmu)].map((match) => match[1]);

	// The list is a scroll-mask fixture as much as a menu: the picker viewport is
	// ~287px and rows are 44px, so it needs well over 7 skills to overflow and
	// show the fade at all.
	assert.ok(skillIds.length >= 10, `expected 10+ work-item skills, found ${skillIds.length}`);
	assert.equal(new Set(skillIds).size, skillIds.length, "work-item skill ids must be unique");

	// Adding skills must never displace the pinned pair — they render in their own
	// "Pinned by space" group above "More skills" and must still resolve.
	for (const pinnedId of ["summarize-comments", "improve-description"]) {
		assert.ok(skillIds.includes(pinnedId), `pinned skill ${pinnedId} is missing from the catalog`);
		assert.match(optionsSource, new RegExp(`"${pinnedId}",`, "u"), `${pinnedId} dropped out of the pinned defaults`);
	}
});
