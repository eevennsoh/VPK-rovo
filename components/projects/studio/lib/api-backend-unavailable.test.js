const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const STUDIO_API_SOURCE = fs.readFileSync(
	path.join(__dirname, "api.ts"),
	"utf8",
);
const ROVO_API_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "rovo", "lib", "api.ts"),
	"utf8",
);

// Regression: a backend-down stream surfaced a bare "fetch failed" in the
// composer because isRovoAppBackendUnavailableError only matched the proxy's
// normalized "Cannot connect to backend server" string. Raw transport network
// errors must also resolve to the actionable "start the backend" hint.
for (const [name, source] of [
	["studio", STUDIO_API_SOURCE],
	["rovo", ROVO_API_SOURCE],
]) {
	test(`${name} api treats raw network failures as backend-unavailable`, () => {
		assert.match(source, /ROVO_APP_NETWORK_FAILURE_MESSAGES/u);
		assert.match(source, /"fetch failed"/u);
		assert.match(source, /"failed to fetch"/u);
		assert.match(source, /message === candidate \|\| message\.includes\(candidate\)/u);
	});
}
