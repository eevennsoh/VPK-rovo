"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const express = require("express");

const {
	registerVpkHtmlRoutes,
	resolveVpkHtmlFilePath,
} = require("./vpk-html");

async function withServer(rootDir, run) {
	const app = express();
	registerVpkHtmlRoutes(app, { rootDir });

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl);
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
}

function createFixtureRoot(t) {
	const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpk-html-route-"));
	t.after(() => {
		fs.rmSync(rootDir, { force: true, recursive: true });
	});

	fs.mkdirSync(path.join(rootDir, "assets", "demos", "media"), { recursive: true });
	fs.mkdirSync(path.join(rootDir, "scripts"), { recursive: true });
	fs.writeFileSync(path.join(rootDir, "index.html"), "<!doctype html><title>vpk-html</title>");
	fs.writeFileSync(path.join(rootDir, "SKILL.md"), "# vpk-html");
	fs.writeFileSync(path.join(rootDir, "assets", "demos", "demo.html"), "<!doctype html><title>Demo</title>");
	fs.writeFileSync(path.join(rootDir, "assets", "demos", "media", "clip.mp4"), "fake-mp4-bytes");
	fs.writeFileSync(path.join(rootDir, "assets", "demos", "notes.txt"), "not servable");
	fs.writeFileSync(path.join(rootDir, "scripts", "build.mjs"), "console.log('internal')");
	return rootDir;
}

function createDotDirectoryFixtureRoot(t) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpk-html-route-dot-"));
	const rootDir = path.join(tempDir, ".agents", "skills", "vpk-html");
	t.after(() => {
		fs.rmSync(tempDir, { force: true, recursive: true });
	});

	fs.mkdirSync(rootDir, { recursive: true });
	fs.writeFileSync(path.join(rootDir, "index.html"), "<!doctype html><title>Dot root</title>");
	return rootDir;
}

test("vpk-html route serves index and nested assets from the skill root", async (t) => {
	const rootDir = createFixtureRoot(t);

	await withServer(rootDir, async (baseUrl) => {
		const indexResponse = await fetch(`${baseUrl}/api/vpk-html`);
		assert.equal(indexResponse.status, 200);
		assert.match(await indexResponse.text(), /vpk-html/u);

		const assetResponse = await fetch(`${baseUrl}/api/vpk-html/assets/demos/demo.html`);
		assert.equal(assetResponse.status, 200);
		assert.match(await assetResponse.text(), /Demo/u);

		const skillResponse = await fetch(`${baseUrl}/api/vpk-html/SKILL.md`);
		assert.equal(skillResponse.status, 200);
		assert.match(await skillResponse.text(), /vpk-html/u);
	});
});

test("vpk-html route serves catalog files from a dot-directory skill root", async (t) => {
	const rootDir = createDotDirectoryFixtureRoot(t);

	await withServer(rootDir, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/vpk-html/index.html`);
		assert.equal(response.status, 200);
		assert.match(await response.text(), /Dot root/u);
	});
});

test("vpk-html route does not serve unlisted skill source files", async (t) => {
	const rootDir = createFixtureRoot(t);

	await withServer(rootDir, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/vpk-html/scripts/build.mjs`);
		assert.equal(response.status, 400);
		assert.deepEqual(await response.json(), { error: "Invalid vpk-html asset path" });
	});
});

test("vpk-html route serves video media under assets/demos", async (t) => {
	const rootDir = createFixtureRoot(t);

	await withServer(rootDir, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/vpk-html/assets/demos/media/clip.mp4`);
		assert.equal(response.status, 200);
		assert.equal(await response.text(), "fake-mp4-bytes");
	});
});

test("vpk-html route rejects non-media, non-html files under assets/demos", async (t) => {
	const rootDir = createFixtureRoot(t);

	await withServer(rootDir, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/vpk-html/assets/demos/notes.txt`);
		assert.equal(response.status, 400);
		assert.deepEqual(await response.json(), { error: "Invalid vpk-html asset path" });
	});
});

test("vpk-html route rejects traversal outside the skill root", (t) => {
	const rootDir = createFixtureRoot(t);
	const outsidePath = path.join(rootDir, "..", "secret.txt");
	fs.writeFileSync(outsidePath, "secret");
	t.after(() => {
		fs.rmSync(outsidePath, { force: true });
	});

	assert.equal(resolveVpkHtmlFilePath("../secret.txt", { rootDir }), null);
	assert.equal(resolveVpkHtmlFilePath("assets/demos/../templates/source.html", { rootDir }), null);
	assert.equal(resolveVpkHtmlFilePath("assets/\0/demo.html", { rootDir }), null);
});

test("vpk-html route returns a 404 for missing assets", async (t) => {
	const rootDir = createFixtureRoot(t);

	await withServer(rootDir, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/vpk-html/assets/demos/missing.html`);
		assert.equal(response.status, 404);
		assert.deepEqual(await response.json(), { error: "vpk-html asset not found" });
	});
});
