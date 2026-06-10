const assert = require("node:assert/strict");
const { readdirSync, existsSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(
	__dirname,
	"..",
	"..",
	"..",
	"app",
	"data",
	"directory",
	"__tests__",
	"load-directory-module.js",
));

let logoUsageModulePromise;

function loadLogoUsageModule() {
	logoUsageModulePromise ??= loadDirectoryModule(`
		export {
			THIRD_PARTY_BORDERLESS_LOGO_IDS,
			resolveBrandLogoPresentation,
			resolveAtlassianLogoBorder,
		} from "@/components/ui/data/logo-usage";
	`);
	return logoUsageModulePromise;
}

// components/ui/data -> repo root -> public/3p
const THIRD_PARTY_DIR = path.join(__dirname, "..", "..", "..", "public", "3p");

/**
 * The borderless ID list in logo-usage.json is a hand-maintained mirror of which
 * `/public/3p/<id>/` folders ship a `16-borderless.svg`. If a new 3P asset is
 * added (or a borderless variant added/removed) without updating the JSON, the
 * border treatment silently breaks — so assert the list equals on-disk reality.
 */
test("THIRD_PARTY_BORDERLESS_LOGO_IDS matches the folders shipping 16-borderless.svg", async () => {
	const { THIRD_PARTY_BORDERLESS_LOGO_IDS } = await loadLogoUsageModule();
	const onDisk = readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.filter((entry) => existsSync(path.join(THIRD_PARTY_DIR, entry.name, "16-borderless.svg")))
		.map((entry) => entry.name)
		.sort();

	const inSet = [...THIRD_PARTY_BORDERLESS_LOGO_IDS].sort();

	assert.deepEqual(
		inSet,
		onDisk,
		"borderlessIds in components/ui/data/logo-usage.json is out of sync with " +
			"/public/3p. Update the JSON to match the folders containing a 16-borderless.svg.",
	);
});

test("2P partner logos always get a bordered tile, src unchanged", async () => {
	const { resolveBrandLogoPresentation } = await loadLogoUsageModule();

	assert.deepEqual(resolveBrandLogoPresentation("/2p/appfire.png"), {
		src: "/2p/appfire.png",
		hasBorder: true,
	});
});

test("white-tile 3P logos swap to the borderless variant and get a border", async () => {
	const { resolveBrandLogoPresentation } = await loadLogoUsageModule();

	assert.deepEqual(resolveBrandLogoPresentation("/3p/airtable/20.svg"), {
		src: "/3p/airtable/16-borderless.svg",
		hasBorder: true,
	});
});

test("solid-fill 3P logos render bare (no border), src unchanged", async () => {
	const { resolveBrandLogoPresentation } = await loadLogoUsageModule();

	assert.deepEqual(resolveBrandLogoPresentation("/3p/github/24.svg"), {
		src: "/3p/github/24.svg",
		hasBorder: false,
	});
});

test("unknown logo paths fall back to no border, src unchanged", async () => {
	const { resolveBrandLogoPresentation } = await loadLogoUsageModule();

	assert.deepEqual(resolveBrandLogoPresentation("/illustration/foo.svg"), {
		src: "/illustration/foo.svg",
		hasBorder: false,
	});
});

test("the Atlassian master logo (no solid background) gets a bordered tile", async () => {
	const { resolveAtlassianLogoBorder } = await loadLogoUsageModule();

	assert.equal(resolveAtlassianLogoBorder("atlassian"), true);
});

test("solid-background 1P product logos render bare (no border)", async () => {
	const { resolveAtlassianLogoBorder } = await loadLogoUsageModule();

	for (const name of ["jira", "confluence", "loom", "trello", "compass"]) {
		assert.equal(
			resolveAtlassianLogoBorder(name),
			false,
			`expected ${name} to render without a border`,
		);
	}
});
