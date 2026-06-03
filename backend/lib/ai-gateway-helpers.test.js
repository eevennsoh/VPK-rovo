const test = require("node:test");
const assert = require("node:assert/strict");

const {
	fetchGatewayWithRateLimitRetry,
	parseRetryAfterMs,
} = require("./ai-gateway-helpers");

function makeResponse(status, headers = {}) {
	const lower = new Map(
		Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
	);
	return {
		status,
		ok: status >= 200 && status < 300,
		headers: { get: (name) => lower.get(String(name).toLowerCase()) ?? null },
	};
}

test("retries on a transient 429 then succeeds, without sleeping past the success", async () => {
	const statuses = [429, 429, 200];
	let calls = 0;
	const sleeps = [];
	const response = await fetchGatewayWithRateLimitRetry(
		() => Promise.resolve(makeResponse(statuses[calls++])),
		{ sleepFn: (ms) => { sleeps.push(ms); return Promise.resolve(); } },
	);

	assert.equal(response.status, 200, "resolves to the eventual success response");
	assert.equal(calls, 3, "issued exactly three requests (two 429s + one success)");
	assert.equal(sleeps.length, 2, "slept once before each retry, not after success");
});

test("gives up after maxAttempts and returns the final 429 for existing error handling", async () => {
	let calls = 0;
	const response = await fetchGatewayWithRateLimitRetry(
		() => { calls++; return Promise.resolve(makeResponse(429)); },
		{ maxAttempts: 4, sleepFn: () => Promise.resolve() },
	);

	assert.equal(response.status, 429, "returns the last 429 so the caller still throws its error");
	assert.equal(calls, 4, "attempted exactly maxAttempts times");
});

test("does not retry non-retryable error statuses", async () => {
	let calls = 0;
	const response = await fetchGatewayWithRateLimitRetry(
		() => { calls++; return Promise.resolve(makeResponse(400)); },
		{ sleepFn: () => Promise.resolve() },
	);

	assert.equal(response.status, 400);
	assert.equal(calls, 1, "a 400 is surfaced immediately with no retry");
});

test("honors a numeric Retry-After header over the default backoff", async () => {
	const statuses = [429, 200];
	let calls = 0;
	const sleeps = [];
	await fetchGatewayWithRateLimitRetry(
		() => Promise.resolve(makeResponse(statuses[calls++], calls === 1 ? { "retry-after": "2" } : {})),
		{ sleepFn: (ms) => { sleeps.push(ms); return Promise.resolve(); } },
	);

	assert.deepEqual(sleeps, [2000], "waited the Retry-After seconds (2000ms), not the 750ms backoff");
});

test("retries on 503 as well as 429", async () => {
	const statuses = [503, 200];
	let calls = 0;
	const response = await fetchGatewayWithRateLimitRetry(
		() => Promise.resolve(makeResponse(statuses[calls++])),
		{ sleepFn: () => Promise.resolve() },
	);

	assert.equal(response.status, 200);
	assert.equal(calls, 2);
});

test("parseRetryAfterMs handles seconds, missing, and garbage values", () => {
	assert.equal(parseRetryAfterMs("3"), 3000);
	assert.equal(parseRetryAfterMs(null), null);
	assert.equal(parseRetryAfterMs("not-a-date"), null);
	assert.equal(parseRetryAfterMs("0"), 0);
});
