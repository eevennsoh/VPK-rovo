const test = require("node:test");
const assert = require("node:assert/strict");
const {
	DEFAULT_TOOL_CALL_DELAY_MS,
	DEFAULT_TOOL_CALL_DELAY_RANGE_MS,
	createThinkingEventPart,
	writeThinkingTraceSteps,
	__internals: { getRandomizedDelayMs, normalizeDelayRange, resolveToolCallDelayMs },
} = require("./thinking-trace-writer");

function createCapturingWriter() {
	const parts = [];
	return {
		parts,
		write(part) {
			parts.push(part);
		},
	};
}

test("default tool-call delay range is exported as a slower readable cadence", () => {
	assert.equal(typeof DEFAULT_TOOL_CALL_DELAY_MS, "number");
	assert.equal(DEFAULT_TOOL_CALL_DELAY_MS, 2300);
	assert.deepEqual(DEFAULT_TOOL_CALL_DELAY_RANGE_MS, { min: 1800, max: 2800 });
});

test("getRandomizedDelayMs picks a bounded duration from the configured range", () => {
	assert.equal(getRandomizedDelayMs({ min: 1800, max: 2800 }, () => 0), 1800);
	assert.equal(getRandomizedDelayMs({ min: 1800, max: 2800 }, () => 0.5), 2300);
	assert.equal(getRandomizedDelayMs({ min: 1800, max: 2800 }, () => 1), 2800);
});

test("normalizeDelayRange accepts reversed bounds and rejects invalid ranges", () => {
	assert.deepEqual(normalizeDelayRange({ min: 2800, max: 1800 }), { min: 1800, max: 2800 });
	assert.equal(normalizeDelayRange({ min: 0, max: 1800 }), null);
	assert.equal(normalizeDelayRange(null), null);
});

test("resolveToolCallDelayMs preserves explicit overrides before randomized defaults", () => {
	assert.equal(
		resolveToolCallDelayMs(
			{ delayMs: 25 },
			{ defaultDelayRangeMs: { min: 1800, max: 2800 }, random: () => 0.5 },
		),
		25,
	);
	assert.equal(
		resolveToolCallDelayMs(
			{},
			{ defaultDelayMs: 50, defaultDelayRangeMs: { min: 1800, max: 2800 }, random: () => 0.5 },
		),
		50,
	);
	assert.equal(
		resolveToolCallDelayMs(
			{},
			{ defaultDelayRangeMs: { min: 1800, max: 2800 }, random: () => 0.5 },
		),
		2300,
	);
});

test("createThinkingEventPart builds a start-phase part with the step's input", () => {
	const part = createThinkingEventPart(
		{
			toolName: "studio.read_brief",
			toolCallId: "abc-123",
			label: "Reading agent brief",
			input: { prompt: "hi" },
		},
		"start",
	);
	assert.equal(part.type, "data-thinking-event");
	assert.equal(part.id, "abc-123-start");
	assert.equal(part.data.phase, "start");
	assert.equal(part.data.toolName, "studio.read_brief");
	assert.equal(part.data.label, "Reading agent brief");
	assert.equal(part.data.toolCallId, "abc-123");
	assert.deepEqual(part.data.input, { prompt: "hi" });
	// Result-only fields should not be present.
	assert.equal("output" in part.data, false);
	assert.equal("outputPreview" in part.data, false);
});

test("createThinkingEventPart builds a result-phase part with output + outputPreview", () => {
	const part = createThinkingEventPart(
		{
			toolName: "studio.save_profile",
			toolCallId: "save-1",
			label: "Saving agent profile",
			outputPreview: "Profile ready.",
		},
		"result",
	);
	assert.equal(part.id, "save-1-result");
	assert.equal(part.data.phase, "result");
	assert.equal(part.data.output, "Profile ready.");
	assert.equal(part.data.outputPreview, "Profile ready.");
});

test("createThinkingEventPart falls back to 'Completed.' when no output is supplied", () => {
	const part = createThinkingEventPart(
		{ toolName: "x", toolCallId: "y", label: "Z" },
		"result",
	);
	assert.equal(part.data.output, "Completed.");
	assert.equal("outputPreview" in part.data, false);
});

test("writeThinkingTraceSteps emits status + start + result parts for each step", async () => {
	const writer = createCapturingWriter();
	await writeThinkingTraceSteps(
		writer,
		[
			{
				toolName: "studio.read_brief",
				toolCallId: "read-1",
				label: "Reading",
				content: "Reading the brief",
				outputPreview: "done",
				delayMs: 1,
			},
			{
				toolName: "studio.save",
				toolCallId: "save-1",
				label: "Saving",
				content: "Saving the profile",
				outputPreview: "saved",
				delayMs: 1,
			},
		],
		{ defaultDelayMs: 1 },
	);

	// Single-row steps emit one status (the lead row) then start + result.
	const types = writer.parts.map((p) => p.type);
	assert.deepEqual(types, [
		"data-thinking-status",
		"data-thinking-event",
		"data-thinking-event",
		"data-thinking-status",
		"data-thinking-event",
		"data-thinking-event",
	]);

	const events = writer.parts.filter((p) => p.type === "data-thinking-event");
	const phases = events.map((p) => p.data.phase);
	assert.deepEqual(phases, ["start", "result", "start", "result"]);

	// At least one start AND one result must be present — this is the renderer's
	// gate for showing the chain-of-thought body.
	assert.ok(phases.includes("start"));
	assert.ok(phases.includes("result"));
});

test("writeThinkingTraceSteps streams stacked contentRows progressively before the result", async () => {
	const writer = createCapturingWriter();
	await writeThinkingTraceSteps(
		writer,
		[
			{
				toolName: "studio.read_brief",
				toolCallId: "read-1",
				label: "Reading",
				contentRows: ["Lead row", "Second row", "Third row"],
				outputPreview: "done",
				delayMs: 1,
			},
		],
		{ defaultDelayMs: 1, narrationRowDelayMs: 1 },
	);

	const types = writer.parts.map((p) => p.type);
	// Lead status → start → 2 streamed status rows → result.
	assert.deepEqual(types, [
		"data-thinking-status",
		"data-thinking-event",
		"data-thinking-status",
		"data-thinking-status",
		"data-thinking-event",
	]);

	const statuses = writer.parts.filter((p) => p.type === "data-thinking-status");
	assert.deepEqual(statuses.map((p) => p.data.content), ["Lead row", "Second row", "Third row"]);
	// Status part ids are unique per row so the stream does not dedupe them.
	assert.deepEqual(
		statuses.map((p) => p.id),
		["read-1-status-0", "read-1-status-1", "read-1-status-2"],
	);

	const events = writer.parts.filter((p) => p.type === "data-thinking-event");
	assert.deepEqual(events.map((p) => p.data.phase), ["start", "result"]);
});

test("writeThinkingTraceSteps skips the result event when a step has no output", async () => {
	const writer = createCapturingWriter();
	await writeThinkingTraceSteps(
		writer,
		[{ toolName: "x", toolCallId: "x-1", label: "X", delayMs: 1 }],
		{ defaultDelayMs: 1 },
	);

	const events = writer.parts.filter((p) => p.type === "data-thinking-event");
	assert.equal(events.length, 1);
	assert.equal(events[0].data.phase, "start");
});

test("writeThinkingTraceSteps short-circuits when the signal is already aborted", async () => {
	const writer = createCapturingWriter();
	const controller = new AbortController();
	controller.abort();
	await writeThinkingTraceSteps(
		writer,
		[{ toolName: "x", toolCallId: "x-1", label: "X", outputPreview: "y", delayMs: 50 }],
		{ defaultDelayMs: 50, signal: controller.signal },
	);
	assert.equal(writer.parts.length, 0);
});

test("writeThinkingTraceSteps stops emitting once the signal aborts mid-flight", async () => {
	const writer = createCapturingWriter();
	const controller = new AbortController();

	const promise = writeThinkingTraceSteps(
		writer,
		[
			{
				toolName: "x",
				toolCallId: "x-1",
				label: "X",
				content: "X narration",
				outputPreview: "y",
				delayMs: 100,
			},
			{
				toolName: "z",
				toolCallId: "z-1",
				label: "Z",
				content: "Z narration",
				outputPreview: "w",
				delayMs: 100,
			},
		],
		{ defaultDelayMs: 100, signal: controller.signal },
	);

	// Abort after the first start emit but before the result.
	setTimeout(() => controller.abort(), 10);
	await promise;

	// The first status + start should have been emitted; the result and second
	// step's parts should NOT have been (single-row steps emit exactly one
	// status then start).
	const types = writer.parts.map((p) => p.type);
	assert.equal(types[0], "data-thinking-status");
	assert.equal(types[1], "data-thinking-event");
	assert.equal(types.length <= 2, true, `expected ≤ 2 parts before abort, got ${types.length}: ${JSON.stringify(types)}`);
});

test("writeThinkingTraceSteps returns immediately when steps is empty or non-array", async () => {
	const writer = createCapturingWriter();
	await writeThinkingTraceSteps(writer, []);
	await writeThinkingTraceSteps(writer, null);
	await writeThinkingTraceSteps(writer, undefined);
	assert.equal(writer.parts.length, 0);
});
