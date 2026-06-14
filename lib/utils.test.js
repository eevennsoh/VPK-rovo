const test = require("node:test");
const assert = require("node:assert/strict");

const { sortByUpdatedAtDesc } = require("./utils.ts");

test("sortByUpdatedAtDesc sorts newest records first without mutating input", () => {
	const oldest = { id: "oldest", updatedAt: "2026-03-09T10:00:00.000Z" };
	const newest = { id: "newest", updatedAt: "2026-03-09T10:30:00.000Z" };
	const middle = { id: "middle", updatedAt: "2026-03-09T10:10:00.000Z" };
	const items = [oldest, newest, middle];

	const sortedItems = sortByUpdatedAtDesc(items);

	assert.deepEqual(sortedItems, [newest, middle, oldest]);
	assert.deepEqual(items, [oldest, newest, middle]);
	assert.equal(sortedItems[0], newest);
	assert.equal(sortedItems[1], middle);
	assert.equal(sortedItems[2], oldest);
});
