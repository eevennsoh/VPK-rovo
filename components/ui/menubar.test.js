const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "menubar.tsx"), "utf8");

test("menubar items keep shortcut and icon children in the flex row", () => {
	assert.match(source, /import \{ Menu as MenuPrimitive \} from "@base-ui\/react\/menu";/u);
	assert.doesNotMatch(source, /DropdownMenuItem,/u);
	assert.match(source, /<MenuPrimitive\.Item[\s\S]*data-slot="menubar-item"/u);
	assert.match(source, /relative flex w-full cursor-pointer items-center gap-2/u);
	assert.match(source, /hasStructuredSlots \? \([\s\S]*\) : \(\s*children\s*\)/u);
});

test("menubar shortcuts align to the far edge of the direct item row", () => {
	assert.match(source, /data-slot="menubar-shortcut"/u);
	assert.match(source, /ml-auto shrink-0 pl-6 text-right/u);
	assert.match(source, /group-data-\[highlighted\]\/menubar-item:text-text-subtle/u);
});

test("menubar selected item icons use the VPK Icon wrapper", () => {
	assert.match(source, /import CheckMarkIcon from "@atlaskit\/icon\/core\/check-mark";/u);
	assert.match(source, /import \{ Icon \} from "@\/components\/ui\/icon";/u);
	assert.match(source, /<MenuPrimitive\.CheckboxItem[\s\S]*<Icon[\s\S]*render=\{<CheckMarkIcon label="" size="small" \/>\s*\}/u);
	assert.match(source, /<MenuPrimitive\.RadioItem[\s\S]*<Icon[\s\S]*render=\{<CheckMarkIcon label="" size="small" \/>\s*\}/u);
});
