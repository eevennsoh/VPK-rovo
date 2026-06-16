const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadDemoPreviewShellHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { token } from "./lib/tokens";
				import { DemoPreviewShell } from "./components/website/component-doc/components/demo-preview-shell.tsx";
				import { shouldUseFullPagePreview } from "./components/website/component-doc/components/preview-layout.ts";

				export function getShellStyles() {
					const defaultShell = DemoPreviewShell({
						children: React.createElement("div", null, "demo"),
					});
					const fullPageShell = DemoPreviewShell({
						children: React.createElement("div", null, "demo"),
						fullPage: true,
					});
					const fullWidthShell = DemoPreviewShell({
						children: React.createElement("div", null, "demo"),
						contentWidth: "full",
					});

					return {
						surface: token("elevation.surface", "#FFFFFF"),
						defaultStyle: defaultShell.props.style,
						fullPageStyle: fullPageShell.props.style,
						fullWidthPadding: fullWidthShell.props.children.props.style.padding,
						fullWidthInnerStyle: fullWidthShell.props.children.props.children.props.style,
					};
				}

				export function getFullPagePreviewDecisions() {
					return {
						implicitBlock: shouldUseFullPagePreview("blocks", {
							previewContentWidth: "full",
							examplesContentWidth: "full",
						}),
						fixedBlock: shouldUseFullPagePreview("blocks", {
							previewHeight: "fixed",
						}),
						fitProject: shouldUseFullPagePreview("projects", {
							previewHeight: "fit",
						}),
						fixedUi: shouldUseFullPagePreview("ui-custom", {
							previewHeight: "fixed",
						}),
					};
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "demo-preview-shell-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("DemoPreviewShell keeps a raised surface background in embedded and full-page previews", async () => {
	const harness = await loadDemoPreviewShellHarness();
	const { surface, defaultStyle, fullPageStyle } = harness.getShellStyles();

	assert.equal(defaultStyle.backgroundColor, surface);
	assert.equal(fullPageStyle.backgroundColor, surface);
});

test("DemoPreviewShell uses a fallback-backed 1px border for preview outlines", async () => {
	const harness = await loadDemoPreviewShellHarness();
	const { defaultStyle, fullPageStyle } = harness.getShellStyles();

	assert.match(defaultStyle.border, /var\(--ds-border, rgba\(9, 30, 66, 0\.14\)\)/u);
	assert.equal(defaultStyle.boxShadow, undefined);
	assert.equal(fullPageStyle.border, defaultStyle.border);
	assert.equal(fullPageStyle.boxShadow, undefined);
});

test("DemoPreviewShell lets full-width demos fill the embedded preview surface", async () => {
	const harness = await loadDemoPreviewShellHarness();
	const { fullWidthPadding, fullWidthInnerStyle } = harness.getShellStyles();

	assert.equal(fullWidthPadding, 0);
	assert.equal(fullWidthInnerStyle.alignItems, "stretch");
	assert.equal(fullWidthInnerStyle.justifyContent, "stretch");
});

test("DocPreview requires an explicit height mode before using the full-page shell", async () => {
	const harness = await loadDemoPreviewShellHarness();
	const decisions = harness.getFullPagePreviewDecisions();

	assert.equal(decisions.implicitBlock, false);
	assert.equal(decisions.fixedBlock, true);
	assert.equal(decisions.fitProject, true);
	assert.equal(decisions.fixedUi, false);
});
