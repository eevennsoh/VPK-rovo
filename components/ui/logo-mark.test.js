const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const LOGO_MARK_SOURCE = fs.readFileSync(path.join(__dirname, "logo-mark.tsx"), "utf8");
const LOGO_DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components", "website", "demos", "ui", "logo-demo.tsx"),
	"utf8",
);

test("Atlassian company logo uses the shared bordered Tile treatment", () => {
	assert.match(LOGO_MARK_SOURCE, /export function AtlassianLogoMark/u);
	assert.match(LOGO_MARK_SOURCE, /export function AtlassianLogoGlyph/u);
	assert.match(LOGO_MARK_SOURCE, /className=\{cn\([\s\S]*\[&>span\]:!size-full \[&_svg\]:!size-full/u);
	assert.match(LOGO_MARK_SOURCE, /<AtlassianLogo label="" name=\{name\} size=\{size\} themeAware \/>/u);
	assert.match(LOGO_MARK_SOURCE, /const hasBorder = resolveAtlassianLogoBorder\(name\);/u);
	assert.match(LOGO_MARK_SOURCE, /<Tile[\s\S]*hasBorder[\s\S]*size=\{size\}[\s\S]*variant="transparent"[\s\S]*<AtlassianLogo label="" name=\{name\} size=\{size\} themeAware \/>/u);
	assert.match(LOGO_MARK_SOURCE, /const logo = \(\s*<AtlassianLogo[\s\S]*name=\{name\}[\s\S]*size=\{size\}[\s\S]*themeAware[\s\S]*\/>\s*\);/u);
	assert.match(LOGO_MARK_SOURCE, /return className \? <span className=\{cn\("inline-flex", className\)\}>\{logo\}<\/span> : logo;/u);
	assert.match(LOGO_DEMO_SOURCE, /import \{ AtlassianLogoMark, BrandLogoMark \} from "@\/components\/ui\/logo-mark";/u);
	assert.match(LOGO_DEMO_SOURCE, /<AtlassianLogoMark[\s\S]*label=\{`Atlassian \$\{size\}`\}[\s\S]*name="atlassian"[\s\S]*size=\{size\}[\s\S]*\/>/u);
	assert.match(LOGO_DEMO_SOURCE, /Atlassian company/u);
});
