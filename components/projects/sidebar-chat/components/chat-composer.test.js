const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("compact chat sources selector opens a reasoning-free customize popover", () => {
	const source = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const popoverIndex = source.indexOf("<Popover open={isCustomizeMenuOpen} onOpenChange={handleCustomizeMenuOpenChange}>");
	const preferencesTriggerIndex = source.indexOf("<PopoverTrigger render={<PromptInputPreferencesButton aria-label=\"Customize\" />} />", popoverIndex);
	const customizeMenuIndex = source.indexOf("<CustomizeMenu", preferencesTriggerIndex);
	const showReasoningFalseIndex = source.indexOf("showReasoning={false}", customizeMenuIndex);
	const sendControlsIndex = source.indexOf("<ChatComposerSendControls", showReasoningFalseIndex);

	assert.notEqual(popoverIndex, -1);
	assert.ok(preferencesTriggerIndex > popoverIndex);
	assert.ok(customizeMenuIndex > preferencesTriggerIndex);
	assert.ok(showReasoningFalseIndex > customizeMenuIndex);
	assert.ok(sendControlsIndex > showReasoningFalseIndex);
	assert.match(source, /<RovoComposerSendControls/u);
	assert.doesNotMatch(source.slice(customizeMenuIndex, sendControlsIndex), /showSources=\{false\}/u);
});

test("compact chat animates sources and model selectors when edit-agent context toggles", () => {
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const sharedSendControls = readProjectFile("components/projects/shared/components/rovo-composer-send-controls.tsx");

	assert.match(sidebarComposer, /import \{ AnimatePresence, motion \} from "motion\/react";/u);
	assert.match(sidebarComposer, /setIsCustomizeMenuOpen\(false\);[\s\S]*setIsAutoMenuOpen\(false\);/u);
	assert.match(sidebarComposer, /<AnimatePresence initial=\{false\} mode="popLayout">[\s\S]*key="sources-selector"[\s\S]*initial=\{\{ opacity: 0, transform: "scale\(0\.8\)" \}\}[\s\S]*animate=\{\{ opacity: 1, transform: "scale\(1\)" \}\}[\s\S]*exit=\{\{ opacity: 0, transform: "scale\(0\.8\)" \}\}[\s\S]*<Popover open=\{isCustomizeMenuOpen\}/u);
	assert.match(sharedSendControls, /if \(hideReasoningSelector && open\) \{[\s\S]*onOpenChange\?\.\(false\);[\s\S]*\}/u);
	assert.match(sharedSendControls, /<AnimatePresence initial=\{false\} mode="popLayout">[\s\S]*key="reasoning-selector"[\s\S]*initial=\{\{ opacity: 0, transform: "scale\(0\.8\)" \}\}[\s\S]*animate=\{\{ opacity: 1, transform: "scale\(1\)" \}\}[\s\S]*exit=\{\{ opacity: 0, transform: "scale\(0\.8\)" \}\}[\s\S]*<RovoComposerReasoningSelector/u);
	assert.match(sharedSendControls, /style=\{\{ willChange: "transform, opacity" \}\}/u);
});

test("Rovo app sources selector opens a reasoning-free customize popover", () => {
	const source = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");
	const popoverIndex = source.indexOf("<Popover open={isCustomizeMenuOpen} onOpenChange={handleCustomizeMenuOpenChange}>");
	const preferencesTriggerIndex = source.indexOf("<PopoverTrigger render={<PromptInputPreferencesButton aria-label=\"Customize\" />} />", popoverIndex);
	const customizeMenuIndex = source.indexOf("<CustomizeMenu", preferencesTriggerIndex);
	const showReasoningFalseIndex = source.indexOf("showReasoning={false}", customizeMenuIndex);
	const sendControlsIndex = source.indexOf("<RovoComposerSendControls", showReasoningFalseIndex);

	assert.notEqual(popoverIndex, -1);
	assert.ok(preferencesTriggerIndex > popoverIndex);
	assert.ok(customizeMenuIndex > preferencesTriggerIndex);
	assert.ok(showReasoningFalseIndex > customizeMenuIndex);
	assert.ok(sendControlsIndex > showReasoningFalseIndex);
	assert.match(source, /PromptInputPreferencesButton/u);
	assert.doesNotMatch(source.slice(popoverIndex, customizeMenuIndex), /CustomizeIcon/u);
	assert.doesNotMatch(source.slice(customizeMenuIndex, sendControlsIndex), /showSources=\{false\}/u);
});

test("shared composer auto reasoning button opens a sources-free customize popover", () => {
	const source = readProjectFile("components/projects/shared/components/rovo-composer-send-controls.tsx");
	const popoverIndex = source.indexOf("<Popover open={open} onOpenChange={onOpenChange}>");
	const autoButtonIndex = source.indexOf("<PromptInputAutoButton", popoverIndex);
	const popoverContentIndex = source.indexOf("<PopoverContent", autoButtonIndex);
	const customizeMenuIndex = source.indexOf("<CustomizeMenu", popoverContentIndex);
	const showSourcesFalseIndex = source.indexOf("showSources={false}", customizeMenuIndex);

	assert.notEqual(popoverIndex, -1);
	assert.ok(autoButtonIndex > popoverIndex);
	assert.ok(popoverContentIndex > autoButtonIndex);
	assert.ok(customizeMenuIndex > popoverContentIndex);
	assert.ok(showSourcesFalseIndex > customizeMenuIndex);
	assert.match(source, /const selectedReasoningOption = REASONING_OPTIONS\.find\(\(option\) => option\.id === selectedReasoning\) \?\? REASONING_OPTIONS\[0\]/u);
	assert.match(source, /const selectedReasoningButtonLabel = getReasoningButtonLabel\(selectedReasoningOption\)/u);
	assert.match(source, /aria-label=\{`Reasoning: \$\{selectedReasoningOption\.label\}`\}/u);
	assert.match(source, /\{cloneElement\(selectedReasoningOption\.icon, \{ label: "" \}\)\}/u);
	assert.match(source, /<span>\{selectedReasoningButtonLabel\}<\/span>/u);
	assert.doesNotMatch(source, /onClick=\{\(\) => onReasoningChange\("let-rovo-decide"\)\}/u);
	assert.doesNotMatch(source, /aria-pressed=\{selectedReasoning === "let-rovo-decide"\}/u);
	assert.match(source, /const autoReasoningButtonClassName = \[/u);
	assert.match(source, /className=\{autoReasoningButtonClassName\}/u);
	assert.match(source, /\[&\[aria-expanded=true\]\]:bg-transparent/u);
	assert.match(source, /aria-label="Start live voice"/u);
	assert.match(source, /aria-label="Stop live voice"/u);
	assert.match(source, /aria-label="Submit"/u);
});

test("shared composer experimental dark CTA prop is opt-in and covers submit plus live voice", () => {
	const source = readProjectFile("components/projects/shared/components/rovo-composer-send-controls.tsx");
	const neutralBoldClass = "bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed";
	const submitIndex = source.indexOf('<PromptInputSubmit aria-label="Submit"');
	const voiceStartIndex = source.indexOf('aria-label="Start live voice"');

	assert.match(source, /experimentalDarkCta\?: boolean/u);
	assert.match(source, /experimentalDarkCta = false/u);
	assert.match(source, new RegExp(`const EXPERIMENTAL_DARK_CTA_CLASS_NAME = "${neutralBoldClass}"`, "u"));
	assert.notEqual(submitIndex, -1);
	assert.notEqual(voiceStartIndex, -1);
	assert.match(source.slice(submitIndex, source.indexOf("</PromptInputSubmit>", submitIndex)), /experimentalDarkCtaClassName/u);
	assert.match(source.slice(voiceStartIndex, source.indexOf("</PromptInputButton>", voiceStartIndex)), /experimentalDarkCtaClassName/u);
});

test("Rovo composers default reasoning to Auto", () => {
	const sharedMenuData = readProjectFile("components/blocks/shared-ui/data/customize-menu-data.tsx");
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const rovoComposer = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");

	assert.match(sharedMenuData, /export const DEFAULT_REASONING_OPTION_ID = "let-rovo-decide"/u);
	assert.match(sidebarComposer, /useState\(DEFAULT_REASONING_OPTION_ID\)/u);
	assert.match(rovoComposer, /useState\(DEFAULT_REASONING_OPTION_ID\)/u);
	assert.match(rovoComposer, /currentReasoning === "max" \? DEFAULT_REASONING_OPTION_ID : currentReasoning/u);
	assert.doesNotMatch(sidebarComposer, /useState\("deep-research"\)/u);
	assert.doesNotMatch(rovoComposer, /useState\("deep-research"\)/u);
});

test("sidebar chat shares Max reasoning with the empty-state greeting", () => {
	const sidebarPanel = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");

	assert.match(sidebarPanel, /useState\(DEFAULT_REASONING_OPTION_ID\)/u);
	assert.match(sidebarPanel, /isMaxMode=\{selectedReasoning === "max"\}/u);
	assert.match(sidebarPanel, /onReasoningChange=\{setSelectedReasoning\}/u);
	assert.match(sidebarPanel, /selectedReasoning=\{selectedReasoning\}/u);
	assert.match(sidebarComposer, /selectedReasoning: controlledSelectedReasoning/u);
	assert.match(sidebarComposer, /const selectedReasoning = controlledSelectedReasoning \?\? localSelectedReasoning/u);
	assert.match(sidebarComposer, /const handleReasoningChange = \(value: string\) => \{/u);
	assert.match(sidebarComposer, /onReasoningChange\?\.\(value\)/u);
});

test("sidebar chat and Rovo app composers use the shared Auto plus CTA controls", () => {
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const sidebarPanel = readProjectFile("components/projects/sidebar-chat/page.tsx");
	const rovoComposer = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");
	const rovoShell = readProjectFile("components/projects/rovo/components/rovo-app-shell.tsx");

	for (const source of [sidebarComposer, rovoComposer]) {
		assert.match(source, /RovoComposerSendControls/u);
		assert.match(source, /onToggleRealtimeVoice=\{onToggleRealtimeVoice\}/u);
		assert.match(source, /experimentalDarkCta = false/u);
		assert.match(source, /experimentalDarkCta=\{experimentalDarkCta\}/u);
		assert.doesNotMatch(source, /<PromptInputSendControls/u);
	}

	assert.match(sidebarPanel, /useRealtimeVoice/u);
	assert.match(sidebarPanel, /experimentalDarkCta/u);
	assert.match(rovoShell, /experimentalDarkCta/u);
	assert.match(sidebarPanel, /micStream=\{realtime\.micStream\}/u);
	assert.match(sidebarPanel, /realtimeVoiceActive=\{isRealtimeVoiceActive\}/u);
});

test("Rovo app Max reasoning owns plan mode without a separate Task button", () => {
	const rovoComposer = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");

	assert.match(rovoComposer, /const handleReasoningChange = useCallback\(\(reasoning: string\) => \{/u);
	assert.match(rovoComposer, /const shouldEnablePlanMode = reasoning === "max"/u);
	assert.match(rovoComposer, /shouldEnablePlanMode !== isPlanMode/u);
	assert.match(rovoComposer, /onReasoningChange=\{handleReasoningChange\}/u);
	assert.match(rovoComposer, /setSelectedReasoning\("max"\)/u);
	assert.doesNotMatch(rovoComposer, /aria-label="Task mode"/u);
	assert.doesNotMatch(rovoComposer, /ScorecardIcon/u);
	assert.doesNotMatch(rovoComposer, /⌥ Tab/u);
});

test("compact chat plus menu reuses the Rovo app attachment actions", () => {
	const sidebarComposer = readProjectFile("components/projects/sidebar-chat/components/chat-composer.tsx");
	const rovoAddMenu = readProjectFile("components/projects/rovo/components/rovo-app-composer-add-menu.tsx");

	assert.match(sidebarComposer, /RovoAppComposerAddMenu/u);
	assert.match(sidebarComposer, /PendingAttachments/u);
	assert.match(sidebarComposer, /usePromptInputAttachments/u);
	assert.match(rovoAddMenu, /PromptInputActionAddAttachments/u);
	assert.match(rovoAddMenu, /PromptInputActionAddScreenshot/u);
	assert.doesNotMatch(sidebarComposer, /UploadIcon/u);
});

test("compact chat submits add-menu files through the shared Rovo thread queue", () => {
	const submitHook = readProjectFile("components/projects/sidebar-chat/hooks/use-chat-submit.ts");
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const sendChatMessageIndex = context.indexOf("const sendChatMessage = useCallback(");
	const sendPromptIndex = context.indexOf("const sendPrompt = useCallback(");

	assert.match(submitHook, /handleSubmit: \(message: \{ text: string; files: FileUIPart\[\] \}\) => Promise<void>/u);
	assert.match(submitHook, /await sendPrompt\(promptText, defaultPromptOptions, files\)/u);
	assert.match(context, /files: FileUIPart\[\];/u);
	assert.match(context, /sendPrompt: \(prompt: string, options\?: SendPromptOptions, files\?: ReadonlyArray<FileUIPart>\) => Promise<void>/u);
	assert.ok(sendChatMessageIndex > -1);
	assert.ok(sendPromptIndex > sendChatMessageIndex);
	assert.match(context.slice(sendChatMessageIndex, sendPromptIndex), /files: promptItem\.files/u);
	assert.match(context.slice(sendPromptIndex), /files: promptFiles/u);
});

test("compact chat merges selected custom agent context before queueing prompts", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const sendPromptIndex = context.indexOf("const sendPrompt = useCallback(");

	assert.match(context, /selectedAgentId: string;/u);
	assert.match(context, /selectedAgent: RovoAgentProfile;/u);
	assert.match(context, /selectableAgents: readonly AgentSelectorAgent\[\];/u);
	assert.match(context, /autoSelectAgentId\?: string;/u);
	assert.match(context, /const autoSelectedAgentIdRef = useRef<string \| null>\(null\);/u);
	assert.match(context, /const selectableAgents = useMemo<readonly AgentSelectorAgent\[\]>/u);
	assert.match(context, /selectAgent: \(agentId: string, options\?: SelectAgentOptions\) => void;/u);
	assert.match(context, /resetAgentToRovo: \(\) => void;/u);
	assert.match(context, /const nextAgent = agentProfileById\.get\(autoSelectAgentId\);/u);
	assert.match(context, /function mergeSelectedAgentPromptOptions/u);
	assert.match(context, /getRovoAgentPromptContext\(selectedAgent\)/u);
	assert.ok(sendPromptIndex > -1);
	assert.match(
		context.slice(sendPromptIndex),
		/mergeSendPromptOptions\(\s*defaultPromptOptions,\s*mergeSelectedAgentPromptOptions\(options, selectedAgent\)\s*\)/u,
	);
});

test("compact chat registers session-created agents from agent result payloads", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");

	assert.match(context, /interface StudioSessionAgentEntry \{[\s\S]*profile: RovoAgentProfile;[\s\S]*resultKey: string;[\s\S]*\}/u);
	assert.match(context, /type SessionAgentEntry = StudioSessionAgentEntry;/u);
	assert.match(context, /const \[sessionAgentEntries, setSessionAgentEntries\] = useState<SessionAgentEntry\[\]>\(\[\]\);/u);
	assert.match(context, /const sessionAgentEntriesRef = useRef<SessionAgentEntry\[\]>\(\[\]\);/u);
	assert.match(context, /function createSessionAgentEntryFromResult\(params: \{[\s\S]*agentResult: RovoDataParts\["agent-result"\];[\s\S]*\}\): SessionAgentEntry \| null/u);
	assert.match(context, /sourceKey\?: string;/u);
	assert.match(context, /const payloadResultKey = getCreatedAgentResultKey\(payload\);/u);
	assert.match(context, /const resultKey = params\.sourceKey[\s\S]*\? `\$\{params\.sourceKey\}:\$\{payloadResultKey\}`[\s\S]*: payloadResultKey;/u);
	assert.match(context, /params\.sessionAgentEntries\.find\(\s*\(entry\) => entry\.resultKey === resultKey\s*\)/u);
	assert.match(context, /\.\.\.staticAgentProfiles,[\s\S]*\.\.\.normalizedSessionAgentEntries\.map\(\(entry\) => entry\.profile\)/u);
	assert.match(context, /\.\.\.staticAgents\.map\(toAgentSelectorAgent\),[\s\S]*\.\.\.normalizedSessionAgentEntries\.map\(\(entry\) => toAgentSelectorAgent\(entry\.profile\)\)/u);
	assert.match(context, /registerCreatedAgentFromResult: \([\s\S]*agentResult: RovoDataParts\["agent-result"\],[\s\S]*options\?: RegisterCreatedAgentOptions[\s\S]*\) => RovoAgentProfile \| null;/u);
	assert.match(context, /sourceKey: options\?\.sourceKey,/u);
});

test("compact chat exposes normalized Untitled agent names for session-created agents", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const contextsIndex = readProjectFile("app/contexts/index.ts");

	assert.match(context, /const SESSION_AGENT_DEFAULT_NAME = "Untitled agent";/u);
	assert.match(context, /const SESSION_AGENT_LEGACY_DEFAULT_NAME = "New agent";/u);
	assert.match(
		context,
		/const name = getNonEmptyString\(result\.name\) === SESSION_AGENT_LEGACY_DEFAULT_NAME[\s\S]*\? ""[\s\S]*: result\.name;/u,
	);
	assert.match(context, /export function getStudioSessionAgentDisplayName/u);
	assert.match(context, /const normalizedSessionAgentEntries = useMemo\(/u);
	assert.match(context, /\.\.\.normalizedSessionAgentEntries\.map\(\(entry\) => entry\.profile\)/u);
	assert.match(context, /\.\.\.normalizedSessionAgentEntries\.map\(\(entry\) => toAgentSelectorAgent\(entry\.profile\)\)/u);
	assert.match(context, /sessionAgentEntriesRef\.current = normalizedSessionAgentEntries;/u);
	assert.match(context, /persistSessionAgentEntries\(normalizedSessionAgentEntries\);/u);
	assert.match(context, /sessionAgentEntries: normalizedSessionAgentEntries,/u);
	assert.match(contextsIndex, /getStudioSessionAgentDisplayName,/u);
});

test("compact chat suffixes duplicate session-created agent ids and names", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");

	assert.match(context, /function getSuffixedSessionAgentId\([\s\S]*reservedIds: ReadonlySet<string>[\s\S]*\): string \{[\s\S]*let suffix = 2;[\s\S]*while \(reservedIds\.has\(`\$\{baseId\}-\$\{suffix\}`\)\) \{[\s\S]*return `\$\{baseId\}-\$\{suffix\}`;/u);
	assert.match(context, /function getSuffixedSessionAgentName\([\s\S]*reservedNames: ReadonlySet<string>[\s\S]*\): string \{[\s\S]*let suffix = 2;[\s\S]*while \(reservedNames\.has\(`\$\{baseName\} \$\{suffix\}`\.toLowerCase\(\)\)\) \{[\s\S]*return `\$\{baseName\} \$\{suffix\}`;/u);
	assert.match(context, /const id = getSuffixedSessionAgentId\(baseId, reservedIds\);/u);
	assert.match(context, /const explicitName = getPayloadString\(payload, \["name", "agentName", "title"\]\);/u);
	assert.match(context, /const name = explicitName[\s\S]*\? getSuffixedSessionAgentName\(baseName, reservedNames\)[\s\S]*: SESSION_AGENT_DEFAULT_NAME;/u);
});

test("compact chat resets the visible conversation when switching agents", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const resetChatIndex = context.indexOf("const resetChat = useCallback(");
	const selectAgentIndex = context.indexOf("const selectAgent = useCallback(", resetChatIndex);
	const resetAgentToRovoIndex = context.indexOf("const resetAgentToRovo = useCallback(", selectAgentIndex);

	assert.ok(resetChatIndex > -1);
	assert.ok(selectAgentIndex > resetChatIndex);
	assert.ok(resetAgentToRovoIndex > selectAgentIndex);
	assert.match(
		context.slice(selectAgentIndex, resetAgentToRovoIndex),
		/if \(nextAgent\.id === selectedAgentId\) \{[\s\S]*return;[\s\S]*\}[\s\S]*setSelectedAgentId\(nextAgent\.id\);[\s\S]*if \(!options\?\.preserveCurrentThread\) \{[\s\S]*resetChat\(\);[\s\S]*\}/u,
	);
	assert.match(
		context.slice(resetAgentToRovoIndex),
		/if \(selectedAgentId === ROVO_AGENT_ID\) \{[\s\S]*return;[\s\S]*\}[\s\S]*setSelectedAgentId\(ROVO_AGENT_ID\);[\s\S]*resetChat\(\);/u,
	);
});

test("compact chat can select a created agent while preserving the current thread", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const registerIndex = context.indexOf("const registerCreatedAgentFromResult = useCallback(");
	const resetAgentToRovoIndex = context.indexOf("const resetAgentToRovo = useCallback(", registerIndex);

	assert.ok(registerIndex > -1);
	assert.ok(resetAgentToRovoIndex > registerIndex);
	assert.match(
		context.slice(registerIndex, resetAgentToRovoIndex),
		/if \(options\?\.select && entry\.profile\.id !== selectedAgentId\) \{[\s\S]*setSelectedAgentId\(entry\.profile\.id\);[\s\S]*if \(!options\.preserveCurrentThread\) \{[\s\S]*resetChat\(\);[\s\S]*\}/u,
	);
});

test("compact chat resolves pending clarification tools before queueing clarification answers", () => {
	const context = readProjectFile("app/contexts/context-rovo-chat.tsx");
	const sendPromptIndex = context.indexOf("const sendPrompt = useCallback(");

	assert.match(context, /markClarificationToolResolved/u);
	assert.match(context, /appendTurnCompleteToLastAssistantMessage/u);
	assert.match(context, /function isClarificationResolutionPrompt\(options: SendPromptOptions \| undefined\): boolean/u);
	assert.match(context, /options\?\.messageMetadata\?\.source === "clarification-submit"/u);
	assert.ok(sendPromptIndex > -1);
	assert.match(
		context.slice(sendPromptIndex),
		/if \(isClarificationResolutionPrompt\(resolvedOptions\)\) \{[\s\S]*setMessages\(\(prev\) =>[\s\S]*markPendingClarificationResolvedInMessages\(prev, resolvedOptions\)/u,
	);
});
