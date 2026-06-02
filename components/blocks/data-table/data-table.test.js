const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const DATA_TABLE_SOURCE = readFileSync(
	join(__dirname, "components", "data-table.tsx"),
	"utf8",
);

test("data table status column uses VPK Lozenge", () => {
	assert.match(
		DATA_TABLE_SOURCE,
		/import \{ Lozenge \} from "@\/components\/ui\/lozenge"/u,
	);
	assert.match(
		DATA_TABLE_SOURCE,
		/import \{ getWorkflowLozengeVariant \} from "@\/lib\/workflow-status"/u,
	);
	assert.match(
		DATA_TABLE_SOURCE,
		/<Lozenge variant=\{getWorkflowLozengeVariant\(row\.original\.status\)\}>[\s\S]*\{row\.original\.status\}[\s\S]*<\/Lozenge>/u,
	);
	assert.doesNotMatch(DATA_TABLE_SOURCE, /CircleCheckIcon/u);
	assert.doesNotMatch(DATA_TABLE_SOURCE, /fill-green-500/u);
});
