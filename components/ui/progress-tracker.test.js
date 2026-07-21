const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROGRESS_TRACKER_SOURCE = fs.readFileSync(path.join(__dirname, "progress-tracker.tsx"), "utf8");
const SPINNER_SOURCE = fs.readFileSync(path.join(__dirname, "spinner.tsx"), "utf8");
const TAILWIND_THEME_SOURCE = fs.readFileSync(path.join(__dirname, "../../app/tailwind-theme.css"), "utf8");

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

test("Spinner matches the CodePen chasing-tail motion", () => {
	assert.match(SPINNER_SOURCE, /import \{ motion, type Transition, useReducedMotion \} from "motion\/react"/u);
	assert.match(SPINNER_SOURCE, /<motion\.svg/u);
	assert.match(SPINNER_SOURCE, /<motion\.circle/u);
	assert.match(SPINNER_SOURCE, /transform="rotate\(-90 25 25\)"/u);
	assert.match(SPINNER_SOURCE, /const SPINNER_ORBIT_TRANSITION: Transition = \{[\s\S]*duration: 1\.2,[\s\S]*ease: "linear",[\s\S]*repeat: Infinity/u);
	assert.match(SPINNER_SOURCE, /const SPINNER_STRETCH_TRANSITION: Transition = \{[\s\S]*duration: 1\.2,[\s\S]*ease: "easeInOut",[\s\S]*repeat: Infinity,[\s\S]*times: \[0, 0\.5, 1\]/u);
	assert.match(SPINNER_SOURCE, /animate=\{\{ rotate: shouldReduceMotion \? 0 : 360 \}\}/u);
	assert.match(SPINNER_SOURCE, /strokeDasharray: \["1 200", "89 200", "89 200"\]/u);
	assert.match(SPINNER_SOURCE, /strokeDashoffset: \[0, -35, -124\]/u);
	assert.match(SPINNER_SOURCE, /\? \{ strokeDasharray: "56 200", strokeDashoffset: 0 \}/u);
	assert.match(SPINNER_SOURCE, /willChange: shouldReduceMotion \? undefined : "transform"/u);
	assert.doesNotMatch(SPINNER_SOURCE, /pathLength|pathOffset/u);
	assert.doesNotMatch(SPINNER_SOURCE, /animateTransform/u);
	assert.doesNotMatch(SPINNER_SOURCE, /animate-spin/u);
});

test("Shimmer keeps its token-backed CSS sweep animation", () => {
	assert.match(TAILWIND_THEME_SOURCE, /@keyframes text-shimmer-motion[\s\S]*background-position: var\(--text-shimmer-start-position\), 0% center;[\s\S]*background-position: 0% center, 0% center;/u);
	assert.match(TAILWIND_THEME_SOURCE, /@utility shimmer-sweep-motion[\s\S]*animation: text-shimmer-motion var\(--text-shimmer-duration\) var\(--ease-linear\) infinite;/u);
});
