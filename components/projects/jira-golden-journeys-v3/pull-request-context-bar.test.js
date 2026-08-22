const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const SOURCE_PATH = path.join(
	process.cwd(),
	"components/projects/jira-golden-journeys-v3/pull-request-context-bar.tsx",
);
const SOURCE = fs.readFileSync(SOURCE_PATH, "utf8");

async function loadHarness() {
	const mockModules = new Map([
		[
			"@/components/ui-custom/context-bar",
			`
				import React from "react";
				export function ContextBar({ dismissLabel, onDismiss, showDismissPlaceholder, ...props }) {
					return React.createElement("div", props, props.children, onDismiss
						? React.createElement("button", { "aria-label": dismissLabel, onClick: onDismiss, type: "button" }, "Dismiss")
						: null);
				}
			`,
		],
		[
			"@/components/ui/dropdown-menu",
			`
				import React from "react";
				export function DropdownMenu(props) { return React.createElement("div", { "data-menu": true }, props.children); }
				export function DropdownMenuTrigger(props) { return React.createElement("button", props, props.children); }
				export function DropdownMenuContent({ positionerClassName, ...props }) { return React.createElement("div", props, props.children); }
				export function DropdownMenuGroup(props) { return React.createElement("div", props, props.children); }
				export function DropdownMenuLabel(props) { return React.createElement("div", props, props.children); }
				export function DropdownMenuSeparator() { return React.createElement("hr"); }
				export function DropdownMenuCheckboxItem({ checked, onCheckedChange, ...props }) {
					return React.createElement("div", { ...props, role: "menuitemcheckbox", "aria-checked": checked }, props.children);
				}
			`,
		],
		[
			"@/components/ui/icon",
			`
				import React from "react";
				export function Icon({ render }) { return React.createElement("span", { "data-slot": "icon" }, render); }
			`,
		],
		[
			"@/components/ui/lozenge",
			`
				import React from "react";
				export function Lozenge({ children, elemBefore, variant, ...props }) {
					return React.createElement("span", { ...props, "data-slot": "lozenge", "data-variant": variant }, elemBefore, children);
				}
			`,
		],
		[
			"@/components/ui/spinner",
			`
				import React from "react";
				export function Spinner({ label, size, ...props }) {
					return React.createElement("svg", { ...props, "aria-label": label, "data-size": size, "data-slot": "spinner" });
				}
			`,
		],
		[
			"@/lib/utils",
			`
				export function cn(...values) { return values.filter(Boolean).join(" "); }
			`,
		],
		[
			"@atlaskit/icon/core/chevron-down",
			`
				import React from "react";
				export default function Icon() { return React.createElement("svg", { "data-icon": "chevron-down" }); }
			`,
		],
		[
			"@atlaskit/icon/core/pull-request",
			`
				import React from "react";
				export default function Icon() { return React.createElement("svg", { "data-icon": "pull-request" }); }
			`,
		],
	]);
	const result = await esbuild.build({
		bundle: true,
		format: "cjs",
		platform: "node",
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import { PullRequestContextBar } from "./components/projects/jira-golden-journeys-v3/pull-request-context-bar.tsx";
				export function renderBar(ciStatus, mergeState, autoFixEnabled = false, autoMergeEnabled = false) {
					return renderToStaticMarkup(React.createElement(PullRequestContextBar, {
						additions: 86,
						approvalsCurrent: mergeState === "merged" ? 2 : 1,
						approvalsRequired: 2,
						autoFixEnabled,
						autoMergeEnabled,
						branch: "feature/shop-4821-guest-checkout-with-a-very-long-name",
						ciCounts: { failed: ciStatus === "failed" ? 1 : 0, inProgress: ciStatus === "running" ? 2 : 0, passed: ciStatus === "passed" ? 12 : 2, skipped: 1 },
						ciStatus,
						ciSummary: "15 CI checks",
						deletions: 21,
						mergeState,
						onAutoFixChange: () => {},
						onAutoMergeChange: () => {},
						onDismiss: () => {},
						repository: "storefront-web",
					}));
				}
			`,
			resolveDir: process.cwd(),
			sourcefile: "pull-request-context-bar-harness.tsx",
		},
		plugins: [{
			name: "mock-dependencies",
			setup(build) {
					for (const moduleName of mockModules.keys()) {
					build.onResolve({ filter: new RegExp(`^${moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }, () => ({ path: moduleName, namespace: "mock" }));
					build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
						contents: mockModules.get(args.path),
						loader: "tsx",
						resolveDir: process.cwd(),
					}));
				}
			},
		}],
		write: false,
	});
	return loadCjsModuleFromText(result.outputFiles[0].text, "pull-request-context-bar-harness.cjs");
}

test("the PR strip exposes stable status, approval, and automation hooks", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("failed", "blocked", true, false);
	assert.match(html, /data-pr-context-bar="true"/u);
	assert.match(html, /data-pr-number="1847"/u);
	assert.match(html, /data-ci-status="failed"/u);
	assert.match(html, /data-approvals-current="1"/u);
	assert.match(html, /data-approvals-required="2"/u);
	assert.match(html, /data-auto-fix-enabled="true"/u);
	assert.match(html, /data-auto-merge-enabled="false"/u);
	assert.match(html, /data-merge-state="blocked"/u);
	assert.match(html, />Auto-merge blocked</u);
});

test("disabled auto-merge stays distinct from a blocked enabled rule", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("running", "disabled", false, false);
	assert.match(html, /data-merge-state="disabled"/u);
	assert.match(html, /data-slot="lozenge" data-variant="success"[^>]*>.*Open<\/span>/u);
	assert.match(html, /aria-label="CI running" data-size="xs" data-slot="spinner"/u);
	assert.doesNotMatch(html, />storefront-web</u);
	assert.doesNotMatch(html, /data-approvals-summary/u);
	assert.doesNotMatch(html, /data-merge-state-label/u);
});

test("the CI menu exposes monitoring counts and controlled checkbox items", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("running", "queued", false, true);
	assert.match(html, /aria-label="CI running\. 15 CI checks\. Configure CI automation"/u);
	assert.match(html, />CI monitoring</u);
	assert.match(html, /data-ci-count="in-progress"/u);
	assert.match(html, /data-auto-fix-setting="true" role="menuitemcheckbox" aria-checked="false"/u);
	assert.match(html, /data-auto-merge-setting="true" role="menuitemcheckbox" aria-checked="true"/u);
	assert.match(html, />Auto-fix CI &amp; address comments</u);
	assert.match(html, />Auto-merge when ready</u);
	assert.match(html, />Auto-merge queued</u);
});

test("merged presentation remains explicit and the flexible branch owns truncation", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("passed", "merged", true, true);
	assert.match(html, /data-ci-status="passed"/u);
	assert.match(html, /data-merge-state="merged"/u);
	assert.match(html, />2\/2 approved</u);
	assert.match(html, />Merged</u);
	assert.match(SOURCE, /className="min-w-0 flex-1 truncate text-sm text-text-subtle" title=\{branch\}/u);
	assert.match(SOURCE, /max-w-\[calc\(100vw-7rem\)\][\s\S]*overflow-hidden px-2\.5 py-0 sm:max-w-full/u);
	assert.match(SOURCE, /focus-visible:ring-3[\s\S]*motion-reduce:transition-none/u);
});

test("automation callbacks are wired directly to the controlled menu items", () => {
	assert.match(SOURCE, /checked=\{autoFixEnabled\}[\s\S]*data-auto-fix-setting[\s\S]*onCheckedChange=\{onAutoFixChange\}/u);
	assert.match(SOURCE, /checked=\{autoMergeEnabled\}[\s\S]*data-auto-merge-setting[\s\S]*onCheckedChange=\{onAutoMergeChange\}/u);
});

test("the PR strip exposes a labeled dismiss action", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("running", "disabled");
	assert.match(html, /<button aria-label="Dismiss pull request context" type="button">Dismiss<\/button>/u);
	assert.match(SOURCE, /dismissLabel="Dismiss pull request context"/u);
	assert.match(SOURCE, /onDismiss=\{onDismiss\}/u);
});
