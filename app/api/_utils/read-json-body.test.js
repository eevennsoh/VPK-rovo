const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { build } = require("esbuild");

async function loadBundledHelper(t) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "read-json-body-"));
	t.after(() => {
		fs.rmSync(tempDir, { force: true, recursive: true });
	});

	const outfile = path.join(tempDir, "read-json-body.cjs");
	await build({
		bundle: true,
		entryPoints: [path.join(__dirname, "read-json-body.ts")],
		format: "cjs",
		logLevel: "silent",
		outfile,
		platform: "node",
	});

	return require(outfile);
}

const JSON_HEADERS = {
	"Content-Type": "application/json",
};

function postRequest(body = null, init = {}) {
	return new Request("http://localhost/api/test", {
		...init,
		body,
		headers: {
			...JSON_HEADERS,
			...Object.fromEntries(new Headers(init.headers).entries()),
		},
		method: "POST",
	});
}

async function readErrorResponse(response) {
	assert.ok(response);
	return response.json();
}

test("readJsonBody parses valid JSON within the configured byte limit", async (t) => {
	const { readJsonBody } = await loadBundledHelper(t);
	const result = await readJsonBody(
		postRequest(JSON.stringify({ message: "hello" })),
		{ maxBytes: 64 },
	);

	assert.equal(result.errorResponse, null);
	assert.deepEqual(result.body, { message: "hello" });
});

test("readJsonBody preserves the invalid JSON error response", async (t) => {
	const { readJsonBody } = await loadBundledHelper(t);
	const result = await readJsonBody(postRequest("{"), { maxBytes: 64 });

	assert.equal(result.body, null);
	assert.equal(result.errorResponse?.status, 400);
	assert.deepEqual(await readErrorResponse(result.errorResponse), {
		error: "Invalid JSON request body.",
	});
});

test("readJsonBody preserves the required empty-body error response", async (t) => {
	const { readJsonBody } = await loadBundledHelper(t);
	const result = await readJsonBody(postRequest(), { maxBytes: 64 });

	assert.equal(result.body, null);
	assert.equal(result.errorResponse?.status, 400);
	assert.deepEqual(await readErrorResponse(result.errorResponse), {
		error: "Request body is required.",
	});
});

test("readJsonBody preserves optional empty-body defaults", async (t) => {
	const { readJsonBody } = await loadBundledHelper(t);
	const result = await readJsonBody(postRequest("   "), {
		defaultBody: { ok: true },
		maxBytes: 64,
		required: false,
	});

	assert.equal(result.errorResponse, null);
	assert.deepEqual(result.body, { ok: true });
});

test("readJsonBody rejects bodies over the configured byte limit", async (t) => {
	const { readJsonBody } = await loadBundledHelper(t);
	const result = await readJsonBody(postRequest(JSON.stringify({ value: "1234567890" })), {
		maxBytes: 12,
	});

	assert.equal(result.body, null);
	assert.equal(result.errorResponse?.status, 413);
	assert.deepEqual(await readErrorResponse(result.errorResponse), {
		error: "Request payload is too large.",
		reason: "payload_too_large",
		limitBytes: 12,
	});
});

test("readJsonBody rejects declared over-limit bodies before reading the stream", async (t) => {
	const { readJsonBody } = await loadBundledHelper(t);
	let readerRequested = false;
	const result = await readJsonBody({
		body: {
			getReader() {
				readerRequested = true;
				throw new Error("body stream should not be read");
			},
		},
		headers: {
			get(name) {
				return name.toLowerCase() === "content-length" ? "13" : null;
			},
		},
	}, {
		maxBytes: 12,
	});

	assert.equal(result.body, null);
	assert.equal(result.errorResponse?.status, 413);
	assert.equal(readerRequested, false);
	assert.deepEqual(await readErrorResponse(result.errorResponse), {
		error: "Request payload is too large.",
		reason: "payload_too_large",
		limitBytes: 12,
	});
});

test("readJsonBody stops reading after a streamed body exceeds the byte limit", async (t) => {
	const { readJsonBody } = await loadBundledHelper(t);
	const encoder = new TextEncoder();
	let cancelCalled = false;
	let pullCount = 0;
	const chunks = [
		encoder.encode("{\"value\""),
		encoder.encode(":\"1234567890\""),
		encoder.encode(",\"unused\":true}"),
	];
	const body = new ReadableStream({
		cancel() {
			cancelCalled = true;
		},
		pull(controller) {
			pullCount += 1;
			const chunk = chunks.shift();
			if (chunk) {
				controller.enqueue(chunk);
				return;
			}

			controller.close();
		},
	});

	const result = await readJsonBody(postRequest(body, {
		duplex: "half",
	}), {
		maxBytes: 12,
	});

	assert.equal(result.body, null);
	assert.equal(result.errorResponse?.status, 413);
	assert.equal(cancelCalled, true);
	assert.equal(pullCount, 2);
	assert.deepEqual(await readErrorResponse(result.errorResponse), {
		error: "Request payload is too large.",
		reason: "payload_too_large",
		limitBytes: 12,
	});
});

test("readJsonBody exposes a default JSON body limit aligned with backend scoped limits", async (t) => {
	const { DEFAULT_JSON_BODY_LIMIT_BYTES } = await loadBundledHelper(t);
	assert.equal(DEFAULT_JSON_BODY_LIMIT_BYTES, 12 * 1024 * 1024);
});

test("readJsonBody exposes the backend fallback JSON body limit for parity-sensitive dev proxies", async (t) => {
	const { BACKEND_FALLBACK_JSON_BODY_LIMIT_BYTES } = await loadBundledHelper(t);
	assert.equal(BACKEND_FALLBACK_JSON_BODY_LIMIT_BYTES, 50 * 1024 * 1024);
});

test("large backend fallback proxies opt into the 50 MB JSON body limit", () => {
	const helperImportPattern =
		/BACKEND_FALLBACK_JSON_BODY_LIMIT_BYTES[\s\S]*readJsonBody/u;
	const maxBytesPattern =
		/readJsonBody\(request,\s*\{[\s\S]*maxBytes: BACKEND_FALLBACK_JSON_BODY_LIMIT_BYTES/u;
	const routePaths = [
		path.join(__dirname, "../genui-export/route.ts"),
		path.join(__dirname, "../rovo/documents/route.ts"),
	];

	for (const routePath of routePaths) {
		const source = fs.readFileSync(routePath, "utf8");
		assert.match(source, helperImportPattern, routePath);
		assert.match(source, maxBytesPattern, routePath);
	}
});
