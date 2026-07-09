const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { build } = require("esbuild");

async function loadBundledRoute(t) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpk-html-proxy-route-"));
	t.after(() => {
		fs.rmSync(tempDir, { force: true, recursive: true });
	});

	const outfile = path.join(tempDir, "route.cjs");
	await build({
		bundle: true,
		entryPoints: [path.join(__dirname, "[...assetPath]", "route.ts")],
		format: "cjs",
		logLevel: "silent",
		outfile,
		platform: "node",
	});

	return require(outfile);
}

function mockBackendFetch(t, handler) {
	const originalBackendUrl = process.env.BACKEND_URL;
	const originalFetch = globalThis.fetch;
	const requests = [];
	process.env.BACKEND_URL = "http://backend.local";
	globalThis.fetch = (async (url, init = {}) => {
		requests.push({
			method: init.method,
			url: String(url),
		});
		return handler(url, init);
	});

	t.after(() => {
		globalThis.fetch = originalFetch;
		if (originalBackendUrl === undefined) {
			delete process.env.BACKEND_URL;
			return;
		}

		process.env.BACKEND_URL = originalBackendUrl;
	});

	return requests;
}

test("GET /api/vpk-html/*assetPath preserves nested asset path and query", async (t) => {
	const { GET } = await loadBundledRoute(t);
	const requests = mockBackendFetch(t, () => new Response(
		"<!doctype html><title>Demo</title>",
		{ headers: { "Content-Type": "text/html" }, status: 200 },
	));

	const response = await GET(
		new Request("http://localhost/api/vpk-html/assets/demos/demo-one-pager.html?theme=dark"),
		{ params: Promise.resolve({ assetPath: ["assets", "demos", "demo-one-pager.html"] }) },
	);

	assert.equal(response.status, 200);
	assert.match(await response.text(), /Demo/u);
	assert.deepEqual(requests, [{
		method: "GET",
		url: "http://backend.local/api/vpk-html/assets/demos/demo-one-pager.html?theme=dark",
	}]);
});
