import assert from "node:assert/strict";
import test from "node:test";

import { anchorAngles, dampTo, depthOpacity, orbitPoint } from "./cursor-orbit-math.ts";

test("4 agents are 90deg apart in phase", () => {
	// speed:0 isolates the index phase term (tSec contributes equally to all).
	const cfg = { A: 1, B: 1, Z: 1, speed: 0 };
	const thetas = [0, 1, 2, 3].map((index) => {
		const point = orbitPoint(0, index, 4, cfg);
		return Math.atan2(point.dz, point.dx);
	});
	const twoPi = 2 * Math.PI;
	for (let i = 1; i < thetas.length; i += 1) {
		let diff = thetas[i] - thetas[i - 1];
		// Normalize to (-π, π] — atan2 wraps, so a raw subtraction can jump
		// across the -π/π seam even though the underlying phase step is constant.
		diff -= twoPi * Math.round(diff / twoPi);
		assert.ok(Math.abs(Math.abs(diff) - Math.PI / 2) < 1e-9);
	}
});

test("orbit phase is unaffected by which agent index starts the sequence", () => {
	const cfg = { A: 1, B: 1, Z: 1, speed: 0 };
	const p0 = orbitPoint(5, 0, 4, cfg);
	const p4 = orbitPoint(5, 4, 4, cfg);
	assert.ok(Math.abs(p0.dx - p4.dx) < 1e-9);
	assert.ok(Math.abs(p0.dz - p4.dz) < 1e-9);
});

test("depthOpacity clamps to [0.15, 1], 1 at the front apex, 0.15 at the back apex", () => {
	assert.ok(Math.abs(depthOpacity(60, 60) - 1) < 1e-9);
	assert.ok(Math.abs(depthOpacity(-60, 60) - 0.15) < 1e-9);
	assert.equal(depthOpacity(1000, 60), 1);
	assert.equal(depthOpacity(-1000, 60), 0.15);
	assert.ok(Math.abs(depthOpacity(0, 60) - 0.575) < 1e-9);
});

test("anchorAngles is deterministic and evenly spaced", () => {
	const first = anchorAngles(4);
	const second = anchorAngles(4);
	assert.deepEqual(first, second);
	assert.equal(first.length, 4);
	for (let i = 1; i < first.length; i += 1) {
		assert.ok(Math.abs(first[i] - first[i - 1] - Math.PI / 2) < 1e-9);
	}
});

test("dampTo converges monotonically toward the target", () => {
	let current = 0;
	const target = 10;
	let previous = current;
	for (let i = 0; i < 20; i += 1) {
		current = dampTo(current, target, 8, 1 / 60);
		assert.ok(current >= previous);
		assert.ok(current <= target);
		previous = current;
	}
});

test("dampTo is stable at very large dt (snaps to target, no overshoot)", () => {
	assert.equal(dampTo(0, 10, 8, 1e9), 10);
	assert.equal(dampTo(500, -500, 8, 1e12), -500);
});
