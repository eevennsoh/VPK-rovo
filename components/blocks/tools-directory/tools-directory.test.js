const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Tools Directory is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("tools-directory", "Tools Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("tools-directory", "Tools Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ ToolsDirectoryDialog \} from "@\/components\/blocks\/tools-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"tools-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/tools-directory-demo"\)/u,
	);
});

test("Tools Directory docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/tools-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Tools Directory owns the Figma modal instead of wrapping AgentBrowserDialog", () => {
	const source = readProjectFile("components/blocks/tools-directory/components/tools-directory.tsx");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.match(source, /className="grid h-\[min\(768px,calc\(100svh-2rem\)\)\][\s\S]*sm:!max-w-\[1200px\]"/u);
	assert.match(source, /New tool/u);
	assert.match(source, /Search for a tool by name, or describe it/u);
	assert.match(source, /Sort by latest/u);
	assert.match(source, /Showing \{filteredTools\.length\.toLocaleString\("en-US"\)\} results/u);
	assert.match(source, /className="min-h-\[102px\] hover:border-transparent"/u);
	assert.match(source, /src=\{tool\.logoSrc \?\? tool\.avatarSrc\}/u);
	assert.match(source, /import \{ useHasVerticalOverflow \} from "@\/components\/hooks\/use-has-vertical-overflow";/u);
	assert.match(source, /const contentOverflow = useHasVerticalOverflow<HTMLDivElement>\(\);/u);
	assert.match(source, /ref=\{contentOverflow\.ref\}/u);
	assert.match(source, /"flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto px-6 pb-6 md:pl-4"/u);
	assert.match(source, /"flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto px-6 pb-6 md:pl-4"/u);
	assert.match(source, /contentOverflow\.showTopScrollMask && "scroll-mask-top overscroll-contain"/u);
	assert.match(source, /className="hidden min-h-0 w-\[280px\] shrink-0 flex-col overflow-y-auto pl-6 md:flex"/u);
	assert.match(source, /className="hidden min-h-0 w-\[280px\] shrink-0 overflow-y-auto pl-6 md:block"/u);
	assert.doesNotMatch(source, /Tool categories"[\s\S]{0,120}scroll-mask-top/u);
	assert.match(readProjectFile("components/hooks/use-has-vertical-overflow.ts"), /scrollTop > 1/u);
	assert.match(readProjectFile("components/hooks/use-has-vertical-overflow.ts"), /showTopScrollMask: hasVerticalOverflow && hasScrolledFromTop/u);
	assert.match(readProjectFile("app/tailwind-theme.css"), /@utility scroll-mask-top/u);
	assert.doesNotMatch(source, /overflow-y-auto px-6 pt-6 pb-6/u);
	assert.doesNotMatch(source, /overflow-y-auto pl-6 pt-6/u);
});

test("Tools Directory keeps compatible types while adding tool detail fields", () => {
	const source = readProjectFile("components/blocks/tools-directory/components/tools-directory.tsx");

	assert.match(source, /export interface ToolsDirectoryTool extends AgentBrowserAgent/u);
	for (const field of [
		"categoryId",
		"toolCount",
		"teammateCount",
		"lastUpdatedLabel",
		"publisherName",
		"verified",
		"readOnlyTools",
		"writeDeleteTools",
	]) {
		assert.match(source, new RegExp(`${field}\\?`, "u"));
	}
	assert.match(source, /export type ToolsDirectorySidebarGroup = AgentBrowserSidebarGroup;/u);
});

test("Tools Directory supports controlled and uncontrolled added tool state", () => {
	const source = readProjectFile("components/blocks/tools-directory/components/tools-directory.tsx");

	assert.match(source, /addedToolIds\?: readonly string\[\];/u);
	assert.match(source, /defaultAddedToolIds\?: readonly string\[\];/u);
	assert.match(source, /onAddedToolIdsChange\?: \(toolIds: readonly string\[\]\) => void;/u);
	assert.match(source, /const controlledAddedIds = typeof addedToolIds !== "undefined";/u);
	assert.match(source, /onAddedToolIdsChange\?\.\(\[\.\.\.nextAddedIds\]\);/u);
	assert.match(source, /Add to agent/u);
	assert.match(source, /Remove/u);
});

test("Tools Directory category data follows the requested category content", () => {
	const source = readProjectFile("components/blocks/tools-directory/data/categories.ts");

	for (const label of [
		"Project management",
		"Administrative tools",
		"Content and communication",
		"Data and analytics",
		"Software development",
		"IT support and service",
		"Design and diagramming",
		"Security and compliance",
		"HR and team building",
		"Sales and customer relations",
	]) {
		assert.match(source, new RegExp(label, "u"));
	}
	assert.match(source, /Streamline, manage, and track project phases\./u);
	assert.match(source, /Apps for CRM, lead tracking, and customer engagement\./u);
});

test("Tools Directory docs demo includes added and non-added detail states", () => {
	const source = readProjectFile("components/blocks/tools-directory/page.tsx");

	assert.match(source, /defaultAddedToolIds=\{\["atlassian"\]\}/u);
	assert.match(source, /categoryId: "project-management"/u);
	assert.match(source, /categoryId: "software-development"/u);
	assert.match(source, /categoryId: "security-and-compliance"/u);
});
