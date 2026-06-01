const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadContextBarHarness() {
	const mockModules = new Map([
		[
			"@/components/ui/tag",
			`
				import React from "react";
				export function Tag(props) {
					return React.createElement(
						"span",
						{ "data-slot": "tag", "data-color": props.color },
						props.elemBefore,
						React.createElement("span", { "data-tag-text": true }, props.children),
					);
				}
			`,
		],
		[
			"@atlaskit/icon/core/cross",
			`
				import React from "react";
				export default function CrossIcon(props) {
					return React.createElement("svg", { "data-icon": "cross", "data-size": props.size });
				}
			`,
		],
		[
			"@atlaskit/icon/core/show-more-horizontal",
			`
				import React from "react";
				export default function ShowMoreHorizontalIcon(props) {
					return React.createElement("svg", { "data-icon": "show-more-horizontal", "data-size": props.size });
				}
			`,
		],
		[
			"motion/react",
			`
				import React from "react";
				const MOTION_PROPS = new Set([
					"layout", "initial", "animate", "exit", "transition",
					"whileHover", "whileTap", "whileFocus", "variants", "drag",
				]);
				const handler = {
					get(_target, tag) {
						return function MotionComponent(props) {
							const clean = {};
							for (const key in props) {
								if (key !== "children" && !MOTION_PROPS.has(key)) {
									clean[key] = props[key];
								}
							}
							return React.createElement(typeof tag === "string" ? tag : "div", clean, props.children);
						};
					},
				};
				export const motion = new Proxy({}, handler);
				export function AnimatePresence(props) {
					return React.createElement(React.Fragment, null, props.children);
				}
				export function MotionConfig(props) {
					return React.createElement(React.Fragment, null, props.children);
				}
				export function useReducedMotion() {
					return false;
				}
			`,
		],
		[
			"@/components/ui/dropdown-menu",
			`
				import React from "react";
				export function DropdownMenu(props) {
					return React.createElement(React.Fragment, null, props.children);
				}
				export function DropdownMenuTrigger(props) {
					return React.createElement("button", { ...props }, props.children);
				}
				export function DropdownMenuContent(props) {
					return React.createElement("div", { ...props }, props.children);
				}
				export function DropdownMenuItem(props) {
					return React.createElement("div", { ...props }, props.children);
				}
			`,
		],
	]);

	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import {
					CollapsibleContextBar,
					ContextBar,
					ContextBarLead,
					ContextBarTag,
					ContextBarTrigger,
				} from "./components/ui-custom/context-bar/context-bar.tsx";

				export function renderBar(dismissible) {
					return renderToStaticMarkup(
						React.createElement(
							ContextBar,
							{ onDismiss: dismissible ? () => {} : undefined, dismissLabel: "Close it" },
							React.createElement(ContextBarLead, { icon: React.createElement("svg", { "data-icon": "lead" }) }, "Edit:"),
							React.createElement(ContextBarTag, { title: "Agent name" }, "Agent name"),
						),
					);
				}

				export function renderTrigger() {
					return renderToStaticMarkup(
						React.createElement(ContextBarTrigger, { onClick: () => {} }, "Edit agent"),
					);
				}

				export function renderCollapsible(defaultOpen) {
					return renderToStaticMarkup(
						React.createElement(
							CollapsibleContextBar,
							{
								defaultOpen,
								leadLabel: "Edit:",
								collapsedLabel: "Edit agent",
								dismissLabel: "Close it",
							},
							React.createElement(ContextBarTag, { title: "Agent name" }, "Agent name"),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "context-bar-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
		plugins: [
			{
				name: "context-bar-test-mocks",
				setup(build) {
					build.onResolve({ filter: /.*/ }, (args) => {
						if (!mockModules.has(args.path)) {
							return undefined;
						}
						return { path: args.path, namespace: "context-bar-test-mock" };
					});
					build.onLoad({ filter: /.*/, namespace: "context-bar-test-mock" }, (args) => ({
						contents: mockModules.get(args.path),
						loader: "tsx",
						resolveDir: process.cwd(),
					}));
				},
			},
		],
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("ContextBar renders an interactive dismiss when onDismiss is provided", async () => {
	const harness = await loadContextBarHarness();
	const markup = harness.renderBar(true);

	assert.match(markup, /data-context-bar/);
	assert.match(markup, /Edit:/);
	assert.match(markup, /aria-label="Close it"/);
	assert.match(markup, /<button/);
	assert.match(markup, /data-icon="cross"/);
});

test("ContextBar renders a non-interactive placeholder without onDismiss", async () => {
	const harness = await loadContextBarHarness();
	const markup = harness.renderBar(false);

	assert.match(markup, /data-icon="cross"/);
	assert.doesNotMatch(markup, /<button/);
});

test("ContextBarTrigger renders a labelled pill button", async () => {
	const harness = await loadContextBarHarness();
	const markup = harness.renderTrigger();

	assert.match(markup, /data-context-bar-trigger/);
	assert.match(markup, /<button/);
	assert.match(markup, /Edit agent/);
});

test("CollapsibleContextBar starts expanded and can collapse to a trigger", async () => {
	const harness = await loadContextBarHarness();

	const open = harness.renderCollapsible(true);
	assert.match(open, /data-context-bar/);
	assert.match(open, /Edit:/);
	assert.match(open, /aria-label="Close it"/);
	assert.doesNotMatch(open, /data-context-bar-trigger/);

	const collapsed = harness.renderCollapsible(false);
	assert.match(collapsed, /data-context-bar-trigger/);
	assert.match(collapsed, /Edit agent/);
	assert.doesNotMatch(collapsed, /aria-label="Close it"/);
});

async function loadOverflowModule() {
	const result = await esbuild.build({
		entryPoints: [path.join(process.cwd(), "components/ui-custom/context-bar/overflow.ts")],
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("computeContextBarOverflow shows everything when it all fits", async () => {
	const { computeContextBarOverflow } = await loadOverflowModule();

	// 3 items of 50px + 2 gaps of 8px = 166px, fits in 400px.
	assert.equal(computeContextBarOverflow([50, 50, 50], 400, 32, 8), 3);
});

test("computeContextBarOverflow reserves room for the overflow button", async () => {
	const { computeContextBarOverflow } = await loadOverflowModule();

	// Items: 100,100,100,100 with gap 8 → full row 424px > 250px container, so an
	// overflow button (32px) is required. Item 1: 100 + gap(8) + overflow(32) = 140 ≤ 250.
	// Item 2: used 208 + gap(8) + overflow(32) = 248 ≤ 250. Item 3 would be 356 > 250.
	assert.equal(computeContextBarOverflow([100, 100, 100, 100], 250, 32, 8), 2);
});

test("computeContextBarOverflow returns all items before measurement", async () => {
	const { computeContextBarOverflow } = await loadOverflowModule();

	assert.equal(computeContextBarOverflow([100, 100, 100], 0, 32, 8), 3);
	assert.equal(computeContextBarOverflow([], 400, 32, 8), 0);
});
