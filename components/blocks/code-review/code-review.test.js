const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("code review file filters expose the expected pure contracts", () => {
	const source = readProjectFile("components/blocks/code-review/lib/filter-files.ts");

	assert.match(source, /export function filterBySearch/u);
	assert.match(source, /export function filterByChangeSet/u);
	assert.match(source, /query\.trim\(\)\.toLowerCase\(\)/u);
	assert.match(source, /file\.path\.toLowerCase\(\)\.includes/u);
	assert.match(source, /if \(changeSet === null\) \{\s*return files;/u);
	assert.match(source, /files\.filter\(\(file\) => includedIds\.has\(file\.id\)\)/u);
});

test("code review fixtures preserve the design contracts", () => {
	const workItem = readProjectFile("components/blocks/code-review/data/work-item.ts");
	const changedFiles = readProjectFile("components/blocks/code-review/data/changed-files.ts");
	const explorerTree = readProjectFile("components/blocks/code-review/data/explorer-tree.ts");

	assert.match(workItem, /TWC-109/u);
	assert.match(workItem, /vitafleet-frontend/u);
	assert.match(changedFiles, /ipc\.mp\.test\.ts/u);
	assert.match(explorerTree, /ipc\.mp\.test\.ts/u);
});

test("code review diff components preserve theme and stat token contracts", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);
	const diffStat = readProjectFile(
		"components/blocks/code-review/components/diff-stat.tsx",
	);

	assert.match(diffView, /github-light/u);
	assert.match(diffView, /github-dark/u);
	assert.match(diffStat, /text-text-accent-lime/u);
	assert.match(diffStat, /text-text-accent-red/u);
});

test("code review orchestrator preserves independent default layouts", () => {
	const source = readProjectFile(
		"components/blocks/code-review/components/code-review.tsx",
	);

	assert.match(source, /useState<DiffLayout>\("unified"\)/u);
	assert.match(source, /useState<DiffLayout>\("split"\)/u);
});

test("code review public barrel and demo expose the composition root", () => {
	const index = readProjectFile("components/blocks/code-review/index.ts");
	const page = readProjectFile("components/blocks/code-review/page.tsx");

	assert.match(index, /export \{ CodeReview \} from "\.\/components\/code-review";/u);
	assert.match(page, /<CodeReview \/>/u);
});

test("code review summary and editor retain interaction contracts", () => {
	const accordion = readProjectFile(
		"components/blocks/code-review/components/summary/summary-file-accordion.tsx",
	);
	const explorer = readProjectFile(
		"components/blocks/code-review/components/editor/editor-explorer.tsx",
	);

	assert.match(accordion, /aria-expanded=\{isOpen\}/u);
	assert.match(explorer, /from "@\/components\/ui-custom\/file-tree";/u);
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

test("Code Review chat preserves scripted copy and inert composer controls", () => {
	const chatScript = readProjectFile("components/blocks/code-review/data/chat-script.ts");
	const composer = readProjectFile(
		"components/blocks/code-review/components/chat/chat-composer.tsx",
	);

	assert.match(chatScript, /Uses AI\. Verify results\./u);
	assert.match(chatScript, /acceptance criteria/u);
	assert.match(composer, /aria-label=/u);
	assert.match(composer, /type="button"/u);
});

test("Code Review polish contracts hide duplicate headers and name explorer rows", () => {
	const diffView = readProjectFile(
		"components/blocks/code-review/components/diff-file-view.tsx",
	);
	const accordion = readProjectFile(
		"components/blocks/code-review/components/summary/summary-file-accordion.tsx",
	);
	const explorer = readProjectFile(
		"components/blocks/code-review/components/editor/editor-explorer.tsx",
	);

	assert.match(diffView, /renderCustomHeader=\{\(\) => null\}/u);
	assert.match(accordion, /flex-1 truncate text-left font-mono/u);
	assert.match(explorer, /aria-label=\{node\.name\}/u);
});
