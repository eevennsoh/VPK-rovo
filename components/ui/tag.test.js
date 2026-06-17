const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const TAG_DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components", "website", "demos", "ui", "tag-demo.tsx"),
	"utf8",
);

test("Tag front-slot demo uses shared logo treatment for 1P, 2P, and 3P marks", () => {
	const logoMarkSource = fs.readFileSync(
		path.join(process.cwd(), "components", "ui", "logo-mark.tsx"),
		"utf8",
	);

	assert.match(TAG_DEMO_SOURCE, /import \{ RovoColorIcon \} from "@\/components\/ui\/logo";/u);
	assert.match(TAG_DEMO_SOURCE, /import \{ IconTile \} from "@\/components\/ui\/icon-tile";/u);
	assert.match(TAG_DEMO_SOURCE, /import \{ AtlassianLogoMark, BrandLogoMark \} from "@\/components\/ui\/logo-mark";/u);
	assert.match(TAG_DEMO_SOURCE, /<IconTile[\s\S]*<Icon render=\{<TagIcon label="" size="small" \/>\} aria-hidden \/>[\s\S]*size="xxsmall"[\s\S]*variant="transparent"/u);
	// 1P brand logos route through the shared AtlassianLogoMark chip frame (same
	// inline-chip API as BrandLogoMark) rather than a hand-wrapped IconTile / bare logo.
	assert.match(TAG_DEMO_SOURCE, /<AtlassianLogoMark frame="chip" name="jira" label="Jira" \/>/u);
	assert.match(TAG_DEMO_SOURCE, /<AtlassianLogoMark frame="chip" name="atlassian" label="Atlassian" \/>/u);
	assert.match(TAG_DEMO_SOURCE, /<IconTile[\s\S]*<RovoColorIcon aria-hidden \/>[\s\S]*size="xxsmall"[\s\S]*variant="transparent"/u);
	assert.match(TAG_DEMO_SOURCE, /<BrandLogoMark frame="chip" src="\/2p\/appfire\.png" label="Appfire" \/>/u);
	assert.match(TAG_DEMO_SOURCE, /<BrandLogoMark frame="chip" src="\/3p\/google-drive\/16\.svg" label="Google Drive" \/>/u);
	assert.match(logoMarkSource, /presentation\.hasBorder \? "size-3" : "size-4"/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /from "next\/image"/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /PublicLogoMark|ProductLogoMark|LogoSlot/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /className="size-3 \[&_svg\]:size-3"/u);
});
