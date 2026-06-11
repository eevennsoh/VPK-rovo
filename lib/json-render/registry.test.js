const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const CATALOG_SOURCE = readFileSync(join(__dirname, "catalog.ts"), "utf8");
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

test("JSON-render Lozenge contract forwards metric prop", () => {
	assert.match(
		CATALOG_SOURCE,
		/Lozenge: \{[\s\S]*metric: z\.union\(\[z\.string\(\), z\.number\(\)\]\)\.nullable\(\),[\s\S]*example: \{ text: "In Review", variant: "information", isBold: true, metric: "0\.5" \}/u,
	);
	assert.match(
		REGISTRY_SOURCE,
		/const \{ text, variant, isBold = false, metric \} = props;/u,
	);
	assert.match(
		REGISTRY_SOURCE,
		/const safeMetric = typeof metric === "number" \? metric : toSafeOptionalText\(metric\);/u,
	);
	assert.match(
		REGISTRY_SOURCE,
		/<Lozenge variant=\{normalizedVariant\} isBold=\{isBold\} metric=\{safeMetric\}>/u,
	);
});
