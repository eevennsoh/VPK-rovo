const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const hookPath = path.join(process.cwd(), "components/hooks/use-has-vertical-overflow.ts");

async function loadOverflowHarness() {
	return import(pathToFileURL(hookPath).href);
}

test("useHasVerticalOverflow does not update state after every render", () => {
	const source = fs.readFileSync(hookPath, "utf8");

	assert.doesNotMatch(
		source,
		/useEffect\(\(\) => \{\s*updateScrollState\(\);\s*\}\);/,
		"an effect without dependencies creates a setState-render loop",
	);
});

test("VerticalOverflowState does not show masks for one-pixel layout jitter", async () => {
	const { getVerticalOverflowState } = await loadOverflowHarness();

	const state = getVerticalOverflowState({
		clientHeight: 80,
		maxHeight: 80,
		scrollHeight: 81,
		scrollTop: 0,
	});

	assert.equal(state.hasReachedVerticalLimit, true);
	assert.equal(state.hasVerticalOverflow, false);
	assert.equal(state.showTopScrollMask, false);
	assert.equal(state.showBottomScrollMask, false);
});

test("VerticalOverflowState shows the lower mask until the user reaches the bottom", async () => {
	const { getVerticalOverflowState } = await loadOverflowHarness();

	const atTop = getVerticalOverflowState({
		clientHeight: 80,
		maxHeight: 80,
		scrollHeight: 160,
		scrollTop: 0,
	});
	const nearBottom = getVerticalOverflowState({
		clientHeight: 80,
		maxHeight: 80,
		scrollHeight: 160,
		scrollTop: 79,
	});

	assert.equal(atTop.hasVerticalOverflow, true);
	assert.equal(atTop.hasScrolledFromTop, false);
	assert.equal(atTop.hasScrolledToBottom, false);
	assert.equal(atTop.showTopScrollMask, false);
	assert.equal(atTop.showBottomScrollMask, true);
	assert.equal(nearBottom.hasScrolledFromTop, true);
	assert.equal(nearBottom.hasScrolledToBottom, true);
	assert.equal(nearBottom.showTopScrollMask, true);
	assert.equal(nearBottom.showBottomScrollMask, false);
});

test("VerticalOverflowState requires a finite max height before reporting a reached limit", async () => {
	const { getVerticalOverflowState } = await loadOverflowHarness();

	assert.equal(
		getVerticalOverflowState({
			clientHeight: 80,
			maxHeight: Number.NaN,
			scrollHeight: 160,
			scrollTop: 0,
		}).hasReachedVerticalLimit,
		false,
	);
	assert.equal(
		getVerticalOverflowState({
			clientHeight: 80,
			maxHeight: 80,
			scrollHeight: 160,
			scrollTop: 0,
		}).hasReachedVerticalLimit,
		true,
	);
});
