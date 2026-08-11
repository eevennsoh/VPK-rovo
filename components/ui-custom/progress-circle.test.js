import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const SOURCE = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "progress-circle.tsx"),
	"utf8",
);

test("ProgressCircle supports weighted status-group arcs with modest gaps", () => {
	assert.match(SOURCE, /segments\?: readonly ProgressCircleSegment\[\]/u);
	assert.match(
		SOURCE,
		/export type ProgressCircleSegmentStatus = "passed" \| "failed" \| "pending"/u,
	);
	assert.match(SOURCE, /weight\?: number/u);
	assert.match(SOURCE, /SEGMENT_GAP_RATIO/u);
	assert.match(SOURCE, /segments\.length > 1 \? segments\.length : 0/u);
	assert.match(SOURCE, /case "passed":[\s\S]*return "text-icon-accent-lime"/u);
	assert.match(SOURCE, /case "failed":[\s\S]*return "text-icon-danger"/u);
	assert.match(SOURCE, /case "pending":[\s\S]*return "text-border"/u);
	assert.match(
		SOURCE,
		/strokeDasharray=\{`\$\{arcLength\} \$\{CIRCUMFERENCE - arcLength\}`\}/u,
	);
	assert.match(SOURCE, /transform=\{`rotate\(-90 \$\{CENTER\} \$\{CENTER\}\)`\}/u);
	// Continuous ring remains the default when segments are absent.
	assert.match(SOURCE, /key="ring"/u);
	assert.match(SOURCE, /className="text-text-subtle"/u);
});

test("ProgressCircle segmented mode is an explicit toggle (default off)", () => {
	// Public API: boolean toggle, independent of outline/filled `variant`.
	assert.match(SOURCE, /segmented\?: boolean/u);
	assert.match(SOURCE, /segmented = false/u);
	// Segment arcs only render when the toggle is on AND segment data is present.
	assert.match(SOURCE, /const hasSegments = segmented && segmentList\.length > 0/u);
	// Segment data alone does not activate segmented rendering.
	assert.match(
		SOURCE,
		/Ignored unless `segmented` is `true`/u,
	);
});
