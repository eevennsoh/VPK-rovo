const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function readKnowledgeDetailsSection() {
	const source = readProjectFile("app/data/details/blocks.ts");
	const start = source.indexOf('\t"knowledge-directory": {');
	const end = source.indexOf('\t"mermaid-diagram": {', start);

	assert.notEqual(start, -1);
	assert.notEqual(end, -1);

	return source.slice(start, end);
}

test("Knowledge Directory is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("knowledge-directory", "Knowledge Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("knowledge-directory", "Knowledge Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ KnowledgeDirectoryDialog \} from "@\/components\/blocks\/knowledge-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"knowledge-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/knowledge-directory-demo"\)/u,
	);
});

test("Knowledge Directory docs demo starts closed until the trigger is clicked", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/page.tsx");

	assert.match(source, /const \[open, setOpen\] = useState\(false\);/u);
	assert.match(source, /Browse knowledge/u);
	assert.doesNotMatch(source, /Browse skills/u);
});

test("Knowledge Directory owns a knowledge-specific modal without the copied sidebar", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.doesNotMatch(source, /KnowledgeDirectorySidebar/u);
	assert.doesNotMatch(source, /SkillDirectorySidebar/u);
	assert.match(source, /<DialogContent/u);
	assert.match(source, /sm:max-w-\[960px\]/u);
	assert.match(source, /sm:max-w-\[640px\]/u);
	assert.match(source, /title = "Browse knowledge"/u);
	assert.match(source, /onBack=\{selectedApp \? handleBack : undefined\}/u);
	assert.match(source, /aria-label="Back to knowledge apps"[\s\S]*size="icon"[\s\S]*<ArrowLeftIcon label="" color="currentColor" \/>/u);
});

test("Knowledge Directory exposes app, content, and callback props", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");
	const indexSource = readProjectFile("components/blocks/knowledge-directory/index.ts");

	assert.match(source, /export interface KnowledgeDirectoryDialogProps/u);
	assert.match(source, /apps\?: readonly KnowledgeDirectoryApp\[\]/u);
	assert.match(source, /selectedAppId\?: string \| null/u);
	assert.match(source, /defaultSelectedAppId\?: string \| null/u);
	assert.match(source, /selectedMode\?: KnowledgeDirectoryMode/u);
	assert.match(source, /defaultSelectedMode\?: KnowledgeDirectoryMode/u);
	assert.match(source, /selectedContentIds\?: readonly string\[\]/u);
	assert.match(source, /defaultSelectedContentIds\?: readonly string\[\]/u);
	assert.match(source, /onBrowseFiles\?: \(\) => void/u);
	assert.match(source, /onAddKnowledge\?: \(payload: KnowledgeDirectoryAddPayload\) => void/u);
	assert.match(source, /onSelectApp\?: \(app: KnowledgeDirectoryApp\) => void/u);
	assert.match(source, /onSelectMode\?: \(mode: KnowledgeDirectoryMode\) => void/u);
	assert.match(source, /onSelectedContentIdsChange\?: \(contentIds: readonly string\[\]\) => void/u);
	assert.match(indexSource, /KnowledgeDirectoryAddPayload/u);
	assert.match(indexSource, /KnowledgeDirectoryApp/u);
	assert.match(indexSource, /KnowledgeDirectoryContent/u);
	assert.match(indexSource, /KnowledgeDirectoryMode/u);
	assert.doesNotMatch(indexSource, /KnowledgeDirectorySkill/u);
});

test("Knowledge Directory includes real connector defaults", () => {
	// App data is now the single-source-of-truth JSON catalog.
	const apps = JSON.parse(readProjectFile("app/data/directory/knowledge.json"));
	const byName = new Map(apps.map((app) => [app.name, app]));

	for (const name of [
		"Confluence",
		"Google Drive",
		"Microsoft Teams",
		"Microsoft SharePoint",
		"GitHub",
		"Loom",
	]) {
		assert.ok(byName.has(name), `knowledge catalog should include ${name}`);
	}

	assert.deepEqual(byName.get("Confluence").visual, { kind: "logo", logoName: "confluence" });
	assert.deepEqual(byName.get("Google Drive").visual, {
		kind: "image",
		shape: "square",
		src: "/3p/google-drive/20.svg",
	});
	assert.ok(apps.every((app) => Array.isArray(app.contents)));
});

test("Knowledge Directory implements app selection and content-scope actions", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");

	assert.match(source, /function BrowseAppsStep/u);
	assert.match(source, /function KnowledgeAppCard/u);
	assert.match(source, /function AppContentStep/u);
	assert.match(source, /function ContentModeSelector/u);
	assert.match(source, /All content/u);
	assert.match(source, /Custom content/u);
	assert.match(source, /Select content/u);
	assert.match(source, /onSelectApp\(app\)/u);
	assert.match(source, /commitMode\("all"\)/u);
	assert.match(source, /commitContentIds\(getContentIds\(app\)\)/u);
	assert.match(source, /contentIds: resolvedMode === "all" \? "all" : resolvedContentIds/u);
});

test("Knowledge Directory custom content can be searched and removed", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");

	assert.match(source, /function filterContent/u);
	assert.match(source, /selectedIdSet\.has\(content\.id\)/u);
	assert.match(source, /function SelectedContentList/u);
	assert.match(source, /onRemoveContent/u);
	assert.match(source, /DeleteIcon/u);
	assert.match(source, /Remove \$\{content\.name\}/u);
	assert.match(source, /No custom content selected\./u);
});

test("Knowledge Directory demo and docs use knowledge-specific examples", () => {
	const pageSource = readProjectFile("components/blocks/knowledge-directory/page.tsx");
	const detailsSource = readKnowledgeDetailsSection();

	assert.doesNotMatch(pageSource, /defaultSelectedSkillIds/u);
	assert.doesNotMatch(pageSource, /sessionSkills/u);
	assert.match(detailsSource, /KnowledgeDirectoryApp/u);
	assert.match(detailsSource, /apps=\{apps\}/u);
	assert.match(detailsSource, /onBrowseFiles/u);
	assert.match(detailsSource, /onAddKnowledge/u);
	assert.doesNotMatch(detailsSource, /KnowledgeDirectorySkill/u);
	assert.doesNotMatch(detailsSource, /onAddSkills/u);
});
