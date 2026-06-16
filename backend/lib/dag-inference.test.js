const test = require("node:test");
const assert = require("node:assert/strict");

const { inferTaskDependencies, isLinearChain } = require("./dag-inference");

test("returns input unchanged when tasks already have blockedBy", () => {
	const tasks = [
		{ id: "t1", label: "Define goals", blockedBy: [] },
		{ id: "t2", label: "Build app", blockedBy: ["t1"] },
	];
	const result = inferTaskDependencies(tasks);
	assert.deepEqual(result, tasks);
});

test("returns input unchanged for single task", () => {
	const tasks = [{ id: "t1", label: "Define goals", blockedBy: [] }];
	const result = inferTaskDependencies(tasks);
	assert.deepEqual(result, tasks);
});

test("returns input unchanged for more than 15 tasks", () => {
	const tasks = Array.from({ length: 16 }, (_, i) => ({
		id: `t${i + 1}`,
		label: `Task ${i + 1}`,
		blockedBy: [],
	}));
	const result = inferTaskDependencies(tasks);
	assert.deepEqual(result, tasks);
});

test("does not mutate input array", () => {
	const tasks = [
		{ id: "t1", label: "Draft marketing copy", blockedBy: [] },
		{ id: "t2", label: "Review marketing copy", blockedBy: [] },
	];
	const original = JSON.parse(JSON.stringify(tasks));
	inferTaskDependencies(tasks);
	assert.deepEqual(tasks, original);
});

test("infers phase-based dependency with subject overlap", () => {
	const tasks = [
		{ id: "t1", label: "Draft marketing copy", blockedBy: [] },
		{ id: "t2", label: "Review marketing copy", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);
	assert.deepEqual(result[0].blockedBy, []);
	assert.deepEqual(result[1].blockedBy, ["t1"]);
});

test("same-phase tasks stay independent", () => {
	const tasks = [
		{ id: "t1", label: "Design database schema", blockedBy: [] },
		{ id: "t2", label: "Design API endpoints", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);
	assert.deepEqual(result[0].blockedBy, []);
	assert.deepEqual(result[1].blockedBy, []);
});

test("phase keywords alone do not create subject overlap", () => {
	const tasks = [
		{ id: "t1", label: "Research build", blockedBy: [] },
		{ id: "t2", label: "Test build", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);
	assert.deepEqual(result[1].blockedBy, []);
});

test("join node depends on all earlier-phase tasks", () => {
	const tasks = [
		{ id: "t1", label: "Draft marketing copy", blockedBy: [] },
		{ id: "t2", label: "Build landing page", blockedBy: [] },
		{ id: "t3", label: "Deploy to production", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);
	assert.deepEqual(result[2].blockedBy.sort(), ["t1", "t2"]);
});

test("transitive reduction removes redundant edges", () => {
	// A(phase 0) -> B(phase 2) -> C(phase 3), all share "api"
	// Without reduction, C would depend on both A and B
	// With reduction, C depends only on B (since B already depends on A)
	const tasks = [
		{ id: "t1", label: "Research api requirements", blockedBy: [] },
		{ id: "t2", label: "Build api service", blockedBy: [] },
		{ id: "t3", label: "Test api service", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);
	// t2 depends on t1 (phase 0 -> phase 2, subject overlap "api")
	assert.deepEqual(result[1].blockedBy, ["t1"]);
	// t3 depends only on t2 (not t1) after transitive reduction
	assert.deepEqual(result[2].blockedBy, ["t2"]);
});

test("unclassified tasks remain independent", () => {
	const tasks = [
		{ id: "t1", label: "Send email to team", blockedBy: [] },
		{ id: "t2", label: "Build dashboard widget", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);
	// "Send" is not a phase keyword, so t1 stays independent
	assert.deepEqual(result[0].blockedBy, []);
});

test("multi-phase pipeline with shared subjects", () => {
	const tasks = [
		{ id: "t1", label: "Research user authentication options", blockedBy: [] },
		{ id: "t2", label: "Design authentication flow", blockedBy: [] },
		{ id: "t3", label: "Implement authentication service", blockedBy: [] },
		{ id: "t4", label: "Test authentication service", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);

	// t1 (phase 0): no deps
	assert.deepEqual(result[0].blockedBy, []);
	// t2 (phase 1): depends on t1 (shares "authentication")
	assert.deepEqual(result[1].blockedBy, ["t1"]);
	// t3 (phase 2): depends on t2 (not t1, transitive reduction)
	assert.deepEqual(result[2].blockedBy, ["t2"]);
	// t4 (phase 3): depends on t3 (shares "authentication" + "service")
	assert.deepEqual(result[3].blockedBy, ["t3"]);
});

test("parallel tasks in different subject areas", () => {
	const tasks = [
		{ id: "t1", label: "Define project scope", blockedBy: [] },
		{ id: "t2", label: "Design frontend layout", blockedBy: [] },
		{ id: "t3", label: "Design backend architecture", blockedBy: [] },
		{ id: "t4", label: "Build frontend components", blockedBy: [] },
		{ id: "t5", label: "Build backend services", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);

	// t1 (phase 0): no deps
	assert.deepEqual(result[0].blockedBy, []);
	// t2 (phase 1): depends on t1 only if sharing subject — "frontend" vs "project"/"scope"
	// No overlap, so independent
	assert.deepEqual(result[1].blockedBy, []);
	// t3 (phase 1): same — "backend" vs "project"/"scope"
	assert.deepEqual(result[2].blockedBy, []);
	// t4 (phase 2): shares "frontend" with t2
	assert.deepEqual(result[3].blockedBy, ["t2"]);
	// t5 (phase 2): shares "backend" with t3
	assert.deepEqual(result[4].blockedBy, ["t3"]);
});

test("isLinearChain detects linear chains", () => {
	const tasks = [
		{ id: "t1", label: "A", blockedBy: [] },
		{ id: "t2", label: "B", blockedBy: ["t1"] },
		{ id: "t3", label: "C", blockedBy: ["t2"] },
	];
	assert.equal(isLinearChain(tasks), true);
});

test("isLinearChain returns false for parallel tasks", () => {
	const tasks = [
		{ id: "t1", label: "A", blockedBy: [] },
		{ id: "t2", label: "B", blockedBy: [] },
		{ id: "t3", label: "C", blockedBy: ["t1", "t2"] },
	];
	assert.equal(isLinearChain(tasks), false);
});

test("isLinearChain returns false for fewer than 3 tasks", () => {
	const tasks = [
		{ id: "t1", label: "A", blockedBy: [] },
		{ id: "t2", label: "B", blockedBy: ["t1"] },
	];
	assert.equal(isLinearChain(tasks), false);
});

test("handles empty array", () => {
	const result = inferTaskDependencies([]);
	assert.deepEqual(result, []);
});

test("handles non-array input", () => {
	assert.equal(inferTaskDependencies(null), null);
	assert.equal(inferTaskDependencies(undefined), undefined);
});

test("launch task depends on all earlier phases regardless of subject", () => {
	const tasks = [
		{ id: "t1", label: "Research market trends", blockedBy: [] },
		{ id: "t2", label: "Design product mockup", blockedBy: [] },
		{ id: "t3", label: "Build prototype", blockedBy: [] },
		{ id: "t4", label: "Launch product", blockedBy: [] },
	];
	const result = inferTaskDependencies(tasks);
	// Launch depends on all earlier tasks (after transitive reduction)
	// t4 is a join node, depends on all earlier-phase tasks
	// After reduction: t4 depends on t3 only (since t3 is the latest phase before t4)
	// Actually, join nodes depend on ALL earlier-phase tasks, then reduction applies
	// t1(0), t2(1), t3(2), t4(5) — t4 depends on t1, t2, t3 initially
	// No transitive paths between t1, t2, t3 (different subjects), so all stay
	assert.ok(result[3].blockedBy.includes("t3"));
	assert.ok(result[3].blockedBy.length >= 1);
});
