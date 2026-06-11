const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const AGENT_SOURCE = readProjectFile("components/blocks/agent/components/agent.tsx");
const AGENT_INDEX_SOURCE = readProjectFile("components/blocks/agent/index.ts");
const AGENT_PAGE_SOURCE = readProjectFile("components/blocks/agent/page.tsx");
const AGENT_PREVIEW_PAGE_SOURCE = readProjectFile("app/preview/blocks/agent/page.tsx");
const AGENT_SURFACES_SOURCE = readProjectFile("components/blocks/agent-surfaces/components/agent-surfaces.tsx");
const INLINE_EDIT_SOURCE = readProjectFile("components/ui/inline-edit.tsx");
const TAG_SOURCE = readProjectFile("components/ui/tag.tsx");
const SKILL_TAG_SOURCE = readProjectFile("components/ui-custom/skill-tag.tsx");
const AGENT_DEMO_SOURCE = readProjectFile("components/website/demos/blocks/agent-demo.tsx");
const BLOCK_DETAILS_SOURCE = readProjectFile("app/data/details/blocks.ts");
const UI_CUSTOM_DETAILS_SOURCE = readProjectFile("app/data/details/ui-custom.ts");
const COMPONENTS_SOURCE = readProjectFile("app/data/components.ts");
const COMPONENT_MANIFEST_SOURCE = readProjectFile("app/data/component-manifest.ts");
const WEBSITE_REGISTRY_SOURCE = readProjectFile("components/website/registry.ts");
const PROMPT_INPUT_SOURCE = readProjectFile("components/ui-custom/prompt-input.tsx");
const RICH_TEXT_EDITOR_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/rich-text-editor.tsx");
const RICH_TEXT_EDITOR_CSS = readProjectFile("components/ui-custom/rich-text-editor/rich-text-editor.css");
const RICH_TEXT_EXTENSIONS_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/extensions.ts");
const RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/composer-extensions.ts");
const RICH_TEXT_MENTION_NODE_VIEW_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/mention-node-view.tsx");
const RICH_TEXT_MENTION_VISUAL_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/mention-visual.tsx");
const RICH_TEXT_REFERENCE_PREVIEW_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/reference-preview.tsx");
const RICH_TEXT_SUGGESTION_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");
const RICH_TEXT_TYPES_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/types.ts");
const RICH_TEXT_REFERENCE_CATEGORIES_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/reference-categories.tsx");
const RICH_TEXT_TOOLBAR_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/toolbar.tsx");
const EDITOR_PALETTE_SOURCE = readProjectFile("components/blocks/editor-palette/page.tsx");
const EDITOR_PALETTE_MENTION_SOURCES = readProjectFile("components/blocks/editor-palette/data/mention-sources.ts");
const EDITOR_PALETTE_DEMO_SOURCE = readProjectFile("components/website/demos/blocks/editor-palette-demo.tsx");
const TRIGGERS_SOURCE = readProjectFile("components/blocks/triggers/page.tsx");
const EDITOR_TOOLBAR_SOURCE = readProjectFile("components/blocks/editor-toolbar/components/editor-toolbar.tsx");
const EDITOR_TOOLBAR_INDEX_SOURCE = readProjectFile("components/blocks/editor-toolbar/index.ts");
const STUDIO_AGENT_RESULT_SOURCE = readProjectFile("backend/lib/studio-agent-result.js");
const STUDIO_SHELL_SOURCE = readProjectFile("components/projects/studio/components/rovo-app-shell.tsx");
const HORIZONTAL_OVERFLOW_HOOK_SOURCE = readProjectFile("components/hooks/use-has-horizontal-overflow.ts");

test("Agent demo defaults to the filled preview", () => {
	assert.match(AGENT_DEMO_SOURCE, /export default function AgentDemo\(\) \{[\s\S]*return <AgentDemoFull \/>;/u);
	assert.doesNotMatch(AGENT_DEMO_SOURCE, /AgentDemoMode|Agent demo state/u);
	assert.match(AGENT_DEMO_SOURCE, /const TRIGGER_MANAGE_DOCS_PATH = "\/components\/blocks\/triggers#manage";/u);
	assert.match(AGENT_DEMO_SOURCE, /function openTriggerManageDocs\(\) \{\s*window\.location\.assign\(TRIGGER_MANAGE_DOCS_PATH\);/u);
	assert.match(AGENT_DEMO_SOURCE, /onManageTriggers=\{openTriggerManageDocs\}/u);
	assert.match(
		BLOCK_DETAILS_SOURCE,
		/examples: \[[\s\S]*title: "Filled agent"[\s\S]*demoSlug: "agent-demo-full"[\s\S]*title: "Empty agent"[\s\S]*demoSlug: "agent-demo-empty"/u,
	);
	assert.match(
		WEBSITE_REGISTRY_SOURCE,
		/const BLOCK_VARIANT_DEMOS: Record<string, ComponentType> = \{[\s\S]*"agent-demo-full": dynamic[\s\S]*default: mod\.AgentDemoFull[\s\S]*"agent-demo-empty": dynamic[\s\S]*default: mod\.AgentDemoEmpty/u,
	);
});

test("Agent is exposed as a website block", () => {
	assert.match(COMPONENTS_SOURCE, /blockComponent\("agent"\)/u);
	assert.doesNotMatch(COMPONENTS_SOURCE, /customComponent\("agent"\)/u);
	assert.match(COMPONENT_MANIFEST_SOURCE, /blockComponent\("agent"\)/u);
	assert.doesNotMatch(COMPONENT_MANIFEST_SOURCE, /customComponent\("agent"\)/u);
	assert.match(BLOCK_DETAILS_SOURCE, /import \{[\s\S]*Agent,[\s\S]*AgentHeader,[\s\S]*AgentContent,[\s\S]*AgentConfigFields,[\s\S]*\} from "@\/components\/blocks\/agent";/u);
	assert.doesNotMatch(UI_CUSTOM_DETAILS_SOURCE, /\n\tagent: \{/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /const BLOCK_DEMOS: Record<string, ComponentType> = \{[\s\S]*agent: dynamic\(\(\) => import\("\.\/demos\/blocks\/agent-demo"\), \{ ssr: false \}\)/u);
	assert.doesNotMatch(WEBSITE_REGISTRY_SOURCE, /const UI_CUSTOM_DEMO: Record<string, ComponentType> = \{[\s\S]*agent: dynamic\(\(\) => import\("\.\/demos\/blocks\/agent-demo"\), \{ ssr: false \}\)[\s\S]*const BLOCK_DEMOS/u);
});

test("Agent instructions composer uses the shared Tiptap editor", () => {
	assert.match(AGENT_SOURCE, /RichTextEditor,[\s\S]*\} from "@\/components\/ui-custom\/rich-text-editor";/u);
	assert.match(AGENT_SOURCE, /import type \{ EditorToolbarViewMode \} from "@\/components\/blocks\/editor-toolbar";/u);
	assert.match(AGENT_SOURCE, /function AgentInstructionsComposer/u);
	assert.match(AGENT_SOURCE, /<RichTextEditor[\s\S]*aria-label="Agent instructions"/u);
	assert.match(AGENT_SOURCE, /editorClassName=\{cn\("agent-instructions-tiptap-editor text-text", editorClassName\)\}/u);
	assert.match(AGENT_SOURCE, /onViewModeChange\?: \(mode: EditorToolbarViewMode\) => void;/u);
	assert.match(AGENT_SOURCE, /onInstructionsViewModeChange\?: \(mode: EditorToolbarViewMode\) => void;/u);
	assert.match(AGENT_SOURCE, /onViewModeChange=\{onViewModeChange\}/u);
	assert.match(AGENT_SOURCE, /onViewModeChange=\{onInstructionsViewModeChange\}/u);
	assert.match(AGENT_SOURCE, /placeholder="Press \/ to help me describe the agent's role, or start with a template"/u);
	assert.match(AGENT_SOURCE, /placeholderSlot=\{\([\s\S]*className="tiptap-editor text-sm leading-\[1\.55\] text-text-subtlest"[\s\S]*Press <code>\/<\/code> to help me describe the agent&apos;s role,[\s\S]*start with a template[\s\S]*\)\}/u);
	// When a host provides onStartWithTemplate it takes over (opens its own
	// Agent Directory) and the composer skips its built-in templates dialog;
	// otherwise the link opens the local AgentTemplatesDialog.
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => \{[\s\S]*if \(onStartWithTemplate\) \{[\s\S]*onStartWithTemplate\(\);[\s\S]*return;[\s\S]*\}[\s\S]*setTemplatesOpen\(true\);[\s\S]*\}\}/u);
	assert.match(AGENT_SOURCE, /<AgentTemplatesDialog[\s\S]*open=\{templatesOpen\}[\s\S]*onOpenChange=\{setTemplatesOpen\}/u);
	// AgentConfigFields forwards the host handler down to the composer.
	assert.match(AGENT_SOURCE, /onStartWithTemplate=\{onStartWithTemplate\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /showBubbleMenu=\{false\}/u);
	assert.match(AGENT_SOURCE, /const handleInsertReferenceOption = useCallback\(\(category: RichTextReferenceCategory, label: string\): false => \{[\s\S]*AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY\[category\][\s\S]*onAddListValues\?\.\(field, \[label\]\);[\s\S]*return false;[\s\S]*\}, \[config, onAddListValues\]\);/u);
	assert.match(AGENT_SOURCE, /const handleMentionInventoryChange = useCallback\(\(mentions: readonly RichTextMentionItem\[\]\): void => \{/u);
	assert.match(AGENT_SOURCE, /inlineManagedReferenceKeysRef\.current\.add\(key\);[\s\S]*onAddListValues\?\.\(next\.field, \[next\.label\]\);/u);
	assert.match(AGENT_SOURCE, /inlineManagedReferenceKeysRef\.current\.delete\(key\);[\s\S]*onRemoveReferenceValue\?\.\(previous\.field, previous\.label\);/u);
	assert.match(AGENT_SOURCE, /onInsertReferenceOption=\{handleInsertReferenceOption\}/u);
	assert.match(AGENT_SOURCE, /mentionSources=\{mentionSources\}/u);
	assert.match(AGENT_SOURCE, /mentionRemovalRequest=\{mentionRemovalRequest\}/u);
	assert.match(AGENT_SOURCE, /onMentionInventoryChange=\{handleMentionInventoryChange\}/u);
	assert.match(AGENT_SOURCE, /onMentionRemovalRequestHandled=\{onMentionRemovalRequestHandled\}/u);
	assert.match(AGENT_SOURCE, /toolbarBelowSlot=\{toolbarBelowSlot\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /toolbarEndSlot=\{<AgentInstructionsModelSelector \/>\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /function AgentInstructionsModelSelector/u);
	assert.match(AGENT_SOURCE, /onMarkdownChange=\{onInstructionsChange\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /AGENT_EDITOR_CONTROLS/u);
});

test("Reasoning selector lives in the compact toolbar and shares state across collapsed and expanded views", () => {
	assert.match(AGENT_SOURCE, /import \{ Lozenge, LozengeDropdownTrigger \} from "@\/components\/ui\/lozenge";/u);
	assert.match(AGENT_SOURCE, /function AgentReasoningSelector/u);
	assert.match(AGENT_SOURCE, /function AgentReasoningRow/u);
	assert.doesNotMatch(AGENT_SOURCE, /function AgentReasoningOverflowMenu/u);
	assert.match(AGENT_SOURCE, /const \[reasoningFallback, setReasoningFallback\] = useState<ReasoningModeValue \| null>\(null\);/u);
	assert.match(AGENT_SOURCE, /const reasoningValue =[\s\S]*\(config\.reasoningMode as ReasoningModeValue \| undefined\) \?\? reasoningFallback \?\? "quick-auto";/u);
	assert.match(AGENT_SOURCE, /const setReasoningValue = useCallback\([\s\S]*setReasoningFallback\(next\);[\s\S]*onTextChange\?\.\("reasoningMode", next\);/u);
	assert.match(AGENT_SOURCE, /\{ agentFieldName: "reasoning", label: "Reasoning", kind: "reasoning", Icon: AiComputeIcon \}/u);
	assert.match(AGENT_SOURCE, /case "reasoning":[\s\S]*count = 0;/u);
	assert.match(AGENT_SOURCE, /render="nav-button"[\s\S]*value=\{reasoningValue\}[\s\S]*onValueChange=\{onReasoningValueChange\}/u);
	// Reasoning now renders inside AgentFilledConfigSummary's shared row stack
	// (value={reasoningMode}/onValueChange={onReasoningModeChange}); the compact
	// toolbar feeds it via reasoningMode/onReasoningModeChange.
	assert.match(AGENT_SOURCE, /<AgentReasoningRow[\s\S]*onValueChange=\{onReasoningModeChange\}[\s\S]*value=\{reasoningMode\}/u);
	assert.match(AGENT_SOURCE, /reasoningMode=\{reasoningValue\}/u);
	assert.match(AGENT_SOURCE, /onReasoningModeChange=\{setReasoningValue\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /<AgentReasoningOverflowMenu/u);
	assert.match(AGENT_SOURCE, /import AiComputeIcon from "@atlaskit\/icon-lab\/core\/ai-compute";/u);
	assert.match(AGENT_SOURCE, /render=\{<LozengeDropdownTrigger aria-label="Reasoning mode" icon=\{<Icon aria-hidden render=\{<AiComputeIcon label="" size="small" \/>\} className="text-icon-subtle" \/>\} \/>\}/u);
	assert.match(AGENT_SOURCE, /<Tag>\{current\?\.label \?\? "Recommended"\}<\/Tag>/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Think deeper option"/u);
	assert.doesNotMatch(AGENT_SOURCE, /from "@\/components\/ui-custom\/model-selector"/u);
	assert.match(AGENT_SOURCE, /<AgentSectionLabel>Reasoning<\/AgentSectionLabel>/u);
});

test("Apps config row unifies tool and knowledge references while memory keeps its mode dropdown", () => {
	assert.match(AGENT_SOURCE, /import AppsIcon from "@atlaskit\/icon\/core\/apps";/u);
	assert.match(AGENT_SOURCE, /\{ agentFieldName: "apps", label: "Apps", listFieldName: "apps", Icon: AppsIcon \}/u);
	assert.match(AGENT_SOURCE, /case "apps":[\s\S]*count = getNonEmptyConfigItems\(config\.apps\)\.length;/u);
	assert.match(AGENT_SOURCE, /app: "apps"/u);
	assert.match(AGENT_SOURCE, /apps: "app"/u);
	assert.match(AGENT_SOURCE, /export type AgentDirectoryKind = "knowledge" \| "tools" \| "apps" \| "skills" \| "memory" \| "conversationStarters";/u);
	assert.doesNotMatch(AGENT_SOURCE, /function AgentKnowledgeSelector/u);
	assert.doesNotMatch(AGENT_SOURCE, /function AgentKnowledgeOverflowMenu/u);
	assert.match(AGENT_SOURCE, /const MEMORY_MODE_OPTIONS = \[/u);
	assert.match(AGENT_SOURCE, /\{ value: "on", label: "On" \}/u);
	assert.match(AGENT_SOURCE, /\{ value: "off", label: "Off" \}/u);
	assert.match(AGENT_SOURCE, /function AgentMemorySelector/u);
	assert.match(AGENT_SOURCE, /const selectedOption = MEMORY_MODE_OPTIONS\.find\(\(option\) => option\.value === value\) \?\? MEMORY_MODE_OPTIONS\[0\];/u);
	assert.match(AGENT_SOURCE, /render=\{\(\s*<LozengeDropdownTrigger[\s\S]*aria-label="Memory mode"[\s\S]*icon=\{<Icon aria-hidden render=\{<AiModelIcon label="" size="small" \/>\} className="text-icon-subtle" \/>\}/u);
	assert.match(AGENT_SOURCE, /\{`Memory \$\{selectedOption\.label\.toLowerCase\(\)\}`\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Memory mode"[\s\S]{0,180}variant="information"/u);
	assert.match(AGENT_SOURCE, /<DropdownMenuSeparator \/>[\s\S]*onClick=\{onManage\}[\s\S]*Manage memory/u);
	// Memory selector is driven by lifted state and renders as a row lozenge
	// or a compact nav button.
	assert.match(AGENT_SOURCE, /<AgentMemorySelector render="row" value=\{value\} onValueChange=\{onValueChange\} onManage=\{onManage\} \/>/u);
	assert.doesNotMatch(AGENT_SOURCE, /function AgentMemoryOverflowMenu/u);
	assert.doesNotMatch(AGENT_SOURCE, /<AgentReferenceChip label="Memory" \/>/u);
});

test("Configured reference menu rows do not wrap enabled visuals in an empty inline span", () => {
	assert.match(
		AGENT_SOURCE,
		/const resolvedElemBefore = frontSlot[\s\S]*\? hasToggle && !enabled[\s\S]*\? <span className="inline-flex size-6 items-center justify-center opacity-\(--opacity-disabled\)">\{frontSlot\}<\/span>[\s\S]*: frontSlot[\s\S]*: undefined;/u,
	);
	assert.match(AGENT_SOURCE, /elemBefore=\{resolvedElemBefore\}/u);
	assert.doesNotMatch(
		AGENT_SOURCE,
		/<span className=\{cn\(hasToggle && !enabled && "opacity-\(--opacity-disabled\)"\)\}>\{frontSlot\}<\/span>/u,
	);
});

test("Filled config summary sorts empty rows to the bottom while preserving canonical order", () => {
	assert.match(AGENT_SOURCE, /const rows: ReadonlyArray<\{ key: string; isEmpty: boolean; node: ReactNode \}>/u);
	assert.match(AGENT_SOURCE, /const orderedRows = rows[\s\S]*\.sort\(\(a, b\) => \{[\s\S]*if \(a\.isEmpty !== b\.isEmpty\) return a\.isEmpty \? 1 : -1;[\s\S]*return a\.index - b\.index;/u);
	assert.match(AGENT_SOURCE, /isEmpty: appItems\.length === 0/u);
	// The rows array source order IS the canonical display order. Reasoning is
	// rendered separately after this list, so it is not a row key here.
	assert.match(
		AGENT_SOURCE,
		/key: "trigger"[\s\S]*key: "apps"[\s\S]*key: "skills"[\s\S]*key: "subagents"[\s\S]*key: "memory"[\s\S]*key: "conversationStarters"/u,
	);
	// Memory is its own always-on row (never empty), not a chip inside Knowledge.
	assert.match(AGENT_SOURCE, /function AgentMemoryRow/u);
	assert.match(AGENT_SOURCE, /key: "memory",[\s\S]*isEmpty: false,/u);
	// The collapsed nav item catalog mirrors the same canonical order and now
	// includes Memory, so the collapsed and expanded views stay symmetric.
	assert.match(
		AGENT_SOURCE,
		/AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS = \[[\s\S]*"trigger"[\s\S]*"apps"[\s\S]*"skills"[\s\S]*"subagents"[\s\S]*"memory"[\s\S]*"conversationStarters"[\s\S]*"reasoning"[\s\S]*\] as const;/u,
	);
	// Memory renders as a nav button in the collapsed nav.
	assert.match(AGENT_SOURCE, /item\.agentFieldName === "memory"[\s\S]*<AgentMemorySelector[\s\S]*render="nav-button"[\s\S]*value=\{memoryMode\}[\s\S]*onManage=\{\(\) => onOpenDirectory\?\.\("memory"\)\}/u);
	// The collapsed nav button surfaces the on/off state inline as a neutral badge
	// so the current state reads without opening the dropdown.
	assert.match(AGENT_SOURCE, /Memory[\s\S]*<Badge>\{selectedOption\.label\}<\/Badge>/u);
	assert.doesNotMatch(AGENT_SOURCE, /<AgentMemoryOverflowMenu/u);
	// Memory state is lifted to the toolbar so both views share one toggle.
	assert.match(AGENT_SOURCE, /const \[memoryFallback, setMemoryFallback\] = useState<MemoryModeValue \| null>\(null\);/u);
	assert.match(AGENT_SOURCE, /const memoryMode = \(config\.memoryMode as MemoryModeValue \| undefined\) \?\? memoryFallback \?\? "on";/u);
	assert.match(AGENT_SOURCE, /const setMemoryMode = useCallback\([\s\S]*setMemoryFallback\(next\);[\s\S]*onTextChange\?\.\("memoryMode", next\);/u);
});

test("Agent config updates instructions as markdown strings", () => {
	assert.match(
		AGENT_SOURCE,
		/onInstructionsChange=\{\(value\) => handleTextChange\("instructions", value\)\}/u,
	);
	assert.match(AGENT_SOURCE, /fetch\("\/api\/wiki\/memory-explorer"/u);
	assert.doesNotMatch(AGENT_SOURCE, /fetch\("\/api\/skills"/u);
	assert.doesNotMatch(AGENT_SOURCE, /mapSkillsToMentionItems/u);
	assert.match(AGENT_SOURCE, /toMentionId\("knowledge"/u);
	assert.doesNotMatch(AGENT_SOURCE, /getHTML\(/u);
	assert.doesNotMatch(AGENT_SOURCE, /instructionsHtml|richInstructions/u);
});

test("Agent config syncs reference mentions with selected panel values", () => {
	assert.match(AGENT_SOURCE, /export type AgentConfigReferenceListFieldName = Extract<[\s\S]*"knowledge" \| "skills" \| "subagents" \| "tools"/u);
	assert.match(AGENT_SOURCE, /const AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY: Record<RichTextReferenceCategory, AgentConfigReferenceListFieldName>/u);
	assert.match(AGENT_SOURCE, /const AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD: Record<AgentConfigReferenceListFieldName, RichTextReferenceCategory>/u);
	assert.match(AGENT_SOURCE, /function mapConfigValuesToMentionItems\(/u);
	assert.match(AGENT_SOURCE, /function mapSubagentConfigValuesToMentionItems\(/u);
	assert.match(AGENT_SOURCE, /getDirectoryMentionItemOrFallback\(category, value\)/u);
	// Subagents are nested/owned: the `@subagent` list comes ONLY from this agent's
	// own subagents (no global parent-agent palette merge), so it is 0 by default.
	// They are prompt references, not directory-backed parent-agent avatars, so
	// configured subagent mentions are mapped without a `visual`.
	assert.match(AGENT_SOURCE, /subagent: mapSubagentConfigValuesToMentionItems\(config\.subagents\),/u);
	assert.match(AGENT_SOURCE, /category: "subagent",[\s\S]*id: toMentionId\("subagent", value\),[\s\S]*label: value/u);
	assert.doesNotMatch(AGENT_SOURCE, /subagent: mergeMentionItems\([\s\S]*EDITOR_PALETTE_MENTION_SOURCES\.subagent/u);
	assert.match(AGENT_SOURCE, /skill: mergeMentionItems\([\s\S]*mapConfigValuesToMentionItems\("skill", config\.skills\),[\s\S]*EDITOR_PALETTE_MENTION_SOURCES\.skill[\s\S]*\),/u);
	assert.match(AGENT_SOURCE, /tool: mergeMentionItems\([\s\S]*mapConfigValuesToMentionItems\("tool", config\.tools\),[\s\S]*EDITOR_PALETTE_MENTION_SOURCES\.tool/u);
	assert.match(AGENT_SOURCE, /knowledge: mergeMentionItems\([\s\S]*mapConfigValuesToMentionItems\("knowledge", config\.knowledge\),[\s\S]*EDITOR_PALETTE_MENTION_SOURCES\.knowledge,[\s\S]*knowledge/u);
	assert.match(AGENT_SOURCE, /onAddListValues\?: \(field: AgentConfigReferenceListFieldName, values: readonly string\[\]\) => void;/u);
	assert.match(AGENT_SOURCE, /setMentionRemovalRequest\(\{[\s\S]*category: AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD\[field\][\s\S]*label: removedValue/u);
	assert.match(AGENT_SOURCE, /const handleRemoveReferenceValue = useCallback\(\(field: AgentConfigReferenceListFieldName, value: string\) => \{[\s\S]*onRemoveListItem\?\.\(field, index\);/u);
	assert.match(AGENT_SOURCE, /onAddListValues=\{handleAddListValues\}/u);
	assert.match(AGENT_SOURCE, /onRemoveReferenceValue=\{handleRemoveReferenceValue\}/u);
	assert.match(AGENT_SOURCE, /onMentionRemovalRequestHandled=\{handleMentionRemovalRequestHandled\}/u);
});

test("Agent config renders filled summary rows once field data exists", () => {
	assert.match(AGENT_SOURCE, /function hasFilledAgentConfig\(config: AgentConfigFormValue\): boolean/u);
	assert.match(AGENT_SOURCE, /const isFilledConfig = hasFilledAgentConfig\(config\);/u);
	assert.match(AGENT_SOURCE, /<AgentFilledConfigSummary/u);
	// The empty state now uses the single-layout config nav (AgentCompactEmptyConfigNav)
	// instead of the removed AgentMissingConfigActions grid.
	assert.doesNotMatch(AGENT_SOURCE, /function AgentMissingConfigActions/u);
	assert.match(AGENT_SOURCE, /function AgentCompactEmptyConfigNav/u);
	assert.match(AGENT_SOURCE, /getAgentTriggerItems\(config\)\.length > 0/u);
	assert.match(AGENT_SOURCE, /MAX_AGENT_CONVERSATION_STARTERS = 3/u);

	// Every config field is represented in the empty-state nav item catalog.
	for (const label of [
		"Triggers",
		"Apps",
		"Skills",
		"Subagents",
		"Memory",
		"Conversation starters",
	]) {
		assert.match(AGENT_SOURCE, new RegExp(`label: "${label}"`, "u"));
	}

	assert.match(AGENT_SOURCE, /function AgentReferenceChip/u);
	assert.match(AGENT_SOURCE, /category && category !== "subagent" \? getDirectoryMentionItemOrFallback\(category, label\) : undefined/u);
	assert.match(AGENT_SOURCE, /<RichTextMentionVisualMark/u);
	assert.match(AGENT_SOURCE, /type=\{elemBefore \? "default" : getRichTextMentionTagType\(visual\)\}/u);
	assert.match(AGENT_SOURCE, /removeVariant="overlay"/u);
	// Regression: when the chip is used as a menu/menubar `render` target, Base UI
	// injects its trigger handlers/aria/id/ref. The chip MUST forward those
	// behavioral props onto the underlying Tag, or clicking the chip does nothing.
	assert.match(AGENT_SOURCE, /\.\.\.rest\s*\n\s*\}: Readonly<\s*\n\s*Omit<ComponentProps<typeof Tag>, "color" \| "children">/u);
	assert.match(
		AGENT_SOURCE,
		/const \{ className: injectedClassName, style: injectedStyle, \.\.\.behaviorProps \} = rest;/u,
	);
	assert.match(AGENT_SOURCE, /<Tag\s*\n\s*\{\.\.\.behaviorProps\}/u);
	// ...but it must NOT apply the injected className/style, or the trigger's own
	// button styling would visually reshape the flat Tag into a card/button.
	assert.doesNotMatch(AGENT_SOURCE, /\{\.\.\.rest\}\s*\n\s*aria-disabled/u);
	assert.doesNotMatch(AGENT_SOURCE, /opacity-\(--opacity-disabled\)", rest\.className/u);
	assert.match(AGENT_SOURCE, /import \{ HoverCard, HoverCardTrigger \} from "@\/components\/ui\/hover-card";/u);
	assert.match(AGENT_SOURCE, /getRichTextReferencePreview,[\s\S]*RichTextReferencePreviewContent/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /import \{ HoverCardContent \} from "@\/components\/ui\/hover-card";/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /import \{ EntityCard \} from "@\/components\/ui-custom\/entity-card";/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /SmartLinkCard,[\s\S]*type SmartLinkItem/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /export type RichTextReferencePreview =[\s\S]*kind: "skill"[\s\S]*kind: "tool"[\s\S]*kind: "knowledge"/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /export function getRichTextReferencePreview/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /case "app":[\s\S]*findReferenceApp\(label\)[\s\S]*app\.hasToolFacet[\s\S]*kind: "tool"[\s\S]*getKnowledgeAppSmartLink/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /<EntityCard\.Skill[\s\S]*description=\{preview\.skill\.description\}/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /<EntityCard\.Tool[\s\S]*appLogo=\{getReferenceToolLogo\(preview\.tool\)\}/u);
	assert.match(RICH_TEXT_REFERENCE_PREVIEW_SOURCE, /<SmartLinkCard item=\{preview\.item\} \/>/u);
	assert.doesNotMatch(AGENT_SOURCE, /const \[previewOpen, setPreviewOpen\] = useState\(false\);/u);
	assert.doesNotMatch(AGENT_SOURCE, /onMouseEnter=\{preview \? openPreview : undefined\}/u);
	assert.match(AGENT_SOURCE, /const preview = getRichTextReferencePreview\(category, label\);/u);
	assert.match(AGENT_SOURCE, /return preview \? \([\s\S]*<HoverCard>[\s\S]*<HoverCardTrigger closeDelay=\{80\} delay=\{120\} render=\{<span className="inline-flex max-w-full" \/>\}>[\s\S]*\{tag\}[\s\S]*<\/HoverCardTrigger>[\s\S]*<RichTextReferencePreviewContent preview=\{preview\} \/>/u);
	assert.doesNotMatch(AGENT_SOURCE, /function AgentSkillChip/u);
	assert.match(AGENT_SOURCE, /onRemove=\{onRemove\}[\s\S]*removeButtonLabel=\{`Remove \$\{label\}`\}[\s\S]*removeVariant="overlay"/u);
	for (const [rowLabel, category] of [
		["Apps", "app"],
		["Skills", "skill"],
		["Subagents", "subagent"],
	]) {
		assert.match(
			AGENT_SOURCE,
			new RegExp(`label="${rowLabel}"[\\s\\S]*referenceCategory="${category}"`, "u"),
		);
	}
	// Triggers are edited via the triggers dialog (onEditTriggers), not removed
	// via onRemoveListItem like the other list fields.
	for (const field of ["apps", "skills", "subagents", "conversationStarters"]) {
		assert.match(AGENT_SOURCE, new RegExp(`onRemoveListItem\\("${field}", index\\)`, "u"));
	}
	assert.match(TAG_SOURCE, /group\/tag relative inline-flex/u);
	assert.match(TAG_SOURCE, /hasLeadingElement \? "gap-0\.5 py-0 ps-px" : "gap-1 py-0\.5 ps-\[4px\]"/u);
	assert.doesNotMatch(TAG_SOURCE, /hasAvatarTagStyles\s*\?\s*cn\("h-6/u);
	assert.match(TAG_SOURCE, /const avatarTagBeforeShapeClass = isUserAvatarTag \? "rounded-full" : isOtherAvatarTag \? "rounded-xs" : "";/u);
	assert.match(TAG_SOURCE, /hasAvatarTagStyles \? cn\("overflow-hidden", avatarTagBeforeShapeClass\) : colorClasses\.icon/u);
	assert.match(TAG_SOURCE, /group-hover\/tag:opacity-100/u);
	assert.doesNotMatch(TAG_SOURCE, /group-hover:opacity-100/u);
	assert.match(SKILL_TAG_SOURCE, /removeVariant\?: "inline" \| "overlay";/u);
	assert.match(SKILL_TAG_SOURCE, /removeVariant = "inline"/u);
	assert.match(SKILL_TAG_SOURCE, /isOverlayRemove/u);
	assert.match(SKILL_TAG_SOURCE, /group\/skill-tag relative inline-flex/u);
	assert.match(SKILL_TAG_SOURCE, /className=\{cn\([\s\S]*"relative z-\[1\] min-w-0 skew-x-12 truncate whitespace-nowrap"[\s\S]*isOverlayRemove && "group-hover\/skill-tag:\[mask-image:linear-gradient\(to_right,#000_calc\(100%-3rem\),transparent\)\]/u);
	assert.doesNotMatch(SKILL_TAG_SOURCE, /SKILL_TAG_OVERLAY_LABEL_MASK_STYLE/u);
	assert.match(SKILL_TAG_SOURCE, /className="pointer-events-none absolute inset-y-0 end-0 z-\[2\] w-12[\s\S]*from-bg-neutral from-55% to-transparent[\s\S]*data-slot="skill-tag-remove-overlay-scrim"/u);
	assert.match(SKILL_TAG_SOURCE, /absolute end-1 top-1\/2 z-\[3\][\s\S]*data-slot="skill-tag-remove"/u);
	assert.match(SKILL_TAG_SOURCE, /opacity-0[\s\S]*group-hover\/skill-tag:opacity-100/u);
	assert.match(UI_CUSTOM_DETAILS_SOURCE, /name: "removeVariant"[\s\S]*type: '"inline" \| "overlay"'/u);
	assert.match(UI_CUSTOM_DETAILS_SOURCE, /demoSlug: "skill-tag-demo-removable"/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /"skill-tag-demo-removable": dynamic/u);
	assert.doesNotMatch(AGENT_SOURCE, /data-slot=tag-after\]\]:opacity-0/u);
	assert.match(AGENT_SOURCE, /const iconColorToTagColor: Readonly<Record<string, TagColor>> = \{/u);
	for (const [iconClass, tagColor] of [
		["text-icon-discovery", "discovery"],
		["text-icon-success", "green"],
		["text-icon-brand", "blue"],
		["text-icon-warning", "yellow"],
		["text-yellow-400", "yellow"],
	]) {
		assert.match(AGENT_SOURCE, new RegExp(`"${iconClass}": "${tagColor}"`, "u"));
	}
	assert.match(AGENT_SOURCE, /const resolvedTagColor = tagColor \?\? getTagColorForMentionVisual\(visual\) \?\? "blue";/u);
	assert.match(AGENT_SOURCE, /color=\{resolvedTagColor\}/u);
	assert.match(AGENT_SOURCE, /if \(category === "subagent"\) \{[\s\S]*<IconTile[\s\S]*tagColor \? tagColorToMenuIconClassName\[tagColor\] : "text-icon-subtlest"[\s\S]*icon=\{<AiAgentIcon label="" size="small" \/>\}/u);
});

test("Compact agent config opts into the typed Triggers editor without replacing default rows", () => {
	assert.match(AGENT_SOURCE, /import \{[\s\S]*renderAgentTriggerProviderIcon,[\s\S]*serializeAgentTriggerLabels,[\s\S]*TriggerPicker,[\s\S]*type AgentTriggerValue,[\s\S]*\} from "@\/components\/blocks\/triggers\/page";/u);
	assert.match(AGENT_SOURCE, /triggerDefinitions\?: readonly AgentTriggerValue\[\];/u);
	assert.match(AGENT_SOURCE, /function getAgentTriggerItems\(config: AgentConfigFormValue\): readonly string\[\] \{[\s\S]*serializeAgentTriggerLabels\(config\.triggerDefinitions\)[\s\S]*const triggers = getNonEmptyConfigItems\(config\.triggers\)[\s\S]*const trigger = config\.trigger\?\.trim\(\);/u);
	assert.match(AGENT_SOURCE, /onConnectTrigger\?: \(trigger: AgentTriggerValue\) => void;/u);
	assert.match(AGENT_SOURCE, /onManageTriggers\?: \(\) => void;/u);
	assert.match(AGENT_SOURCE, /onTriggerDefinitionsChange\?: \(triggers: readonly AgentTriggerValue\[\]\) => void;/u);
	// Adding a trigger opens the automation modal with the full current trigger
	// set plus the new condition, preserving one shared prompt/name/active state.
	assert.match(AGENT_SOURCE, /const handleSelectEvent = \([\s\S]*const existing = triggerDefinitions \?\? \[\];[\s\S]*createAgentTriggerValue\(providerId, eventId, existing\.length \+ 1\)[\s\S]*onEditTriggers\?\.\(next \? \[\.\.\.existing, next\] : existing\);/u);
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => onEditTriggers\?\.\(\[\]\)\}/u);
	assert.match(AGENT_SOURCE, /onSelectEvent=\{\(providerId, eventId\) => \{[\s\S]*const existing = config\?\.triggerDefinitions \?\? \[\];[\s\S]*createAgentTriggerValue\(providerId, eventId, existing\.length \+ 1\)[\s\S]*onEditTriggers\?\.\(next \? \[\.\.\.existing, next\] : existing\);/u);
	// Save commits the complete automation trigger array.
	assert.match(AGENT_SOURCE, /const handleTriggersSave = useCallback\(\(triggers: readonly AgentTriggerValue\[\]\) => \{\s*onTriggerDefinitionsChange\?\.\(triggers\);/u);
	assert.match(AGENT_SOURCE, /const handleManageTriggers = useCallback\(\(\) => \{\s*if \(onManageTriggers\) \{\s*onManageTriggers\(\);\s*return;\s*\}\s*setManageTriggersOpen\(true\);/u);
	assert.match(AGENT_SOURCE, /isEmpty: triggerItems\.length === 0/u);
	assert.match(AGENT_SOURCE, /<AgentTriggerSummaryRow[\s\S]*items=\{triggerItems\}[\s\S]*onTriggerDefinitionsChange=\{onTriggerDefinitionsChange\}/u);
	assert.match(AGENT_SOURCE, /onTriggerDefinitionsChange=\{onTriggerDefinitionsChange\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /<Triggers[\s\S]{0,400}layout="default"/u);
});

test("Agent header renders Test as a button and leaves Details in the compact nav", () => {
	assert.match(AGENT_SOURCE, /primaryActionLabel = "Test"/u);
	assert.match(AGENT_SOURCE, /publishLabel = "Publish"/u);
	assert.match(
		AGENT_SOURCE,
		/\{actions \?\? \([\s\S]*<AgentMoreOptionsMenu \/>[\s\S]*<Button type="button" size="default" variant="outline">[\s\S]*\{primaryActionLabel\}[\s\S]*<\/Button>[\s\S]*<Button type="button" size="default" variant="default">[\s\S]*\{publishLabel\}[\s\S]*<\/Button>/u,
	);
	const agentHeaderSource = AGENT_SOURCE.slice(
		AGENT_SOURCE.indexOf("export const AgentHeader = memo"),
		AGENT_SOURCE.indexOf("export type AgentContentProps"),
	);
	assert.doesNotMatch(AGENT_SOURCE, /import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u);
	assert.doesNotMatch(agentHeaderSource, /<ToggleGroup/u);
	assert.doesNotMatch(agentHeaderSource, /Configure/u);
	assert.doesNotMatch(agentHeaderSource, /<TabsTrigger/u);
});

test("Agent compact header nav keeps 8px between avatar and nav items", () => {
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_HEADER_AVATAR_NAV_GAP = 8;/u);
	assert.match(AGENT_SOURCE, /<div className="flex min-w-0 flex-1 items-center" style=\{\{ gap: AGENT_COMPACT_HEADER_AVATAR_NAV_GAP \}\}>/u);
	assert.doesNotMatch(AGENT_SOURCE, /<div className="flex min-w-0 flex-1 items-center gap-1">/u);
});

test("Agent component page wires compact filled and empty placeholder variations", () => {
	// The config surface now has a single (formerly "compact") layout — no
	// `layout` prop and no default/compact branch. The render starts at the
	// scrollable wrapper inside AgentConfigFields.
	const compactLayoutStart = AGENT_SOURCE.indexOf("data-agent-config-id={idPrefix}");
	const compactLayoutSource = AGENT_SOURCE.slice(compactLayoutStart);
	const compactFooterSource = compactLayoutSource.slice(
		compactLayoutSource.indexOf('<div className="shrink-0">'),
	);

	assert.match(AGENT_SOURCE, /compactScrollAreaClassName\?: string;/u);
	assert.match(AGENT_SOURCE, /compactScrollAreaClassName,/u);
	// The `layout` prop and the dual-branch render have been removed entirely.
	assert.doesNotMatch(AGENT_SOURCE, /layout\?: "default" \| "compact";/u);
	assert.doesNotMatch(AGENT_SOURCE, /layout = "default"/u);
	assert.doesNotMatch(AGENT_SOURCE, /data-agent-config-layout=/u);
	assert.doesNotMatch(AGENT_SOURCE, /layout === "compact"/u);
	// The compact footer is now a true bottom-anchored solid footer, not a
	// sticky overlay pulled up by negative margin. The old reserved-height
	// constant, footer-height ref/state, and ResizeObserver machinery are gone.
	assert.doesNotMatch(AGENT_SOURCE, /AGENT_COMPACT_CONFIG_FOOTER_RESERVED_HEIGHT/u);
	assert.doesNotMatch(AGENT_SOURCE, /compactFooterOverlayRef/u);
	assert.doesNotMatch(AGENT_SOURCE, /compactFooterOverlayHeight/u);
	assert.doesNotMatch(AGENT_SOURCE, /compactBentoFooterOffset/u);
	// No ResizeObserver footer-measuring effect remains.
	assert.doesNotMatch(AGENT_SOURCE, /updateFooterOverlayHeight/u);
	// Compact wrapper splits into a scrollable region + an anchored footer; it no
	// longer reserves bottom padding for an overlay.
	assert.match(compactLayoutSource, /<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">/u);
	// Scroll region carries `px-1.5` so descendant focus rings (including the
	// full-width title/description inputs, whose focus backdrop bleeds past their
	// box) aren't clipped by the auto horizontal overflow that `overflow-y-auto`
	// implies. The inner blocks deliberately do NOT cancel it with a negative
	// margin — doing so pulled full-width inputs back to the clip edge.
	assert.match(compactLayoutSource, /"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1\.5"[\s\S]*compactScrollOverflow\.showBottomScrollMask && "scroll-mask-bottom",[\s\S]*compactScrollAreaClassName,/u);
	assert.match(compactLayoutSource, /<div className="flex flex-col gap-4">/u);
	assert.doesNotMatch(compactLayoutSource, /-mx-1\.5/u);
	assert.doesNotMatch(compactLayoutSource, /paddingBottom/u);
	assert.doesNotMatch(compactLayoutSource, /lg:grid-cols-\[minmax\(0,280px\)_minmax\(0,1fr\)\]/u);
	assert.match(compactLayoutSource, /className="relative flex min-h-0 flex-1 flex-col"/u);
	// No fixed 560px min-height — the composer fills available space instead.
	assert.doesNotMatch(compactLayoutSource, /min-h-\[560px\]/u);
	// Empty compact agents start without unnecessary vertical scroll: the
	// instructions editor gets a shorter empty-state minimum, while filled
	// configs keep the larger editing surface.
	assert.match(compactLayoutSource, /contentClassName=\{cn\("pt-4", isFilledConfig \? "min-h-\[240px\]" : "min-h-\[2rem\]"\)\}/u);
	assert.match(compactLayoutSource, /editorClassName=\{isFilledConfig \? undefined : "agent-instructions-tiptap-editor-compact-empty"\}/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.agent-instructions-tiptap-editor\.agent-instructions-tiptap-editor-compact-empty \{\s*min-height: 32px;\s*\}/u);
	// The toolbar lives in a bottom-anchored footer (no overlay). The wrapper
	// itself is transparent so the separator/expand row shows content scrolling
	// behind it; the opaque surface lives on the field rows inside the toolbar.
	assert.match(compactFooterSource, /<div className="shrink-0">[\s\S]*<AgentCompactConfigToolbarBelow/u);
	assert.doesNotMatch(compactFooterSource, /shrink-0 bg-surface/u);
	assert.doesNotMatch(compactFooterSource, /sticky/u);
	assert.doesNotMatch(compactFooterSource, /marginTop/u);
	assert.match(compactFooterSource, /onAppendListItem=\{handleAppendListItem\}[\s\S]*onOpenDirectory=\{handleOpenDirectory\}[\s\S]*onRemoveListItem=\{handleRemoveListItem\}[\s\S]*onTextChange=\{handleTextChange\}/u);
	assert.match(compactLayoutSource, /onInstructionsChange=\{\(value\) => handleTextChange\("instructions", value\)\}/u);
	assert.doesNotMatch(compactLayoutSource, /toolbarBelowSlot=\{\(\s*<AgentCompactConfigToolbarBelow/u);
	assert.match(AGENT_SOURCE, /function AgentCompactConfigToolbarBelow/u);
	assert.doesNotMatch(AGENT_SOURCE, /showAddButtons=\{false\}/u);
	// The expanded compact toolbar now shows every supported field row, with a
	// persistent "+ Add" affordance for empty rows. No call site of
	// AgentFilledConfigSummary passes hideEmptyRows anymore.
	assert.doesNotMatch(AGENT_SOURCE, /<AgentFilledConfigSummary[\s\S]{0,400}hideEmptyRows/u);
	// The row-level skip guard for empty rows still drops rows that lack an
	// addLabel, but with addLabel set (the default) every row renders.
	assert.match(AGENT_SOURCE, /if \(isEmpty && \(hideWhenEmpty \|\| !addLabel\)\) \{/u);
	// AgentAddValueButton is the single visual chrome for Triggers and every
	// summary-row edit CTA: same edit glyph, sizing, typography, focus +
	// aria-expanded states. Empty rows pass descriptive placeholder copy through
	// `label`; filled rows pass "Edit". The hover-reveal opacity is NOT baked into
	// the base class — it is added via `className` ONLY for the filled-row spot, so
	// empty rows stay visible.
	assert.match(AGENT_SOURCE, /"inline-flex min-h-5 max-w-full shrink-0 items-center gap-1 rounded-xs p-0 text-left text-xs font-medium leading-4 text-text-subtlest transition-opacity hover:bg-transparent active:bg-transparent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-transparent aria-expanded:opacity-100"/u);
	assert.doesNotMatch(AGENT_SOURCE, /group\/add-link/u);
	assert.match(AGENT_SOURCE, /<span className="min-w-0 whitespace-normal group-hover\/agent-row:underline">\{label\}<\/span>/u);
	// Triggers summary row: clicking a configured chip opens the Triggers modal
	// with the complete automation definition set because instructions are shared.
	assert.match(
		AGENT_SOURCE,
		/<AgentReferenceChip[\s\S]*onClick=\{\s*onEditTriggers\s*\?\s*\(\) => onEditTriggers\(triggerDefinitions\)\s*:\s*undefined\s*\}[\s\S]*onRemove=\{canRemoveInline \? \(\) => handleRemoveTrigger\(index\) : undefined\}/u,
	);
	// The trailing "Edit" control opens the SAME collapsed-nav management flyout
	// (trigger list + "Add trigger ›" + "Manage triggers") as the compact strip,
	// by reusing AgentCompactTriggersNavButton with the edit-styled button as its
	// renderTrigger — so the expanded summary row and the collapsed nav share one
	// flyout. Picking an event from "Add trigger ›" appends to the same automation.
	assert.match(
		AGENT_SOURCE,
		/\{onEditTriggers \? \([\s\S]*triggerNavItem \? \([\s\S]*<AgentCompactTriggersNavButton\s*\n\s*item=\{triggerNavItem\}[\s\S]*renderTrigger=\{\s*\n\s*<AgentAddValueButton\s*\n\s*className="opacity-0 group-hover\/agent-row:opacity-100"\s*\n\s*icon="edit"\s*\n\s*label=\{addLabel \?\? "Edit"\}\s*\n\s*\/>/u,
	);
	// It falls back to the bare provider/event TriggerPicker only when the
	// collapsed-nav catalog entry (triggerNavItem) isn't supplied.
	assert.match(
		AGENT_SOURCE,
		/\) : \(\s*\n\s*<TriggerPicker\s*\n\s*label=\{addLabel \?\? "Edit"\}\s*\n\s*onSelectEvent=\{handleSelectEvent\}\s*\n\s*trigger=\{\s*\n\s*<AgentAddValueButton/u,
	);
	// The summary row now wraps the trailing Edit control in the same collapsed-nav
	// dropdown nav button the compact strip uses, keeping the two layouts consistent.
	const triggerSummaryRowStart = AGENT_SOURCE.indexOf("function AgentTriggerSummaryRow");
	const triggerSummaryRowSource = AGENT_SOURCE.slice(
		triggerSummaryRowStart,
		AGENT_SOURCE.indexOf("function AgentFilledConfigSummary"),
	);
	assert.match(triggerSummaryRowSource, /<AgentCompactTriggersNavButton/u);
	// The final chip and the inline +Add link share a single non-wrapping group so
	// they reflow to the next line together instead of leaving a gap when chips
	// fill the row. The empty-row +Add link renders separately and stays visible.
	// Both spots route through `renderAddButton`, which yields either the default
	// click link or a dropdown-backed control (renderAddControl) — the same
	// dropdown the collapsed nav opens.
	assert.match(AGENT_SOURCE, /const isLastItem = index === items\.length - 1;/u);
	assert.match(AGENT_SOURCE, /const renderAddButton = \(className\?: string\): ReactNode =>[\s\S]*renderAddControl\s*\? renderAddControl\(\{ icon: addIcon, label: addLabel, className \}\)[\s\S]*<AgentAddValueButton[\s\S]*className=\{className\}[\s\S]*onClick=\{onAdd\}/u);
	assert.match(AGENT_SOURCE, /if \(isLastItem && addLabel\) \{[\s\S]*className="inline-flex max-w-full items-center gap-1\.5"[\s\S]*\{renderAddButton\(\s*"shrink-0 opacity-0 transition-opacity group-hover\/agent-row:opacity-100/u);
	assert.match(AGENT_SOURCE, /\{isEmpty && addLabel \? renderAddButton\(\) : null\}/u);
	assert.match(AGENT_SOURCE, /const AGENT_EMPTY_ROW_ADD_LABELS: Record<AgentConfigListFieldName, string> = \{/u);
	assert.match(AGENT_SOURCE, /triggers: "Add rules for when this agent runs"/u);
	assert.match(AGENT_SOURCE, /conversationStarters: "Add prompts to help people start"/u);
	assert.match(AGENT_SOURCE, /knowledge: "Add knowledge to ground this agent"/u);
	assert.match(AGENT_SOURCE, /skills: "Add skills to guide specialized tasks"/u);
	assert.match(AGENT_SOURCE, /tools: "Add tools to extend what this agent can do"/u);
	assert.match(AGENT_SOURCE, /subagents: "Add subagents to handle specific scenarios"/u);
	assert.match(AGENT_SOURCE, /function getAgentFilledSummaryAddLabel\(field: AgentConfigListFieldName, isEmpty: boolean, showAddButtons: boolean\): string \| undefined \{[\s\S]*return isEmpty \? AGENT_EMPTY_ROW_ADD_LABELS\[field\] : "Edit";[\s\S]*\}/u);
	assert.match(AGENT_SOURCE, /import EditIcon from "@atlaskit\/icon\/core\/edit";/u);
	assert.match(AGENT_SOURCE, /import \{[\s\S]*DEFAULT_STARTER_ICON,[\s\S]*getStarterIcon,[\s\S]*type StarterIconKey,[\s\S]*\} from "@\/components\/blocks\/conversation-starters";/u);
	assert.match(AGENT_SOURCE, /function getConversationStarterSummaryItems\(config: AgentConfigFormValue\)/u);
	assert.match(AGENT_SOURCE, /const starterSummaryItems = getConversationStarterSummaryItems\(config\)\.slice\(0, MAX_AGENT_CONVERSATION_STARTERS\);/u);
	assert.match(AGENT_SOURCE, /const starterItems = starterSummaryItems\.map\(\(item\) => item\.label\);/u);
	// Every list-field row keeps a persistent +Add link. Directory-backed
	// fields open their directory first and fall back to onAppendListItem when no
	// directory opener is supplied.
	assert.match(AGENT_SOURCE, /export type AgentDirectoryKind = "knowledge" \| "tools" \| "apps" \| "skills" \| "memory" \| "conversationStarters";/u);
	assert.match(AGENT_SOURCE, /function openAgentDirectoryOrAppendListItem\([\s\S]*onOpenDirectory\?: \(directory: AgentDirectoryKind, selectedItem\?: string\) => void[\s\S]*onAppendListItem\?: \(field: AgentConfigListFieldName\) => void[\s\S]*onOpenDirectory\(directory\);[\s\S]*onAppendListItem\?\.\(field\);/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("triggers", triggerItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("skills", skillItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("apps", appItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("subagents", subagentItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("conversationStarters", starterItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addIcon=\{starterItems\.length > 0 \? "edit" : undefined\}/u);
	// Conversation starter chip icons follow the latest Tag standard: the glyph is
	// wrapped in the `IconTile` xxsmall/transparent treatment so it centers in the
	// chip's leading slot instead of left-aligning with an oversized gap.
	assert.match(AGENT_SOURCE, /const StarterIcon = getStarterIcon\(starterSummaryItems\[index\]\?\.icon \?\? DEFAULT_STARTER_ICON\);[\s\S]*<IconTile[\s\S]*icon=\{<Icon aria-hidden render=\{<StarterIcon label="" size="small" color="currentColor" \/>\} className="text-icon-subtle" \/>\}[\s\S]*size="xxsmall"[\s\S]*variant="transparent"/u);
	assert.match(AGENT_SOURCE, /tagColor="standard"/u);
	assert.match(AGENT_SOURCE, /<AgentTriggerSummaryRow[\s\S]*addLabel=\{getAgentFilledSummaryAddLabel\("triggers", triggerItems\.length === 0, showAddButtons\)\}[\s\S]*onEditTriggers=\{onEditTriggers\}/u);
	// Skills and Subagents "Add" buttons open the SAME dropdown the
	// collapsed nav shows (list + add flyout + browse), wired via renderAddControl
	// + renderTrigger so the two layouts share one experience.
	assert.match(AGENT_SOURCE, /label="Skills"\s+renderAddControl=\{renderDirectoryAddControl\("skills", skillsNavItem, skillItems\)\}/u);
	assert.match(AGENT_SOURCE, /const renderDirectoryAddControl = \([\s\S]*<AgentCompactDirectoryNavButton[\s\S]*onBrowse=\{\(\) => openAgentDirectoryOrAppendListItem\(field, field, onOpenDirectory, onAppendListItem\)\}[\s\S]*renderTrigger=\{<AgentAddValueButton className=\{className\} icon=\{icon\} label=\{label\} \/>\}/u);
	assert.match(AGENT_SOURCE, /label="Subagents"\s+renderAddControl=\{subagentsNavItem \? \(\{ label, className \}\) => \([\s\S]*<AgentCompactSubagentsNavButton[\s\S]*onCreateSubagent=\{\(\) => onAppendListItem\?\.\("subagents"\)\}[\s\S]*renderTrigger=\{<AgentAddValueButton className=\{className\} icon="add" label=\{label\} \/>\}/u);
	// The inline-below-row Tools search picker is gone — Tools now uses the same
	// dropdown as the other directory fields.
	assert.doesNotMatch(AGENT_SOURCE, /openInlineSearchPicker|browseInlineSearchPicker|selectInlineSearchItem|inlineSearchField|function AgentInlineReferenceSearchPicker/u);
	assert.match(AGENT_SOURCE, /label="Apps"[\s\S]*renderAddControl=\{appsNavItem \? \(\{ icon, label, className \}\) => \([\s\S]*<AgentCompactAppsNavButton[\s\S]*onBrowse=\{\(\) => openAgentDirectoryOrAppendListItem\("apps", "apps", onOpenDirectory, onAppendListItem\)\}[\s\S]*renderTrigger=\{<AgentAddValueButton className=\{className\} icon=\{icon\} label=\{label\} \/>\}/u);
	assert.match(AGENT_SOURCE, /label="Conversation starters"\s+onAdd=\{\(\) => openAgentDirectoryOrAppendListItem\("conversationStarters", "conversationStarters", onOpenDirectory, onAppendListItem\)\}/u);
	assert.match(AGENT_SOURCE, /function AgentCompactEmptyConfigNav/u);
	assert.match(AGENT_SOURCE, /function getAgentCompactEmptyConfigNavItems/u);
	assert.match(AGENT_SOURCE, /hiddenConfigFields\?: ReadonlySet<AgentHideableConfigField>;/u);
	assert.match(AGENT_SOURCE, /const items = getAgentCompactEmptyConfigNavItems\(config\)\.filter\(\s*\(item\) => !hiddenConfigFields\?\.has\(item\.agentFieldName as AgentHideableConfigField\),\s*\);/u);
	// Toolbar now always renders every supported field; counts come from the
	// existing helpers and a neutral Badge appears when count > 0.
	assert.match(AGENT_SOURCE, /case "apps":[\s\S]*count = getNonEmptyConfigItems\(config\.apps\)\.length/u);
	assert.match(AGENT_SOURCE, /case "conversationStarters":[\s\S]*count = getNonEmptyConfigItems\(config\.conversationStarters\)\.length/u);
	assert.match(AGENT_SOURCE, /agentFieldName: "conversationStarters",\s*label: "Conversation starters",\s*listFieldName: "conversationStarters"/u);
	assert.match(AGENT_SOURCE, /item\.count > 0 \? <Badge>\{item\.count\}<\/Badge> : null/u);
	assert.match(AGENT_SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/u);
	assert.match(AGENT_SOURCE, /className="relative flex min-h-8 min-w-0 items-center"/u);
	// Nav scrolls horizontally instead of wrapping or tucking items behind a
	// "..." overflow menu.
	assert.doesNotMatch(AGENT_SOURCE, /flex min-w-0 flex-wrap items-center gap-1/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_NAV_GAP = 2;/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_NAV_SCROLL_EDGE_THRESHOLD = 4;/u);
	assert.match(AGENT_SOURCE, /import \{ useHasHorizontalOverflow \} from "@\/components\/hooks\/use-has-horizontal-overflow";/u);
	assert.match(AGENT_SOURCE, /import \{ buildHorizontalScrollMaskStyle \} from "@\/components\/visual\/scroll-mask\/lib";/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_NAV_START_MASK_STYLE = buildHorizontalScrollMaskStyle\(\{\s*edge: "start",\s*fadeSize: "var\(--ds-space-300\)",\s*\}\);/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_NAV_END_MASK_STYLE = buildHorizontalScrollMaskStyle\(\{\s*edge: "end",\s*fadeSize: "var\(--ds-space-300\)",\s*\}\);/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_NAV_BOTH_MASK_STYLE = buildHorizontalScrollMaskStyle\(\{\s*edge: "both",\s*fadeSize: "var\(--ds-space-300\)",\s*\}\);/u);
	assert.match(AGENT_SOURCE, /const navOverflow = useHasHorizontalOverflow<HTMLDivElement>\(\{\s*edgeThreshold: AGENT_COMPACT_CONFIG_NAV_SCROLL_EDGE_THRESHOLD,\s*\}\);/u);
	assert.match(AGENT_SOURCE, /const scrollMaskStyle = navOverflow\.canScrollLeft && navOverflow\.canScrollRight[\s\S]*\? AGENT_COMPACT_CONFIG_NAV_BOTH_MASK_STYLE[\s\S]*: navOverflow\.canScrollLeft[\s\S]*\? AGENT_COMPACT_CONFIG_NAV_START_MASK_STYLE[\s\S]*: navOverflow\.canScrollRight[\s\S]*\? AGENT_COMPACT_CONFIG_NAV_END_MASK_STYLE[\s\S]*: \{\};/u);
	assert.match(AGENT_SOURCE, /function AgentCompactConfigNavButton\(/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="More configuration options"|AGENT_COMPACT_CONFIG_NAV_OVERFLOW_WIDTH|AGENT_COMPACT_CONFIG_NAV_RENDERED_OVERFLOW_THRESHOLD|AGENT_COMPACT_CONFIG_NAV_EDGE_MASK_STYLE/u);
	assert.match(AGENT_SOURCE, /className="relative -my-1 flex h-auto min-w-0 flex-1 items-center overflow-x-auto overflow-y-visible overscroll-x-contain rounded-none border-0 bg-transparent p-0 py-1 pl-1 \[scrollbar-width:none\] \[&::-webkit-scrollbar\]:hidden"[\s\S]*ref=\{navOverflow\.ref\}[\s\S]*style=\{\{\s*gap: AGENT_COMPACT_CONFIG_NAV_GAP,\s*\.\.\.scrollMaskStyle,\s*\}\}/u);
	assert.match(AGENT_SOURCE, /\{items\.map\(\(item\) => \{/u);
	// Collapsible toolbar: outer wrapper now stacks a "rule row" (horizontal
	// line + chevron at the far right) above an AnimatePresence crossfade that
	// swaps between the collapsed nav and the expanded filled summary.
	assert.doesNotMatch(AGENT_SOURCE, /hasVisibleAddOptions/u);
	assert.doesNotMatch(AGENT_SOURCE, /border-t border-border pt-2/u);
	assert.doesNotMatch(AGENT_SOURCE, /mx-1 h-4 w-px shrink-0 bg-border/u);
	assert.match(AGENT_SOURCE, /import \{ AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type MotionProps \} from "motion\/react";/u);
	assert.match(AGENT_SOURCE, /import ChevronDownIcon from "@atlaskit\/icon\/core\/chevron-down";/u);
	assert.match(AGENT_SOURCE, /import ChevronUpIcon from "@atlaskit\/icon\/core\/chevron-up";/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE = 24;/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_EXPAND_BUTTON_REVEAL_DISTANCE = 72;/u);
	assert.match(AGENT_SOURCE, /function AgentCompactConfigToolbarBelow\([\s\S]*const \[expanded, setExpanded\] = useState\(true\);[\s\S]*const shouldReduceMotion = useReducedMotion\(\);[\s\S]*const expandButtonRowRef = useRef<HTMLDivElement \| null>\(null\);[\s\S]*const expandButtonX = useMotionValue\(0\);[\s\S]*const expandButtonPaddingRight = useTransform\(expandButtonX, \(latest\): number =>[\s\S]*Math\.abs\(latest\) > 0\.5 \? AGENT_COMPACT_CONFIG_EXPAND_BUTTON_EDGE_GAP : 0,[\s\S]*\);[\s\S]*const expandButtonVisualX = useTransform\(expandButtonX, \(latest\): number =>[\s\S]*latest \+ \(Math\.abs\(latest\) > 0\.5 \? AGENT_COMPACT_CONFIG_EXPAND_BUTTON_EDGE_GAP : 0\),[\s\S]*\);[\s\S]*const isExpanded = expanded;/u);
	assert.match(AGENT_SOURCE, /window\.addEventListener\("pointermove", handlePointerMove, true\);[\s\S]*window\.removeEventListener\("pointermove", handlePointerMove, true\);/u);
	assert.match(AGENT_SOURCE, /const isNearBottom = pointerDistanceFromBottom >= -AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE[\s\S]*pointerDistanceFromBottom <= AGENT_COMPACT_CONFIG_EXPAND_BUTTON_REVEAL_DISTANCE;/u);
	assert.doesNotMatch(AGENT_SOURCE, /clampFloatingRovoButtonValue/u);
	assert.match(AGENT_SOURCE, /const restingCenterX = rect\.right - AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE \/ 2;/u);
	assert.match(AGENT_SOURCE, /const minCenterX = rect\.left \+ AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE \/ 2;/u);
	assert.match(AGENT_SOURCE, /const maxCenterX = rect\.right - AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE \/ 2;/u);
	assert.match(AGENT_SOURCE, /const targetCenterX = Math\.min\(Math\.max\(event\.clientX, minCenterX\), maxCenterX\);[\s\S]*expandButtonX\.set\(targetCenterX - restingCenterX\);/u);
	assert.match(AGENT_SOURCE, /return \(\s*<div className="flex flex-col">/u);
	assert.doesNotMatch(AGENT_SOURCE, /<div className="flex flex-col pb-6">/u);
	assert.match(AGENT_SOURCE, /<AnimatePresence initial=\{false\} mode="wait">/u);
	// The field-row blocks carry the opaque surface so they stay readable over
	// scrolling content, while the separator/expand row above stays transparent.
	// The expanded variant drops `overflow-hidden` (the crossfade only animates
	// opacity, so clipping isn't needed — and it would square off each row's
	// `rounded-md` hover highlight, whose `-mx-2` bleed sits at the clip edge);
	// the collapsed variant keeps `overflow-hidden` for its measured collapse.
	assert.match(AGENT_SOURCE, /<motion\.div\s+key="expanded"\s+\/\/[\s\S]*?className="bg-surface pt-2"/u);
	assert.match(AGENT_SOURCE, /<motion\.div\s+key="collapsed"\s+className="overflow-hidden bg-surface pt-2"/u);
	// Horizontal rule line spans the row; the chevron sits at the far right of
	// the same row and stays mounted across both states. Empty configs initialize
	// expanded so first-run users see all supported capability rows.
	assert.match(AGENT_SOURCE, /<div className="relative flex h-6 items-center" ref=\{expandButtonRowRef\}>[\s\S]*<div aria-hidden className="absolute inset-x-0 top-1\/2 h-px -translate-y-1\/2 bg-border" \/>/u);
	assert.match(AGENT_SOURCE, /<motion\.div[\s\S]*className="relative z-10 ml-auto bg-surface pl-2"[\s\S]*style=\{\{ paddingRight: expandButtonPaddingRight, x: expandButtonVisualX \}\}[\s\S]*>/u);
	assert.match(AGENT_SOURCE, /className="size-6 rounded border-border bg-surface-overlay px-0 text-icon-subtle hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed"/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label=\{isExpanded \? "Collapse configuration" : "Expand configuration"\}[\s\S]{0,260}boxShadow/u);
	assert.doesNotMatch(AGENT_SOURCE, /style=\{\{ boxShadow: token\("elevation\.shadow\.raised"\) \}\}/u);
	assert.match(AGENT_SOURCE, /aria-label=\{isExpanded \? "Collapse configuration" : "Expand configuration"\}[\s\S]*variant="ghost"/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label=\{isExpanded \? "Collapse configuration" : "Expand configuration"\}[\s\S]*variant="outline"/u);
	assert.match(AGENT_SOURCE, /aria-label=\{isExpanded \? "Collapse configuration" : "Expand configuration"\}/u);
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => setExpanded\(\(prev\) => !prev\)\}/u);
	assert.match(AGENT_SOURCE, /isExpanded \? \(\s*<ChevronDownIcon label="" size="small" \/>\s*\) : \(\s*<ChevronUpIcon label="" size="small" \/>\s*\)/u);
	// Reduced motion drops the animation duration.
	assert.match(AGENT_SOURCE, /shouldReduceMotion \? \{ duration: 0 \} : \{ duration: 0\.2, ease: "easeOut" as const \}/u);
	assert.match(AGENT_SOURCE, /import \{ LayoutDashboardIcon, MoreHorizontalIcon, PlusIcon \} from "@\/components\/ui\/vpk-icons";/u);
	assert.doesNotMatch(AGENT_SOURCE, /PlusCircleIcon/u);
	assert.doesNotMatch(AGENT_SOURCE, /agent-compact-config-marker/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Add agent configuration"/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(AGENT_SOURCE, /AGENT_COMPACT_HEADER_NAV_ITEMS = \[[\s\S]*label: "Details"[\s\S]*label: "Insights"[\s\S]*label: "Access"/u);
	assert.match(AGENT_SOURCE, /<LayoutDashboardIcon size="small" \/>/u);
	assert.match(AGENT_SOURCE, /<ChartTrendUpIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(AGENT_SOURCE, /<ScorecardIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(AGENT_SOURCE, /import \{[\s\S]*DropdownMenu,[\s\S]*DropdownMenuContent,[\s\S]*DropdownMenuGroup,[\s\S]*DropdownMenuItem,[\s\S]*DropdownMenuTrigger,[\s\S]*\} from "@\/components\/ui\/dropdown-menu";/u);
	assert.match(AGENT_SOURCE, /computeContextBarOverflow\([\s\S]*AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH,[\s\S]*AGENT_COMPACT_HEADER_NAV_GAP/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_HEADER_NAV_GAP = 4;/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_HEADER_AVATAR_NAV_GAP = 8;/u);
	assert.match(AGENT_SOURCE, /<div className="flex min-w-0 flex-1 items-center" style=\{\{ gap: AGENT_COMPACT_HEADER_AVATAR_NAV_GAP \}\}>/u);
	// Header nav clips horizontal overflow (so the "…" menu absorbs hidden items)
	// but keeps a 6px clip margin + vertical room so the active (outline) button's
	// offset focus ring isn't sheared off at the edge.
	assert.match(AGENT_SOURCE, /className="relative -my-1 flex min-w-0 flex-1 items-center overflow-x-clip overflow-y-visible py-1 pl-1 \[overflow-clip-margin:6px\]"[\s\S]*style=\{\{ gap: AGENT_COMPACT_HEADER_NAV_GAP \}\}/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH = 24;/u);
	assert.match(AGENT_SOURCE, /<DropdownMenuTrigger[\s\S]*aria-label="More agent sections"[\s\S]*render=\{<Button className="size-6 rounded px-0" size="icon-compact" type="button" variant="ghost" \/>\}[\s\S]*<MoreHorizontalIcon size="small" \/>/u);
	assert.match(AGENT_SOURCE, /hiddenItems\.map\(\(item\) => \([\s\S]*<DropdownMenuItem[\s\S]*elemBefore=\{item\.icon\}[\s\S]*key=\{item\.label\}[\s\S]*onSelect=\{\(\) => onSectionChange\?\.\(item\.value\)\}/u);
	assert.match(AGENT_SOURCE, /<Avatar label="Agent" shape="hexagon" size="sm">[\s\S]*<AvatarImage alt="" src=\{avatarSrc\} \/>/u);
	assert.match(AGENT_SOURCE, /export type AgentCompactHeaderSection = \(typeof AGENT_COMPACT_HEADER_NAV_ITEMS\)\[number\]\["value"\];/u);
	assert.match(AGENT_SOURCE, /activeSection\?: AgentCompactHeaderSection \| null;/u);
	assert.match(AGENT_SOURCE, /onSectionChange\?: \(section: AgentCompactHeaderSection\) => void;/u);
	assert.match(AGENT_SOURCE, /const isSelected = activeSection === item\.value;/u);
	assert.match(AGENT_SOURCE, /aria-pressed=\{isSelected \? true : undefined\}[\s\S]*onClick=\{\(\) => onSectionChange\?\.\(item\.value\)\}[\s\S]*variant=\{isSelected \? "outline" : "ghost"\}/u);
	assert.match(AGENT_SOURCE, /onSelect=\{\(\) => onSectionChange\?\.\(item\.value\)\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /\[&_svg\]:size-4!/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactInsightsPanel/u);
	assert.match(AGENT_SOURCE, /return <AgentInsights \{\.\.\.props\} \/>;/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactSurfacesPanel/u);
	assert.match(AGENT_SOURCE, /return <AgentSurfaces \{\.\.\.props\} \/>;/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactEvaluationPanel/u);
	assert.match(AGENT_SOURCE, /return <AgentEvaluation \{\.\.\.props\} \/>;/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactUsersPanel/u);
	assert.match(AGENT_SOURCE, /return <AgentUsers \{\.\.\.props\} \/>;/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactAccessPanel/u);
	assert.match(AGENT_SOURCE, /return <AgentAccess \{\.\.\.props\} \/>;/u);
	assert.match(AGENT_INDEX_SOURCE, /export \* from "\.\/components\/agent";/u);
	assert.match(AGENT_PAGE_SOURCE, /import AgentDemo from "@\/components\/website\/demos\/blocks\/agent-demo";/u);
	assert.match(AGENT_PAGE_SOURCE, /return <AgentDemo \/>;/u);
	assert.match(AGENT_PREVIEW_PAGE_SOURCE, /import AgentPage from "@\/components\/blocks\/agent\/page";/u);
	assert.match(AGENT_PREVIEW_PAGE_SOURCE, /title: getPreviewPageTitle\("agent", "blocks"\),/u);
	assert.match(AGENT_SURFACES_SOURCE, /function AgentDefaultSurfaceRow/u);
	assert.match(AGENT_SURFACES_SOURCE, /function AgentExtendedSurfaceRow/u);
	assert.match(AGENT_SURFACES_SOURCE, /data-agent-compact-section="surfaces"/u);
	assert.match(AGENT_SURFACES_SOURCE, /Default surfaces/u);
	assert.match(AGENT_SURFACES_SOURCE, /Extended surfaces/u);
	assert.match(AGENT_SURFACES_SOURCE, /label: "Rovo Chat"/u);
	assert.match(AGENT_SURFACES_SOURCE, /label: "Work items"[\s\S]*switchLabel: "Enable Work items surface"/u);
	assert.match(AGENT_SURFACES_SOURCE, /label: "Rovo browser extension"/u);
	assert.match(AGENT_SURFACES_SOURCE, /label: "Slack"/u);
	assert.match(AGENT_SURFACES_SOURCE, /actionLabel: "Add to portal"/u);
	assert.match(AGENT_SURFACES_SOURCE, /actionLabel: "Add to help center"/u);
	assert.match(AGENT_SURFACES_SOURCE, /import \{ Switch \} from "@\/components\/ui\/switch";/u);
	assert.doesNotMatch(AGENT_SURFACES_SOURCE, /<AccordionTrigger[\s\S]{0,900}<Button[\s\S]{0,120}surface\.actionLabel/u);
	assert.match(AGENT_SOURCE, /showSectionLabel=\{false\}/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/toolbarBelowSlot\?: ReactNode;[\s\S]*data-slot="rich-text-editor-toolbar-below"/u,
	);

	// Only two agent demos remain — Filled and Empty — both rendering the single
	// (formerly "compact") layout with the header nav + section switching. The
	// old "Compact"-named demos and the `layout` prop are gone.
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoFull/u);
	assert.match(AGENT_DEMO_SOURCE, /idPrefix="agent-demo-full"/u);
	assert.match(AGENT_DEMO_SOURCE, /import \{ Toggle \} from "@\/components\/ui\/toggle";/u);
	assert.match(AGENT_DEMO_SOURCE, /const \[activeSection, setActiveSection\] = useState<AgentCompactHeaderSection \| null>\("details"\);/u);
	assert.match(AGENT_DEMO_SOURCE, /const lastSectionRef = useRef<AgentCompactHeaderSection>\("details"\);/u);
	assert.match(AGENT_DEMO_SOURCE, /function handleHeaderSectionChange\(section: AgentCompactHeaderSection\) \{[\s\S]*lastSectionRef\.current = section;[\s\S]*setActiveView\("configure"\);[\s\S]*setActiveSection\(section\);[\s\S]*\}/u);
	assert.match(AGENT_DEMO_SOURCE, /function handleTestPressedChange\(pressed: boolean\) \{[\s\S]*if \(pressed\) \{[\s\S]*lastSectionRef\.current = activeSection;[\s\S]*setActiveView\("test"\);[\s\S]*setActiveSection\(null\);[\s\S]*return;[\s\S]*\}[\s\S]*setActiveView\("configure"\);[\s\S]*setActiveSection\(lastSectionRef\.current \?\? "details"\);[\s\S]*\}/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoFull[\s\S]*<AgentCompactHeaderNav activeSection=\{activeSection\} onSectionChange=\{handleHeaderSectionChange\} \/>/u);
	assert.match(AGENT_DEMO_SOURCE, /function AgentDemoHeaderActions/u);
	assert.match(AGENT_DEMO_SOURCE, /<Toggle[\s\S]*aria-label="Toggle agent test view"[\s\S]*onPressedChange=\{onTestPressedChange\}[\s\S]*pressed=\{activeView === "test"\}[\s\S]*variant="outline"[\s\S]*Test[\s\S]*<\/Toggle>/u);
	assert.doesNotMatch(AGENT_DEMO_SOURCE, /aria-label="Agent config views"|<ToggleGroup|<ToggleGroupItem|>Configure<\/ToggleGroupItem>/u);
	assert.match(AGENT_DEMO_SOURCE, /import \{ AgentTestPanel \} from "@\/components\/projects\/studio\/components\/rovo-app-agent-test-panel";/u);
	assert.match(AGENT_DEMO_SOURCE, /ConversationStartersDialog,[\s\S]*DEFAULT_STARTER_ICON,[\s\S]*type ConversationStarter,[\s\S]*type StarterIconKey,/u);
	assert.match(AGENT_DEMO_SOURCE, /function buildAgentDemoTestEntry\(config: AgentConfigFormValue\): StudioSessionAgentEntry/u);
	assert.match(AGENT_DEMO_SOURCE, /AgentTestPanel entry=\{testEntry\}/u);
	assert.doesNotMatch(AGENT_DEMO_SOURCE, /function AgentDemoTestPanel|data-testid="agent-demo-test-panel"/u);
	assert.match(AGENT_DEMO_SOURCE, /activeView === "test" \? \(/u);
	assert.match(AGENT_DEMO_SOURCE, /conversationStarters: \[[\s\S]*Can this policy answer an employee leave question\?[\s\S]*Summarize the relevant HR guidance for a manager\.[\s\S]*Create a follow-up work item for missing policy context\.[\s\S]*\]/u);
	assert.match(AGENT_DEMO_SOURCE, /const conversationStarterDialogValue = useMemo<readonly ConversationStarter\[\]>/u);
	assert.match(AGENT_DEMO_SOURCE, /function handleSaveConversationStarters\(starters: readonly ConversationStarter\[\]\)/u);
	assert.match(AGENT_DEMO_SOURCE, /onOpenDirectory=\{handleOpenDirectory\}/u);
	assert.match(AGENT_DEMO_SOURCE, /<ConversationStartersDialog[\s\S]*open=\{activeDirectory === "conversationStarters"\}[\s\S]*starters=\{conversationStarterDialogValue\}[\s\S]*maxStarters=\{3\}[\s\S]*onSave=\{handleSaveConversationStarters\}/u);
	assert.match(AGENT_DEMO_SOURCE, /export default function AgentDemo/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoEmpty/u);
	assert.match(AGENT_DEMO_SOURCE, /idPrefix="agent-demo-empty"/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoEmpty[\s\S]*<AgentCompactHeaderNav activeSection=\{activeSection\} onSectionChange=\{handleHeaderSectionChange\} \/>/u);
	assert.match(AGENT_DEMO_SOURCE, /activeSection === "details"[\s\S]*return configView;/u);
	assert.match(AGENT_DEMO_SOURCE, /activeSection === "insights"[\s\S]*<AgentCompactInsightsPanel \/>/u);
	assert.match(AGENT_DEMO_SOURCE, /activeSection === "surfaces"[\s\S]*<AgentCompactSurfacesPanel \/>/u);
	assert.match(AGENT_DEMO_SOURCE, /activeSection === "evaluation"[\s\S]*<AgentCompactEvaluationPanel \/>/u);
	assert.match(AGENT_DEMO_SOURCE, /activeSection === "users"[\s\S]*<AgentCompactUsersPanel \/>/u);
	assert.match(AGENT_DEMO_SOURCE, /activeSection === "access"[\s\S]*<AgentCompactAccessPanel \/>/u);
	assert.doesNotMatch(AGENT_DEMO_SOURCE, /showActions=\{false\}/u);
	// The removed demos and the `layout` prop must not reappear.
	assert.doesNotMatch(AGENT_DEMO_SOURCE, /AgentDemoCompactFilled|AgentDemoCompactEmpty|AgentDemoCompactSurfaces/u);
	assert.doesNotMatch(AGENT_DEMO_SOURCE, /layout="compact"/u);
	assert.match(BLOCK_DETAILS_SOURCE, /title: "Filled agent"[\s\S]*demoSlug: "agent-demo-full"/u);
	assert.match(BLOCK_DETAILS_SOURCE, /demoSlug: "agent-demo-full"[\s\S]*title: "Empty agent"[\s\S]*demoSlug: "agent-demo-empty"/u);
	assert.doesNotMatch(BLOCK_DETAILS_SOURCE, /agent-demo-compact-/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /"agent-demo-full": dynamic/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /default: mod\.AgentDemoFull/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /"agent-demo-empty": dynamic/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /default: mod\.AgentDemoEmpty/u);
	assert.doesNotMatch(WEBSITE_REGISTRY_SOURCE, /agent-demo-compact-/u);
});

test("Agent compact directory dropdowns keep persistent add and browse footers", () => {
	assert.match(AGENT_SOURCE, /function AgentCompactDirectoryNavButton\(/u);
	assert.match(AGENT_SOURCE, /directory: AgentInlineSearchField;/u);
	assert.match(AGENT_SOURCE, /onAddSearchItem\?: \(item: RichTextSuggestionMenuItem\) => void;/u);
	assert.match(AGENT_SOURCE, /function AgentCompactDirectoryNavButton[\s\S]*<MenubarContent[\s\S]*?align="start"[\s\S]*?className=\{cn\("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS\)\}[\s\S]*?>[\s\S]*<div className="min-h-0 flex-1 overflow-y-auto">[\s\S]*<AgentCompactNavMenuPinnedFooter bordered=\{!isEmpty\}>[\s\S]*\{addSearchFlyout\}[\s\S]*\{browseItem\}/u);
	assert.match(AGENT_SOURCE, /const addSearchFlyout = \([\s\S]*<DropdownMenuSub>[\s\S]*<DropdownMenuSubTrigger>[\s\S]*\{addLabel\}[\s\S]*<DropdownMenuSubContent className="w-auto min-w-0 overflow-visible border-0 bg-transparent p-0 shadow-none">[\s\S]*<EditorPaletteSearchPicker[\s\S]*autoFocus[\s\S]*category=\{AGENT_INLINE_SEARCH_CATEGORY_BY_FIELD\[directory\]\}[\s\S]*className="rich-text-command-menu-borderless"[\s\S]*onBrowseAll=\{onBrowse\}[\s\S]*onSelectItem=\{handlePickerSelect\}/u);
	// Already-added skills/tools are excluded from the inline "Add" search so the
	// same item cannot be re-added from the flyout.
	assert.match(AGENT_SOURCE, /function AgentCompactDirectoryNavButton[\s\S]*<EditorPaletteSearchPicker[\s\S]*excludeLabels=\{items\}/u);
	assert.match(AGENT_SOURCE, /onAddSearchItem=\{\(searchItem\) => \{[\s\S]*if \(searchItem\.disabled\) \{[\s\S]*return;[\s\S]*onAddListValues\?\.\(directory, \[searchItem\.label\]\);[\s\S]*\}\}/u);
	assert.match(AGENT_SOURCE, /browseLabel=\{`Browse \$\{item\.label\.toLowerCase\(\)\}`\}[\s\S]*onBrowse=\{\(\) => openAgentDirectoryOrAppendListItem\(directory, directory, onOpenDirectory, onAppendListItem\)\}/u);
	assert.match(TRIGGERS_SOURCE, /<RichTextCommandMenuSearchField[\s\S]*label="Search triggers"[\s\S]*onValueChange=\{setQuery\}[\s\S]*placeholder="Search triggers"[\s\S]*value=\{query\}/u);
	assert.doesNotMatch(TRIGGERS_SOURCE, /rich-text-command-menu-input|data-first-item-input|isCompact/u);
});

test("Agent compact subagents dropdown keeps add and manage actions pinned", () => {
	assert.match(AGENT_SOURCE, /function AgentCompactSubagentsNavButton/u);
	assert.match(AGENT_SOURCE, /function AgentCompactSubagentsNavButton[\s\S]*<MenubarContent[\s\S]*?align="start"[\s\S]*?className=\{cn\("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS\)\}[\s\S]*?>[\s\S]*<div className="min-h-0 flex-1 overflow-y-auto">[\s\S]*selected=\{selectedIndex === index\}[\s\S]*<AgentCompactNavMenuPinnedFooter bordered=\{!isEmpty\}>[\s\S]*Add subagent[\s\S]*Manage subagents/u);
	assert.doesNotMatch(AGENT_SOURCE, /Browse subagents/u);
});

test("Agent compact added-item dropdowns do not auto-highlight rows on pointer open", () => {
	assert.doesNotMatch(AGENT_SOURCE, /MenuPrimitive\.createHandle|handle=\{compactNavMenu\.handle\}/u);
	assert.match(AGENT_SOURCE, /function useCompactNavMenuNoInitialHighlight\(\)[\s\S]*useRef\(false\)[\s\S]*useState\(0\)[\s\S]*shouldClearCompactNavInitialHighlight\(eventDetails\)[\s\S]*setResetToken\(\(currentResetToken\) => currentResetToken \+ 1\)/u);
	assert.match(AGENT_SOURCE, /function shouldClearCompactNavInitialHighlight[\s\S]*eventDetails\.reason === "trigger-hover"[\s\S]*eventDetails\.reason !== "trigger-press"[\s\S]*event instanceof PointerEvent[\s\S]*event\.detail !== 0/u);
	assert.match(AGENT_SOURCE, /function AgentCompactNavMenuInitialHighlightReset[\s\S]*closest<HTMLElement>\([\s\S]*"\[data-slot='menubar-content'\], \[data-slot='dropdown-menu-content'\]"[\s\S]*\)[\s\S]*queueMicrotask[\s\S]*requestAnimationFrame\(clear\)[\s\S]*window\.setTimeout\(clear, 120\)/u);
	assert.match(AGENT_SOURCE, /function clearCompactNavInitialHighlight\(contentElement: HTMLElement\)[\s\S]*querySelectorAll<HTMLElement>\("\[data-highlighted\]"\)[\s\S]*removeAttribute\("data-highlighted"\)[\s\S]*setAttribute\("tabindex", "-1"\)[\s\S]*contentElement\.contains\(activeElement\)[\s\S]*activeElement !== contentElement[\s\S]*contentElement\.focus\(\{ preventScroll: true \}\)/u);
	for (const [functionName, nextFunctionName] of [
		["AgentCompactSubagentsNavButton", "AgentCompactTriggerRow"],
		["AgentCompactTriggersNavButton", "AgentCompactDirectoryNavButton"],
		["AgentCompactDirectoryNavButton", "AgentCompactAppsNavButton"],
		["AgentCompactAppsNavButton", "AgentCompactConversationStartersNavButton"],
		["AgentCompactConversationStartersNavButton", "AgentCompactEmptyConfigNav"],
	]) {
		const start = AGENT_SOURCE.indexOf(`function ${functionName}`);
		assert.notEqual(start, -1, `${functionName} should exist`);
		const end = AGENT_SOURCE.indexOf(`function ${nextFunctionName}`, start + 1);
		assert.notEqual(end, -1, `${nextFunctionName} should follow ${functionName}`);
		const source = AGENT_SOURCE.slice(start, end);
		assert.match(source, /const compactNavMenu = useCompactNavMenuNoInitialHighlight\(\);/u, `${functionName} should create compact menu reset state`);
		assert.match(source, /<MenubarMenu onOpenChange=\{compactNavMenu\.onOpenChange\}>/u, `${functionName} should keep the in-tree menu store for positioning`);
		assert.match(source, /<AgentCompactNavMenuInitialHighlightReset[\s\S]*enabled=\{compactNavMenu\.resetInitialHighlight\}[\s\S]*resetToken=\{compactNavMenu\.resetToken\}/u, `${functionName} should reset the pointer-open highlight inside the real popup`);
		assert.doesNotMatch(source, /handle=\{compactNavMenu\.handle\}/u, `${functionName} should not use a detached menu handle`);
	}
});

test("Agent compact apps field opens a dropdown menu instead of the directory", () => {
	// Regression: clicking the collapsed-nav "Apps" trigger used to route through
	// getAgentCompactConfigNavItemOnClick and open the apps directory immediately.
	// Apps must now render its own dropdown (like Skills) with a pinned
	// "Browse apps" footer that opens the directory.
	assert.match(AGENT_SOURCE, /function AgentCompactAppsNavButton/u);
	assert.match(AGENT_SOURCE, /function AgentCompactAppsNavButton[\s\S]*<MenubarContent[\s\S]*?align="start"[\s\S]*?className=\{cn\("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS\)\}[\s\S]*?>[\s\S]*<AgentCompactNavMenuPinnedFooter bordered=\{!isEmpty\}>[\s\S]*Browse \{item\.label\.toLowerCase\(\)\}/u);
	// Already-added apps are excluded from the inline "Add apps" search.
	assert.match(AGENT_SOURCE, /function AgentCompactAppsNavButton[\s\S]*<EditorPaletteSearchPicker[\s\S]*excludeLabels=\{apps\}/u);
	// The apps nav field is wired to the dropdown, not the fallback click button.
	assert.match(AGENT_SOURCE, /item\.agentFieldName === "apps"\)\s*\{\s*return \(\s*<AgentCompactAppsNavButton[\s\S]*onBrowse=\{\(\) => openAgentDirectoryOrAppendListItem\("apps", "apps", onOpenDirectory, onAppendListItem\)\}/u);
	// The old immediate-open path is gone from the click helper: the trigger
	// branch is now directly followed by the skills branch, with no apps branch
	// between them.
	assert.match(AGENT_SOURCE, /item\.agentFieldName === "trigger"\)\s*\{\s*return \(\) => onEditTriggers\?\.\(\[\]\);\s*\}\s*if \(item\.agentFieldName === "skills"\)/u);
});

test("Bento carousel overflow hook reattaches listeners when the scroll node remounts", () => {
	assert.match(HORIZONTAL_OVERFLOW_HOOK_SOURCE, /const \[element, setElement\] = useState<T \| null>\(null\);/u);
	assert.match(HORIZONTAL_OVERFLOW_HOOK_SOURCE, /elementRef\.current = node;\s*setElement\(node\);/u);
	assert.match(HORIZONTAL_OVERFLOW_HOOK_SOURCE, /useEffect\(\(\) => \{\s*if \(!element\) return undefined;[\s\S]*element\.addEventListener\("scroll", updateScrollState/u);
	assert.match(HORIZONTAL_OVERFLOW_HOOK_SOURCE, /\}, \[element, updateScrollState\]\);/u);
});

test("Agent profile inline edit fields align to the profile content edge", () => {
	assert.match(INLINE_EDIT_SOURCE, /import \{ motion, type MotionProps \} from "motion\/react"/u);
	assert.match(
		INLINE_EDIT_SOURCE,
		/readViewMotionProps\?: Pick<MotionProps, "initial" \| "animate" \| "whileHover" \| "whileFocus" \| "variants" \| "transition">/u,
	);
	assert.match(
		INLINE_EDIT_SOURCE,
		/readViewBackdropMotionProps\?: Pick<MotionProps, "variants" \| "transition">/u,
	);
	assert.match(INLINE_EDIT_SOURCE, /shouldAnimateReadViewReturn, setShouldAnimateReadViewReturn/u);
	assert.match(INLINE_EDIT_SOURCE, /setShouldAnimateReadViewReturn\(true\)[\s\S]*setEditing\(false\)/u);
	assert.match(
		INLINE_EDIT_SOURCE,
		/readViewReturnInitial = shouldAnimateReadViewReturn[\s\S]*readViewMotionProps\?\.whileFocus \?\? readViewMotionProps\?\.whileHover/u,
	);
	assert.match(INLINE_EDIT_SOURCE, /<motion\.button[\s\S]*\{\.\.\.resolvedReadViewMotionProps\}/u);
	assert.match(INLINE_EDIT_SOURCE, /data-slot="inline-edit-read-view-backdrop"[\s\S]*\{\.\.\.readViewBackdropMotionProps\}/u);
	assert.match(
		AGENT_SOURCE,
		/const AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS = \{[\s\S]*whileHover: "active",[\s\S]*whileFocus: "active",[\s\S]*rest: \{ paddingLeft: 0, paddingRight: 0 \},[\s\S]*active: \{ paddingLeft: "0\.375rem", paddingRight: "0\.375rem" \},[\s\S]*visualDuration: 0\.18/u,
	);
	assert.match(
		AGENT_SOURCE,
		/const AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS = \{[\s\S]*rest: \{ opacity: 0, scaleX: 0\.98 \},[\s\S]*active: \{ opacity: 1, scaleX: 1 \},[\s\S]*visualDuration: 0\.18/u,
	);
	assert.doesNotMatch(AGENT_SOURCE, /paddingLeft: 8|paddingRight: 8/u);
	assert.match(
		AGENT_SOURCE,
		/readViewClassName="relative h-auto overflow-visible border-2 bg-transparent px-0 py-1 text-2xl leading-7 font-semibold hover:bg-transparent active:bg-transparent focus:border-border-focused focus-visible:border-border-focused focus-visible:bg-transparent"/u,
	);
	assert.match(AGENT_SOURCE, /readViewMotionProps=\{AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS\}/u);
	assert.match(AGENT_SOURCE, /readViewBackdropClassName="-inset-0\.5 bg-bg-neutral-subtle-hovered"/u);
	assert.doesNotMatch(AGENT_SOURCE, /readViewBackdropClassName="-inset-x-2/u);
	assert.match(AGENT_SOURCE, /readViewBackdropMotionProps=\{AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS\}/u);
	assert.match(
		AGENT_SOURCE,
		/inputProps=\{\{ className: "h-auto border-2 px-1\.5 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" \}\}/u,
	);
	assert.doesNotMatch(AGENT_SOURCE, /readViewClassName="-mx-2/u);
	assert.match(
		AGENT_SOURCE,
		/textareaProps=\{\{ rows: 1, className: "min-h-10 border-2 bg-bg-neutral-subtle px-1\.5/u,
	);
	assert.doesNotMatch(AGENT_SOURCE, /className: "-mx-2/u);
});

test("Shared Tiptap editor is SSR-safe and emits markdown updates", () => {
	assert.match(RICH_TEXT_EDITOR_SOURCE, /import \{ EditorContent, useEditor \} from "@tiptap\/react";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /contentType: "markdown"/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /immediatelyRender: false/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /"--rich-text-placeholder": toCssString\(placeholder\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /placeholder && !placeholderSlot/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /placeholderSlot\?: ReactNode;/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/placeholderSlot && isEmpty && viewMode === "rendered"[\s\S]*data-slot="rich-text-editor-placeholder"[\s\S]*pointer-events-none absolute inset-0/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /data-empty=\{isEmpty \? "true" : undefined\}/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/onUpdate: \(\{ editor: activeEditor \}\) => \{[\s\S]*const markdown = activeEditor\.getMarkdown\(\);[\s\S]*onMarkdownChangeRef\.current\?\.\(markdown\);/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /editor\.commands\.setContent\(nextValue, \{[\s\S]*contentType: "markdown",[\s\S]*emitUpdate: false/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_SOURCE, /absolute top-0 left-0/u);
});

test("Shared Tiptap editor reports and removes reference mention tokens", () => {
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onMentionInventoryChange\?: \(mentions: readonly RichTextMentionItem\[\]\) => void;/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /mentionRemovalRequest\?: RichTextMentionRemovalRequest \| null;/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /function getEditorMentionInventory\(editor: Editor\): readonly RichTextMentionItem\[\]/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /isRichTextReferenceCategory\(category\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /function removeMentionsFromEditor\(/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /transaction = transaction\.delete\(range\.from, range\.to\);/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onMentionInventoryChangeRef\.current\?\.\(getEditorMentionInventory\(activeEditor\)\);/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onMentionRemovalRequestHandled\?\.\(mentionRemovalRequest\.key\);/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onMentionInventoryChangeRef\.current\?\.\(getEditorMentionInventory\(editor\)\);/u);
});

test("Shared Tiptap placeholder stays aligned with the editable paragraph", () => {
	assert.match(
		RICH_TEXT_EDITOR_CSS,
		/\.rich-text-editor-content\[data-empty="true"\] \.tiptap-editor > p:first-child::before/u,
	);
	assert.match(RICH_TEXT_EDITOR_CSS, /content: var\(--rich-text-placeholder\);/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /float: left;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /height: 0;/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-editor-content\[data-empty="true"\] \.tiptap-editor > p:first-child::before \{[^}]*position:\s*absolute/u);
});

test("Shared Tiptap extensions wire Markdown, mentions, and slash suggestions", () => {
	for (const importPath of [
		"@tiptap/markdown",
		"@tiptap/extension-mention",
		"@tiptap/suggestion",
	]) {
		assert.match(RICH_TEXT_EXTENSIONS_SOURCE, new RegExp(importPath.replace("/", "\\/"), "u"));
	}

	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /const SlashCommand = Extension\.create/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Suggestion<RichTextSlashAction/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /char: "\/"/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Mention\.configure/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /const RichTextMention = Mention\.extend/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /ReactNodeViewRenderer\(RichTextMentionNodeView\)/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /getRichTextMentionVisualAttrs\(mention\.visual\)/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /data-visual-icon-color/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /visualSrc/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /data-type": "mention"/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /import \{ HoverCard, HoverCardTrigger \} from "@\/components\/ui\/hover-card";/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /import \{ Tag \} from "@\/components\/ui\/tag";/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /getRichTextReferencePreview,[\s\S]*RichTextReferencePreviewContent/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /const REFERENCE_CATEGORIES:[\s\S]*"app"[\s\S]*"skill"[\s\S]*"tool"[\s\S]*"knowledge"/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /const preview = isReferenceCategory\(category\) \? getRichTextReferencePreview\(category, label\) : undefined;/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /const tag = \([\s\S]*<Tag[\s\S]*elemBefore=\{visual \? \(/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /<NodeViewWrapper[\s\S]*as="span"[\s\S]*className="rich-text-mention-node inline-flex"/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /\{preview \? \([\s\S]*<HoverCard>[\s\S]*<HoverCardTrigger closeDelay=\{80\} delay=\{120\} render=\{<span className="inline-flex max-w-full" \/>\}>[\s\S]*\{tag\}[\s\S]*<\/HoverCardTrigger>[\s\S]*<RichTextReferencePreviewContent preview=\{preview\} \/>[\s\S]*<\/HoverCard>[\s\S]*\) : tag\}/u);
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /type=\{getRichTextMentionTagType\(visual\)\}/u);
	assert.doesNotMatch(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /className="rich-text-mention"/u);
	// Mention tokens render with the visual-derived accent color (synced with the
	// agent config-panel reference chips) rather than a hardcoded gray chip.
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /color=\{getRichTextMentionTagColor\(visual\)\}/u);
	assert.doesNotMatch(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /color="gray"/u);
	// Visual resolution falls back to the directory entry so a token shows the
	// same icon/logo as its config-panel chip even when stored attrs lack one.
	assert.match(RICH_TEXT_MENTION_NODE_VIEW_SOURCE, /getDirectoryMentionItemOrFallback\(category, label\)\.visual/u);
	// The shared color helper lives alongside the visual helpers so both the node
	// view and the config chips resolve color from a single source of truth.
	assert.match(RICH_TEXT_MENTION_VISUAL_SOURCE, /export function getRichTextMentionTagColor\(/u);
	// Every mention visual (avatar, image, logo, icon) now occupies the same 16px
	// box inside a tag, so the logo no longer scales up for menu rows — it stays a
	// single `xxsmall` constant regardless of `size`.
	assert.match(RICH_TEXT_MENTION_VISUAL_SOURCE, /const logoSize = "xxsmall";/u);
	assert.match(RICH_TEXT_MENTION_VISUAL_SOURCE, /<IconTile[\s\S]*border border-border bg-surface[\s\S]*visual\.iconColor/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Markdown\.configure/u);
});

test("Slash command menu contains every toolbar command", () => {
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /"format"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /import \{ RovoColorIcon \} from "@\/components\/ui\/logo";/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const ASK_ROVO_SLASH_ITEM: RichTextSuggestionMenuItem = \{[\s\S]*id: "ask-rovo",[\s\S]*label: "Ask Rovo",/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /includeFormat = true/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /variant: SuggestionVariant = "nested"/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /suggestionVariant = "nested"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function shouldUseFlatSurface\(query: string\): boolean \{[\s\S]*return isFlat \|\| \(!activeCategory && query\.trim\(\)\.length > 0\);[\s\S]*\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /if \(shouldUseFlatSurface\(query\)\) \{[\s\S]*return buildFlatSurfaceRows\(getFlatSections\(\), query, expandedSections\);/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /return \[\s*ASK_ROVO_SLASH_ITEM,[\s\S]*\.\.\.getSlashCategoryOrder\(includeFormat\)\.map/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /buildFlatSurfaceRows\(getFlatSections\(\), query, expandedSections, \[ASK_ROVO_SLASH_ITEM\]\)/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /item\.id === ASK_ROVO_SLASH_ITEM\.id/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function getAskRovoHeader\(\): ReactNode \{[\s\S]*<RichTextCommandMenuSearchField[\s\S]*icon=\{ASK_ROVO_SLASH_ITEM\.icon\}[\s\S]*label=\{ASK_ROVO_SLASH_ITEM\.label\}[\s\S]*onEscape=\{dismissSuggestion\}[\s\S]*onSubmit=\{submitAskRovoPrompt\}[\s\S]*onValueChange=\{updateAskRovoPrompt\}[\s\S]*value=\{askRovoPrompt\}/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /import \{ Suggestion, exitSuggestion \} from "@tiptap\/suggestion";/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /\(editor\) => exitSuggestion\(editor\.view, slashCommandPluginKey\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function shouldHideSlashRowsForAskRovoPrompt\(\): boolean \{[\s\S]*askRovoPrompt\.trim\(\)\.length > 0/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const items = shouldHideSlashRowsForAskRovoPrompt\(\)[\s\S]*\? \[\][\s\S]*: getVisibleItems\(props\.query\);/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /header: isFlat \|\| !activeCategory \? getAskRovoHeader\(\) : undefined/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function submitAskRovoPrompt\(\): boolean \{[\s\S]*currentProps\.command\(\{ type: "ask-rovo", onAskRovo \}\)/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /props\.type === "ask-rovo"[\s\S]*props\.onAskRovo\?\.\(editor\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onAskRovoRef = useRef\(onAskRovo\)/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-item-sticky \{\s*position: sticky;\s*top: 0;/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /category === "format" \? "Format"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /getSlashCommandFormatItems/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /import TableIcon from "@atlaskit\/icon\/core\/table";/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /view-type-table-home/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /useLayoutEffect\(\(\) => \{[\s\S]*scrollIntoView\(\{ block: "nearest" \}\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const SUGGESTION_PAGE_KEY_STEP = 5;/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function moveSelection\(direction: -1 \| 1, paged: boolean\)[\s\S]*getPagedSelectableIndex\(items, selectedIndex, direction\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /event\.key === "PageDown"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /moveSelection\(1, true\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /event\.key === "PageUp"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /moveSelection\(-1, true\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /event\.key === "Home"[\s\S]*getFirstSelectableIndex\(items, 0\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /event\.key === "End"[\s\S]*clampSelectedIndex\(items, items\.length - 1\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function getMentionChildDescription\(item: RichTextMentionItem\): string/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /description: getMentionChildDescription\(item\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /description: "Use the default paragraph style for body copy\."/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /description: "Align the current block to the left edge\."/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /"people-team": "People and team"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /subagent: "Subagents"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /type RichTextMentionParentCategory = "people-team" \| "subagent";/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const MENTION_TARGET_ORDER: readonly RichTextMentionParentCategory\[\] = \[\s*"people-team",\s*"subagent",\s*\]/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /category === "people-team"[\s\S]*<PeopleGroupIcon label="" size="small" \/>[\s\S]*: getCategoryIcon\(category\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /RICH_TEXT_REFERENCE_CATEGORY_OPTIONS/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /getRichTextReferenceCategoryIcon/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /getRichTextReferenceCategoryLabel/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /isRichTextReferenceCategory\(category\)[\s\S]*return getRichTextReferenceCategoryIcon\(category\);/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /@atlaskit\/icon\/core\/library/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const PEOPLE_AVATAR_SRCS = \[[\s\S]*\/avatar-user\/andrea-wilson\/color\/asow-service-yellow\.png/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const TEAM_AVATAR_SRCS = \[[\s\S]*\/avatar-project\/rocket\.svg/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function getStableAssetIndex\(seed: string, assetCount: number\): number/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /item\.category === "human"[\s\S]*shape: "circle"[\s\S]*PEOPLE_AVATAR_SRCS/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /item\.category === "team"[\s\S]*shape: "square"[\s\S]*TEAM_AVATAR_SRCS/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const AGENT_AVATAR_SRCS = \[[\s\S]*\/avatar-agent\/dev-agents\/code-planner\.svg/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /item\.category === "subagent"[\s\S]*shape: "hexagon"[\s\S]*AGENT_AVATAR_SRCS/u);
	// The mention catalog now sources every vertical from the unified data layer.
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /from "@\/app\/data\/directory"/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /DEFAULT_SKILLS,/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /DEFAULT_KNOWLEDGE_APPS,/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /DEMO_AGENT_BROWSER_AGENTS,/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /DEFAULT_SKILLS\.map\(mapSkillToMentionItem\)/u);
	// Skill visuals are derived via the loader's getSkillDirectoryVisual helper.
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /getSkillDirectoryVisual\(skill\)/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /\[\.\.\.DEMO_TOOLS, \.\.\.DEMO_SESSION_TOOLS\]\.map\(mapToolToMentionItem\)/u);
	// The unified catalog adds the human + team verticals.
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /SAMPLE_AGENT_PEOPLE\.map\(mapPersonToMentionItem\)/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /DEMO_TEAMS\.map\(mapTeamToMentionItem\)/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /getDirectoryMentionItemOrFallback/u);
	assert.doesNotMatch(EDITOR_PALETTE_MENTION_SOURCES, /SKILL_METADATA/u);
	assert.match(EDITOR_PALETTE_SOURCE, /getSlashCommandCategoryItems\(mentionSources\)/u);
	assert.match(EDITOR_PALETTE_SOURCE, /getMentionChildItems\(mentionSources, category\)/u);
	assert.match(EDITOR_PALETTE_SOURCE, /export type EditorPaletteVariant = "nested" \| "flat" \| "search";/u);
	assert.match(EDITOR_PALETTE_SOURCE, /export type EditorPaletteSearchCategory = Extract<[\s\S]*"knowledge" \| "skill" \| "subagent" \| "tool"/u);
	assert.match(EDITOR_PALETTE_SOURCE, /variant === "search" \? \([\s\S]*<SearchPalette category=\{searchCategory\} mentionSources=\{mentionSources\} \/>/u);
	assert.match(EDITOR_PALETTE_SOURCE, /suggestionVariant=\{variant === "search" \? "flat" : variant\}/u);
	assert.match(EDITOR_PALETTE_SOURCE, /export function EditorPaletteSearchPicker\(/u);
	// The picker drops already-configured rows by normalized label so an added
	// app/skill cannot reappear in the inline "Add" search.
	assert.match(EDITOR_PALETTE_SOURCE, /excludeLabels\?: readonly string\[\];/u);
	assert.match(EDITOR_PALETTE_SOURCE, /function excludeItemsByLabel\([\s\S]*item\.label\.trim\(\)\.toLowerCase\(\)/u);
	assert.match(EDITOR_PALETTE_SOURCE, /const sourceItems = excludeItemsByLabel\([\s\S]*excludeLabels,\s*\);/u);
	// The empty state now comes from the shared RichTextSuggestionEmptyState
	// (in suggestion-menu.tsx); the page no longer owns a local copy or the
	// @/components/ui/empty imports it required.
	assert.match(EDITOR_PALETTE_SOURCE, /import \{[\s\S]*RichTextSuggestionEmptyState,[\s\S]*\} from "@\/components\/ui-custom\/rich-text-editor";/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /from "@\/components\/ui\/empty";/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /function EditorPaletteSearchEmptyState\(/u);
	assert.match(EDITOR_PALETTE_SOURCE, /RichTextCommandMenuSearchField/u);
	assert.match(EDITOR_PALETTE_SOURCE, /function NestedPalette\([\s\S]*const \[commandPrompt, setCommandPrompt\] = useState\(""\);/u);
	assert.match(EDITOR_PALETTE_SOURCE, /title="Commands"[\s\S]*header=\{\([\s\S]*<RichTextCommandMenuSearchField[\s\S]*icon=\{ASK_ROVO_LEAD_ITEM\.icon\}[\s\S]*label=\{ASK_ROVO_LEAD_ITEM\.label\}[\s\S]*onClear=\{\(\) => setCommandPrompt\(""\)\}[\s\S]*onValueChange=\{setCommandPrompt\}[\s\S]*value=\{commandPrompt\}/u);
	assert.match(EDITOR_PALETTE_SOURCE, /id: SEARCH_BROWSE_ALL_ITEM_ID,[\s\S]*label: "Browse all"/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /id: SEARCH_BROWSE_ALL_ITEM_ID,[\s\S]*stickyPosition: "bottom"/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /SEARCH_INPUT_ITEM_ID/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /SEARCH_EMPTY_ITEM_ID/u);
	assert.match(EDITOR_PALETTE_SOURCE, /function normalizeSearchPickerItem\([\s\S]*item: RichTextSuggestionMenuItem,[\s\S]*\): RichTextSuggestionMenuItem \{[\s\S]*return item\.persistentDescription[\s\S]*\? \{ \.\.\.item, persistentDescription: false \}[\s\S]*: item;/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /persistentDescription: true/u);
	assert.match(EDITOR_PALETTE_SOURCE, /const sourceItems = excludeItemsByLabel\(\s*\(itemsProp \?\? getMentionChildItems\(mentionSources, category\)\)\.map\(normalizeSearchPickerItem\),[\s\S]*excludeLabels,\s*\);/u);
	assert.match(EDITOR_PALETTE_SOURCE, /const leadingRows = leadingItems\.map\(normalizeSearchPickerItem\);/u);
	assert.match(EDITOR_PALETTE_SOURCE, /const rows = items\.length > 0[\s\S]*\? \[\.\.\.leadingRows, \.\.\.items, browseAllItem\][\s\S]*: leadingRows;/u);
	assert.match(EDITOR_PALETTE_SOURCE, /const firstItem = items\[0\] \?\? leadingRows\[0\];/u);
	assert.match(EDITOR_PALETTE_SOURCE, /emptyState=\{[\s\S]*<RichTextSuggestionEmptyState[\s\S]*label=\{emptyLabel\}[\s\S]*onBrowseAll=\{onBrowseAll\}[\s\S]*\/>[\s\S]*\}/u);
	assert.match(EDITOR_PALETTE_SOURCE, /header=\{\([\s\S]*<RichTextCommandMenuSearchField[\s\S]*autoFocus=\{autoFocus\}[\s\S]*label=\{getSearchPlaceholder\(category\)\}[\s\S]*onClear=\{\(\) => setQuery\(""\)\}[\s\S]*onSubmit=\{selectFirstResult\}[\s\S]*onValueChange=\{setQuery\}[\s\S]*value=\{query\}/u);
	// The shared empty-state component lives in suggestion-menu.tsx. It owns the
	// Empty markup, gates the "Browse all" button on a defined onBrowseAll, and
	// prevents mousedown blur so the click can open the directory.
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /export function RichTextSuggestionEmptyState\(/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /label = "No matching items",/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /<Empty width="narrow" className="px-6 pt-4 pb-6">[\s\S]*<EmptyTitle headingSize="xsmall">\{label\}<\/EmptyTitle>[\s\S]*<EmptyDescription>Try a different search term\.<\/EmptyDescription>[\s\S]*onBrowseAll \? \([\s\S]*<Button[\s\S]*variant="outline"[\s\S]*onMouseDown=\{\(event\) => event\.preventDefault\(\)\}[\s\S]*onClick=\{onBrowseAll\}[\s\S]*Browse all[\s\S]*\) : null/u);
	// The "/" slash renderer accepts an onOpenDirectory callback and renders the
	// contextual empty state (with a "Browse all" launch) for a nested category,
	// while non-directory "format" gets the title-only variant and the top-level
	// list keeps its collapse-to-header behavior.
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /onOpenDirectory\?: \(category: RichTextSlashCategory\) => void,/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const nestedCategory = !isFlat && activeCategory \? activeCategory : null;/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /<RichTextSuggestionEmptyState[\s\S]*onBrowseAll=\{[\s\S]*nestedCategory !== "format" && onOpenDirectory[\s\S]*\? \(\) => onOpenDirectory\(nestedCategory\)[\s\S]*: undefined[\s\S]*\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /emptyState: nestedCategory \? nestedEmptyState : <><\/>,/u);
	// The callback is plumbed: extension option -> slash renderer call ->
	// RichTextEditor prop (kept current through a ref so the memoized extensions
	// never capture a stale closure).
	assert.match(RICH_TEXT_TYPES_SOURCE, /onOpenDirectory\?: \(category: RichTextSlashCategory\) => void;/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /createSlashSuggestionRenderer\([\s\S]*this\.options\.onOpenDirectory,[\s\S]*\(editor\) => exitSuggestion\(editor\.view, slashCommandPluginKey\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onOpenDirectory\?: \(category: RichTextSlashCategory\) => void;/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onOpenDirectoryRef = useRef\(onOpenDirectory\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onOpenDirectoryRef\.current = onOpenDirectory;/u);
	// The directory wrapper is gated on a host actually supplying onOpenDirectory
	// so surfaces without a directory (showcase, chat composer) don't render a
	// dead "Browse all" button.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /const hasOpenDirectory = Boolean\(onOpenDirectory\);/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onOpenDirectory: hasOpenDirectory[\s\S]*\? \(category\) => onOpenDirectoryRef\.current\?\.\(category\)[\s\S]*: undefined,/u);
	// agent.tsx maps a directory-backed slash category to the config-panel
	// directory and forwards the editor's launch up through onOpenDirectory.
	assert.match(AGENT_SOURCE, /const AGENT_DIRECTORY_BY_SLASH_CATEGORY: Record<[\s\S]*Exclude<RichTextSlashCategory, "format">,[\s\S]*AgentDirectoryKind[\s\S]*> = \{[\s\S]*skill: "skills",[\s\S]*tool: "tools",[\s\S]*knowledge: "knowledge",/u);
	assert.match(AGENT_SOURCE, /const handleOpenDirectory = useCallback\(\(category: RichTextSlashCategory\): void => \{[\s\S]*if \(category === "format"\) \{[\s\S]*return;[\s\S]*\}[\s\S]*onOpenDirectory\?\.\(AGENT_DIRECTORY_BY_SLASH_CATEGORY\[category\]\);/u);
	assert.match(AGENT_SOURCE, /<RichTextEditor[\s\S]*onOpenDirectory=\{handleOpenDirectory\}/u);
	assert.match(AGENT_SOURCE, /<AgentInstructionsComposer[\s\S]*onOpenDirectory=\{handleOpenDirectory\}/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /onInputClear|onInputValueChange|renderFirstItemAsInput/u);
	assert.match(EDITOR_PALETTE_SOURCE, /const \[leadPrompt, setLeadPrompt\] = useState\(""\);/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /const rows = \[\s*\.\.\.\(leadItem \? \[leadItem\] : \[\]\),/u);
	assert.match(EDITOR_PALETTE_SOURCE, /header=\{leadItem \? \([\s\S]*<RichTextCommandMenuSearchField[\s\S]*icon=\{leadItem\.icon\}[\s\S]*label=\{leadItem\.label\}[\s\S]*onClear=\{\(\) => setLeadPrompt\(""\)\}[\s\S]*onSubmit=\{\(\) => handleSelect\(leadItem\)\}[\s\S]*onValueChange=\{setLeadPrompt\}[\s\S]*placeholder=\{leadItem\.label\}[\s\S]*value=\{leadPrompt\}/u);
	assert.match(EDITOR_PALETTE_SOURCE, /NESTED_MENTION_SHOWCASES/u);
	assert.match(EDITOR_PALETTE_SOURCE, /getSlashCommandFormatItems\(\)/u);
	assert.match(EDITOR_PALETTE_SOURCE, /caption="Format nested"/u);
	assert.match(EDITOR_PALETTE_SOURCE, /title="Format"/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /\.\.\.SLASH_COMMANDS/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /min-w-\[1008px\]/u);
	assert.doesNotMatch(EDITOR_PALETTE_DEMO_SOURCE, /min-w-\[1008px\]/u);
	assert.match(EDITOR_PALETTE_DEMO_SOURCE, /className="flex w-full justify-center p-6"/u);
	assert.match(EDITOR_PALETTE_DEMO_SOURCE, /export function EditorPaletteSearch\(\)[\s\S]*<EditorPalette variant="search" searchCategory="tool" showLiveEditor=\{false\} \/>/u);
	assert.match(BLOCK_DETAILS_SOURCE, /"editor-palette": \{[\s\S]*demoLayout: \{ previewHeight: "fit" \}/u);
	assert.match(BLOCK_DETAILS_SOURCE, /name: "variant"[\s\S]*type: `"nested" \| "flat" \| "search"`/u);
	assert.match(BLOCK_DETAILS_SOURCE, /name: "searchCategory"[\s\S]*type: `"knowledge" \| "skill" \| "subagent" \| "tool"`[\s\S]*default: `"tool"`/u);
	assert.match(BLOCK_DETAILS_SOURCE, /title: "Search"[\s\S]*demoSlug: "editor-palette-search"/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /"editor-palette-search": dynamic\([\s\S]*default: mod\.EditorPaletteSearch/u);

	for (const caption of [
		"Subagents nested",
		"People and team nested",
		"Skills nested",
		"Tools nested",
		"Knowledge nested",
	]) {
		assert.match(EDITOR_PALETTE_SOURCE, new RegExp(`caption: "${caption}"`, "u"));
	}
	assert.match(EDITOR_PALETTE_SOURCE, /category: "subagent", title: "Subagents", trigger: "@"/u);
	assert.match(EDITOR_PALETTE_SOURCE, /category: "people-team", title: "People and team", trigger: "@"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /Parent entries for the "\/" command surface: skills, tools, knowledge/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /Parent entries for the "@" mention surface: people\/teams and subagents/u);

	for (const command of [
		"Normal text",
		"Heading 1",
		"Heading 2",
		"Heading 3",
		"Quote",
		"Bold",
		"Italic",
		"Underline",
		"Strikethrough",
		"Bulleted list",
		"Numbered list",
		"Align left",
		"Align center",
		"Align right",
		"Link",
	]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(`label: "${command}"`, "u"));
	}
});

test("Suggestion menu active selectable rows replace shortcut text with ReturnIcon", () => {
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /import \{ ArrowLeftIcon, ReturnIcon \} from "@\/components\/ui\/vpk-icons";/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /stickyPosition\?: "top" \| "bottom";/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /header\?: ReactNode;/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /inputAutoFocus\?:|inputValue\?:|onInputValueChange\?:|onInputClear\?:/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const shouldShowReturnShortcut = !item\.disabled && \(isSelected \|\| isInteractionActive\);/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function getSuggestionMenuItemStickyClassName\([\s\S]*item\.isSticky && "rich-text-command-menu-item-sticky",[\s\S]*item\.isSticky && item\.stickyPosition === "bottom" && "rich-text-command-menu-item-sticky-bottom"/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /RichTextSuggestionMenuInputOption|controlledValueProps|renderFirstItemAsInput/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /shouldShowReturnShortcut \? \([\s\S]*rich-text-command-menu-return-shortcut[\s\S]*<ReturnIcon className="size-3\.5 text-icon-subtlest" \/>[\s\S]*\) : item\.shortcut \? \(/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /onFocus=\{\(\) => setIsInteractionActive\(true\)\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const handleMouseEnter = \(\) => \{[\s\S]*setIsInteractionActive\(true\);[\s\S]*onHover\?\.\(\);/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /onMouseEnter=\{handleMouseEnter\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /item\.headingLabel !== undefined \? \([\s\S]*className="rich-text-command-menu-heading"[\s\S]*role="presentation"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /function isSelectableRow\(item: RichTextSuggestionMenuItem\): boolean \{[\s\S]*return item\.headingLabel === undefined && !item\.disabled;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-item-sticky-bottom \{\s*top: auto;\s*bottom: 0;\s*\}/u);
});

test("Composer directory autocomplete accepts visible rows before paragraph insertion", () => {
	assert.match(PROMPT_INPUT_SOURCE, /if \(activeEditor\.view\.composing \|\| !selection\.empty \|\| isAnySuggestionMenuOpen\(activeEditor\)\) \{/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /name: "composerDirectoryAutocomplete"[\s\S]*priority: 150/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /handleDOMEvents: \{[\s\S]*keydown: \(_view, event\) => \{/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /const keyboardEvent = event as KeyboardEvent;/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /keyboardEvent\.key !== "Enter" \|\| keyboardEvent\.shiftKey \|\| keyboardEvent\.isComposing/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /handleDOMEvents: \{[\s\S]*beforeinput: \(_view, event\) => \{/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /const inputType = \(event as InputEvent\)\.inputType;/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /inputType !== "insertParagraph" && inputType !== "insertLineBreak"/u);
	assert.match(RICH_TEXT_COMPOSER_EXTENSIONS_SOURCE, /event\.preventDefault\(\);[\s\S]*return controller\.acceptActive\(\);/u);
});

test("Mention menu exposes people/agent and command categories and mention lozenges", () => {
	for (const category of ["Subagents", "Skills", "Tools", "Knowledge"]) {
		assert.match(RICH_TEXT_REFERENCE_CATEGORIES_SOURCE, new RegExp(`label: "${category}"`, "u"));
	}
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /"people-team": "People and team"/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /"Human nested"/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /"Team nested"/u);

	// The @/​ surfaces now draw mention ids from the unified catalog builder
	// (suggestion-menu's STATIC_MENTION_ITEMS = EDITOR_PALETTE_MENTION_SOURCES),
	// so the per-category ids are minted there via toMentionId.
	for (const category of ["human", "team", "tool", "knowledge", "skill", "subagent"]) {
		assert.match(EDITOR_PALETTE_MENTION_SOURCES, new RegExp(`toMentionId\\("${category}"`, "u"));
	}
	assert.match(
		RICH_TEXT_SUGGESTION_SOURCE,
		/const STATIC_MENTION_ITEMS: RichTextMentionSources = EDITOR_PALETTE_MENTION_SOURCES;/u,
	);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /revealDescriptionOnHover/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /emptyState\?: ReactNode;/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /import CrossCircleIcon from "@atlaskit\/icon\/core\/cross-circle";/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /import \{ Button \} from "@\/components\/ui\/button";/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /emptyState \?\? <div className="rich-text-command-menu-empty">\{emptyLabel\}<\/div>/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /data-nested=\{isNested \? "true" : undefined\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /data-has-header=\{header \? "true" : undefined\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /data-list-scrolled=\{hasScrolledList \? "true" : undefined\}/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /data-first-item-input/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /data-list-overflow-after/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /import \{ motion, type Variants \} from "motion\/react";/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const nestedCommandLabelVariants: Variants = \{/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const nestedCommandDescriptionVariants: Variants = \{[\s\S]*opacity: 0,[\s\S]*opacity: 1,/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /persistentDescription\?: boolean;/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const hasDescription = Boolean\(item\.description\);/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const showsPersistentDescription = hasDescription && Boolean\(item\.persistentDescription\);/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const canRevealMetadata = hasDescription && !item\.persistentDescription;/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /isNested && Boolean\(item\.description\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /persistentDescription: true,[\s\S]*icon: category === "people-team"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /persistentDescription: true,[\s\S]*icon: getSlashCategoryIcon\(category\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /if \(canRevealMetadata\) \{/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /\{header\}[\s\S]*<div[\s\S]*className="rich-text-command-menu-list"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /export function RichTextCommandMenuSearchField\(/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /<Input[\s\S]*variant="subtle"[\s\S]*value=\{value\}[\s\S]*onChange=\{\(event\) => onValueChange\(event\.currentTarget\.value\)\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /onKeyDown=\{\(event\) => \{[\s\S]*onKeyDown\?\.\(event\);[\s\S]*event\.stopPropagation\(\);[\s\S]*if \(event\.defaultPrevented\)/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /<Button[\s\S]*aria-label="Clear search"[\s\S]*className="rich-text-command-menu-search-clear text-icon-subtle"[\s\S]*shape="circle"[\s\S]*size="icon-compact"[\s\S]*variant="ghost"[\s\S]*<CrossCircleIcon label="" size="small" \/>/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /const inputItem =|const listItems =|showClearButton|RichTextSuggestionMenuInputOption/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /<Input[\s\S]*variant="subtle"[\s\S]*isCompact/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /isSelected=\{index === selectedIndex\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /whileHover="active"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /whileFocus="active"/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu \{[\s\S]*--rich-text-command-menu-max-height: 328px;[\s\S]*max-height: min\(var\(--rich-text-command-menu-max-height\), calc\(100vh - 48px\)\);/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-nested="true"\] \{\s*max-height: min\(var\(--rich-text-command-menu-max-height\), calc\(100vh - 48px\)\);/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-borderless \{\s*border: 0;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-avatar \{\s*width: 24px;\s*height: 24px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-has-header="true"\] \.rich-text-command-menu-list \{\s*padding-top: 4px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-showcase\[data-nested="true"\] \.rich-text-command-menu-list \{\s*overflow-y: auto;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /--rich-text-command-menu-scroll-mask-fade-size: 48px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-list-scrolled="true"\] \.rich-text-command-menu-list \{[\s\S]*linear-gradient\(to bottom, transparent 0, black var\(--rich-text-command-menu-scroll-mask-fade-size\), black 100%\)/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /data-list-overflow-after/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /black calc\(100% - var\(--rich-text-command-menu-scroll-mask-fade-size\)\), transparent 100%/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-search \{[\s\S]*flex: 0 0 44px;[\s\S]*grid-template-columns: 24px minmax\(0, 1fr\) auto;[\s\S]*height: 44px;[\s\S]*min-height: 44px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-search \{[\s\S]*padding: 0 6px 0 12px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-search > \[data-slot="input"\] \{\s*height: 100%;/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /rich-text-command-menu-search-picker/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /data-first-item-input|rich-text-command-menu-input/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-search-clear \{\s*justify-self: end;\s*\}/u);
	// Title/byline type now comes from the shared `menu-row-*` utilities
	// (app/globals.css); the editor palette markup references them and the old
	// per-class type rules are retired, so there is a single source of truth.
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /className="menu-row-title"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /className="menu-row-byline"/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-label \{/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-description\b/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-nested="true"\] \.rich-text-command-menu-list \.menu-row-byline \{\s*pointer-events: none;/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-back \{[\s\S]*border-bottom/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-back \{[\s\S]*height: 44px;[\s\S]*padding: 0 6px 0 12px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-item \{[\s\S]*?height: 44px;/u);
	// `[^}]*?` keeps this scoped to the nested item rule's own block so it can't
	// leak into a later rule (flat / non-nested rows carry 6px vertical padding).
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-nested="true"\] \.rich-text-command-menu-list \.rich-text-command-menu-item \{[^}]*?padding-top: 6px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-item \{[\s\S]*padding: 0 8px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-nested-copy \{\s*height: 34px;\s*justify-content: center;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-nested-copy-revealable \{\s*justify-content: flex-start;/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-item:hover \.rich-text-command-menu-description/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /rich-text-command-menu-title/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-title/u);
	assert.match(EDITOR_PALETTE_MENTION_SOURCES, /toMentionId\("skill"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("knowledge"/u);
	// Per-trigger suggestion variant support stays available, but the Studio
	// instructions editor now uses the shared nested-first behavior for both
	// "@" and "/" so bare triggers show categories and typing searches flat
	// across the trigger's whole set.
	const RICH_TEXT_TYPES_SOURCE = readProjectFile("components/ui-custom/rich-text-editor/types.ts");
	assert.match(RICH_TEXT_TYPES_SOURCE, /export type RichTextSuggestionVariantConfig =/u);
	assert.match(RICH_TEXT_TYPES_SOURCE, /export function resolveMentionVariant\(/u);
	assert.match(RICH_TEXT_TYPES_SOURCE, /export function resolveCommandVariant\(/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /resolveCommandVariant\(this\.options\.suggestionVariant\)/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /resolveMentionVariant\(options\.suggestionVariant\)/u);
	assert.match(RICH_TEXT_TYPES_SOURCE, /return config\?\.mention \?\? "nested";/u);
	assert.match(RICH_TEXT_TYPES_SOURCE, /return config\?\.command \?\? "nested";/u);
	assert.match(AGENT_SOURCE, /const AGENT_INSTRUCTIONS_SUGGESTION_VARIANT: RichTextSuggestionVariantConfig = "nested";/u);
	assert.match(AGENT_SOURCE, /suggestionVariant=\{AGENT_INSTRUCTIONS_SUGGESTION_VARIANT\}/u);

	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-mention/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-mention-visual/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-mention-label/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="skill"\]/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="knowledge"\]/u);
});

test("Agent creation guidance asks for structured markdown instructions", () => {
	assert.match(STUDIO_AGENT_RESULT_SOURCE, /structured Markdown/u);
	assert.match(STUDIO_AGENT_RESULT_SOURCE, /## Instructions/u);
	assert.match(STUDIO_AGENT_RESULT_SOURCE, /bold labels/u);
	assert.match(STUDIO_SHELL_SOURCE, /buildStudioAgentCreationContext/u);

	assert.match(STUDIO_AGENT_RESULT_SOURCE, /- \*\*Summary\*\*/u);
	assert.match(STUDIO_AGENT_RESULT_SOURCE, /## Validation/u);
});

test("Shared rich text toolbar delegates to the Editor toolbar block", () => {
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/import \{\s*EditorToolbar,\s*type EditorToolbarProps,?\s*\} from "@\/components\/blocks\/editor-toolbar";/u,
	);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /export type RichTextEditorToolbarProps = EditorToolbarProps;/u);
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/export function RichTextEditorToolbar\([\s\S]*return <EditorToolbar \{\.\.\.props\} \/>;/u,
	);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /<EditorToolbar[\s\S]*controlsClassName="px-2 py-1"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /export type EditorToolbarInsertReferenceCategory = InsertReferenceCategory;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /export type EditorToolbarViewMode = "rendered" \| "markdown" \| "data-flow";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /onInsertReferenceOption\?: \(category: EditorToolbarInsertReferenceCategory, label: string\) => boolean \| void;/u);
	assert.match(EDITOR_TOOLBAR_INDEX_SOURCE, /export type \{ EditorToolbarInsertReferenceCategory, EditorToolbarProps, EditorToolbarViewMode \} from "\.\/components\/editor-toolbar";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /import type \{ EditorToolbarInsertReferenceCategory, EditorToolbarViewMode \} from "@\/components\/blocks\/editor-toolbar";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onInsertReferenceOption\?: \(category: EditorToolbarInsertReferenceCategory, label: string\) => boolean \| void;/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onInsertReferenceOption=\{onInsertReferenceOption\}/u);
});

test("Reference insert categories are shared by slash commands and Add content", () => {
	assert.match(RICH_TEXT_REFERENCE_CATEGORIES_SOURCE, /export const RICH_TEXT_REFERENCE_CATEGORY_OPTIONS = \[/u);
	for (const category of ["subagent", "skill", "tool", "knowledge"]) {
		assert.match(RICH_TEXT_REFERENCE_CATEGORIES_SOURCE, new RegExp(`category: "${category}"`, "u"));
	}
	assert.doesNotMatch(RICH_TEXT_REFERENCE_CATEGORIES_SOURCE, /category: "memory"/u);
	assert.doesNotMatch(RICH_TEXT_REFERENCE_CATEGORIES_SOURCE, /label: "Memory"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /const COMMAND_CATEGORY_ORDER: readonly RichTextCommandCategory\[\] = RICH_TEXT_REFERENCE_CATEGORY_OPTIONS\s*\.map\(\(option\) => option\.category\)\s*\.filter\([\s\S]*category !== "subagent"\)/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import \{ RICH_TEXT_REFERENCE_CATEGORY_OPTIONS \} from "@\/components\/ui-custom\/rich-text-editor\/reference-categories";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /type InsertReferenceCategory = RichTextReferenceCategory;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /\{RICH_TEXT_REFERENCE_CATEGORY_OPTIONS\.map\(\(option\) => \(/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /category: "memory"|label: "Memory"|AiModelIcon/u);
});

test("Shared toolbar carries the Confluence editor control set", () => {
	for (const control of [
		"Text alignment",
		"Bulleted list",
		"Numbered list",
		"Link",
	]) {
		assert.match(EDITOR_TOOLBAR_SOURCE, new RegExp(control, "u"));
	}

	for (const command of [
		"toggleBold",
		"toggleItalic",
		"toggleUnderline",
		"toggleStrike",
		"toggleBulletList",
		"toggleOrderedList",
		"setTextAlign",
		"setLink",
	]) {
		assert.match(EDITOR_TOOLBAR_SOURCE, new RegExp(command, "u"));
	}
});

test("Shared toolbar groups related split controls and keeps unrelated toggles independent", () => {
	assert.match(EDITOR_TOOLBAR_SOURCE, /import AddIcon from "@atlaskit\/icon\/core\/add";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import DataFlowIcon from "@atlaskit\/icon\/core\/data-flow";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import MarkdownIcon from "@atlaskit\/icon\/core\/markdown";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import \{ Tabs, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import \{ Toggle \} from "@\/components\/ui\/toggle";/u);
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u,
	);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import \{ Separator \} from "@\/components\/ui\/separator";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import \{ TextNormalIcon \} from "@\/components\/ui\/vpk-icons";/u);

	// Bold + formatting and bulleted list + list options are related split controls.
	assert.match(EDITOR_TOOLBAR_SOURCE, /const TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME = "\*:data-\[slot=toggle-group-item\]:w-6! \*:data-\[slot=toggle-group-item\]:min-w-6! \*:data-\[slot=toggle-group-item\]:px-0!";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /const formattingValue = \[/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /const listValue = \[/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /value=\{formattingValue\}[\s\S]*className=\{TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME\}[\s\S]*value="bold"[\s\S]*value="formatting"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /value=\{listValue\}[\s\S]*className=\{TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME\}[\s\S]*value="bulletList"[\s\S]*value="list"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /function ToolbarSeparator\(\)[\s\S]*orientation="vertical"[\s\S]*className="mx-2 h-4 self-center bg-border data-vertical:self-center"/u);
	// The list group is wrapped in a foldable group div that carries its own
	// leading separator, so it can collapse into the "+" dropdown when space is
	// tight.
	assert.match(EDITOR_TOOLBAR_SOURCE, /data-toolbar-group[\s\S]*<ToolbarSeparator \/>\s*<ToggleGroup[\s\S]*value=\{listValue\}/u);

	// Link remains a separate Toggle; rendered/Markdown mode is a far-right Tabs control.
	assert.match(EDITOR_TOOLBAR_SOURCE, /pressed=\{currentMode === "rendered" && editor\.isActive\("link"\)\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /aria-label="Link"[\s\S]*onPressedChange=\{handleLinkPressedChange\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /aria-label="Add content"[\s\S]*onClick=\{handleAddContent\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /const handledByConsumer = onInsertReferenceOption\?\.\(category, label\);/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /if \(handledByConsumer !== false && typeof onInsertReferenceOption !== "undefined"\) \{[\s\S]*closeDropdown\(\);[\s\S]*return;[\s\S]*\}[\s\S]*insertContent/u);
	// The trailing `+` button is the pinned overflow anchor (never folds). It is
	// wrapped in a positioned `data-toolbar-anchor` div so it can anchor the
	// Insert dropdown, and a leading separator only appears once groups fold.
	assert.match(EDITOR_TOOLBAR_SOURCE, /<div data-toolbar-anchor className="relative flex items-center gap-1">/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /\{hasFoldedGroups \? <ToolbarSeparator \/> : null\}\s*<Button[\s\S]*aria-label="Add content"[\s\S]*<AddIcon label="" size="small" \/>[\s\S]*<\/Button>[\s\S]*<\/div>/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /<AddIcon label="" size="small" \/>\s*<\/Button>\s*<ToolbarSeparator \/>/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /\{endSlot \|\| showModeTabs \? \(\s*<div className="flex shrink-0 items-center gap-2">[\s\S]*\{endSlot\}[\s\S]*<Tabs[\s\S]*value=\{currentMode\}/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /value="link"/u);
	assert.doesNotMatch(
		EDITOR_TOOLBAR_SOURCE,
		/variant=\{editor\.isActive\("bold"\) \? "secondary" : "ghost"\}/u,
	);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<TextNormalIcon size="small" \/>/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<MarkdownIcon label="" size="small" \/>/u);
});

test("Shared rich text editor omits the placeholder Comment control", () => {
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /@atlaskit\/icon\/core\/comment/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, />\s*Comment\s*</u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /showCommentControl/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_SOURCE, /showCommentControl/u);
});

test("Shared rich text editor omits the trailing More options control", () => {
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /@atlaskit\/icon\/core\/show-more-horizontal/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /aria-label="More options"/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /showMoreControl/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_SOURCE, /showMoreControl/u);
});

test("Shared toolbar dropdown menus avoid perimeter shadow strokes", () => {
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/function DropdownMenuContainer[\s\S]*bg-popover p-1 text-popover-foreground shadow-2xl/u,
	);
	assert.doesNotMatch(
		EDITOR_TOOLBAR_SOURCE,
		/function DropdownMenuContainer[\s\S]*bg-popover p-1 text-popover-foreground shadow-xl/u,
	);
});

test("Shared toolbar exposes far-right rendered and Markdown mode tabs gated by a handler", () => {
	assert.match(EDITOR_TOOLBAR_SOURCE, /isMarkdownMode\?: boolean;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /mode\?: EditorToolbarViewMode;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /showDataFlowMode\?: boolean;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /onToggleMarkdownMode\?: \(\) => void;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /onModeChange\?: \(mode: EditorToolbarViewMode\) => void;/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /import \{ BubbleMenu, FloatingMenu \} from "@tiptap\/react\/menus";/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /function getRichTextEditorMenuAppendTarget\(\): HTMLElement \{[\s\S]*return document\.body;[\s\S]*\}/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /<BubbleMenu[\s\S]*appendTo=\{getRichTextEditorMenuAppendTarget\}/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /<FloatingMenu[\s\S]*appendTo=\{getRichTextEditorMenuAppendTarget\}/u);
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/<BubbleMenu[\s\S]*shouldShow=\{\(\{ editor: activeEditor, from, to \}\) =>[\s\S]*activeEditor\.isEditable && from !== to/u,
	);
	// Mode tabs only render when a toggle handler is supplied (omitted in bubble/floating menus).
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/const showModeTabs = Boolean\(onToggleMarkdownMode \|\| onModeChange\);[\s\S]*\{endSlot \|\| showModeTabs \? \(/u,
	);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<TabsTrigger[\s\S]*aria-label="Rendered text"[\s\S]*value="rendered"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<TabsTrigger[\s\S]*aria-label="Markdown source"[\s\S]*value="markdown"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<TabsTrigger[\s\S]*aria-label="Data flow diagram"[\s\S]*value="data-flow"[\s\S]*<DataFlowIcon label="" size="small" \/>/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, />\s*Rendered\s*</u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, />\s*Markdown\s*</u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /Show Markdown source/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /dataFlowConfig\?: StudioAgentDataFlowConfig;/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onViewModeChange\?: \(mode: EditorToolbarViewMode\) => void;/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /function updateViewMode\(nextMode: EditorToolbarViewMode\): void \{[\s\S]*setViewMode\(nextMode\);[\s\S]*onViewModeChange\?\.\(nextMode\);/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /useEffect\(\(\) => \{[\s\S]*onViewModeChange\?\.\(viewMode\);[\s\S]*\}, \[onViewModeChange, viewMode\]\);/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /mode=\{viewMode\}/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /showDataFlowMode=\{Boolean\(dataFlowConfig\)\}/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /data-rich-text-data-flow-diagram/u);
});

test("Source-mode toolbar controls apply Markdown syntax instead of disabling", () => {
	// The toolbar dispatches a Markdown-format transform when in source mode.
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/onMarkdownFormat\?: \(kind: MarkdownFormatKind\) => void;/u,
	);
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/function runFormat\(kind: MarkdownFormatKind, applyRich: \(\) => void\): void \{[\s\S]*onMarkdownFormat\?\.\(kind\)/u,
	);
	assert.match(EDITOR_TOOLBAR_SOURCE, /runFormat\("bold",/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /runFormat\("italic",/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /runFormat\("bulletList",/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /runFormat\("orderedList",/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /TEXT_STYLE_TO_MARKDOWN/u);
	// Only alignment (no Markdown equivalent) stays disabled in source mode.
	assert.match(EDITOR_TOOLBAR_SOURCE, /const controlsDisabled = currentMode === "data-flow";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /const markdownUnsupported = currentMode === "markdown" \|\| controlsDisabled;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /disabled=\{markdownUnsupported\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /disabled=\{controlsDisabled\}/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /formattingDisabled/u);
});

test("Editor wires source-mode formatting through the Markdown-format util", () => {
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/import \{\s*applyMarkdownFormat,\s*type MarkdownFormatKind,?\s*\} from "\.\/markdown-format";/u,
	);
	// Reads the textarea selection, applies the transform, and restores the caret.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /const textareaRef = useRef<HTMLTextAreaElement>\(null\);/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/function handleMarkdownFormat\(kind: MarkdownFormatKind\): void \{[\s\S]*applyMarkdownFormat\(/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /window\.prompt\("Enter URL"\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /requestAnimationFrame\(/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /node\.setSelectionRange\(result\.selectionStart, result\.selectionEnd\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /ref=\{textareaRef\}/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onMarkdownFormat=\{handleMarkdownFormat\}/u);
});

test("Markdown source mode round-trips through the shared editor", () => {
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/const \[viewMode, setViewMode\] = useState<EditorToolbarViewMode>\("rendered"\);/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /const isMarkdownMode = viewMode === "markdown";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /const \[markdownSource, setMarkdownSource\] = useState\(""\);/u);
	// Entering source mode snapshots the rendered doc as Markdown.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /setMarkdownSource\(editor\.getMarkdown\(\)\)/u);
	// Leaving source mode re-parses the edited Markdown back into the editor.
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/editor\.commands\.setContent\(markdownSource, \{[\s\S]*contentType: "markdown",[\s\S]*emitUpdate: false/u,
	);
	// Source mode renders the syntax-highlighted Markdown source editor instead of EditorContent.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /isDataFlowMode && dataFlowMermaid \? \([\s\S]*\) : isMarkdownMode \? \(\s*<MarkdownSourceEditor/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /data-rich-text-markdown-source/u);
	// The parent stays live-synced while editing source.
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/function handleMarkdownSourceChange\(next: string\): void \{[\s\S]*onMarkdownChangeRef\.current\?\.\(next\);/u,
	);
	// The toolbar receives the toggle wiring; bubble/floating menus hide in source mode.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onToggleMarkdownMode=\{handleToggleMarkdownMode\}/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /showBubbleMenu && editor && viewMode === "rendered"/u);
});
