const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WRAPPER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-composer.tsx"), "utf8");
const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-shell.tsx"), "utf8");

test("Rovo RovoAppComposer wrapper renders the shared composer with card chrome", () => {
	assert.match(WRAPPER_SOURCE, /from "@\/components\/projects\/shared\/components\/rovo-app-composer"/u);
	assert.match(WRAPPER_SOURCE, /chrome="card"/u);
});

test("RovoAppShell adds side gutter for the compact artifact composer", () => {
	assert.match(SHELL_SOURCE, /isArtifactOpen \? "max-w-none px-3" : "max-w-\[800px\]"/u);
});
