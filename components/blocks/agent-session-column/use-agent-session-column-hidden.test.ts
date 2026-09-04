import assert from "node:assert/strict";
import test from "node:test";

import {
	forgetHiddenSessionIds,
	pruneHiddenSessionIds,
} from "./use-agent-session-column-hidden.ts";

test("forget drops one hidden id and leaves an unknown id untouched", () => {
	const hiddenIds = new Set(["lw-a", "lw-b"]);

	assert.deepEqual([...forgetHiddenSessionIds(hiddenIds, "lw-a")], ["lw-b"]);
	assert.equal(forgetHiddenSessionIds(hiddenIds, "lw-missing"), hiddenIds);
});

test("prune drops ids that left an authoritative collection", () => {
	const hiddenIds = new Set(["lw-a", "lw-gone"]);

	assert.deepEqual(
		[...pruneHiddenSessionIds(hiddenIds, [{ id: "lw-a" }, { id: "lw-c" }])],
		["lw-a"],
	);
});
