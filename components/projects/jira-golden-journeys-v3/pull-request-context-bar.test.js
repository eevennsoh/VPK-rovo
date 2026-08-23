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
				export { ContextBarPullRequest } from "./components/ui-custom/context-bar/context-bar-pull-request.tsx";
			`,
		],
		[
			"@/components/ui/tag",
			`
				import React from "react";
				export function Tag(props) {
					return React.createElement("span", { "data-slot": "tag" }, props.children);
				}
			`,
		],
		[
			"@/components/ui/icon-tile",
			`
				import React from "react";
				export function IconTile(props) {
					return React.createElement("div", { "data-slot": "icon-tile" }, props.icon);
				}
			`,
		],
		[
			"@atlaskit/icon/core/cross",
			`
				import React from "react";
				export default function CrossIcon() {
					return React.createElement("svg", { "data-icon": "cross" });
				}
			`,
		],
		[
			"@atlaskit/icon/core/show-more-horizontal",
			`
				import React from "react";
				export default function ShowMoreHorizontalIcon() {
					return React.createElement("svg", { "data-icon": "show-more-horizontal" });
				}
			`,
		],
		[
			"motion/react",
			`
				import React from "react";
				export const motion = new Proxy({}, { get: () => (props) => React.createElement("div", props, props.children) });
				export function AnimatePresence(props) { return React.createElement(React.Fragment, null, props.children); }
				export function MotionConfig(props) { return React.createElement(React.Fragment, null, props.children); }
				export function useReducedMotion() { return false; }
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
				export function DropdownMenuItem({ children, elemBefore, elemAfter, selected, onSelect, closeOnClick, ...props }) {
					return React.createElement("div", { role: "menuitem", "data-selected": selected, onClick: onSelect, ...props }, elemBefore, children, elemAfter);
				}
				export function DropdownMenuSeparator() { return React.createElement("hr"); }
				export function DropdownMenuCheckboxItem({ checked, onCheckedChange, ...props }) {
					return React.createElement("div", { ...props, role: "menuitemcheckbox", "aria-checked": checked }, props.children);
				}
			`,
		],
		[
			"@/components/ui/switch",
			`
				import React from "react";
				export function Switch({ checked, onCheckedChange, size, ...props }) {
					return React.createElement("button", {
						...props,
						role: "switch",
						"aria-checked": checked,
						"data-size": size,
						"data-slot": "switch",
						onClick: () => onCheckedChange?.(!checked),
					});
				}
			`,
		],
		[
			"@/components/ui-custom/hover-reveal-row",
			`
				import React from "react";
				export const hoverRevealRowClassName = "group/hover-reveal-row relative";
				export function HoverRevealLabel(props) {
					return React.createElement("span", { "data-hover-reveal-label": true }, props.children);
				}
				export function HoverRevealActions(props) {
					return React.createElement("div", { "data-hover-reveal-actions": true }, props.toggle, props.action);
				}
			`,
		],
		[
			"@/components/blocks/jira-work-item/experimental-v3/components/pull-request-detail/pull-request-checks-list",
			`
				import React from "react";
				export function ChecksSectionTitle({ passed = 0, total = 0 }) {
					return React.createElement(
						"span",
						null,
						"CI checks",
						total > 0
							? React.createElement("span", { className: "shrink-0 text-xs font-normal text-text-subtlest" }, passed + "/" + total)
							: null,
					);
				}
				export function PullRequestChecksList({ checks }) {
					return React.createElement(
						"ul",
						{ "data-jira-work-item-pull-request-checks": true },
						(checks ?? []).map((check) => React.createElement("li", { key: check.id }, check.name, " ", check.details)),
					);
				}
			`,
		],
		[
			"@/components/blocks/jira-work-item/experimental-v3/lib/pull-request-detail-data",
			`
				export function arePullRequestChecksInProgress() { return false; }
				export function pullRequestChecksTitleState(checks) {
					return {
						inProgress: true,
						passed: (checks ?? []).filter((check) => check.status === "passed").length,
						total: checks.length,
					};
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
			"@/lib/tokens",
			`
				export function token(name) { return name === "elevation.shadow.overlay" ? "overlay-elevation-shadow" : name; }
			`,
		],
		[
			"@/components/ui/hover-card",
			`
				import React from "react";
				export function HoverCard(props) { return React.createElement("div", { "data-hover-card": true }, props.children); }
				export function HoverCardTrigger({ render, children, delay, closeDelay, ...props }) {
					const trigger = render ?? React.createElement("span");
					return React.cloneElement(trigger, props, trigger.props.children ?? children);
				}
				export function HoverCardContent({ align, positionerClassName, side, sideOffset, ...props }) {
					return React.createElement("div", { "data-hover-card-content": true, ...props });
				}
			`,
		],
		[
			"@/components/blocks/pull-request",
			`
				import React from "react";
				export function PullRequest({ variant, number, title, status, className }) {
					return React.createElement("div", { className, "data-pull-request": number, "data-status": status, "data-variant": variant }, "#" + number + " " + title);
				}
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
						ciChecks: ciStatus === "failed"
							? [
								{ id: "lint-types", name: "Lint and typecheck", status: "failed", details: "Failed after 42s · deliveryAddress may be null" },
								{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s" },
								{ id: "browser-tests", name: "Guest checkout browser tests", status: "passed", details: "5 scenarios in 1m 32s" },
							]
							: ciStatus === "passed"
								? [
									{ id: "lint-types", name: "Lint and typecheck", status: "passed", details: "Rerun completed in 1m 18s" },
									{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s" },
									{ id: "browser-tests", name: "Guest checkout browser tests", status: "passed", details: "5 scenarios in 1m 32s" },
								]
								: [
									{ id: "lint-types", name: "Lint and typecheck", status: "running", details: "Running for 6s" },
									{ id: "unit-tests", name: "Unit tests", status: "queued", details: "Queued" },
									{ id: "browser-tests", name: "Guest checkout browser tests", status: "queued", details: "Queued" },
								],
						ciStatus,
						ciSummary: "3 CI checks",
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

test("the CI menu exposes shared check rows and always-visible automation toggles", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("running", "queued", false, true);
	assert.match(html, /aria-label="CI running\. 3 CI checks\. Configure CI automation"/u);
	assert.match(html, />CI checks</u);
	assert.match(html, />0\/3</u);
	assert.match(html, /data-jira-work-item-pull-request-checks/u);
	assert.match(html, /Lint and typecheck/u);
	assert.match(html, /Running for 6s/u);
	assert.match(html, /data-auto-fix-setting="true"/u);
	assert.match(html, /data-auto-merge-setting="true"/u);
	assert.doesNotMatch(html, /data-auto-fix-setting="true"[^>]*data-selected="true"|data-selected="true"[^>]*data-auto-fix-setting="true"/u);
	assert.doesNotMatch(html, /data-auto-merge-setting="true"[^>]*data-selected="true"|data-selected="true"[^>]*data-auto-merge-setting="true"/u);
	assert.match(html, /role="switch"[^>]*aria-checked="false"|aria-checked="false"[^>]*role="switch"/u);
	assert.match(html, /Auto-fix CI &amp; address comments/u);
	assert.match(html, /Auto-merge when ready/u);
	assert.match(html, />Auto-merge queued</u);
});

test("merged presentation remains explicit and the flexible branch owns truncation", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("passed", "merged", true, true);
	assert.match(html, /data-ci-status="passed"/u);
	assert.match(html, /data-merge-state="merged"/u);
	assert.match(html, />2\/2 approved</u);
	assert.match(html, />Merged</u);
	assert.match(SOURCE, /<ContextBarPullRequest/u);
	assert.match(SOURCE, /ci=\{\{/u);
	assert.doesNotMatch(SOURCE, /data-ci-automation-trigger/u);
	assert.doesNotMatch(SOURCE, /DropdownMenu/u);
});

test("automation callbacks are passed through to the shared CI menu", () => {
	assert.match(SOURCE, /onAutoFixChange,/u);
	assert.match(SOURCE, /onAutoMergeChange,/u);
	assert.match(SOURCE, /autoFixEnabled,/u);
	assert.match(SOURCE, /autoMergeEnabled,/u);
	assert.doesNotMatch(SOURCE, /data-auto-fix-setting/u);
	assert.doesNotMatch(SOURCE, /Auto-fix CI/u);
});

test("the PR strip exposes a labeled dismiss action", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("running", "disabled");
	assert.match(html, /aria-label="Dismiss pull request context"/u);
	assert.match(SOURCE, /dismissLabel="Dismiss pull request context"/u);
	assert.match(SOURCE, /onDismiss=\{onDismiss\}/u);
});

test("the PR number is a hoverable link that reveals the spacious pull-request card", async () => {
	const harness = await loadHarness();
	const runningHtml = harness.renderBar("running", "disabled");
	assert.match(
		runningHtml,
		/<a class="shrink-0 text-sm no-underline decoration-current outline-none hover:underline[^"]* text-text-success" data-pr-number-link="true" href="https:\/\/github.com\/eevensoh\/vpk-rovo\/pull\/1847">#1847<\/a>/u,
	);
	assert.match(runningHtml, /data-pull-request="1847" data-status="Open" data-variant="spacious"/u);
	assert.match(runningHtml, /#1847 Implement guest checkout without account creation/u);
	assert.doesNotMatch(runningHtml, /<a class="[^"]*hover:text-[^"]*" data-pr-number-link/u);

	const mergedHtml = harness.renderBar("passed", "merged");
	assert.match(mergedHtml, /font-medium text-text-selected/u);
	assert.match(mergedHtml, /data-pull-request="1847" data-status="Merged" data-variant="spacious"/u);

	assert.match(SOURCE, /ContextBarPullRequest,[\s\S]*from "@\/components\/ui-custom\/context-bar"/u);
	assert.match(SOURCE, /href=\{JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_IDENTITY\}/u);
	assert.match(SOURCE, /number=\{JIRA_GOLDEN_JOURNEYS_V3_PULL_REQUEST_NUMBER\}/u);
	assert.match(SOURCE, /title=\{STORY_PULL_REQUEST_TITLE\}/u);
	assert.doesNotMatch(SOURCE, /function PullRequestNumberLink/u);
	assert.doesNotMatch(SOURCE, /variant="spacious"/u);
	assert.doesNotMatch(SOURCE, /showStatusLozenge/u);
});

test("the adapter still renders the shared PR hover surface", async () => {
	const harness = await loadHarness();
	const html = harness.renderBar("running", "disabled");
	assert.match(
		html,
		/data-hover-card-content="true" class="w-auto overflow-hidden rounded-xl border-0 bg-surface-overlay p-0 text-text shadow-none" style="box-shadow:overlay-elevation-shadow"/u,
	);
	assert.match(html, /class="border-0" data-pull-request="1847" data-status="Open" data-variant="spacious"/u);
});
