const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const BOARD_FILTER_POPOVER_SOURCE = readFileSync(
	join(__dirname, "board-filter-popover.tsx"),
	"utf8",
);

test("Board Filter uses native disabled controls for unavailable actions", () => {
	assert.match(
		BOARD_FILTER_POPOVER_SOURCE,
		/<Button disabled size="compact" variant="ghost">\s*Saved filters/u,
	);
	assert.match(
		BOARD_FILTER_POPOVER_SOURCE,
		/<Button disabled className="mt-1 w-full justify-start" variant="outline">[\s\S]*Add field/u,
	);
	assert.match(
		BOARD_FILTER_POPOVER_SOURCE,
		/<Button disabled size="compact" variant="ghost">[\s\S]*Give feedback/u,
	);
	assert.doesNotMatch(BOARD_FILTER_POPOVER_SOURCE, /\baria-disabled\b/u);
});
