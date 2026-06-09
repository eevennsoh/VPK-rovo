const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const TAG_DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components", "website", "demos", "ui", "tag-demo.tsx"),
	"utf8",
);

test("Tag front-slot demo uses shared logo treatment for 1P, 2P, and 3P marks", () => {
	assert.match(TAG_DEMO_SOURCE, /import \{ AtlassianLogo, CustomLogo, RovoColorIcon \} from "@\/components\/ui\/logo";/u);
	assert.match(TAG_DEMO_SOURCE, /import \{ BrandLogoMark \} from "@\/components\/ui\/logo-mark";/u);
	assert.match(TAG_DEMO_SOURCE, /<AtlassianLogo name="jira" label="Jira" size="xxsmall" withUsageBorder \/>/u);
	assert.match(TAG_DEMO_SOURCE, /<AtlassianLogo name="atlassian" label="Atlassian" size="xxsmall" withUsageBorder \/>/u);
	assert.ok(TAG_DEMO_SOURCE.includes('<CustomLogo svg={<RovoSvg />} label="Rovo" size="xxsmall" />'));
	assert.match(TAG_DEMO_SOURCE, /<BrandLogoMark frame="chip" src="\/2p\/appfire\.png" label="Appfire" \/>/u);
	assert.match(TAG_DEMO_SOURCE, /<BrandLogoMark frame="chip" src="\/3p\/google-drive\/16\.svg" label="Google Drive" \/>/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /from "next\/image"/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /PublicLogoMark|ProductLogoMark|LogoSlot/u);
});
