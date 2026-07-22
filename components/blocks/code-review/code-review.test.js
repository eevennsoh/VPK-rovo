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

test("code review diff view preserves theme token contracts", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);

	assert.match(diffView, /github-light/u);
	assert.match(diffView, /github-dark/u);
});

test("code review diff matches its top inset to the inline hunk inset", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);

	assert.match(diffView, /\[data-diffs-header\] ~ \[data-diff\] \[data-code\]/u);
	assert.match(
		diffView,
		/padding-top: var\(--diffs-gap-inline, var\(--diffs-gap-fallback\)\);/u,
	);
	assert.match(diffView, /unsafeCSS: DIFF_TOP_INSET_CSS/u);
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
	assert.match(diffView, /onLineNumberClick: \(\{ annotationSide, lineNumber \}\)/u);
	assert.match(diffView, /renderAnnotation=\{\(\{ metadata \}\) => \(/u);
	assert.match(diffView, /renderGutterUtility=\{\(getHoveredLine\) => \(/u);
	assert.match(annotation, /aria-label="Add inline comment"/u);
	assert.match(annotation, /event\.stopPropagation\(\)/u);
	assert.match(annotation, /event\.key === "Enter" && \(event\.metaKey \|\| event\.ctrlKey\)/u);
	assert.match(annotation, /event\.key === "Escape"/u);
	assert.match(annotation, /disabled=\{!canCommit\}/u);
	assert.match(annotation, />Local comment</u);
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
	assert.match(rail, /submitText: "Address these inline review comments\."/u);
	assert.match(rail, /onSubmitted: onRemoveAllComments/u);
	assert.match(rail, /contextDescription: inlineCommentsContext \|\| undefined/u);
	assert.match(chip, /comments\.length === 1 \? "comment" : "comments"/u);
	assert.match(chip, /Inline review comments/u);
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
	assert.match(source, /<RovoCanvas[\s\S]*primaryActionLabel="Create pull request"/u);
	assert.match(source, /title=\{`\$\{workItem\.key\}: \$\{workItem\.title\}`\}/u);
	assert.match(header, /label=\{`\$\{workItem\.key\}: \$\{workItem\.title\}`\}/u);
	assert.match(source, /id: "code"/u);
	assert.match(source, /files\.reduce\(/u);
	assert.match(
		source,
		/headerStart=\{<CodeReviewCanvasHeader additions=\{additions\} deletions=\{deletions\} workItem=\{workItem\} \/>\}/u,
	);
	assert.match(source, /rightRail=\{[\s\S]*<CodeReviewCanvasRightRail/u);
	assert.match(rail, /<ChatPanel[\s\S]*hideAiDisclaimer/u);
	assert.match(rail, /<RovoChatProvider[\s\S]*autoSelectAgentId=\{CODE_REVIEWER_AGENT_ID\}/u);
	assert.match(rail, /agentProfiles=\{\[CODE_REVIEWER_AGENT\]\}/u);
	assert.match(rail, /<ChatPanel[\s\S]*headerVariant="minimal"/u);
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

	assert.match(explorer, /from "@\/components\/ui-custom\/file-tree";/u);
	assert.match(explorer, /<FileTreeFolder aria-label="Changed files" name="CHANGED FILES" path="changed-files">/u);
	assert.match(explorer, /files\.some\(\(file\) => file\.id === path\)/u);
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

test("Code Review polish contracts hide duplicate headers and name explorer rows", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);
	const explorer = readProjectFile(
		"components/blocks/code-review/components/editor/editor-explorer.tsx",
	);

	assert.match(diffView, /renderCustomHeader=\{\(\) => null\}/u);
	assert.match(explorer, /aria-label=\{node\.name\}/u);
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
	assert.match(codeReview, /Create draft PR/u);
	assert.match(codeReview, /Commit &amp; Push/u);

	// The shared header must NOT hardcode pull-request actions, so report and
	// dashboard canvases (rfp report, sidebar-chat artifacts) never advertise
	// capabilities they lack. It renders the split button only when a caller
	// supplies primaryActionMenu, and a plain button otherwise.
	assert.doesNotMatch(header, /Create draft PR/u);
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
