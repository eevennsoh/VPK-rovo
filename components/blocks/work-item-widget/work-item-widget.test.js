const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WORK_ITEM_SOURCE = fs.readFileSync(path.join(__dirname, "components/work-item.tsx"), "utf8");

test("WorkItemRow reuses its due-date formatter across rows", () => {
	assert.match(
		WORK_ITEM_SOURCE,
		/const WORK_ITEM_DUE_DATE_FORMATTER = new Intl\.DateTimeFormat\("en-US", \{ dateStyle: "medium" \}\);/u,
	);
	assert.match(WORK_ITEM_SOURCE, /return WORK_ITEM_DUE_DATE_FORMATTER\.format\(date\);/u);
	assert.doesNotMatch(WORK_ITEM_SOURCE, /return new Intl\.DateTimeFormat\("en-US", \{ dateStyle: "medium" \}\)\.format\(date\);/u);
});
