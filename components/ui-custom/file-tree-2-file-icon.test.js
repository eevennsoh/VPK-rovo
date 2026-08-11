import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createFileTreeIconResolver } from "@pierre/trees";

const source = readFileSync(new URL("./file-tree-2-file-icon.tsx", import.meta.url), "utf8");

test("FileTree2FileIcon resolves paths with the Pierre complete icon set", () => {
	const resolver = createFileTreeIconResolver("complete");

	assert.equal(resolver.resolveIcon("file-tree-icon-file", "PhotoUploader.tsx").token, "react");
	assert.equal(resolver.resolveIcon("file-tree-icon-file", "UserMenu.js").token, "javascript");
	assert.equal(resolver.resolveIcon("file-tree-icon-file", "UserProfileDialog.ts").token, "typescript");
	assert.match(source, /createFileTreeIconResolver\(icons\)/u);
	assert.match(source, /resolveIcon\("file-tree-icon-file", path\)/u);
	assert.match(source, /getBuiltInSpriteSheet/u);
	assert.match(source, /fileTree2IconColorStyles/u);
});
