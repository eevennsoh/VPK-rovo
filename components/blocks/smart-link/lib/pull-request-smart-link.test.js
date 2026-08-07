const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const HELPER_PATH = path.join(__dirname, "pull-request-smart-link.ts");

let helperPromise;
function loadHelper() {
	if (!helperPromise) {
		helperPromise = esbuild
			.build({
				entryPoints: [HELPER_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				loader: { ".css": "empty" },
				jsx: "automatic",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) =>
				loadCjsModuleFromText(result.outputFiles[0].text, "pull-request-smart-link-harness.cjs"),
			);
	}
	return helperPromise;
}

test("toPullRequestSmartLink builds the pull-request SmartLink model", async () => {
	const { toPullRequestSmartLink } = await loadHelper();
	const item = toPullRequestSmartLink({
		id: "pr-1847",
		number: 1847,
		title: "Add guest checkout to the storefront",
		status: "Open",
		additions: 86,
		deletions: 21,
		repository: "eevensoh/vpk-rovo",
		author: { name: "Venn", src: "/avatar-user/venn/venn.png" },
	});

	assert.equal(item.variant, "pull-request");
	assert.equal(item.title, "#1847: Add guest checkout to the storefront");
	assert.equal(item.href, "https://github.com/eevensoh/vpk-rovo/pull/1847");
	assert.equal(item.provider.name, "GitHub");
	assert.deepEqual(item.provider.logo, { kind: "third-party", name: "github" });
	assert.deepEqual(item.icon, { kind: "third-party", name: "github" });
	assert.deepEqual(item.status, { label: "Open", variant: "information" });
	assert.deepEqual(item.codeStats, { additions: 86, deletions: 21 });
	assert.deepEqual(item.metadata, [{ label: "eevensoh/vpk-rovo" }]);
	assert.deepEqual(item.author, { name: "Venn", src: "/avatar-user/venn/venn.png" });
	assert.ok(item.actions?.some((action) => action.id === "copy-link"));
});

test("toPullRequestSmartLink prefers an explicit href and maps Merged status", async () => {
	const { toPullRequestSmartLink } = await loadHelper();
	const item = toPullRequestSmartLink({
		id: "pr-9",
		number: 9,
		title: "Ship",
		status: "Merged",
		additions: 1,
		deletions: 0,
		repository: "acme/app",
		href: "https://example.com/pr/9",
	});

	assert.equal(item.href, "https://example.com/pr/9");
	assert.deepEqual(item.status, { label: "Merged", variant: "discovery" });
});

test("toPullRequestSmartLink falls back to a hash href without repository", async () => {
	const { toPullRequestSmartLink } = await loadHelper();
	const item = toPullRequestSmartLink({
		id: "pr-3",
		number: 3,
		title: "Draft",
		status: "Open",
		additions: 0,
		deletions: 0,
	});

	assert.equal(item.href, "#pull-request-3");
	assert.equal(item.metadata, undefined);
});
