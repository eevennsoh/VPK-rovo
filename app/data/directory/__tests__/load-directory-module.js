const path = require("node:path");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

/**
 * Shared test harness for the `app/data/directory` data layer.
 *
 * The loaders are `.ts`/`.tsx` modules that import React, Atlaskit icons, and UI
 * primitives — none of which can be `require()`d directly under `node --test`.
 * This bundles a chosen set of loaders to CJS via esbuild (with the heavy UI
 * deps mocked to inert stand-ins) and returns the real runtime exports, so tests
 * can assert against actual derived catalogs/visuals instead of brittle source
 * text.
 */

// Inert stand-ins for the UI modules the loaders pull in that either can't bundle
// under esbuild (no React renderer needed) or pull large unrelated graphs. Real
// React + real Atlaskit icons DO bundle (their `.css` side-effects are dropped via
// the `loader` config below). The data layer's logic — catalog construction, id
// resolution, visual descriptors — does not depend on these rendering.
const MOCK_MODULES = new Map([
	["@/components/blocks/agent-browser", "export const __mock = true;"],
	["@/components/blocks/agent-selector", "export const __mock = true;"],
	["@/components/ui/data/rovo-logo", 'export const ROVO_LOGO_DATA_URI = "data:image/svg+xml;rovo-logo";'],
	["@/lib/rovo-suggestions", "export const __mock = true;"],
	["@/components/ui/logo", "export const AtlassianLogo = function(){ return null; };"],
	["@/components/ui-custom/rich-text-editor", "export const __mock = true;"],
	[
		"@/components/ui-custom/rich-text-editor/mention-visual",
		"export function RichTextMentionVisualMark(){ return null; }",
	],
]);

/**
 * Bundles `entryContents` (a TS module body that may import from
 * `@/app/data/directory/*`) and returns its CJS exports. Pass plain TS — the
 * `@/` alias resolves through the repo tsconfig; heavy UI deps are auto-mocked.
 */
async function loadDirectoryModule(entryContents) {
	const result = await esbuild.build({
		stdin: {
			contents: entryContents,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "directory-test-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		// Atlaskit icons import compiled CSS side-effects; drop them — tests only
		// need the module graph's data/logic, not styles.
		loader: { ".css": "empty" },
		write: false,
		plugins: [
			{
				name: "directory-test-mocks",
				setup(build) {
					build.onResolve({ filter: /.*/ }, (args) =>
						MOCK_MODULES.has(args.path)
							? { path: args.path, namespace: "directory-test-mock" }
							: undefined,
					);
					build.onLoad(
						{ filter: /.*/, namespace: "directory-test-mock" },
						(args) => ({
							contents: MOCK_MODULES.get(args.path),
							loader: "ts",
							resolveDir: process.cwd(),
						}),
					);
				},
			},
		],
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

module.exports = { loadDirectoryModule };
