const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

const SOURCE = readProjectFile("components/ui-custom/rich-text-editor/mention-visual.tsx");

// Isolate the `logo` branch INSIDE the RichTextMentionVisualMark renderer so the
// assertions describe the inline tag/pill treatment specifically. The `menu`
// size keeps its own bordered IconTile and must NOT be affected by these checks.
function getMarkLogoBranchSource() {
	const markStart = SOURCE.indexOf("export function RichTextMentionVisualMark");
	assert.ok(markStart > -1, "expected to locate RichTextMentionVisualMark");
	const start = SOURCE.indexOf('if (visual.kind === "logo")', markStart);
	const end = SOURCE.indexOf('if (visual.kind === "icon")', start);
	assert.ok(start > -1 && end > start, "expected to locate the logo render branch");
	return SOURCE.slice(start, end);
}

// The inline (non-menu) return is whatever follows the closing of the
// `if (isMenu) { ... }` block within the logo branch.
function getInlineLogoReturn() {
	const logoBranch = getMarkLogoBranchSource();
	const menuIndex = logoBranch.indexOf("if (isMenu)");
	assert.ok(menuIndex > -1, "expected an isMenu guard before the inline return");
	const inlineReturnIndex = logoBranch.indexOf("\t\treturn (", menuIndex);
	assert.ok(inlineReturnIndex > -1, "expected an inline return after the menu guard");
	return logoBranch.slice(inlineReturnIndex);
}

test("inline logo chips use the transparent IconTile front-slot treatment", () => {
	const inlineReturn = getInlineLogoReturn();

	assert.match(inlineReturn, /<IconTile/u);
	assert.match(inlineReturn, /variant="transparent"/u);
	assert.match(inlineReturn, /size="xxsmall"/u);
});

test("inline logo chips no longer render a bordered/rounded bare-span container", () => {
	const inlineReturn = getInlineLogoReturn();
	// The old treatment wrapped the logo in a `rounded-xs overflow-hidden` span,
	// which read as a framed 1px container. The transparent IconTile must replace
	// it entirely for inline chips.
	assert.doesNotMatch(
		inlineReturn,
		/overflow-hidden rounded-xs/u,
		"inline logo chips must not use the legacy bordered bare-span treatment",
	);
});
