const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const MESSAGE_MARKDOWN_SOURCE = fs.readFileSync(path.join(__dirname, "message-markdown.tsx"), "utf8");

test("message markdown headings use typeset flow instead of Streamdown heading classes", () => {
	assert.match(MESSAGE_MARKDOWN_SOURCE, /!plain && "typeset typeset-chat"/u);
	assert.match(MESSAGE_MARKDOWN_SOURCE, /h1: bareEl\("h1"\)/u);
	assert.match(MESSAGE_MARKDOWN_SOURCE, /Dropping the class lets[\s\S]*typeset's zero-specificity `:where\(\)` rules own block typography/u);
	assert.match(MESSAGE_MARKDOWN_SOURCE, /\[&>\*:first-child\]:mt-0/u);
});
