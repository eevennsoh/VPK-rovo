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
 * the registry is a superset of the on-disk `public/3p` folders. Two invariants
 * still protect against drift:
 *   1. Every `public/3p` folder MUST be a registered brand (no orphan asset that
 *      bypasses the component).
 *   2. Every declared local-fallback brand MUST have a `public/3p` folder (the
 *      package has no entry for it, so the asset is the only render path).
 */
test("every public/3p folder is a registered brand name", async () => {
	const { THIRD_PARTY_LOGO_NAMES } = await loadLogoThirdPartyData();

	const onDisk = readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);

	const registered = new Set(THIRD_PARTY_LOGO_NAMES);
	const orphans = onDisk.filter((name) => !registered.has(name));

	assert.deepEqual(
		orphans,
		[],
		"public/3p folders are not registered in THIRD_PARTY_LOGO_NAMES " +
			"(components/ui/data/logo-third-party-data.ts): " + orphans.join(", "),
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
