import assert from "node:assert/strict";
import test from "node:test";

import {
	createFileTree2Model,
	getFileTree2MovePath,
	getVisibleFileTree2Nodes,
	normalizeFileTree2Path,
} from "./file-tree-2-model.ts";

test("File Tree 2 normalizes canonical paths and creates implicit folders", () => {
	const model = createFileTree2Model([
		{ path: "\\src\\components\\Button.tsx" },
		{ path: "/README.md" },
	]);

	assert.equal(normalizeFileTree2Path(" /src//components/ "), "src/components");
	assert.equal(model.nodes.get("src")?.type, "folder");
	assert.equal(model.nodes.get("src/components")?.type, "folder");
	assert.deepEqual(model.roots, ["src", "README.md"]);
});

test("File Tree 2 follows expansion state and keeps folders before files", () => {
	const model = createFileTree2Model([
		{ path: "src/index.ts" },
		{ path: "src/components", type: "folder" },
		{ path: "package.json" },
	]);

	assert.deepEqual(
		getVisibleFileTree2Nodes(model, new Set()).map((node) => node.path),
		["src", "package.json"],
	);
	assert.deepEqual(
		getVisibleFileTree2Nodes(model, new Set(["src"])).map((node) => node.path),
		["src", "src/components", "src/index.ts", "package.json"],
	);
});

test("File Tree 2 defaults to hiding non-matches while revealing matching ancestors", () => {
	const model = createFileTree2Model([
		{ path: "src/components/Button.tsx" },
		{ path: "src/lib/api.ts" },
		{ path: "README.md" },
	]);

	assert.deepEqual(
		getVisibleFileTree2Nodes(model, new Set(), "button").map((node) => node.path),
		["src", "src/components", "src/components/Button.tsx"],
	);
});

test("File Tree 2 supports opt-in collapse and expand search modes", () => {
	const model = createFileTree2Model([
		{ path: "src/components/Button.tsx" },
		{ path: "src/components/Card.tsx" },
		{ path: "src/lib/api.ts" },
		{ path: "README.md" },
	]);

	assert.deepEqual(
		getVisibleFileTree2Nodes(model, new Set(["src/lib"]), "button", false, "collapse-non-matches")
			.map((node) => node.path),
		["src", "src/components", "src/components/Button.tsx", "src/components/Card.tsx", "src/lib", "README.md"],
	);
	assert.deepEqual(
		getVisibleFileTree2Nodes(model, new Set(["src/lib"]), "button", false, "expand-matches")
			.map((node) => node.path),
		[
			"src",
			"src/components",
			"src/components/Button.tsx",
			"src/components/Card.tsx",
			"src/lib",
			"src/lib/api.ts",
			"README.md",
		],
	);
});

test("File Tree 2 flattens single-child folder chains with canonical terminal paths", () => {
	const model = createFileTree2Model([
		{ path: "build/assets/images/social/logo.png" },
		{ path: "build/index.mjs" },
		{ path: "config/project/settings.json" },
	]);
	const visible = getVisibleFileTree2Nodes(
		model,
		new Set(["build", "build/assets/images/social"]),
		"",
		true,
	);

	assert.deepEqual(
		visible.map(({ depth, name, parentPath, path }) => ({ depth, name, parentPath, path })),
		[
			{ depth: 0, name: "build", parentPath: null, path: "build" },
			{ depth: 1, name: "assets / images / social", parentPath: "build", path: "build/assets/images/social" },
			{ depth: 2, name: "logo.png", parentPath: "build/assets/images/social", path: "build/assets/images/social/logo.png" },
			{ depth: 1, name: "index.mjs", parentPath: "build", path: "build/index.mjs" },
			{ depth: 0, name: "config / project", parentPath: null, path: "config/project" },
		],
	);
	assert.deepEqual(visible[1]?.flattenedPaths, [
		"build/assets",
		"build/assets/images",
		"build/assets/images/social",
	]);
});

test("File Tree 2 validates folder and root move destinations", () => {
	const model = createFileTree2Model([
		{ path: "src/components/Button.tsx" },
		{ path: "src/index.ts" },
		{ path: "public/index.html" },
		{ path: "README.md" },
	]);

	assert.equal(getFileTree2MovePath(model, "README.md", "public"), "public/README.md");
	assert.equal(getFileTree2MovePath(model, "src/components", null), "components");
	assert.equal(getFileTree2MovePath(model, "src", "src/components"), null);
	assert.equal(getFileTree2MovePath(model, "src/index.ts", "src"), null);
	assert.equal(getFileTree2MovePath(model, "missing.ts", "public"), null);
});
