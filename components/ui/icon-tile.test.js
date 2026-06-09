const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ICON_TILE_SOURCE = fs.readFileSync(path.join(__dirname, "icon-tile.tsx"), "utf8");

const SIZE_CLASS_EXPECTATIONS = [
	["xxsmall", "size-4", "[font-size:10px]", "[&_img]:size-2.5!", "[&_span]:size-2.5!", "[&_svg]:size-2.5!"],
	["xsmall", "size-5", "[font-size:12px]", "[&_img]:size-3!", "[&_span]:size-3!", "[&_svg]:size-3!"],
	["small", "size-6", "[font-size:14px]", "[&_img]:size-3.5!", "[&_span]:size-3.5!", "[&_svg]:size-3.5!"],
	["medium", "size-8", "[font-size:16px]", "[&_img]:size-4!", "[&_span]:size-4!", "[&_svg]:size-4!"],
	["large", "size-10", "[font-size:20px]", "[&_img]:size-5!", "[&_span]:size-5!", "[&_svg]:size-5!"],
	["xlarge", "size-12", "[font-size:24px]", "[&_img]:size-6!", "[&_span]:size-6!", "[&_svg]:size-6!"],
];

test("IconTile size variants keep ADS tile and icon scaling aligned", () => {
	for (const [size, ...expectedClasses] of SIZE_CLASS_EXPECTATIONS) {
		const match = ICON_TILE_SOURCE.match(new RegExp(`\\n\\t\\t\\t\\t${size}: "([^"]*)"`, "u"));

		assert.ok(match, `${size} size variant should exist`);
		assert.deepEqual(match[1].split(" "), expectedClasses);
	}
});

test("IconTile exposes a transparent, backgroundless tile variant", () => {
	assert.match(ICON_TILE_SOURCE, /\| "transparent"/u);
	assert.match(ICON_TILE_SOURCE, /transparent: "bg-transparent text-icon/u);
	assert.match(ICON_TILE_SOURCE, /data-\[size=xxsmall\]:\[font-size:12px\]/u);
	assert.match(ICON_TILE_SOURCE, /data-\[size=xxsmall\]:\[&_span\]:size-3!/u);
	assert.match(ICON_TILE_SOURCE, /data-size=\{size\}/u);
	assert.match(ICON_TILE_SOURCE, /data-variant=\{variant\}/u);
	assert.match(ICON_TILE_SOURCE, /square: "rounded-tile"/u);
});
