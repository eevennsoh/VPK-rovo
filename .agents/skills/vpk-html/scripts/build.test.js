#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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

test("buildStylesCssFromTokens emits the shared motion contract", async () => {
	const { buildStylesCssFromTokens } = await loadShared();
	const css = buildStylesCssFromTokens();

	assert.match(css, /--ease-out:\s*cubic-bezier\(0\.23,1,0\.32,1\);/);
	assert.match(css, /--ease-in-out:\s*cubic-bezier\(0\.77,0,0\.175,1\);/);
	assert.match(css, /--vpk-dur-enter:\s*280ms;/);
	assert.match(css, /@keyframes vpk-enter/);
	assert.match(css, /@keyframes vpk-slide-in/);
	assert.match(css, /transform:\s*var\(--vpk-slide-enter-from, translateX\(24px\)\);/);
	assert.match(css, /transform:\s*var\(--vpk-slide-enter-to, translateX\(0\)\);/);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*--vpk-enter-y:\s*0px;/);
	assert.match(css, /@media print[\s\S]*animation:\s*none !important;/);
	assert.doesNotMatch(css, /(^|[^-])ease-in(?!-)/i);

	const enterDuration = Number(css.match(/--vpk-dur-enter:\s*(\d+)ms;/)?.[1]);
	assert.ok(enterDuration <= 300, "entrance duration stays under 300ms");
});

test("quality gate command surface includes focal and tidy audit gates", async () => {
	const { loadThresholds } = await import("./gates.mjs");
	const thresholds = loadThresholds();
	const buildSource = fs.readFileSync(path.join(__dirname, "build.mjs"), "utf8");

	assert.equal(thresholds.focal.maxPrimaryBlueElements, 1);
	assert.equal(thresholds.motionBudget.maxDurationMs, 300);
	assert.equal(thresholds.captionEcho.minSharedWords, 3);
	assert.match(buildSource, /--check-focal/);
	assert.match(buildSource, /--check-motion-budget/);
	assert.match(buildSource, /--check-caption-echo/);
});

test("user render docs route generated HTML into per-slug output folders", () => {
	const docs = [
		"SKILL.md",
		"README.md",
		"CHEATSHEET.md",
		"references/brand-profile.md",
		"references/landing.md",
		"references/pdf-export.md",
		"references/production.md",
	];
	const skillRoot = path.join(__dirname, "..");

	for (const relativePath of docs) {
		const source = fs.readFileSync(path.join(skillRoot, relativePath), "utf8");
		assert.match(source, /output\/vpk-html\//, `${relativePath} should use the vpk-html output artifact root`);
		assert.doesNotMatch(source, /docs\/html\/(?:<slug>|my-doc)\.html/, `${relativePath} should not revive the legacy flat docs/html render path`);
	}
});

test("presentation injector detects decks and is idempotent", async () => {
	const { isDeck, retrofitDeck } = await import("./presentation.mjs");
	const html = `<!doctype html><html><head><style>:root { color-scheme: light dark; }</style></head><body><main><section class="slide"><h1>One</h1></section><section class="slide"><h1>Two</h1></section></main></body></html>`;

	assert.equal(isDeck(html), true);
	const once = retrofitDeck(html);
	const twice = retrofitDeck(once);
	assert.equal(twice, once, "deck retrofit is idempotent");
	assert.match(once, /data-vpk-motion="deck"/);
	assert.match(once, /data-vpk-presentation-runtime/);
	assert.match(once, /--vpk-slide-rest-transform:\s*translate\(-50%, -50%\) scale\(var\(--vpk-slide-scale, 1\)\);/);
	assert.match(once, /transform:\s*var\(--vpk-slide-rest-transform\);/);
	assert.match(once, /:not\(\[data-vpk-deck-ready="true"\]\) \.slide:first-of-type/);
	assert.match(once, /document\.body\.dataset\.vpkDeckReady = 'true'/);
	assert.match(once, /presenterWindow\?\.postMessage/);
	assert.match(once, /presenterWindow = window\.open/);
	assert.match(once, /\.speaker-notes\s*\{[\s\S]*display:\s*none\s*!important/);
	assert.doesNotMatch(once, /[ \t]+$/m);

	const stale = `<!doctype html><html><head><style>:root { color-scheme: light dark; }
/* vpk presentation mode */
@media screen {
	body[data-vpk-motion="deck"] .slide {
		display: none;
		left: 50%;
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%) scale(var(--vpk-slide-scale, 1));
		transform-origin: center center;
	}
}
</style></head><body data-vpk-motion="deck"><main><section class="slide"><h1>One</h1></section><section class="slide"><h1>Two</h1></section></main><script data-vpk-presentation-runtime>
(() => {
	function broadcast(payload) {
		try { window.opener?.postMessage({ source: 'vpk-deck', ...payload }, '*'); } catch { /* noop */ }
	}
	broadcast({ type: 'state' });
})();
</script></body></html>`;
	const refreshed = retrofitDeck(stale);
	assert.equal((refreshed.match(/vpk presentation mode/g) || []).length, 1);
	assert.equal((refreshed.match(/data-vpk-presentation-runtime/g) || []).length, 1);
	assert.match(refreshed, /--vpk-slide-rest-transform:\s*translate\(-50%, -50%\) scale\(var\(--vpk-slide-scale, 1\)\);/);
	assert.match(refreshed, /presenterWindow\?\.postMessage/);
	assert.doesNotMatch(refreshed, /window\.opener\?\.postMessage/);

	const existingNotes = [
		`<!doctype html><html><head><style></style></head><body><main><section class="slide"><h1>One</h1>`,
		"  ",
		`<aside class="speaker-notes" aria-hidden="true">Existing note</aside>`,
		`</section><section class="slide"><h1>Two</h1></section></main></body></html>`,
	].join("\n");
	assert.doesNotMatch(retrofitDeck(existingNotes), /[ \t]+$/m);
});

test("document nav retrofit is idempotent and skips decks", async () => {
	const { retrofitDocumentNav } = await import("./presentation.mjs");
	const doc = `<!doctype html><html><head><style></style></head><body><main><section><h2>One</h2></section><section><h2>Two</h2></section></main></body></html>`;
	const deck = `<!doctype html><html><body><main><section class="slide"></section><section class="slide"></section></main></body></html>`;

	const once = retrofitDocumentNav(doc);
	assert.equal(retrofitDocumentNav(once), once);
	assert.match(once, /data-vpk-motion="document"/);
	assert.match(once, /data-vpk-docnav-runtime/);
	assert.equal(retrofitDocumentNav(deck), deck);
});

test("check-html enforces the SMIL starter contract", async () => {
	const { validateHtmlString } = await import("./check-html.mjs");
	const base = `<!doctype html><html><head><style>@font-face { font-family: "Charlie Text"; src: url(data:font/otf;base64,AA==); } :root { color-scheme: light dark; } [data-theme="dark"] { color-scheme: light dark; }</style></head><body><main><svg aria-label="demo"><animateTransform attributeName="transform" type="translate" begin="indefinite"/></svg></main></body></html>`;

	assert.match(
		validateHtmlString(base).failures.join("\n"),
		/data-vpk-smil-starter/,
	);
	assert.match(
		validateHtmlString(base.replace('begin="indefinite"', 'begin="0s"')).failures.join("\n"),
		/begin="indefinite"/,
	);
});
