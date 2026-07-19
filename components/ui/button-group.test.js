const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/website/demos/ui/button-group-demo.tsx"),
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

test("the split variation preserves connected geometry and uses the correct seams", () => {
	assert.match(BUTTON_GROUP_SOURCE, /split:[\s\S]*\[&>button\[data-variant=default\]\]:border-primary[\s\S]*\[&>button\[data-variant=default\]:first-child\]:border-r-border-inverse[\s\S]*has-\[button\[aria-expanded=true\]\]:\[&>button\[data-variant=outline\]:first-child\]:border-r-border-selected/u);
	assert.match(BUTTON_GROUP_SOURCE, /variant: \["connected", "split"\]/u);
	assert.match(BUTTON_SOURCE, /data-variant=\{variant \?\? "default"\}/u);
});

test("selected segments after the first paint a leading stroke without changing seam geometry", () => {
	assert.match(
		BUTTON_GROUP_SOURCE,
		/\[&>\[data-slot\]~\[data-slot\]:is\(\[aria-expanded=true\],\[aria-pressed=true\]\)\]:relative/u,
	);
	assert.match(
		BUTTON_GROUP_SOURCE,
		/\[&>\[data-slot\]~\[data-slot\]:is\(\[aria-expanded=true\],\[aria-pressed=true\]\)\]:before:-left-px/u,
	);
	assert.match(
		BUTTON_GROUP_SOURCE,
		/\[&>\[data-slot\]~\[data-slot\]:is\(\[aria-expanded=true\],\[aria-pressed=true\]\)\]:before:w-px/u,
	);
	assert.match(
		BUTTON_GROUP_SOURCE,
		/\[&>\[data-slot\]~\[data-slot\]:is\(\[aria-expanded=true\],\[aria-pressed=true\]\)\]:before:bg-border-selected/u,
	);
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
