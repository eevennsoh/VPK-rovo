"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { getAiSdk, loadAiSdk } = require("./ai-sdk-runtime");

test("loadAiSdk shares its in-flight ESM load for CommonJS backend owners", async () => {
	const firstLoad = loadAiSdk();
	const secondLoad = loadAiSdk();

	assert.equal(firstLoad, secondLoad);

	const [firstSdk, secondSdk] = await Promise.all([firstLoad, secondLoad]);

	assert.equal(firstSdk, secondSdk);
	assert.equal(getAiSdk(), firstSdk);
	assert.equal(typeof firstSdk.createUIMessageStream, "function");
});
