const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SELECT_SOURCE = fs.readFileSync(path.join(__dirname, "select.tsx"), "utf8");
const SELECT_DEMO_SOURCE = fs.readFileSync(
	path.join(__dirname, "../website/demos/ui/select-demo.tsx"),
	"utf8",
);

test("SelectItem renders the selected check mark as a trailing affordance", () => {
	assert.match(
		SELECT_SOURCE,
		/dropdownStyles\.selectableItem,\n\t\t\t\t"pr-8 pl-2"/,
	);
	assert.match(
		SELECT_SOURCE,
		/data-slot="select-item-indicator"\n\t\t\t\tclassName="pointer-events-none absolute right-2 inline-flex size-6 items-center justify-center text-icon-selected/,
	);
	assert.doesNotMatch(
		SELECT_SOURCE,
		/<span className=\{dropdownStyles\.indicator\}>[\s\S]*?<SelectPrimitive\.ItemIndicator>/,
	);
	assert.match(
		SELECT_SOURCE,
		/<SelectPrimitive\.ItemText\n\t\t\t\tclassName=\{cn\(\n\t\t\t\t\t"flex min-w-0 flex-1 gap-2 whitespace-nowrap",\n\t\t\t\t\ttextClassName,\n\t\t\t\t\)\}/,
	);
	assert.doesNotMatch(
		SELECT_SOURCE,
		/<SelectPrimitive\.ItemText className="flex flex-1 gap-2 shrink-0 whitespace-nowrap">/,
	);
});

test("SelectTrigger keeps single-line value clamp by default", () => {
	assert.match(SELECT_SOURCE, /whitespace-nowrap/);
	assert.match(SELECT_SOURCE, /\*:data-\[slot=select-value\]:line-clamp-1/);
});

test("SelectContent accepts positionerClassName to raise stacking above dialogs", () => {
	assert.match(
		SELECT_SOURCE,
		/positionerClassName\?: string/,
	);
	assert.match(
		SELECT_SOURCE,
		/className=\{cn\("isolate z-\[200\]", positionerClassName\)\}/,
	);
});

test("SelectContent applies its accessible name to the listbox", () => {
	assert.match(SELECT_SOURCE, /"aria-label": ariaLabel,/);
	assert.match(
		SELECT_SOURCE,
		/<SelectPrimitive\.List aria-label=\{ariaLabel\}>\{children\}<\/SelectPrimitive\.List>/,
	);
});

test("SelectItem supports textClassName for rich multi-line option content", () => {
	assert.match(
		SELECT_SOURCE,
		/textClassName\?: string/,
	);
	assert.match(
		SELECT_SOURCE,
		/<SelectPrimitive\.ItemText\n\t\t\t\tclassName=\{cn\(\n\t\t\t\t\t"flex min-w-0 flex-1 gap-2 whitespace-nowrap",\n\t\t\t\t\ttextClassName,\n\t\t\t\t\)\}/,
	);
	assert.match(
		SELECT_SOURCE,
		/data-slot="select-item-indicator"/,
	);
});

test("subscription plan demo opts out of value clamp for multi-line Item content", () => {
	assert.match(
		SELECT_DEMO_SOURCE,
		/function SelectDemoSubscriptionPlan\(\) \{[\s\S]*?<SelectTrigger className="h-auto! w-96 whitespace-normal \*:data-\[slot=select-value\]:line-clamp-none">/,
	);
});
