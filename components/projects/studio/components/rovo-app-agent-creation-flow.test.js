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
const AGENT_CONFIG_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-agent-config-panel.tsx"),
	"utf8",
);
const UI_CUSTOM_AGENT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui-custom/agent.tsx"),
	"utf8",
);
const NAV_HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/top-navigation/hooks/use-top-navigation.ts"),
	"utf8",
);
const COMPOSER_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-composer.tsx"),
	"utf8",
);

test("RovoAppShell starts Studio agent creation only from the default-agent home composer", () => {
	assert.match(SHELL_SOURCE, /const DEFAULT_COMPOSER_PLACEHOLDER = "Describe the agent you want to build";/u);
	assert.match(SHELL_SOURCE, /function buildStudioAgentCreationContext\(originalBrief: string\): string/u);
	assert.match(SHELL_SOURCE, /\[Studio Agent Creation Request\]/u);
	assert.match(SHELL_SOURCE, /"Source: \/studio prompt input\."/u);
	assert.match(SHELL_SOURCE, /"Original user brief:"/u);
	assert.match(SHELL_SOURCE, /Required agent profile fields/u);
	assert.match(SHELL_SOURCE, /- agentId: stable kebab-case slug/u);
	assert.match(SHELL_SOURCE, /- conversationStarters: 3 starter prompts/u);
	assert.doesNotMatch(SHELL_SOURCE, /conversationStarters: 2.{1,3}4 starter prompts/u);
	assert.match(SHELL_SOURCE, /Clarification rule: Use the existing ask_user_questions\/question-card flow/u);
	assert.match(SHELL_SOURCE, /Expected output: build the agent profile now and emit exactly one structured AGENT_RESULT marker/u);
	assert.match(SHELL_SOURCE, /const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected;/u);
	assert.match(SHELL_SOURCE, /const shouldStartStudioAgentCreation = isDefaultAgentHomeStateRef\.current && !isRealtimeActive;/u);
	assert.match(SHELL_SOURCE, /\.\.\.\(shouldStartStudioAgentCreation \? \{ creationMode: "agent" as const \} : \{\}\)/u);
	assert.ok((SHELL_SOURCE.match(/creationMode: "agent"/gu) ?? []).length >= 1);
});

test("Studio start-from-scratch scribble replays on each composer hover reveal", () => {
	assert.match(COMPOSER_SOURCE, /const \[scratchScribbleReplayKey, setScratchScribbleReplayKey\] = useState\(0\);/u);
	assert.match(COMPOSER_SOURCE, /setScratchScribbleReplayKey\(\(currentKey\) => currentKey \+ 1\);/u);
	assert.match(COMPOSER_SOURCE, /const showScratchScribble = isRevealVisible;/u);
	assert.match(COMPOSER_SOURCE, /resetKey=\{scratchScribbleReplayKey\}/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /scribbleConsumed/u);
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

	assert.match(SHELL_SOURCE, /prompt: "Build a Studio agent named Product Requirements Guide/u);
	assert.match(SHELL_SOURCE, /prompt: "Build a Studio agent named Rovo Expert/u);
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

test("Studio home bento keeps tab auto-cycle active after manual tab selection", () => {
	assert.match(SHELL_SOURCE, /const cycleRunning = !shouldReduceMotion && !browseOpen;/u);
	assert.match(SHELL_SOURCE, /const bentoInteractingRef = useRef\(false\);/u);
	assert.match(SHELL_SOURCE, /const updateBentoInteracting = useCallback\(\(interacting: boolean\) => \{[\s\S]*bentoInteractingRef\.current = interacting;[\s\S]*setBentoInteracting\(interacting\);[\s\S]*\}, \[\]\);/u);
	assert.match(SHELL_SOURCE, /const selectHomeStarterCategory = useCallback\(\(category: HomeStarterCategory\) => \{[\s\S]*setActiveCategory\(category\);[\s\S]*\}, \[\]\);/u);
	assert.match(SHELL_SOURCE, /if \(bentoInteractingRef\.current\) \{[\s\S]*controls\.pause\(\);[\s\S]*\}[\s\S]*cycleControlsRef\.current = controls;/u);
	assert.doesNotMatch(SHELL_SOURCE, /setCycleEnabled\(false\)/u);
});

test("Studio chat header is hidden until a chat is active", () => {
	assert.match(SHELL_SOURCE, /const shouldShowChatHeader = visibleMessages\.length > 0 \|\| hasActiveThreadRun \|\| chat\.isStreaming;/u);
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
	assert.match(SHELL_SOURCE, /const agentResult = getMessageAgentResult\(message\);/u);
	assert.match(SHELL_SOURCE, /if \(handleStudioAgentResultSelect\(agentResult, \{ sourceMessageId: message\.id \}\)\) \{[\s\S]*handledAgentResultKeysRef\.current\.add\(agentResultKey\);/u);
	assert.match(SHELL_SOURCE, /const unmarkStudioAgentCreationThread = useCallback[\s\S]*studioAgentCreationThreadKeysRef\.current\.delete\(threadId\);/u);
	assert.match(SHELL_SOURCE, /unmarkStudioAgentCreationThread\(chat\.runtimeThreadId\);/u);
	assert.match(SHELL_SOURCE, /import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u);
	assert.match(SHELL_SOURCE, /sessionAgentEntries=\{studioAgentRegistry\.sessionAgentEntries\}/u);
	assert.match(SHELL_SOURCE, /sessionAgents=\{studioAgentRegistry\.sessionAgentEntries\.map\(\(entry\) => entry\.profile\)\}/u);
	assert.match(SHELL_SOURCE, /agents=\{ROVO_DIRECTORY_AGENT_PROFILES\}/u);
	assert.match(SHELL_SOURCE, /selectedAgentId=\{studioAgentRegistry\.selectedAgentId\}/u);
	assert.match(SHELL_SOURCE, /onSelectAgent=\{handleStudioSidebarAgentSelect\}/u);
	assert.match(SHELL_SOURCE, /onViewAllAgents=\{\(\) => setIsSidebarAgentBrowserOpen\(true\)\}/u);
	assert.doesNotMatch(SHELL_SOURCE, /rovo-app-agents-directory/u);
});

test("Studio opens the sidebar chat once an agent finishes building", () => {
	// The navigation hook must expose a deterministic open (not just toggle),
	// otherwise an already-open sidebar would be closed on build completion.
	assert.match(NAV_HOOK_SOURCE, /const \{ toggleChat, openChat, chatSurface \} = useRovoChat\(\);/u);
	assert.match(NAV_HOOK_SOURCE, /\n\t\topenChat,\n/u);

	// The agent-result handler surfaces the sidebar chat (gated to non-embedded
	// shells) so the freshly selected agent is ready to test before publishing.
	assert.ok(
		(SHELL_SOURCE.match(/if \(!embedded\) \{\s*nav\.openChat\("sidebar"\);\s*\}/gu) ?? []).length >= 2,
		"both registration success paths should open the sidebar chat",
	);
	assert.match(SHELL_SOURCE, /\[chat\.activeThreadId, chat\.runtimeThreadId, studioAgentRegistry, nav, embedded\]/u);
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
});

test("Studio agent config panel renders the shared ui-custom agent config fields", () => {
	assert.match(UI_CUSTOM_AGENT_SOURCE, /export const AgentConfigFields = memo/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /const AGENT_AVATAR_PROFILE_COVER_COLORS: Record<string, string>/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /"product-agents": "#BF63F3"/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /function getAgentProfileCoverBackgroundColor\(avatarSrc: string \| undefined\): string/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /style=\{\{ backgroundColor: coverBackgroundColor \}\}/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Add triggers/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Add conversation starters/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Teamwork Graph/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /Describe the agent’s role and what it should do/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /readViewClassName="h-auto px-0 py-1 text-2xl leading-7 font-semibold focus:border-2 focus:border-border-focused focus-visible:border-2 focus-visible:border-border-focused"/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /inputProps=\{\{ className: "h-auto border-2 px-0 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" \}\}/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /textareaProps=\{\{ rows: 1, className: "min-h-10 bg-bg-neutral-subtle px-0 focus:border-2 focus:border-ring focus-visible:border-2 focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-\[variant=default\]:border-transparent data-\[variant=default\]:focus:border-ring data-\[variant=default\]:focus-visible:border-ring" \}\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /AgentConfigFields/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /config=\{draft\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onTextChange=\{handleConfigTextChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ Lozenge \} from "@\/components\/ui\/lozenge";/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /return status === "published" \? "Published" : "Draft";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<Lozenge[\s\S]*data-testid="agent-config-status-lozenge"[\s\S]*variant=\{entry\.publishStatus === "published" \? "success" : undefined\}[\s\S]*>\s*\{publishStatusLabel\}\s*<\/Lozenge>/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /function AgentConfigActionButton/u);
	assert.ok(AGENT_CONFIG_PANEL_SOURCE.includes('TooltipTrigger render={<span className="inline-flex" />}'));
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /disabledTooltip="Make a change to the agent before updating the testing version\."/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const hasAgentInstructions = Boolean\(draft\.instructions\?\.trim\(\)\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /data-testid="agent-config-test"/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /variant="outline"[\s\S]*onClick=\{handleTest\}[\s\S]*disabled=\{!hasAgentInstructions\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /disabledTooltip="Add agent instructions before testing this agent\."/u);
	assert.match(SHELL_SOURCE, /const handleTestAgent = useCallback/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.commitSessionAgentPublishReady\?\.\(profileId\);[\s\S]*nav\.openChat\("sidebar"\);/u);
	assert.match(SHELL_SOURCE, /onTest=\{handleTestAgent\}/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /<Label htmlFor=\{`agent-\$\{profileId\}-name`\}/u);
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
	assert.match(UI_CUSTOM_AGENT_SOURCE, /screenAssistantTargetPrefix/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /data-agent-field="instructions"/u);
});

test("Studio clarification answers keep agent creation mode active", () => {
	assert.match(SHELL_SOURCE, /function buildStudioAgentCreationContinuationContext\(\): string/u);
	assert.match(SHELL_SOURCE, /Source: \/studio prompt input clarification answer\./u);
	assert.match(SHELL_SOURCE, /Trigger: The user has answered the clarification questions/u);
	assert.match(SHELL_SOURCE, /Expected output: otherwise, create the reusable custom agent now and emit exactly one structured AGENT_RESULT marker/u);
	assert.match(SHELL_SOURCE, /const getStudioAgentCreationClarificationOptions = useCallback/u);
	assert.match(SHELL_SOURCE, /creationMode: "agent" as const/u);
	assert.match(SHELL_SOURCE, /submitClarification\([\s\S]*activeQuestionCard,[\s\S]*answers,[\s\S]*getStudioAgentCreationClarificationOptions\(\),/u);
	assert.match(SHELL_SOURCE, /onDismissQuestionCard: handleCancelClarificationQuestionSet/u);
});

test("Studio composer reveals 'Start from scratch' on focus or hover and lands on a blank untitled agent config", () => {
	// Composer reveals the affordance underneath the prompt input on focus or hover.
	assert.match(COMPOSER_SOURCE, /onStartFromScratch\?: \(\) => void;/u);
	assert.match(COMPOSER_SOURCE, /const \[isInputFocused, setIsInputFocused\] = useState\(false\);/u);
	assert.match(COMPOSER_SOURCE, /const \[isComposerHoverActive, setIsComposerHoverActive\] = useState\(false\);/u);
	assert.match(COMPOSER_SOURCE, /onFocus=\{\(\) => setIsInputFocused\(true\)\}/u);
	assert.match(COMPOSER_SOURCE, /onBlur=\{\(\) => setIsInputFocused\(false\)\}/u);
	assert.match(COMPOSER_SOURCE, /const isRevealVisible = isInputFocused \|\| isComposerHoverActive;/u);
	assert.match(COMPOSER_SOURCE, /\{onStartFromScratch \? \([\s\S]*\{isRevealVisible \?/u);
	assert.match(COMPOSER_SOURCE, /Or start from scratch/u);
	// Reveal is taken out of layout flow so it never reflows/recenters siblings.
	assert.match(COMPOSER_SOURCE, /className="absolute inset-x-0 top-full/u);
	// Footer-style copy: subtle text size + color.
	assert.match(COMPOSER_SOURCE, /text-xs text-text-subtlest/u);
	// Click must survive the textarea blur so the reveal isn't unmounted first.
	assert.match(COMPOSER_SOURCE, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/u);

	// Shell wires the affordance to a from-scratch agent registration that opens the config pane.
	assert.match(SHELL_SOURCE, /const handleStartAgentFromScratch = useCallback\(\(\) => \{/u);
	assert.match(SHELL_SOURCE, /const START_FROM_SCRATCH_AGENT_AVATAR_SRCS = \[/u);
	assert.match(SHELL_SOURCE, /"\/avatar-agent\/dev-agents\/wildcard-1\.svg"/u);
	assert.match(SHELL_SOURCE, /"\/avatar-agent\/product-agents\/wildcard-1\.svg"/u);
	assert.match(SHELL_SOURCE, /"\/avatar-agent\/service-agents\/wildcard-1\.svg"/u);
	assert.match(SHELL_SOURCE, /"\/avatar-agent\/strategy-agents\/wildcard-1\.svg"/u);
	assert.match(SHELL_SOURCE, /"\/avatar-agent\/teamwork-agents\/wildcard-1\.svg"/u);
	assert.match(SHELL_SOURCE, /function getRandomStartFromScratchAgentAvatarSrc\(\): string/u);
	assert.match(SHELL_SOURCE, /Math\.random\(\) \* START_FROM_SCRATCH_AGENT_AVATAR_SRCS\.length/u);
	assert.match(SHELL_SOURCE, /action: "create",\s*\n\s*agentId: `untitled-agent-\$\{uniqueSuffix\}`,\s*\n\s*avatarSrc: getRandomStartFromScratchAgentAvatarSrc\(\)/u);
	assert.match(SHELL_SOURCE, /studioAgentRegistry\.registerCreatedAgentFromResult\(blankAgentResult/u);
	assert.match(SHELL_SOURCE, /onStartFromScratch=\{handleStartAgentFromScratch\}/u);
	// The from-scratch handler opens the same config pane the AI-result flow uses.
	const fromScratchHandlerSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleStartAgentFromScratch = useCallback"),
		SHELL_SOURCE.indexOf("const handleStudioSidebarAgentSelect = useCallback"),
	);
	assert.match(fromScratchHandlerSource, /setActiveAgentConfig\(\{\s*\n\s*profileId: registered\.id/u);
});

test("Studio composer overrides the live voice start button to neutral bold", () => {
	assert.match(COMPOSER_SOURCE, /screenAssistantTargetPrefix="studio-composer"/u);
	assert.match(COMPOSER_SOURCE, /className="relative z-10 mx-auto max-w-\[600px\]"/u);
	assert.match(COMPOSER_SOURCE, /voiceStartButtonClassName="bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"/u);
});
