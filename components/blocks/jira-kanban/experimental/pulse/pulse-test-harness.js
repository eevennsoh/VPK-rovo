const assert = require("node:assert/strict");
const { existsSync, readFileSync, readdirSync } = require("node:fs");
const { join, relative } = require("node:path");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

/**
 * Shared harness for the Pulse suites.
 *
 * Every suite executes the real code rather than grepping it, which needs the
 * same esbuild bundling and the same stub React dispatcher. That machinery
 * lives here so `pulse.test.js`, `pulse-scrubber.test.js` and
 * `pulse-outline.test.js` can each stay well under the repo's file-size budget
 * without duplicating it.
 */

const PULSE_DIR = __dirname;
const EXPERIMENTAL_DIR = join(PULSE_DIR, "..");
const KANBAN_DIR = join(EXPERIMENTAL_DIR, "..");

const SOURCES = {
	data: readFileSync(join(PULSE_DIR, "data", "pulse-timeline.ts"), "utf8"),
	hook: readFileSync(join(PULSE_DIR, "hooks", "use-pulse-timeline.ts"), "utf8"),
	// The ruler's pure geometry and weights. Split out of the scrubber so a
	// component file stops exporting helpers, which defeats Fast Refresh.
	marks: readFileSync(join(PULSE_DIR, "lib", "pulse-marks.ts"), "utf8"),
	rail: readFileSync(join(PULSE_DIR, "components", "pulse-rail.tsx"), "utf8"),
	// The reading position: the only programmatic scroll left in Pulse.
	reading: readFileSync(join(PULSE_DIR, "hooks", "use-pulse-reading.ts"), "utf8"),
	scrubber: readFileSync(join(PULSE_DIR, "components", "pulse-scrubber.tsx"), "utf8"),
	shell: readFileSync(join(PULSE_DIR, "experimental-pulse.tsx"), "utf8"),
	signals: readFileSync(join(PULSE_DIR, "components", "pulse-signals.tsx"), "utf8"),
	story: readFileSync(join(PULSE_DIR, "components", "pulse-story.tsx"), "utf8"),
	// The continuous article. It did not exist under the snapshot-at-a-time
	// model, and it is now where several contracts that used to sit in the shell
	// or the story live: the per-insight scoping, the read/unread treatment, and
	// the single polite status for the whole document.
	stream: readFileSync(join(PULSE_DIR, "components", "pulse-stream.tsx"), "utf8"),
};

const EXPERIMENTAL_PAGE_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "page.tsx"), "utf8");
const EXPERIMENTAL_HEADER_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "experimental-board-header.tsx"), "utf8");
const PULSE_MODE_CONTROLS_SOURCE = readFileSync(join(PULSE_DIR, "components", "pulse-mode-controls.tsx"), "utf8");
const DEFAULT_BOARD_SOURCE = readFileSync(join(KANBAN_DIR, "index.tsx"), "utf8");
const DEFAULT_PAGE_SOURCE = readFileSync(join(KANBAN_DIR, "page.tsx"), "utf8");
const DEFAULT_HEADER_SOURCE = readFileSync(join(KANBAN_DIR, "board-header.tsx"), "utf8");

/* ------------------------------------------------------------------ */
/* Harnesses                                                            */
/* ------------------------------------------------------------------ */

/**
 * A minimal hook dispatcher. `usePulseMemberFilter` and `usePulseTimeline` only
 * use `useState`, `useMemo` and `useCallback`, so swapping `react` for this
 * runtime executes the real hooks — including the filter's state transitions —
 * without a renderer.
 */
const HOOK_RUNTIME_SOURCE = `
	let cells = [];
	let cursor = 0;
	let renderComponent = null;
	let latest;

	function depsEqual(previous, next) {
		if (previous === undefined || next === undefined || previous.length !== next.length) {
			return false;
		}
		return previous.every((dep, index) => Object.is(dep, next[index]));
	}

	function render() {
		cursor = 0;
		latest = renderComponent();
		return latest;
	}

	export function useState(initialState) {
		const index = cursor++;
		if (cells[index] === undefined) {
			cells[index] = { value: typeof initialState === "function" ? initialState() : initialState };
		}
		const cell = cells[index];
		return [cell.value, (next) => {
			const value = typeof next === "function" ? next(cell.value) : next;
			if (Object.is(value, cell.value)) {
				return;
			}
			cell.value = value;
			render();
		}];
	}

	export function useMemo(factory, deps) {
		const index = cursor++;
		const cell = cells[index];
		if (cell !== undefined && depsEqual(cell.deps, deps)) {
			return cell.value;
		}
		const value = factory();
		cells[index] = { deps, value };
		return value;
	}

	export function useCallback(callback, deps) {
		return useMemo(() => callback, deps);
	}

	export function __mount(component) {
		cells = [];
		cursor = 0;
		renderComponent = component;
		render();
		return { get current() { return latest; } };
	}

	/**
	 * Re-run the mounted component without a state change. The reading position
	 * is a prop now rather than hook state, so moving it is an outside-in
	 * re-render — exactly what \`usePulseReading\` does to the shell.
	 */
	export function __render() {
		return render();
	}
`;

const hookRuntimePlugin = {
	name: "pulse-hook-runtime",
	setup(build) {
		// esbuild compiles these filters with Go's regexp engine, which rejects
		// JavaScript's `u` flag — keep them plain.
		build.onResolve({ filter: /^react$/ }, () => ({ namespace: "pulse-hook-runtime", path: "react" }));
		build.onLoad({ filter: /.*/, namespace: "pulse-hook-runtime" }, () => ({
			contents: HOOK_RUNTIME_SOURCE,
			loader: "js",
		}));
	},
};

async function bundleHarness({ contents, plugins = [], sourcefile }) {
	const result = await esbuild.build({
		bundle: true,
		format: "cjs",
		loader: { ".css": "empty" },
		platform: "node",
		plugins,
		stdin: { contents, loader: "ts", resolveDir: process.cwd(), sourcefile },
		tsconfig: join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

let timelineHarnessPromise;
let scrubberHarnessPromise;
let outlineHarnessPromise;
let rosterMarkupHarnessPromise;
let attentionHarnessPromise;

/**
 * The pure signal → agent-list-row mapping behind the "Needs attention"
 * section. It imports nothing but types from the shared block, so it bundles as
 * a leaf and can be executed rather than grepped.
 */
function loadAttentionHarness() {
	attentionHarnessPromise ??= bundleHarness({
		contents: `
			export {
				toAttentionMetadata,
				toAttentionState,
				toPulseAttentionItems,
			} from "./components/blocks/jira-kanban/experimental/pulse/lib/pulse-attention";
			export { PULSE_TIMELINE } from "./components/blocks/jira-kanban/experimental/pulse/data/pulse-timeline";
		`,
		sourcefile: "pulse-attention-harness.ts",
	});

	return attentionHarnessPromise;
}

const rosterMarkupPlugin = {
	name: "pulse-roster-markup-mocks",
	setup(build) {
		build.onResolve({ filter: /^@atlaskit\/icon\/core\/pulse$/ }, () => ({
			namespace: "pulse-roster-markup-mock",
			path: "pulse-icon",
		}));
		build.onResolve({ filter: /^@\/components\/ui\/(?:button|icon)$/ }, (args) => ({
			namespace: "pulse-roster-markup-mock",
			path: args.path,
		}));
		build.onLoad({ filter: /.*/, namespace: "pulse-roster-markup-mock" }, (args) => {
			if (args.path === "pulse-icon") {
				return {
					contents: "export default function PulseIcon() { return null; }",
					loader: "js",
				};
			}

			const exportName = args.path.endsWith("/button") ? "Button" : "Icon";
			return {
				contents: `export function ${exportName}() { return null; }`,
				loader: "js",
			};
		});
	},
};

/**
 * The real hooks plus the fixture, driven by the stub dispatcher above.
 *
 * `mountPulse` composes them the way the shell does, and in the same order: the
 * member filter first, because the reading position re-keys on it, then the
 * derivations on top of a reading position handed in from outside. The hook
 * used to own that index and expose `goToIndex`/`goToNext`/`goToPrevious`; the
 * article is one continuous document now, so the position belongs to
 * `usePulseReading` and arrives here as a prop — `host.read(index)` is the test
 * seam that stands in for the reader scrolling.
 */
function loadTimelineHarness() {
	timelineHarnessPromise ??= bundleHarness({
		contents: `
			import { __mount, __render } from "react";
			import { PULSE_TIMELINE } from "./components/blocks/jira-kanban/experimental/pulse/data/pulse-timeline";
			import {
				clampSnapshotIndex,
				computeHighlightedIndexes,
				computeMemberWeek,
				findAdjacentActiveIndexes,
				findContribution,
				resolveLooseWork,
				resolveWorkItems,
				scopeArtifacts,
				scopeByWorkItem,
				usePulseMemberFilter,
				usePulseTimeline,
			} from "./components/blocks/jira-kanban/experimental/pulse/hooks/use-pulse-timeline";

			export {
				clampSnapshotIndex,
				computeHighlightedIndexes,
				computeMemberWeek,
				findAdjacentActiveIndexes,
				findContribution,
				PULSE_TIMELINE,
				resolveLooseWork,
				resolveWorkItems,
				scopeArtifacts,
				scopeByWorkItem,
			};

			export function mountPulse(timeline = PULSE_TIMELINE, startIndex = 0) {
				let activeIndex = startIndex;
				const host = __mount(() => {
					const filter = usePulseMemberFilter();
					const model = usePulseTimeline(timeline, {
						activeIndex,
						selectedMemberId: filter.selectedMemberId,
					});
					return { ...model, ...filter };
				});
				return {
					get current() {
						return host.current;
					},
					read(index) {
						activeIndex = index;
						__render();
					},
				};
			}
		`,
		plugins: [hookRuntimePlugin],
		sourcefile: "pulse-timeline-harness.ts",
	});

	return timelineHarnessPromise;
}

/** The ruler's pure geometry and naming, bundled against the real React. */
function loadScrubberHarness() {
	scrubberHarnessPromise ??= bundleHarness({
		contents: `
			export {
				isPulseSectionDimmed,
				toMagnification,
				toMarkHint,
				toMarkLabel,
				toMarkState,
				toNearestEntryIndex,
				toWeekdayLabel,
			} from "./components/blocks/jira-kanban/experimental/pulse/lib/pulse-marks";
		`,
		sourcefile: "pulse-scrubber-harness.ts",
	});

	return scrubberHarnessPromise;
}

/** The reading outline — the one model behind both the ruler and the article. */
function loadOutlineHarness() {
	outlineHarnessPromise ??= bundleHarness({
		contents: `
			export {
				buildPulseOutline,
				isPulseScrollTowardTop,
				toActiveInsightEntry,
				toActiveOutlineIndex,
				toAdjacentInsightIndex,
				toPulseAnchorId,
				toPulseInsightEntries,
				toPulseScrollOffset,
				toPulseSections,
				toRulerHeading,
			} from "./components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";
		`,
		sourcefile: "pulse-outline-harness.ts",
	});

	return outlineHarnessPromise;
}

/** The canonical header roster rendered through React's server renderer. */
function loadRosterMarkupHarness() {
	rosterMarkupHarnessPromise ??= bundleHarness({
		contents: `
			import React from "react";
			import { renderToString } from "react-dom/server";
			import { PulseRosterFacepile } from "./components/blocks/jira-kanban/experimental/pulse/components/pulse-mode-controls";
			import { PULSE_TIMELINE } from "./components/blocks/jira-kanban/experimental/pulse/data/pulse-timeline";

			export function renderRosterMarkup() {
				return renderToString(React.createElement(PulseRosterFacepile, {
					members: PULSE_TIMELINE.members,
					onSelectedMemberIdChange: () => {},
					selectedMemberId: null,
				}));
			}
		`,
		plugins: [rosterMarkupPlugin],
		sourcefile: "pulse-roster-markup-harness.ts",
	});

	return rosterMarkupHarnessPromise;
}

function snapshotAt(timeline, index) {
	return timeline.snapshots[index];
}

function findSnapshotIndex(timeline, id) {
	const index = timeline.snapshots.findIndex((snapshot) => snapshot.id === id);
	assert.notEqual(index, -1, `fixture is missing the snapshot "${id}"`);
	return index;
}

module.exports = {
	assert,
	bundleHarness,
	DEFAULT_BOARD_SOURCE,
	DEFAULT_HEADER_SOURCE,
	DEFAULT_PAGE_SOURCE,
	existsSync,
	EXPERIMENTAL_DIR,
	EXPERIMENTAL_HEADER_SOURCE,
	EXPERIMENTAL_PAGE_SOURCE,
	PULSE_MODE_CONTROLS_SOURCE,
	findSnapshotIndex,
	join,
	KANBAN_DIR,
	loadAttentionHarness,
	loadOutlineHarness,
	loadRosterMarkupHarness,
	loadScrubberHarness,
	loadTimelineHarness,
	PULSE_DIR,
	readdirSync,
	readFileSync,
	relative,
	snapshotAt,
	SOURCES,
};
