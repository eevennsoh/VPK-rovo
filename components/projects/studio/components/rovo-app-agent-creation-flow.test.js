const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SHELL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-shell.tsx"),
	"utf8",
);
const MESSAGES_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-messages.tsx"),
	"utf8",
);
const SHELL_LAYOUT_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "lib", "rovo-app-shell-layout.ts"),
	"utf8",
);
const AGENT_CONFIG_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-agent-config-panel.tsx"),
	"utf8",
);
const AGENT_INSIGHTS_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "..", "blocks", "agent-insights", "components", "agent-insights.tsx"),
	"utf8",
);
const AGENT_TEST_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-agent-test-panel.tsx"),
	"utf8",
);
const CUSTOM_AGENTS_TABLE_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-custom-agents-table.tsx"),
	"utf8",
);
const CHAT_PANEL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/sidebar-chat/page.tsx"),
	"utf8",
);
const CHAT_GREETING_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/sidebar-chat/components/chat-greeting.tsx"),
	"utf8",
);
const ROVO_CONTEXT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app/contexts/context-rovo-chat.tsx"),
	"utf8",
);
const ROVO_SUGGESTIONS_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "lib/rovo-suggestions.ts"),
	"utf8",
);
const AGENT_BLOCK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/agent/components/agent.tsx"),
	"utf8",
);
const NAV_HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/top-navigation/hooks/use-top-navigation.ts"),
	"utf8",
);
const COMPOSER_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/shared/components/composer-floating-body.tsx"),
	"utf8",
);
const COMPOSER_REVEAL_HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/shared/hooks/use-rovo-app-composer-reveal.ts"),
	"utf8",
);
const SUBAGENTS_HOOK_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "hooks", "use-agent-config-subagents.ts"),
	"utf8",
);
const SUBAGENT_PROMPTS_LIB_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/subagents/lib/subagent-prompts.ts"),
	"utf8",
);
const ROVO_UI_MESSAGES_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "lib/rovo-ui-messages.ts"),
	"utf8",
);

test("RovoAppShell starts Studio agent creation only from the default-agent home composer", () => {
	assert.match(SHELL_SOURCE, /const DEFAULT_COMPOSER_PLACEHOLDER = "Describe the agent you want to build";/u);
	// The creation-context builders moved to a testable lib (their prompt copy is
	// asserted in studio-agent-creation-context.test.js). The shell imports them
	// and calls the initial builder with the brief plus any template provenance.
	assert.match(SHELL_SOURCE, /buildStudioAgentCreationContext,/u);
	assert.match(SHELL_SOURCE, /from "@\/components\/projects\/studio\/lib\/studio-agent-creation-context";/u);
	assert.match(SHELL_SOURCE, /buildStudioAgentCreationContext\(text, creationTemplate\)/u);
	assert.match(SHELL_SOURCE, /const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected && !shouldShowAgentConfigPane;/u);
	assert.match(SHELL_SOURCE, /const shouldStartStudioAgentCreation = isDefaultAgentHomeStateRef\.current && !isRealtimeActive;/u);
	assert.match(SHELL_SOURCE, /\.\.\.\(shouldStartStudioAgentCreation \? \{ creationMode: "agent" as const \} : \{\}\)/u);
	assert.ok((SHELL_SOURCE.match(/creationMode: "agent"/gu) ?? []).length >= 1);
});

test("RovoAppShell does not render the Hermes turn-state card", () => {
	assert.doesNotMatch(SHELL_SOURCE, /Hermes turn state/u);
	assert.doesNotMatch(SHELL_SOURCE, /Server-resolved skills and Hermes draft-review state/u);
	assert.doesNotMatch(SHELL_SOURCE, /Auto-loaded on the last turn/u);
});

test("Studio landing empty state is title-only by default", () => {
	assert.match(MESSAGES_SOURCE, /default: \{[\s\S]*heading: "Move work forward with agents"[\s\S]*id: "default"[\s\S]*\}/u);
	const defaultEmptyStateSource = MESSAGES_SOURCE.slice(
		MESSAGES_SOURCE.indexOf("default: {"),
		MESSAGES_SOURCE.indexOf("max: {"),
	);
	assert.doesNotMatch(defaultEmptyStateSource, /illustrationClassName|rovoIllustrationId|rovoIllustrationSize|lightIllustrationSrc/u);
	assert.match(MESSAGES_SOURCE, /function hasRovoAppEmptyStateIllustration\(emptyState: RovoAppEmptyState\): emptyState is RovoAppIllustratedEmptyState \{[\s\S]*return "illustrationClassName" in emptyState;/u);
	assert.match(MESSAGES_SOURCE, /const hasEmptyStateIllustration = hasRovoAppEmptyStateIllustration\(emptyState\);/u);
	assert.match(MESSAGES_SOURCE, /\{hasEmptyStateIllustration \? \([\s\S]*<motion\.div className=\{cn\(emptyState\.illustrationClassName, "relative"\)/u);
});

test("Studio default landing prompt growth pushes below the initial home position", () => {
	assert.match(SHELL_SOURCE, /const defaultHomeTopSpacerRef = useRef<HTMLDivElement \| null>\(null\);/u);
	assert.match(SHELL_SOURCE, /const \[defaultHomeTopSpacerMeasurement, setDefaultHomeTopSpacerMeasurement\] = useState<\{ key: string; height: number \} \| null>\(null\);/u);
	assert.match(SHELL_SOURCE, /const defaultHomeTopSpacerMeasurementKey = isDefaultAgentHomeState && landingMotionReady \? `\$\{shellSize\.width\}:\$\{shellSize\.height\}` : null;/u);
	assert.match(SHELL_SOURCE, /const defaultHomeTopSpacerHeight = defaultHomeTopSpacerMeasurement\?\.key === defaultHomeTopSpacerMeasurementKey/u);
	assert.match(SHELL_SOURCE, /useLayoutEffect\(\(\) => \{[\s\S]*!landingMotionReady \|\| !defaultHomeTopSpacerMeasurementKey[\s\S]*spacerElement\.getBoundingClientRect\(\)\.height[\s\S]*setDefaultHomeTopSpacerMeasurement\(\{[\s\S]*key: defaultHomeTopSpacerMeasurementKey,[\s\S]*height: spacerHeight,[\s\S]*\}\);[\s\S]*\}, \[defaultHomeTopSpacerHeight, defaultHomeTopSpacerMeasurementKey, isDefaultAgentHomeState, landingMotionReady/u);
	assert.match(SHELL_SOURCE, /ref=\{isDefaultAgentHomeState \? defaultHomeTopSpacerRef : undefined\}/u);
	assert.match(SHELL_SOURCE, /isDefaultAgentHomeState && defaultHomeTopSpacerHeight !== null \? "shrink-0" : "flex-1 shrink"/u);
	assert.match(SHELL_SOURCE, /style=\{isDefaultAgentHomeState && defaultHomeTopSpacerHeight !== null \? \{ flexBasis: defaultHomeTopSpacerHeight \} : undefined\}/u);
});

test("Studio default landing shows the agents card section below the composer", () => {
	assert.match(SHELL_SOURCE, /import \{ StudioAgentsSection \} from "@\/components\/projects\/studio\/components\/rovo-app-custom-agents-table";/u);
	assert.match(SHELL_SOURCE, /const shouldShowStudioAgentsSection = isDefaultAgentHomeState && shouldShowDefaultLandingContent;/u);
	assert.doesNotMatch(SHELL_SOURCE, /shouldShowStudioCustomAgentsTable|isDefaultAgentHomeState && studioAgentRegistry\.sessionAgentEntries\.length > 0/u);
	assert.match(SHELL_SOURCE, /const handleDeleteStudioAgent = useCallback\([\s\S]*studioAgentRegistry\.removeSessionAgent\(agentId\);[\s\S]*\},[\s\S]*\[activeAgentConfig\?\.profileId, setActiveAgentConfigState, studioAgentRegistry\]/u);
	assert.match(SHELL_SOURCE, /<motion\.div[\s\S]*animate=\{studioLandingMotionVisible\}[\s\S]*<StudioAgentsSection[\s\S]*directoryAgents=\{ROVO_DIRECTORY_AGENT_PROFILES\}[\s\S]*entries=\{studioAgentRegistry\.sessionAgentEntries\}/u);
	assert.match(SHELL_SOURCE, /<StudioAgentsSection[\s\S]*onBrowseTemplates=\{\(\) => handleBrowseAgentTemplates\(\)\}/u);
	assert.match(SHELL_SOURCE, /<StudioAgentsSection[\s\S]*onCreateAgent=\{handleFocusStudioComposer\}/u);
	assert.match(SHELL_SOURCE, /<StudioAgentsSection[\s\S]*onEditAgent=\{handleStudioSidebarAgentSelect\}/u);
	assert.match(SHELL_SOURCE, /<StudioAgentsSection[\s\S]*onSelectDirectoryAgent=\{handleSidebarBrowseAgentSelect\}/u);
	assert.match(SHELL_SOURCE, /<RovoAppSidebar[\s\S]*onDeleteAgent=\{handleDeleteStudioAgent\}/u);
	assert.match(SHELL_SOURCE, /const \[composerFocusRequestKey, setComposerFocusRequestKey\] = useState\(0\);/u);
	assert.match(SHELL_SOURCE, /const handleFocusStudioComposer = useCallback\(\(\) => \{[\s\S]*setComposerFocusRequestKey\(\(currentKey\) => currentKey \+ 1\);[\s\S]*\}, \[\]\);/u);
	assert.match(SHELL_SOURCE, /<RovoAppComposer[\s\S]*focusRequestKey=\{composerFocusRequestKey\}/u);
	assert.match(SHELL_SOURCE, /<RovoAppComposer[\s\S]*fillWidth=\{!showHomeState && !\(isArtifactOpen \|\| shouldShowAgentConfigPane\)\}/u);
	assert.match(SHELL_SOURCE, /<AgentTemplatesDialog[\s\S]*open=\{agentTemplatesDialogOpen\}[\s\S]*onSelectAgent=\{handleTemplateAgentSelect\}/u);

	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /DropdownMenu/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /aria-label=\{`More actions for \$\{agentName\}`\}/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /export function StudioAgentsSection/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /className="mx-auto mt-12 flex w-\[90%\] max-w-\[800px\] flex-col gap-6"/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /ButtonGroup aria-label="Agent views"/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /id: "my-agents", label: "My agents"/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /id: "by-teams", label: "By teams"/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /id: "by-companies", label: "By companies"/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /grid grid-cols-1 gap-3 sm:grid-cols-2/u);
	// My agents renders through the shared List primitive; directory tabs (teams/companies) keep the card grid.
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /import \{ List, type ListColumn \} from "@\/components\/ui-custom\/list";/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /<List\.Root aria-label="My agents">/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /<List\.Table columns=\{STUDIO_MY_AGENTS_LIST_COLUMNS\}>/u);
	assert.doesNotMatch(CUSTOM_AGENTS_TABLE_SOURCE, /from "@\/components\/ui\/table"|<Table|TableCell|TableRow|TableBody/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /import \{ Button \} from "@\/components\/ui\/button";/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /import \{ ButtonGroup \} from "@\/components\/ui\/button-group";/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /import \{ Icon \} from "@\/components\/ui\/icon";/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /import \{ Lozenge \} from "@\/components\/ui\/lozenge";/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /import \{ Avatar, AvatarFallback, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /EntityCardAgentCard/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /STUDIO_AGENTS_COMPANY_GROUP_TITLE = "By companies"/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /function isTeamDirectoryAgent/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /No agents yet/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /Browse templates/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /<Button onClick=\{onCreateAgent\} type="button">\s*Create\s*<\/Button>/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /entry\.publishStatus === "published" \? "V1" : "Draft"/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /formatRelativeModifiedTime\(entry\.lastTouchedAt\)/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /STUDIO_PINNED_AGENTS_STORAGE_KEY/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /onClick=\{\(\) => onEditAgent\(entry\.profile\.id\)\}/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /aria-label=\{`Edit \$\{agentName\}`\}/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /aria-label=\{`\$\{isPinned \? "Unpin" : "Pin"\} \$\{agentName\}`\}/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /onClick=\{\(\) => onTogglePinned\(entry\.profile\.id\)\}/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /aria-pressed=\{isPinned\}[\s\S]*render=\{isPinned \? <PinFilledIcon label="" size="small" \/> : <PinIcon label="" size="small" \/>\}/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /<div className="flex justify-end gap-\[4px\]">/u);
	assert.doesNotMatch(CUSTOM_AGENTS_TABLE_SOURCE, /stopNestedCardAction|onClick=\{stopNestedCardAction\}|onKeyDown=\{stopNestedCardAction\}/u);
	assert.match(CUSTOM_AGENTS_TABLE_SOURCE, /aria-pressed:border-transparent! aria-pressed:bg-transparent! aria-pressed:text-text-subtle! aria-pressed:\[&_svg\]:text-icon-subtle!/u);
	assert.doesNotMatch(CUSTOM_AGENTS_TABLE_SOURCE, /text-icon-selected/u);
	assert.doesNotMatch(CUSTOM_AGENTS_TABLE_SOURCE, /isFirstRow|isLastRow|rounded-tl-\[12px\]|rounded-br-\[12px\]/u);
	assert.match(COMPOSER_SOURCE, /focusRequestKey: number \| undefined;/u);
	assert.match(COMPOSER_SOURCE, /if \(typeof focusRequestKey !== "number" \|\| focusRequestKey <= 0\)/u);
	assert.match(COMPOSER_SOURCE, /textareaRef\.current\?\.focus\(\);/u);
});

test("Studio landing motion gates first paint and removes bento instantly after prompt submit", () => {
	assert.match(SHELL_SOURCE, /import \{ animate, AnimatePresence, motion, useMotionValue, useReducedMotion, type AnimationPlaybackControls \} from "motion\/react";/u);
	assert.match(SHELL_SOURCE, /const STUDIO_LANDING_ENTER_TRANSITION = \{[\s\S]*visualDuration: 0\.32,[\s\S]*bounce: 0,[\s\S]*\} as const;/u);
	assert.match(SHELL_SOURCE, /const STUDIO_HOME_BENTO_INSTANT_EXIT = \{[\s\S]*height: 0,[\s\S]*marginBottom: 0,[\s\S]*opacity: 0,[\s\S]*transition: \{ duration: 0 \},[\s\S]*\} as const;/u);
	assert.match(SHELL_SOURCE, /const STUDIO_HOME_BENTO_VARIANTS = \{[\s\S]*exit: \(\{ instant, reduceMotion \}: StudioHomeBentoExitContext\) =>[\s\S]*instant \|\| reduceMotion \? STUDIO_HOME_BENTO_INSTANT_EXIT : STUDIO_HOME_BENTO_COLLAPSE_EXIT/u);
	assert.match(SHELL_SOURCE, /const \[landingMotionReady, setLandingMotionReady\] = useState\(false\);/u);
	assert.match(SHELL_SOURCE, /const shouldGateDefaultLandingContent = isDefaultAgentHomeState && !landingMotionReady;/u);
	assert.match(SHELL_SOURCE, /const shouldShowDefaultLandingContent = !shouldGateDefaultLandingContent;/u);
	assert.match(SHELL_SOURCE, /showEmptyState=\{showHomeState && shouldShowDefaultLandingContent\}/u);
	assert.match(SHELL_SOURCE, /if \(landingMotionReady \|\| shellSize\.width <= 0 \|\| shellSize\.height <= 0\) \{[\s\S]*requestAnimationFrame\(\(\) => setLandingMotionReady\(true\)\)/u);
	assert.match(SHELL_SOURCE, /const \[isDefaultHomeSubmitTransition, setIsDefaultHomeSubmitTransition\] = useState\(false\);/u);
	assert.match(SHELL_SOURCE, /if \(isDefaultAgentHomeStateRef\.current\) \{[\s\S]*setIsDefaultHomeSubmitTransition\(true\);[\s\S]*\}[\s\S]*setOptimisticUserMessage/u);
	assert.match(SHELL_SOURCE, /const homeStarterBentoPresence = \{[\s\S]*instant: isDefaultHomeSubmitTransition,[\s\S]*reduceMotion: shouldReduceStudioLandingMotion,[\s\S]*\};/u);
	assert.match(SHELL_SOURCE, /<AnimatePresence custom=\{homeStarterBentoPresence\} initial=\{false\}>[\s\S]*<motion\.div[\s\S]*custom=\{homeStarterBentoPresence\}[\s\S]*exit="exit"[\s\S]*variants=\{STUDIO_HOME_BENTO_VARIANTS\}/u);
});

test("Studio start-from-scratch scribble replays on each composer hover reveal", () => {
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /const \[scratchScribbleReplayKey, setScratchScribbleReplayKey\] = useState\(0\);/u);
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /const \[templateSweepReplayKey, setTemplateSweepReplayKey\] = useState\(0\);/u);
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /setTemplateSweepReplayKey\(\(currentKey\) => currentKey \+ 1\);[\s\S]*scratchScribbleDelayTimeoutRef\.current = setTimeout/u);
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /setIsScratchScribblePlaying\(true\);[\s\S]*setScratchScribbleReplayKey\(\(currentKey\) => currentKey \+ 1\);/u);
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /SCRATCH_SCRIBBLE_DELAY_MS = 480/u);
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /const showScratchScribble = isRevealVisible && isScratchScribblePlaying;/u);
	assert.match(COMPOSER_SOURCE, /SVG_TRACE_SCRATCH_UNDERLINE_PRESET/u);
	assert.match(COMPOSER_SOURCE, /shape=\{SVG_TRACE_SCRATCH_UNDERLINE_PRESET\}[\s\S]*config=\{SCRATCH_SCRIBBLE_CONFIG\}[\s\S]*resetKey=\{scratchScribbleReplayKey\}/u);
	assert.match(COMPOSER_SOURCE, /resetKey=\{scratchScribbleReplayKey\}/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /scribbleConsumed/u);
});

test("Studio template browse reveal uses a single-path svg tracing sweep", () => {
	assert.match(COMPOSER_SOURCE, /SVG_TRACE_TEMPLATES_LOOP_PRESET/u);
	assert.match(COMPOSER_SOURCE, /shape=\{SVG_TRACE_TEMPLATES_LOOP_PRESET\}[\s\S]*config=\{TEMPLATES_SWEEP_CONFIG\}[\s\S]*resetKey=\{templateSweepReplayKey\}/u);
	assert.match(COMPOSER_SOURCE, /className="pointer-events-none absolute top-full left-1\/2 w-11 -translate-x-1\/2 pt-px"/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /fill="#101214"/u);
});

test("Studio composer clears shell-owned prefill sources when a prompt is submitted", () => {
	assert.match(
		SHELL_SOURCE,
		/const clearPrefillSources = useCallback\(\(\) => \{\s*setPrefillText\(null\);\s*setVoiceTranscript\(null\);\s*prefillTextRef\.current = null;\s*\}, \[\]\);/u,
	);
	assert.match(
		SHELL_SOURCE,
		/const latestUserMessageIdBeforeSubmit = getLatestUserMessageId\(chat\.messages\);\s*clearPrefillSources\(\);\s*if \(isRealtimeActive\)/u,
	);
	assert.match(SHELL_SOURCE, /clearPrefillSources,/u);
});

test("Studio home starters frame agent building instead of generic one-off tasks", () => {
	assert.match(SHELL_SOURCE, /type HomeStarterCategory = "analyze" \| "brainstorm" \| "review" \| "summarize" \| "create";/u);
	assert.match(SHELL_SOURCE, /const HOME_STARTER_VIEWS: Readonly<Record<HomeStarterCategory, ReadonlyArray<HomeStarterTemplate>>>/u);
	const homeStarterViewsSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const HOME_STARTER_VIEWS"),
		SHELL_SOURCE.indexOf("function parseCssDurationMs"),
	);
	const starterTitles = [...homeStarterViewsSource.matchAll(/\btitle: "([^"]+)"/gu)].map((match) => match[1]);

	assert.equal(starterTitles.length, 36);
	for (const title of starterTitles) {
		assert.doesNotMatch(title, /agent/iu);
	}

	for (const title of [
		"Product Requirements Guide",
		"Release Notes Drafter",
		"Brand Voice Crafter",
		"Social Media Writer",
		"Global Translator",
		"Meeting Insights",
		"Decision Director",
		"OKR Generator",
		"Work Item Planner",
		"Progress Tracker",
		"Work Item Organizer",
		"Blocker Checker",
		"Bug Report Assistant",
		"Readiness Checker",
		"Rovo Ops",
		"Service Request Helper",
		"Service Triage",
		"Jira Theme Analyzer",
		"Transcript Insights Reporter",
		"Customer Insights",
		"User Manual Writer",
		"Rovo Expert",
	]) {
		assert.ok(starterTitles.includes(title), `${title} should be available as a Studio starter`);
	}

	assert.match(SHELL_SOURCE, /prompt: "Build a Rovo agent named Product Requirements Guide/u);
	assert.match(SHELL_SOURCE, /prompt: "Build a Rovo agent named Rovo Expert/u);
	assert.doesNotMatch(homeStarterViewsSource, /Build a Studio agent/u);
	assert.doesNotMatch(SHELL_SOURCE, /title: "Analyze a workstream"/u);
	assert.doesNotMatch(homeStarterViewsSource, /\btitle: "Build .* agent"/iu);
	assert.doesNotMatch(SHELL_SOURCE, /prompt: "Summarize this into key points/u);
});

test("Studio home bento applies card glow pointer flow to starter tiles", () => {
	assert.match(SHELL_SOURCE, /const HOME_STARTER_CARD_GLOW_EFFECT_STYLE/u);
	// The hover stroke color is the tile's own agent-avatar color, derived from
	// the avatar group in `iconSrc` (each /avatar-agent/<group>/ family shares one
	// brand color) — not an index-cycled palette that drifts out of sync.
	assert.match(SHELL_SOURCE, /const HOME_STARTER_AVATAR_GROUP_ACCENTS: Readonly<Record<string, string>>/u);
	assert.match(SHELL_SOURCE, /"teamwork-agents": "#1868DB"/u);
	assert.match(SHELL_SOURCE, /function getHomeStarterCardGlowAccent\(iconSrc: string\)/u);
	assert.match(SHELL_SOURCE, /getHomeStarterCardGlowAccent\(template\.iconSrc\)/u);
	assert.match(SHELL_SOURCE, /function HomeStarterCardGlowLayers/u);
	assert.match(SHELL_SOURCE, /const tileRefs = useRef<Array<HTMLButtonElement \| null>>\(\[\]\);/u);
	assert.match(SHELL_SOURCE, /onPointerMove=\{handleBentoPointerMove\}/u);
	assert.match(SHELL_SOURCE, /onPointerLeave=\{resetBentoPointer\}/u);
	assert.match(SHELL_SOURCE, /--card-glow-pointer-x", normalizedX\.toFixed\(3\)/u);
	assert.match(SHELL_SOURCE, /--card-glow-pointer-y", normalizedY\.toFixed\(3\)/u);
	assert.match(SHELL_SOURCE, /"--card-glow-tile-accent": accentColor/u);
	assert.match(SHELL_SOURCE, /"--card-glow-border-core": 36/u);
	assert.match(SHELL_SOURCE, /"--card-glow-border-spread": 120/u);
	assert.match(SHELL_SOURCE, /<HomeStarterCardGlowLayers iconSrc=\{template\.iconSrc\} \/>/u);
	assert.match(SHELL_SOURCE, /const HOME_STARTER_CARD_BASE_BORDER_STYLE: CSSProperties/u);
	// Resting stroke uses the subtle `color.border` token (matches the tiles'
	// pre-glow default), not the heavier `color.border.bold`.
	assert.match(SHELL_SOURCE, /boxShadow: `inset 0 0 0 calc\(var\(--card-glow-border-width\) \* 1px\) \$\{token\("color\.border"\)\}`/u);
	assert.doesNotMatch(SHELL_SOURCE, /token\("color\.border\.bold"\)/u);
	assert.match(SHELL_SOURCE, /borderWidth: "calc\(var\(--card-glow-border-width\) \* 1px\)"/u);
	assert.match(SHELL_SOURCE, /transparent calc\(var\(--card-glow-border-spread\) \* 1px\)/u);
	assert.match(SHELL_SOURCE, /data-home-starter-card-base-border/u);
	assert.match(SHELL_SOURCE, /data-home-starter-card-glow-border/u);
	assert.match(SHELL_SOURCE, /absolute inset-0 z-\[1\] rounded-\[inherit\]/u);
	assert.match(SHELL_SOURCE, /style=\{HOME_STARTER_CARD_BASE_BORDER_STYLE\}/u);
	assert.match(SHELL_SOURCE, /absolute inset-0 z-\[2\] overflow-hidden rounded-\[inherit\] border border-transparent/u);
	// Regression: the glow ring must coexist with the always-on grey base stroke.
	// Two invariants enforce the desired behavior:
	// 1. No backdrop-filter on the ring — an always-on filter recolors the whole
	//    ring (even where the gradient is transparent) and crushes the grey stroke.
	// 2. No per-tile hover/focus opacity gate on the ring — the glow is driven by
	//    the container-level pointer tracking so edges still light up when the
	//    cursor is in the GAPS between tiles, not only over the hovered tile.
	assert.doesNotMatch(SHELL_SOURCE, /backdropFilter/u);
	assert.doesNotMatch(SHELL_SOURCE, /z-\[2\][^"]*group-hover\/home-starter-card:opacity-100/u);
	assert.match(SHELL_SOURCE, /onPointerMove=\{handleBentoPointerMove\}/u);
	assert.match(SHELL_SOURCE, /rounded-lg bg-background/u);
	assert.match(SHELL_SOURCE, /transition-\[background-color,box-shadow\]/u);
	assert.doesNotMatch(SHELL_SOURCE, /hover:border-border-bold/u);
	assert.doesNotMatch(SHELL_SOURCE, /color-mix\(in srgb, var\(--card-glow-tile-accent\) 92%, white\)/u);
	assert.doesNotMatch(SHELL_SOURCE, /rounded-lg border border-border bg-background/u);
});

test("Studio content surfaces keep their intended max widths", () => {
	assert.match(SHELL_LAYOUT_SOURCE, /export const ROVO_APP_STUDIO_COMPOSER_MAX_WIDTH_CLASS = "max-w-\[600px\]";/u);
	assert.match(SHELL_LAYOUT_SOURCE, /export const ROVO_APP_STUDIO_COMPOSER_SESSION_MAX_WIDTH_CLASS = "max-w-\[800px\]";/u);
	assert.match(SHELL_LAYOUT_SOURCE, /export const ROVO_APP_STUDIO_CONTENT_MAX_WIDTH_CLASS = "max-w-\[1280px\]";/u);
	assert.match(SHELL_SOURCE, /ROVO_APP_STUDIO_CONTENT_MAX_WIDTH_CLASS/u);
	assert.match(SHELL_SOURCE, /className=\{cn\(BENTO_CAROUSEL_CONTAINER_CLASS, ROVO_APP_STUDIO_CONTENT_MAX_WIDTH_CLASS\)\}/u);
	assert.match(MESSAGES_SOURCE, /compact \? "max-w-none" : "max-w-\[800px\]"/u);
	assert.match(COMPOSER_SOURCE, /FLOATING_COMPOSER_MAX_WIDTH_CLASS = "max-w-\[600px\]"/u);
	assert.match(COMPOSER_SOURCE, /className=\{cn\("relative z-10 mx-auto", fillWidth \? FLOATING_COMPOSER_SESSION_MAX_WIDTH_CLASS : FLOATING_COMPOSER_MAX_WIDTH_CLASS\)\}/u);
});

test("Studio home bento keeps tab auto-cycle active without manual category tabs", () => {
	const homeBentoSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("function HomeStarterBento"),
		SHELL_SOURCE.indexOf("function getCssDurationTokenMs"),
	);

	assert.match(SHELL_SOURCE, /const cycleRunning = !shouldReduceMotion && !templatesDialogOpen;/u);
	assert.match(SHELL_SOURCE, /templatesDialogOpen: boolean;/u);
	assert.match(SHELL_SOURCE, /const bentoInteractingRef = useRef\(false\);/u);
	assert.match(SHELL_SOURCE, /const updateBentoInteracting = useCallback\(\(interacting: boolean\) => \{[\s\S]*bentoInteractingRef\.current = interacting;[\s\S]*setBentoInteracting\(interacting\);[\s\S]*\}, \[\]\);/u);
	assert.match(SHELL_SOURCE, /const nextIndex = \(currentIndex \+ 1\) % HOME_STARTER_CATEGORIES\.length;/u);
	assert.match(SHELL_SOURCE, /return HOME_STARTER_CATEGORIES\[nextIndex\]\.id;/u);
	assert.match(SHELL_SOURCE, /if \(bentoInteractingRef\.current\) \{[\s\S]*controls\.pause\(\);[\s\S]*\}[\s\S]*cycleControlsRef\.current = controls;/u);
	assert.match(homeBentoSource, /Bridge the visual 8px gap[\s\S]*className="pointer-events-auto absolute left-full top-0 h-7 w-2"[\s\S]*aria-label="Dismiss prompt starters"/u);
	assert.doesNotMatch(homeBentoSource, /className="flex flex-wrap justify-center gap-2"/u);
	assert.doesNotMatch(homeBentoSource, /aria-pressed=\{isActive\}/u);
	assert.doesNotMatch(homeBentoSource, /selectHomeStarterCategory/u);
	assert.doesNotMatch(SHELL_SOURCE, /setCycleEnabled\(false\)/u);
});

test("Studio chat header is hidden until a chat is active", () => {
	assert.match(SHELL_SOURCE, /const shouldShowChatHeader = !shouldShowAgentConfigPane && \(visibleMessages\.length > 0 \|\| hasActiveThreadRun \|\| chat\.isStreaming\);/u);
	assert.match(SHELL_SOURCE, /\{shouldShowChatHeader \? \(\s*<RovoAppHeader/u);
	assert.doesNotMatch(SHELL_SOURCE, /\n\t\t\t\t<RovoAppHeader/u);
});

test("Studio agent results use guarded session-agent registration with preserve-thread selection", () => {
	assert.match(SHELL_SOURCE, /type StudioAgentRegistryContext = ReturnType<typeof useRovoSelectedAgent> & \{/u);
	assert.match(SHELL_SOURCE, /registerCreatedAgentFromResult\?:/u);
	assert.match(SHELL_SOURCE, /registerAgentResult\?:/u);
	assert.match(SHELL_SOURCE, /registerSessionAgent\?:/u);
	assert.match(SHELL_SOURCE, /normalizeStudioAgentResult\(agentResult\)/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.registerCreatedAgentFromResult\(agentResult, \{[\s\S]*preserveCurrentThread: true,[\s\S]*select: true,[\s\S]*sourceKey,/u);
	assert.match(SHELL_SOURCE, /if \(!didRegisterAgent\) \{[\s\S]*return false;[\s\S]*\}/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.selectAgent\(agentId, \{ preserveCurrentThread: true \}\);/u);
	assert.match(SHELL_SOURCE, /import \{ isGeneratedAgentResult \} from "@\/components\/projects\/sidebar-chat\/components\/agent-result-card";/u);
	assert.match(SHELL_SOURCE, /hasTurnCompleteSignal/u);
	assert.match(SHELL_SOURCE, /const agentResult = getMessageAgentResult\(message\);/u);
	assert.match(SHELL_SOURCE, /for \(const message of chat\.messages\.toReversed\(\)\) \{/u);
	assert.match(SHELL_SOURCE, /if \(!isGeneratedAgentResult\(agentResult\) \|\| !hasTurnCompleteSignal\(message\)\) \{[\s\S]*continue;[\s\S]*\}/u);
	assert.match(SHELL_SOURCE, /if \(handleStudioAgentResultSelect\(agentResult, \{ sourceMessageId: message\.id \}\)\) \{[\s\S]*handledAgentResultKeysRef\.current\.add\(agentResultKey\);/u);
	assert.match(SHELL_SOURCE, /handledAgentResultKeysRef\.current\.add\(agentResultKey\);[\s\S]*unmarkStudioAgentCreationThread\(chat\.runtimeThreadId\);[\s\S]*unmarkStudioAgentCreationThread\(chat\.activeThreadId\);[\s\S]*break;/u);
	assert.match(SHELL_SOURCE, /const unmarkStudioAgentCreationThread = useCallback[\s\S]*studioAgentCreationThreadKeysRef\.current\.delete\(threadId\);/u);
	assert.doesNotMatch(SHELL_SOURCE, /!studioAgentCreationThreadKeysRef\.current\.has\(chat\.runtimeThreadId\) &&[\s\S]*return;[\s\S]*for \(const message of chat\.messages/u);
	assert.match(SHELL_SOURCE, /import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u);
	assert.match(SHELL_SOURCE, /sessionAgentEntries=\{studioAgentRegistry\.sessionAgentEntries\}/u);
	assert.match(SHELL_SOURCE, /sessionAgents=\{studioAgentRegistry\.sessionAgentEntries\.map\(\(entry\) => entry\.profile\)\}/u);
	assert.match(SHELL_SOURCE, /agents=\{ROVO_DIRECTORY_AGENT_PROFILES\}/u);
	assert.match(SHELL_SOURCE, /selectedAgentId=\{activeSessionAgentEntry\?\.profile\.id \?\? studioAgentRegistry\.selectedAgentId\}/u);
	assert.match(SHELL_SOURCE, /onSelectAgent=\{handleStudioSidebarAgentSelect\}/u);
	assert.match(SHELL_SOURCE, /onViewAllAgents=\{handleReturnToAgentsHome\}/u);
	assert.doesNotMatch(SHELL_SOURCE, /rovo-app-agents-directory/u);
});

test("Studio custom agent config is not treated as the agents landing", () => {
	assert.match(
		SHELL_SOURCE,
		/const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected && !shouldShowAgentConfigPane;/u,
	);
	assert.match(
		SHELL_SOURCE,
		/selectedAgentId=\{activeSessionAgentEntry\?\.profile\.id \?\? studioAgentRegistry\.selectedAgentId\}/u,
	);
});

test("Studio agent edit surfaces share the session-agent display name", () => {
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /getStudioSessionAgentDisplayName/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const agentName = getStudioSessionAgentDisplayName\(entry\);/u);
	assert.match(SHELL_SOURCE, /getStudioSessionAgentDisplayName/u);
	assert.match(SHELL_SOURCE, /const agentName = getStudioSessionAgentDisplayName\(activeSessionAgentEntry\);/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /draft\.name\?\.trim\(\) \|\| entry\.profile\.name/u);
	assert.doesNotMatch(SHELL_SOURCE, /draftResult\?\.name\?\.trim\(\) \|\| profile\.name/u);
});

test("Studio lands generated agents in the Test tab and opens Ask Rovo", () => {
	// The navigation hook still exposes deterministic chat controls for the
	// separate Ask Rovo surface, and generated-agent testing opens it by default.
	assert.match(NAV_HOOK_SOURCE, /const \{ toggleChat, openChat, chatSurface \} = useRovoChat\(\);/u);
	assert.match(NAV_HOOK_SOURCE, /\n\t\topenChat,\n/u);

	// The agent-result handler selects the Test tab for both registration paths
	// and opens the right-side edit chat without toggling it closed if already open.
	assert.ok(
		(SHELL_SOURCE.match(/setActiveAgentConfigView\("test"\);/gu) ?? []).length >= 2,
		"both registration success paths should land in the Test tab",
	);
	assert.match(SHELL_SOURCE, /const openAgentCreationAskRovoChat = useCallback\(\(\) => \{[\s\S]*studioAgentRegistry\.resetAgentToRovo\(\);[\s\S]*nav\.openChat\("sidebar"\);[\s\S]*\}, \[nav, studioAgentRegistry\]\);/u);
	const agentResultSelectSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleStudioAgentResultSelect = useCallback"),
		SHELL_SOURCE.indexOf("// \"Start from scratch\""),
	);
	assert.match(agentResultSelectSource, /setActiveAgentConfigView\("test"\);[\s\S]*openAgentCreationAskRovoChat\(\);[\s\S]*return true;[\s\S]*setActiveAgentConfigView\("test"\);[\s\S]*openAgentCreationAskRovoChat\(\);[\s\S]*return true;/u);
	assert.doesNotMatch(agentResultSelectSource, /nav\.toggleChat/u);
	assert.match(SHELL_SOURCE, /\[chat\.activeThreadId, chat\.runtimeThreadId, openAgentCreationAskRovoChat, setActiveAgentConfigState, studioAgentRegistry\]/u);
	assert.match(SHELL_SOURCE, /const activeAgentConfigRef = useRef\(activeAgentConfig\);/u);
	assert.match(SHELL_SOURCE, /const generatedAgentTestViewKeysRef = useRef<Set<string>>\(new Set\(\)\);/u);
	assert.match(SHELL_SOURCE, /const setActiveAgentConfigState = useCallback\(\(nextAgentConfig: typeof activeAgentConfig\) => \{[\s\S]*activeAgentConfigRef\.current = nextAgentConfig;[\s\S]*setActiveAgentConfig\(nextAgentConfig\);[\s\S]*\}, \[\]\);/u);
	assert.match(SHELL_SOURCE, /const handleAgentRestoredFromUrl = useCallback\(\(agentId: string \| null\) => \{[\s\S]*if \(activeAgentConfigRef\.current\?\.profileId !== agentId\) \{[\s\S]*setActiveAgentConfigView\("configure"\);[\s\S]*\}[\s\S]*setActiveAgentConfigState\(agentId \? \{ profileId: agentId, sourceMessageId: null \} : null\);/u);
	assert.match(SHELL_SOURCE, /if \(activeAgentConfig && !activeSessionAgentEntry\) \{[\s\S]*if \(studioAgentRegistry\.getSessionAgentEntry\?\.\(activeAgentConfig\.profileId\)\) \{[\s\S]*return;[\s\S]*\}[\s\S]*setActiveAgentConfigState\(null\);[\s\S]*setActiveAgentConfigView\("configure"\);/u);
	assert.match(SHELL_SOURCE, /!activeAgentConfig \|\|[\s\S]*!activeSessionAgentEntry \|\|[\s\S]*activeAgentConfigView === "test"/u);
	assert.match(SHELL_SOURCE, /const isActiveGeneratedAgent =[\s\S]*message\.id === activeAgentConfig\.sourceMessageId \|\|[\s\S]*agentResult\.agentId === activeSessionAgentEntry\.sourceResult\.agentId \|\|[\s\S]*agentResult\.agentId === activeSessionAgentEntry\.draftResult\.agentId \|\|[\s\S]*agentResult\.agentId === activeSessionAgentEntry\.publishReadyResult\.agentId;/u);
	assert.match(SHELL_SOURCE, /const agentResultKey = `\$\{chat\.runtimeThreadId\}:\$\{message\.id\}:\$\{agentResult\.agentId\}:\$\{agentResult\.action\}`;[\s\S]*if \(generatedAgentTestViewKeysRef\.current\.has\(agentResultKey\)\) \{[\s\S]*break;[\s\S]*\}[\s\S]*generatedAgentTestViewKeysRef\.current\.add\(agentResultKey\);[\s\S]*setActiveAgentConfigView\("test"\);[\s\S]*openAgentCreationAskRovoChat\(\);/u);
});

test("RovoAppMessages renders the block agent result card after generation completes", () => {
	assert.match(MESSAGES_SOURCE, /getMessageAgentResult/u);
	assert.match(MESSAGES_SOURCE, /hasTurnCompleteSignal/u);
	assert.match(MESSAGES_SOURCE, /type RovoDataParts/u);
	assert.match(MESSAGES_SOURCE, /import \{ AgentResultCard, isGeneratedAgentResult \} from "@\/components\/projects\/sidebar-chat\/components\/agent-result-card";/u);
	assert.match(MESSAGES_SOURCE, /const agentResult = getMessageAgentResult\(message\);/u);
	assert.match(MESSAGES_SOURCE, /const completedAgentResult =[\s\S]*isGeneratedAgentResult\(agentResult\) && hasTurnCompleteSignal\(message\)[\s\S]*\? agentResult[\s\S]*: null;/u);
	assert.match(MESSAGES_SOURCE, /const resolvedArtifactDisplayForMessage =[\s\S]*completedAgentResult \? null : resolvedArtifactDisplay;/u);
	assert.match(MESSAGES_SOURCE, /resolvedArtifactDisplayForMessage \? \([\s\S]*<ArtifactCard/u);
	assert.match(MESSAGES_SOURCE, /completedAgentResult \? \([\s\S]*<AgentResultCard[\s\S]*agent=\{completedAgentResult\}[\s\S]*sourceMessageId: message\.id/u);
	assert.doesNotMatch(MESSAGES_SOURCE, /function StudioAgentResultCard/u);
	assert.match(ROVO_UI_MESSAGES_SOURCE, /import type \{ AgentTriggerValue \} from "@\/components\/blocks\/triggers\/data\/trigger-catalog";/u);
	assert.match(ROVO_UI_MESSAGES_SOURCE, /triggers\?: string\[\];/u);
	assert.match(ROVO_UI_MESSAGES_SOURCE, /triggerDefinitions\?: AgentTriggerValue\[\];/u);
});

test("Studio agent insights panel frames agent performance and improvement opportunities", () => {
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Review your agent&apos;s performance and gather insights\./u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Understand adoption, answer quality, failure patterns, and the next improvements/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Total conversations/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Active users/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Successful answer rate/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Escalation rate/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Feedback score/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Adoption trend/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Answer quality/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Conversation outcomes/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Top topics/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Feedback mix/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Recommended improvements/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Improve billing answers/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /Next review focus/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /<ChartContainer/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /AGENT_INSIGHTS_TREND_DATA/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /AGENT_INSIGHTS_TOPIC_DATA/u);
	assert.match(AGENT_INSIGHTS_PANEL_SOURCE, /AGENT_INSIGHTS_RECOMMENDATIONS/u);
	assert.doesNotMatch(AGENT_INSIGHTS_PANEL_SOURCE, /bg-\[var\(--ds-/u);
	assert.doesNotMatch(AGENT_INSIGHTS_PANEL_SOURCE, /text-\[var\(--ds-/u);
});

test("Studio agent config moves Details into compact nav and removes the config toggle group", () => {
	assert.match(AGENT_BLOCK_SOURCE, /import \{ LayoutDashboardIcon, MoreHorizontalIcon, PlusIcon \} from "@\/components\/ui\/vpk-icons";/u);
	assert.match(AGENT_BLOCK_SOURCE, /AGENT_COMPACT_HEADER_NAV_ITEMS = \[[\s\S]*<LayoutDashboardIcon size="small" \/>[\s\S]*label: "Details"[\s\S]*label: "Insights"/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const lastCompactSectionRef = useRef<AgentCompactHeaderSection>\("details"\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const activeHeaderSection: AgentCompactHeaderSection \| null =[\s\S]*activeView === "insights"[\s\S]*activeView === "configure"[\s\S]*activeCompactSection \?\? "details"[\s\S]*: null;/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const restoreCompactSection = useCallback\([\s\S]*if \(section === "details"\) \{[\s\S]*setActiveCompactSection\(null\);[\s\S]*return;[\s\S]*\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleCompactSectionChange = useCallback\([\s\S]*lastCompactSectionRef\.current = section;[\s\S]*restoreCompactSection\(section\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleTestPressedChange = useCallback\([\s\S]*if \(pressed\) \{[\s\S]*lastCompactSectionRef\.current = activeHeaderSection;[\s\S]*handleTest\(\);[\s\S]*return;[\s\S]*\}[\s\S]*restoreCompactSection\(lastCompactSectionRef\.current \?\? "details"\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<AgentCompactHeaderNav[\s\S]*activeSection=\{activeHeaderSection\}[\s\S]*onSectionChange=\{handleCompactSectionChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<Toggle[\s\S]*aria-label="Toggle agent test view"[\s\S]*className="rounded-\[6px\] hover:border-border data-pressed:hover:border-border-selected"[\s\S]*data-testid="agent-config-test"[\s\S]*onPressedChange=\{handleTestPressedChange\}[\s\S]*pressed=\{activeView === "test"\}[\s\S]*Test[\s\S]*<\/Toggle>/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /aria-label="Agent config views"|<ToggleGroup|<ToggleGroupItem|data-testid="agent-config-configure"|>Configure<\/ToggleGroupItem>/u);
});

test("Studio agent config panel renders the shared block agent config fields", () => {
	assert.match(AGENT_BLOCK_SOURCE, /export const AgentConfigFields = memo/u);
	assert.match(AGENT_BLOCK_SOURCE, /const AGENT_AVATAR_PROFILE_COVER_COLORS: Record<string, string>/u);
	assert.match(AGENT_BLOCK_SOURCE, /"product-agents": "#BF63F3"/u);
	assert.match(AGENT_BLOCK_SOURCE, /function getAgentProfileCoverBackgroundColor\(avatarSrc: string \| undefined\): string/u);
	assert.match(AGENT_BLOCK_SOURCE, /style=\{\{ backgroundColor: coverBackgroundColor \}\}/u);
	assert.match(AGENT_BLOCK_SOURCE, /Add rules for when this agent runs/u);
	assert.match(AGENT_BLOCK_SOURCE, /Add prompts to help people start/u);
	assert.match(AGENT_BLOCK_SOURCE, /aria-label="Knowledge mode"/u);
	assert.match(AGENT_BLOCK_SOURCE, /Press \/ to help me describe the agent's role/u);
	assert.match(AGENT_BLOCK_SOURCE, /dataFlowConfig=\{config\}/u);
	assert.doesNotMatch(AGENT_BLOCK_SOURCE, /layout\?: "default" \| "compact";/u);
	assert.match(AGENT_BLOCK_SOURCE, /triggerDefinitions\?: readonly AgentTriggerValue\[\];/u);
	assert.match(AGENT_BLOCK_SOURCE, /onTriggerDefinitionsChange\?: \(triggers: readonly AgentTriggerValue\[\]\) => void;/u);
	assert.match(AGENT_BLOCK_SOURCE, /readViewClassName="relative h-auto overflow-visible border-2 bg-transparent px-0 py-1 text-2xl leading-7 font-semibold hover:bg-transparent active:bg-transparent focus:border-border-focused focus-visible:border-border-focused focus-visible:bg-transparent"/u);
	assert.match(AGENT_BLOCK_SOURCE, /inputProps=\{\{ className: "h-auto border-2 px-1\.5 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" \}\}/u);
	assert.match(AGENT_BLOCK_SOURCE, /textareaProps=\{\{ rows: 1, className: "min-h-10 border-2 bg-bg-neutral-subtle px-1\.5 focus:border-ring focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-\[variant=default\]:border-transparent data-\[variant=default\]:focus:border-ring data-\[variant=default\]:focus-visible:border-ring" \}\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /AgentConfigFields/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /AgentSurfaces/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /type AgentCompactHeaderSection/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /config=\{activeConfig\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onTextChange=\{handleConfigTextChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onAddListValues=\{appendListValues\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onAppendListItem=\{appendListItem\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onConnectTrigger=\{handleConnectTrigger\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onTriggerDefinitionsChange=\{handleTriggerDefinitionsChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onOpenDirectory=\{handleOpenDirectory\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ KnowledgeDirectoryDialog, type KnowledgeDirectoryAddPayload \} from "@\/components\/blocks\/knowledge-directory";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ Memory \} from "@\/components\/blocks\/memory";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ DEFAULT_KNOWLEDGE_APPS \} from "@\/app\/data\/directory\/knowledge";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ SkillsDirectoryDialog, type SkillsDirectorySkill \} from "@\/components\/blocks\/skills-directory";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ DEFAULT_SKILLS \} from "@\/app\/data\/directory\/skills";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ ToolsDirectoryDialog \} from "@\/components\/blocks\/tools-directory";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ DEMO_SESSION_TOOLS, DEMO_TOOLS \} from "@\/app\/data\/directory\/tools";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ AgentInsights \} from "@\/components\/blocks\/agent-insights";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const \[activeDirectory, setActiveDirectory\] = useState<AgentDirectoryKind \| null>\(null\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const \[activeCompactSection, setActiveCompactSection\] = useState<AgentCompactHeaderSection \| null>\(null\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleTriggerDefinitionsChange = useCallback\([\s\S]*serializeAgentTriggerLabels\(triggerDefinitions\)[\s\S]*triggerDefinitions,[\s\S]*trigger: triggerLabels\[0\] \?\? "",[\s\S]*triggers: triggerLabels,/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleConnectTrigger = useCallback\([\s\S]*connectionState: "connecting" as const[\s\S]*serializeAgentTriggerLabels\(triggerDefinitions\)/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleOpenDirectory = useCallback\(\(directory: AgentDirectoryKind, selectedItem\?: string\) => \{[\s\S]*setDirectorySelectedToolId\(matchedTool\?\.id \?\? null\);[\s\S]*setActiveDirectory\(directory\);[\s\S]*\}, \[\]\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleAddKnowledge = useCallback\([\s\S]*payload: KnowledgeDirectoryAddPayload[\s\S]*DEFAULT_KNOWLEDGE_APPS\.find[\s\S]*appendListValues\("knowledge"/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleDirectoryToolIdsChange = useCallback\([\s\S]*const toolsById = new Map\(\[\.\.\.DEMO_TOOLS, \.\.\.DEMO_SESSION_TOOLS\][\s\S]*appendListValues\(\s*"tools"/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleAddSkills = useCallback\([\s\S]*skills: readonly SkillsDirectorySkill\[\][\s\S]*appendListValues\("skills", skills\.map\(\(skill\) => skill\.name\)\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<KnowledgeDirectoryDialog[\s\S]*open=\{activeDirectory === "knowledge"\}[\s\S]*onAddKnowledge=\{handleAddKnowledge\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<ToolsDirectoryDialog[\s\S]*addedToolIds=\{directoryToolIds\}[\s\S]*open=\{activeDirectory === "tools"\}[\s\S]*onAddedToolIdsChange=\{handleDirectoryToolIdsChange\}[\s\S]*sessionTools=\{DEMO_SESSION_TOOLS\}[\s\S]*tools=\{DEMO_TOOLS\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<SkillsDirectoryDialog[\s\S]*onAddSkills=\{handleAddSkills\}[\s\S]*open=\{activeDirectory === "skills"\}[\s\S]*selectedSkillIds=\{directorySkillIds\}[\s\S]*skills=\{DEFAULT_SKILLS\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<Memory[\s\S]*open=\{activeDirectory === "memory"\}[\s\S]*showTrigger=\{false\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /AgentCompactHeaderNav,/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /import \{ Lozenge \} from "@\/components\/ui\/lozenge";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ Tabs, TabsContent \} from "@\/components\/ui\/tabs";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ Toggle \} from "@\/components\/ui\/toggle";/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /export type AgentConfigView = "configure" \| "insights" \| "test";/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /function getPublishLabel/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const restoreCompactSection = useCallback\([\s\S]*if \(section === "insights"\) \{[\s\S]*setActiveCompactSection\(null\);[\s\S]*onViewChange\("insights"\);[\s\S]*return;[\s\S]*\}[\s\S]*onViewChange\("configure"\);[\s\S]*if \(section === "details"\) \{[\s\S]*setActiveCompactSection\(null\);[\s\S]*return;[\s\S]*\}[\s\S]*setActiveCompactSection\(\s*section === "surfaces" \|\|[\s\S]*section === "access" \|\|[\s\S]*section === "users" \|\|[\s\S]*section === "evaluation"[\s\S]*\? section[\s\S]*: null,/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /if \(value === "test"\) \{[\s\S]*lastCompactSectionRef\.current = activeHeaderSection;[\s\S]*handleTest\(\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<AgentCompactHeaderNav[\s\S]*activeSection=\{activeHeaderSection\}[\s\S]*avatarSrc=\{agentAvatarSrc\}[\s\S]*onSectionChange=\{handleCompactSectionChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /activeCompactSection === "surfaces" \? \([\s\S]*<AgentSurfaces className="-mr-4 pr-4" \/>[\s\S]*\) : \([\s\S]*<AgentConfigFields/u);
	// Clicking the "Evaluation" compact-nav tab renders the full-bleed Evaluation screen.
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ AgentEvaluation \} from "@\/components\/blocks\/agent-evaluation";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /activeCompactSection === "evaluation" \? \([\s\S]*<AgentEvaluation \/>[\s\S]*\) : \(/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /function AgentConfigActionButton/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /function AgentConfigToggleItem/u);
	// The Test action is a single controlled Toggle; Details owns the configure
	// view through AgentCompactHeaderNav instead of a Configure/Test segmented control.
	assert.ok(!AGENT_CONFIG_PANEL_SOURCE.includes('TooltipTrigger render={<span className="inline-flex" />}'));
	// The Update button is removed from the studio header; only Test and Publish
	// remain in the action area.
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /disabledTooltip="Make a change to the agent before updating the testing version\."/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /data-testid="agent-config-update"/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /hasAgentInstructions/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<Tabs[\s\S]*onValueChange=\{handleViewChange\}[\s\S]*value=\{activeView\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<Toggle[\s\S]*className="rounded-\[6px\] hover:border-border data-pressed:hover:border-border-selected"[\s\S]*data-testid="agent-config-test"[\s\S]*onPressedChange=\{handleTestPressedChange\}[\s\S]*pressed=\{activeView === "test"\}[\s\S]*variant="outline"[\s\S]*Test[\s\S]*<\/Toggle>/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /aria-label="Agent config views"|<ToggleGroup|<ToggleGroupItem|data-testid="agent-config-configure"|>Configure<\/ToggleGroupItem>/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /disabled=\{!hasAgentInstructions\}/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /aria-label="Agent config views"[\s\S]{0,160}size="sm"/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /<TabsList>|<TabsTrigger/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<TabsContent[\s\S]*value="configure"[\s\S]*<AgentConfigFields/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /compactScrollAreaClassName="-ml-1\.5 -mr-4 pr-4"/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<TabsContent value="test"[\s\S]*\{testPanel\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<TabsContent value="insights"[\s\S]*<AgentInsights \/>/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /Generation looks partial/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /variant="outline"[\s\S]*onClick=\{handleTest\}[\s\S]*disabled=\{!hasAgentInstructions\}/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /disabledTooltip="Add agent instructions before testing this agent\."/u);
	assert.match(SHELL_SOURCE, /const \[activeAgentConfigView, setActiveAgentConfigView\] = useState<AgentConfigView>\("configure"\);/u);
	assert.match(SHELL_SOURCE, /const handleTestAgent = useCallback/u);
	const handleTestAgentSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleTestAgent = useCallback"),
		SHELL_SOURCE.indexOf("const handleAgentConfigViewChange = useCallback"),
	);
	assert.doesNotMatch(handleTestAgentSource, /draftResult\.instructions|return;/u);
	assert.match(handleTestAgentSource, /studioAgentRegistry\.commitSessionAgentPublishReady\?\.\(profileId\);[\s\S]*setActiveAgentConfigView\("test"\);/u);
	assert.doesNotMatch(handleTestAgentSource, /nav\.openChat\("sidebar"\)|nav\.toggleChat/u);
	const handleAgentConfigViewChangeSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleAgentConfigViewChange = useCallback"),
		SHELL_SOURCE.indexOf("const handlePublishAgent = useCallback"),
	);
	assert.match(handleAgentConfigViewChangeSource, /setActiveAgentConfigView\(view\);/u);
	assert.doesNotMatch(handleAgentConfigViewChangeSource, /nav\.openChat|nav\.toggleChat/u);
	assert.match(SHELL_SOURCE, /import \{ AgentTestPanel \} from "@\/components\/projects\/studio\/components\/rovo-app-agent-test-panel";/u);
	assert.match(SHELL_SOURCE, /const agentConfigTestPanel = activeSessionAgentEntry \? \([\s\S]*<AgentTestPanel entry=\{activeSessionAgentEntry\} \/>/u);
	assert.match(SHELL_SOURCE, /testPanel=\{agentConfigTestPanel\}/u);
	assert.match(SHELL_SOURCE, /onTest=\{handleTestAgent\}/u);
	assert.match(SHELL_SOURCE, /<RovoAppAgentConfigPanel[\s\S]*testPanel=\{agentConfigTestPanel\}[\s\S]*chatContextBar=\{agentEditContextBar\}[\s\S]*chatGreeting=\{agentEditGreeting\}[\s\S]*onUpdateDraft=\{handleUpdateAgentDraft\}[\s\S]*\/>/u);
	// "start with a template" link opens the Agent Directory on the first
	// template tab (AGENT_TEMPLATES_CATEGORIES[0].id) via the config panel.
	assert.match(SHELL_SOURCE, /import \{ AGENT_TEMPLATES_CATEGORIES,[\s\S]*\} from "@\/components\/blocks\/agent-templates";/u);
	assert.match(SHELL_SOURCE, /const handleStartAgentWithTemplate = useCallback\(\(\) => \{[\s\S]*handleBrowseAgentsDirectory\(AGENT_TEMPLATES_CATEGORIES\[0\]\.id\);[\s\S]*\}, \[handleBrowseAgentsDirectory\]\);/u);
	assert.match(SHELL_SOURCE, /<RovoAppAgentConfigPanel[\s\S]*onStartWithTemplate=\{handleStartAgentWithTemplate\}[\s\S]*\/>/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onStartWithTemplate=\{onStartWithTemplate\}/u);
	assert.match(SHELL_SOURCE, /isChatOpen=\{nav\.isSidebarChatOpen\}[\s\S]*onToggleChat=\{handleToggleAskRovoChat\}/u);
	assert.match(SHELL_SOURCE, /const isStudioAskRovoChatActive = !embedded && shouldShowAgentConfigPane && nav\.isSidebarChatOpen;/u);
	// "Ask Rovo" must open the default Rovo agent, not the custom agent being
	// edited: opening the chat resets the selected agent back to Rovo.
	const handleToggleAskRovoChatSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleToggleAskRovoChat = useCallback"),
		SHELL_SOURCE.indexOf("// When the active agent disappears"),
	);
	assert.match(handleToggleAskRovoChatSource, /if \(!nav\.isSidebarChatOpen\) \{[\s\S]*studioAgentRegistry\.resetAgentToRovo\(\);[\s\S]*\}[\s\S]*nav\.toggleChat\(\);/u);
	const agentEditContextBarSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const agentEditContextBar = useMemo"),
		SHELL_SOURCE.indexOf("// When the \"Edit agent\" context bar is active"),
	);
	assert.match(agentEditContextBarSource, /if \(!activeSessionAgentEntry \|\| isCustomAgentSelected\) \{[\s\S]*return null;[\s\S]*\}/u);
	assert.match(SHELL_SOURCE, /<ChatPanel[\s\S]*onClose=\{nav\.toggleChat\}[\s\S]*abortOnUnmount=\{false\}[\s\S]*chatContextBar=\{agentEditContextBar\}[\s\S]*greeting=\{agentEditGreeting\}[\s\S]*containerStyle=\{\{ borderRadius: 0, borderWidth: 0 \}\}[\s\S]*\/>/u);
	// The Ask Rovo edit panel always chats with the default Rovo agent (it's a
	// build/improve helper), so it must render as a plain default-Rovo chat:
	// no custom-agent Chat / Trigger / Activity tab header and no Test-mode-only
	// controls. Those tabs belong to the left-hand Test panel instead.
	const askRovoChatPanelSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("<ChatPanel\n"),
		SHELL_SOURCE.indexOf("<SidebarResizeHandle"),
	);
	assert.doesNotMatch(askRovoChatPanelSource, /customAgentTabs/u);
	assert.doesNotMatch(askRovoChatPanelSource, /showAgentTestControls/u);
	// The Ask Rovo tab memo is gone entirely now that the helper is plain chat.
	assert.doesNotMatch(SHELL_SOURCE, /askRovoCustomAgentTabs/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const \{ chatSurface, openChat, resetAgentToRovo \} = useRovoChat\(\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleOpenFloatingRovoChat = useCallback\(\(\) => \{[\s\S]*resetAgentToRovo\(\);[\s\S]*openChat\("floating"\);[\s\S]*\}, \[openChat, resetAgentToRovo\]\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<FloatingRovoButton ariaLabel="Open Rovo chat" product="home" onButtonClick=\{handleOpenFloatingRovoChat\} \/>/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /chatGreeting\?: ChatPanelGreetingProps;/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<RovoFloatingChat[\s\S]*chatContextBar=\{chatContextBar\}[\s\S]*greeting=\{chatGreeting\}[\s\S]*hideComposerSourceAndModelControls=\{Boolean\(chatContextBar\)\}[\s\S]*\/>/u);
	assert.match(SHELL_SOURCE, /<SidebarResizeHandle[\s\S]*side="left"[\s\S]*askRovoChatResize\.onResizeHandlePointerDown/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /export function AgentTestPanel/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /aria-label="Agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /data-testid="agent-test-panel"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /className=\{cn\("h-full min-h-0 px-4", className\)\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /containerClassName="h-full min-h-0 w-full overflow-visible"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /composerContainerClassName="px-0"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /conversationContentClassName="px-0"/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /containerClassName="mx-auto h-full min-h-0 w-full max-w-\[800px\] overflow-visible"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /containerStyle=\{\{ borderRadius: 0, borderWidth: 0, overflow: "visible" \}\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /greetingSelectedAgent=\{testAgentProfile\}/u);
	assert.match(CHAT_PANEL_SOURCE, /greetingSelectedAgent\?: RovoAgentProfile \| null;/u);
	assert.match(CHAT_PANEL_SOURCE, /selectedAgent=\{greetingSelectedAgent \?\? selectedAgent\}/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /<Label htmlFor=\{`agent-\$\{profileId\}-name`\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /conversationStarterIcons: Array\.isArray\(config\.conversationStarterIcons\)[\s\S]*config\.conversationStarterIcons\.filter\(\(_, itemIndex\) => itemIndex !== index\)/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /saveLabel=\{conversationStarterDialogValue\.length > 0 \? "Save" : "Add"\}/u);
});

test("Studio agent config panel wires the subagents experience into AgentConfigFields", () => {
	// Panel consumes the subagents hook and routes edits through the active config
	// (base agent or selected subagent) rather than the raw draft.
	assert.match(
		AGENT_CONFIG_PANEL_SOURCE,
		/import \{ useAgentConfigSubagents \} from "@\/components\/projects\/studio\/hooks\/use-agent-config-subagents";/u,
	);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /useAgentConfigSubagents\(\{ draft, updateDraft \}\)/u);
	// Subagent switcher + per-subagent editing props are passed to the shared
	// AgentConfigFields (in-panel nav button for managing the subagents list).
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /profileConfig=\{baseConfig\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onProfileTextChange=\{handleBaseTextChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onManageSubagents=\{\(\) => setIsManageSubagentsOpen\(true\)\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onSelectListItem=\{handleSelectListItem\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /selectedListItemIndexByField=\{\{ subagents: selectedSubagentIndex \}\}/u);
	// The subagent name + trigger condition are edited in the profile header now
	// (the old lower SubagentPromptFields rows were removed to avoid duplication).
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /SubagentPromptFields/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /subagentName=\{activePrompt\?\.triggerName\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onSubagentNameChange=\{handleTriggerNameChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /subagentCondition=\{activePrompt\?\.condition\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onSubagentConditionChange=\{handleConditionChange\}/u);
	// The floating SubagentsNavigator is also rendered so users can quickly swap
	// between the base agent and its subagents (self-hides when there are none).
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ SubagentsNavigator \} from "@\/components\/blocks\/subagents\/subagents-navigator";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<SubagentsNavigator[\s\S]*activeSubagentId=\{activeSubagentId\}[\s\S]*baseAgent=\{navigatorBaseAgent\}[\s\S]*onSelectBaseAgent=\{selectBaseAgent\}[\s\S]*onSelectSubagent=\{selectSubagent\}[\s\S]*subagents=\{subagentPrompts\}/u);
	// Base name/description always edit the base agent, even while a subagent is selected.
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleBaseTextChange = useCallback\([\s\S]*updateDraft\(\{ description: value, summary: value \}\)/u);
});

test("Subagents hook persists prompts on the draft and derives the subagents chip list", () => {
	// Prompts live on the draft (persisted), not in throwaway local state.
	assert.match(SUBAGENTS_HOOK_SOURCE, /draft\.subagentPrompts \?\? \[\]/u);
	assert.match(SUBAGENTS_HOOK_SOURCE, /subagentPrompts: nextPrompts as unknown as RovoAgentSubagentPrompt\[\]/u);
	// The base `subagents` chip list is always derived from prompt trigger names.
	assert.match(SUBAGENTS_HOOK_SOURCE, /subagents: getDerivedSubagentNames\(nextPrompts\)/u);
	assert.match(SUBAGENTS_HOOK_SOURCE, /getBaseConfigWithSubagents\(draft as unknown as AgentConfigFormValue, subagentPrompts\)/u);
	// Removing the active subagent resets the selection back to the base agent.
	assert.match(SUBAGENTS_HOOK_SOURCE, /if \(promptToRemove\.id === activeSubagentId\)\s*\{\s*startTransition\(\(\) => setActiveSubagentId\(null\)\);/u);
	// Removal uses the same derived-index -> prompt-id mapping as selection, so
	// duplicate trigger names do not delete the wrong prompt.
	assert.match(SUBAGENTS_HOOK_SOURCE, /const promptToRemove = derivedSubagentPrompts\[index\];[\s\S]*subagentPrompts\.filter\(\(prompt\) => prompt\.id !== promptToRemove\.id\)/u);
	assert.doesNotMatch(SUBAGENTS_HOOK_SOURCE, /const triggerName = getDerivedSubagentNames\(subagentPrompts\)\[index\]/u);
	// Reuses the shared helpers extracted from the demo block.
	assert.match(
		SUBAGENTS_HOOK_SOURCE,
		/from "@\/components\/blocks\/subagents\/lib\/subagent-prompts"/u,
	);
	// Shared draft shape declares the persisted prompts.
	assert.match(ROVO_UI_MESSAGES_SOURCE, /export interface RovoAgentSubagentPrompt/u);
	assert.match(ROVO_UI_MESSAGES_SOURCE, /subagentPrompts\?: RovoAgentSubagentPrompt\[\]/u);
	// Extracted helper creates an empty, draft prompt copy.
	assert.match(SUBAGENT_PROMPTS_LIB_SOURCE, /export function createDraftSubagentPrompt/u);
	assert.match(SUBAGENT_PROMPTS_LIB_SOURCE, /export function getDerivedSubagentNames/u);
});

test("Studio agent test conversation starters use contextual visual identity tiles", () => {
	assert.match(ROVO_SUGGESTIONS_SOURCE, /export function resolveConversationStarterVisualIdentity/u);
	assert.match(ROVO_SUGGESTIONS_SOURCE, /resolveGenerativeCardIdentity\(\{[\s\S]*contentType: hint\.contentType[\s\S]*iconHint: hint\.iconHint[\s\S]*title: input\.label[\s\S]*\}\)/u);
	assert.match(ROVO_SUGGESTIONS_SOURCE, /automation-ready\|markdown\|yaml\|sql/u);
	assert.match(ROVO_SUGGESTIONS_SOURCE, /jira\|jsm\|request\|ticket\|issue\|incident\|priority\|sla\|routing\|triage/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /from "@\/components\/blocks\/conversation-starters";/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /resolveConversationStarterVisualIdentity/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const starterIcons = getPayloadStringArray\(payload, \["conversationStarterIcons", "starterIcons", "suggestionIcons"\]\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /icon: getStarterIcon\(\(iconKey as StarterIconKey \| undefined\) \?\? DEFAULT_STARTER_ICON\)/u);
	assert.match(SHELL_SOURCE, /from "@\/components\/blocks\/conversation-starters";/u);
	assert.match(SHELL_SOURCE, /const conversationStarterIcons = Array\.isArray\(agentResult\.conversationStarterIcons\)[\s\S]*agentResult\.conversationStarterIcons/u);
	assert.match(SHELL_SOURCE, /icon: getStarterIcon\(\(conversationStarterIcons\[index\] as StarterIconKey \| undefined\) \?\? DEFAULT_STARTER_ICON\)/u);
	assert.match(ROVO_CONTEXT_SOURCE, /resolveConversationStarterVisualIdentity/u);
	assert.match(ROVO_CONTEXT_SOURCE, /from "@\/components\/blocks\/conversation-starters";/u);
	assert.match(ROVO_CONTEXT_SOURCE, /function getAgentResultStarterIconKeys\(payload: AgentResultPayload\): string\[\] \{[\s\S]*"conversationStarterIcons", "starterIcons", "suggestionIcons"/u);
	assert.match(ROVO_CONTEXT_SOURCE, /starterIcons: getAgentResultStarterIconKeys\(payload\)/u);
	assert.match(ROVO_CONTEXT_SOURCE, /icon: getStarterIcon\(\(iconKey as StarterIconKey \| undefined\) \?\? DEFAULT_STARTER_ICON\)/u);
	assert.match(ROVO_CONTEXT_SOURCE, /visualIdentity: resolveConversationStarterVisualIdentity\(\{[\s\S]*agentName: context\.agentName[\s\S]*label,[\s\S]*\}\)/u);
});

test("Chat greeting custom-agent starters prefer explicit icons and fall back to AI chat", () => {
	// Managed conversation starters pass explicit icon components from the
	// config panel. Older/iconless starters keep the neutral "ai-chat" fallback.
	assert.match(CHAT_GREETING_SOURCE, /const CUSTOM_AGENT_STARTER_ICON_NAME = "ai-chat";/u);
	assert.match(CHAT_GREETING_SOURCE, /const IconComponent = suggestion\.icon;/u);
	assert.match(CHAT_GREETING_SOURCE, /IconComponent \? \(\s*<IconComponent label=\{suggestion\.label\} color=\{token\("color\.icon\.subtle"\)\} \/>/u);
	assert.doesNotMatch(CHAT_GREETING_SOURCE, /resolveConversationStarterVisualIdentity/u);
	assert.doesNotMatch(CHAT_GREETING_SOURCE, /CardIdentityTile/u);
	assert.match(
		CHAT_GREETING_SOURCE,
		/<VisualIdentityTile[\s\S]*visualIdentity=\{\{ iconName: CUSTOM_AGENT_STARTER_ICON_NAME, tileVariant: "gray" \}\}/u,
	);
});

test("Studio screen assistant applies draft patches without publishing agents", () => {
	assert.match(SHELL_SOURCE, /onToolCall: useCallback/u);
	assert.match(SHELL_SOURCE, /normalizeAgentDraftPatch/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.updateSessionAgentDraft/u);
	const applyAgentDraftPatchIndex = SHELL_SOURCE.indexOf('case "apply_agent_draft_patch":');
	assert.notEqual(applyAgentDraftPatchIndex, -1);
	const screenAssistantHandlerSource = SHELL_SOURCE.slice(
		applyAgentDraftPatchIndex,
		SHELL_SOURCE.indexOf("default:", applyAgentDraftPatchIndex),
	);
	assert.match(screenAssistantHandlerSource, /case "apply_agent_draft_patch"/u);
	assert.match(screenAssistantHandlerSource, /activeSessionAgentEntry\.profile\.id/u);
	assert.doesNotMatch(screenAssistantHandlerSource, /publishSessionAgent/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /data-screen-assistant-target="studio-agent-config-panel"/u);
	assert.match(AGENT_BLOCK_SOURCE, /screenAssistantTargetPrefix/u);
	assert.match(AGENT_BLOCK_SOURCE, /data-agent-field="instructions"/u);
});

test("Studio clarification answers keep agent creation mode active", () => {
	// Continuation context builder now lives in the lib; the shell looks up the
	// per-thread template provenance and passes it (plus the domain-scoped category
	// ids) into the continuation context.
	assert.match(SHELL_SOURCE, /buildStudioAgentCreationContinuationContext\(studioCreationTemplate, \{/u);
	assert.match(SHELL_SOURCE, /const getStudioAgentCreationClarificationOptions = useCallback/u);
	assert.match(SHELL_SOURCE, /activeQuestionCard\?\.creationMode === "agent" \|\|[\s\S]*studioAgentCreationThreadKeysRef\.current\.has\(chat\.runtimeThreadId\)/u);
	assert.match(SHELL_SOURCE, /hasPersistedAgentCreationPrompt/u);
	assert.match(SHELL_SOURCE, /message\.metadata\?\.creationMode === "agent"/u);
	assert.match(SHELL_SOURCE, /creationMode: "agent" as const/u);
	assert.match(SHELL_SOURCE, /submitClarification\([\s\S]*activeQuestionCard,[\s\S]*omitDomainScopeAnswer\(answers\),[\s\S]*\.\.\.getStudioAgentCreationClarificationOptions\(categoryIds\),[\s\S]*onSubmitted: hideQuestionCard/u);
	assert.match(SHELL_SOURCE, /setSubmittingQuestionCardKey\(questionCardKey\);/u);
	assert.match(SHELL_SOURCE, /onDismissQuestionCard: handleCancelClarificationQuestionSet/u);
});

test("Studio hides resolved question-card trace after rendering answer summary", () => {
	assert.match(MESSAGES_SOURCE, /const shouldSuppressResolvedQuestionTrace =[\s\S]*shouldHideResolvedQuestionCard[\s\S]*hasAnsweredQuestionToolCalls[\s\S]*visibleThinkingToolCalls\.length === 0[\s\S]*!isResponseInFlight;/u);
	assert.match(MESSAGES_SOURCE, /const thinkingActive = thinkingTraceState\.thinkingActive && !shouldSuppressResolvedQuestionTrace;/u);
});

test("Studio threads template provenance into agent creation contexts", () => {
	// Browse-all dialog and bento starters both carry distilled template
	// provenance into the gallery select handler.
	assert.match(SHELL_SOURCE, /buildCreationTemplateContextFromAgent\(agent\)/u);
	assert.match(SHELL_SOURCE, /onSelect\(template\.prompt, buildCreationTemplateContextFromStarter\(template\)\)/u);
	assert.match(SHELL_SOURCE, /onSelect: \(prompt: string, template\?: StudioCreationTemplateContext\) => void;/u);
	assert.match(SHELL_SOURCE, /Use the \$\{agent\.name\} template to create a Rovo agent/u);
	assert.doesNotMatch(SHELL_SOURCE, /Use the \$\{agent\.name\} template to create a Studio agent/u);
	// The pending selection is held in a ref and consumed on submit; the active
	// creation thread keeps its template for the clarification continuation.
	assert.match(SHELL_SOURCE, /const creationTemplateRef = useRef<StudioCreationTemplateContext \| null>\(null\);/u);
	assert.match(SHELL_SOURCE, /const creationTemplateByThreadRef = useRef<Record<string, StudioCreationTemplateContext>>\(\{\}\);/u);
	assert.match(SHELL_SOURCE, /creationTemplateRef\.current = template \?\? null;/u);
	assert.match(SHELL_SOURCE, /setAgentTemplatesDialogOpen\(false\);[\s\S]*setIsSidebarAgentBrowserOpen\(false\);/u);
	assert.match(SHELL_SOURCE, /creationTemplateByThreadRef\.current\[chat\.runtimeThreadId\] = creationTemplate;/u);
	assert.match(SHELL_SOURCE, /creationTemplateRef\.current = null;/u);
});

test("Studio composer reveals 'Start from scratch' on hover or prompt value and lands on a blank untitled agent config", () => {
	// Composer reveals the affordance underneath the prompt input on hover or once
	// the prompt has content; autofocus alone should not show the micro label.
	assert.match(COMPOSER_SOURCE, /onStartFromScratch\?: \(\) => void;/u);
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /const \[isComposerHoverActive, setIsComposerHoverActive\] = useState\(false\);/u);
	assert.match(COMPOSER_SOURCE, /const hasPromptValue = textValue\.trim\(\)\.length > 0;/u);
	assert.match(COMPOSER_SOURCE, /useRovoAppComposerReveal\(\{ hasPromptValue \}\)/u);
	assert.match(COMPOSER_SOURCE, /onFocus=\{\(\) => \{[\s\S]*replayRevealTraces\(\);[\s\S]*\}\}/u);
	assert.match(COMPOSER_REVEAL_HOOK_SOURCE, /const isRevealVisible = hasPromptValue \|\| isComposerHoverActive;/u);
	assert.doesNotMatch(COMPOSER_REVEAL_HOOK_SOURCE, /isInputFocused/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /setInputFocused/u);
	assert.match(COMPOSER_SOURCE, /\{onStartFromScratch \? \([\s\S]*\{isRevealVisible \?/u);
	// Reveal copy: default is "Or start from scratch"; when onBrowseTemplates is
	// provided (bento dismissed) it becomes "Browse template or start from scratch".
	assert.match(COMPOSER_SOURCE, /onClick=\{onBrowseTemplates\}[\s\S]*Browse\{" "\}[\s\S]*templates/u);
	assert.match(COMPOSER_SOURCE, /onClick=\{onStartFromScratch\}[\s\S]*start from\{" "\}[\s\S]*scratch/u);
	// Reveal is taken out of layout flow so it never reflows/recenters siblings.
	assert.match(COMPOSER_SOURCE, /className="absolute inset-x-0 top-full/u);
	// Footer-style copy: subtle text size + color.
	assert.match(COMPOSER_SOURCE, /text-xs text-text-subtlest/u);
	// Click must survive the textarea blur so the reveal isn't unmounted first.
	assert.match(COMPOSER_SOURCE, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/u);

	// Shell wires the affordance to a from-scratch agent registration that opens the config pane.
	assert.match(SHELL_SOURCE, /const handleStartAgentFromScratch = useCallback\(\(\) => \{/u);
	// New agents (from-scratch and AI-generated) pick a random avatar from the
	// shared full avatar set, which also randomizes the accent color since each
	// avatar family shares one brand color.
	assert.match(SHELL_SOURCE, /import \{ getRandomAgentAvatarSrc \} from "@\/lib\/agent-avatars";/u);
	assert.match(SHELL_SOURCE, /action: "create",\s*\n\s*agentId: `untitled-agent-\$\{uniqueSuffix\}`,\s*\n\s*avatarSrc: getRandomAgentAvatarSrc\(\)/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.registerCreatedAgentFromResult\(blankAgentResult/u);
	// The reveal is a from-scratch agent-creation CTA, so it is wired only on the
	// default agents landing (isDefaultAgentHomeState). On thread/custom-agent/
	// artifact views the prop is undefined, so the composer renders no reveal even
	// on hover/focus.
	assert.match(SHELL_SOURCE, /onStartFromScratch=\{isDefaultAgentHomeState \? handleStartAgentFromScratch : undefined\}/u);
	// The from-scratch handler opens the same config pane the AI-result flow uses.
	const fromScratchHandlerSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleStartAgentFromScratch = useCallback"),
		SHELL_SOURCE.indexOf("const handleStudioSidebarAgentSelect = useCallback"),
	);
	assert.match(fromScratchHandlerSource, /setActiveAgentConfigState\(\{\s*\n\s*profileId: registered\.id/u);
	assert.match(fromScratchHandlerSource, /setActiveAgentConfigView\("configure"\);[\s\S]*openAgentCreationAskRovoChat\(\);/u);
});

// Regression: re-opening a custom agent (sidebar row / "Edit") must NOT point
// chat at the custom agent. It opens the config pane only and leaves the Ask Rovo
// build helper on the default Rovo agent, exactly like create-from-scratch — so
// the panel no longer "swaps" onto the custom agent on the second click.
test("Studio re-selecting a custom agent edits it without selecting it for chat", () => {
	const sidebarSelectSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleStudioSidebarAgentSelect = useCallback"),
		SHELL_SOURCE.indexOf("const handleDeleteStudioAgent = useCallback"),
	);
	// Opens the config pane on the agent...
	assert.match(sidebarSelectSource, /setActiveAgentConfigState\(\{\s*\n\s*profileId: agentId,/u);
	assert.match(sidebarSelectSource, /setActiveAgentConfigView\("configure"\);/u);
	// ...but never selects it for chat.
	assert.doesNotMatch(sidebarSelectSource, /selectAgent/u);

	// The browse picker only selects-for-chat on the non-editable branch (a
	// genuine "chat with this built-in agent"); editable custom agents open the
	// config pane and keep the Ask Rovo helper.
	const browseSelectSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleSidebarBrowseAgentSelect = useCallback"),
		SHELL_SOURCE.indexOf("const handleUpdateAgentDraft = useCallback"),
	);
	assert.match(
		browseSelectSource,
		/if \(studioAgentRegistry\.getSessionAgentEntry\?\.\(agent\.id\)\) \{[\s\S]*setActiveAgentConfigState\(\{[\s\S]*\} else \{[\s\S]*studioAgentRegistry\.selectAgent\(agent\.id, \{ preserveCurrentThread: true \}\);/u,
	);
});

test("Studio composer opts into experimental dark composer CTAs", () => {
	assert.match(COMPOSER_SOURCE, /screenAssistantTargetPrefix="studio-composer"/u);
	assert.match(COMPOSER_SOURCE, /className=\{cn\("relative z-10 mx-auto", fillWidth \? FLOATING_COMPOSER_SESSION_MAX_WIDTH_CLASS : FLOATING_COMPOSER_MAX_WIDTH_CLASS\)\}/u);
	assert.match(COMPOSER_SOURCE, /experimentalDarkCta/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /voiceStartButtonClassName="bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /submitButtonClassName="bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"/u);
});

test("deleting a thread also unmarks any in-progress agent-creation tracking", () => {
	// Regression: deleting an in-progress agent left the thread in
	// studioAgentCreationThreadIds after chat.threads dropped it, so the memo
	// re-rendered it as a ghost "Agent creation" row that lingered forever.
	const onDeleteThreadSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("onDeleteThread={async (threadId) => {"),
		SHELL_SOURCE.indexOf("onNewChat={handleReturnToAgentsHome}"),
	);
	assert.match(onDeleteThreadSource, /unmarkStudioAgentCreationThread\(threadId\);/u);
	assert.match(onDeleteThreadSource, /void chat\.deleteThread\(threadId\);/u);
});
