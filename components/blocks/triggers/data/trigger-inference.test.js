const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

const { loadCjsModuleFromText } = require(
	path.join(process.cwd(), "scripts", "lib", "esbuild-cjs-loader.js"),
);

// The trigger catalog is a pure-TS data/logic module (icon types only); bundle it
// to CJS so the inference helpers can be exercised at runtime under `node --test`.
let modulePromise;
function loadCatalog() {
	modulePromise ??= esbuild
		.build({
			entryPoints: [path.join(process.cwd(), "components/blocks/triggers/data/trigger-catalog.ts")],
			bundle: true,
			format: "cjs",
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			loader: { ".css": "empty" },
			write: false,
		})
		.then((result) => loadCjsModuleFromText(result.outputFiles[0].text));
	return modulePromise;
}

test("daily-at-7am scheduled event exists in the catalog", async () => {
	const { getTriggerEvent } = await loadCatalog();
	const event = getTriggerEvent("scheduled", "daily-at-7am");
	assert.ok(event, "daily-at-7am event should exist on the scheduled provider");
	assert.match(event.label, /7:00\s*AM/i);
});

test("inferScheduledEventId maps natural-language schedules", async () => {
	const { inferScheduledEventId } = await loadCatalog();
	assert.equal(inferScheduledEventId("Every day at 7:00 AM"), "daily-at-7am");
	assert.equal(inferScheduledEventId("each morning at 7am give me a readout"), "daily-at-7am");
	assert.equal(inferScheduledEventId("Run hourly"), "every-hour");
	assert.equal(inferScheduledEventId("every weekday morning"), "every-weekday-morning");
	assert.equal(inferScheduledEventId("when a Jira issue is created"), undefined);
});

test("inferScheduledTriggerDefinitions builds a structured 7am definition", async () => {
	const { inferScheduledTriggerDefinitions } = await loadCatalog();

	const defs = inferScheduledTriggerDefinitions(["Every morning at 7am, send the readout"]);
	assert.ok(Array.isArray(defs) && defs.length === 1, "should infer one definition");
	assert.equal(defs[0].providerId, "scheduled");
	assert.equal(defs[0].eventId, "daily-at-7am");

	// A mixed list (some non-schedule) bails out to keep label alignment.
	assert.equal(
		inferScheduledTriggerDefinitions(["Every day at 7am", "when a PR is opened"]),
		undefined,
	);
	assert.equal(inferScheduledTriggerDefinitions([]), undefined);
});
