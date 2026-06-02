const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const REGISTRY_SOURCE = readFileSync(join(__dirname, "registry.tsx"), "utf8");

test("JSON-render table status columns use VPK Lozenge", () => {
	assert.match(REGISTRY_SOURCE, /function isStatusTableColumn/u);
	assert.match(REGISTRY_SOURCE, /return normalizedKey === "status" \|\| normalizedLabel === "status";/u);
	assert.match(
		REGISTRY_SOURCE,
		/<Lozenge variant=\{getWorkflowLozengeVariant\(cellText\)\}>[\s\S]*\{cellText\}[\s\S]*<\/Lozenge>/u,
	);
	assert.match(
		REGISTRY_SOURCE,
		/<TableCell key=\{col\.key\}>\{renderTableCellValue\(row, col\)\}<\/TableCell>/u,
	);
	assert.doesNotMatch(
		REGISTRY_SOURCE,
		/<TableCell key=\{col\.key\}>\{String\(row\[col\.key\] \?\? ""\)\}<\/TableCell>/u,
	);
});
