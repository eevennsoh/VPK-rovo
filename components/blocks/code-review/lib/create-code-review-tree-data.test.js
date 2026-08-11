const assert = require("node:assert/strict");
const { join } = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const MODULE_PATH = join(__dirname, "create-code-review-tree-data.ts");

let treeDataPromise;
function loadTreeData() {
	if (!treeDataPromise) {
		treeDataPromise = esbuild
			.build({
				entryPoints: [MODULE_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"create-code-review-tree-data-harness.cjs",
			));
	}
	return treeDataPromise;
}

function createChangedFile(overrides = {}) {
	return {
		id: "photo-uploader",
		path: "src/components/PhotoUploader.tsx",
		status: "deleted",
		language: "tsx",
		oldContents: "old",
		newContents: "new",
		additions: 2,
		deletions: 1,
		defaultExpanded: false,
		...overrides,
	};
}

test("changed-files mode keeps only review files and their ancestor folders", async () => {
	const { createCodeReviewTreeData } = await loadTreeData();
	const { items, fileIdsByPath, pathsByFileId } = createCodeReviewTreeData(
		[
			createChangedFile(),
			createChangedFile({
				id: "user-menu",
				path: "src/components/UserMenu.js",
				status: "added",
			}),
		],
		"rfp-response-platform",
	);

	const paths = items.map((item) => item.path).sort();
	assert.deepEqual(paths, [
		"rfp-response-platform",
		"rfp-response-platform/src",
		"rfp-response-platform/src/components",
		"rfp-response-platform/src/components/PhotoUploader.tsx",
		"rfp-response-platform/src/components/UserMenu.js",
	]);
	assert.equal(
		items.find((item) => item.path.endsWith("PhotoUploader.tsx"))?.status,
		"deleted",
	);
	assert.equal(fileIdsByPath.get("rfp-response-platform/src/components/PhotoUploader.tsx"), "photo-uploader");
	assert.equal(pathsByFileId.get("user-menu"), "rfp-response-platform/src/components/UserMenu.js");
	assert.equal(
		items.some((item) => item.path.includes("node_modules") || item.path.includes("CHANGED FILES")),
		false,
	);
});

test("demo tree mode still mounts the fixture plus a CHANGED FILES group", async () => {
	const { createCodeReviewTreeData } = await loadTreeData();
	const { items } = createCodeReviewTreeData(
		[createChangedFile()],
		"rfp-response-platform",
		true,
	);

	assert.equal(items.some((item) => item.path === "rfp-response-platform/node_modules"), true);
	assert.equal(items.some((item) => item.path === "rfp-response-platform/CHANGED FILES"), true);
	assert.equal(
		items.some((item) => item.path === "rfp-response-platform/CHANGED FILES/PhotoUploader.tsx"),
		true,
	);
	assert.equal(
		items.find((item) => item.path === "rfp-response-platform/.gitignore")?.status,
		"deleted",
	);
});
