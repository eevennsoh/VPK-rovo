const assert = require("node:assert/strict");
const test = require("node:test");
const {
	loadBundledRoute,
	mockBackendFetch,
} = require("../test-route-utils.cjs");

test("POST /api/vpk-html/publish-gist rejects malformed JSON before proxying", async (t) => {
	const { POST } = await loadBundledRoute(t, "publish-gist/route.ts");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ error: "Unexpected backend call" }),
		{ headers: { "Content-Type": "application/json" }, status: 500 },
	));

	const response = await POST(new Request("http://localhost/api/vpk-html/publish-gist", {
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

test("POST /api/vpk-html/publish-gist forwards valid publish payloads", async (t) => {
	const { POST } = await loadBundledRoute(t, "publish-gist/route.ts");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ ok: true, url: "https://gist.github.com/user/abc123" }),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));
	const body = { page: "assets/demos/demo.html" };

	const response = await POST(new Request("http://localhost/api/vpk-html/publish-gist", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	}));

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { ok: true, url: "https://gist.github.com/user/abc123" });
	assert.deepEqual(requests, [{
		body: JSON.stringify(body),
		contentType: "application/json",
		method: "POST",
		url: "http://backend.local/api/vpk-html/publish-gist",
	}]);
});
