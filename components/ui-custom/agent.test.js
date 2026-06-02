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
const EDITOR_TOOLBAR_SOURCE = readFileSync(
	join(__dirname, "..", "blocks", "editor-toolbar", "components", "editor-toolbar.tsx"),
	"utf8",
);
const MODEL_SELECTOR_SOURCE = readFileSync(
	join(__dirname, "model-selector.tsx"),
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

test("Agent instructions composer uses the shared Tiptap editor", () => {
	assert.match(AGENT_SOURCE, /RichTextEditor,[\s\S]*\} from "@\/components\/ui-custom\/rich-text-editor";/u);
	assert.match(AGENT_SOURCE, /function AgentInstructionsComposer/u);
	assert.match(AGENT_SOURCE, /<RichTextEditor[\s\S]*aria-label="Agent instructions"/u);
	assert.match(AGENT_SOURCE, /editorClassName=\{cn\("agent-instructions-tiptap-editor text-text", editorClassName\)\}/u);
	assert.match(AGENT_SOURCE, /placeholder="Describe the agent’s role and what it should do\. @mention, or \/ for skills"/u);
	assert.match(AGENT_SOURCE, /mentionSources=\{mentionSources\}/u);
	assert.match(AGENT_SOURCE, /toolbarBelowSlot=\{toolbarBelowSlot\}/u);
	assert.match(AGENT_SOURCE, /toolbarEndSlot=\{<AgentInstructionsModelSelector \/>\}/u);
	assert.match(AGENT_SOURCE, /onMarkdownChange=\{onInstructionsChange\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /AGENT_EDITOR_CONTROLS/u);
});

test("Agent instructions model selector labels the mode and keeps active rows neutral", () => {
	assert.match(AGENT_SOURCE, /function AgentInstructionsModelSelector/u);
	assert.match(AGENT_SOURCE, /useState<ReasoningModeValue>\("deep-auto"\)/u);
	assert.match(AGENT_SOURCE, /const triggerLabel = current[\s\S]*current\.section === "Think deeper" && current\.value !== "deep-auto" \? current\.label : current\.section/u);
	assert.match(AGENT_SOURCE, /render=\{<Button className="shrink-0 gap-1\.5 text-text-subtle" variant="ghost" \/>\}/u);
	assert.match(AGENT_SOURCE, /<Icon render=\{<AiModelIcon label="" size="small" \/>\} aria-hidden \/>[\s\S]*\{triggerLabel\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /diagram-symbol-mind-map/u);
	assert.doesNotMatch(AGENT_SOURCE, /`\$\{current\.section\}: \$\{current\.label\}`/u);
	assert.match(MODEL_SELECTOR_SOURCE, /data-selected:bg-bg-neutral-subtle-hovered!/u);
	assert.match(MODEL_SELECTOR_SOURCE, /data-\[checked=true\]:bg-bg-selected/u);
	assert.doesNotMatch(MODEL_SELECTOR_SOURCE, /data-selected:bg-bg-selected!/u);
});

test("Agent config updates instructions as markdown strings", () => {
	assert.match(
		AGENT_SOURCE,
		/onInstructionsChange=\{\(value\) => onTextChange\?\.\("instructions", value\)\}/u,
	);
	assert.match(AGENT_SOURCE, /fetch\("\/api\/skills"/u);
	assert.match(AGENT_SOURCE, /fetch\("\/api\/wiki\/memory-explorer"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("skill"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("memory"/u);
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
	// The default header uses a compact outline ToggleGroup (size="sm") instead
	// of the Tabs control. Consumers that need controlled tabs still override
	// via the `actions` prop.
	assert.match(AGENT_SOURCE, /import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u);
	assert.match(AGENT_SOURCE, /primaryActionLabel = "Configure"/u);
	assert.match(AGENT_SOURCE, /secondaryActionLabel = "Test"/u);
	// ToggleGroup carries its own context, so the default actions render it
	// directly (compact: variant="outline" size="sm").
	assert.match(
		AGENT_SOURCE,
		/\{actions \?\? \([\s\S]*<ToggleGroup[\s\S]*aria-label="Agent views"[\s\S]*defaultValue=\{\["configure"\]\}[\s\S]*variant="outline"[\s\S]*size="sm"[\s\S]*<ToggleGroupItem value="configure">[\s\S]*\{primaryActionLabel\}[\s\S]*<ToggleGroupItem value="test">[\s\S]*\{secondaryActionLabel\}[\s\S]*<\/ToggleGroup>/u,
	);
	// The Tabs-based header is fully retired from the default actions.
	assert.doesNotMatch(AGENT_SOURCE, /import \{ Tabs, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs";/u);
	assert.doesNotMatch(AGENT_SOURCE, /<TabsTrigger/u);
});

test("Agent component page wires compact filled and empty placeholder variations", () => {
	const compactLayoutStart = AGENT_SOURCE.indexOf('{layout === "compact"');
	const defaultLayoutStart = AGENT_SOURCE.indexOf("{/* Profile + config summary", compactLayoutStart);
	const compactLayoutSource = AGENT_SOURCE.slice(compactLayoutStart, defaultLayoutStart);

	assert.match(AGENT_SOURCE, /layout\?: "default" \| "compact";/u);
	assert.match(AGENT_SOURCE, /layout = "default"/u);
	assert.match(AGENT_SOURCE, /data-agent-config-layout=\{layout\}/u);
	assert.match(AGENT_SOURCE, /layout === "compact"/u);
	assert.match(compactLayoutSource, /<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">/u);
	assert.doesNotMatch(compactLayoutSource, /lg:grid-cols-\[minmax\(0,280px\)_minmax\(0,1fr\)\]/u);
	assert.match(compactLayoutSource, /bottomSlot=\{[\s\S]*isFilledConfig \? undefined : \([\s\S]*<AnimatePresence>[\s\S]*templatesDismissed \? null : \([\s\S]*<AgentCompactOperationsBento[\s\S]*onDismiss=\{\(\) => setTemplatesDismissed\(true\)\}/u);
	assert.match(compactLayoutSource, /toolbarBelowSlot=\{\([\s\S]*<AgentCompactConfigToolbarBelow[\s\S]*isFilledConfig=\{isFilledConfig\}/u);
	assert.match(AGENT_SOURCE, /function AgentCompactConfigToolbarBelow/u);
	assert.doesNotMatch(AGENT_SOURCE, /showAddButtons=\{false\}/u);
	// Compact toolbar surfaces empty fields as single-line nav buttons, so the
	// filled summary must drop empty rows (no double-representation) while keeping
	// the hover "Add" affordance on filled rows.
	assert.match(AGENT_SOURCE, /<AgentFilledConfigSummary\s+config=\{config\}\s+hideEmptyRows/u);
	assert.match(AGENT_SOURCE, /if \(isEmpty && \(hideWhenEmpty \|\| !addLabel\)\) \{/u);
	assert.match(AGENT_SOURCE, /function AgentCompactEmptyConfigNav/u);
	assert.match(AGENT_SOURCE, /function getAgentCompactEmptyConfigNavItems/u);
	assert.match(AGENT_SOURCE, /const visibleItems = getAgentCompactEmptyConfigNavItems\(config\);/u);
	assert.match(AGENT_SOURCE, /case "tools":[\s\S]*return getNonEmptyConfigItems\(config\.tools\)\.length === 0/u);
	assert.match(AGENT_SOURCE, /className="flex min-h-8 min-w-0 items-center gap-1"/u);
	assert.match(AGENT_SOURCE, /hasVisibleAddOptions \? "pt-2" : "pt-4"/u);
	assert.match(AGENT_SOURCE, /import \{ CheckIcon, MoreHorizontalIcon, PlusCircleIcon, PlusIcon \} from "@\/components\/ui\/vpk-icons";/u);
	assert.match(AGENT_SOURCE, /aria-hidden="true"[\s\S]*data-slot="agent-compact-config-marker"[\s\S]*className="ml-1 inline-flex size-6 shrink-0 items-center justify-center text-icon-subtle"[\s\S]*<PlusCircleIcon size="small" \/>/u);
	assert.doesNotMatch(AGENT_SOURCE, /aria-label="Add agent configuration"/u);
	assert.match(AGENT_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(AGENT_SOURCE, /AGENT_COMPACT_HEADER_NAV_ITEMS = \[[\s\S]*label: "Details"[\s\S]*label: "Access"/u);
	assert.match(AGENT_SOURCE, /<DashboardIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(AGENT_SOURCE, /<VideoPlayIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(AGENT_SOURCE, /import \{[\s\S]*DropdownMenu,[\s\S]*DropdownMenuContent,[\s\S]*DropdownMenuGroup,[\s\S]*DropdownMenuItem,[\s\S]*DropdownMenuTrigger,[\s\S]*\} from "@\/components\/ui\/dropdown-menu";/u);
	assert.match(AGENT_SOURCE, /import \{ CheckIcon, MoreHorizontalIcon, PlusCircleIcon, PlusIcon \} from "@\/components\/ui\/vpk-icons";/u);
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
	assert.match(AGENT_SOURCE, /showSectionLabel=\{false\}/u);
	assert.match(AGENT_SOURCE, /data-slot="agent-compact-operations-bento"/u);
	assert.match(AGENT_SOURCE, /AGENT_COMPACT_BENTO_CARD_GLOW_EFFECT_STYLE/u);
	assert.match(AGENT_SOURCE, /function AgentCompactBentoCardGlowLayers/u);
	assert.match(AGENT_SOURCE, /AGENT_COMPACT_BENTO_FADE_MASK/u);
	assert.match(AGENT_SOURCE, /auto-rows-\[144px\][\s\S]*lg:grid-cols-5/u);
	assert.match(AGENT_SOURCE, /<SkillTagGroup maxRows=\{2\}>/u);
	assert.match(AGENT_SOURCE, /<TWGAppstack[\s\S]*iconSize="md"[\s\S]*sources=\{template\.hero\.sources\}/u);
	assert.match(AGENT_SOURCE, /Browse all/u);
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
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Suggestion<RichTextCommandItem/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /char: "\/"/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Mention\.configure/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /data-type": "mention"/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Markdown\.configure/u);
});

test("Slash command menu contains every toolbar command", () => {
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

test("Mention menu exposes Studio context categories and mention lozenges", () => {
	for (const category of ["Skills", "Links", "Memory", "Triggers", "Tools"]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(category, "u"));
	}

	for (const idPrefix of ["link:", "trigger:", "tool:"]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(`id: "${idPrefix}`, "u"));
	}
	assert.match(AGENT_SOURCE, /toMentionId\("skill"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("memory"/u);

	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-mention/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="skill"\]/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="memory"\]/u);
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
	assert.match(EDITOR_TOOLBAR_SOURCE, /import MarkdownIcon from "@atlaskit\/icon\/core\/markdown";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import \{ Toggle \} from "@\/components\/ui\/toggle";/u);
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u,
	);
	assert.match(EDITOR_TOOLBAR_SOURCE, /import \{ Separator \} from "@\/components\/ui\/separator";/u);

	// Bold + formatting and bulleted list + list options are related split controls.
	assert.match(EDITOR_TOOLBAR_SOURCE, /const TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME = "\*:data-\[slot=toggle-group-item\]:w-6! \*:data-\[slot=toggle-group-item\]:min-w-6! \*:data-\[slot=toggle-group-item\]:px-0!";/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /const formattingValue = \[/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /const listValue = \[/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /value=\{formattingValue\}[\s\S]*className=\{TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME\}[\s\S]*value="bold"[\s\S]*value="formatting"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /value=\{listValue\}[\s\S]*className=\{TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME\}[\s\S]*value="bulletList"[\s\S]*value="list"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /function ToolbarSeparator\(\)[\s\S]*orientation="vertical"[\s\S]*className="mx-2 h-4 self-center bg-border data-vertical:self-center"/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /<ToolbarSeparator \/>\s*<div className="relative">[\s\S]*value=\{listValue\}/u);

	// Link and Markdown are separate Toggles because their states are unrelated.
	assert.match(EDITOR_TOOLBAR_SOURCE, /pressed=\{!isMarkdownMode && editor\.isActive\("link"\)\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /aria-label="Link"[\s\S]*onPressedChange=\{handleLinkPressedChange\}/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /pressed=\{isMarkdownMode\}/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /value="link"/u);
	assert.doesNotMatch(EDITOR_TOOLBAR_SOURCE, /value="markdown"/u);
	assert.doesNotMatch(
		EDITOR_TOOLBAR_SOURCE,
		/variant=\{editor\.isActive\("bold"\) \? "secondary" : "ghost"\}/u,
	);
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

test("Shared toolbar exposes a Markdown view toggle gated by a handler", () => {
	assert.match(EDITOR_TOOLBAR_SOURCE, /isMarkdownMode\?: boolean;/u);
	assert.match(EDITOR_TOOLBAR_SOURCE, /onToggleMarkdownMode\?: \(\) => void;/u);
	// Markdown toggle only renders when a toggle handler is supplied (omitted in bubble/floating menus).
	assert.match(
		EDITOR_TOOLBAR_SOURCE,
		/onToggleMarkdownMode \?\s*\([\s\S]*<Toggle[\s\S]*Show Markdown source/u,
	);
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

test("Markdown source toggle round-trips through the shared editor", () => {
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
