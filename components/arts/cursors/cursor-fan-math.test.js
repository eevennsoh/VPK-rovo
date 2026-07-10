import assert from "node:assert/strict";
import test from "node:test";

import {
	buildFanAgents,
	FAN_CENTER_DEG,
	FAN_RADIUS,
	REST_FACING_DEG,
	TILT_TOWARD_OUTWARD,
	fanAgentLaunchDirection,
} from "./cursor-fan-math.ts";

test("fan is symmetric about the center angle (-90deg)", () => {
	const agents = buildFanAgents(4);
	const angles = agents.map((agent) => (Math.atan2(agent.dy, agent.dx) * 180) / Math.PI);
	const mean = angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
	assert.ok(Math.abs(mean - FAN_CENTER_DEG) < 1e-6);
});

test("every agent sits at FAN_RADIUS from the origin", () => {
	const agents = buildFanAgents(4);
	for (const agent of agents) {
		const radius = Math.hypot(agent.dx, agent.dy);
		assert.ok(Math.abs(radius - FAN_RADIUS) < 1e-9);
	}
});

test("rotation follows (angle + 135) * TILT_TOWARD_OUTWARD", () => {
	const agents = buildFanAgents(4);
	for (const agent of agents) {
		const angleDeg = (Math.atan2(agent.dy, agent.dx) * 180) / Math.PI;
		const expected = (angleDeg + 135) * TILT_TOWARD_OUTWARD;
		assert.ok(Math.abs(agent.rotation - expected) < 1e-6);
	}
});

test("launch direction is a unit vector along REST_FACING_DEG + rotation", () => {
	const agents = buildFanAgents(4);
	for (const agent of agents) {
		const { ux, uy } = fanAgentLaunchDirection(agent);
		assert.ok(Math.abs(Math.hypot(ux, uy) - 1) < 1e-9);
		const expectedRad = ((REST_FACING_DEG + agent.rotation) * Math.PI) / 180;
		assert.ok(Math.abs(ux - Math.cos(expectedRad)) < 1e-9);
		assert.ok(Math.abs(uy - Math.sin(expectedRad)) < 1e-9);
	}
});

test("count=1 edge case places the single agent straight up from the origin", () => {
	const agents = buildFanAgents(1);
	assert.equal(agents.length, 1);
	assert.ok(Math.abs(agents[0].dx) < 1e-9);
	assert.ok(Math.abs(agents[0].dy - -FAN_RADIUS) < 1e-9);
});
