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

test("Skills Directory renders the Browse skills dialog with skill cards", () => {
	const source = readProjectFile("components/blocks/skills-directory/components/skills-directory.tsx");
	const sidebarSource = readProjectFile("components/blocks/skills-directory/components/skills-directory-sidebar.tsx");
	const skillsSource = readProjectFile("components/blocks/skills-directory/data/skills.tsx");
	const sidebarGroupsSource = readProjectFile("components/blocks/skills-directory/data/sidebar-groups.ts");
	const pageSource = readProjectFile("components/blocks/skills-directory/page.tsx");

	// Skill card swapped in (matched to Figma: plain icon + hover-revealed stats).
	assert.match(source, /CardDirectorySkill/u);
	assert.match(source, /iconTile=\{false\}/u);
	assert.match(source, /revealStatsOnHover/u);
	// Browse skills chrome.
	assert.match(source, /title = "Browse skills"/u);
	assert.match(source, /New skill/u);
	assert.match(source, /Search for a skill by name, or describe it/u);
	// Figma left nav groups.
	assert.match(sidebarGroupsSource, /title: "Favourites"/u);
	assert.match(sidebarGroupsSource, /title: "Category"/u);
	assert.match(sidebarGroupsSource, /title: "By companies"/u);
	assert.match(sidebarSource, /SkillsDirectorySidebar/u);
	// Skills data + demo wiring.
	assert.match(skillsSource, /export const DEFAULT_SKILLS/u);
	assert.match(pageSource, /sessionSkills=\{DEMO_SESSION_SKILLS\}/u);
});

test("Skills card primitive keeps the new props backward compatible", () => {
	const cardSource = readProjectFile(
		"components/ui-custom/card-directory/card-directory-skill.tsx",
	);
	assert.match(cardSource, /iconTile = true/u);
	assert.match(cardSource, /revealStatsOnHover = false/u);
});
