const assert = require("node:assert/strict");
const test = require("node:test");

const { resolveMagneticPointerRelation } = require("../../../../ui-custom/hooks/magnetic-proximity-model.ts");

const {
	CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,
	distanceFromPointToRect,
	resolveExclusiveProximityWinner,
} = require("./create-work-item-exclusive-proximity.ts");

const LEFT = {
	id: "To do",
	rect: { bottom: 624, left: 100, right: 360, top: 600 },
};
const RIGHT = {
	id: "In progress",
	rect: { bottom: 624, left: 376, right: 636, top: 600 },
};

test("create-well hover pad stays 120px so adjacent columns can overlap", () => {
	assert.equal(CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX, 120);
});

test("distance to a rect is zero inside and Euclidean to the nearest edge outside", () => {
	assert.equal(distanceFromPointToRect({ x: 200, y: 612 }, LEFT.rect), 0);
	assert.equal(distanceFromPointToRect({ x: 100, y: 580 }, LEFT.rect), 20);
	assert.equal(distanceFromPointToRect({ x: 368, y: 612 }, LEFT.rect), 8);
});

test("a pointer near only one well selects that well", () => {
	assert.equal(
		resolveExclusiveProximityWinner({ x: 200, y: 500 }, [LEFT, RIGHT]),
		"To do",
	);
	assert.equal(
		resolveExclusiveProximityWinner({ x: 500, y: 500 }, [LEFT, RIGHT]),
		"In progress",
	);
});

test("exclusive candidates match the shared magnetic outside/near/target halo", () => {
	const pointer = { x: 200, y: 500 };
	assert.equal(resolveMagneticPointerRelation(pointer, LEFT.rect, 120), "near");
	assert.equal(resolveMagneticPointerRelation(pointer, RIGHT.rect, 120), "outside");
	assert.equal(resolveExclusiveProximityWinner(pointer, [LEFT, RIGHT]), "To do");
});

test("a pointer outside every 120px halo selects none", () => {
	assert.equal(
		resolveExclusiveProximityWinner({ x: 200, y: 400 }, [LEFT, RIGHT]),
		null,
	);
});

test("overlapping halos pick the well whose actual rect is closer", () => {
	// Midway between the two resting wells is 8px from each edge; the 120px
	// pads overlap. Nudge toward the right well so it must win.
	assert.equal(
		resolveExclusiveProximityWinner({ x: 370, y: 612 }, [LEFT, RIGHT]),
		"In progress",
	);
	assert.equal(
		resolveExclusiveProximityWinner({ x: 366, y: 612 }, [LEFT, RIGHT]),
		"To do",
	);
});

test("equal distance prefers the leftmost well, then first registered", () => {
	const midpoint = { x: 368, y: 612 };
	assert.equal(distanceFromPointToRect(midpoint, LEFT.rect), 8);
	assert.equal(distanceFromPointToRect(midpoint, RIGHT.rect), 8);
	assert.equal(resolveExclusiveProximityWinner(midpoint, [RIGHT, LEFT]), "To do");

	const stacked = {
		id: "Later",
		rect: { bottom: 624, left: 100, right: 360, top: 600 },
	};
	assert.equal(
		resolveExclusiveProximityWinner({ x: 200, y: 612 }, [LEFT, stacked]),
		"To do",
	);
});
