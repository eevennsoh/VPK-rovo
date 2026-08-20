const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadTerminalStoryHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export { foldBeats } from "./components/projects/jira-golden-journeys-v1/lib/terminal-demo-state";
					export {
					getJiraGoldenJourneysV3IssueUrl,
					JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS,
					JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT,
					JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY,
				} from "./components/projects/jira-golden-journeys-v3/data/terminal-story";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "jira-golden-journeys-v3-terminal-story-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

const TERMINAL_COMPONENT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/jira-golden-journeys-v3/terminal-story.tsx"),
	"utf8",
);
const PAGE_COMPONENT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/jira-golden-journeys-v3/page.tsx"),
	"utf8",
);

test("v3 terminal tells the local Claude-to-PR story in order", async () => {
	const harness = await loadTerminalStoryHarness();
	assert.deepEqual(
		harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS.map((beat) => beat.id),
		["implement", "local-checks", "create-pull-request", "ci-started"],
	);
	assert.equal(harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS[0].trigger, "click");
	assert.equal(harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT, 5);
	assert.ok(
		harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS
			.flatMap((beat) => beat.steps)
			.every((step) => !("pane" in step) || step.pane === "right"),
	);
	assert.ok(
		harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS
			.flatMap((beat) => beat.steps)
			.every((step) => !["split", "show-dashboard", "board"].includes(step.kind)),
	);

	const allText = harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS
		.flatMap((beat) => beat.steps)
		.flatMap((step) => {
			if (step.kind === "type") return [step.text];
			if (step.kind === "output") return step.lines.flatMap((line) => line.map((span) => span.text));
			return [];
		})
		.join("\n");

	assert.match(allText, /Implement SHOP-4821 guest checkout/u);
	assert.match(allText, /feature\/shop-4821-guest-checkout/u);
	assert.match(allText, /opened PR #1847/u);
	assert.match(allText, /Priya Narayanan and Jordan Lee requested/u);
	assert.match(allText, /CI started for PR #1847/u);
	assert.doesNotMatch(allText, /Code Planner|auto-merge|merged into main/u);
});

test("v3 terminal finishes with an open PR handoff and directs the presenter to Build", async () => {
	const harness = await loadTerminalStoryHarness();
	const { JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_BEATS: beats } = harness;
	const final = harness.foldBeats(beats, beats.length - 1);

	assert.equal(final.finished, true);
	assert.deepEqual(final.items, []);
	assert.equal(final.split, false);
	assert.equal(final.dashboardVisible, false);
	assert.equal(harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY.layout, "claude-only");
	assert.match(
		final.right.transcript.flatMap((line) => line.map((span) => span.text)).join("\n"),
		/CI started for PR #1847/u,
	);
	assert.equal(harness.JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY.finishedHint, "PR #1847 created · select Build above");
	assert.equal(
		harness.getJiraGoldenJourneysV3IssueUrl("SHOP-4821"),
		"https://jira-golden-journeys-v3.atlassian.net/browse/SHOP-4821",
	);
});

test("v3 terminal exposes controlled reset, completion, and accessible handoff contracts", () => {
	assert.match(TERMINAL_COMPONENT_SOURCE, /controller: TerminalDemoController/u);
	assert.match(TERMINAL_COMPONENT_SOURCE, /resetKey\?: number \| string/u);
	assert.doesNotMatch(TERMINAL_COMPONENT_SOURCE, /onStepChange|onComplete/u);
	assert.match(TERMINAL_COMPONENT_SOURCE, /data-story-complete=\{controller\.state\.finished \? "true" : "false"\}/u);
	assert.match(TERMINAL_COMPONENT_SOURCE, /PR #1847 created\. Priya Narayanan and Jordan Lee requested as reviewers\./u);
	assert.match(TERMINAL_COMPONENT_SOURCE, /theme\?: "dark" \| "light"/u);
	assert.match(TERMINAL_COMPONENT_SOURCE, /data-color-mode=\{theme\}/u);
	assert.match(
		TERMINAL_COMPONENT_SOURCE,
		/left-1\/2 h-full min-h-0 w-\[100cqw\] -translate-x-1\/2 bg-surface/u,
	);
	assert.match(PAGE_COMPONENT_SOURCE, /useState<"dark" \| "light">\("dark"\)/u);
	assert.match(PAGE_COMPONENT_SOURCE, /useTerminalDemo\([\s\S]*JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STORY/u);
	assert.match(PAGE_COMPONENT_SOURCE, /terminalController\.state\.beatIndex \+ 2/u);
	assert.match(PAGE_COMPONENT_SOURCE, /theme=\{isTerminalChapter \? terminalTheme : undefined\}/u);
	assert.match(PAGE_COMPONENT_SOURCE, /data-color-mode": terminalTheme/u);
});
