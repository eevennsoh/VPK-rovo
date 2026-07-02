import assert from "node:assert/strict";
import test from "node:test";

import { detectLaunchIntent } from "./launch-intent.ts";

test("detects 'let's go' family phrasing", () => {
	assert.equal(detectLaunchIntent("let's go"), true);
	assert.equal(detectLaunchIntent("Yo, let's go!"), true);
	assert.equal(detectLaunchIntent("LET'S GOOO"), true);
	assert.equal(detectLaunchIntent("lets roll"), true);
	assert.equal(detectLaunchIntent("alright, let's ride"), true);
});

test("detects standalone hype phrases", () => {
	assert.equal(detectLaunchIntent("go go go"), true);
	assert.equal(detectLaunchIntent("ship it"), true);
	assert.equal(detectLaunchIntent("send it"), true);
	assert.equal(detectLaunchIntent("here we go"), true);
});

test("does not fire on team creation or unrelated speech", () => {
	assert.equal(detectLaunchIntent("create me a team of agents"), false);
	assert.equal(detectLaunchIntent("going to the store"), false);
	assert.equal(detectLaunchIntent("what's the weather today"), false);
});

test("handles empty and nullish input", () => {
	assert.equal(detectLaunchIntent(""), false);
	assert.equal(detectLaunchIntent(null), false);
	assert.equal(detectLaunchIntent(undefined), false);
});
