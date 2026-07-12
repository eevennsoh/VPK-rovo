const assert = require("node:assert/strict");
const test = require("node:test");
const {
	loadBundledRoute,
	mockBackendFetch,
} = require("../test-route-utils.cjs");

test("GET /api/vpk-html/notes forwards the page query param", async (t) => {
	const { GET } = await loadBundledRoute(t, "notes/route.ts");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ notes: "Presenter reminder" }),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));

	const response = await GET(new Request("http://localhost/api/vpk-html/notes?page=assets%2Fdemos%2Fdemo.html"));

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { notes: "Presenter reminder" });
	assert.deepEqual(requests, [{
		body: "",
		contentType: "application/json",
		method: "GET",
		url: "http://backend.local/api/vpk-html/notes?page=assets%2Fdemos%2Fdemo.html",
	}]);
});

test("PUT /api/vpk-html/notes rejects malformed JSON before proxying", async (t) => {
	const { PUT } = await loadBundledRoute(t, "notes/route.ts");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ error: "Unexpected backend call" }),
		{ headers: { "Content-Type": "application/json" }, status: 500 },
	));

	const response = await PUT(new Request("http://localhost/api/vpk-html/notes?page=assets/demos/demo.html", {
		body: "{",
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	}));

	assert.equal(response.status, 400);
	assert.deepEqual(await response.json(), {
		error: "Invalid JSON request body.",
	});
	assert.equal(requests.length, 0);
});

test("PUT /api/vpk-html/notes forwards the page query param and body", async (t) => {
	const { PUT } = await loadBundledRoute(t, "notes/route.ts");
	const requests = mockBackendFetch(t, () => new Response(
		JSON.stringify({ ok: true }),
		{ headers: { "Content-Type": "application/json" }, status: 200 },
	));
	const body = { notes: "Presenter reminder" };

	const response = await PUT(new Request("http://localhost/api/vpk-html/notes?page=assets%2Fdemos%2Fdemo.html", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "PUT",
	}));

	assert.equal(response.status, 200);
	assert.deepEqual(await response.json(), { ok: true });
	assert.deepEqual(requests, [{
		body: JSON.stringify(body),
		contentType: "application/json",
		method: "PUT",
		url: "http://backend.local/api/vpk-html/notes?page=assets%2Fdemos%2Fdemo.html",
	}]);
});
