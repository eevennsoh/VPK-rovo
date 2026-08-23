const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GUI_SOURCE = fs.readFileSync(path.join(__dirname, "gui-components.tsx"), "utf8");
const GUI_API_SOURCE = fs.readFileSync(path.join(__dirname, "gui.ts"), "utf8");

test("GUI.Panel gives every open control panel a spaced inner scroll area", () => {
	assert.match(GUI_SOURCE, /data-gui-panel-scroll="true"/);
	assert.match(GUI_SOURCE, /max-h-\[min\(48svh,32rem\)\] space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain py-1 pr-2 pl-1/);
	assert.match(GUI_SOURCE, /\{open \? \(\s*<div[\s\S]+data-gui-panel-scroll="true"[\s\S]+\{children\}/);
});

test("GUI.Control does not add side insets around slider controls", () => {
	assert.doesNotMatch(GUI_SOURCE, /<Slider[\s\S]+aria-label=\{label\}[\s\S]+className="px-2"/);
	assert.match(GUI_SOURCE, /"flex justify-between font-mono/);
	assert.doesNotMatch(GUI_SOURCE, /"flex justify-between px-2 font-mono/);
});

test("GUI disclosure buttons expose expanded state to assistive tech", () => {
	assert.match(
		GUI_SOURCE,
		/aria-label=\{open \? "Collapse controls" : "Expand controls"\}\s+aria-expanded=\{open\}/,
	);
	assert.match(
		GUI_SOURCE,
		/<button\s+type="button"\s+aria-expanded=\{open\}\s+onClick=\{\(\) => setOpen\(\(prev\) => !prev\)\}/,
	);
});

test("GUI exports the full shared control surface", () => {
	for (const componentName of [
		"ColorInput",
		"ColorList",
		"Control",
		"ImageInput",
		"Panel",
		"PercentControl",
		"RgbaColorInput",
		"Section",
		"SegmentedControl",
		"Select",
		"SwatchGroup",
		"TextInput",
		"Toggle",
	]) {
		assert.match(GUI_API_SOURCE, new RegExp(`${componentName}: GUI`));
	}

	for (const typeName of [
		"GUIColorInputProps",
		"GUIColorListProps",
		"GUIImageInputProps",
		"GUIPercentControlProps",
		"GUIRgbaColorInputProps",
		"GUISelectOption",
		"GUISegmentedControlProps",
		"GUISwatchGroupProps",
	]) {
		assert.match(GUI_SOURCE, new RegExp(`export type ${typeName}`));
	}
});

test("GUI.Panel exposes the optional play action", () => {
	assert.match(GUI_SOURCE, /onPlay\?: \(\) => void;/);
	assert.match(GUI_SOURCE, /playLabel\?: string;/);
	assert.match(GUI_SOURCE, /playLabel = "Replay"/);
	assert.match(GUI_SOURCE, /aria-label=\{playLabel\}/);
	assert.match(GUI_SOURCE, /onClick=\{onPlay\}/);
	assert.match(GUI_SOURCE, /RefreshIcon/);
});

test("GUI.ColorInput buffers partial hex values but commits CSS strings immediately", () => {
	assert.match(GUI_SOURCE, /const \[textDraft, setTextDraft\] = useState<string \| null>\(null\);/);
	assert.match(GUI_SOURCE, /const displayValue = textDraft \?\? value;/);
	assert.match(GUI_SOURCE, /format\?: "hex" \| "css";/);
	assert.match(
		GUI_SOURCE,
		/function commitTextValue\(nextValue: string\) \{\n\t\tsetTextDraft\(nextValue\);\n\t\tif \(format === "css" \|\| isGUIHexColor\(nextValue\)\) \{/,
	);
	assert.match(GUI_SOURCE, /value=\{displayValue\}/);
	assert.match(GUI_SOURCE, /onFocus=\{\(\) => \{\n\t\t\t\t\t\tsetTextDraft\(value\);/);
	assert.match(GUI_SOURCE, /onBlur=\{\(\) => \{\n\t\t\t\t\t\tsetTextDraft\(null\);/);
});

test("GUI.Select owns enriched option metadata and default resets", () => {
	assert.match(GUI_SOURCE, /description\?: string;\n\tmeta\?: string;\n\tswatch\?: string;/);
	assert.match(GUI_SOURCE, /defaultValue\?: T;/);
	assert.match(GUI_SOURCE, /option\.swatch/);
	assert.match(GUI_SOURCE, /option\.description/);
	assert.match(GUI_SOURCE, /option\.meta/);
	assert.match(GUI_SOURCE, /showDetails = true/);
	assert.match(GUI_SOURCE, /<GUISelectOptionContent option=\{selectedOption\} showDetails=\{false\} \/>/);
	assert.match(GUI_SOURCE, /Reset \$\{label\}/);
	assert.match(GUI_SOURCE, /default \$\{defaultOption\.label\}/);
});

test("GUI.ImageInput and GUI.SwatchGroup cover shared upload and multi-swatch controls", () => {
	assert.match(GUI_SOURCE, /accept = "image\/\*"/);
	assert.match(GUI_SOURCE, /previewType\?: "image" \| "video";/);
	assert.match(GUI_SOURCE, /previewType === "video"/);
	assert.match(GUI_SOURCE, /VideoIcon/);
	assert.doesNotMatch(GUI_SOURCE, /previewType === "video" \? \(\n\t\t\t\t\t<video/);
	assert.match(GUI_SOURCE, /onFile\?: \(file: File\) => void \| Promise<void>;/);
	assert.match(GUI_SOURCE, /onClear\?: \(\) => void;/);
	assert.match(GUI_SOURCE, /URL\.createObjectURL\(file\)/);
	assert.match(GUI_SOURCE, /minSelected = 0/);
	assert.match(GUI_SOURCE, /options\s*\n\t\t\t\t\.filter\(\(option\) =>/);
	assert.match(GUI_SOURCE, /selected\s*\n\t\t\t\t\t\t\t\t\t\? "border-text"\n\t\t\t\t\t\t\t\t\t: "border-transparent opacity-40 hover:opacity-100"/);
	assert.doesNotMatch(GUI_SOURCE, /selected\s*\n\t\t\t\t\t\t\t\t\t\? "border-text shadow-sm"/);
});
