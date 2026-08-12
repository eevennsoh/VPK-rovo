const assert = require("node:assert/strict");
const test = require("node:test");

async function loadActiveChapter() {
	return import("./pull-request-guide-active-chapter.ts");
}

test("resolveActiveChapterId picks the last chapter whose top crossed the activation line", async () => {
	const { resolveActiveChapterId } = await loadActiveChapter();
	const tops = {
		"start-guest-checkout": 100,
		"server-owned-order": 400,
		"recover-and-verify": 900,
	};

	assert.equal(
		resolveActiveChapterId({
			activationOffset: 80,
			chapterIds: Object.keys(tops),
			getChapterTop: (id) => tops[id] ?? null,
			maxScrollTop: 1200,
			scrollTop: 0,
		}),
		"start-guest-checkout",
	);

	assert.equal(
		resolveActiveChapterId({
			activationOffset: 80,
			chapterIds: Object.keys(tops),
			getChapterTop: (id) => tops[id] ?? null,
			maxScrollTop: 1200,
			scrollTop: 350,
		}),
		"server-owned-order",
	);

	assert.equal(
		resolveActiveChapterId({
			activationOffset: 80,
			chapterIds: Object.keys(tops),
			getChapterTop: (id) => tops[id] ?? null,
			maxScrollTop: 1200,
			scrollTop: 840,
		}),
		"recover-and-verify",
	);
});

test("resolveActiveChapterId forces the last chapter near max scroll even when it cannot reach the activation line", async () => {
	const { CHAPTER_BOTTOM_SNAP_PX, resolveActiveChapterId } = await loadActiveChapter();
	const tops = {
		"start-guest-checkout": 100,
		"server-owned-order": 400,
		"recover-and-verify": 900,
	};

	// Last chapter top (900) is still below activation (scrollTop 700 + 80 = 780),
	// so ratio/top spies would keep chapter 2 without the bottom snap.
	assert.equal(
		resolveActiveChapterId({
			activationOffset: 80,
			chapterIds: Object.keys(tops),
			getChapterTop: (id) => tops[id] ?? null,
			maxScrollTop: 700,
			scrollTop: 700 - CHAPTER_BOTTOM_SNAP_PX,
		}),
		"recover-and-verify",
	);
});

test("resolveActiveChapterId stays on the first chapter when tops are unmeasured duplicates", async () => {
	const { resolveActiveChapterId } = await loadActiveChapter();
	const tops = {
		"start-guest-checkout": 0,
		"server-owned-order": 0,
		"recover-and-verify": 0,
	};

	assert.equal(
		resolveActiveChapterId({
			activationOffset: 80,
			chapterIds: Object.keys(tops),
			getChapterTop: (id) => tops[id] ?? null,
			maxScrollTop: 2,
			scrollTop: 0,
		}),
		"start-guest-checkout",
	);
});

test("buildChapterJumpTarget accounts for sticky header and clamps to max scroll", async () => {
	const { CHAPTER_SCROLL_GAP_PX, buildChapterJumpTarget } = await loadActiveChapter();

	const scrollContainer = {
		clientHeight: 500,
		scrollHeight: 1000,
		scrollTop: 200,
		getBoundingClientRect: () => ({ top: 0, bottom: 500, left: 0, right: 400 }),
		querySelector: () => ({
			getBoundingClientRect: () => ({ top: 0, bottom: 64, left: 0, right: 400 }),
		}),
	};
	const chapterElement = {
		getBoundingClientRect: () => ({ top: 300, bottom: 500, left: 0, right: 400 }),
	};

	assert.equal(
		buildChapterJumpTarget(scrollContainer, chapterElement),
		200 + (300 - 64) - CHAPTER_SCROLL_GAP_PX,
	);

	const shortContainer = {
		...scrollContainer,
		clientHeight: 500,
		scrollHeight: 520,
		scrollTop: 0,
	};
	assert.equal(
		buildChapterJumpTarget(shortContainer, chapterElement),
		20,
	);
});
