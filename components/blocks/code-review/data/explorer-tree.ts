import type { ExplorerNode } from "./types";

const folder = (name: string): ExplorerNode => ({
	id: `folder-${name}`,
	name,
	kind: "folder",
	children: [],
});

const file = (name: string): ExplorerNode => ({
	id: `file-${name}`,
	name,
	kind: "file",
});

export const EXPLORER_TREE: readonly ExplorerNode[] = [
	...[
		"build",
		"extensions",
		"node_modules",
		"out",
		"remote",
		"resources",
		"scripts",
		"src",
		"test",
	].map(folder),
	...[
		".editorconfig",
		".eslintignore",
		".git-blame-ignore",
		".gitattributes",
		".gitignore",
		".mailmap",
		".mention-bot",
		".yarnrc",
		"yarn.lock",
		"gulpfile.js",
		".eslintrc.json",
		".lsifrc.json",
		"cglicenses.json",
		"cgmanifest.json",
		"package.json",
		"product.json",
		"tsfmt.json",
		"CONTRIBUTING.md",
	].map(file),
	{
		id: "file-ipc-mp-test",
		name: "ipc.mp.test.ts",
		kind: "file",
		fileId: "ipc-mp-test",
	},
];
