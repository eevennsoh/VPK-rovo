import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const COMPONENT_TEST_PREFIX = "components/";
const COMPONENT_TEST_REPORT_PREFIX = "JS_UNIT_COMPONENT_TEST_REPORT";

const EXCLUDED_TEST_FILES = new Set([
	// Stale source-extraction coverage for functions no longer in backend/server.js.
	"backend/lib/deferred-clarification-replay.test.js",
]);
const INCLUDED_TEST_PREFIXES = [
	"app/",
	"backend/",
	"lib/",
	"rovo/",
	"scripts/",
];
// Specific tests gated by CI even though they live outside the broad included
// prefixes or under `components/` (which has 200+ source-assertion tests that
// have drifted and aren't CI-maintained).
// This covers the agent-generation creation-context seam. NOTE: the broader
// `rovo-app-agent-creation-flow.test.js` is deliberately NOT gated — it bundles
// pre-existing source-grep tests (greeting, landing layout) that drift whenever
// main refactors those components; the focused tests here plus the e2e pipeline
// test in `app/data/directory/agent-generation-e2e.test.js` cover this feature.
const INCLUDED_TEST_FILES = new Set([
	// Root-level Teamwork Graph installer wrapper contract.
	"twg-install.test.js",
	"components/projects/studio/lib/studio-agent-creation-context.test.js",
	// Widened agent-draft patch contract used by the on-screen assistants (voice
	// cursor + Ask Rovo sidebar). Bundles the real catalog via the directory
	// harness, so gate it explicitly like its sibling above.
	"components/projects/studio/lib/studio-screen-assistant-patch.test.js",
	// Generated agent-result card placement/source contract. A recent render-gate
	// change left this colocated test stale until review, so keep it CI-gated.
	"components/projects/sidebar-chat/components/agent-result-card.test.js",
	"components/projects/sidebar-chat/lib/agent-activity-timeline.test.js",
	// Skills project add-menu shortcuts and deterministic skill invocation matcher.
	// Components are not included wholesale, so gate these focused contracts.
	"components/projects/skills/page.test.js",
	"components/projects/skills/lib/skill-intercept.test.js",
	// Shared docs preview shell frame and sizing behavior.
	// Components are not included wholesale, so keep this focused coverage gated.
	"components/website/component-doc/components/demo-preview-shell.test.js",
	// Website preview defers far-offscreen cards; keep the focused visibility
	// contract gated without admitting the broader website component test set.
	"components/website/website-preview-visibility.test.js",
	// Screen-assistant target geometry powers point_at_target; keep this pure
	// viewport conversion test gated without enabling the component tree wholesale.
	"components/screen-assistant/screen-assistant-geometry.test.js",
	// Canonical logo usage metadata (1P/2P/3P border treatment) — guards the
	// on-disk 16-borderless.svg <-> logo-usage.json sync. Lives under components/
	// (which is not CI-gated wholesale) so it is included explicitly.
	"components/ui/data/logo-usage.test.js",
	// Breadcrumbs mirror the refreshed ADS medium/small sizing API. Components
	// are not included wholesale, so gate this focused source contract explicitly.
	"components/ui/breadcrumb.test.js",
	// Labelling components mirror the latest ADS visual-uplift package contracts.
	"components/ui/badge.test.js",
	"components/ui/date-label.test.js",
	"components/ui/lozenge.test.js",
	"components/ui/tag.test.js",
	// Shared select primitive keeps selected indicators aligned with dropdown menu
	// affordances. Components are not included wholesale, so gate it explicitly.
	"components/ui/select.test.js",
	// Shared checkbox primitive keeps a 16px visual box with a 24px hit target.
	"components/ui/checkbox.test.js",
	// Shared radio primitive and demos keep 24px hit/row geometry.
	"components/ui/radio-group.test.js",
	// Shared field rows keep checkbox/radio label lines aligned to 24px targets.
	"components/ui/field.test.js",
	// Checkbox docs group keeps checkbox rows contiguous under the group label.
	"components/website/demos/ui/checkbox-demo.test.js",
	// Shared message markdown heading spacing used by compact chat surfaces.
	"components/ui-custom/message.test.js",
	// Plan's hidden-until-found panel must not leave vertical content padding
	// behind while collapsed.
	"components/ui-custom/plan.test.js",
	// Shared Teamwork Graph loader is server-rendered on pages like /personal-graph.
	// Keep its SVG color attributes deterministic across SSR/client hydration.
	"components/ui-custom/twg-loader/twg-loader.test.js",
	// Shared scroll-mask overflow state is used by directory panes and composer
	// textareas; keep the pure edge-case contract gated without broad hook tests.
	"components/hooks/use-has-vertical-overflow.test.js",
	// Personal Graph neural renderer/store/sound/layout contracts. This is a pure
	// node:test file under components/arts, so gate it explicitly without enabling
	// broad source-grep component tests.
	"components/arts/personal-graph/lib/neural-graph/neural-graph.test.js",
	// Scheduled-trigger inference (daily-at-7am + NL → structured definitions).
	// Lives under components/ so it must be included explicitly to run in CI.
	"components/blocks/triggers/data/trigger-inference.test.js",
	// Pure LCS/digit reconcile logic behind the Text Morphing visual component.
	// No source-grep assertions (so it won't drift like the wholesale component
	// tests); included explicitly so the morph keying stays guarded in CI.
	"components/visual/text-morphing/lib.test.js",
	// SVG Tracing parses pasted SVG/path input before rendering it; keep the pure
	// parser/sanitizer contract gated without enabling broad component tests.
	"components/visual/svg-tracing/lib.test.js",
	// Pure heatmap date-domain/filtering contracts behind the chart component.
	// Components are not included wholesale, so this focused coverage is listed
	// explicitly to keep it gated by CI.
	"components/ui-charts/heatmap/heatmap-utils.test.js",
	// Pure config helper and registry wiring coverage for the Ink Wash visual.
	// Components are not included wholesale, so keep this focused coverage gated.
	"components/visual/ink-wash/data.test.js",
	"components/visual/ink-wash/registry.test.js",
	// Upstream option contract and registry wiring coverage for Liquid Metal.
	// Components are not included wholesale, so keep this focused coverage gated.
	"components/visual/liquid-metal/data.test.js",
	"components/visual/liquid-metal/registry.test.js",
	// Border Beam vendored upstream defaults and visual docs wiring.
	// Components are not included wholesale, so keep this focused coverage gated.
	"components/visual/border-beam/data.test.js",
	"components/visual/border-beam/registry.test.js",
	"components/visual/border-beam/source.test.js",
	// ADS semantic label color tokens should stay exposed by the visual Color
	// demo and Tailwind theme aliases.
	"components/website/demos/visual/color-demo.test.js",
	// Pure defaults/options/helpers behind the ASCII visual demo controls.
	// Components are not included wholesale, so keep this model test gated.
	"components/website/demos/visual/ascii-control-model.test.js",
	// Ripple's image-shader wiring and Framer-style controls live under
	// components/, so gate this focused source contract explicitly.
	"components/website/demos/visual/ripple-demo.test.js",
	// Liquid Glass shader utility math is shared by the visual demo and shader
	// wrapper. Gate this pure utility coverage without the source-grep demo tests.
	"components/website/demos/visual/shaders/liquid-glass-utils.test.js",
	// Deterministic studio agent-builder: prompt → agent create/update patch
	// against the fake catalogs. Pure module under components/, so gate explicitly.
	"components/projects/studio/lib/demo-agent-builder.test.js",
	// Skill Config keeps its footer toolbar intentionally apps-only; this guards
	// the named visibility model so it does not drift back into ad hoc filters.
	"components/blocks/skill-config/skill-config.test.js",
	// Studio-only automation-discovery demo: custom ArtifactList widget and TWG
	// trace wiring live under components/, so gate this focused source coverage.
	"components/projects/studio/components/rovo-app-automation-discovery-widget.test.js",
	// Control-plane memory artifact target selection decides whether generated
	// briefs/decks use one explicit node or the full filtered explorer view.
	"components/projects/control-plane/lib/memory-artifact-selection.test.ts",
	// Clicky live-voice transcript streaming is shared by /studio and /rovo but
	// implemented in route shells/hooks; keep this focused source contract gated
	// without enabling broad drift-prone component source tests.
	"components/projects/studio/lib/clicky-voice-streaming-source.test.js",
	// Shared automation flow cover used by trigger config and the test landing
	// page, so both surfaces keep the same trigger → agent visual treatment.
	"components/blocks/triggers/components/agent-automation-flow-cover.test.js",
	// Pure waveform layout and audio-band mapping used by compact composer voice
	// affordances. Components are not included wholesale, so gate explicitly.
	"components/ui-audio/live-waveform-layout.test.js",
	// Shared GUI utility controls and copy-filtering helpers are used across many
	// visual demos, so gate their source and pure helper contracts explicitly.
	"components/website/demos/utils/gui-demo.test.js",
	"components/utils/gui.test.js",
	"components/utils/gui-color.test.js",
	"components/utils/gui-values.test.js",
	// Root-mounted :user-invalid -> aria-invalid bridge. Components are not
	// included wholesale, so gate the pure DOM ownership contract explicitly.
	"components/utils/user-invalid-sync.test.js",
	// Awake city persistence contracts guard localStorage migration, removal
	// selection, and debounced writes without gating the broad source-grep UI tests.
	"components/arts/awake/city-storage.test.js",
	"components/arts/awake/use-cities.test.js",
	// Cursors art: voice intent → cursor fan-out trigger. Stable pure-function
	// contract; gate it explicitly without enabling the broad UI source tests.
	"components/arts/cursors/agent-team-intent.test.js",
	"components/arts/cursors/agent-team-lines.test.js",
	"components/arts/cursors/cursor-agents.test.js",
	"components/arts/cursors/launch-intent.test.js",
	// Repo-owned extraction scaffolding lives under .agents, outside the broad
	// test prefixes, but it is a stable node:test contract for vpk-build output.
	".agents/skills/vpk-build/scripts/scaffold-target.test.js",
	// Guards the memoized work-item due-date formatter reuse. Components are not
	// included wholesale, so gate this focused contract explicitly.
	"components/blocks/work-item-widget/work-item-widget.test.js",
]);

export function getTestFileInclusion(filePath, {
	excludedTestFiles = EXCLUDED_TEST_FILES,
	includedTestFiles = INCLUDED_TEST_FILES,
	includedTestPrefixes = INCLUDED_TEST_PREFIXES,
} = {}) {
	if (!filePath || excludedTestFiles.has(filePath)) {
		return {
			included: false,
			reason: "excluded-file",
		};
	}

	if (includedTestFiles.has(filePath)) {
		return {
			included: true,
			reason: "included-file",
		};
	}

	if (includedTestPrefixes.some((prefix) => filePath.startsWith(prefix))) {
		return {
			included: true,
			reason: "included-prefix",
		};
	}

	return {
		included: false,
		reason: "not-included",
	};
}

export function buildComponentTestReport(testEntries, options) {
	const componentEntries = testEntries
		.map((entry) => {
			const inclusion = getTestFileInclusion(entry.filePath, options);
			return {
				filePath: entry.filePath,
				included: inclusion.included,
				reason: inclusion.reason,
			};
		})
		.filter((entry, index) => {
			const source = testEntries[index]?.source ?? "";
			return entry.filePath.startsWith(COMPONENT_TEST_PREFIX) && source.includes("node:test");
		})
		.sort((a, b) => a.filePath.localeCompare(b.filePath));

	const includedFiles = componentEntries
		.filter((entry) => entry.included)
		.map((entry) => entry.filePath);
	const excludedFiles = componentEntries
		.filter((entry) => !entry.included)
		.map((entry) => ({
			filePath: entry.filePath,
			reason: entry.reason,
		}));

	return {
		version: 1,
		componentRoot: COMPONENT_TEST_PREFIX,
		includedCount: includedFiles.length,
		excludedCount: excludedFiles.length,
		includedFiles,
		excludedFiles,
	};
}

export function selectRunnableTestFiles(testEntries, options) {
	return testEntries
		.filter((entry) => {
			const inclusion = getTestFileInclusion(entry.filePath, options);
			return inclusion.included && entry.source.includes("node:test");
		})
		.map((entry) => entry.filePath);
}

function listCandidateTestFiles() {
	const gitResult = spawnSync("git", [
		"ls-files",
		"--cached",
		"--others",
		"--exclude-standard",
		"*.test.js",
		"*.test.ts",
	], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "inherit"],
	});

	if (gitResult.status !== 0) {
		process.exit(gitResult.status ?? 1);
	}

	return gitResult.stdout
		.split("\n")
		.map((filePath) => filePath.trim())
		.filter(Boolean);
}

function readTestEntries(filePaths) {
	return filePaths.map((filePath) => ({
		filePath,
		source: readFileSync(filePath, "utf8"),
	}));
}

function reportComponentTestCoverage(report) {
	console.log(
		`js-unit-tests: component node:test coverage ${report.includedCount} included, ${report.excludedCount} excluded. Graduate stable component tests through INCLUDED_TEST_FILES.`
	);
	console.log(`${COMPONENT_TEST_REPORT_PREFIX} ${JSON.stringify(report)}`);
}

function runTestFiles(testFiles) {
	for (const testFile of testFiles) {
		const source = readFileSync(testFile, "utf8");
		const nodeArgs = source.includes("vm.SyntheticModule") || source.includes("vm.SourceTextModule")
			? ["--experimental-vm-modules"]
			: [];
		const result = spawnSync(process.execPath, [...nodeArgs, "--test", testFile], {
			stdio: "inherit",
		});

		if (result.status !== 0) {
			process.exit(result.status ?? 1);
		}

		if (result.signal) {
			process.kill(process.pid, result.signal);
		}
	}
}

function main() {
	const testEntries = readTestEntries(listCandidateTestFiles());
	const report = buildComponentTestReport(testEntries);
	reportComponentTestCoverage(report);

	const testFiles = selectRunnableTestFiles(testEntries);
	if (testFiles.length === 0) {
		process.exit(0);
	}

	runTestFiles(testFiles);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
