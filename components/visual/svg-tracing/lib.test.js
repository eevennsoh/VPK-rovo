const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const helpers = import("./lib.ts");
const DATA_SOURCE = fs.readFileSync(path.join(__dirname, "data.ts"), "utf8");

test("parseSvgTraceInput extracts a sanitized viewBox and path data", async () => {
	const { parseSvgTraceInput } = await helpers;
	const result = parseSvgTraceInput(`
		<svg viewBox="0 0 22 14">
			<script>alert("ignored")</script>
			<path d="M2 10 C4 8 5 2 8 3" onclick="ignored()" />
			<circle cx="4" cy="4" r="2" />
		</svg>
	`);

	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.shape.viewBox, "0 0 22 14");
	assert.deepEqual(result.shape.paths, [{ d: "M2 10 C4 8 5 2 8 3" }]);
});

test("SVG tracing presets include Studio underline examples", () => {
	assert.match(DATA_SOURCE, /SVG_TRACE_SCRATCH_UNDERLINE_PRESET/u);
	assert.match(DATA_SOURCE, /id: "scratch-underline"/u);
	assert.match(DATA_SOURCE, /viewBox: "0 0 200 44"/u);
	assert.match(DATA_SOURCE, /SVG_TRACE_TEMPLATES_LOOP_PRESET/u);
	assert.match(DATA_SOURCE, /id: "templates-loop"/u);
	assert.match(DATA_SOURCE, /viewBox: "0 0 222 55"/u);
	assert.match(DATA_SOURCE, /SVG_TRACE_TEMPLATES_WAVE_PRESET/u);
	assert.match(DATA_SOURCE, /id: "templates-wave"/u);
	assert.match(DATA_SOURCE, /viewBox: "0 0 131 26"/u);
	assert.match(DATA_SOURCE, /SVG_TRACE_PRESETS: readonly SvgTracePreset\[\] = \[[\s\S]*SVG_TRACE_SCRATCH_UNDERLINE_PRESET[\s\S]*SVG_TRACE_TEMPLATES_LOOP_PRESET[\s\S]*SVG_TRACE_TEMPLATES_WAVE_PRESET/u);
});

test("parseSvgTraceInput rejects unsupported path data instead of rendering raw markup", async () => {
	const { parseSvgTraceInput } = await helpers;
	const result = parseSvgTraceInput(`
		<svg viewBox="0 0 20 20">
			<path d="M0 0 L10 10 url(javascript:alert(1))" />
		</svg>
	`);

	assert.equal(result.ok, false);
	if (result.ok) return;
	assert.equal(result.error, "No supported path d attributes were found.");
});

test("parseSvgTraceInput accepts raw path data with the default tiny viewBox", async () => {
	const { parseSvgTraceInput } = await helpers;
	const result = parseSvgTraceInput("M1 1 C3 5 8 5 10 1");

	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.shape.viewBox, "0 0 22 14");
	assert.deepEqual(result.shape.paths, [{ d: "M1 1 C3 5 8 5 10 1" }]);
});

test("clampTraceLength keeps visible tracer windows in a bounded range", async () => {
	const { clampTraceLength } = await helpers;

	assert.equal(clampTraceLength(-1), 0.015);
	assert.equal(clampTraceLength(0.2), 0.2);
	assert.equal(clampTraceLength(5), 0.45);
	assert.equal(clampTraceLength(Number.NaN), 0.12);
});

test("clampColorStopCount keeps repeated color stops usable", async () => {
	const { clampColorStopCount } = await helpers;

	assert.equal(clampColorStopCount(-2), 1);
	assert.equal(clampColorStopCount(4), 4);
	assert.equal(clampColorStopCount(6.7), 7);
	assert.equal(clampColorStopCount(99), 12);
	assert.equal(clampColorStopCount(Number.NaN), 4);
});

test("parseSvgTraceBezierInput accepts Tailwind-compatible cubic-bezier values", async () => {
	const { parseSvgTraceBezierInput } = await helpers;
	const result = parseSvgTraceBezierInput("0.64, 0, 0.78, 0");

	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.deepEqual(result.value, [0.64, 0, 0.78, 0]);
});

test("parseSvgTraceBezierInput accepts full cubic-bezier syntax", async () => {
	const { parseSvgTraceBezierInput } = await helpers;
	const result = parseSvgTraceBezierInput("cubic-bezier(0.34, 1.56, 0.64, 1)");

	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.deepEqual(result.value, [0.34, 1.56, 0.64, 1]);
});

test("parseSvgTraceBezierInput rejects invalid control point x values", async () => {
	const { parseSvgTraceBezierInput } = await helpers;
	const result = parseSvgTraceBezierInput("-0.2, 0, 1.2, 1");

	assert.equal(result.ok, false);
	if (result.ok) return;
	assert.equal(result.error, "Bezier x values must be between 0 and 1.");
});
