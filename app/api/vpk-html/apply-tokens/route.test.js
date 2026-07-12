const assert = require("node:assert/strict");
const test = require("node:test");
const {
	loadBundledRoute,
	mockBackendFetch,
} = require("../test-route-utils.cjs");

test("POST /api/vpk-html/apply-tokens rejects malformed JSON before proxying", async (t) => {
	const { POST } = await loadBundledRoute(t, "apply-tokens/route.ts");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ error: "Unexpected backend call" }),
		{ headers: { "Content-Type": "application/json" }, status: 500 },
	));

	const response = await POST(new Request("http://localhost/api/vpk-html/apply-tokens", {
		body: "{",
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 400);
	assert.deepEqual(await response.json(), {
		error: "Invalid JSON request body.",
	});
	assert.equal(requests.length, 0);
});

test("POST /api/vpk-html/apply-tokens forwards valid token payloads", async (t) => {
	const { POST } = await loadBundledRoute(t, "apply-tokens/route.ts");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ ok: true, updatedFiles: 2 }),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));
	const body = { tokens: { "--accent": "#123456" } };

	const response = await POST(new Request("http://localhost/api/vpk-html/apply-tokens", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { ok: true, updatedFiles: 2 });
	assert.deepEqual(requests, [{
		body: JSON.stringify(body),
		contentType: "application/json",
		method: "POST",
		url: "http://backend.local/api/vpk-html/apply-tokens",
	}]);
});
