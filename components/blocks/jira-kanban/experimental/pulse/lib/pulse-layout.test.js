const assert = require("node:assert/strict");
const test = require("node:test");

async function loadLayout() {
	return import("./pulse-layout.ts");
}

test("Pulse work-rail max width keeps the article and scrubber above their minima", async () => {
	const {
		PULSE_ARTICLE_MIN_WIDTH_PX,
		PULSE_INSIGHTS_GUTTER_PX,
		PULSE_SCRUBBER_WIDTH_PX,
		PULSE_WORK_RAIL_MIN_WIDTH_PX,
		resolvePulseWorkRailMaxWidth,
	} = await loadLayout();
	const reserved = PULSE_SCRUBBER_WIDTH_PX + PULSE_ARTICLE_MIN_WIDTH_PX + PULSE_INSIGHTS_GUTTER_PX;

	assert.equal(resolvePulseWorkRailMaxWidth(1400), 1400 - reserved);
	assert.equal(resolvePulseWorkRailMaxWidth(PULSE_WORK_RAIL_MIN_WIDTH_PX), PULSE_WORK_RAIL_MIN_WIDTH_PX);
	assert.equal(
		resolvePulseWorkRailMaxWidth(PULSE_WORK_RAIL_MIN_WIDTH_PX + reserved),
		PULSE_WORK_RAIL_MIN_WIDTH_PX,
	);
});

test("Pulse embedded chat header class matches the insight eyebrow inset", async () => {
	const { PULSE_EMBEDDED_CHAT_HEADER_CLASS } = await loadLayout();
	assert.equal(PULSE_EMBEDDED_CHAT_HEADER_CLASS, "h-6 px-1 py-0");
});
