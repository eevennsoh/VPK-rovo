const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPOSER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-composer.tsx"), "utf8");

test("RovoAppComposer uses the shared edit context bar for open artifacts", () => {
	assert.match(COMPOSER_SOURCE, /import ChatContextBar from "@\/components\/projects\/sidebar-chat\/components\/chat-context-bar";/u);
	assert.match(COMPOSER_SOURCE, /variant: "edit" as const/u);
	assert.match(COMPOSER_SOURCE, /iconName: "artifact" as const/u);
	assert.match(COMPOSER_SOURCE, /<ChatContextBar context=\{artifactContextBar\} onDismiss=\{onDismissArtifactContext\} \/>/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /Editing:/u);
});

test("RovoAppComposer gates the floating-only send-now queued action behind onSendQueuedPromptNow", () => {
	// Card chrome (Rovo) does not pass onSendQueuedPromptNow, so the Send-now
	// button must only render when the prop is provided (Studio floating chrome).
	assert.match(COMPOSER_SOURCE, /\{onSendQueuedPromptNow \?/u);
	assert.match(COMPOSER_SOURCE, /aria-label="Send now"/u);
});

test("RovoAppComposer renders both card and floating chrome bodies", () => {
	assert.match(COMPOSER_SOURCE, /chrome === "floating"/u);
	assert.match(COMPOSER_SOURCE, /function ComposerCardBody\(/u);
	assert.match(COMPOSER_SOURCE, /function ComposerFloatingBody\(/u);
});
