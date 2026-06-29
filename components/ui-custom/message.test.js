const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const MESSAGE_SOURCE = fs.readFileSync(path.join(__dirname, "message.tsx"), "utf8");

test("message markdown h1 headings keep a 24px top margin", () => {
	assert.match(MESSAGE_SOURCE, /\[&_h1\]:mt-6/u);
	assert.match(MESSAGE_SOURCE, /\[&>h1:first-child\]:mt-6/u);
});
