import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inlineIcon } from "./icons.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SELECTOR_UTILS_PATH = path.join(__dirname, "..", "assets", "selector", "core-utils.js");
const START = "\t// SELECTOR_ICONS:start";
const END = "\t// SELECTOR_ICONS:end";

const SELECTOR_ICONS = [
	["chevronUp", "chevron-up"],
	["chevronDown", "chevron-down"],
	["comment", "comment"],
	["copy", "copy"],
	["cursor", "cursor"],
	["send", "send"],
];

export function buildSelectorIconsBlock() {
	const lines = [
		START,
		"\tvar SELECTOR_ICONS = {",
	];
	for (const [key, iconName] of SELECTOR_ICONS) {
		lines.push(`\t\t${key}: ${JSON.stringify(inlineIcon(iconName, { size: 12 }))},`);
	}
	lines.push("\t};", END);
	return lines.join("\n");
}

export function syncSelectorIcons({
	filePath = SELECTOR_UTILS_PATH,
	check = false,
} = {}) {
	const source = fs.readFileSync(filePath, "utf8");
	const nextBlock = buildSelectorIconsBlock();
	const markerPattern = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`, "u");
	const legacyPattern = /\tvar SELECTOR_ICONS = \{[\s\S]*?\n\t\};/u;
	const nextSource = markerPattern.test(source)
		? source.replace(markerPattern, nextBlock)
		: source.replace(legacyPattern, nextBlock);

	if (nextSource === source) {
		return { changed: false, filePath };
	}
	if (check) {
		throw new Error("selector icons are out of sync; run node .agents/skills/vpk-html/scripts/sync-selector-icons.mjs");
	}
	fs.writeFileSync(filePath, nextSource);
	return { changed: true, filePath };
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

if (process.argv[1] === __filename) {
	const check = process.argv.includes("--check");
	const result = syncSelectorIcons({ check });
	if (result.changed) {
		console.log(`updated ${path.relative(process.cwd(), result.filePath)}`);
	} else {
		console.log("selector icons already in sync");
	}
}
