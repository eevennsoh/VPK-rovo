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
const AGENT_TEST_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-agent-test-panel.tsx"),
	"utf8",
);
const CHAT_PANEL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/sidebar-chat/page.tsx"),
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
	// The creation-context builders moved to a testable lib (their prompt copy is
	// asserted in studio-agent-creation-context.test.js). The shell imports them
	// and calls the initial builder with the brief plus any template provenance.
	assert.match(SHELL_SOURCE, /buildStudioAgentCreationContext,/u);
	assert.match(SHELL_SOURCE, /from "@\/components\/projects\/studio\/lib\/studio-agent-creation-context";/u);
	assert.match(SHELL_SOURCE, /buildStudioAgentCreationContext\(text, creationTemplate\)/u);
	assert.match(SHELL_SOURCE, /const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected;/u);
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
	assert.match(SHELL_SOURCE, /onViewAllAgents=\{handleReturnToAgentsHome\}/u);
	assert.doesNotMatch(SHELL_SOURCE, /rovo-app-agents-directory/u);
});

test("Studio agent edit surfaces share the session-agent display name", () => {
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /getStudioSessionAgentDisplayName/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const agentName = getStudioSessionAgentDisplayName\(entry\);/u);
	assert.match(SHELL_SOURCE, /getStudioSessionAgentDisplayName/u);
	assert.match(SHELL_SOURCE, /const agentName = getStudioSessionAgentDisplayName\(activeSessionAgentEntry\);/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /draft\.name\?\.trim\(\) \|\| entry\.profile\.name/u);
	assert.doesNotMatch(SHELL_SOURCE, /draftResult\?\.name\?\.trim\(\) \|\| profile\.name/u);
});

test("Studio lands generated agents in the Test tab without opening Ask Rovo", () => {
	// The navigation hook still exposes deterministic chat controls for the
	// separate Ask Rovo surface, but generated-agent testing is tab-local now.
	assert.match(NAV_HOOK_SOURCE, /const \{ toggleChat, openChat, chatSurface \} = useRovoChat\(\);/u);
	assert.match(NAV_HOOK_SOURCE, /\n\t\topenChat,\n/u);

	// The agent-result handler selects the Test tab for both registration paths
	// without opening the right-side edit chat.
	assert.ok(
		(SHELL_SOURCE.match(/setActiveAgentConfigView\("test"\);/gu) ?? []).length >= 2,
		"both registration success paths should land in the Test tab",
	);
	const agentResultSelectSource = SHELL_SOURCE.slice(
		SHELL_SOURCE.indexOf("const handleStudioAgentResultSelect = useCallback"),
		SHELL_SOURCE.indexOf("// \"Start from scratch\""),
	);
	assert.doesNotMatch(agentResultSelectSource, /nav\.openChat\("sidebar"\)|nav\.toggleChat/u);
	assert.match(SHELL_SOURCE, /\[chat\.activeThreadId, chat\.runtimeThreadId, studioAgentRegistry\]/u);
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
	assert.match(UI_CUSTOM_AGENT_SOURCE, /layout\?: "default" \| "compact";/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /readViewClassName="relative h-auto overflow-visible border-2 bg-transparent px-0 py-1 text-2xl leading-7 font-semibold hover:bg-transparent active:bg-transparent focus:border-border-focused focus-visible:border-border-focused focus-visible:bg-transparent"/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /inputProps=\{\{ className: "h-auto border-2 px-1\.5 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" \}\}/u);
	assert.match(UI_CUSTOM_AGENT_SOURCE, /textareaProps=\{\{ rows: 1, className: "min-h-10 border-2 bg-bg-neutral-subtle px-1\.5 focus:border-ring focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-\[variant=default\]:border-transparent data-\[variant=default\]:focus:border-ring data-\[variant=default\]:focus-visible:border-ring" \}\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /AgentConfigFields/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /config=\{draft\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /layout="compact"/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /onTextChange=\{handleConfigTextChange\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /AgentCompactHeaderNav,/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /import \{ Lozenge \} from "@\/components\/ui\/lozenge";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ Tabs, TabsContent \} from "@\/components\/ui\/tabs";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /export type AgentConfigView = "configure" \| "test";/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /function getPublishLabel/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /leadingContent=\{<AgentCompactHeaderNav avatarSrc=\{agentAvatarSrc\} \/>\}/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /function AgentConfigActionButton/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /function AgentConfigToggleItem/u);
	// The disabled Test item is a plain ToggleGroupItem (no Tooltip wrapper) so the
	// ToggleGroup renders as joined segments instead of separate pills.
	assert.ok(!AGENT_CONFIG_PANEL_SOURCE.includes('TooltipTrigger render={<span className="inline-flex" />}'));
	// The Update button is removed from the studio header; only the Configure/Test
	// toggle group and Publish remain (consistent with the reusable AgentHeader).
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /disabledTooltip="Make a change to the agent before updating the testing version\."/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /data-testid="agent-config-update"/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /hasAgentInstructions/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<Tabs[\s\S]*onValueChange=\{handleViewChange\}[\s\S]*value=\{activeView\}/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<ToggleGroup[\s\S]*aria-label="Agent config views"[\s\S]*variant="outline"[\s\S]*value=\{\[activeView\]\}[\s\S]*<ToggleGroupItem[\s\S]*value="configure"[\s\S]*Configure[\s\S]*<\/ToggleGroupItem>[\s\S]*<ToggleGroupItem[\s\S]*value="test"[\s\S]*data-testid="agent-config-test"[\s\S]*Test[\s\S]*<\/ToggleGroupItem>[\s\S]*<\/ToggleGroup>/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /disabled=\{!hasAgentInstructions\}/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /aria-label="Agent config views"[\s\S]{0,160}size="sm"/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /<TabsList>|<TabsTrigger/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<TabsContent value="configure"[\s\S]*<AgentConfigFields/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<TabsContent value="test"[\s\S]*\{testPanel\}/u);
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
	assert.match(SHELL_SOURCE, /<RovoAppAgentConfigPanel[\s\S]*testPanel=\{agentConfigTestPanel\}[\s\S]*chatContextBar=\{agentEditContextBar\}[\s\S]*onUpdateDraft=\{handleUpdateAgentDraft\}[\s\S]*\/>/u);
	assert.doesNotMatch(SHELL_SOURCE, /<RovoAppAgentConfigPanel[\s\S]*chatGreeting=/u);
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
	assert.match(SHELL_SOURCE, /<ChatPanel[\s\S]*onClose=\{nav\.toggleChat\}[\s\S]*abortOnUnmount=\{false\}[\s\S]*chatContextBar=\{agentEditContextBar\}[\s\S]*containerStyle=\{\{ borderRadius: 0, borderWidth: 0 \}\}[\s\S]*\/>/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const \{ chatSurface, openChat, resetAgentToRovo \} = useRovoChat\(\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /const handleOpenFloatingRovoChat = useCallback\(\(\) => \{[\s\S]*resetAgentToRovo\(\);[\s\S]*openChat\("floating"\);[\s\S]*\}, \[openChat, resetAgentToRovo\]\);/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<FloatingRovoButton ariaLabel="Open Rovo chat" product="home" onButtonClick=\{handleOpenFloatingRovoChat\} \/>/u);
	assert.match(AGENT_CONFIG_PANEL_SOURCE, /<RovoFloatingChat[\s\S]*chatContextBar=\{chatContextBar\}[\s\S]*hideComposerSourceAndModelControls=\{Boolean\(chatContextBar\)\}[\s\S]*\/>/u);
	assert.doesNotMatch(AGENT_CONFIG_PANEL_SOURCE, /chatGreeting|greeting=\{chatGreeting\}/u);
	assert.match(SHELL_SOURCE, /<SidebarResizeHandle[\s\S]*side="left"[\s\S]*askRovoChatResize\.onResizeHandlePointerDown/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /export function AgentTestPanel/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /aria-label="Agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /data-testid="agent-test-panel"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /containerClassName="mx-auto h-full min-h-0 w-full max-w-\[800px\] overflow-visible py-4"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /containerStyle=\{\{ borderRadius: 0, borderWidth: 0, overflow: "visible" \}\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /greetingSelectedAgent=\{testAgentProfile\}/u);
	assert.match(CHAT_PANEL_SOURCE, /greetingSelectedAgent\?: RovoAgentProfile \| null;/u);
	assert.match(CHAT_PANEL_SOURCE, /selectedAgent=\{greetingSelectedAgent \?\? selectedAgent\}/u);
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
	// Continuation context builder now lives in the lib; the shell looks up the
	// per-thread template provenance and passes it into the continuation context.
	assert.match(SHELL_SOURCE, /buildStudioAgentCreationContinuationContext\(threadTemplate\)/u);
	assert.match(SHELL_SOURCE, /const getStudioAgentCreationClarificationOptions = useCallback/u);
	assert.match(SHELL_SOURCE, /creationMode: "agent" as const/u);
	assert.match(SHELL_SOURCE, /submitClarification\([\s\S]*activeQuestionCard,[\s\S]*answers,[\s\S]*getStudioAgentCreationClarificationOptions\(\),/u);
	assert.match(SHELL_SOURCE, /onDismissQuestionCard: handleCancelClarificationQuestionSet/u);
});

test("Studio threads template provenance into agent creation contexts", () => {
	// Browse-all dialog and bento starters both carry distilled template
	// provenance into the gallery select handler.
	assert.match(SHELL_SOURCE, /buildCreationTemplateContextFromAgent\(agent\)/u);
	assert.match(SHELL_SOURCE, /onSelect\(template\.prompt, buildCreationTemplateContextFromStarter\(template\)\)/u);
	assert.match(SHELL_SOURCE, /onSelect: \(prompt: string, template\?: StudioCreationTemplateContext\) => void;/u);
	// The pending selection is held in a ref and consumed on submit; the active
	// creation thread keeps its template for the clarification continuation.
	assert.match(SHELL_SOURCE, /const creationTemplateRef = useRef<StudioCreationTemplateContext \| null>\(null\);/u);
	assert.match(SHELL_SOURCE, /const creationTemplateByThreadRef = useRef<Record<string, StudioCreationTemplateContext>>\(\{\}\);/u);
	assert.match(SHELL_SOURCE, /creationTemplateRef\.current = template \?\? null;/u);
	assert.match(SHELL_SOURCE, /creationTemplateByThreadRef\.current\[chat\.runtimeThreadId\] = creationTemplate;/u);
	assert.match(SHELL_SOURCE, /creationTemplateRef\.current = null;/u);
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

test("Studio composer opts into experimental dark composer CTAs", () => {
	assert.match(COMPOSER_SOURCE, /screenAssistantTargetPrefix="studio-composer"/u);
	assert.match(COMPOSER_SOURCE, /className="relative z-10 mx-auto max-w-\[600px\]"/u);
	assert.match(COMPOSER_SOURCE, /experimentalDarkCta/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /voiceStartButtonClassName="bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /submitButtonClassName="bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"/u);
});
