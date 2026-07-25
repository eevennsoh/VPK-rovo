const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadSidebarChatState() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(__dirname, "sidebar-chat-state.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});
	return loadCjsModuleFromText(result.outputFiles[0].text, "sidebar-chat-state.cjs");
}

test("dictation presentation reducer keeps preview and lifecycle state coherent", () => {
	const { reduceDictationPresentation } = loadSidebarChatState();
	const started = reduceDictationPresentation(
		{ isActive: false, transcriptPreview: "stale" },
		{ type: "start" },
	);
	const previewed = reduceDictationPresentation(started, { type: "preview", transcript: "hello" });

	assert.deepEqual(previewed, { isActive: true, transcriptPreview: "hello" });
	assert.deepEqual(
		reduceDictationPresentation(previewed, { type: "stop" }),
		{ isActive: false, transcriptPreview: null },
	);
});

test("screen-assistant reducer resets painting and region together", () => {
	const { reduceScreenAssistantRegion } = loadSidebarChatState();
	const region = { height: 40, width: 80, x: 12, y: 24 };
	const painting = reduceScreenAssistantRegion(
		{ painting: false, region: null },
		{ type: "set-painting", painting: true },
	);
	const selected = reduceScreenAssistantRegion(painting, { type: "set-region", region });

	assert.deepEqual(selected, { painting: true, region });
	assert.deepEqual(
		reduceScreenAssistantRegion(selected, { type: "reset" }),
		{ painting: false, region: null },
	);
});
