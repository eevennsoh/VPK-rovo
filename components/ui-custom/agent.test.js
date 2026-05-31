const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const AGENT_SOURCE = readFileSync(join(__dirname, "agent.tsx"), "utf8");
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
	assert.match(AGENT_SOURCE, /editorClassName="agent-instructions-tiptap-editor text-text"/u);
	assert.match(AGENT_SOURCE, /placeholder="Describe the agent’s role and what it should do\. @mention, or \/ for skills"/u);
	assert.match(AGENT_SOURCE, /mentionSources=\{mentionSources\}/u);
	assert.match(AGENT_SOURCE, /onMarkdownChange=\{onInstructionsChange\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /AGENT_EDITOR_CONTROLS/u);
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
});

test("Agent profile inline edit fields align to the profile content edge", () => {
	assert.match(
		AGENT_SOURCE,
		/readViewClassName="h-auto px-0 py-1 text-2xl leading-7 font-semibold focus:border-2 focus:border-border-focused focus-visible:border-2 focus-visible:border-border-focused"/u,
	);
	assert.match(
		AGENT_SOURCE,
		/inputProps=\{\{ className: "h-auto border-2 px-0 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" \}\}/u,
	);
	assert.match(AGENT_SOURCE, /readViewClassName="px-0"/u);
	assert.match(
		AGENT_SOURCE,
		/textareaProps=\{\{ rows: 1, className: "min-h-10 bg-bg-neutral-subtle px-0/u,
	);
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
	for (const source of [STUDIO_AGENT_RESULT_SOURCE, STUDIO_SHELL_SOURCE]) {
		assert.match(source, /structured Markdown/u);
		assert.match(source, /## Instructions/u);
		assert.match(source, /bold labels/u);
	}

	assert.match(STUDIO_AGENT_RESULT_SOURCE, /- \*\*Summary\*\*/u);
	assert.match(STUDIO_AGENT_RESULT_SOURCE, /## Validation/u);
});

test("Shared toolbar carries the Confluence editor control set", () => {
	for (const control of [
		"Text alignment",
		"Bulleted list",
		"Numbered list",
		"Link",
		"Comment",
		"More options",
	]) {
		assert.match(RICH_TEXT_TOOLBAR_SOURCE, new RegExp(control, "u"));
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
		assert.match(RICH_TEXT_TOOLBAR_SOURCE, new RegExp(command, "u"));
	}
});

test("Shared toolbar builds on/off controls with Toggle and ToggleGroup", () => {
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /import MarkdownIcon from "@atlaskit\/icon\/core\/markdown";/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /import \{ Toggle \} from "@\/components\/ui\/toggle";/u);
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/import \{ ToggleGroup, ToggleGroupItem \} from "@\/components\/ui\/toggle-group";/u,
	);

	// Bold and bulleted list are editor-controlled Toggles (unpressed in source mode).
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /pressed=\{!isMarkdownMode && editor\.isActive\("bold"\)\}/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /pressed=\{!isMarkdownMode && editor\.isActive\("bulletList"\)\}/u);
	assert.doesNotMatch(
		RICH_TEXT_TOOLBAR_SOURCE,
		/variant=\{editor\.isActive\("bold"\) \? "secondary" : "ghost"\}/u,
	);

	// Link + Markdown form one controlled multi-select ToggleGroup.
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /<ToggleGroup\s+multiple/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /<ToggleGroupItem\s+value="link"/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /value="markdown"/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /<MarkdownIcon label="" size="small" \/>/u);
});

test("Shared toolbar exposes a Markdown view toggle gated by a handler", () => {
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /isMarkdownMode\?: boolean;/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /onToggleMarkdownMode\?: \(\) => void;/u);
	// Markdown item only renders when a toggle handler is supplied (omitted in bubble/floating menus).
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/onToggleMarkdownMode \?\s*\([\s\S]*value="markdown"/u,
	);
});

test("Source-mode toolbar controls apply Markdown syntax instead of disabling", () => {
	// The toolbar dispatches a Markdown-format transform when in source mode.
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/onMarkdownFormat\?: \(kind: MarkdownFormatKind\) => void;/u,
	);
	assert.match(
		RICH_TEXT_TOOLBAR_SOURCE,
		/function runFormat\(kind: MarkdownFormatKind, applyRich: \(\) => void\): void \{[\s\S]*onMarkdownFormat\?\.\(kind\)/u,
	);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /runFormat\("bold",/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /runFormat\("italic",/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /runFormat\("bulletList",/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /runFormat\("orderedList",/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /TEXT_STYLE_TO_MARKDOWN/u);
	// Only alignment + comment (no Markdown equivalent) stay disabled in source mode.
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /const markdownUnsupported = isMarkdownMode;/u);
	assert.match(RICH_TEXT_TOOLBAR_SOURCE, /disabled=\{markdownUnsupported\}/u);
	assert.doesNotMatch(RICH_TEXT_TOOLBAR_SOURCE, /formattingDisabled/u);
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
