"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { getAiSdk, loadAiSdk } = require("./ai-sdk-runtime");

test("loadAiSdk initializes the ESM-only AI SDK for CommonJS backend owners", async () => {
	const firstLoad = await loadAiSdk();
	const secondLoad = await loadAiSdk();

	assert.equal(firstLoad, secondLoad);
	assert.equal(getAiSdk(), firstLoad);
	assert.equal(typeof firstLoad.createUIMessageStream, "function");
});
