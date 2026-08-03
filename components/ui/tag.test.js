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
	assert.match(TAG_DEMO_SOURCE, /<BrandLogoMark frame="chip" name="google-drive" label="Google Drive" \/>/u);
	assert.match(logoMarkSource, /presentation\.hasBorder \? "size-3" : "size-4"/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /from "next\/image"/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /PublicLogoMark|ProductLogoMark|LogoSlot/u);
	assert.doesNotMatch(TAG_DEMO_SOURCE, /className="size-3 \[&_svg\]:size-3"/u);
});

test("Tag exposes ADS visual-uplift color tokens and trailing metrics", () => {
	const tagSource = fs.readFileSync(
		path.join(process.cwd(), "components", "ui", "tag.tsx"),
		"utf8",
	);

	assert.match(tagSource, /border: "border-border-accent-blue-subtle"/u);
	assert.match(tagSource, /icon: "text-icon-accent-blue group-hover\/tag:text-text-accent-blue/u);
	assert.match(tagSource, /metric: "bg-bg-accent-blue-subtler"/u);
	assert.doesNotMatch(tagSource, /border-blue-500|border-red-500|border-neutral-500/u);
	assert.match(tagSource, /\[&>\[data-slot=icon\]>span\]:size-3! \[&>\[data-slot=icon\]_svg\]:size-3!/u);

	// Component keeps the escape-hatch trailing slot and also supports the
	// package-compatible `trailingMetric` prop.
	assert.match(tagSource, /elemAfter\?: React\.ReactNode;/u);
	assert.match(tagSource, /trailingMetric\?: string \| number;/u);
	assert.match(tagSource, /data-slot="tag-trailing-metric"/u);
	assert.match(tagSource, /const resolvedElemAfter = elemAfter \?\?/u);
	assert.match(tagSource, /hasElemAfter \? "gap-1" : "gap-0\.5"/u);
	assert.match(tagSource, /data-slot="tag-after-content"/u);
	assert.match(tagSource, /\{resolvedElemAfter \? \([\s\S]*shrink-0[\s\S]*\) : null\}/u);

	// Demo uses the current package-style metric prop instead of hand-built Badge
	// instances, including the red count example.
	assert.doesNotMatch(TAG_DEMO_SOURCE, /import \{ Badge \} from "@\/components\/ui\/badge";/u);
	assert.match(TAG_DEMO_SOURCE, /export function TagDemoBadge\(\)/u);
	assert.match(TAG_DEMO_SOURCE, /<Tag color="red" trailingMetric=\{5\} onRemove=\{\(\) => \{\}\}>/u);
});

test("Tag removable demo centers its removable tag in the preview surface", () => {
	assert.match(
		TAG_DEMO_SOURCE,
		/export function TagDemoRemovable\(\)[\s\S]*className="flex min-h-\[352px\] w-full items-center justify-center"/u,
	);
});
