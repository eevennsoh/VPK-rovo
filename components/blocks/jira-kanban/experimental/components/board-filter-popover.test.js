const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const BOARD_FILTER_POPOVER_SOURCE = readFileSync(
	join(__dirname, "board-filter-popover.tsx"),
	"utf8",
);

test("Board Filter shows Add field as a live-looking control, not a dimmed one", () => {
	// The row is inert chrome, but it must not read as unavailable: native
	// `disabled` would dim it to the disabled opacity and drop it from the tab
	// order. `aria-disabled` keeps full contrast and keyboard reach while still
	// announcing the action is unavailable.
	assert.match(
		BOARD_FILTER_POPOVER_SOURCE,
		/<Button aria-disabled className="mt-1 w-full justify-start" variant="ghost">[\s\S]*Add field/u,
	);
	assert.doesNotMatch(
		BOARD_FILTER_POPOVER_SOURCE,
		/<Button disabled className="mt-1 w-full justify-start"/u,
	);
});

test("Board Filter keeps native disabled for the genuinely unavailable actions", () => {
	// Clear all and the value-panel Apply are real actions that are simply not
	// available yet, so they stay natively disabled and derive it from state.
	assert.match(BOARD_FILTER_POPOVER_SOURCE, /disabled=\{!hasSelection\}/u);
	assert.match(BOARD_FILTER_POPOVER_SOURCE, /disabled=\{selectedField === "days" \?/u);
});

test("Board Filter drops the saved-filters header and the feedback footer", () => {
	assert.doesNotMatch(BOARD_FILTER_POPOVER_SOURCE, /Saved filters/u);
	assert.doesNotMatch(BOARD_FILTER_POPOVER_SOURCE, /Give feedback/u);
	// Both bars are gone, so their icons must not linger as unused imports.
	assert.doesNotMatch(BOARD_FILTER_POPOVER_SOURCE, /ChevronDownIcon|MegaphoneIcon/u);
});
