import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildSelectorIconsBlock } from "./sync-selector-icons.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("selector icon block is generated from AtlasKit glyphs", () => {
	const utilsPath = path.join(__dirname, "..", "assets", "selector", "core-utils.js");
	const source = fs.readFileSync(utilsPath, "utf8");
	const expected = buildSelectorIconsBlock();
	const iconBlock = source.match(/\/\/ SELECTOR_ICONS:start[\s\S]*\/\/ SELECTOR_ICONS:end/u)?.[0] ?? "";

	assert.match(source, /\/\/ SELECTOR_ICONS:start[\s\S]*\/\/ SELECTOR_ICONS:end/u);
	assert.match(iconBlock, /chevronUp/u);
	assert.match(iconBlock, /chevronDown/u);
	assert.match(iconBlock, /fill=\\"currentColor\\"/u);
	assert.doesNotMatch(iconBlock, /stroke-width/u);
	assert.ok(
		source.includes(expected),
		"selector icons are out of sync; run node .agents/skills/vpk-html/scripts/sync-selector-icons.mjs",
	);
});
