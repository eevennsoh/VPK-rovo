const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/website/demos/ui/button-group-demo.tsx"),
	"utf8",
);
const BUTTON_DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/website/demos/ui/button-demo.tsx"),
	"utf8",
);
const BUTTON_GROUP_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui/button-group.tsx"),
	"utf8",
);
const BUTTON_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui/button.tsx"),
	"utf8",
);
const BUTTON_GROUP_DETAIL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app/data/details/ui/button-group.ts"),
	"utf8",
);
const BUTTON_DETAIL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app/data/details/ui/button.ts"),
	"utf8",
);

const SELECTED_SEGMENT_SELECTOR =
	"[&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]";
const FOCUS_VISIBLE_SEGMENT_SELECTOR =
	"[&>[data-slot]~[data-slot]:focus-visible]";
const SELECTED_BUTTON_STATE_CLASSES = [
	"aria-pressed:bg-bg-selected",
	"aria-pressed:text-text-selected",
	"aria-pressed:border-border-selected",
	"aria-pressed:hover:bg-bg-selected-hovered",
	"aria-pressed:active:bg-bg-selected-pressed",
	"aria-expanded:bg-bg-selected",
	"aria-expanded:text-text-selected",
	"aria-expanded:border-border-selected",
];

test("the split variation preserves connected geometry and uses the correct seams", () => {
	assert.match(BUTTON_GROUP_SOURCE, /split:[\s\S]*\[&>button\[data-variant=default\]\]:border-primary[\s\S]*\[&>button\[data-variant=default\]:first-child\]:border-r-border-inverse[\s\S]*has-\[button\[aria-expanded=true\]\]:\[&>button\[data-variant=outline\]:first-child\]:border-r-border-selected/u);
	assert.match(BUTTON_GROUP_SOURCE, /variant: \["connected", "split"\]/u);
	assert.match(BUTTON_SOURCE, /data-variant=\{variant \?\? "default"\}/u);
});

test("selected segments after the first paint a leading stroke without changing seam geometry", () => {
	const requiredOverlayClasses = [
		":relative",
		":before:pointer-events-none",
		":before:absolute",
		":before:inset-y-0",
		":before:-left-px",
		":before:w-px",
		":before:bg-border-selected",
		":before:content-['']",
	];

	for (const className of requiredOverlayClasses) {
		assert.ok(
			BUTTON_GROUP_SOURCE.includes(`${SELECTED_SEGMENT_SELECTOR}${className}`),
			`selected segment seam is missing ${className}`,
		);
	}

	assert.ok(!BUTTON_GROUP_SOURCE.includes(`${SELECTED_SEGMENT_SELECTOR}:-ml-px`));
	assert.ok(!BUTTON_GROUP_SOURCE.includes(`${SELECTED_SEGMENT_SELECTOR}:border-l`));
});

test("focus-visible segments after the first paint a leading ring-colored stroke", () => {
	const requiredOverlayClasses = [
		":relative",
		":before:pointer-events-none",
		":before:absolute",
		":before:inset-y-0",
		":before:-left-px",
		":before:w-px",
		":before:bg-ring",
		":before:content-['']",
	];

	for (const className of requiredOverlayClasses) {
		assert.ok(
			BUTTON_GROUP_SOURCE.includes(`${FOCUS_VISIBLE_SEGMENT_SELECTOR}${className}`),
			`focus-visible segment seam is missing ${className}`,
		);
	}
});

test("all button variants inherit one shared pressed and expanded state contract", () => {
	assert.match(BUTTON_SOURCE, /const buttonVariants = cva\(\n\t`\$\{selectedButtonState\} /u);

	for (const className of SELECTED_BUTTON_STATE_CLASSES) {
		assert.equal(
			BUTTON_SOURCE.split(className).length - 1,
			1,
			`${className} must stay centralized in selectedButtonState`,
		);
	}
});

test("the selected-state gallery covers every button variant", () => {
	const selectedDemo = BUTTON_DEMO_SOURCE.match(
		/export function ButtonDemoSelected\(\) \{([\s\S]*?)\n\}/u,
	)?.[1] ?? "";

	assert.match(selectedDemo, /<Button aria-pressed="true">Default<\/Button>/u);
	for (const variant of ["outline", "secondary", "ghost", "destructive", "warning", "discovery", "link"]) {
		assert.match(
			selectedDemo,
			new RegExp(`<Button variant="${variant}" aria-pressed="true">`, "u"),
			`${variant} is missing from ButtonDemoSelected`,
		);
	}
});

test("the connected dropdown-action demo uses its shared seam and VPK chevron", () => {
	const separatorDemo = DEMO_SOURCE.match(
		/export function ButtonGroupDemoWithSeparator\(\) \{([\s\S]*?)\n\}/u,
	)?.[1] ?? "";

	assert.match(separatorDemo, /<ButtonGroup variant="split">[\s\S]*<Button variant="outline">Link work item<\/Button>[\s\S]*aria-label="More link actions"/u);
	assert.match(separatorDemo, /<ButtonGroup variant="split">[\s\S]*<Button>Update<\/Button>[\s\S]*aria-label="More update actions"/u);
	assert.match(separatorDemo, /Option one[\s\S]*Option two/u);
	assert.doesNotMatch(separatorDemo, /ButtonGroupSeparator/u);
	assert.doesNotMatch(separatorDemo, /▼/u);
});

test("the component docs assign the Atlaskit split and group equivalents to Button Group", () => {
	assert.match(BUTTON_GROUP_DETAIL_SOURCE, /\{ SplitButton \} from @atlaskit\/button\/new/u);
	assert.match(BUTTON_GROUP_DETAIL_SOURCE, /\{ ButtonGroup \} from @atlaskit\/button\/new/u);
	assert.doesNotMatch(BUTTON_DETAIL_SOURCE, /\{ ButtonGroup \} from @atlaskit\/button\/new/u);
});
