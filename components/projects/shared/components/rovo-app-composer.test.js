const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPOSER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-composer.tsx"), "utf8");
const CARD_BODY_SOURCE = fs.readFileSync(path.join(__dirname, "composer-card-body.tsx"), "utf8");
const FLOATING_BODY_SOURCE = fs.readFileSync(path.join(__dirname, "composer-floating-body.tsx"), "utf8");
const FLOATING_COMPOSER_SOURCE = fs.readFileSync(path.join(__dirname, "floating-composer.tsx"), "utf8");
const SEND_CONTROLS_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-composer-send-controls.tsx"), "utf8");
const COMPOSER_EXTENSIONS_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/composer-extensions.ts"), "utf8");
const PROMPT_INPUT_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/prompt-input.tsx"), "utf8");
const RICH_TEXT_EDITOR_CSS = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/rich-text-editor.css"), "utf8");
const MENTION_EXTENSIONS_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/extensions.ts"), "utf8");
const MENTION_NODE_VIEW_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/mention-node-view.tsx"), "utf8");
const TAG_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui/tag.tsx"), "utf8");
const SKILL_TAG_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/skill-tag.tsx"), "utf8");

test("RovoAppComposer uses the shared edit context bar for open artifacts", () => {
	assert.match(COMPOSER_SOURCE, /import ChatContextBar from "@\/components\/projects\/sidebar-chat\/components\/chat-context-bar";/u);
	assert.match(COMPOSER_SOURCE, /variant: "edit" as const/u);
	assert.match(COMPOSER_SOURCE, /iconName: "artifact" as const/u);
	assert.match(COMPOSER_SOURCE, /<ChatContextBar context=\{artifactContextBar\} onDismiss=\{onDismissArtifactContext\} \/>/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /Editing:/u);
});

test("RovoAppComposer gates the floating-only send-now queued action behind onSendQueuedPromptNow", () => {
	// Card chrome (Rovo) does not pass onSendQueuedPromptNow, so the Send-now
	// button must only render when the prop is provided (Studio floating chrome).
	assert.match(COMPOSER_SOURCE, /\{onSendQueuedPromptNow \?/u);
	assert.match(COMPOSER_SOURCE, /aria-label="Send now"/u);
});

test("RovoAppComposer renders both card and floating chrome bodies", () => {
	assert.match(COMPOSER_SOURCE, /chrome === "floating"/u);
	assert.match(COMPOSER_SOURCE, /import \{ ComposerCardBody \} from "@\/components\/projects\/shared\/components\/composer-card-body";/u);
	assert.match(COMPOSER_SOURCE, /import \{ ComposerFloatingBody \} from "@\/components\/projects\/shared\/components\/composer-floating-body";/u);
	assert.match(COMPOSER_SOURCE, /<ComposerFloatingBody/u);
	assert.match(COMPOSER_SOURCE, /<ComposerCardBody/u);
});

test("RovoAppComposer does not render the ambient response gradient around the composer", () => {
	assert.doesNotMatch(COMPOSER_SOURCE, /RovoAppComposerResponseGradient/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /renderResponseGradient/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /pointer-events-none absolute inset-0 overflow-visible/u);
});

test("FloatingComposer restores compact mode and expands from compact-width measurement", () => {
	assert.match(FLOATING_COMPOSER_SOURCE, /const \[isExpanded, setIsExpanded\] = useState\(false\);/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /const compactFieldWidth = Math\.max\(/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /const getComposerPlainText = \(field: HTMLElement\): string => \{/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /querySelector<HTMLInputElement>\('\[data-slot="prompt-input-message"\]'\)/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /const probe = document\.createElement\("div"\);/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /probe\.textContent = fieldText;/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /setIsExpanded\(lineCount > 1\);/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /className="flex w-full flex-wrap items-center gap-2"/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /isExpanded \? "order-1 basis-full" : "order-2 flex-1"/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /className="order-3 ml-auto flex shrink-0 items-center gap-1"/u);
	assert.doesNotMatch(FLOATING_COMPOSER_SOURCE, /isMultiline/u);
});

test("RovoAppComposer forwards directory autocomplete control to both composer bodies", () => {
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteListVisible\?: boolean;/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteChange\?: \(state: DirectoryAutocompleteState \| null\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteControllerChange\?: \(controller: ComposerDirectoryAutocompleteController \| null\) => void;/u);
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteListVisible = false/u);
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteListVisible,/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteChange,/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteControllerChange,/u);
	assert.match(CARD_BODY_SOURCE, /<PromptInputTextarea[\s\S]*directoryAutocompleteListVisible=\{directoryAutocompleteListVisible\}[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}[\s\S]*onDirectoryAutocompleteControllerChange=\{onDirectoryAutocompleteControllerChange\}/u);
	assert.match(FLOATING_BODY_SOURCE, /<PromptInputTextarea[\s\S]*directoryAutocompleteListVisible=\{directoryAutocompleteListVisible\}[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}[\s\S]*onDirectoryAutocompleteControllerChange=\{onDirectoryAutocompleteControllerChange\}/u);
});

test("RovoAppComposer opts both shared bodies into visual trace auto-tagging", () => {
	assert.match(PROMPT_INPUT_SOURCE, /enableVisualTraceAutoTagging\?: boolean;/u);
	assert.match(PROMPT_INPUT_SOURCE, /enableVisualTraceAutoTagging = false/u);
	assert.match(CARD_BODY_SOURCE, /<PromptInputTextarea[\s\S]*enableVisualTraceAutoTagging[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}/u);
	assert.match(FLOATING_BODY_SOURCE, /<PromptInputTextarea[\s\S]*enableVisualTraceAutoTagging[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}/u);
});

test("PromptInputTextarea fades overflowing Tiptap composer text with the shared scroll mask", () => {
	assert.match(PROMPT_INPUT_SOURCE, /import \{ useHasVerticalOverflow \} from "@\/components\/hooks\/use-has-vertical-overflow";/u);
	assert.match(PROMPT_INPUT_SOURCE, /import \{ buildScrollMaskStyle \} from "@\/components\/visual\/scroll-mask\/lib";/u);
	assert.match(PROMPT_INPUT_SOURCE, /ref: composerScrollOverflowRef,[\s\S]*showBottomScrollMask: showComposerBottomScrollMask,[\s\S]*showTopScrollMask: showComposerTopScrollMask,[\s\S]*= useHasVerticalOverflow<HTMLElement>\(\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /buildScrollMaskStyle\(\{ fadeSize: "var\(--ds-space-200\)" \}\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /composerScrollOverflowRef\(editor\.view\.dom\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /<EditorContent[\s\S]*showComposerTopScrollMask[\s\S]*"scroll-mask-top"[\s\S]*showComposerBottomScrollMask[\s\S]*"scroll-mask-bottom"[\s\S]*style=\{[\s\S]*composerScrollMaskStyle/u);
});

test("visual trace auto-tagging flushes before submit and cancels stale delayed ranges", () => {
	assert.match(PROMPT_INPUT_SOURCE, /getDirectoryAutocompleteExactLabelMatches/u);
	assert.match(PROMPT_INPUT_SOURCE, /const VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS = 180;/u);
	assert.match(PROMPT_INPUT_SOURCE, /const VISUAL_TRACE_AUTO_TAG_CONVERT_MS = 940;/u);
	assert.match(PROMPT_INPUT_SOURCE, /const VISUAL_TRACE_AUTO_TAG_STAGGER_MS = 140;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /animation: prompt-input-trace-decoration-sweep 900ms cubic-bezier\(0\.4, 0, 0\.2, 1\) forwards;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-trace-decoration \{[\s\S]*display: inline-block;[\s\S]*margin: -2px -4px;[\s\S]*padding: 2px 4px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /filter: blur\(4px\);[\s\S]*opacity: 0\.74;[\s\S]*filter: blur\(1\.4px\);[\s\S]*filter: blur\(0\.35px\);[\s\S]*filter: blur\(0\);[\s\S]*opacity: 1;/u);
	assert.match(PROMPT_INPUT_SOURCE, /setTimeout\(\(\) => \{[\s\S]*runVisualTraceAutoTagging\(activeEditor, generation, immediate \? "document" : "block"\);[\s\S]*\}, delay\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /const delay = immediate \? 0 : VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS;/u);
	assert.match(PROMPT_INPUT_SOURCE, /suppressTrailingPrefixMatches: scope === "block"/u);
	assert.match(PROMPT_INPUT_SOURCE, /form\?\.addEventListener\("submit", handleSubmit, \{ capture: true \}\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /const handleSubmit = \(\) => \{[\s\S]*flushVisualTraceAutoTagging\(editor\);[\s\S]*\};/u);
	assert.match(PROMPT_INPUT_SOURCE, /flushVisualTraceAutoTagging\(\);[\s\S]*form\.requestSubmit\(\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /const field = form\.querySelector<HTMLInputElement>\([\s\S]*data-slot="prompt-input-message"[\s\S]*const text = field[\s\S]*\? field\.value[\s\S]*: usingProvider/u);
	assert.match(PROMPT_INPUT_SOURCE, /visualTraceGenerationRef\.current \+= 1;/u);
	assert.match(PROMPT_INPUT_SOURCE, /generation !== visualTraceGenerationRef\.current/u);
	assert.match(PROMPT_INPUT_SOURCE, /getVisualTraceAutoTagMatches\(activeEditor, "document"\)/u);
});

test("composer plain Enter submits before Tiptap can split the paragraph", () => {
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /Plain Enter[\s\S]*submits the host form/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /Shift\+Enter inserts a hard break/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /priority: 125,/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /external directory autocomplete plugin \(150\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /event\.key !== "Enter"/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /event\.shiftKey \|\| event\.isComposing/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /isSuggestionMenuOpen\(view\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /return onEnter \? onEnter\(view\) : false;/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /"Shift-Enter": insertHardBreak/u);
	assert.match(PROMPT_INPUT_SOURCE, /const submitButton = form\.querySelector\([\s\S]*button\[type="submit"\][\s\S]*if \(submitButton\?\.disabled\)/u);
	assert.match(SEND_CONTROLS_SOURCE, /key="dictation-active"[\s\S]*aria-hidden="true"[\s\S]*disabled[\s\S]*type="submit"/u);
});

test("visual trace auto-tagging uses mention nodes and hides autocomplete while tracing", () => {
	assert.match(PROMPT_INPUT_SOURCE, /\.\.\.getMentionNodeAttrs\(pendingMatch\.match\.mention\),[\s\S]*sourceText: pendingMatch\.expectedText,/u);
	assert.match(PROMPT_INPUT_SOURCE, /mentionType\.create\(mentionAttrs\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /const shouldInsertTrailingSpace = textAfter === undefined;/u);
	assert.match(PROMPT_INPUT_SOURCE, /const conversionOrder = \[\.\.\.pendingMatches\]\.sort\(\(a, b\) => b\.from - a\.from\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /editor\.state\.doc\.forEach\(\(block, blockOffset, blockIndex\) => \{[\s\S]*text \+= "\\n";/u);
	assert.match(PROMPT_INPUT_SOURCE, /traceText: string;/u);
	assert.match(PROMPT_INPUT_SOURCE, /traceText: block\.text\.slice\(match\.from, match\.to\),/u);
	assert.match(PROMPT_INPUT_SOURCE, /const from = getVisualTraceDocPosition\(block, match\.from\);[\s\S]*const to = getVisualTraceDocPosition\(block, match\.to\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /label: pendingMatch\.traceText/u);
	assert.match(PROMPT_INPUT_SOURCE, /label: match\.traceText/u);
	assert.match(PROMPT_INPUT_SOURCE, /interface VisualTraceAutoTagUndoSnapshot/u);
	assert.match(PROMPT_INPUT_SOURCE, /const visualTraceUndoSnapshotRef = useRef<VisualTraceAutoTagUndoSnapshot \| null>\(null\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /function[\s\S]*restoreVisualTraceUndoSnapshot|const restoreVisualTraceUndoSnapshot/u);
	assert.match(PROMPT_INPUT_SOURCE, /event\.key\.toLowerCase\(\) !== "z"/u);
	assert.match(PROMPT_INPUT_SOURCE, /restoreVisualTraceUndoSnapshot\(editor, snapshot\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /activeEditor\.commands\.setContent\(snapshot\.beforeJSON, \{[\s\S]*emitUpdate: false/u);
	assert.match(PROMPT_INPUT_SOURCE, /currentText\.includes\(VISUAL_TRACE_OBJECT_REPLACEMENT\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /currentText\.toLowerCase\(\) !== expectedText\.toLowerCase\(\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /visualTracePendingRef\.current \|\|[\s\S]*visualTraceApplyingRef\.current[\s\S]*setDirectoryAutocompleteState\(null\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /visualTraceImmediateUpdateRef\.current = true;/u);
	assert.match(PROMPT_INPUT_SOURCE, /flushVisualTraceAutoTagging\(editor\);[\s\S]*publishText\(serializeComposerDoc\(editor\), editor\.view\.dom, false\);/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-composer \.react-renderer\.node-mention \{[\s\S]*display: inline-flex;[\s\S]*height: 1\.25rem;[\s\S]*vertical-align: bottom;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-composer \.rich-text-mention-node \{[\s\S]*height: 1\.25rem;[\s\S]*line-height: 1\.25rem;[\s\S]*vertical-align: bottom;/u);
});

test("composer trace auto-tagging keeps native undo history available", () => {
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /import \{ history, redo, undo \} from "@tiptap\/pm\/history";/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /import \{ keymap \} from "@tiptap\/pm\/keymap";/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /function createComposerHistoryExtension\(\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /textBetween\(decoration\.from, decoration\.to, "\\n", "\\uFFFC"\)[\s\S]*\.toLowerCase\(\) === decoration\.label\.toLowerCase\(\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /history\(\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /"Mod-z": undo/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /"Shift-Mod-z": redo/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /createComposerHistoryExtension\(\),[\s\S]*createRichTextMentionExtension/u);
});

test("auto-tagged tokens carry sourceText and a restore command on the mention node", () => {
	// The exact typed text is stored on the node so a revert restores it precisely,
	// and its presence is what scopes the revert affordances to auto-tagged tokens.
	assert.match(MENTION_EXTENSIONS_SOURCE, /sourceText: \{[\s\S]*parseHTML:[\s\S]*data-source-text[\s\S]*renderHTML:[\s\S]*data-source-text/u);
	// Per-draft dismissal registry so reverted tokens are not re-converted.
	assert.match(MENTION_EXTENSIONS_SOURCE, /addStorage\(\): RichTextMentionStorage \{[\s\S]*dismissedAutoTags: new Set<string>\(\),/u);
	// Shared restore command: replace node with sourceText and record the dismissal.
	assert.match(MENTION_EXTENSIONS_SOURCE, /restoreAutoTaggedMention:[\s\S]*\(pos: number\) =>/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /node\.type\.name !== "mention"/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /typeof sourceText !== "string" \|\| !sourceText/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /tr\.replaceWith\(from, to, state\.schema\.text\(sourceText\)\)/u);
	// The revert + dismissal side effects are gated behind the dispatch guard so a
	// dry-run (editor.can()) stays side-effect-free.
	assert.match(MENTION_EXTENSIONS_SOURCE, /if \(dispatch\) \{[\s\S]*this\.storage\.dismissedAutoTags\.add\(sourceText\.toLowerCase\(\)\);[\s\S]*\}/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /restoreAutoTaggedMention: \(pos: number\) => ReturnType;/u);
	// Storage is typed via the exported interface, not a loose cast.
	assert.match(MENTION_EXTENSIONS_SOURCE, /addStorage\(\): RichTextMentionStorage/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /export interface RichTextMentionStorage/u);
});

test("Backspace next to an auto-tagged token reverts it, including across a trailing space", () => {
	// Scoped to auto-tagged nodes (sourceText present); deliberate mentions fall
	// through to the mention extension's default delete-and-reinsert-"@".
	assert.match(PROMPT_INPUT_SOURCE, /event\.key === "Backspace"/u);
	assert.match(PROMPT_INPUT_SOURCE, /function getBackspaceRevertPos\(editor: Editor\): number \| null/u);
	assert.match(PROMPT_INPUT_SOURCE, /function isAutoTaggedMention\(/u);
	// Caret directly after the chip.
	assert.match(PROMPT_INPUT_SOURCE, /if \(isAutoTaggedMention\(before\)\) \{[\s\S]*return \$from\.pos - before!\.nodeSize;/u);
	// Caret after the conversion-inserted trailing space (treat lone space as adjacency).
	assert.match(PROMPT_INPUT_SOURCE, /before\?\.isText && before\.text === " "/u);
	assert.match(PROMPT_INPUT_SOURCE, /editor\.commands\.restoreAutoTaggedMention\(backspaceRevertPos\)/u);
});

test("auto-tagger skips and clears reverted occurrences for the draft", () => {
	assert.match(PROMPT_INPUT_SOURCE, /function getDismissedAutoTags\(editor: Editor\): Set<string> \| undefined/u);
	// Typed via the exported storage interface rather than an inline shape.
	assert.match(PROMPT_INPUT_SOURCE, /as unknown as \{ mention\?: RichTextMentionStorage \}/u);
	assert.match(PROMPT_INPUT_SOURCE, /const dismissed = getDismissedAutoTags\(activeEditor\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /!dismissed\?\.has\(block\.text\.slice\(match\.from, match\.to\)\.toLowerCase\(\)\)/u);
	// Cleared wherever the draft resets so a fresh message can re-tag.
	assert.match(PROMPT_INPUT_SOURCE, /getDismissedAutoTags\(editor\)\?\.clear\(\);/u);
});

test("auto-tagged chip exposes a swap-back-to-text overlay action", () => {
	assert.match(MENTION_NODE_VIEW_SOURCE, /import SwapIcon from "@atlaskit\/icon-lab\/core\/swap";/u);
	assert.match(MENTION_NODE_VIEW_SOURCE, /const isAutoTagged = Boolean\(attrs\.sourceText\);/u);
	assert.match(MENTION_NODE_VIEW_SOURCE, /const overlayAction: TagOverlayAction \| undefined = isAutoTagged/u);
	assert.match(MENTION_NODE_VIEW_SOURCE, /icon: <SwapIcon label="" size="small" \/>/u);
	assert.match(MENTION_NODE_VIEW_SOURCE, /tooltip: "Switch back to text"/u);
	assert.match(MENTION_NODE_VIEW_SOURCE, /editor\.commands\.restoreAutoTaggedMention\(pos\)/u);
	// Passed to both tag primitives via the dedicated action prop (not onRemove).
	assert.match(MENTION_NODE_VIEW_SOURCE, /overlayAction=\{overlayAction\}/u);
});

test("Tag and SkillTag expose a distinct overlayAction (separate from remove semantics)", () => {
	for (const source of [TAG_SOURCE, SKILL_TAG_SOURCE]) {
		assert.match(source, /overlayAction\?: TagOverlayAction;/u);
		// Reuses the shared tooltip wrapper instead of re-implementing it.
		assert.match(source, /withTooltip\(/u);
		// The action gets its own data-slot so "remove" selectors never match it.
		assert.match(source, /overlay-action/u);
	}
	// The shared helper lives in the tooltip primitive module.
	assert.match(TAG_SOURCE, /import \{ withTooltip \} from "@\/components\/ui\/tooltip";/u);
	assert.match(TAG_SOURCE, /interface TagOverlayAction/u);
});

test("RovoAppComposer threads dictation controls and text snapshots through both composer bodies", () => {
	assert.match(COMPOSER_SOURCE, /dictationState\?: RovoComposerDictationState;/u);
	assert.match(COMPOSER_SOURCE, /dictationTranscriptPreview\?: string \| null;/u);
	assert.match(COMPOSER_SOURCE, /realtimeVoiceState\?: "idle" \| "connecting" \| "listening" \| "speaking";/u);
	assert.match(COMPOSER_SOURCE, /onStartDictation\?: \(\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onStopDictation\?: \(\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onTextChange\?: \(value: string\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onTextChange\?\.\(controller\.textInput\.value\);/u);
	for (const source of [CARD_BODY_SOURCE, FLOATING_BODY_SOURCE]) {
		assert.match(source, /dictationState/u);
		assert.match(source, /dictationTranscriptPreview/u);
		assert.match(source, /realtimeVoiceState/u);
		assert.match(source, /onStartDictation/u);
		assert.match(source, /onStopDictation/u);
	}
});
