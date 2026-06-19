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
			thirdPartyLogoSrc,
		} from "@/components/ui/data/logo-third-party-data";
	`);
	return modulePromise;
}

// components/ui -> repo root -> public/3p
const THIRD_PARTY_DIR = path.join(__dirname, "..", "..", "public", "3p");

/**
 * The brand union backing LogoThirdParty MUST mirror the on-disk `public/3p`
 * folders — otherwise a name resolves to a missing asset, or a shipped brand has
 * no typed component. Assert the list equals reality so new 3P assets can't
 * silently bypass the component (and vice versa).
 */
test("THIRD_PARTY_LOGO_NAMES matches the public/3p folders", async () => {
	const { THIRD_PARTY_LOGO_NAMES } = await loadLogoThirdPartyData();

	const onDisk = readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

	const inList = [...THIRD_PARTY_LOGO_NAMES].sort();

	assert.deepEqual(
		inList,
		onDisk,
		"THIRD_PARTY_LOGO_NAMES in components/ui/data/logo-third-party-data.ts is out " +
			"of sync with /public/3p. Update the names list to match the folders.",
	);
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
