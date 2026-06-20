const assert = require("node:assert/strict");
const { readdirSync } = require("node:fs");
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

function loadLogoThirdPartyData() {
	modulePromise ??= loadDirectoryModule(`
		export {
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

/**
 * Brand marks are now sourced primarily from `@atlassian/logo-third-party`, so
 * `THIRD_PARTY_LOGO_NAMES` is a superset of the on-disk `public/3p` folders. The
 * `THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES` subset is the contract with `public/3p`
 * (it types `thirdPartyLogoSrc`), so it MUST equal the folders exactly — a drift
 * would mean either a `thirdPartyLogoSrc` id with no asset (404) or a shipped
 * asset no helper can reach.
 */
test("THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES matches the public/3p folders", async () => {
	const { THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES } = await loadLogoThirdPartyData();

	const onDisk = readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

	const inList = [...THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES].sort();

	assert.deepEqual(
		inList,
		onDisk,
		"THIRD_PARTY_LOGO_LOCAL_ASSET_NAMES in components/ui/data/logo-third-party-data.ts " +
			"is out of sync with /public/3p. Update the list to match the folders.",
	);
});

test("every local-fallback brand has a public/3p folder and is registered", async () => {
	const { THIRD_PARTY_LOGO_NAMES, THIRD_PARTY_LOGO_LOCAL_FALLBACKS } = await loadLogoThirdPartyData();

	const onDisk = new Set(
		readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name),
	);
	const registered = new Set(THIRD_PARTY_LOGO_NAMES);

	for (const name of THIRD_PARTY_LOGO_LOCAL_FALLBACKS) {
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
});
