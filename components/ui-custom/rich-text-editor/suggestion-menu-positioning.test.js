const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("prompt input exposes an internal root marker for suggestion popover anchoring", () => {
	const source = readProjectFile("components/ui-custom/prompt-input.tsx");

	assert.match(
		source,
		/<form[\s\S]*\{\.\.\.props\}[\s\S]*data-prompt-input-root=""/u,
	);
});

test("composer suggestions resolve the prompt input root before legacy chat form fallbacks", () => {
	const source = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");
	const rootSelectorIndex = source.indexOf("editorDom.closest<HTMLElement>(PROMPT_INPUT_ROOT_SELECTOR)");
	const legacyClassIndex = source.indexOf('editorDom.closest<HTMLElement>(".chat-composer-form")');
	const formFallbackIndex = source.indexOf('editorDom.closest<HTMLElement>("form")');

	assert.match(source, /const PROMPT_INPUT_ROOT_SELECTOR = "\[data-prompt-input-root\]";/u);
	assert.ok(rootSelectorIndex > -1);
	assert.ok(legacyClassIndex > rootSelectorIndex);
	assert.ok(formFallbackIndex > legacyClassIndex);
});

test("composer suggestions prefer above-input placement and only fall below when above would clip", () => {
	const source = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");

	assert.match(source, /const spaceAbove = rect\.top - COMPOSER_POPUP_GAP;/u);
	assert.match(source, /const placeAbove = popupHeight <= spaceAbove;/u);
	assert.match(source, /rect\.top - popupHeight - COMPOSER_POPUP_GAP/u);
	assert.match(source, /rect\.bottom \+ COMPOSER_POPUP_GAP/u);
});

test("command menu search autofocus does not scroll portalled popovers into view", () => {
	const source = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");
	const fieldStart = source.indexOf("export function RichTextCommandMenuSearchField");
	const fieldSource = source.slice(fieldStart, source.indexOf("interface RichTextSuggestionMenuOptionProps", fieldStart));

	assert.ok(fieldStart > -1, "expected RichTextCommandMenuSearchField source");
	assert.match(fieldSource, /inputRef\.current\?\.focus\(\{ preventScroll: true \}\);/u);
	assert.doesNotMatch(fieldSource, /autoFocus=\{autoFocus\}/u);
});

test("composer palette re-hugs the container on its own height change (not just window resize/scroll)", () => {
	const source = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");

	// The palette is bottom-anchored, so it must reposition whenever its measured
	// height changes (query filtering, drill-in, async rows) — otherwise a menu
	// that opened tall and then shrank keeps a stale `top` and floats above the
	// composer instead of hugging it. A window resize/scroll listener alone does
	// not fire for an element's own size change, so we observe the popup itself.
	const attachStart = source.indexOf("function attachComposerAnchor(");
	assert.ok(attachStart > -1, "attachComposerAnchor must exist");
	const attachBody = source.slice(attachStart, attachStart + 2600);

	assert.match(attachBody, /new ResizeObserver\(scheduleReposition\)/u);
	assert.match(attachBody, /resizeObserver\.observe\(element\)/u);
	assert.match(attachBody, /getComposerAnchorBox\(editorDom\)/u);
	assert.match(attachBody, /resizeObserver\?\.disconnect\(\)/u);
});

test("composer editor extensions remain the boundary for input-anchored suggestions", () => {
	const source = readProjectFile("components/ui-custom/rich-text-editor/composer-extensions.ts");

	assert.match(source, /const composerOptions = \{ \.\.\.options, anchorToInput: true, showAskRovoPrompt: false \};/u);
});

test("prompt input forwards scoped mention layout and section copy to the shared palette", () => {
	const promptInputSource = readProjectFile("components/ui-custom/prompt-input.tsx");
	const extensionSource = readProjectFile("components/ui-custom/rich-text-editor/extensions.ts");
	const menuSource = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");

	assert.match(promptInputSource, /mentionSectionLabels\?: RichTextMentionSectionLabels;/u);
	assert.match(promptInputSource, /suggestionVariant\?: RichTextSuggestionVariantConfig;/u);
	assert.match(promptInputSource, /createComposerEditorExtensions\(\{[\s\S]*mentionSectionLabels,[\s\S]*suggestionVariant,/u);
	assert.match(extensionSource, /createMentionSuggestionRenderer\([\s\S]*options\.mentionSectionLabels,/u);
	assert.match(menuSource, /const DEFAULT_MENTION_PARENT_LABELS:[\s\S]*subagent: "Subagents"/u);
	assert.match(menuSource, /return \{ \.\.\.DEFAULT_MENTION_PARENT_LABELS, \.\.\.overrides \};/u);
});

test("third-party subagents use the shared hexagon avatar in suggestion palettes", () => {
	const source = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");

	assert.match(source, /import \{ AgentAvatarVisual \} from "@\/components\/ui-custom\/agent-avatar-visual";/u);
	assert.match(source, /item\.category === "subagent" && visual\?\.kind === "third-party"[\s\S]*<AgentAvatarVisual[\s\S]*brandName=\{visual\.name\}[\s\S]*sizePx=\{24\}/u);
});

test("composer directory autocomplete accepts the active visible list item on Tab", () => {
	const extensionSource = readProjectFile("components/ui-custom/rich-text-editor/composer-extensions.ts");
	const promptInputSource = readProjectFile("components/ui-custom/prompt-input.tsx");

	assert.match(extensionSource, /acceptActiveListItem: \(\) => boolean;/u);
	assert.match(extensionSource, /event\.key === "Tab" && !event\.shiftKey && controller\.hasAcceptableList\(\)[\s\S]*event\.preventDefault\(\);[\s\S]*return controller\.acceptActiveListItem\(\);/u);
	assert.match(promptInputSource, /acceptActiveListItem: \(\) =>[\s\S]*acceptDirectoryAutocompleteIndexRef\.current\([\s\S]*directoryAutocompleteStateRef\.current\?\.activeIndex \?\? 0[\s\S]*\)/u);
	assert.match(extensionSource, /\(\(event\.key === "Tab" && !event\.shiftKey\) \|\| event\.key === "ArrowRight"\) &&[\s\S]*!controller\.hasVisibleList\(\)/u);
});
