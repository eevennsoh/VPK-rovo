#!/usr/bin/env node

const assert = require("node:assert/strict");
const test = require("node:test");

async function loadShared() {
	return import("./shared.mjs");
}

test("addMainLandmark closes after body content when head contains a script", async () => {
	const { addMainLandmark } = await loadShared();
	const html = `<!doctype html>
<html>
<head>
<script src="/head.js"></script>
</head>
<body class="doc">
<section>Visible content</section>
<script src="/body.js"></script>
</body>
</html>`;

	const result = addMainLandmark(html);
	const headScript = result.indexOf(`<script src="/head.js"></script>`);
	const bodyOpen = result.indexOf(`<body class="doc">`);
	const mainOpen = result.indexOf("<main>");
	const visibleContent = result.indexOf("<section>Visible content</section>");
	const mainClose = result.indexOf("</main>");
	const bodyScript = result.indexOf(`<script src="/body.js"></script>`);

	assert.ok(headScript < bodyOpen, "fixture should keep the head script before body");
	assert.ok(bodyOpen < mainOpen, "main opens inside body");
	assert.ok(mainOpen < visibleContent, "main wraps visible body content");
	assert.ok(visibleContent < mainClose, "main closes after visible body content");
	assert.ok(mainClose < bodyScript, "body scripts stay outside the main landmark");
});

test("addMainLandmark closes before body end when no body script exists", async () => {
	const { addMainLandmark } = await loadShared();
	const result = addMainLandmark("<html><body><article>Report</article></body></html>");

	assert.match(result, /<body>\n<main><article>Report<\/article>\n<\/main><\/body>/);
});

test("addMainLandmark is idempotent — a document with <main> is unchanged", async () => {
	const { addMainLandmark } = await loadShared();
	const once = addMainLandmark("<html><body><article>Report</article></body></html>");
	const twice = addMainLandmark(once);
	assert.equal(twice, once, "re-running addMainLandmark must not double-wrap");
});

test("addLabeledMainLandmark wraps content and sets the aria-label", async () => {
	const { addLabeledMainLandmark } = await loadShared();
	const result = addLabeledMainLandmark(
		`<html><body>\n<section>Demo</section>\n<script src="/x.js"></script></body></html>`,
		"curated demo",
	);
	assert.match(result, /<main aria-label="curated demo">/, "labeled main carries the aria-label");
	const mainClose = result.indexOf("</main>");
	const bodyScript = result.indexOf(`<script src="/x.js"></script>`);
	assert.ok(mainClose >= 0 && mainClose < bodyScript, "main closes before the trailing body script");
});

test("addLabeledMainLandmark is idempotent", async () => {
	const { addLabeledMainLandmark } = await loadShared();
	const once = addLabeledMainLandmark("<html><body><article>Demo</article></body></html>", "demo");
	const twice = addLabeledMainLandmark(once, "demo");
	assert.equal(twice, once, "re-running addLabeledMainLandmark must not double-wrap");
});

test("rewriteKamiColors maps raw kami hex to vpk semantic aliases", async () => {
	const { rewriteKamiColors } = await import("./kami-color-map.mjs");
	const out = rewriteKamiColors("color: #f5f4ed; background: #141413;");
	assert.match(out, /var\(--paper\)/, "kami parchment maps to --paper");
	assert.match(out, /var\(--ink\)/, "kami ink maps to --ink");
	assert.doesNotMatch(out, /#f5f4ed|#141413/, "no raw kami literals remain");
});
