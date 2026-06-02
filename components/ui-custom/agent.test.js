const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const AGENT_SOURCE = readFileSync(join(__dirname, "agent.tsx"), "utf8");
const INLINE_EDIT_SOURCE = readFileSync(
	join(__dirname, "..", "ui", "inline-edit.tsx"),
	"utf8",
);
const TAG_SOURCE = readFileSync(
	join(__dirname, "..", "ui", "tag.tsx"),
	"utf8",
);
const SKILL_TAG_SOURCE = readFileSync(
	join(__dirname, "skill-tag.tsx"),
	"utf8",
);
const AGENT_DEMO_SOURCE = readFileSync(
	join(__dirname, "..", "website", "demos", "ui-custom", "agent-demo.tsx"),
	"utf8",
);
const UI_CUSTOM_DETAILS_SOURCE = readFileSync(
	join(__dirname, "..", "..", "app", "data", "details", "ui-custom.ts"),
	"utf8",
);
const WEBSITE_REGISTRY_SOURCE = readFileSync(
	join(__dirname, "..", "website", "registry.ts"),
	"utf8",
);
const RICH_TEXT_EDITOR_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "rich-text-editor.tsx"),
	"utf8",
);
const RICH_TEXT_EDITOR_CSS = readFileSync(
	join(__dirname, "rich-text-editor", "rich-text-editor.css"),
	"utf8",
);
const RICH_TEXT_EXTENSIONS_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "extensions.ts"),
	"utf8",
);
const RICH_TEXT_SUGGESTION_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "suggestion-menu.tsx"),
	"utf8",
);
const RICH_TEXT_TOOLBAR_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "toolbar.tsx"),
	"utf8",
);
const EDITOR_PALETTE_SOURCE = readFileSync(
	join(__dirname, "..", "blocks", "editor-palette", "page.tsx"),
	"utf8",
);
const EDITOR_TOOLBAR_SOURCE = readFileSync(
	join(__dirname, "..", "blocks", "editor-toolbar", "components", "editor-toolbar.tsx"),
	"utf8",
);
const EDITOR_TOOLBAR_INDEX_SOURCE = readFileSync(
	join(__dirname, "..", "blocks", "editor-toolbar", "index.ts"),
	"utf8",
);
const STUDIO_AGENT_RESULT_SOURCE = readFileSync(
	join(__dirname, "..", "..", "backend", "lib", "studio-agent-result.js"),
	"utf8",
);
const STUDIO_SHELL_SOURCE = readFileSync(
	join(__dirname, "..", "projects", "studio", "components", "rovo-app-shell.tsx"),
	"utf8",
);
const HORIZONTAL_OVERFLOW_HOOK_SOURCE = readFileSync(
	join(__dirname, "..", "hooks", "use-has-horizontal-overflow.ts"),
	"utf8",
);

test("Agent instructions composer uses the shared Tiptap editor", () => {
	assert.match(AGENT_SOURCE, /RichTextEditor,[\s\S]*\} from "@\/components\/ui-custom\/rich-text-editor";/u);
	assert.match(AGENT_SOURCE, /function AgentInstructionsComposer/u);
	assert.match(AGENT_SOURCE, /<RichTextEditor[\s\S]*aria-label="Agent instructions"/u);
	assert.match(AGENT_SOURCE, /editorClassName=\{cn\("agent-instructions-tiptap-editor text-text", editorClassName\)\}/u);
	assert.match(AGENT_SOURCE, /placeholder="Describe the agent’s role and what it should do\. @ to mention people and agents, \/ for skills, tools, and knowledge, or start with a template"/u);
	assert.match(AGENT_SOURCE, /placeholderSlot=\{\([\s\S]*start with a template[\s\S]*\)\}/u);
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => setTemplatesOpen\(true\)\}/u);
	assert.match(AGENT_SOURCE, /<AgentTemplatesDialog[\s\S]*open=\{templatesOpen\}[\s\S]*onOpenChange=\{setTemplatesOpen\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /showBubbleMenu=\{false\}/u);
	assert.match(AGENT_SOURCE, /const handleInsertReferenceOption = useCallback\(\(category: string\): boolean => \{[\s\S]*category === "knowledge"[\s\S]*onOpenDirectory\?\.\("knowledge"\)[\s\S]*category === "tool"[\s\S]*onOpenDirectory\?\.\("tools"\)[\s\S]*category === "skill"[\s\S]*onOpenDirectory\?\.\("skills"\)[\s\S]*return false;[\s\S]*\}, \[onOpenDirectory\]\);/u);
	assert.match(AGENT_SOURCE, /onInsertReferenceOption=\{handleInsertReferenceOption\}/u);
	assert.match(AGENT_SOURCE, /mentionSources=\{mentionSources\}/u);
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
	assert.match(AGENT_SOURCE, /function AgentReasoningOverflowMenu/u);
	assert.match(AGENT_SOURCE, /const \[reasoningValue, setReasoningValue\] = useState<ReasoningModeValue>\("quick-auto"\);/u);
	assert.match(AGENT_SOURCE, /\{ agentFieldName: "reasoning", label: "Reasoning", kind: "reasoning" \}/u);
	assert.match(AGENT_SOURCE, /case "reasoning":[\s\S]*count = 0;/u);
	assert.match(AGENT_SOURCE, /render="nav-button"[\s\S]*value=\{reasoningValue\}[\s\S]*onValueChange=\{onReasoningValueChange\}/u);
	assert.match(AGENT_SOURCE, /<AgentReasoningRow[\s\S]*value=\{reasoningValue\}[\s\S]*onValueChange=\{setReasoningValue\}/u);
	assert.match(AGENT_SOURCE, /<AgentReasoningOverflowMenu[\s\S]*value=\{reasoningValue\}[\s\S]*onValueChange=\{onReasoningValueChange\}/u);
	assert.match(AGENT_SOURCE, /import AiComputeIcon from "@atlaskit\/icon-lab\/core\/ai-compute";/u);
	assert.match(AGENT_SOURCE, /render=\{<LozengeDropdownTrigger aria-label="Reasoning mode" icon=\{<AiComputeIcon label="" size="small" \/>\} \/>\}/u);
	assert.match(AGENT_SOURCE, /<Tag>\{current\?\.label \?\? "Recommended"\}<\/Tag>/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Think deeper option"/u);
	assert.doesNotMatch(AGENT_SOURCE, /from "@\/components\/ui-custom\/model-selector"/u);
	assert.match(AGENT_SOURCE, /<AgentSectionLabel>Reasoning<\/AgentSectionLabel>/u);
});

test("Knowledge selector mirrors reasoning with mode dropdown and custom tag list", () => {
	assert.match(AGENT_SOURCE, /const KNOWLEDGE_MODE_OPTIONS = \[/u);
	assert.match(AGENT_SOURCE, /\{ value: "all", label: "All organizational knowledge" \}/u);
	assert.match(AGENT_SOURCE, /\{ value: "custom", label: "Custom knowledge" \}/u);
	assert.match(AGENT_SOURCE, /\{ value: "none", label: "No organizational knowledge" \}/u);
	assert.match(AGENT_SOURCE, /function AgentKnowledgeSelector/u);
	assert.match(AGENT_SOURCE, /function AgentKnowledgeRow/u);
	assert.match(AGENT_SOURCE, /function AgentKnowledgeOverflowMenu/u);
	assert.match(AGENT_SOURCE, /\{ agentFieldName: "knowledge", label: "Knowledge", kind: "knowledge" \}/u);
	assert.match(AGENT_SOURCE, /case "knowledge":[\s\S]*count = 0;/u);
	assert.match(AGENT_SOURCE, /const \[knowledgeMode, setKnowledgeMode\] = useState<KnowledgeModeValue>/u);
	assert.match(AGENT_SOURCE, /<AgentKnowledgeRow[\s\S]*value=\{knowledgeMode\}/u);
	assert.match(AGENT_SOURCE, /<AgentKnowledgeOverflowMenu[\s\S]*value=\{knowledgeMode\}/u);
	assert.match(AGENT_SOURCE, /const isCustom = value === "custom";/u);
	assert.match(AGENT_SOURCE, /import BookOpenIcon from "@atlaskit\/icon-lab\/core\/book-open";/u);
	assert.match(AGENT_SOURCE, /render=\{<LozengeDropdownTrigger aria-label="Knowledge mode" icon=\{<BookOpenIcon label="" size="small" \/>\} \/>\}/u);
	assert.match(AGENT_SOURCE, /const MEMORY_MODE_OPTIONS = \[/u);
	assert.match(AGENT_SOURCE, /\{ value: "on", label: "On" \}/u);
	assert.match(AGENT_SOURCE, /\{ value: "off", label: "Off" \}/u);
	assert.match(AGENT_SOURCE, /function AgentMemorySelector/u);
	assert.match(AGENT_SOURCE, /const selectedOption = MEMORY_MODE_OPTIONS\.find\(\(option\) => option\.value === value\) \?\? MEMORY_MODE_OPTIONS\[0\];/u);
	assert.match(AGENT_SOURCE, /render=\{\(\s*<LozengeDropdownTrigger[\s\S]*aria-label="Memory mode"[\s\S]*icon=\{<AiModelIcon label="" size="small" \/>\}/u);
	assert.match(AGENT_SOURCE, /\{`Memory \$\{selectedOption\.label\.toLowerCase\(\)\}`\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Memory mode"[\s\S]{0,180}variant="information"/u);
	assert.match(AGENT_SOURCE, /<DropdownMenuSeparator \/>[\s\S]*Configure memory/u);
	assert.match(AGENT_SOURCE, /<AgentMemorySelector \/>/u);
	assert.doesNotMatch(AGENT_SOURCE, /<AgentReferenceChip label="Memory" \/>/u);
});

test("Filled config summary sorts empty rows to the bottom while preserving canonical order", () => {
	assert.match(AGENT_SOURCE, /const rows: ReadonlyArray<\{ key: string; isEmpty: boolean; node: ReactNode \}>/u);
	assert.match(AGENT_SOURCE, /const orderedRows = rows[\s\S]*\.sort\(\(a, b\) => \{[\s\S]*if \(a\.isEmpty !== b\.isEmpty\) return a\.isEmpty \? 1 : -1;[\s\S]*return a\.index - b\.index;/u);
	assert.match(AGENT_SOURCE, /isEmpty: hasKnowledgeSelector \? false : knowledgeItems\.length === 0/u);
	// The rows array source order IS the canonical display order. Reasoning is
	// rendered separately after this list, so it is not a row key here.
	assert.match(
		AGENT_SOURCE,
		/key: "trigger"[\s\S]*key: "knowledge"[\s\S]*key: "tools"[\s\S]*key: "skills"[\s\S]*key: "subagents"[\s\S]*key: "memory"[\s\S]*key: "conversationStarters"/u,
	);
	// Memory is its own always-on row (never empty), not a chip inside Knowledge.
	assert.match(AGENT_SOURCE, /function AgentMemoryRow/u);
	assert.match(AGENT_SOURCE, /key: "memory",[\s\S]*isEmpty: false,/u);
});

test("Agent config updates instructions as markdown strings", () => {
	assert.match(
		AGENT_SOURCE,
		/onInstructionsChange=\{\(value\) => handleTextChange\("instructions", value\)\}/u,
	);
	assert.match(AGENT_SOURCE, /fetch\("\/api\/skills"/u);
	assert.match(AGENT_SOURCE, /fetch\("\/api\/wiki\/memory-explorer"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("skill"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("knowledge"/u);
	assert.doesNotMatch(AGENT_SOURCE, /getHTML\(/u);
	assert.doesNotMatch(AGENT_SOURCE, /instructionsHtml|richInstructions/u);
});

test("Agent config renders filled summary rows once field data exists", () => {
	assert.match(AGENT_SOURCE, /function hasFilledAgentConfig\(config: AgentConfigFormValue\): boolean/u);
	assert.match(AGENT_SOURCE, /const isFilledConfig = hasFilledAgentConfig\(config\);/u);
	assert.match(AGENT_SOURCE, /<AgentFilledConfigSummary/u);
	assert.match(AGENT_SOURCE, /function AgentMissingConfigActions/u);
	assert.match(AGENT_SOURCE, /<AgentMissingConfigActions[\s\S]*config=\{config\}/u);
	assert.match(AGENT_SOURCE, /getAgentTriggerItems\(config\)\.length > 0/u);
	assert.match(AGENT_SOURCE, /MAX_AGENT_CONVERSATION_STARTERS = 3/u);

	for (const label of [
		"Triggers",
		"Skills",
		"Tools",
		"Subagents",
		"Knowledge",
		"Conversation starters",
	]) {
		assert.match(AGENT_SOURCE, new RegExp(`label="${label}"`, "u"));
	}

	assert.match(AGENT_SOURCE, /function AgentReferenceChip/u);
	assert.match(AGENT_SOURCE, /removeVariant="overlay"/u);
	assert.match(AGENT_SOURCE, /function AgentSkillChip\(\{ label, onRemove \}/u);
	assert.match(AGENT_SOURCE, /onRemove=\{onRemove\}[\s\S]*removeVariant="overlay"[\s\S]*removeButtonLabel=\{`Remove \$\{label\}`\}/u);
	for (const field of ["triggers", "skills", "tools", "subagents", "knowledge", "conversationStarters"]) {
		assert.match(AGENT_SOURCE, new RegExp(`onRemoveListItem\\("${field}", index\\)`, "u"));
	}
	assert.match(TAG_SOURCE, /group\/tag relative inline-flex/u);
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
});

test("Agent header renders Configure and Test as a self-contained compact ToggleGroup", () => {
	// The default header uses an outline ToggleGroup at the default size (32px /
	// h-8) instead of the Tabs control. Consumers that need controlled tabs still
	// override via the `actions` prop.
	assert.match(AGENT_SOURCE, /import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u);
	assert.match(AGENT_SOURCE, /primaryActionLabel = "Configure"/u);
	assert.match(AGENT_SOURCE, /secondaryActionLabel = "Test"/u);
	assert.match(AGENT_SOURCE, /publishLabel = "Publish"/u);
	// ToggleGroup carries its own context, so the default actions render it
	// directly (variant="outline", default size) alongside a Publish button.
	assert.match(
		AGENT_SOURCE,
		/\{actions \?\? \([\s\S]*<ToggleGroup[\s\S]*aria-label="Agent views"[\s\S]*defaultValue=\{\["configure"\]\}[\s\S]*variant="outline"[\s\S]*<ToggleGroupItem value="configure">[\s\S]*\{primaryActionLabel\}[\s\S]*<ToggleGroupItem value="test">[\s\S]*\{secondaryActionLabel\}[\s\S]*<\/ToggleGroup>[\s\S]*<Button[\s\S]*\{publishLabel\}[\s\S]*<\/Button>/u,
	);
	// The Tabs-based header is fully retired from the default actions.
	assert.doesNotMatch(AGENT_SOURCE, /import \{ Tabs, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs";/u);
	assert.doesNotMatch(AGENT_SOURCE, /<TabsTrigger/u);
});

test("Agent component page wires compact filled and empty placeholder variations", () => {
	const compactLayoutStart = AGENT_SOURCE.indexOf('{layout === "compact"');
	const defaultLayoutStart = AGENT_SOURCE.indexOf("{/* Profile + config summary", compactLayoutStart);
	const compactLayoutSource = AGENT_SOURCE.slice(compactLayoutStart, defaultLayoutStart);
	const compactBottomSlotSource = compactLayoutSource.slice(
		compactLayoutSource.indexOf("bottomSlot="),
		compactLayoutSource.indexOf("bottomSlotClassName="),
	);
	const compactFooterOverlaySource = compactLayoutSource.slice(
		compactLayoutSource.indexOf('className="pointer-events-none sticky inset-x-0 bottom-0 z-20 bg-surface"'),
	);
	const compactOperationsStart = AGENT_SOURCE.indexOf("function AgentCompactOperationsBento");
	const sectionLabelStart = AGENT_SOURCE.indexOf("function AgentSectionLabel", compactOperationsStart);
	const compactOperationsSource = AGENT_SOURCE.slice(compactOperationsStart, sectionLabelStart);

	assert.match(AGENT_SOURCE, /layout\?: "default" \| "compact";/u);
	assert.match(AGENT_SOURCE, /layout = "default"/u);
	assert.match(AGENT_SOURCE, /data-agent-config-layout=\{layout\}/u);
	assert.match(AGENT_SOURCE, /layout === "compact"/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_FOOTER_RESERVED_HEIGHT = 88;/u);
	assert.match(AGENT_SOURCE, /const compactFooterOverlayRef = useRef<HTMLDivElement \| null>\(null\);/u);
	assert.match(AGENT_SOURCE, /const \[compactFooterOverlayHeight, setCompactFooterOverlayHeight\] = useState\(AGENT_COMPACT_CONFIG_FOOTER_RESERVED_HEIGHT\);/u);
	assert.match(AGENT_SOURCE, /const compactBentoFooterOffset = Math\.max\([\s\S]*compactFooterOverlayHeight - AGENT_COMPACT_CONFIG_FOOTER_RESERVED_HEIGHT/u);
	assert.match(AGENT_SOURCE, /const dismissTemplateTiles = useCallback\(\(\) => \{[\s\S]*setTemplatesDismissed\(true\);[\s\S]*\}, \[\]\);/u);
	assert.match(AGENT_SOURCE, /const handleTextChange = useCallback\(\(field: AgentConfigTextFieldName, value: string\) => \{[\s\S]*dismissTemplateTiles\(\);[\s\S]*onTextChange\?\.\(field, value\);/u);
	assert.match(AGENT_SOURCE, /const handleAppendListItem = useCallback\(\(field: AgentConfigListFieldName\) => \{[\s\S]*dismissTemplateTiles\(\);[\s\S]*onAppendListItem\?\.\(field\);/u);
	assert.match(AGENT_SOURCE, /const handleOpenDirectory = useCallback\(\(directory: AgentDirectoryKind\) => \{[\s\S]*dismissTemplateTiles\(\);[\s\S]*onOpenDirectory\?\.\(directory\);/u);
	assert.match(AGENT_SOURCE, /const resizeObserver = new ResizeObserver\(updateFooterOverlayHeight\);[\s\S]*resizeObserver\.observe\(node\);[\s\S]*return \(\) => resizeObserver\.disconnect\(\);/u);
	assert.match(compactLayoutSource, /<div\s+className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2"\s+style=\{\{ paddingBottom: AGENT_COMPACT_CONFIG_FOOTER_RESERVED_HEIGHT \}\}/u);
	assert.doesNotMatch(compactLayoutSource, /lg:grid-cols-\[minmax\(0,280px\)_minmax\(0,1fr\)\]/u);
	assert.match(compactBottomSlotSource, /bottomSlot=\{isFilledConfig \? null : \([\s\S]*<div[\s\S]*className="transition-\[padding-bottom\] duration-200 ease-out"[\s\S]*style=\{\{ paddingBottom: compactBentoFooterOffset \}\}[\s\S]*<AnimatePresence>[\s\S]*templatesDismissed \? null : \([\s\S]*<AgentCompactOperationsBento[\s\S]*onDismiss=\{\(\) => setTemplatesDismissed\(true\)\}/u);
	assert.doesNotMatch(compactBottomSlotSource, /AgentCompactConfigToolbarBelow/u);
	assert.match(compactLayoutSource, /bottomSlotClassName="mt-auto flex min-h-0 flex-col gap-2 pt-4"/u);
	assert.match(compactLayoutSource, /className=\{cn\("relative flex flex-col", isFilledConfig \? "min-h-\[560px\]" : "min-h-0 flex-1"\)\}/u);
	assert.match(compactFooterOverlaySource, /className="pointer-events-none sticky inset-x-0 bottom-0 z-20 bg-surface"[\s\S]*ref=\{compactFooterOverlayRef\}[\s\S]*style=\{\{ marginTop: -compactFooterOverlayHeight \}\}[\s\S]*className="pointer-events-auto"[\s\S]*<AgentCompactConfigToolbarBelow[\s\S]*isFilledConfig=\{isFilledConfig\}/u);
	assert.doesNotMatch(compactFooterOverlaySource, /pointer-events-none absolute inset-x-0 bottom-0/u);
	assert.match(compactFooterOverlaySource, /onAppendListItem=\{handleAppendListItem\}[\s\S]*onOpenDirectory=\{handleOpenDirectory\}[\s\S]*onRemoveListItem=\{handleRemoveListItem\}[\s\S]*onTextChange=\{handleTextChange\}/u);
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
	// Empty-row "+ Add" link is always visible; for filled rows the same
	// AgentAddValueButton fades in on hover via the opacity-0 group class.
	assert.match(AGENT_SOURCE, /"group\/add-link inline-flex h-5 items-center gap-1 rounded-xs text-xs font-medium text-text-subtlest/u);
	assert.doesNotMatch(AGENT_SOURCE, /group\/add-link inline-flex h-5 items-center gap-0\.5/u);
	assert.match(AGENT_SOURCE, /<AgentAddValueButton[\s\S]*className=\{isEmpty\s*\?\s*undefined\s*:\s*"opacity-0 transition-opacity group-hover\/agent-row:opacity-100/u);
	assert.match(AGENT_SOURCE, /const AGENT_EMPTY_ROW_ADD_LABELS: Partial<Record<AgentConfigListFieldName, string>> = \{/u);
	assert.match(AGENT_SOURCE, /triggers: "Add rules for when this agent runs"/u);
	assert.match(AGENT_SOURCE, /conversationStarters: "Add prompts to help people start"/u);
	assert.match(AGENT_SOURCE, /skills: "Add skills to guide specialized tasks"/u);
	assert.match(AGENT_SOURCE, /tools: "Add tools to extend what this agent can do"/u);
	assert.match(AGENT_SOURCE, /subagents: "Add subagents to handle specific scenarios"/u);
	assert.match(AGENT_SOURCE, /function getAgentFilledSummaryAddLabel\(field: AgentConfigListFieldName, isEmpty: boolean, showAddButtons: boolean\): string \| undefined \{[\s\S]*return isEmpty \? AGENT_EMPTY_ROW_ADD_LABELS\[field\] \?\? "Add" : "Add";[\s\S]*\}/u);
	// Every list-field row keeps a persistent +Add link. Directory-backed
	// fields open their directory first and fall back to onAppendListItem when no
	// directory opener is supplied.
	assert.match(AGENT_SOURCE, /export type AgentDirectoryKind = "knowledge" \| "tools" \| "skills";/u);
	assert.match(AGENT_SOURCE, /function openAgentDirectoryOrAppendListItem\([\s\S]*onOpenDirectory\?: \(directory: AgentDirectoryKind\) => void[\s\S]*onAppendListItem\?: \(field: AgentConfigListFieldName\) => void[\s\S]*onOpenDirectory\(directory\);[\s\S]*onAppendListItem\?\.\(field\);/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("triggers", triggerItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("skills", skillItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("tools", toolItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("subagents", subagentItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /addLabel=\{getAgentFilledSummaryAddLabel\("conversationStarters", starterItems\.length === 0, showAddButtons\)\}/u);
	assert.match(AGENT_SOURCE, /label="Triggers"\s+onAdd=\{\(\) => onAppendListItem\?\.\("triggers"\)\}/u);
	assert.match(AGENT_SOURCE, /label="Skills"\s+onAdd=\{\(\) => openAgentDirectoryOrAppendListItem\("skills", "skills", onOpenDirectory, onAppendListItem\)\}/u);
	assert.match(AGENT_SOURCE, /label="Tools"\s+onAdd=\{\(\) => openAgentDirectoryOrAppendListItem\("tools", "tools", onOpenDirectory, onAppendListItem\)\}/u);
	assert.match(AGENT_SOURCE, /label="Subagents"\s+onAdd=\{\(\) => onAppendListItem\?\.\("subagents"\)\}/u);
	assert.match(AGENT_SOURCE, /label="Knowledge"\s+onAdd=\{\(\) => openAgentDirectoryOrAppendListItem\("knowledge", "knowledge", onOpenDirectory, onAppendListItem\)\}/u);
	assert.match(AGENT_SOURCE, /label="Conversation starters"\s+onAdd=\{\(\) => onAppendListItem\?\.\("conversationStarters"\)\}/u);
	assert.match(AGENT_SOURCE, /function AgentCompactEmptyConfigNav/u);
	assert.match(AGENT_SOURCE, /function getAgentCompactEmptyConfigNavItems/u);
	assert.match(AGENT_SOURCE, /const items = getAgentCompactEmptyConfigNavItems\(config\);/u);
	// Toolbar now always renders every supported field; counts come from the
	// existing helpers and a neutral Badge appears when count > 0.
	assert.match(AGENT_SOURCE, /case "tools":[\s\S]*count = getNonEmptyConfigItems\(config\.tools\)\.length/u);
	assert.match(AGENT_SOURCE, /case "conversationStarters":[\s\S]*count = getNonEmptyConfigItems\(config\.conversationStarters\)\.length/u);
	assert.match(AGENT_SOURCE, /agentFieldName: "conversationStarters",\s*label: "Conversation starters",\s*listFieldName: "conversationStarters"/u);
	assert.match(AGENT_SOURCE, /item\.count > 0 \? <Badge>\{item\.count\}<\/Badge> : null/u);
	assert.match(AGENT_SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/u);
	assert.match(AGENT_SOURCE, /className="flex min-h-8 min-w-0 items-center"/u);
	// Nav now rolls overflow into a "..." DropdownMenu instead of wrapping onto
	// multiple lines (mirrors AgentCompactHeaderNav).
	assert.doesNotMatch(AGENT_SOURCE, /flex min-w-0 flex-wrap items-center gap-1/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_NAV_GAP = 4;/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_CONFIG_NAV_OVERFLOW_WIDTH = 24;/u);
	assert.match(AGENT_SOURCE, /computeContextBarOverflow\([\s\S]*AGENT_COMPACT_CONFIG_NAV_OVERFLOW_WIDTH,[\s\S]*AGENT_COMPACT_CONFIG_NAV_GAP/u);
	assert.match(AGENT_SOURCE, /function AgentCompactConfigNavButton\(/u);
	assert.match(AGENT_SOURCE, /<DropdownMenuTrigger\s+aria-label="More configuration options"[\s\S]*<MoreHorizontalIcon size="small" \/>/u);
	assert.match(AGENT_SOURCE, /<DropdownMenuItem\s+elemAfter=\{item\.count > 0 \? <Badge>\{item\.count\}<\/Badge> : undefined\}/u);
	assert.match(AGENT_SOURCE, /className="relative flex min-w-0 flex-1 items-center overflow-hidden"[\s\S]*style=\{\{ gap: AGENT_COMPACT_CONFIG_NAV_GAP \}\}/u);
	assert.match(AGENT_SOURCE, /<div className="invisible flex items-center" ref=\{measureRef\}/u);
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
	assert.match(AGENT_SOURCE, /function AgentCompactConfigToolbarBelow\([\s\S]*const \[expanded, setExpanded\] = useState\(\(\) => !isFilledConfig\);[\s\S]*const shouldReduceMotion = useReducedMotion\(\);[\s\S]*const expandButtonRowRef = useRef<HTMLDivElement \| null>\(null\);[\s\S]*const expandButtonX = useMotionValue\(0\);[\s\S]*const expandButtonPaddingRight = useTransform\(expandButtonX, \(latest\): number =>[\s\S]*Math\.abs\(latest\) > 0\.5 \? AGENT_COMPACT_CONFIG_EXPAND_BUTTON_EDGE_GAP : 0,[\s\S]*\);[\s\S]*const expandButtonVisualX = useTransform\(expandButtonX, \(latest\): number =>[\s\S]*latest \+ \(Math\.abs\(latest\) > 0\.5 \? AGENT_COMPACT_CONFIG_EXPAND_BUTTON_EDGE_GAP : 0\),[\s\S]*\);[\s\S]*const isExpanded = expanded;/u);
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
	assert.match(AGENT_SOURCE, /<motion\.div\s+key="expanded"\s+className="mt-2"/u);
	assert.match(AGENT_SOURCE, /<motion\.div\s+key="collapsed"\s+className="mt-2"/u);
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
	assert.match(AGENT_SOURCE, /import \{ CheckIcon, MoreHorizontalIcon, PlusIcon \} from "@\/components\/ui\/vpk-icons";/u);
	assert.doesNotMatch(AGENT_SOURCE, /PlusCircleIcon/u);
	assert.doesNotMatch(AGENT_SOURCE, /agent-compact-config-marker/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Add agent configuration"/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(AGENT_SOURCE, /AGENT_COMPACT_HEADER_NAV_ITEMS = \[[\s\S]*label: "Details"[\s\S]*label: "Access"/u);
	assert.match(AGENT_SOURCE, /<DashboardIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(AGENT_SOURCE, /<VideoPlayIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(AGENT_SOURCE, /import \{[\s\S]*DropdownMenu,[\s\S]*DropdownMenuContent,[\s\S]*DropdownMenuGroup,[\s\S]*DropdownMenuItem,[\s\S]*DropdownMenuTrigger,[\s\S]*\} from "@\/components\/ui\/dropdown-menu";/u);
	assert.match(AGENT_SOURCE, /computeContextBarOverflow\([\s\S]*AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH,[\s\S]*AGENT_COMPACT_HEADER_NAV_GAP/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_HEADER_NAV_GAP = 4;/u);
	assert.match(AGENT_SOURCE, /className="relative flex min-w-0 flex-1 items-center overflow-hidden"[\s\S]*style=\{\{ gap: AGENT_COMPACT_HEADER_NAV_GAP \}\}/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH = 24;/u);
	assert.match(AGENT_SOURCE, /<DropdownMenuTrigger[\s\S]*aria-label="More agent sections"[\s\S]*render=\{<Button className="size-6 rounded px-0" size="icon-compact" type="button" variant="ghost" \/>\}[\s\S]*<MoreHorizontalIcon size="small" \/>/u);
	assert.match(AGENT_SOURCE, /hiddenItems\.map\(\(item\) => \([\s\S]*<DropdownMenuItem elemBefore=\{item\.icon\} key=\{item\.label\}>/u);
	assert.match(AGENT_SOURCE, /<Avatar label="Agent" shape="hexagon" size="sm">[\s\S]*<AvatarImage alt="" src=\{avatarSrc\} \/>/u);
	assert.match(AGENT_SOURCE, /aria-pressed=\{item\.isSelected \? true : undefined\}[\s\S]*variant=\{item\.isSelected \? "outline" : "ghost"\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /\[&_svg\]:size-4!/u);
	assert.match(AGENT_SOURCE, /function AgentCompactOperationsBento/u);
	assert.match(AGENT_SOURCE, /function AgentCompactBentoTemplatesHint[\s\S]*onBrowseAll\?: \(\) => void;[\s\S]*<AgentSectionLabel>[\s\S]*<span>Start with these agent templates<\/span>[\s\S]*·[\s\S]*onClick=\{onBrowseAll\}[\s\S]*Browse all/u);
	assert.match(AGENT_SOURCE, /showSectionLabel=\{false\}/u);
	assert.match(AGENT_SOURCE, /data-slot="agent-compact-operations-bento"/u);
	assert.match(AGENT_SOURCE, /AGENT_COMPACT_BENTO_CARD_GLOW_EFFECT_STYLE/u);
	assert.match(AGENT_SOURCE, /function AgentCompactBentoCardGlowLayers/u);
	assert.match(AGENT_SOURCE, /const AGENT_COMPACT_BENTO_CARD_BORDER_FADE_STYLE: CSSProperties = \{[\s\S]*maskImage: "linear-gradient\(to bottom, #000 calc\(100% - 64px\), transparent 100%\)",[\s\S]*WebkitMaskImage: "linear-gradient\(to bottom, #000 calc\(100% - 64px\), transparent 100%\)",[\s\S]*\};/u);
	assert.match(AGENT_SOURCE, /data-agent-compact-bento-card-border-fade[\s\S]*style=\{AGENT_COMPACT_BENTO_CARD_BORDER_FADE_STYLE\}[\s\S]*data-agent-compact-bento-card-base-border[\s\S]*data-agent-compact-bento-card-glow-border[\s\S]*<\/span>/u);
	assert.match(AGENT_SOURCE, /<AgentCompactBentoCardGlowLayers iconSrc=\{template\.iconSrc\} \/>[\s\S]*<span className="relative z-\[3\] inline-flex size-8/u);
	assert.match(AGENT_SOURCE, /className="relative -mt-2 min-h-0 pt-2 sm:flex-1 sm:overflow-hidden sm:bento-fade-bottom"/u);
	assert.doesNotMatch(AGENT_SOURCE, /sm:\[--bento-fade-end:64px\]/u);
	assert.match(AGENT_SOURCE, /<BentoCarousel[\s\S]*gridClassName="sm:grid-cols-5"[\s\S]*arrowLabels=\{\{ next: "Show next agent templates", previous: "Show previous agent templates" \}\}/u);
	assert.match(AGENT_SOURCE, /BENTO_CAROUSEL_TILE_CLASS/u);
	assert.doesNotMatch(compactOperationsSource, /whileHover=\{/u);
	assert.match(AGENT_SOURCE, /<AgentCompactBentoTemplatesHint onBrowseAll=\{\(\) => setBrowseOpen\(true\)\} onDismiss=\{onDismiss\} \/>/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Browse all agents"/u);
	assert.doesNotMatch(AGENT_SOURCE, /Show more/u);
	assert.match(AGENT_SOURCE, /title: "Service Triage"/u);
	assert.match(AGENT_SOURCE, /title: "Service Request Helper"/u);
	assert.match(AGENT_SOURCE, /title: "Rovo Ops"/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/toolbarBelowSlot\?: ReactNode;[\s\S]*data-slot="rich-text-editor-toolbar-below"/u,
	);

	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoCompactFilled/u);
	assert.match(AGENT_DEMO_SOURCE, /idPrefix="agent-demo-compact-filled"/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoCompactFilled[\s\S]*leadingContent=\{<AgentCompactHeaderNav \/>\}/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoCompactEmpty/u);
	assert.match(AGENT_DEMO_SOURCE, /idPrefix="agent-demo-compact-empty"/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoCompactEmpty[\s\S]*leadingContent=\{<AgentCompactHeaderNav \/>\}/u);
	assert.doesNotMatch(AGENT_DEMO_SOURCE, /showActions=\{false\}/u);
	assert.match(
		AGENT_DEMO_SOURCE,
		/idPrefix="agent-demo-compact-filled"[\s\S]*layout="compact"/u,
	);
	assert.match(
		AGENT_DEMO_SOURCE,
		/idPrefix="agent-demo-compact-empty"[\s\S]*layout="compact"/u,
	);
	assert.match(UI_CUSTOM_DETAILS_SOURCE, /title: "Compact filled"[\s\S]*demoSlug: "agent-demo-compact-filled"/u);
	assert.match(UI_CUSTOM_DETAILS_SOURCE, /title: "Compact empty"[\s\S]*demoSlug: "agent-demo-compact-empty"/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /"agent-demo-compact-filled": dynamic/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /default: mod\.AgentDemoCompactFilled/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /"agent-demo-compact-empty": dynamic/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /default: mod\.AgentDemoCompactEmpty/u);
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
		/placeholderSlot && isEmpty && !isMarkdownMode[\s\S]*data-slot="rich-text-editor-placeholder"[\s\S]*pointer-events-none absolute inset-0/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /data-empty=\{isEmpty \? "true" : undefined\}/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/onUpdate: \(\{ editor: activeEditor \}\) => \{[\s\S]*const markdown = activeEditor\.getMarkdown\(\);[\s\S]*onMarkdownChangeRef\.current\?\.\(markdown\);/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /editor\.commands\.setContent\(nextValue, \{[\s\S]*contentType: "markdown",[\s\S]*emitUpdate: false/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_SOURCE, /absolute top-0 left-0/u);
});

test("Shared Tiptap placeholder stays aligned with the editable paragraph", () => {
	assert.match(
		RICH_TEXT_EDITOR_CSS,
		/\.rich-text-editor-content\[data-empty="true"\] \.tiptap-editor > p:first-child::before/u,
	);
	assert.match(RICH_TEXT_EDITOR_CSS, /content: var\(--rich-text-placeholder\);/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /float: left;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /height: 0;/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /position:\s*absolute/u);
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
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /data-type": "mention"/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Markdown\.configure/u);
});

test("Slash command menu contains every toolbar command", () => {
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /"format"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /category === "format" \? "Format"/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /getSlashCommandFormatItems/u);
	assert.match(EDITOR_PALETTE_SOURCE, /getSlashCommandCategoryItems\(mentionSources\)/u);
	assert.match(EDITOR_PALETTE_SOURCE, /getSlashCommandFormatItems\(\)/u);
	assert.match(EDITOR_PALETTE_SOURCE, /caption="Format nested"/u);
	assert.match(EDITOR_PALETTE_SOURCE, /title="Format"/u);
	assert.doesNotMatch(EDITOR_PALETTE_SOURCE, /\.\.\.SLASH_COMMANDS/u);

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

test("Mention menu exposes people/agent and command categories and mention lozenges", () => {
	for (const category of ["Subagents", "Human", "A team", "Skills", "Tools", "Knowledge"]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(category, "u"));
	}

	for (const idPrefix of ["human:", "team:", "tool:", "knowledge:"]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(`id: "${idPrefix}`, "u"));
	}
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /revealDescriptionOnHover/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /data-nested=\{isNested \? "true" : undefined\}/u);
	assert.match(RICH_TEXT_SUGGESTION_SOURCE, /data-list-scrolled=\{isNested && hasScrolledList \? "true" : undefined\}/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-nested="true"\] \{\s*max-height: 400px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-showcase\[data-nested="true"\] \.rich-text-command-menu-list \{\s*overflow-y: auto;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-nested="true"\]\[data-list-scrolled="true"\] \.rich-text-command-menu-list \{\s*mask-image: linear-gradient\(to bottom, transparent 0, black 16px, black 100%\);/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-back \{[\s\S]*border-bottom/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-nested="true"\] \.rich-text-command-menu-list \.rich-text-command-menu-item \{\s*height: 48px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu\[data-nested="true"\] \.rich-text-command-menu-list \.rich-text-command-menu-description \{\s*opacity: 0;/u);
	assert.doesNotMatch(RICH_TEXT_SUGGESTION_SOURCE, /rich-text-command-menu-title/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /\.rich-text-command-menu-title/u);
	assert.match(AGENT_SOURCE, /toMentionId\("skill"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("knowledge"/u);

	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-mention/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="skill"\]/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="knowledge"\]/u);
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
	assert.match(EDITOR_TOOLBAR_SOURCE, /onInsertReferenceOption\?: \(category: EditorToolbarInsertReferenceCategory, label: string\) => boolean \| void;/u);
	assert.match(EDITOR_TOOLBAR_INDEX_SOURCE, /export type \{ EditorToolbarInsertReferenceCategory, EditorToolbarProps \} from "\.\/components\/editor-toolbar";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /import type \{ EditorToolbarInsertReferenceCategory \} from "@\/components\/blocks\/editor-toolbar";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onInsertReferenceOption\?: \(category: EditorToolbarInsertReferenceCategory, label: string\) => boolean \| void;/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onInsertReferenceOption=\{onInsertReferenceOption\}/u);
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
	assert.match(EDITOR_TOOLBAR_SOURCE, /<ToolbarSeparator \/>\s*<div className="relative">[\s\S]*value=\{listValue\}/u);

	// Link remains a separate Toggle; rendered/Markdown mode is a far-right Tabs control.
	assert.match(EDITOR_TOOLBAR_SOURCE, /pressed=\{!isMarkdownMode && editor\.isActive\("link"\)\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /aria-label="Link"[\s\S]*onPressedChange=\{handleLinkPressedChange\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /aria-label="Add content"[\s\S]*onClick=\{handleAddContent\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /const handledByConsumer = onInsertReferenceOption\?\.\(category, label\);/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /if \(handledByConsumer !== false && typeof onInsertReferenceOption !== "undefined"\) \{[\s\S]*closeDropdown\(\);[\s\S]*return;[\s\S]*\}[\s\S]*insertContent/u);
	// The trailing `+` button is wrapped in a positioned div so it can anchor
	// the Insert dropdown.
	assert.match(EDITOR_TOOLBAR_SOURCE, /<LinkIcon label="" size="small" \/>\s*<\/Toggle>\s*<ToolbarSeparator \/>/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<div className="relative">\s*<Button[\s\S]*aria-label="Add content"[\s\S]*<AddIcon label="" size="small" \/>[\s\S]*<\/Button>[\s\S]*<\/div>/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /<AddIcon label="" size="small" \/>\s*<\/Button>\s*<ToolbarSeparator \/>/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /\{endSlot \|\| showModeTabs \? \(\s*<div className="flex shrink-0 items-center gap-2">[\s\S]*\{endSlot\}[\s\S]*<Tabs[\s\S]*value=\{isMarkdownMode \? "markdown" : "rendered"\}/u);
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
	assert.match(EDITOR_TOOLBAR_SOURCE, /onToggleMarkdownMode\?: \(\) => void;/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /import \{ BubbleMenu, FloatingMenu \} from "@tiptap\/react\/menus";/u);
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/<BubbleMenu[\s\S]*shouldShow=\{\(\{ editor: activeEditor, from, to \}\) =>[\s\S]*activeEditor\.isEditable && from !== to/u,
	);
	// Mode tabs only render when a toggle handler is supplied (omitted in bubble/floating menus).
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/const showModeTabs = Boolean\(onToggleMarkdownMode\);[\s\S]*\{endSlot \|\| showModeTabs \? \(/u,
	);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<TabsTrigger[\s\S]*aria-label="Rendered text"[\s\S]*value="rendered"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<TabsTrigger[\s\S]*aria-label="Markdown source"[\s\S]*value="markdown"/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, />\s*Rendered\s*</u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, />\s*Markdown\s*</u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /Show Markdown source/u);
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
	assert.match(EDITOR_TOOLBAR_SOURCE, /const markdownUnsupported = isMarkdownMode;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /disabled=\{markdownUnsupported\}/u);
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
		/const \[isMarkdownMode, setIsMarkdownMode\] = useState\(false\);/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /const \[markdownSource, setMarkdownSource\] = useState\(""\);/u);
	// Entering source mode snapshots the rendered doc as Markdown.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /setMarkdownSource\(editor\.getMarkdown\(\)\)/u);
	// Leaving source mode re-parses the edited Markdown back into the editor.
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/editor\.commands\.setContent\(markdownSource, \{[\s\S]*contentType: "markdown",[\s\S]*emitUpdate: false/u,
	);
	// Source mode renders an editable textarea instead of EditorContent.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /isMarkdownMode \? \(\s*<textarea/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /data-rich-text-markdown-source/u);
	// The parent stays live-synced while editing source.
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/function handleMarkdownSourceChange\(next: string\): void \{[\s\S]*onMarkdownChangeRef\.current\?\.\(next\);/u,
	);
	// The toolbar receives the toggle wiring; bubble/floating menus hide in source mode.
	assert.match(RICH_TEXT_EDITOR_SOURCE, /onToggleMarkdownMode=\{handleToggleMarkdownMode\}/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /showBubbleMenu && editor && !isMarkdownMode/u);
});
