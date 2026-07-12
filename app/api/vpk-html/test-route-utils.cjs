const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { build } = require("esbuild");

async function loadBundledRoute(t, relativeRoutePath) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpk-html-action-route-"));
	t.after(() => {
		fs.rmSync(tempDir, { force: true, recursive: true });
	});

	const outfile = path.join(tempDir, "route.cjs");
	await build({
		bundle: true,
		entryPoints: [path.join(__dirname, relativeRoutePath)],
		format: "cjs",
		logLevel: "silent",
		outfile,
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
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
			body: String(init.body ?? ""),
			contentType: new Headers(init.headers).get("Content-Type"),
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

module.exports = {
	loadBundledRoute,
	mockBackendFetch,
};
