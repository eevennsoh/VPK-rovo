const assert = require("node:assert/strict");
const test = require("node:test");

const { viewportPointFromTarget } = require("./screen-assistant-geometry.ts");

test("viewportPointFromTarget converts a grounded target rect to a viewport center point", () => {
	assert.deepEqual(
		viewportPointFromTarget({
			id: "studio-agent-config:tools",
			fieldId: "tools",
			label: "Add tools",
			rect: {
				x: 20,
				y: 30,
				width: 160,
				height: 40,
			},
		}),
		{
			x: 100,
			y: 50,
			label: "Add tools",
			coordinateSpace: "viewport",
		},
	);
});

test("viewportPointFromTarget falls back to stable target identifiers for labels", () => {
	assert.equal(
		viewportPointFromTarget({
			id: "target-id",
			fieldId: "field-id",
			rect: { x: 0, y: 0, width: 10, height: 10 },
		})?.label,
		"field-id",
	);
	assert.equal(
		viewportPointFromTarget({
			id: "target-id",
			rect: { x: 0, y: 0, width: 10, height: 10 },
		})?.label,
		"target-id",
	);
	assert.equal(
		viewportPointFromTarget({
			rect: { x: 0, y: 0, width: 10, height: 10 },
		})?.label,
		"Target",
	);
});

test("viewportPointFromTarget returns null when no target rect is available", () => {
	assert.equal(viewportPointFromTarget(null), null);
	assert.equal(viewportPointFromTarget({ id: "missing-rect" }), null);
});
