const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
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
	assert.match(
		readProjectFile("components/blocks/knowledge-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Knowledge Directory owns a skill-specific modal instead of wrapping AgentBrowserDialog", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.match(source, /<DialogContent/u);
	assert.match(source, /sm:max-w-\[1200px\]/u);
	assert.match(source, /md:grid-cols-\[280px_minmax\(0,1fr\)\]/u);
	assert.match(source, /title = "Browse all"/u);
});

test("Knowledge Directory exposes canonical skill props and legacy agent compatibility", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");
	const indexSource = readProjectFile("components/blocks/knowledge-directory/index.ts");

	assert.match(source, /export interface KnowledgeDirectoryDialogProps/u);
	assert.match(source, /skills\?: readonly KnowledgeDirectorySkill\[\]/u);
	assert.match(source, /sessionSkills\?: readonly KnowledgeDirectorySkill\[\]/u);
	assert.match(source, /selectedSkillIds\?: readonly string\[\]/u);
	assert.match(source, /defaultSelectedSkillIds\?: readonly string\[\]/u);
	assert.match(source, /onSelectedSkillIdsChange\?: \(skillIds: readonly string\[\]\) => void/u);
	assert.match(source, /onAddSkills\?: \(skillIds: readonly string\[\], skills: readonly KnowledgeDirectorySkill\[\]\) => void/u);
	assert.match(source, /agents\?: readonly KnowledgeDirectoryAgent\[\]/u);
	assert.match(source, /sessionAgents\?: readonly KnowledgeDirectoryAgent\[\]/u);
	assert.match(source, /normalizeAgentSkill/u);
	assert.match(indexSource, /KnowledgeDirectoryAgent/u);
});

test("Knowledge Directory uses multi-select cards, hover learn-more, and selected toolbar", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");

	assert.match(source, /<Checkbox/u);
	assert.match(source, /border-border-selected/u);
	assert.match(source, /hover:border-transparent/u);
	assert.match(source, /function SkillMoreMenu/u);
	assert.match(source, /event\.stopPropagation\(\);\s+onLearnMore\(\);/u);
	assert.match(source, /Learn more/u);
	assert.match(source, /function SelectedSkillsToolbar/u);
	assert.match(source, /Add skills/u);
	assert.match(source, /Create link to share/u);
	assert.match(source, /Favorite/u);
	assert.match(source, /Download/u);
});

test("Knowledge Directory renders skill info view with file tree and top scroll mask", () => {
	const source = readProjectFile("components/blocks/knowledge-directory/components/knowledge-directory.tsx");

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

test("Knowledge Directory demo and docs use skill-specific examples", () => {
	const pageSource = readProjectFile("components/blocks/knowledge-directory/page.tsx");
	const detailsSource = readProjectFile("app/data/details/blocks.ts");
	const skillsSource = readProjectFile("components/blocks/knowledge-directory/data/skills.tsx");
	const sidebarGroupsSource = readProjectFile("components/blocks/knowledge-directory/data/sidebar-groups.ts");

	assert.match(pageSource, /defaultSelectedSkillIds=\{\[/u);
	assert.match(pageSource, /"design-landing-page"/u);
	assert.match(pageSource, /"develop-mobile-app-interface"/u);
	assert.match(pageSource, /"create-brand-identity"/u);
	assert.match(detailsSource, /onAddSkills/u);
	assert.match(detailsSource, /onCreateSkill/u);
	assert.match(skillsSource, /publisherName/u);
	assert.match(skillsSource, /publisherAvatarSrc/u);
	assert.match(skillsSource, /categoryId/u);
	assert.match(skillsSource, /companyId/u);
	assert.match(sidebarGroupsSource, /label: "All skills"/u);
	assert.match(sidebarGroupsSource, /label: "Favorite skills"/u);
	assert.match(sidebarGroupsSource, /label: "Your skills"/u);
});
