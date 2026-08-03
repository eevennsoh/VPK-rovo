const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(
	__dirname,
	"..",
	"..",
	"app",
	"data",
	"directory",
	"__tests__",
	"load-directory-module.js",
));

let modulePromise;
const LOGO_THIRD_PARTY_SOURCE = require("node:fs").readFileSync(path.join(__dirname, "logo-third-party.tsx"), "utf8");
const LOGO_THIRD_PARTY_DEMO_SOURCE = require("node:fs").readFileSync(
	path.join(process.cwd(), "components", "website", "demos", "ui", "logo-third-party-demo.tsx"),
	"utf8",
);

function loadLogoThirdPartyData() {
	modulePromise ??= loadDirectoryModule(`
		export {
			THIRD_PARTY_LOGO_MANIFEST,
			THIRD_PARTY_LOGO_NAMES,
			THIRD_PARTY_LOGO_LABELS,
			THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES,
			THIRD_PARTY_LOGO_LOCAL_FALLBACKS,
			thirdPartyLogoSrc,
		} from "@/components/ui/data/logo-third-party-data";
	`);
	return modulePromise;
}

// components/ui -> repo root -> public/3p
const THIRD_PARTY_DIR = path.join(__dirname, "..", "..", "public", "3p");

test("THIRD_PARTY_LOGO_NAMES derives from the manifest", async () => {
	const { THIRD_PARTY_LOGO_MANIFEST, THIRD_PARTY_LOGO_NAMES } = await loadLogoThirdPartyData();

	assert.deepEqual(
		THIRD_PARTY_LOGO_NAMES,
		THIRD_PARTY_LOGO_MANIFEST.map((entry) => entry.name),
		"THIRD_PARTY_LOGO_NAMES must be derived from THIRD_PARTY_LOGO_MANIFEST",
	);
});

/**
 * Brand marks are now sourced primarily from `@atlassian/logo-third-party`, so
 * `THIRD_PARTY_LOGO_NAMES` is a superset of the on-disk `public/3p` folders. The
 * `THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES` subset is the contract with `public/3p`
 * (it types `thirdPartyLogoSrc`), so it MUST equal the folders exactly — a drift
 * would mean either a `thirdPartyLogoSrc` id with no asset (404) or a shipped
 * asset no helper can reach.
 */
test("THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES matches the public/3p folders", async () => {
	const { THIRD_PARTY_LOGO_MANIFEST, THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES } = await loadLogoThirdPartyData();

	const onDisk = readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

	const inList = [...THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES].sort();
	const inManifest = THIRD_PARTY_LOGO_MANIFEST
		.filter((entry) => entry.localAsset === true)
		.map((entry) => entry.name)
		.sort();

	assert.deepEqual(
		inList,
		inManifest,
		"THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES must be derived from manifest localAsset entries",
	);

	assert.deepEqual(
		inList,
		onDisk,
		"THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES in components/ui/data/logo-third-party-data.ts " +
			"is out of sync with /public/3p. Update the list to match the folders.",
	);
});

test("local fallback brands derive from manifest local-only assets with public folders", async () => {
	const {
		THIRD_PARTY_LOGO_MANIFEST,
		THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES,
		THIRD_PARTY_LOGO_LOCAL_FALLBACKS,
		THIRD_PARTY_LOGO_NAMES,
	} = await loadLogoThirdPartyData();

	const onDisk = new Set(
		readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name),
	);
	const registered = new Set(THIRD_PARTY_LOGO_NAMES);
	const localAssets = new Set(THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES);
	const manifestFallbacks = THIRD_PARTY_LOGO_MANIFEST
		.filter((entry) => entry.localAsset === true && !entry.packageIcon)
		.map((entry) => entry.name)
		.sort();

	assert.deepEqual(
		[...THIRD_PARTY_LOGO_LOCAL_FALLBACKS].sort(),
		manifestFallbacks,
		"THIRD_PARTY_LOGO_LOCAL_FALLBACKS must be derived from manifest local-only entries",
	);

	for (const name of THIRD_PARTY_LOGO_LOCAL_FALLBACKS) {
		assert.ok(localAssets.has(name), `local-fallback brand "${name}" missing from local asset ids`);
		assert.ok(onDisk.has(name), `local-fallback brand "${name}" has no public/3p/${name} folder`);
		assert.ok(registered.has(name), `local-fallback brand "${name}" missing from THIRD_PARTY_LOGO_NAMES`);
	}
});

test("every brand name has a display label", async () => {
	const { THIRD_PARTY_LOGO_NAMES, THIRD_PARTY_LOGO_LABELS } = await loadLogoThirdPartyData();

	for (const name of THIRD_PARTY_LOGO_NAMES) {
		const label = THIRD_PARTY_LOGO_LABELS[name];
		assert.equal(typeof label, "string", `missing label for ${name}`);
		assert.ok(label.length > 0, `empty label for ${name}`);
	}
});

test("thirdPartyLogoSrc resolves the canonical 24px asset path", async () => {
	const { thirdPartyLogoSrc } = await loadLogoThirdPartyData();

	assert.equal(thirdPartyLogoSrc("slack"), "/3p/slack/24.svg");
	assert.equal(thirdPartyLogoSrc("github"), "/3p/github/24.svg");
	assert.equal(
		thirdPartyLogoSrc("github-copilot"),
		"/3p/github-copilot/24.svg?v=transparent-bg",
	);
});

test("GitHub Copilot source SVGs have no painted background rectangle", () => {
	for (const size of [16, 20, 24, 32]) {
		const source = readFileSync(
			path.join(THIRD_PARTY_DIR, "github-copilot", `${size}.svg`),
			"utf8",
		);

		assert.doesNotMatch(source, /fill="white"/u);
	}
});

test("third-party logos use the shared tile size scale in tile demos", () => {
	assert.match(LOGO_THIRD_PARTY_SOURCE, /toThirdPartyLogoTileSize\(size\)/u);
	assert.match(LOGO_THIRD_PARTY_DEMO_SOURCE, /LOGO_TILE_SIZES/u);
	assert.doesNotMatch(LOGO_THIRD_PARTY_DEMO_SOURCE, /const BRAND_TILE_SIZES/u);
});
