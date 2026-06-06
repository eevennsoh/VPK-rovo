const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const esbuild = require("esbuild");

function loadTsModule(entryPoint) {
	const build = esbuild.buildSync({
		entryPoints: [entryPoint],
		bundle: true,
		platform: "node",
		format: "cjs",
		write: false,
		logLevel: "silent",
	});
	const moduleInstance = new Module(entryPoint);
	moduleInstance.filename = entryPoint;
	moduleInstance.paths = Module._nodeModulePaths(path.dirname(entryPoint));
	moduleInstance._compile(build.outputFiles[0].text, entryPoint);
	return moduleInstance.exports;
}

const {
	isThinkingStatusActive,
	isThinkingStatusLifecycleStreaming,
	isPostToolsGenuiGeneration,
	resolveThinkingStatusTriggerLabel,
} = loadTsModule(path.join(__dirname, "thinking-status-state.ts"));

test("keeps thinking status active when thinking events exist without a status part", () => {
	assert.equal(
		isThinkingStatusActive({
			hasThinkingStatusPart: false,
			hasThinkingEvents: true,
			isRetryThinkingStatus: false,
			isStreaming: false,
		}),
		true
	);
});

test("hides retry status once streaming has completed", () => {
	assert.equal(
		isThinkingStatusActive({
			hasThinkingStatusPart: true,
			hasThinkingEvents: false,
			isRetryThinkingStatus: true,
			isStreaming: false,
		}),
		false
	);
});

test("tracks thinking lifecycle streaming only while the active turn is in-flight", () => {
	assert.equal(
		isThinkingStatusLifecycleStreaming({
			isThinkingLifecycleStreaming: true,
			isThinkingStatusActive: true,
			hasBackendThinkingActivity: true,
		}),
		true
	);

	assert.equal(
		isThinkingStatusLifecycleStreaming({
			isThinkingLifecycleStreaming: false,
			isThinkingStatusActive: true,
			hasBackendThinkingActivity: true,
		}),
		false
	);
});

test("detects post-tools GenUI generation while waiting for widget data", () => {
	assert.equal(
		isPostToolsGenuiGeneration({
			widgetType: "genui-preview",
			isWidgetLoading: true,
			hasAnyToolCalls: true,
			hasRunningToolCalls: false,
		}),
		true
	);
});

test("does not mark post-tools GenUI generation while tools are still running", () => {
	assert.equal(
		isPostToolsGenuiGeneration({
			widgetType: "genui-preview",
			isWidgetLoading: true,
			hasAnyToolCalls: true,
			hasRunningToolCalls: true,
		}),
		false
	);
});

test("does not mark post-tools GenUI generation when no tool calls were observed", () => {
	assert.equal(
		isPostToolsGenuiGeneration({
			widgetType: "genui-preview",
			isWidgetLoading: true,
			hasAnyToolCalls: false,
			hasRunningToolCalls: false,
		}),
		false
	);
});

test("uses a deterministic completed label when phase is completed without duration", () => {
	assert.equal(
		resolveThinkingStatusTriggerLabel({
			resolvedLabel: "Thinking",
			reasoningPhase: "completed",
			duration: undefined,
		}),
		"Thought for 0s"
	);
});

test("keeps the existing label when phase is still thinking", () => {
	assert.equal(
		resolveThinkingStatusTriggerLabel({
			resolvedLabel: "Inspecting files",
			reasoningPhase: "thinking",
			duration: undefined,
		}),
		"Inspecting files"
	);
});

test("normalizes generic thinking labels while preserving specific status labels", () => {
	assert.equal(
		resolveThinkingStatusTriggerLabel({
			resolvedLabel: "Thinking",
			reasoningPhase: "thinking",
			duration: undefined,
		}),
		"Thinking"
	);
	assert.equal(
		resolveThinkingStatusTriggerLabel({
			resolvedLabel: "Rovo is thinking",
			reasoningPhase: "thinking",
			duration: undefined,
		}),
		"Thinking"
	);
	assert.equal(
		resolveThinkingStatusTriggerLabel({
			resolvedLabel: "Rovo is tihking",
			reasoningPhase: "thinking",
			duration: undefined,
		}),
		"Thinking"
	);
	assert.equal(
		resolveThinkingStatusTriggerLabel({
			resolvedLabel: "Generating image",
			reasoningPhase: "thinking",
			duration: undefined,
		}),
		"Generating image"
	);
});

const WORKING_HEADER_LABELS = [
	"Working",
	"Cooking",
	"Crafting",
	"Building",
	"Shaping",
	"Assembling",
];

test("genericizes scripted step labels so the parent header does not echo the latest step", () => {
	const stepLabels = [
		"Reading agent brief",
		"Preparing clarification questions",
		"Reviewing agent details",
		"Selecting agent tools",
		"Drafting agent instructions",
		"Naming agent profile",
		"Saving agent profile",
	];
	for (const resolvedLabel of stepLabels) {
		const header = resolveThinkingStatusTriggerLabel({
			resolvedLabel,
			reasoningPhase: "thinking",
			duration: undefined,
		});
		assert.ok(
			WORKING_HEADER_LABELS.includes(header),
			`expected generic working header for step label "${resolvedLabel}", got "${header}"`
		);
		assert.notEqual(
			header,
			resolvedLabel,
			`header should not echo the step label "${resolvedLabel}"`
		);
	}
});

test("cycles the generic header across scripted steps instead of sitting on one word", () => {
	const stepLabels = [
		"Reading agent brief",
		"Preparing clarification questions",
		"Reviewing agent details",
		"Selecting agent tools",
		"Drafting agent instructions",
		"Naming agent profile",
		"Saving agent profile",
	];
	const headers = stepLabels.map((resolvedLabel) =>
		resolveThinkingStatusTriggerLabel({
			resolvedLabel,
			reasoningPhase: "thinking",
			duration: undefined,
		})
	);
	const distinct = new Set(headers);
	assert.ok(
		distinct.size > 1,
		`expected the header to vary across steps, got only ${[...distinct].join(", ")}`
	);
});

test("resolves the same scripted step to a stable header across renders", () => {
	const first = resolveThinkingStatusTriggerLabel({
		resolvedLabel: "Saving agent profile",
		reasoningPhase: "thinking",
		duration: undefined,
	});
	const second = resolveThinkingStatusTriggerLabel({
		resolvedLabel: "Saving agent profile",
		reasoningPhase: "thinking",
		duration: undefined,
	});
	assert.equal(first, second);
});
