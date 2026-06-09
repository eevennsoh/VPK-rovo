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
	const cardDirectoryToolSource = readProjectFile("components/ui-custom/card-directory/card-directory-tool.tsx");
	const entityCardToolSource = readProjectFile("components/ui-custom/entity-card/tool.tsx");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.match(source, /className="grid h-\[min\(768px,calc\(100svh-2rem\)\)\][\s\S]*sm:!max-w-\[1200px\]"/u);
	assert.match(source, /New tool/u);
	assert.match(source, /onBack=\{selectedTool \? \(\) => setSelectedToolId\(null\) : undefined\}/u);
	assert.match(source, /aria-label="Back to tools"[\s\S]*size="icon"[\s\S]*<ArrowLeftIcon label="" color="currentColor" \/>/u);
	assert.doesNotMatch(source, />\s*Back\s*</u);
	assert.match(source, /Search for a tool by name, or describe it/u);
	assert.match(source, /Sort by latest/u);
	assert.match(source, /Showing \{filteredTools\.length\.toLocaleString\("en-US"\)\} results/u);
	assert.match(source, /<ToolCard onSelectTool=\{onSelectTool\} tool=\{tool\} \/>/u);
	assert.match(source, /const \[moreMenuOpen, setMoreMenuOpen\] = useState\(false\);/u);
	assert.match(source, /<CardDirectoryTool[\s\S]*active=\{moreMenuOpen\}[\s\S]*moreAction=\{[\s\S]*<DirectoryCardMoreMenu[\s\S]*onOpenChange=\{setMoreMenuOpen\}[\s\S]*open=\{moreMenuOpen\}/u);
	assert.match(source, /aria-pressed=\{open \|\| undefined\}/u);
	assert.match(source, /className="min-h-\[102px\] hover:border-transparent"/u);
	assert.match(source, /<AtlassianLogo[\s\S]*label=\{tool\.name\}[\s\S]*name=\{tool\.logoName \?\? "atlassian"\}[\s\S]*size="small"/u);
	assert.match(source, /tool\.logoName \|\| tool\.id === "atlassian"/u);
	assert.match(source, /const src = tool\.logoSrc \?\? tool\.avatarSrc;/u);
	assert.match(source, /import \{ useHasVerticalOverflow \} from "@\/components\/hooks\/use-has-vertical-overflow";/u);
	assert.match(source, /const contentOverflow = useHasVerticalOverflow<HTMLDivElement>\(\);/u);
	assert.match(source, /ref=\{contentOverflow\.ref\}/u);
	assert.match(source, /"flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto px-6 pb-6 md:pl-4"/u);
	assert.match(source, /"flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto px-6 pb-6 md:pl-4"/u);
	assert.match(source, /contentOverflow\.showTopScrollMask && "scroll-mask-top overscroll-contain"/u);
	assert.match(source, /const sidebarOverflow = useHasVerticalOverflow<HTMLElement>\(\);/u);
	assert.match(source, /aria-label="Tool categories"[\s\S]*sidebarOverflow\.showTopScrollMask && "scroll-mask-top overscroll-contain"[\s\S]*ref=\{sidebarOverflow\.ref\}/u);
	assert.match(source, /className="hidden min-h-0 w-\[280px\] shrink-0 overflow-y-auto pl-6 md:block"/u);
	assert.match(cardDirectoryToolSource, /<CardDirectory active=\{active\} className=\{cn\("gap-4", className\)\}/u);
	assert.match(cardDirectoryToolSource, /<EntityCard\.Tool/u);
	assert.match(cardDirectoryToolSource, /action=\{moreAction\}/u);
	assert.match(cardDirectoryToolSource, /onMoreActions=\{onMoreActions\}/u);
	assert.match(entityCardToolSource, /<EntityCardMoreButton active=\{active\}/u);
	assert.match(entityCardToolSource, /<div className="flex flex-col gap-2">[\s\S]*<EntityCardHeader[\s\S]*<EntityCardDescription>/u);
	assert.match(readProjectFile("components/hooks/use-has-vertical-overflow.ts"), /scrollTop > 1/u);
	assert.match(readProjectFile("components/hooks/use-has-vertical-overflow.ts"), /showTopScrollMask: hasVerticalOverflow && hasScrolledFromTop/u);
	assert.match(readProjectFile("app/tailwind-theme.css"), /@utility scroll-mask-top/u);
	assert.doesNotMatch(source, /overflow-y-auto px-6 pt-6 pb-6/u);
	assert.doesNotMatch(source, /overflow-y-auto pl-6 pt-6/u);
});

test("Tools Directory keeps compatible types while adding tool detail fields", () => {
	// The tool type is now owned by the data layer (single type identity) and
	// re-exported from the component module for existing callers.
	const loaderSource = readProjectFile("app/data/directory/tools.ts");
	const componentSource = readProjectFile("components/blocks/tools-directory/components/tools-directory.tsx");

	assert.match(loaderSource, /export interface ToolsDirectoryTool/u);
	// The loader interface mirrors AgentBrowserAgent's identity fields...
	for (const field of ["id", "name", "byline", "attributionKind", "avatarSrc", "logoName", "description"]) {
		assert.match(loaderSource, new RegExp(`\\b${field}\\??:`, "u"));
	}
	// ...plus the tool-specific detail fields.
	for (const field of [
		"categoryId",
		"toolCount",
		"teammateCount",
		"lastUpdatedLabel",
		"publisherName",
		"verified",
		"favorite",
		"readOnlyTools",
		"writeDeleteTools",
	]) {
		assert.match(loaderSource, new RegExp(`${field}\\?`, "u"));
	}
	// The component re-exports the loader's tool/permission types and keeps the
	// sidebar-group alias to AgentBrowserSidebarGroup.
	assert.match(
		componentSource,
		/export type \{ ToolsDirectoryPermission, ToolsDirectoryTool \} from "@\/app\/data\/directory\/tools";/u,
	);
	assert.match(componentSource, /export type ToolsDirectorySidebarGroup = AgentBrowserSidebarGroup;/u);
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
	assert.doesNotMatch(source, /size="sm"/u);
	assert.doesNotMatch(source, /className="h-px bg-border"/u);
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
	const componentSource = readProjectFile("components/blocks/tools-directory/components/tools-directory.tsx");
	// Tool data is now the single-source-of-truth JSON catalog (two groups).
	const toolsData = JSON.parse(readProjectFile("app/data/directory/tools.json"));
	const allTools = [...toolsData.tools, ...toolsData.sessionTools];
	const sidebarGroupsSource = readProjectFile("components/blocks/tools-directory/data/sidebar-groups.ts");

	assert.match(source, /import \{ DEMO_SESSION_TOOLS, DEMO_TOOLS \} from "@\/app\/data\/directory\/tools";/u);
	assert.match(source, /defaultAddedToolIds=\{\["atlassian"\]\}/u);
	assert.ok(allTools.some((tool) => tool.logoName === "atlassian"), "a tool should use the Atlassian brand logo");
	assert.ok(allTools.some((tool) => tool.favorite === true), "a tool should be marked favourite");
	for (const categoryId of ["project-management", "software-development", "security-and-compliance"]) {
		assert.ok(
			allTools.some((tool) => tool.categoryId === categoryId),
			`a tool should be in the ${categoryId} category`,
		);
	}
	assert.match(componentSource, /label: "Favourite tools"/u);
	assert.match(componentSource, /if \(activeCategory === "favorite-tools" && !tool\.favorite\) return false;/u);
	assert.match(componentSource, /const MAX_VISIBLE_CATEGORY_ITEMS = 5;/u);
	assert.match(componentSource, /const \[showAllCategories, setShowAllCategories\] = useState\(false\);/u);
	assert.match(componentSource, /TOOLS_DIRECTORY_CATEGORIES\.slice\(0, MAX_VISIBLE_CATEGORY_ITEMS\)/u);
	assert.match(componentSource, /label="Show all"[\s\S]*onClick=\{\(\) => setShowAllCategories\(true\)\}/u);
	assert.match(componentSource, /sidebarGroups = DEFAULT_TOOLS_DIRECTORY_SIDEBAR_GROUPS/u);
	assert.match(sidebarGroupsSource, /title: "By companies"/u);
	assert.doesNotMatch(sidebarGroupsSource, /title: "By teams"/u);
	assert.doesNotMatch(sidebarGroupsSource, /title: "Favourites"/u);
});
