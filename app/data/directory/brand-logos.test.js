const assert = require("node:assert/strict");
const { readdirSync, existsSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

let brandLogosModulePromise;

function loadBrandLogosModule() {
	brandLogosModulePromise ??= loadDirectoryModule(`
		export {
			THIRD_PARTY_BORDERLESS_LOGO_IDS,
			resolveBrandLogoPresentation,
		} from "@/app/data/directory/brand-logos";
	`);
	return brandLogosModulePromise;
}

// app/data/directory -> repo root -> public/3p
const THIRD_PARTY_DIR = path.join(__dirname, "..", "..", "..", "public", "3p");

/**
 * The borderless ID set is a hand-maintained mirror of which `/public/3p/<id>/`
 * folders ship a `16-borderless.svg`. If a new 3P asset is added (or a borderless
 * variant added/removed) without updating the set, the border treatment silently
 * breaks — so assert the set equals the on-disk reality.
 */
test("THIRD_PARTY_BORDERLESS_LOGO_IDS matches the folders shipping 16-borderless.svg", async () => {
	const { THIRD_PARTY_BORDERLESS_LOGO_IDS } = await loadBrandLogosModule();
	const onDisk = readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.filter((entry) => existsSync(path.join(THIRD_PARTY_DIR, entry.name, "16-borderless.svg")))
		.map((entry) => entry.name)
		.sort();

	const inSet = [...THIRD_PARTY_BORDERLESS_LOGO_IDS].sort();

	assert.deepEqual(
		inSet,
		onDisk,
		"THIRD_PARTY_BORDERLESS_LOGO_IDS is out of sync with /public/3p. " +
			"Update the set in app/data/directory/brand-logos.ts to match the folders " +
			"containing a 16-borderless.svg.",
	);
});

test("2P partner logos always get a bordered tile, src unchanged", async () => {
	const { resolveBrandLogoPresentation } = await loadBrandLogosModule();

	assert.deepEqual(resolveBrandLogoPresentation("/2p/appfire.png"), {
		src: "/2p/appfire.png",
		hasBorder: true,
	});
});

test("white-tile 3P logos swap to the borderless variant and get a border", async () => {
	const { resolveBrandLogoPresentation } = await loadBrandLogosModule();

	assert.deepEqual(resolveBrandLogoPresentation("/3p/airtable/20.svg"), {
		src: "/3p/airtable/16-borderless.svg",
		hasBorder: true,
	});
});

test("solid-fill 3P logos render bare (no border), src unchanged", async () => {
	const { resolveBrandLogoPresentation } = await loadBrandLogosModule();

	assert.deepEqual(resolveBrandLogoPresentation("/3p/github/24.svg"), {
		src: "/3p/github/24.svg",
		hasBorder: false,
	});
});

test("unknown logo paths fall back to no border, src unchanged", async () => {
	const { resolveBrandLogoPresentation } = await loadBrandLogosModule();

	assert.deepEqual(resolveBrandLogoPresentation("/illustration/foo.svg"), {
		src: "/illustration/foo.svg",
		hasBorder: false,
	});
});
