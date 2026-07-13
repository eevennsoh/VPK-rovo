const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const MESSAGE_MARKDOWN_SOURCE = fs.readFileSync(
	path.join(__dirname, "message-markdown.tsx"),
	"utf8",
);

test("message markdown engages the typeset chat typography layer for heading spacing", () => {
	// Block typography (h1-h6 top margins, paragraph flow) is owned by the
	// shadcn typeset layer (app/typeset.css `:where(h1)` etc.) applied via the
	// `typeset typeset-chat` class, not by inline `[&_h1]:mt-*` utilities.
	assert.match(MESSAGE_MARKDOWN_SOURCE, /"typeset typeset-chat"/u);
});
