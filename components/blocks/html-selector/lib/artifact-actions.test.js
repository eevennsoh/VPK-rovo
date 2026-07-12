const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

const { loadCjsModuleFromText } = require(
	path.join(process.cwd(), "scripts", "lib", "esbuild-cjs-loader.js"),
);

let modulePromise;
function loadArtifactActions() {
	modulePromise ??= esbuild
		.build({
			entryPoints: [path.join(process.cwd(), "components/blocks/html-selector/lib/artifact-actions.ts")],
			bundle: true,
			format: "cjs",
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			write: false,
		})
		.then((result) => loadCjsModuleFromText(result.outputFiles[0].text));
	return modulePromise;
}

test("artifact action helpers encode api paths and notes queries", async () => {
	const {
		getVpkHtmlArtifactApiPath,
		getVpkHtmlNotesApiPath,
	} = await loadArtifactActions();

	assert.equal(
		getVpkHtmlArtifactApiPath("assets/demos/Annual Report.html"),
		"/api/vpk-html/assets/demos/Annual%20Report.html",
	);
	assert.equal(
		getVpkHtmlNotesApiPath("assets/demos/Annual Report.html"),
		"/api/vpk-html/notes?page=assets%2Fdemos%2FAnnual%20Report.html",
	);
});

test("artifact action helpers build download names and artifact disk paths", async () => {
	const {
		getHtmlDownloadFileName,
		getVpkHtmlArtifactDiskPath,
	} = await loadArtifactActions();

	assert.equal(getHtmlDownloadFileName("assets/demos/Annual Report.html"), "Annual-Report.html");
	assert.equal(
		getVpkHtmlArtifactDiskPath("assets/demos/demo.html", "/repo"),
		"/repo/.agents/skills/vpk-html/assets/demos/demo.html",
	);
	assert.equal(
		getVpkHtmlArtifactDiskPath("index.html"),
		".agents/skills/vpk-html/index.html",
	);
});
