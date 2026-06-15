const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(
	path.join(__dirname, "use-clicky-voice.ts"),
	"utf8",
);

test("Clicky deactivation does not disconnect the Realtime voice session", () => {
	assert.doesNotMatch(SOURCE, /disconnectRealtime/u);
	assert.match(SOURCE, /Cursor deactivation must not stop/u);
	assert.match(SOURCE, /connectedForClickyRef\.current/u);
});

test("Clicky must use point_at_target before claiming the cursor is pointing", () => {
	assert.match(SOURCE, /call get_screen_state, then call point_at_target/u);
	assert.match(SOURCE, /Do not say "I'm pointing", "there it is"/u);
	assert.match(SOURCE, /point_at_target returns ok: true/u);
	assert.match(SOURCE, /If it returns ok: false/u);
});
