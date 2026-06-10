const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(
	path.join(__dirname, "hover-reveal-row.tsx"),
	"utf8",
);

test("hover-reveal-row exposes the container class + label + actions primitives", () => {
	assert.match(SOURCE, /export const hoverRevealRowClassName = "group\/hover-reveal-row relative";/u);
	assert.match(SOURCE, /export function HoverRevealLabel\(/u);
	assert.match(SOURCE, /export function HoverRevealActions\(/u);
});

test("label reserves padding from a descendant so a self group-hover never misfires", () => {
	// The reserve is keyed off the row group and applied to the label (a
	// descendant) — the exact thing a self `group-hover` on the container cannot
	// do. Literal strings so Tailwind can statically extract them.
	// The label animates its reserve padding so the text reflows smoothly as the
	// controls reveal on hover/focus, instead of snapping.
	assert.match(SOURCE, /block w-full truncate transition-\[padding\]/u);
	assert.match(
		SOURCE,
		/group-hover\/hover-reveal-row:pr-9 group-has-\[:focus-visible\]\/hover-reveal-row:pr-9/u,
	);
	assert.match(
		SOURCE,
		/group-hover\/hover-reveal-row:pr-\[72px\] group-has-\[:focus-visible\]\/hover-reveal-row:pr-\[72px\]/u,
	);
	// Rest reserve is the static padding (no modifier) for parked controls.
	assert.match(SOURCE, /0: "",\s*1: "pr-9",\s*2: "pr-\[72px\]",/u);
});

test("actions overlay parks the toggle and slides controls in on reveal", () => {
	// Toggle reveals on hover/focus, parks at the far right, and slides left to
	// clear the action slot when an action is present.
	assert.match(SOURCE, /group-hover\/hover-reveal-row:opacity-100 group-has-\[:focus-visible\]\/hover-reveal-row:opacity-100/u);
	assert.match(SOURCE, /right-2 group-hover\/hover-reveal-row:right-9 group-has-\[:focus-visible\]\/hover-reveal-row:right-9/u);
	assert.match(SOURCE, /toggleParked \? "opacity-100" : "opacity-0"/u);
	// Action slides in from translate-x-2 → 0 and fades in on reveal.
	assert.match(SOURCE, /translate-x-2[\s\S]*group-hover\/hover-reveal-row:translate-x-0 group-hover\/hover-reveal-row:opacity-100/u);
});
