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
	assert.match(source, /import \{ AtlassianLogo, isAtlassianLogoSource \} from "@\/components\/ui\/logo";/u);
	assert.match(source, /if \(isAtlassianLogoSource\(src\)\)[\s\S]*<AtlassianLogo name="atlassian" label="Atlassian" size="small" \/>/u);
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
	assert.match(source, /aria-hidden[\s\S]*skill\.iconColor[\s\S]*\{getSkillIcon\(skill\.icon\)\}/u);
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
	assert.match(source, /isAtlassianLogoSource\(publisherAvatarSrc\) \? \(/u);
	assert.match(source, /<AtlassianLogo name="atlassian" label=\{publisher\} size="xxsmall" \/>/u);
	assert.match(source, /Add skills/u);
	assert.match(source, /Create link to share/u);
	assert.match(source, /Favorite/u);
	assert.match(source, /Download/u);
	assert.match(source, /Download[\s\S]*Add skills[\s\S]*aria-label="Clear selected skills"/u);
});

test("Skills Directory renders skill info view with file tree and top scroll mask", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");

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
	assert.doesNotMatch(source, /Skill categories"[\s\S]{0,160}scroll-mask-top/u);
});

test("Skills Directory demo and docs use skill-specific examples", () => {
	const pageSource = readProjectFile("components/blocks/skills-directory/page.tsx");
	const detailsSource = readProjectFile("app/data/details/blocks.ts");
	const skillsSource = readProjectFile("components/blocks/skills-directory/data/skills.tsx");
	const sidebarGroupsSource = readProjectFile("components/blocks/skills-directory/data/sidebar-groups.ts");

	assert.doesNotMatch(pageSource, /defaultSelectedSkillIds=/u);
	assert.doesNotMatch(detailsSource, /defaultSelectedSkillIds=\{\[/u);
	assert.match(skillsSource, /"design-landing-page"/u);
	assert.match(skillsSource, /"develop-mobile-app-interface"/u);
	assert.match(skillsSource, /"create-brand-identity"/u);
	assert.match(skillsSource, /import DeviceMobileIcon from "@atlaskit\/icon\/core\/device-mobile";/u);
	assert.match(skillsSource, /icon: "device-mobile"/u);
	assert.doesNotMatch(skillsSource, /text-(blue|purple|teal|orange|indigo|green)-500/u);
	for (const colorClass of [
		"text-icon-brand",
		"text-icon-success",
		"text-icon-warning",
		"text-yellow-400",
		"text-icon-discovery",
	]) {
		assert.match(skillsSource, new RegExp(colorClass, "u"));
	}
	assert.match(skillsSource, /const ATLASSIAN_LOGO = "atlassian";/u);
	assert.match(sidebarGroupsSource, /logoSrc: "atlassian"/u);
	assert.match(detailsSource, /onAddSkills/u);
	assert.match(detailsSource, /onCreateSkill/u);
	assert.match(skillsSource, /publisherName/u);
	assert.match(skillsSource, /publisherAvatarSrc/u);
	assert.match(skillsSource, /categoryId/u);
	assert.match(skillsSource, /companyId/u);
	assert.match(sidebarGroupsSource, /label: "All skills"/u);
	assert.match(sidebarGroupsSource, /label: "Favourite skills"/u);
	assert.match(sidebarGroupsSource, /label: "Your skills"/u);
	assert.match(skillsSource, /"content-and-communication"/u);
	assert.match(skillsSource, /"data-and-analytics"/u);
});
