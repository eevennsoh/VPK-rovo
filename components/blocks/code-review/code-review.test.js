const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("code review fixtures preserve the design contracts", () => {
	const workItem = readProjectFile("components/blocks/code-review/data/work-item.ts");
	const changedFiles = readProjectFile("components/blocks/code-review/data/changed-files.ts");
	const explorerTree = readProjectFile("components/blocks/code-review/data/explorer-tree.ts");

	assert.match(workItem, /TWC-109/u);
	assert.match(workItem, /acme-corp\/rfp-response-platform/u);
	assert.match(changedFiles, /ipc\.mp\.test\.ts/u);
	assert.match(explorerTree, /ipc\.mp\.test\.ts/u);
});

test("code review explorer-backed files stay selectable", () => {
	const explorer = readProjectFile(
		"components/blocks/code-review/components/editor/editor-explorer.tsx",
	);

	assert.match(explorer, /file\.explorerPath/u);
	assert.match(explorer, /disabled: false/u);
	assert.match(explorer, /onFileSelect\(fileId\)/u);
});

test("code review editor starts directly with the file diff", () => {
	const editorDiff = readProjectFile(
		"components/blocks/code-review/components/editor/editor-diff.tsx",
	);

	assert.match(editorDiff, /file\.hunkHeader \? \(/u);
	assert.doesNotMatch(editorDiff, /\?\? "Diff"/u);
	assert.match(editorDiff, /\{file\.hunkHeader\}/u);
});

test("code review editor shows the selected file change counts", () => {
	const editorDiff = readProjectFile(
		"components/blocks/code-review/components/editor/editor-diff.tsx",
	);

	assert.match(editorDiff, /file\.additions\} additions, \$\{file\.deletions\} deletions/u);
	assert.match(editorDiff, />\+\{file\.additions\}</u);
	assert.match(editorDiff, />-\{file\.deletions\}</u);
	assert.match(editorDiff, /className="ml-auto flex shrink-0 items-center gap-1 text-xs leading-4"/u);
	assert.match(editorDiff, /text-text-danger/u);
	assert.match(editorDiff, /text-text-success/u);
});

test("code review scrollbars reveal on interaction instead of at rest", () => {
	const editorDiff = readProjectFile(
		"components/blocks/code-review/components/editor/editor-diff.tsx",
	);
	const explorer = readProjectFile(
		"components/blocks/code-review/components/editor/editor-explorer.tsx",
	);

	for (const source of [editorDiff, explorer]) {
		assert.match(source, /\[data-slot=scroll-area-scrollbar\]\]:opacity-0/u);
		assert.match(source, /hover:\[&_\[data-slot=scroll-area-scrollbar\]\]:opacity-100/u);
		assert.match(source, /focus-within:\[&_\[data-slot=scroll-area-scrollbar\]\]:opacity-100/u);
	}
});

test("code review diff view preserves theme token contracts", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);

	assert.match(diffView, /github-light/u);
	assert.match(diffView, /github-dark/u);
});

test("code review diff restores the top inset above hunk content", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);

	assert.match(diffView, /DIFF_UNSAFE_CSS/u);
	assert.match(diffView, /diffs-gap-inline/u);
	assert.match(diffView, /unsafeCSS: DIFF_UNSAFE_CSS/u);
});

test("code review uses collapsible line-info hunk separators", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);

	assert.match(diffView, /hunkSeparators: "line-info"/u);
	assert.match(diffView, /collapsedContextThreshold: 6/u);
});

test("code review extends Pierre gutter utilities and line annotations", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);
	const annotation = readProjectFile(
		"components/blocks/code-review/components/inline-comment-annotation.tsx",
	);

	assert.match(diffView, /<MultiFileDiff<InlineCommentAnnotationMetadata>/u);
	assert.match(diffView, /lineAnnotations=\{lineAnnotations\}/u);
	assert.match(diffView, /enableGutterUtility: true/u);
	assert.match(diffView, /lineHoverHighlight: "both"/u);
	assert.doesNotMatch(diffView, /onLineNumberClick/u);
	assert.match(diffView, /renderAnnotation=\{\(\{ metadata \}\) => \(/u);
	assert.match(
		diffView,
		/key=\{metadata\.kind === "draft" \? metadata\.draft\.id : metadata\.comment\.id\}/u,
		"Pierre indexes annotation slots, so the rendered editor needs its own stable comment identity",
	);
	assert.match(diffView, /renderGutterUtility=\{\(getHoveredLine\) => \(/u);
	assert.match(annotation, /aria-label="Add inline comment"/u);
	assert.match(annotation, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/u);
	assert.match(
		diffView,
		/\[data-column-number\]:has\(\[data-gutter-utility-slot\]\) \[data-line-number-content\]/u,
	);
	assert.match(
		annotation,
		/className="relative z-10 mr-2 size-5 rounded-sm border-0 bg-surface-overlay p-0 text-icon-brand shadow-2xl hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed"/u,
	);
	assert.match(annotation, /event\.stopPropagation\(\)/u);
	assert.match(annotation, /event\.key === "Escape"/u);
	assert.match(annotation, /disabled=\{!canCommit\}/u);
	assert.match(annotation, /className="min-w-0 bg-surface-raised px-3 pb-3 pt-2 font-sans text-text"/u);
	assert.match(annotation, /className="mb-2 text-xs font-semibold text-text-subtlest"/u);
	assert.match(annotation, /Comment on line \{lineNumber\}/u);
	assert.match(annotation, /aria-label=\{ariaLabel\}/u);
	assert.match(annotation, /<PromptInputTextarea/u);
	assert.match(annotation, /className="min-h-\[101px\] w-full rounded-xl/u);
	assert.doesNotMatch(annotation, /min-h-20/u);
	assert.match(annotation, /enableDirectoryAutocomplete=\{false\}/u);
	assert.match(annotation, /enableSuggestionMenus=\{false\}/u);
	assert.match(annotation, /placeholder=""/u);
	assert.match(annotation, /<Button[\s\S]*type="button"[\s\S]*Cancel/u);
	assert.match(annotation, /<Button disabled=\{!canCommit\} type="submit" variant="outline">[\s\S]*Comment/u);
	assert.match(annotation, /const isEditing = body !== comment\.body;/u);
	assert.match(annotation, /editorKey=\{comment\.body\}/u);
	assert.match(annotation, /key=\{editorKey\}/u);
	assert.match(annotation, /isEditing \? \([\s\S]*Cancel[\s\S]*Update[\s\S]*: \([\s\S]*Delete/u);
	assert.match(annotation, /<Button disabled=\{!canUpdate\} type="submit" variant="outline">[\s\S]*Update/u);
	assert.match(annotation, /onClick=\{\(\) => onDelete\(comment\.id\)\}[\s\S]*variant="outline"[\s\S]*Delete/u);
	assert.doesNotMatch(annotation, /size="compact"/u);
	assert.match(annotation, /aria-label=\{`Delete comment on/u);
});

test("code review owns comment state across files and diff layouts", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);

	assert.match(source, /useState\(EMPTY_INLINE_COMMENT_STATE\)/u);
	assert.match(source, /comments=\{inlineComments\.comments\}/u);
	assert.match(source, /drafts=\{inlineComments\.drafts\}/u);
	assert.match(source, /removeAllInlineComments/u);
	assert.match(source, /updateInlineComment/u);
	assert.match(source, /updateInlineCommentDraft/u);
});

test("code review sends committed comments as one-turn composer context", () => {
	const rail = readProjectFile(
		"components/blocks/code-review/components/code-review-canvas-right-rail.tsx",
	);
	const chip = readProjectFile(
		"components/blocks/code-review/components/inline-comments-composer-chip.tsx",
	);

	assert.match(rail, /serializeInlineCommentsContext\(workItem, comments\)/u);
	assert.match(rail, /composerInputContext=\{hasInlineComments \? \{/u);
	assert.match(rail, /const INLINE_REVIEW_PROMPT = "Address these inline review comments\.";/u);
	assert.match(rail, /onSubmitStart: handleSubmitted/u);
	assert.match(rail, /onReviewSubmit\?\.\(\{ comments, prompt: INLINE_REVIEW_PROMPT \}\);/u);
	assert.match(rail, /onRemoveAllComments\(\);/u);
	assert.match(rail, /contextDescription: inlineCommentsContext \|\| undefined/u);
	assert.match(chip, /comments\.length === 1 \? "comment" : "comments"/u);
	assert.doesNotMatch(chip, /PopoverTitle|Inline review comments/u);
	assert.match(chip, /Line \{comment\.lineNumber\}/u);
	assert.doesNotMatch(chip, /New|Old|side · line/u);
	assert.match(chip, /Remove all inline comments/u);
});

test("code review orchestrator defaults the editor to unified layout", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);

	assert.match(source, /useState<DiffLayout>\("unified"\)/u);
});

test("Code Review composes its editor into a Canvas with the shared Code Reviewer rail", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);
	const header = readProjectFile(
		"components/blocks/code-review/components/code-review-canvas-header.tsx",
	);
	const rail = readProjectFile(
		"components/blocks/code-review/components/code-review-canvas-right-rail.tsx",
	);

	assert.match(source, /import \{ RovoCanvas \} from "@\/components\/blocks\/rovo-canvas\/page";/u);
	assert.match(source, /primaryActionLabel = "Create pull request"/u);
	assert.match(source, /<RovoCanvas[\s\S]*primaryActionLabel=\{primaryActionLabel\}/u);
	assert.match(source, /onPrimaryAction=\{onPrimaryAction\}/u);
	assert.match(source, /primaryActionMenu=\{showPrimaryActionMenu \? \(/u);
	assert.match(source, /title=\{`\$\{workItem\.key\}: \$\{workItem\.title\}`\}/u);
	assert.match(header, /label=\{`\$\{workItem\.key\}: \$\{workItem\.title\}`\}/u);
	assert.match(source, /id: "code"/u);
	assert.match(source, /files\.reduce\(/u);
	assert.match(
		source,
		/headerStart=\{<CodeReviewCanvasHeader additions=\{additions\} deletions=\{deletions\} workItem=\{workItem\} \/>\}/u,
	);
	assert.match(source, /rightRail=\{[\s\S]*<CodeReviewCanvasRightRail/u);
	assert.match(source, /agentProfile\?: RovoAgentProfile/u);
	assert.match(source, /agentProfile=\{agentProfile\}/u);
	assert.match(source, /hideComposerSourceAndModelControls\?: boolean/u);
	assert.match(source, /hideComposerSourceAndModelControls=\{hideComposerSourceAndModelControls\}/u);
	assert.doesNotMatch(rail, /hideAiDisclaimer/u);
	assert.match(rail, /agentProfile = CODE_REVIEWER_AGENT/u);
	assert.match(rail, /<RovoChatProvider[\s\S]*autoSelectAgentId=\{agentProfile\.id\}/u);
	assert.match(rail, /agentProfiles=\{\[agentProfile\]\}/u);
	assert.match(rail, /centerEmptyGreeting/u);
	assert.match(rail, /hideComposerSourceAndModelControls=\{hideComposerSourceAndModelControls\}/u);
	assert.match(rail, /showAgentBackButton=\{false\}/u);
	assert.match(rail, /showAgentSelector=\{false\}/u);
	assert.match(rail, /<ChatPanel[\s\S]*headerVariant="minimal"/u);
	assert.match(rail, /headerEndAction=\{\([\s\S]*aria-label=\{`Open \$\{agentProfile\.name\}`\}[\s\S]*LinkExternalIcon/u);
});

test("Code Review omits the dismiss placeholder for its persistent chat context", () => {
	const rail = readProjectFile(
		"components/blocks/code-review/components/code-review-canvas-right-rail.tsx",
	);

	assert.match(rail, /iconName: "branch"/u);
	assert.match(rail, /label: workItem\.localBranchName/u);
	assert.match(rail, /signature: `code-review-branch:\$\{workItem\.localBranchName\}`/u);
	assert.match(rail, /chatContextBar=\{\{[\s\S]*showDismissPlaceholder: false/u);
});

test("Code Review identifies the local device above its attached composer", () => {
	const rail = readProjectFile(
		"components/blocks/code-review/components/code-review-canvas-right-rail.tsx",
	);

	assert.match(rail, /import DevicesIcon from "@atlaskit\/icon\/core\/devices";/u);
	assert.match(rail, /import \{ IconTile \} from "@\/components\/ui\/icon-tile";/u);
	assert.match(
		rail,
		/composerSurfaceHeader=\{\([\s\S]*<IconTile[\s\S]*as="span"[\s\S]*className="text-icon-subtle"[\s\S]*icon=\{<DevicesIcon label="" size="small" \/>\}[\s\S]*iconSize="small"[\s\S]*size="xxsmall"[\s\S]*variant="transparent"[\s\S]*Local · Carl’s MacBook Pro/u,
	);
});

test("Code Review no longer owns a bespoke chat implementation", () => {
	const removedPaths = [
		"components/blocks/code-review/components/chat/chat-panel.tsx",
		"components/blocks/code-review/components/chat/chat-composer.tsx",
		"components/blocks/code-review/data/chat-script.ts",
	];

	for (const removedPath of removedPaths) {
		assert.equal(
			fs.existsSync(path.join(process.cwd(), removedPath)),
			false,
			`expected ${removedPath} to be removed`,
		);
	}
});

test("code review public barrel and demo expose the composition root", () => {
	const index = readProjectFile("components/blocks/code-review/index.ts");
	const page = readProjectFile("components/blocks/code-review/page.tsx");

	assert.match(index, /export \{ CodeReview \} from "\.\/components\/code-review";/u);
	// The standalone block page opens the review canvas by default (the launcher
	// button is only the reopen-after-close affordance).
	assert.match(page, /<CodeReview defaultOpen \/>/u);
});

test("code review editor retains interaction contracts", () => {
	const explorer = readProjectFile(
		"components/blocks/code-review/components/editor/editor-explorer.tsx",
	);

	assert.match(explorer, /from "@\/components\/ui-custom\/file-tree-2";/u);
	assert.match(explorer, /<FileTree2/u);
	assert.match(explorer, /const changedFilesRootPath = `\$\{rootPath\}\/CHANGED FILES`;/u);
	assert.match(explorer, /fileIdsByPath\.get\(path\)/u);
	assert.doesNotMatch(explorer, /FileTreeFile|FileTreeFolder/u);
});

test("Code Review is registered as a website block in both catalog files", () => {
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\(\s*"code-review",\s*"Code Review"\s*\)/u,
	);
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\(\s*"code-review",\s*"Code Review"\s*\)/u,
	);
});

test("Code Review detail is imported and mapped in the blocks details barrel", () => {
	const source = readProjectFile("app/data/details/blocks.ts");

	assert.match(
		source,
		/import\s*\{\s*CODE_REVIEW_DETAIL\s*\}\s*from\s*"\.\/blocks\/code-review";/u,
	);
	assert.match(source, /"code-review"\s*:\s*CODE_REVIEW_DETAIL\s*,/u);
});

test("Code Review demo is registered as an ssr:false dynamic import", () => {
	const registry = readProjectFile("components/website/registry/blocks.ts");

	assert.match(
		registry,
		/"code-review"\s*:\s*dynamic\(\s*\(\)\s*=>\s*import\(\s*"\.\.\/demos\/blocks\/code-review-demo"\s*\)\s*,\s*\{\s*ssr\s*:\s*false\s*,?\s*\}\s*\)/u,
	);
});

test("Code Review demo wrapper renders the block page", () => {
	const demo = readProjectFile(
		"components/website/demos/blocks/code-review-demo.tsx",
	);

	assert.match(demo, /import Page from "@\/components\/blocks\/code-review\/page";/u);
	assert.match(demo, /return <Page \/>;/u);
});

test("Code Review polish contracts hide duplicate headers and label the shared explorer", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);
	const explorer = readProjectFile(
		"components/blocks/code-review/components/editor/editor-explorer.tsx",
	);

	assert.match(diffView, /renderCustomHeader=\{\(\) => null\}/u);
	assert.match(explorer, /aria-label="Code review files"/u);
	assert.match(explorer, /hover:\[&_\[data-slot=scroll-area-scrollbar\]\]:opacity-100/u);
	assert.match(explorer, /\[&_\[data-slot=scroll-area-scrollbar\]\]:opacity-0/u);
	assert.match(explorer, /"package\.json": "renamed"/u);
	assert.match(explorer, /"node_modules": "ignored"/u);
	assert.match(explorer, /explorerRootLabel = CODE_REVIEW_ROOT_PATH/u);
	assert.match(explorer, /defaultExpandedPaths=\{defaultExpandedPaths\}/u);
});

test("Code Review moves its shared artefact identity into the canvas header", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);
	const header = readProjectFile(
		"components/blocks/code-review/components/code-review-canvas-header.tsx",
	);
	const canvas = readProjectFile(
		"components/blocks/rovo-canvas/components/rovo-canvas.tsx",
	);

	assert.match(source, /showArtefactIdentity=\{false\}/u);
	assert.match(header, /RovoCanvasArtefactIdentity/u);
	assert.match(header, /icon=\{<TaskIcon label="" color=\{token\("color\.icon\.brand"\)\} \/>\}/u);
	assert.match(header, /variant="blue"/u);
	assert.match(
		header,
		/<span className="shrink-0 text-text">\{workItem\.branchName\}<\/span>[\s\S]*<MetadataPathValue path=\{workItem\.localBranchName\} \/>/u,
	);
	assert.doesNotMatch(header, /AngleBracketsIcon/u);
	assert.doesNotMatch(header, /variant="blueBold"/u);
	assert.doesNotMatch(header, /Lozenge/u);
	assert.doesNotMatch(header, /workItem\.environment/u);
	assert.match(canvas, /export function RovoCanvasArtefactIdentity/u);
	assert.match(canvas, /showArtefactIdentity = true/u);
	assert.match(canvas, /showArtefactIdentity \? \(/u);
	assert.match(canvas, /flex size-full min-h-0 flex-col gap-0/u);
});

test("Code Review provides a manual launch control after the canvas closes", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);

	assert.match(source, /const \[internalOpen, setInternalOpen\] = useState\(defaultOpen\);/u);
	assert.match(source, /const isControlled = open !== undefined;/u);
	assert.match(source, /!isControlled && !isCanvasOpen \? \(/u);
	assert.match(source, /<Button onClick=\{\(\) => setCanvasOpen\(true\)\}>/u);
	assert.match(source, /Open code review/u);
});

test("Code Review supports a caller-owned launch trigger", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);

	assert.match(source, /open\?: boolean;/u);
	assert.match(source, /onOpenChange\?: \(open: boolean\) => void;/u);
	assert.match(source, /const isCanvasOpen = open \?\? internalOpen;/u);
	assert.match(source, /onOpenChange\?\.\(nextOpen\);/u);
});

test("Code Review owns its pull-request actions; the shared canvas header does not", () => {
	const codeReview = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);
	const header = readProjectFile(
		"components/blocks/rovo-canvas/components/rovo-canvas-header.tsx",
	);

	// The code-review caller supplies the PR-specific split-menu items.
	assert.match(codeReview, /primaryActionMenu=\{/u);
	assert.match(codeReview, /Create draft pull request/u);
	assert.match(codeReview, /Commit &amp; Push/u);

	// The shared header must NOT hardcode pull-request actions, so report and
	// dashboard canvases (rfp report, sidebar-chat artifacts) never advertise
	// capabilities they lack. It renders the split button only when a caller
	// supplies primaryActionMenu, and a plain button otherwise.
	assert.doesNotMatch(header, /Create draft pull request/u);
	assert.doesNotMatch(header, /Commit &amp; Push/u);
	assert.match(header, /primaryActionMenu \? \(/u);
});

test("Code Review composition no longer renders a code summary screen", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);

	assert.doesNotMatch(source, /SummaryPanel/u);
	assert.doesNotMatch(source, /"summary" \| "editor"/u);
	assert.match(source, /<EditorPanel/u);
});

test("Code Review summary screen files are removed", () => {
	const removedPaths = [
		"components/blocks/code-review/components/summary/summary-panel.tsx",
		"components/blocks/code-review/components/summary/summary-rail.tsx",
		"components/blocks/code-review/components/summary/summary-toolbar.tsx",
		"components/blocks/code-review/components/summary/summary-file-accordion.tsx",
		"components/blocks/code-review/components/summary/summary-change-card.tsx",
		"components/blocks/code-review/components/diff-stat.tsx",
		"components/blocks/code-review/data/change-sets.ts",
		"components/blocks/code-review/lib/filter-files.ts",
	];

	for (const removedPath of removedPaths) {
		assert.equal(
			fs.existsSync(path.join(process.cwd(), removedPath)),
			false,
			`expected ${removedPath} to be removed`,
		);
	}
});
