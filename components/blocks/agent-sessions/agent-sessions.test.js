const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const BLOCK_DIR = __dirname;
const AGENT_SESSIONS_SOURCE = fs.readFileSync(path.join(BLOCK_DIR, "index.tsx"), "utf8");
const TEST_WORK_ITEM = {
	code: "RFP-101",
	title: "Acmecorp: Prepare for bid recommendation for ESM RFP",
	status: "RFP Intake",
	priority: "High",
	assignee: { name: "Maya Chen" },
	reporter: { name: "Jordan Lee" },
	startDate: "May 12, 2026",
	dueDate: "Jun 8, 2026",
	parent: { code: "RFP-100", title: "Enterprise RFP Response" },
	labels: ["Acmecorp", "qualification", "enterprise"],
};

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function readBlockFile(relativePath) {
	return fs.readFileSync(path.join(BLOCK_DIR, relativePath), "utf8");
}

// The pure model is loaded via esbuild (type-only imports strip to a clean CJS
// bundle) so behavioral coverage can exercise the reducer/timer/selectors without
// a DOM or React harness — mirroring components/projects/jira/lib/rfp-demo-state.test.js.
let modelPromise;
let detailsTabPromise;
let detailFieldEditorsPromise;
function loadBlockModule(relativePath, harnessName) {
	return esbuild
		.build({
			entryPoints: [path.join(BLOCK_DIR, relativePath)],
			bundle: true,
			format: "cjs",
			loader: { ".css": "empty" },
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			write: false,
		})
		.then((result) => loadCjsModuleFromText(result.outputFiles[0].text, harnessName));
}

function loadSessionModel() {
	if (!modelPromise) {
		modelPromise = loadBlockModule("data/session-state.ts", "agent-sessions-model-harness.cjs");
	}
	return modelPromise;
}

function loadDetailsTabModule() {
	if (!detailsTabPromise) {
		detailsTabPromise = loadBlockModule("experimental/components/details-tab.tsx", "agent-sessions-details-tab-harness.cjs");
	}
	return detailsTabPromise;
}

function loadDetailFieldEditorsModule() {
	if (!detailFieldEditorsPromise) {
		detailFieldEditorsPromise = loadBlockModule(
			"experimental/components/detail-field-editors.tsx",
			"agent-sessions-detail-field-editors-harness.cjs",
		);
	}
	return detailFieldEditorsPromise;
}

function tickUntil(model, state, predicate, maxTicks = 400) {
	let working = state;
	let ticks = 0;
	while (!predicate(working) && ticks < maxTicks) {
		working = model.agentSessionsReducer(working, { type: "tick", deltaMs: model.AGENT_SESSIONS_TICK_MS });
		ticks += 1;
	}
	return working;
}

// ── Source shape: variant API + experimental preset ──────────────────────────

test("AgentSessions exposes the variant API and the minimal experimental preset prop", () => {
	assert.match(AGENT_SESSIONS_SOURCE, /export type AgentSessionsVariant = "default" \| "experimental";/u);
	assert.match(AGENT_SESSIONS_SOURCE, /variant\?: AgentSessionsVariant;/u);
	assert.match(AGENT_SESSIONS_SOURCE, /variant = "default"/u);
	assert.match(AGENT_SESSIONS_SOURCE, /initialExperimentalPreset\?: AgentSessionsExperimentalPreset;/u);
	assert.match(AGENT_SESSIONS_SOURCE, /initialExperimentalPreset = "filled"/u);
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/variant === "experimental" \? \([\s\S]*<AgentSessionsExperimentalView[\s\S]*\) : \([\s\S]*<AgentSessionsDefaultView/u,
	);
	// The experimental preset type is the model's preset union.
	assert.match(AGENT_SESSIONS_SOURCE, /import type \{ AgentSessionsPreset \} from "@\/components\/blocks\/agent-sessions\/data\/session-state";/u);
});

test("AgentSessions preserves the standard variant behavior (regression)", () => {
	const defaultViewSource = AGENT_SESSIONS_SOURCE.slice(
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsDefaultView"),
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsExperimentalView"),
	);
	// Standard view keeps the Jira work item modal + shared floating Rovo launcher + chat surface.
	assert.match(defaultViewSource, /const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/u);
	assert.match(defaultViewSource, /<JiraWorkItemModal isOpen=\{isIssueOpen\} onClose=\{handleIssueClose\} \/>/u);
	assert.match(defaultViewSource, /\{isIssueOpen && chatSurface === null \? \([\s\S]*<FloatingRovoButton[\s\S]*product="jira"[\s\S]*\/>[\s\S]*\) : null\}/u);
	assert.match(defaultViewSource, /\{chatSurface === "floating" \? <RovoFloatingChat key="floating-chat" \/> : null\}/u);
	assert.match(AGENT_SESSIONS_SOURCE, /import FloatingRovoButton from "@\/components\/projects\/shared\/components\/floating-rovo-button";/u);
	assert.match(AGENT_SESSIONS_SOURCE, /import RovoFloatingChat from "@\/components\/projects\/rovo-floating-chat\/components\/rovo-floating-chat";/u);
	// Standard mock context is not inlined into the block source.
	assert.doesNotMatch(defaultViewSource, /Acmecorp: Prepare for bid recommendation for ESM RFP/u);
});

test("AgentSessions experimental view mounts the local composition, not the global Rovo chat", () => {
	const experimentalViewSource = AGENT_SESSIONS_SOURCE.slice(
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsExperimentalView"),
		AGENT_SESSIONS_SOURCE.indexOf("export default AgentSessions"),
	);
	assert.match(experimentalViewSource, /const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/u);
	assert.match(experimentalViewSource, /<ExperimentalAgentSessions[\s\S]*open=\{isIssueOpen\}[\s\S]*onClose=\{handleIssueClose\}[\s\S]*initialPreset=\{initialExperimentalPreset\}[\s\S]*\/>/u);
	// The experimental variant must NOT reuse the standard modal or the global Rovo chat surface.
	assert.doesNotMatch(experimentalViewSource, /JiraWorkItemModal/u);
	assert.doesNotMatch(experimentalViewSource, /RovoFloatingChat/u);
	assert.match(AGENT_SESSIONS_SOURCE, /import \{ ExperimentalAgentSessions \} from "@\/components\/blocks\/agent-sessions\/experimental\/experimental-agent-sessions";/u);
	// Shared open/close shell is extracted and used by both views.
	assert.match(AGENT_SESSIONS_SOURCE, /function AgentSessionsShell\(/u);
	assert.equal((AGENT_SESSIONS_SOURCE.match(/<AgentSessionsShell onOpen=/gu) ?? []).length, 2);
});

test("the title Open split button uses direct 24px coding-agent logos", () => {
	const titleActionsSource = readBlockFile("experimental/components/context-title-actions.tsx");

	assert.match(titleActionsSource, /<ButtonGroup variant="split">/u);
	assert.match(
		titleActionsSource,
		/<DropdownMenuItem[\s\S]*className="gap-0\.5"[\s\S]*elemBefore=\{agent\.logo\}/u,
	);
	assert.match(titleActionsSource, /<LogoThirdParty name=\{name\} size="small" borderless \/>/u);
	assert.match(titleActionsSource, /<RovoColorIcon size="small" \/>/u);
	assert.doesNotMatch(titleActionsSource, /LogoThirdParty[^>]*size="xxsmall"/u);
	assert.match(titleActionsSource, /export function ContextTitleActions\(\{ collapsed = false \}/u);
	assert.doesNotMatch(titleActionsSource, /useAgentSessionsState|useAgentSessionsActions|StatusPill/u);
	assert.match(titleActionsSource, /\{collapsed \? null : \([\s\S]*aria-label="No restrictions"[\s\S]*<EyeOpenIcon[\s\S]*aria-label="Share"/u);
	assert.match(titleActionsSource, /collapsed \? \([\s\S]*<DropdownMenu[\s\S]*aria-label="Actions"/u);
	assert.match(titleActionsSource, />\s*No restrictions\s*<\/DropdownMenuItem>/u);
	assert.match(titleActionsSource, /elemAfter=\{<Badge>1<\/Badge>\}[\s\S]*>\s*Watch\s*<\/DropdownMenuItem>/u);
	assert.match(titleActionsSource, />\s*Share\s*<\/DropdownMenuItem>/u);
});

test("the experimental surface stays out of global Rovo history", () => {
	const compositionSource = readBlockFile("experimental/experimental-agent-sessions.tsx");
	const controllerSource = readBlockFile("experimental/use-agent-sessions-controller.ts");
	const contextSource = readBlockFile("experimental/context-agent-sessions.tsx");
	const dialogSource = readBlockFile("experimental/components/experimental-work-item-dialog.tsx");
	const floatingLauncherSource = readBlockFile("experimental/components/floating-session-launcher.tsx");
	const floatingSurfaceSource = readBlockFile("experimental/components/floating-session-surface.tsx");
	for (const source of [compositionSource, controllerSource, contextSource]) {
		assert.doesNotMatch(source, /useRovoChat/u);
		assert.doesNotMatch(source, /openChat\("floating"\)/u);
	}
	assert.match(compositionSource, /<AgentSessionsProvider/u);
	assert.match(
		compositionSource,
		/blanketContent=\{[\s\S]*<FloatingSessionSurface portalToViewport=\{presentation === "inline"\} \/>[\s\S]*\}/u,
	);
	assert.match(
		dialogSource,
		/<\/Dialog\.Popup>\s*\{open \? blanketContent : null\}\s*<\/Dialog\.Portal>/u,
	);
	assert.match(floatingSurfaceSource, /<FloatingSessionLauncher \/>/u);
	assert.doesNotMatch(floatingSurfaceSource, /onModalBlanket/u);
	assert.doesNotMatch(floatingLauncherSource, /translate-[xy]-/u);
});

test("the activity layout imports a real content-visibility hook", () => {
	const activityPanelSource = readBlockFile("experimental/components/activity-panel.tsx");
	const layoutSource = readBlockFile("experimental/components/experimental-work-item-layout.tsx");

	assert.match(activityPanelSource, /export function useHasActivity\(\): boolean/u);
	assert.match(activityPanelSource, /return meta\.activityEvents\.length > 0;/u);
	assert.match(layoutSource, /import \{ useHasActivity \} from .*activity-panel";/u);
});

test("the experimental metadata control is a neutral disclosure with Queue Details motion", () => {
	const actionsSource = readBlockFile("experimental/components/experimental-breadcrumb-actions.tsx");
	const dialogSource = readBlockFile("experimental/components/experimental-work-item-dialog.tsx");
	const modalHeaderSource = readProjectFile("components/projects/jira/components/work-item-modal/modal-header.tsx");
	const panelLayoutSource = readBlockFile("experimental/context-panel-layout.tsx");
	const layoutSource = readBlockFile("experimental/components/experimental-work-item-layout.tsx");
	const titleBarSource = readBlockFile("experimental/components/context-title-bar.tsx");

	assert.doesNotMatch(actionsSource, /aria-pressed/u);
	assert.match(actionsSource, /aria-expanded=\{!metadataCollapsed\}/u);
	assert.match(actionsSource, /aria-controls="experimental-work-item-metadata-panel"/u);
	assert.match(actionsSource, /disabled=\{metadataTogglePending\}/u);
	assert.match(actionsSource, /metadataCollapsed \? "Show metadata panel" : "Hide metadata panel"/u);
	assert.match(actionsSource, /aria-expanded:border-transparent aria-expanded:bg-transparent/u);
	assert.equal((actionsSource.match(/variant="ghost"/gu) ?? []).length, 2);
	assert.doesNotMatch(actionsSource, /variant="outline"/u);
	// Collapsed-only peek wiring: hover/focus opens the sneak-peek, click still docks.
	assert.match(actionsSource, /const peekProps = metadataCollapsed/u);
	assert.match(actionsSource, /onPointerEnter: \(\) => setMetadataPeek\(true\)/u);
	assert.match(actionsSource, /onPointerLeave: \(\) => setMetadataPeek\(false\)/u);
	assert.match(actionsSource, /onFocus: \(\) => setMetadataPeek\(true\)/u);
	assert.match(actionsSource, /onBlur: \(\) => setMetadataPeek\(false\)/u);
	assert.match(actionsSource, /\{\.\.\.peekProps\}/u);
	assert.match(dialogSource, /actionsClassName="gap-1"/u);
	assert.match(dialogSource, /closeButtonVariant="ghost"/u);
	assert.match(modalHeaderSource, /<Breadcrumb className="min-w-0 overflow-visible" size="small">/u);
	assert.match(modalHeaderSource, /<BreadcrumbList className="-m-1 min-w-0 flex-nowrap overflow-hidden p-1">/u);
	assert.match(layoutSource, /<AnimatePresence initial=\{false\}>/u);
	assert.match(layoutSource, /id="experimental-work-item-metadata-panel"/u);
	assert.match(layoutSource, /transform: "translateX\(100%\)"/u);
	assert.match(layoutSource, /duration: 0\.25, ease: \[0, 0\.4, 0, 1\]/u);
	assert.match(layoutSource, /duration: 0\.2, ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.match(layoutSource, /useReducedMotion\(\)/u);
	assert.match(layoutSource, /maxWidth: metadataCollapsed \? "800px" : "100%"/u);
	assert.match(layoutSource, /METADATA_CONTENT_COLLAPSE_TRANSITION/u);
	assert.match(layoutSource, /METADATA_CONTENT_EXPAND_TRANSITION/u);
	assert.equal((layoutSource.match(/layout=\{shouldReduceMotion \? false : "position"\}/gu) ?? []).length, 1);
	assert.match(layoutSource, /data-agent-sessions-content-column/u);
	// Peek overlay: a floating borderless rail, layered above the docked panel
	// (z-30) with the overlay shadow, gated on collapsed + peeking, no reflow.
	assert.match(layoutSource, /const showMetadataPeek = metadataCollapsed && metadataPeeking;/u);
	assert.match(layoutSource, /\{showMetadataPeek \? \(/u);
	assert.match(layoutSource, /@\[860px\]\/agentlayout:z-30/u);
	assert.match(layoutSource, /boxShadow: token\("elevation\.shadow\.overlay"\)/u);
	assert.match(layoutSource, /variants=\{shouldReduceMotion \? REDUCED_MOTION_METADATA_PEEK_VARIANTS : METADATA_PEEK_VARIANTS\}/u);
	assert.match(layoutSource, /onPointerEnter=\{\(\) => setMetadataPeek\(true\)\}/u);
	assert.match(layoutSource, /onPointerLeave=\{\(\) => setMetadataPeek\(false\)\}/u);
	assert.match(layoutSource, /metadataPeek: ReactNode/u);
	// The peek reuses the rail without its border; the docked instance keeps it.
	const compositionSource = readBlockFile("experimental/experimental-agent-sessions.tsx");
	assert.match(compositionSource, /metadataPeek=\{<MetadataRail borderless \/>\}/u);
	const metadataRailSource = readBlockFile("experimental/components/metadata-rail.tsx");
	assert.match(metadataRailSource, /borderless = false/u);
	assert.match(metadataRailSource, /borderless \? null : "border border-border"/u);
	assert.match(titleBarSource, /maxWidth: metadataCollapsed \? "800px" : "100%"/u);
	assert.match(titleBarSource, /data-agent-sessions-title-column/u);
	assert.match(titleBarSource, /layout=\{shouldReduceMotion \? false : "position"\}/u);
	assert.match(titleBarSource, /onLayoutAnimationComplete=\{\(\) => setSettledMetadataCollapsed\(metadataCollapsed\)\}/u);
	assert.match(titleBarSource, /data-agent-sessions-title/u);
	assert.doesNotMatch(titleBarSource, /function AnimatedContextTitle\(/u);
	assert.match(titleBarSource, /<AnimatePresence initial=\{false\} mode="popLayout">/u);
	assert.match(titleBarSource, /key=\{metadataCollapsed \? "metadata-collapsed" : "metadata-expanded"\}/u);
	assert.match(titleBarSource, /collapsed=\{metadataCollapsed\}/u);
	assert.match(titleBarSource, /settledMetadataCollapsed === metadataCollapsed/u);
	assert.match(panelLayoutSource, /METADATA_CONTENT_COLLAPSE_DURATION_MS = 200/u);
	assert.match(panelLayoutSource, /METADATA_CONTENT_EXPAND_DURATION_MS = 250/u);
	assert.match(panelLayoutSource, /const \[metadataTogglePending, setMetadataTogglePending\] = useState\(false\);/u);
	assert.match(panelLayoutSource, /toggleMetadata = useCallback\(\(\) => \{[\s\S]*setMetadataPeeking\(false\);[\s\S]*setMetadataTogglePending\(true\);[\s\S]*\}, \[\]\)/u);
	assert.match(panelLayoutSource, /setMetadataCollapsed\(\(collapsed\) => !collapsed\);[\s\S]*setMetadataTogglePending\(false\);/u);
	// Peek overlay: collapsed-only sneak-peek state, its fast transitions, and the
	// invariant that peek clears whenever the rail docks.
	assert.match(panelLayoutSource, /const \[metadataPeeking, setMetadataPeeking\] = useState\(false\);/u);
	assert.match(panelLayoutSource, /setMetadataPeek = useCallback\(\(peeking: boolean\) => setMetadataPeeking\(peeking\), \[\]\)/u);
	assert.match(panelLayoutSource, /if \(!metadataCollapsed\) setMetadataPeeking\(false\);/u);
	assert.match(panelLayoutSource, /METADATA_PEEK_ENTER_TRANSITION[\s\S]*duration: 0\.12,[\s\S]*ease: \[0\.4, 1, 0\.6, 1\]/u);
	assert.match(panelLayoutSource, /METADATA_PEEK_EXIT_TRANSITION[\s\S]*duration: 0\.1,[\s\S]*ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.match(titleBarSource, /duration: 0\.05,[\s\S]*ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.match(titleBarSource, /duration: 0\.1,[\s\S]*ease: \[0\.4, 1, 0\.6, 1\]/u);
	assert.match(titleBarSource, /EXPANDED_ACTIONS_ENTER_TRANSITION[\s\S]*duration: 0\.05/u);
	assert.match(titleBarSource, /collapsed \? ACTIONS_ENTER_TRANSITION : EXPANDED_ACTIONS_ENTER_TRANSITION/u);
	assert.match(titleBarSource, /opacity: 0, scale: 0\.96/u);
	assert.match(titleBarSource, /const isInteractive = !hideForToggle && isLayoutSettled && !isAnimating;/u);
	assert.match(titleBarSource, /hideForToggle=\{metadataTogglePending\}/u);
	assert.match(titleBarSource, /onToggleExitComplete=\{completeMetadataToggle\}/u);
	assert.match(titleBarSource, /hideForToggle && !didCompleteToggleExit\.current/u);
	assert.match(titleBarSource, /didCompleteToggleExit\.current = true;/u);
	assert.match(titleBarSource, /inert=\{isInteractive \? undefined : true\}/u);
	assert.match(titleBarSource, /willChange: isAnimating \? "transform, opacity" : undefined/u);
});

test("AI Planner is composed below the title with shared TWG and prompt primitives", () => {
	const contextPanelSource = readBlockFile("experimental/components/context-panel.tsx");
	const plannerPanelSource = readBlockFile("experimental/components/ai-planner-panel.tsx");
	const activityComposerSource = readBlockFile("experimental/components/activity-composer.tsx");
	const activityPanelSource = readBlockFile("experimental/components/activity-panel.tsx");
	const agentContextPillSource = readBlockFile("experimental/components/activity-composer-agent-context-pill.tsx");
	const skillContextPillSource = readBlockFile("experimental/components/activity-composer-skill-context-pill.tsx");
	const contextPillsSource = readBlockFile("experimental/components/activity-composer-context-pills.tsx");
	const composerMotionSource = readBlockFile("experimental/components/agent-sessions-composer-motion.tsx");
	const layoutSource = readBlockFile("experimental/components/experimental-work-item-layout.tsx");
	const compositionSource = readBlockFile("experimental/experimental-agent-sessions.tsx");
	const contextResourcesSource = readBlockFile("experimental/components/context-resources.tsx");
	const contextEditableHeaderSource = readBlockFile("experimental/components/context-editable-header.tsx");
	const twgToolSource = readProjectFile("components/ui-custom/twg-tool.tsx");
	const agentSummaryRowSource = fs.readFileSync(
		path.join(process.cwd(), "components", "blocks", "agent", "components", "agent-summary-row.tsx"),
		"utf8",
	);
	const detailsSource = readBlockFile("experimental/components/details-tab.tsx");
	assert.ok(contextPanelSource.indexOf("<ContextEditableTitle />") < contextPanelSource.indexOf("<AiPlannerScope"));
	assert.ok(contextPanelSource.indexOf("<AiPlannerScope") < contextPanelSource.indexOf("<AiPlannerPanel />"));
	assert.ok(contextPanelSource.indexOf("<AiPlannerPanel />") < contextPanelSource.indexOf("<ContextResources />"));
	assert.ok(contextPanelSource.indexOf("<ContextResources />") < contextPanelSource.indexOf("<ContextEditableDescription />"));
	assert.match(contextPanelSource, /<AiPlannerScope header=\{<AiPlannerPanel \/>\}>/u);
	// The context resources and description sit directly adjacent — no divider rule.
	assert.doesNotMatch(contextPanelSource, /<div aria-hidden className="h-px bg-border" \/>/u);
	assert.doesNotMatch(contextPanelSource, />Details</u);
	assert.match(contextEditableHeaderSource, /placeholder="Press \/ to help improve the work item"/u);
	assert.match(contextEditableHeaderSource, /"agent-instructions-tiptap-editor context-description-tiptap-editor text-text"/u);
	assert.match(contextEditableHeaderSource, /isProcessing && "context-description-tiptap-editor-hug"/u);
	assert.match(contextEditableHeaderSource, /mentionSources=\{EDITOR_PALETTE_MENTION_SOURCES\}/u);
	assert.match(contextEditableHeaderSource, /suggestionVariant="nested"/u);
	assert.match(contextEditableHeaderSource, /toolbarReveal="hover"/u);
	assert.match(contextEditableHeaderSource, /\bpadStuckToolbar\b/u);
	assert.doesNotMatch(contextEditableHeaderSource, /showToolbar=\{false\}|showBubbleMenu=\{false\}/u);
	assert.match(plannerPanelSource, /import \{ TwgTool, type TwgToolSource \} from "@\/components\/ui-custom\/twg-tool";/u);
	assert.match(plannerPanelSource, /import \{ Tile \} from "@\/components\/ui\/tile";/u);
	assert.match(plannerPanelSource, /import \{ TWGLoader \} from "@\/components\/ui-custom\/twg-loader";/u);
	assert.match(plannerPanelSource, /<Tile[\s\S]*className="relative z-10 bg-surface"[\s\S]*hasBorder[\s\S]*label="Teamwork Graph"[\s\S]*size="large"[\s\S]*variant="transparent"[\s\S]*<TWGLoader label="Teamwork Graph" size="small" \/>/u);
	assert.equal((plannerPanelSource.match(/loader=\{<TeamworkGraphLoaderTile \/>\}/gu) ?? []).length, 2);
	assert.equal((plannerPanelSource.match(/title="Teamwork Graph"/gu) ?? []).length, 2);
	assert.doesNotMatch(plannerPanelSource, /title="AI Planner"|aria-label="AI Planner controls"/u);
	assert.match(twgToolSource, /loader\?: ReactNode;/u);
	assert.match(twgToolSource, /loader \?\? \([\s\S]*<TWGLoader label="Teamwork Graph" size="small" \/>/u);
	assert.match(plannerPanelSource, /import \{ FloatingComposer \} from "@\/components\/projects\/shared\/components\/floating-composer";/u);
	assert.match(plannerPanelSource, /import \{ RovoComposerActionButton \} from "@\/components\/projects\/shared\/components\/rovo-composer-send-controls";/u);
	assert.match(plannerPanelSource, /<FloatingComposer[\s\S]*PromptInputTextarea[\s\S]*Tell Rovo what to change…/u);
	assert.match(plannerPanelSource, /planner\.status === "inactive" \|\| planner\.status === "applied"/u);
	assert.doesNotMatch(plannerPanelSource, /Planned by Rovo/u);
	assert.match(plannerPanelSource, /<CrossIcon label="" size="small" \/>[\s\S]*Reject/u);
	assert.match(plannerPanelSource, /<CheckMarkIcon label="" size="small" \/>[\s\S]*Accept suggestions/u);
	assert.match(plannerPanelSource, /<RovoComposerActionButton[\s\S]*experimentalDarkCta/u);
	assert.doesNotMatch(plannerPanelSource, /PromptInputFooter|PromptInputSubmit/u);
	assert.match(plannerPanelSource, /const hasPlanner = planner\.status === "searching" \|\| isReviewing;/u);
	assert.match(plannerPanelSource, /data-ai-planner-scope=\{hasPlanner \? "active" : undefined\}/u);
	assert.match(plannerPanelSource, /import \{ RovoGeneration \} from "@\/components\/ui-custom\/rovo-generation";/u);
	assert.match(plannerPanelSource, /<RovoGeneration\.Highlight active className="block w-full">/u);
	assert.match(plannerPanelSource, /hasPlanner \? "rounded-xl border border-border bg-bg-input p-1\.5" : null/u);
	assert.match(plannerPanelSource, /hasPlanner \? "px-2 pb-2" : null/u);
	assert.doesNotMatch(plannerPanelSource, /border-border-discovery-subtle/u);
	assert.match(plannerPanelSource, /data-ai-planner-controls="floating"/u);
	assert.match(plannerPanelSource, /className="relative z-20 mt-4"/u);
	assert.doesNotMatch(plannerPanelSource, /className="absolute inset-x-0/u);
	assert.match(plannerPanelSource, /<AgentSessionsComposerMotion placement="planner">[\s\S]*<FloatingComposer/u);
	assert.equal((plannerPanelSource.match(/size="default"/gu) ?? []).length, 2);
	assert.match(plannerPanelSource, /className="border-0 bg-surface-overlay"/u);
	assert.match(plannerPanelSource, /style=\{\{ boxShadow: token\("elevation\.shadow\.overlay"\) \}\}/u);
	assert.doesNotMatch(plannerPanelSource, /useRovoChat|launchSession/u);
	assert.match(compositionSource, /<LayoutGroup id=\{composerLayoutGroupId\}>/u);
	assert.match(composerMotionSource, /layoutId=\{metadataLayoutAnimating \? undefined : "agent-sessions-composer"\}/u);
	assert.match(composerMotionSource, /<LayoutGroup inherit="id">/u);
	assert.match(composerMotionSource, /layout=\{metadataLayoutAnimating \? false : "position"\}/u);
	assert.match(composerMotionSource, /layoutDependency=\{placement\}/u);
	assert.match(composerMotionSource, /duration: 0\.25,[\s\S]*ease: \[0\.4, 0, 0, 1\]/u);
	assert.match(composerMotionSource, /useReducedMotion\(\)/u);
	assert.match(composerMotionSource, /onLayoutAnimationStart[\s\S]*onLayoutAnimationComplete/u);
	assert.match(layoutSource, /planner\.status === "inactive" \|\| planner\.status === "applied"/u);
	assert.match(layoutSource, /\{showStickyComposer \? \([\s\S]*\{composer\}[\s\S]*\) : null\}/u);
	assert.match(layoutSource, /useHasVerticalOverflow/u);
	assert.match(layoutSource, /buildScrollMaskStyle\(\{ fadeTop: false, fadeBottom: showBottomScrollMask \}\)/u);
	assert.match(layoutSource, /data-agent-sessions-scroll-region/u);
	assert.match(layoutSource, /data-agent-sessions-composer-dock/u);
	assert.match(layoutSource, /className="[^"]*bg-background[^"]*"[\s\S]*data-agent-sessions-composer-dock/u);
	assert.doesNotMatch(layoutSource, /bg-background\/90|backdrop-blur/u);
	assert.doesNotMatch(layoutSource, /agentlayout:border-t|agentlayout:border-border/u);
	assert.match(activityComposerSource, /<ActivityComposerContextPills[\s\S]*onSelectAgent=\{\(agentName\) => insertContext\("@", agentName\)\}[\s\S]*onSelectSkill=\{\(skillId\) => insertContext\("\/", skillId\)\}/u);
	assert.match(activityComposerSource, /onStatusChange=\{\(status\) => actions\.updateMetadata\(\{ status \}\)\}[\s\S]*status=\{state\.metadata\.status\}/u);
	assert.match(contextPillsSource, /Move to:[\s\S]*<StatusPill onChange=\{onStatusChange\} value=\{status\} \/>/u);
	assert.match(activityComposerSource, /import \{ JiraActivityComposer \} from "@\/components\/blocks\/jira-activity";/u);
	assert.match(activityComposerSource, /<AgentSessionsComposerMotion placement="sticky">[\s\S]*<JiraActivityComposer/u);
	assert.match(activityComposerSource, /onValueChange=\{handlePromptChange\}/u);
	assert.match(activityComposerSource, /textareaRef=\{editorRef\}/u);
	assert.match(activityComposerSource, /value=\{draft\}/u);
	assert.doesNotMatch(activityComposerSource, /import \{ FloatingComposer \}|PromptInputTextarea|RovoComposerActionButton/u);
	assert.doesNotMatch(activityComposerSource, /className="shadow-none"/u);
	assert.match(activityComposerSource, /return `\$\{currentDraft\}\$\{separator\}\$\{prefix\}\$\{value\} `;[\s\S]*editorRef\.current\?\.focus\(\)/u);
	assert.doesNotMatch(activityComposerSource, /requestedContext/u);
	assert.match(activityPanelSource, /import \{ JiraActivity \} from "@\/components\/blocks\/jira-activity";/u);
	assert.match(activityPanelSource, /mapActivityEventsToJiraEntries\(meta\.activityEvents\)/u);
	assert.match(activityPanelSource, /<JiraActivity[\s\S]*composer=\{null\}[\s\S]*entries=\{entries\}[\s\S]*renderCommentAction=/u);
	assert.match(activityPanelSource, /actions\.openSession\(event\.sessionId\)/u);
	assert.doesNotMatch(activityPanelSource, /ActivityEventList/u);
	assert.match(contextPillsSource, /<ActivityComposerAgentContextPill onSelectAgent=\{onSelectAgent\} \/>/u);
	assert.match(contextPillsSource, /<ActivityComposerSkillContextPill onSelectSkill=\{onSelectSkill\} \/>/u);
	assert.match(contextPillsSource, /delayChildren: 0\.25/u);
	assert.match(contextPillsSource, /staggerChildren: 0\.05/u);
	assert.match(contextPillsSource, /initial=\{shouldReduceMotion \? false : "hidden"\}/u);
	assert.match(agentContextPillSource, /import \{ AgentSelector \} from "@\/components\/blocks\/agent-selector";/u);
	assert.match(agentContextPillSource, /<DropdownMenuTrigger[\s\S]*<ContextBarPill[\s\S]*Assign agents/u);
	assert.match(agentContextPillSource, /<AgentSelector[\s\S]*agents=\{ROVO_AGENT_SELECTOR_AGENTS\}[\s\S]*selectionMode="single"/u);
	assert.match(agentContextPillSource, /onSelectAgent\(agent\.name\);[\s\S]*setIsOpen\(false\);/u);
	assert.match(skillContextPillSource, /import \{ SkillSelector \} from "@\/components\/blocks\/skill-selector";/u);
	assert.match(skillContextPillSource, /<DropdownMenuTrigger[\s\S]*<ContextBarPill[\s\S]*Use skills/u);
	assert.match(skillContextPillSource, /<SkillSelector[\s\S]*onSkillToggle=\{handleSkillToggle\}[\s\S]*selectionMode="single"/u);
	assert.match(skillContextPillSource, /onSelectSkill\(skillId\);[\s\S]*setIsOpen\(false\);/u);
	assert.match(contextResourcesSource, /import \{ Icon \} from "@\/components\/ui\/icon";/u);
	assert.match(
		contextResourcesSource,
		/flex flex-wrap items-start gap-1 \*:focus-visible:relative \*:focus-visible:z-10/u,
	);
	assert.equal((contextResourcesSource.match(/elemBefore=\{<Icon aria-hidden render=/gu) ?? []).length, 3);
	assert.equal((contextResourcesSource.match(/labelClassName="whitespace-nowrap sm:w-28"/gu) ?? []).length, 3);
	assert.match(agentSummaryRowSource, /labelClassName\?: string;/u);
	assert.match(agentSummaryRowSource, /className=\{cn\("sm:w-20 sm:shrink-0", labelClassName\)\}/u);
	for (const source of [contextResourcesSource, detailsSource]) {
		assert.doesNotMatch(source, /PlannerSuggestion|planner\.proposal|isPlannerFieldPending/u);
	}
	assert.equal(fs.existsSync(path.join(BLOCK_DIR, "experimental/components/context-summary.tsx")), false);
	assert.equal(fs.existsSync(path.join(BLOCK_DIR, "experimental/components/planner-suggestion.tsx")), false);
	assert.equal(fs.existsSync(path.join(BLOCK_DIR, "experimental/components/activity-event-list.tsx")), false);
	assert.equal(fs.existsSync(path.join(BLOCK_DIR, "experimental/components/activity-agent-event.tsx")), false);
	assert.equal(fs.existsSync(path.join(BLOCK_DIR, "experimental/components/activity-human-event.tsx")), false);
});

test("running metronome is gated on the open surface so preset sessions stay pristine until opened (regression)", () => {
	const controllerSource = readBlockFile("experimental/use-agent-sessions-controller.ts");
	const contextSource = readBlockFile("experimental/context-agent-sessions.tsx");
	const compositionSource = readBlockFile("experimental/experimental-agent-sessions.tsx");

	// Controller: the metronome only ticks while the surface is active AND a session
	// is running, and `active` is a dependency so it re-subscribes on open/close. This
	// prevents the inline docs "running" launcher from ticking down to waiting/completed
	// while its dialog is still closed.
	assert.match(controllerSource, /active = true,?/u);
	assert.match(controllerSource, /if \(!active \|\| !isRunning\) return undefined;/u);
	assert.match(controllerSource, /\[active, isRunning, shouldReduceMotion\]/u);

	// Provider forwards the gate to the controller.
	assert.match(contextSource, /active\?: boolean;/u);
	assert.match(contextSource, /useAgentSessionsController\(initialPreset, workItem, active\)/u);
	assert.match(controllerSource, /hasRunningSession\(state\) \|\| isPlannerProcessing\(state\.planner\)/u);

	// Composition drives the gate from the dialog open state.
	assert.match(compositionSource, /<AgentSessionsProvider[\s\S]*active=\{open\}[\s\S]*>/u);
});

// ── Source shape: preset chooser page ────────────────────────────────────────

test("page.tsx is the 2-button hero chooser (standard + experimental=filled) that remounts the block", () => {
	const pageSource = readBlockFile("page.tsx");
	assert.match(pageSource, /const \[activeVariant, setActiveVariant\] = useState<AgentSessionsVariant \| null>\(null\);/u);
	assert.match(pageSource, /Open standard session/u);
	assert.match(pageSource, /Open experimental session/u);
	assert.match(pageSource, /onClick=\{\(\) => setActiveVariant\("default"\)\}/u);
	assert.match(pageSource, /onClick=\{\(\) => setActiveVariant\("experimental"\)\}/u);
	// Remounts deterministically via key; experimental uses the filled preset.
	assert.match(pageSource, /<AgentSessions[\s\S]*key=\{activeVariant\}[\s\S]*variant=\{activeVariant\}[\s\S]*initialExperimentalPreset="filled"[\s\S]*\/>/u);
	assert.match(pageSource, /export function AgentSessionsExperimentalPage/u);
});

// ── Registry / details / demo parity (must stay consistent for test:catalog) ──

test("AgentSessions keeps the standard + experimental registry, detail, demo, and preview wiring", () => {
	const detailsSource = readDetailCategorySource("blocks");
	const registrySource = readWebsiteRegistrySource();
	const blockVariantRegistrySource = registrySource.slice(registrySource.indexOf("export const BLOCK_VARIANT_DEMOS"));
	const demoSource = readProjectFile("components/website/demos/blocks/agent-sessions-demo.tsx");
	const previewLayoutSource = readProjectFile("app/preview/blocks/[slug]/layout.tsx");

	assert.match(detailsSource, /title: "Standard"[\s\S]*demoSlug: "agent-sessions-demo-standard"/u);
	assert.match(detailsSource, /title: "Experimental · Filled context"[\s\S]*demoSlug: "agent-sessions-demo-experimental"/u);
	assert.match(detailsSource, /title: "Experimental · Empty context"[\s\S]*demoSlug: "agent-sessions-demo-experimental-empty"/u);
	assert.match(detailsSource, /title: "Experimental · Multiple agents running"[\s\S]*demoSlug: "agent-sessions-demo-experimental-running"/u);
	assert.match(detailsSource, /name: "initialIssueOpen"[\s\S]*Opens the Jira work item modal on initial render/u);
	assert.match(detailsSource, /name: "onIssueClose"[\s\S]*Called after the Jira work item modal closes/u);
	assert.match(detailsSource, /name: "variant"[\s\S]*type: "\\"default\\" \| \\"experimental\\"/u);
	assert.match(detailsSource, /name: "initialExperimentalPreset"[\s\S]*empty[\s\S]*filled[\s\S]*running/u);
	assert.match(registrySource, /"agent-sessions-demo-standard": dynamic[\s\S]*default: mod\.AgentSessionsDemoStandard/u);
	assert.match(registrySource, /"agent-sessions-demo-experimental": dynamic[\s\S]*default: mod\.AgentSessionsDemoExperimental/u);
	assert.match(blockVariantRegistrySource, /"agent-sessions-demo-standard": dynamic[\s\S]*default: mod\.AgentSessionsDemoStandard/u);
	assert.match(blockVariantRegistrySource, /"agent-sessions-demo-experimental": dynamic[\s\S]*default: mod\.AgentSessionsDemoExperimental/u);
	assert.match(blockVariantRegistrySource, /"agent-sessions-demo-experimental-empty": dynamic[\s\S]*default: mod\.AgentSessionsDemoExperimentalEmpty/u);
	assert.match(blockVariantRegistrySource, /"agent-sessions-demo-experimental-running": dynamic[\s\S]*default: mod\.AgentSessionsDemoExperimentalRunning/u);
	assert.match(demoSource, /export function AgentSessionsDemoStandard/u);
	assert.match(demoSource, /export function AgentSessionsDemoExperimental/u);
	assert.match(demoSource, /export function AgentSessionsDemoExperimentalEmpty/u);
	assert.match(demoSource, /export function AgentSessionsDemoExperimentalRunning/u);
	assert.match(demoSource, /<AgentSessions variant="default" \/>/u);
	// The hero demo is the 2-button chooser page; the experimental example is the filled variant.
	assert.match(demoSource, /import AgentSessionsPage from "@\/components\/blocks\/agent-sessions\/page";/u);
	assert.match(demoSource, /return <AgentSessionsPage \/>;/u);
	assert.match(demoSource, /<AgentSessions variant="experimental" initialExperimentalPreset="filled" \/>/u);
	assert.match(demoSource, /<AgentSessions variant="experimental" initialExperimentalPreset="empty" \/>/u);
	assert.match(demoSource, /<AgentSessions variant="experimental" initialExperimentalPreset="running" \/>/u);
	assert.match(previewLayoutSource, /"agent-sessions-demo-standard"/u);
	assert.match(previewLayoutSource, /"agent-sessions-demo-experimental"/u);
});

// ── Behavioral coverage: the pure session-state model ────────────────────────

test("preset initialization: empty/filled/running set up the two dimensions", async () => {
	const model = await loadSessionModel();
	const empty = model.hydratePreset("empty", TEST_WORK_ITEM);
	assert.equal(model.selectContextStatus(empty), "empty");
	assert.equal(empty.sessions.length, 0);
	assert.equal(empty.planner.status, "searching");
	assert.equal(empty.metadata.status, "RFP Intake");
	assert.equal(empty.metadata.priority, null);

	const filled = model.hydratePreset("filled", TEST_WORK_ITEM);
	assert.equal(model.selectContextStatus(filled), "filled");
	assert.equal(model.selectWorkingCount(filled), 0);
	assert.ok(filled.sessions.some((session) => session.status === "completed"));
	assert.equal(filled.planner.status, "inactive");

	const running = model.hydratePreset("running", TEST_WORK_ITEM);
	assert.equal(model.selectContextStatus(running), "filled");
	assert.equal(model.selectWorkingCount(running), 3); // 2 running + 1 waiting
	assert.ok(running.sessions.some((session) => session.status === "waiting"));
	assert.equal(running.planner.status, "inactive");
});

test("filled preset scaffolds the activity feed with static event + changed-files rows", async () => {
	const model = await loadSessionModel();

	const empty = model.hydratePreset("empty", TEST_WORK_ITEM);
	const running = model.hydratePreset("running", TEST_WORK_ITEM);
	// Only the filled preset carries the seeded scaffolding.
	assert.equal(empty.staticEvents.length, 0);
	assert.equal(running.staticEvents.length, 0);

	const filled = model.hydratePreset("filled", TEST_WORK_ITEM);
	assert.ok(filled.staticEvents.length >= 6);
	assert.ok(filled.staticEvents.some((event) => event.kind === "event"));
	assert.ok(filled.staticEvents.some((event) => event.kind === "changed-files"));

	// The selector merges static events with human comments + agent sessions and
	// keeps the whole stream chronological.
	const events = model.selectActivityEvents(filled);
	assert.ok(events.some((event) => event.kind === "event"));
	assert.ok(events.some((event) => event.kind === "changed-files"));
	assert.ok(events.some((event) => event.kind === "human"));
	assert.ok(events.some((event) => event.kind === "agent"));
	const timestamps = events.map((event) => event.createdAtMs);
	assert.deepEqual(timestamps, [...timestamps].sort((a, b) => a - b));
	// The "created" scaffold event leads the chronological feed.
	assert.equal(events[0].kind, "event");
});

test("empty preset planner searches in phases and prefills the normal form when ready", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	assert.equal(state.planner.phaseIndex, 0);
	assert.equal(state.contextResources.description, "");
	assert.equal(state.planner.proposal.metadata.atlassianProject, "esm-rfp-response");

	state = model.agentSessionsReducer(state, { type: "tick", deltaMs: 1200 });
	assert.equal(state.planner.phaseIndex, 1);
	state = model.agentSessionsReducer(state, { type: "tick", deltaMs: 1200 });
	assert.equal(state.planner.phaseIndex, 2);
	state = model.agentSessionsReducer(state, { type: "tick", deltaMs: 1200 });
	assert.equal(state.planner.status, "ready");
	assert.equal(model.countPendingPlannerFields(state.planner), 12);
	assert.match(state.contextResources.description, /Acmecorp is evaluating Atlassian/u);
	assert.equal(state.metadata.assignee.name, "Maya Chen");
	assert.equal(state.metadata.atlassianProject, "esm-rfp-response");
});

test("Confirm all preserves prefilled values and Reject all clears them", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	state = model.agentSessionsReducer(state, { type: "settle-running" });
	assert.match(state.contextResources.description, /Acmecorp is evaluating Atlassian/u);
	assert.equal(state.metadata.reporter.name, "Jordan Lee");
	state = model.agentSessionsReducer(state, { type: "apply-planner-proposal" });
	assert.equal(state.planner.status, "applied");
	assert.equal(state.planner.appliedCount, 12);
	assert.equal(state.metadata.reporter.name, "Jordan Lee");
	assert.equal(state.metadata.priority, "High");
	assert.equal(state.metadata.atlassianProject, "esm-rfp-response");
	assert.equal(model.selectContextStatus(state), "filled");

	let rejected = model.hydratePreset("empty", TEST_WORK_ITEM);
	rejected = model.agentSessionsReducer(rejected, { type: "settle-running" });
	rejected = model.agentSessionsReducer(rejected, { type: "reject-planner-proposal" });
	assert.equal(rejected.planner.status, "inactive");
	assert.equal(rejected.contextResources.description, "");
	assert.equal(rejected.metadata.priority, null);
	assert.equal(model.selectContextStatus(rejected), "empty");
});

test("planner refinement stages deterministic deltas and reset restarts search", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	state = model.agentSessionsReducer(state, { type: "settle-running" });
	state = model.agentSessionsReducer(state, { type: "apply-planner-proposal" });
	state = model.agentSessionsReducer(state, {
		type: "refine-planner-proposal",
		prompt: "Prioritize security compliance, add assets-cmdb, and assign Maya Chen",
	});
	assert.equal(state.planner.status, "refining");
	assert.equal(state.planner.proposal.metadata.priority, "Highest");
	assert.ok(state.planner.proposal.metadata.labels.includes("security-review"));
	assert.ok(state.planner.proposal.metadata.labels.includes("assets-cmdb"));
	assert.equal(state.planner.decisions.priority, "pending");
	assert.equal(state.planner.decisions.labels, "pending");
	state = model.agentSessionsReducer(state, { type: "tick", deltaMs: 1200 });
	assert.equal(state.planner.status, "ready");
	assert.equal(state.metadata.priority, "Highest");
	assert.ok(state.metadata.labels.includes("security-review"));
	state = model.agentSessionsReducer(state, { type: "apply-planner-proposal" });
	assert.equal(state.metadata.priority, "Highest");
	assert.ok(state.metadata.labels.includes("security-review"));
	assert.ok(state.metadata.labels.includes("assets-cmdb"));

	let unapplied = model.hydratePreset("empty", TEST_WORK_ITEM);
	unapplied = model.agentSessionsReducer(unapplied, { type: "settle-running" });
	unapplied = model.agentSessionsReducer(unapplied, {
		type: "refine-planner-proposal",
		prompt: "Assign Maya Chen",
	});
	assert.equal(model.countPendingPlannerFields(unapplied.planner), 12);
	unapplied = model.agentSessionsReducer(unapplied, { type: "settle-running" });
	unapplied = model.agentSessionsReducer(unapplied, { type: "apply-planner-proposal" });
	assert.match(unapplied.contextResources.description, /Acmecorp is evaluating Atlassian/u);

	state = model.agentSessionsReducer(state, { type: "refine-planner-proposal", prompt: "Assign Maya Chen" });
	assert.equal(model.countPendingPlannerFields(state.planner), 0);
	state = model.agentSessionsReducer(state, { type: "settle-running" });
	assert.equal(state.planner.status, "applied");

	state = model.agentSessionsReducer(state, { type: "reset", workItem: TEST_WORK_ITEM });
	assert.equal(state.planner.status, "searching");
	assert.equal(state.contextResources.description, "");
	assert.equal(state.metadata.priority, null);
});

test("planner refinement preserves manual edits made after prefill", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	state = model.agentSessionsReducer(state, { type: "settle-running" });
	state = model.agentSessionsReducer(state, {
		type: "edit-context-text",
		field: "description",
		value: "Manually revised response scope",
	});
	state = model.agentSessionsReducer(state, {
		type: "edit-metadata",
		patch: { assignee: { name: "Manual Owner" } },
	});

	state = model.agentSessionsReducer(state, {
		type: "refine-planner-proposal",
		prompt: "Prioritize security compliance",
	});
	assert.equal(state.planner.proposal.context.description, "Manually revised response scope");
	assert.equal(state.planner.proposal.metadata.assignee.name, "Manual Owner");

	state = model.agentSessionsReducer(state, { type: "tick", deltaMs: 1200 });
	assert.equal(state.contextResources.description, "Manually revised response scope");
	assert.equal(state.metadata.assignee.name, "Manual Owner");
	assert.equal(state.metadata.priority, "Highest");
});

test("context derivation flips empty <-> filled as resources change", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	assert.equal(model.selectContextStatus(state), "empty");
	state = model.agentSessionsReducer(state, {
		type: "add-context-resource",
		kind: "link",
		item: { id: "l1", key: "RFP-200", summary: "Related", type: "Task", relationship: "relates to" },
	});
	assert.equal(model.selectContextStatus(state), "filled");
	state = model.agentSessionsReducer(state, { type: "remove-context-resource", kind: "link", id: "l1" });
	assert.equal(model.selectContextStatus(state), "empty");
});

test("concurrent launch adds independent running sessions", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	state = model.agentSessionsReducer(state, { type: "launch-session", agentId: "a1", agentName: "Agent One" });
	state = model.agentSessionsReducer(state, { type: "launch-session", agentId: "a2", agentName: "Agent Two" });
	assert.equal(state.sessions.length, 2);
	assert.equal(model.selectWorkingCount(state), 2);
	assert.notEqual(state.sessions[0].id, state.sessions[1].id);
});

test("deterministic running -> waiting -> running -> completed lifecycle + resume", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty", TEST_WORK_ITEM);
	state = model.agentSessionsReducer(state, { type: "launch-session", agentId: "a1", agentName: "Agent One" });
	const sessionId = state.sessions[0].id;

	state = tickUntil(model, state, (s) => s.sessions[0].status === "waiting");
	assert.equal(state.sessions[0].status, "waiting");

	// A reply resumes the waiting agent (from chat or Activity — same path).
	state = model.agentSessionsReducer(state, { type: "reply-session", sessionId, text: "Flag them as gaps." });
	assert.equal(state.sessions[0].status, "running");
	assert.ok(state.sessions[0].messages.some((m) => m.role === "human" && m.content === "Flag them as gaps."));

	state = tickUntil(model, state, (s) => s.sessions[0].status === "completed");
	assert.equal(state.sessions[0].status, "completed");
	assert.equal(state.sessions[0].progress, 1);
});

test("Activity @-reply and chat reply share one session state", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("running", TEST_WORK_ITEM);
	const waiting = state.sessions.find((s) => s.status === "waiting");
	state = model.agentSessionsReducer(state, { type: "reply-session", sessionId: waiting.id, text: "5,000 seats" });
	const resumed = state.sessions.find((s) => s.id === waiting.id);
	assert.equal(resumed.status, "running");
	assert.equal(state.activeSessionId, waiting.id);
});

test("session switching sets and clears the active session", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("running", TEST_WORK_ITEM);
	assert.equal(model.selectActiveSession(state), null);
	const target = state.sessions[1];
	state = model.agentSessionsReducer(state, { type: "set-active-session", sessionId: target.id });
	assert.equal(model.selectActiveSession(state).id, target.id);
	state = model.agentSessionsReducer(state, { type: "set-active-session", sessionId: null });
	assert.equal(model.selectActiveSession(state), null);
});

test("empty work item launcher opens a general session; filled launcher reopens the latest", async () => {
	const model = await loadSessionModel();
	let empty = model.hydratePreset("empty", TEST_WORK_ITEM);
	empty = model.agentSessionsReducer(empty, { type: "open-latest-or-general" });
	assert.equal(empty.sessions.length, 1);
	assert.equal(empty.activeSessionId, empty.sessions[0].id);

	let running = model.hydratePreset("running", TEST_WORK_ITEM);
	running = model.agentSessionsReducer(running, { type: "open-latest-or-general" });
	assert.ok(running.activeSessionId);
	assert.equal(running.sessions.length, model.hydratePreset("running", TEST_WORK_ITEM).sessions.length); // reopened, not created
});

test("details metadata draft preserves editable work item fields without aliasing labels", async () => {
	const { seedMetadataDraft } = await loadDetailsTabModule();
	const assignee = { id: "maya", name: "Maya Chen", avatarUrl: "/avatar-user/maya.png" };
	const reporter = { id: "david", name: "David Hsieh", avatarUrl: "/avatar-user/david.png" };
	const labels = ["security", "rfp"];

	const draft = seedMetadataDraft({
		assignee,
		dueDate: "not-a-date",
		labels,
		parent: { code: "RFP-42" },
		priority: "High",
		reporter,
		startDate: "2026-07-14",
		status: "Review",
	});

	assert.equal(draft.status, "Review");
	assert.equal(draft.priority, "High");
	assert.equal(draft.assignee, assignee);
	assert.equal(draft.reporter, reporter);
	assert.equal(draft.startDate.toISOString(), "2026-07-14T00:00:00.000Z");
	assert.equal(draft.dueDate, undefined);
	assert.equal(draft.parent, "RFP-42");
	assert.deepEqual(draft.labels, labels);
	assert.notEqual(draft.labels, labels);
	assert.equal(draft.atlassianProject, null);
});

test("details metadata draft and status variants use board lifecycle defaults", async () => {
	const [{ seedMetadataDraft }, { STATUS_PHASES, statusVariant }] = await Promise.all([
		loadDetailsTabModule(),
		loadDetailFieldEditorsModule(),
	]);

	const draft = seedMetadataDraft({});

	assert.equal(draft.status, STATUS_PHASES[0]);
	assert.equal(draft.priority, "Medium");
	assert.deepEqual(draft.labels, []);
	assert.equal(statusVariant(STATUS_PHASES[0]), "neutral");
	assert.equal(statusVariant(STATUS_PHASES[1]), "information");
	assert.equal(statusVariant(STATUS_PHASES.at(-1)), "success");
	assert.equal(statusVariant("Unmapped external status"), "neutral");
});
