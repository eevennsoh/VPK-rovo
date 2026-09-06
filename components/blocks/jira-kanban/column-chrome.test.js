const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const COLUMN_CHROME_SOURCE = readFileSync(
	path.join(__dirname, "column-chrome.ts"),
	"utf8",
);
const SESSION_COLUMN_SOURCE = readFileSync(
	path.join(__dirname, "../agent-session-column/index.tsx"),
	"utf8",
);
const SESSION_HEADER_SOURCE = readFileSync(
	path.join(__dirname, "../agent-session-column/agent-session-column-header.tsx"),
	"utf8",
);

async function loadColumnChromeHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					DEFAULT_KANBAN_COLUMN_CHROME,
					KANBAN_COLUMN_DROP_TARGET_GROUP_CLASS,
					SIMPLE_KANBAN_DROP_ARMED_HEADER_CLASS_NAME,
					resolveKanbanColumnChrome,
				} from "./components/blocks/jira-kanban/column-chrome";
				export { token } from "./lib/tokens";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "column-chrome-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "column-chrome-harness.cjs");
}

test("default names bg-surface-sunken and the well tokens", async () => {
	const harness = await loadColumnChromeHarness();
	const chrome = harness.resolveKanbanColumnChrome("default");

	assert.equal(harness.DEFAULT_KANBAN_COLUMN_CHROME, "default");
	assert.equal(
		chrome.columnClassName,
		"bg-surface-sunken border border-solid border-transparent",
	);
	assert.equal(chrome.cardChrome, "raised");
	assert.equal(chrome.header.paddingTop, harness.token("space.100"));
	assert.equal(chrome.header.paddingInline, harness.token("space.150"));
	assert.equal(chrome.header.paddingBottom, harness.token("space.050"));
	assert.equal(chrome.cardList.paddingTop, harness.token("space.050"));
	assert.equal(chrome.cardList.paddingBottom, harness.token("space.100"));
	assert.equal(chrome.cardList.paddingInline, harness.token("space.050"));
	assert.equal(chrome.cardList.gap, harness.token("space.050"));
	assert.equal(chrome.footer.paddingInline, harness.token("space.050"));
	assert.equal(chrome.headerDropArmedClassName, "");
	assert.equal(chrome.resizeButtonClassName, "pt-2 pb-1");
	assert.equal(chrome.headerFrame, "enclosed");
	assert.equal(
		chrome.collapsed.pillClassName,
		"bg-surface-sunken border border-solid border-transparent",
	);
	assert.equal(chrome.collapsed.captionPaddingBottom, undefined);
	assert.equal(chrome.collapsed.countPaddingTop, harness.token("space.100"));
	assert.equal(chrome.collapsed.pillRadius, harness.token("radius.large"));
	assert.equal(chrome.collapsed.pillPaddingBlock, harness.token("space.150"));
	assert.equal("headerFrame" in chrome.collapsed, false);
});

test("default well and Untracked enclosed well share a 1px border box", () => {
	assert.match(
		COLUMN_CHROME_SOURCE,
		/columnClassName: "bg-surface-sunken border border-solid border-transparent"/u,
	);
	assert.match(
		SESSION_COLUMN_SOURCE,
		/AGENT_SESSION_WELL_PAINT = cn\(\s*AGENT_SESSION_PLANE,\s*"rounded-xl border border-solid border-border-disabled",\s*\)/u,
	);
	assert.match(
		SESSION_HEADER_SOURCE,
		/enclosed: \{\s*\n\s*paddingTop: token\("space\.100"\),\s*\n\s*paddingInline: token\("space\.150"\),\s*\n\s*paddingBottom: token\("space\.050"\),\s*\n\s*\}/u,
	);
	assert.match(
		SESSION_COLUMN_SOURCE,
		/layout === "enclosed" \? "border border-solid border-transparent" : null/u,
	);
	assert.match(COLUMN_CHROME_SOURCE, /countPaddingTop: token\("space\.100"\)/u);
});

test("simple has an empty class and undefined insets", async () => {
	const harness = await loadColumnChromeHarness();
	const chrome = harness.resolveKanbanColumnChrome("simple");

	assert.equal(chrome.columnClassName, "");
	assert.equal(chrome.cardChrome, "stroke");
	assert.equal(chrome.header.paddingTop, undefined);
	assert.equal(chrome.header.paddingInline, undefined);
	assert.equal("paddingBottom" in chrome.header, false);
	assert.equal(chrome.cardList.paddingTop, undefined);
	assert.equal(chrome.cardList.paddingBottom, undefined);
	assert.equal(chrome.cardList.paddingInline, undefined);
	assert.equal("gap" in chrome.cardList, false);
	assert.equal(chrome.footer.paddingInline, undefined);
	assert.equal(chrome.headerDropArmedClassName, harness.SIMPLE_KANBAN_DROP_ARMED_HEADER_CLASS_NAME);
	assert.equal(chrome.resizeButtonClassName, "");
	assert.equal(Object.hasOwn(chrome.header, "paddingTop"), true);
	assert.notEqual(chrome.header.paddingTop, 0);
	assert.notEqual(chrome.cardList.paddingInline, 0);
	assert.equal(chrome.headerFrame, "caption");
	assert.equal(chrome.collapsed.pillClassName, "border border-border-disabled");
	assert.equal(chrome.collapsed.captionPaddingBottom, harness.token("space.100"));
	assert.equal(chrome.collapsed.countPaddingTop, undefined);
	assert.equal(chrome.collapsed.pillRadius, harness.token("radius.large"));
	assert.equal(chrome.collapsed.pillPaddingBlock, harness.token("space.150"));
	assert.equal("headerFrame" in chrome.collapsed, false);
});

test("omit and undefined resolve to the default well", async () => {
	const harness = await loadColumnChromeHarness();
	const omitted = harness.resolveKanbanColumnChrome();
	const explicitUndefined = harness.resolveKanbanColumnChrome(undefined);
	const namedDefault = harness.resolveKanbanColumnChrome("default");

	assert.equal(omitted, namedDefault);
	assert.equal(explicitUndefined, namedDefault);
	assert.equal(
		omitted.columnClassName,
		"bg-surface-sunken border border-solid border-transparent",
	);
	assert.equal(omitted.cardChrome, "raised");
});

test("repeated resolve returns the same frozen object", async () => {
	const harness = await loadColumnChromeHarness();
	const firstDefault = harness.resolveKanbanColumnChrome("default");
	const secondDefault = harness.resolveKanbanColumnChrome("default");
	const firstSimple = harness.resolveKanbanColumnChrome("simple");
	const secondSimple = harness.resolveKanbanColumnChrome("simple");

	assert.equal(firstDefault, secondDefault);
	assert.equal(firstSimple, secondSimple);
	assert.notEqual(firstDefault, firstSimple);
	assert.equal(Object.isFrozen(firstDefault), true);
	assert.equal(Object.isFrozen(firstSimple), true);
});

test("simple drop-armed header inset matches stroke-card summary text and the drop ring motion", async () => {
	const harness = await loadColumnChromeHarness();
	const issueSource = readFileSync(
		path.join(__dirname, "../jira-issue/index.tsx"),
		"utf8",
	);

	assert.match(
		issueSource,
		/"group\/jira-issue relative w-full min-w-0 border outline-none focus-visible:border-ring"/u,
	);
	assert.match(issueSource, /usesCompactVisual \? "px-3 pt-3 pb-2" : "p-3"/u);
	assert.equal(
		harness.SIMPLE_KANBAN_DROP_ARMED_HEADER_CLASS_NAME,
		[
			"transition-[padding-inline] duration-normal ease-out-practical",
			"motion-reduce:transition-none",
			"group-[&.border-ring]/kanban-column-drop:[padding-inline:calc(1px+var(--ds-space-150))]",
		].join(" "),
	);
	assert.equal(
		harness.resolveKanbanColumnChrome("simple").headerDropArmedClassName,
		harness.SIMPLE_KANBAN_DROP_ARMED_HEADER_CLASS_NAME,
	);
	assert.equal(harness.resolveKanbanColumnChrome("default").headerDropArmedClassName, "");
	assert.equal(harness.KANBAN_COLUMN_DROP_TARGET_GROUP_CLASS, "group/kanban-column-drop");
	assert.match(
		COLUMN_CHROME_SOURCE,
		/Same duration\/easing as the drag-target border/u,
	);
});

test("the recipe module does not import design-variants", () => {
	assert.doesNotMatch(COLUMN_CHROME_SOURCE, /design-variants/u);
	assert.doesNotMatch(COLUMN_CHROME_SOURCE, /useDesignVariants/u);
	assert.doesNotMatch(COLUMN_CHROME_SOURCE, /isKanbanColumnChrome/u);
});

test("the recipe type-imports the session-column frame, not a duplicated union", () => {
	assert.match(
		COLUMN_CHROME_SOURCE,
		/import type \{ AgentSessionColumnFrame \} from "@\/components\/blocks\/agent-session-column\/agent-session-column-frame"/u,
	);
	assert.doesNotMatch(COLUMN_CHROME_SOURCE, /export type KanbanColumnHeaderFrame/u);
	assert.match(COLUMN_CHROME_SOURCE, /readonly headerFrame: AgentSessionColumnFrame;/u);
	assert.doesNotMatch(
		COLUMN_CHROME_SOURCE,
		/interface KanbanCollapsedChromeStyles \{[^}]*headerFrame/u,
	);
});
