const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Skills Directory is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("skills-directory", "Skills Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("skills-directory", "Skills Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ SkillsDirectoryDialog \} from "@\/components\/blocks\/skills-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"skills-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/skills-directory-demo"\)/u,
	);
});

test("Skills Directory docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/skills-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Skills Directory owns a skill-specific modal instead of wrapping AgentBrowserDialog", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.match(source, /<DialogContent/u);
	assert.match(source, /sm:max-w-\[1200px\]/u);
	assert.match(source, /md:grid-cols-\[280px_minmax\(0,1fr\)\]/u);
	assert.match(source, /title = "Browse all"/u);
});

test("Skills Directory uses the Agents Directory dialog header style", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");

	assert.match(
		source,
		/<div className="flex items-center justify-between px-6 pt-6 pb-4">[\s\S]*<DialogTitle className="text-base font-medium leading-5 text-text">[\s\S]*\{title\}[\s\S]*<\/DialogTitle>[\s\S]*<div className="flex items-center gap-2">[\s\S]*<Button onClick=\{onCreateSkill\} type="button">[\s\S]*New skill[\s\S]*<\/Button>[\s\S]*<DialogClose render=\{<Button variant="ghost" size="icon" \/>\}>[\s\S]*<CrossIcon label="" \/>[\s\S]*<span className="sr-only">Close<\/span>[\s\S]*<\/DialogClose>/u,
	);
	assert.doesNotMatch(source, /className="flex items-center justify-between border-b border-border px-6 py-6"/u);
});

test("Skills Directory exposes canonical skill props and legacy agent compatibility", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");
	const indexSource = readProjectFile("components/blocks/skills-directory/index.ts");

	assert.match(source, /export interface SkillsDirectoryDialogProps/u);
	assert.match(source, /skills\?: readonly SkillsDirectorySkill\[\]/u);
	assert.match(source, /sessionSkills\?: readonly SkillsDirectorySkill\[\]/u);
	assert.match(source, /selectedSkillIds\?: readonly string\[\]/u);
	assert.match(source, /defaultSelectedSkillIds\?: readonly string\[\]/u);
	assert.match(source, /onSelectedSkillIdsChange\?: \(skillIds: readonly string\[\]\) => void/u);
	assert.match(source, /onAddSkills\?: \(skillIds: readonly string\[\], skills: readonly SkillsDirectorySkill\[\]\) => void/u);
	assert.match(source, /agents\?: readonly SkillsDirectoryAgent\[\]/u);
	assert.match(source, /sessionAgents\?: readonly SkillsDirectoryAgent\[\]/u);
	assert.match(source, /normalizeAgentSkill/u);
	assert.match(indexSource, /SkillsDirectoryAgent/u);
});

test("Skills Directory sidebar uses Tools Directory category treatment", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory-sidebar.tsx");
	const sidebarGroupsSource = readProjectFile("components/blocks/skills-directory/data/sidebar-groups.ts");

	assert.match(source, /const MAX_VISIBLE_CATEGORY_ITEMS = 5;/u);
	assert.match(source, /const \[showAllCategories, setShowAllCategories\] = useState\(false\);/u);
	assert.match(source, /showAllCategories\s+\?\s+categoryItems\s+:\s+categoryItems\.slice\(0, MAX_VISIBLE_CATEGORY_ITEMS\);/u);
	assert.match(source, /const hasHiddenCategoryItems = !showAllCategories && categoryItems\.length > MAX_VISIBLE_CATEGORY_ITEMS;/u);
	assert.match(source, /<ul className="flex w-64 flex-col">[\s\S]*visibleCategoryItems\.map/u);
	assert.match(source, /leading=\{getCategoryNavIcon\(item\.icon, item\.label\)\}/u);
	assert.match(source, /label="Show all"/u);
	assert.match(source, /onClick=\{\(\) => setShowAllCategories\(true\)\}/u);
	assert.match(source, /import \{ AtlassianLogo \} from "@\/components\/ui\/logo";/u);
	assert.match(source, /item\.logoName \? \([\s\S]*<AtlassianLogo name=\{item\.logoName\} size="small" themeAware label=\{item\.label\} \/>/u);
	assert.match(source, /<SettingsIcon label=\{label\} size="small" color="currentColor" \/>/u);
	assert.match(source, /<SupportIcon label=\{label\} size="small" color="currentColor" \/>/u);
	assert.match(source, /<CartIcon label=\{label\} size="small" color="currentColor" \/>/u);
	assert.doesNotMatch(source, /leading=\{<TileLeading>\{getCategoryNavIcon/u);
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
		assert.match(sidebarGroupsSource, new RegExp(label, "u"));
	}
});

test("Skills Directory uses multi-select cards, hover learn-more, and selected toolbar", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");

	assert.match(source, /<Checkbox/u);
	assert.match(source, /<SkillsDirectoryHeader[\s\S]*onCreateSkill=\{createSkillHandler\}/u);
	assert.match(source, /Showing \{filteredSkills\.length\.toLocaleString\("en-US"\)\} results/u);
	assert.match(source, /const \[moreMenuOpen, setMoreMenuOpen\] = useState\(false\);/u);
	assert.match(source, /active=\{moreMenuOpen\}/u);
	assert.match(source, /<SkillMoreMenu[\s\S]*onOpenChange=\{setMoreMenuOpen\}[\s\S]*open=\{moreMenuOpen\}/u);
	assert.match(source, /aria-pressed=\{open \|\| undefined\}/u);
	assert.match(source, /"min-h-\[112px\] gap-4 hover:border-transparent"/u);
	assert.match(source, /<div className="flex flex-col gap-2">[\s\S]*<CardDirectoryDescription className="text-text">/u);
	assert.match(source, /aria-hidden[\s\S]*getSkillIconColor\(skill\)[\s\S]*\{getSkillIcon\(skill\.icon\)\}/u);
	assert.doesNotMatch(source, /rounded-xs bg-bg-neutral text-icon-subtle transition-opacity/u);
	assert.match(source, /absolute top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 opacity-0 transition-opacity/u);
	assert.match(source, /selected[\s\S]*\? "opacity-0"[\s\S]*: "opacity-100 group-hover\/card:opacity-0"/u);
	assert.match(source, /focus-visible:pointer-events-auto focus-visible:opacity-100/u);
	assert.match(source, /pointer-events-none group-hover\/card:pointer-events-auto group-hover\/card:opacity-100/u);
	assert.doesNotMatch(source, /group-focus-within\/card:pointer-events-auto group-focus-within\/card:opacity-100/u);
	assert.match(source, /border-border-selected/u);
	assert.match(source, /hover:border-transparent/u);
	assert.match(source, /function SkillMoreMenu/u);
	assert.match(source, /event\.stopPropagation\(\);\s+onLearnMore\(\);/u);
	assert.match(source, /Learn more/u);
	assert.match(source, /function SelectedSkillsToolbar/u);
	assert.match(source, /style=\{\{ boxShadow: token\("elevation\.shadow\.overlay"\) \}\}/u);
	assert.match(source, /function SkillPublisherAvatar/u);
	assert.match(source, /getSkillPublisherLogoName\(skill\)/u);
	// Attribution marks are a uniform 16x16: brand logo uses the xxsmall (16px) size.
	assert.match(source, /<AtlassianLogo name=\{logoName\} size="xxsmall" themeAware label=\{getSkillPublisherName\(skill\)\} \/>/u);
	assert.doesNotMatch(source, /size="xsmall" themeAware label=\{getSkillPublisherName/u);
	// Only human avatars are rounded; company logos stay square.
	assert.match(source, /const isPerson = isSkillPublisherPerson\(skill\);/u);
	assert.match(source, /isPerson \? "rounded-full object-cover" : "object-contain"/u);
	assert.match(source, /Add skills/u);
	assert.match(source, /Create link to share/u);
	assert.match(source, /Favorite/u);
	assert.match(source, /Download/u);
	assert.match(source, /Download[\s\S]*Add skills[\s\S]*aria-label="Clear selected skills"/u);
});

test("Skills Directory renders skill info view with file tree and top scroll mask", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");
	const sidebarSource = readProjectFile("components/blocks/skills-directory/components/skills-directory-sidebar.tsx");

	assert.match(source, /function SkillDetailHeader/u);
	assert.match(source, /<SplitButton/u);
	assert.match(source, /Try in chat/u);
	assert.match(source, /function SkillDetailView/u);
	assert.match(source, /function SkillFileTreeSidebar/u);
	assert.match(source, /SKILL\.md/u);
	assert.match(source, /LICENSE\.txt/u);
	assert.match(source, /references/u);
	assert.match(source, /scripts/u);
	assert.match(source, /contentOverflow\.showTopScrollMask && "scroll-mask-top overscroll-contain"/u);
	assert.match(sidebarSource, /import \{ useHasVerticalOverflow \} from "@\/components\/hooks\/use-has-vertical-overflow";/u);
	assert.match(sidebarSource, /const sidebarOverflow = useHasVerticalOverflow<HTMLElement>\(\);/u);
	assert.match(sidebarSource, /aria-label="Skill categories"[\s\S]*sidebarOverflow\.showTopScrollMask && "scroll-mask-top overscroll-contain"[\s\S]*ref=\{sidebarOverflow\.ref\}/u);
});

test("Skills Directory demo and docs use skill-specific examples", () => {
	const pageSource = readProjectFile("components/blocks/skills-directory/page.tsx");
	const detailsSource = readProjectFile("app/data/details/blocks.ts");
	// Skill data is now the single-source-of-truth JSON catalog; the loader + icon
	// resolver own the typing/helpers and the Atlaskit icon imports.
	const skillsJson = JSON.parse(readProjectFile("app/data/directory/skills.json"));
	const skillsLoaderSource = readProjectFile("app/data/directory/skills.ts");
	const visualSource = readProjectFile("app/data/directory/visual.tsx");
	const sidebarGroupsSource = readProjectFile("components/blocks/skills-directory/data/sidebar-groups.ts");

	const skillIds = new Set(skillsJson.map((skill) => skill.id));

	assert.doesNotMatch(pageSource, /defaultSelectedSkillIds=/u);
	assert.doesNotMatch(detailsSource, /defaultSelectedSkillIds=\{\[/u);
	assert.ok(skillIds.has("design-landing-page"));
	assert.ok(skillIds.has("develop-mobile-app-interface"));
	assert.ok(skillIds.has("create-brand-identity"));
	// The icon resolver owns the closed icon set + its Atlaskit imports.
	assert.match(visualSource, /import DeviceMobileIcon from "@atlaskit\/icon\/core\/device-mobile";/u);
	assert.ok(
		skillsJson.some((skill) => skill.icon === "device-mobile"),
		"at least one skill should use the device-mobile icon",
	);
	// Decorative icon colors are semantic/accent tokens, never raw -500 hues.
	for (const skill of skillsJson) {
		if (skill.iconColor) {
			assert.doesNotMatch(skill.iconColor, /text-(blue|purple|teal|orange|indigo|green)-500/u);
		}
	}
	// Skill provenance (`source`) drives the leading-glyph color. Every declared
	// source is in the closed set, and the System-of-Work families + a company
	// (3p) source are all exercised by the data.
	const VALID_SOURCES = new Set([
		"2p", "3p", "default", "custom", "platform",
		"teamwork", "software", "strategy", "service", "product",
	]);
	const sources = new Set();
	for (const skill of skillsJson) {
		if (skill.source !== undefined) {
			assert.ok(VALID_SOURCES.has(skill.source), `invalid skill source: ${skill.source}`);
			sources.add(skill.source);
		}
	}
	for (const family of ["teamwork", "software", "strategy", "service", "product", "3p"]) {
		assert.ok(sources.has(family), `a skill should have source "${family}"`);
	}
	// The loader maps each source to its ADS accent color and exposes the
	// derivation helper consumed by both the directory card and the composer tag.
	assert.match(skillsLoaderSource, /SKILL_SOURCE_ICON_COLOR/u);
	assert.match(skillsLoaderSource, /function getSkillIconColor/u);
	for (const accent of [
		"text-icon-accent-blue",
		"text-icon-accent-green",
		"text-icon-accent-orange",
		"text-icon-accent-yellow",
		"text-icon-accent-purple",
		"text-icon-accent-gray",
	]) {
		assert.ok(skillsLoaderSource.includes(accent), `loader should map a source to ${accent}`);
	}
	assert.match(skillsLoaderSource, /function getSkillPublisherLogoName/u);
	assert.match(sidebarGroupsSource, /logoName: "atlassian"/u);
	assert.match(detailsSource, /onAddSkills/u);
	assert.match(detailsSource, /onCreateSkill/u);
	// The loader interface still carries the publisher/category/company fields.
	assert.match(skillsLoaderSource, /publisherName/u);
	assert.match(skillsLoaderSource, /publisherAvatarSrc/u);
	assert.match(skillsLoaderSource, /categoryId/u);
	assert.match(skillsLoaderSource, /companyId/u);
	assert.match(sidebarGroupsSource, /label: "All skills"/u);
	assert.match(sidebarGroupsSource, /label: "Favourite skills"/u);
	assert.match(sidebarGroupsSource, /label: "Your skills"/u);
	// Category ids are still exercised by the data.
	const categoryIds = new Set(skillsJson.map((skill) => skill.categoryId ?? skill.category));
	assert.ok(categoryIds.has("content-and-communication"));
	assert.ok(categoryIds.has("data-and-analytics"));
});
