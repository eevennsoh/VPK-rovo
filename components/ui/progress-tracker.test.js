const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROGRESS_TRACKER_SOURCE = fs.readFileSync(path.join(__dirname, "progress-tracker.tsx"), "utf8");
const SPINNER_SOURCE = fs.readFileSync(path.join(__dirname, "spinner.tsx"), "utf8");

test("ProgressTracker supports optional bylines and warning steps without replacing default labels", () => {
	assert.match(PROGRESS_TRACKER_SOURCE, /export type ProgressTrackerStepState = "todo" \| "current" \| "done" \| "warning"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /label: React\.ReactNode/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /byline\?: React\.ReactNode/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /labelClassName\?: string/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /bylineClassName\?: string/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /import WarningIcon from "@atlaskit\/icon\/core\/warning"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /import \{ Spinner \} from "@\/components\/ui\/spinner"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /state === "warning"[\s\S]*token\("color\.icon\.warning"\)/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /state === "current"[\s\S]*<Spinner size="xs" className="text-text-subtle" \/>/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /<div className="flex size-3 items-center justify-center">/u);
	assert.doesNotMatch(PROGRESS_TRACKER_SOURCE, /currentSpinner/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /data-slot="progress-tracker-label"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /data-slot="progress-tracker-byline"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /typeof step\.label === "string" \? step\.label\.trim\(\) : ""/u);
});

test("Spinner keeps the organic Motion path animation", () => {
	assert.match(SPINNER_SOURCE, /import \{ motion \} from "motion\/react"/u);
	assert.match(SPINNER_SOURCE, /<motion\.circle/u);
	assert.match(SPINNER_SOURCE, /transform="rotate\(-90 25 25\)"/u);
	assert.match(SPINNER_SOURCE, /pathLength: \[0\.05, 0\.5, 0\.05\]/u);
	assert.match(SPINNER_SOURCE, /pathOffset: \[0, 0, 1\]/u);
	assert.match(SPINNER_SOURCE, /duration: 0\.8/u);
	assert.match(SPINNER_SOURCE, /repeat: Infinity/u);
	assert.match(SPINNER_SOURCE, /times: \[0, 0\.2, 1\]/u);
	assert.doesNotMatch(SPINNER_SOURCE, /animateTransform/u);
	assert.doesNotMatch(SPINNER_SOURCE, /animate-spin/u);
});
