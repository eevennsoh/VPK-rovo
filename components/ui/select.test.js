const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SELECT_SOURCE = fs.readFileSync(path.join(__dirname, "select.tsx"), "utf8");

test("SelectItem renders the selected check mark as a trailing affordance", () => {
	assert.match(
		SELECT_SOURCE,
		/dropdownStyles\.selectableItem,\n\t\t\t\t"pr-8 pl-2"/,
	);
	assert.match(
		SELECT_SOURCE,
		/<span className="pointer-events-none absolute right-2 inline-flex size-6 items-center justify-center text-icon-selected/,
	);
	assert.doesNotMatch(
		SELECT_SOURCE,
		/<span className=\{dropdownStyles\.indicator\}>[\s\S]*?<SelectPrimitive\.ItemIndicator>/,
	);
	assert.match(
		SELECT_SOURCE,
		/<SelectPrimitive\.ItemText className="flex min-w-0 flex-1 gap-2 whitespace-nowrap">/,
	);
	assert.doesNotMatch(
		SELECT_SOURCE,
		/<SelectPrimitive\.ItemText className="flex flex-1 gap-2 shrink-0 whitespace-nowrap">/,
	);
});
