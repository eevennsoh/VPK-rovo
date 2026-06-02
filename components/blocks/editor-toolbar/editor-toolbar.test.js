const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Editor toolbar is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("editor-toolbar", "Editor toolbar"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("editor-toolbar", "Editor toolbar"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ EditorToolbar \} from "@\/components\/blocks\/editor-toolbar";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"editor-toolbar": dynamic\(\(\) => import\("\.\/demos\/blocks\/editor-toolbar-demo"\)/u,
	);
});

test("Editor toolbar block exports the public component and props", () => {
	const indexSource = readProjectFile("components/blocks/editor-toolbar/index.ts");
	const componentSource = readProjectFile("components/blocks/editor-toolbar/components/editor-toolbar.tsx");

	assert.match(indexSource, /export \{ EditorToolbar \} from "\.\/components\/editor-toolbar";/u);
	assert.match(indexSource, /export type \{ EditorToolbarProps \} from "\.\/components\/editor-toolbar";/u);
	assert.match(componentSource, /export interface EditorToolbarProps/u);
	assert.match(componentSource, /export function EditorToolbar/u);
	assert.match(componentSource, /endSlot\?: ReactNode;/u);
	assert.match(componentSource, /onMarkdownFormat\?: \(kind: MarkdownFormatKind\) => void;/u);
});

test("RichTextEditorToolbar remains as a compatibility wrapper", () => {
	const richToolbarSource = readProjectFile("components/ui-custom/rich-text-editor/toolbar.tsx");

	assert.match(
		richToolbarSource,
		/import \{\s*EditorToolbar,\s*type EditorToolbarProps,?\s*\} from "@\/components\/blocks\/editor-toolbar";/u,
	);
	assert.match(richToolbarSource, /export type RichTextEditorToolbarProps = EditorToolbarProps;/u);
	assert.match(
		richToolbarSource,
		/export function RichTextEditorToolbar\([\s\S]*return <EditorToolbar \{\.\.\.props\} \/>;/u,
	);
	assert.match(richToolbarSource, /<EditorToolbar[\s\S]*controlsClassName="px-2 py-1"/u);
});

test("Editor toolbar demo renders the block directly with an end slot", () => {
	const pageSource = readProjectFile("components/blocks/editor-toolbar/page.tsx");
	const demoSource = readProjectFile("components/website/demos/blocks/editor-toolbar-demo.tsx");

	assert.match(pageSource, /import \{ EditorToolbar \} from "@\/components\/blocks\/editor-toolbar";/u);
	assert.match(pageSource, /createRichTextEditorExtensions\(\)/u);
	assert.match(pageSource, /<EditorToolbar[\s\S]*endSlot=\{/u);
	assert.match(demoSource, /import EditorToolbarPage from "@\/components\/blocks\/editor-toolbar\/page";/u);
	assert.match(demoSource, /<EditorToolbarPage \/>/u);
});

test("Editor toolbar demo exposes the Markdown source toggle", () => {
	const pageSource = readProjectFile("components/blocks/editor-toolbar/page.tsx");

	assert.match(pageSource, /useState\(false\)/u);
	assert.match(pageSource, /const \[markdownSource, setMarkdownSource\] = useState\(""\);/u);
	assert.match(pageSource, /applyMarkdownFormat/u);
	assert.match(pageSource, /function handleToggleMarkdownMode\(\): void/u);
	assert.match(pageSource, /isMarkdownMode=\{isMarkdownMode\}/u);
	assert.match(pageSource, /onToggleMarkdownMode=\{handleToggleMarkdownMode\}/u);
	assert.match(pageSource, /onMarkdownFormat=\{handleMarkdownFormat\}/u);
	assert.match(pageSource, /aria-label="Editor toolbar demo Markdown source"/u);
});
