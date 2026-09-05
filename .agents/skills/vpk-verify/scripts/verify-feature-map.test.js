const assert = require("node:assert/strict");
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	verifyFeatureMap,
} = require("./verify-feature-map");

const REQUIRED_SECTIONS = [
	"Sub-features",
	"How to get to it (user POV)",
	"Driving it with control-vpk",
	"Gotchas",
];

function writeFixture({
	features = {},
	indexEntries = Object.keys(features),
	routes = ["/", "/studio"],
} = {}) {
	const root = mkdtempSync(path.join(os.tmpdir(), "vpk-feature-map-"));
	const featuresDir = path.join(root, "features");
	mkdirSync(featuresDir, { recursive: true });
	writeFileSync(
		path.join(featuresDir, "README.md"),
		[
			"# Fixture map",
			"",
			"## Features",
			"",
			...indexEntries.map((name) => `- [${name}](./${name}.md)`),
			"",
		].join("\n"),
	);
	for (const [name, content] of Object.entries(features)) {
		writeFileSync(path.join(featuresDir, `${name}.md`), content);
	}
	const repoMapPath = path.join(root, "repo-map.json");
	writeFileSync(
		repoMapPath,
		`${JSON.stringify({
			appPages: {
				pages: routes.map((routePath) => ({ routePath })),
			},
			components: { categories: [] },
		})}\n`,
	);
	return { featuresDir, repoMapPath, root };
}

function feature({ id = "fixture-open", route = "/studio", sections = REQUIRED_SECTIONS } = {}) {
	const bodyBySection = {
		"Sub-features": `- \`${id}\` opens the fixture.`,
		"How to get to it (user POV)": `- Open \`${route}\`.`,
		"Driving it with control-vpk": "Preconditions:\n\n- Doctor is healthy.",
		Gotchas: "- None.",
	};
	return [
		"# Fixture feature",
		"",
		"Fixture behavior.",
		"",
		...sections.flatMap((section) => [
			`## ${section}`,
			"",
			bodyBySection[section] ?? "- Unexpected.",
			"",
		]),
	].join("\n");
}

test("accepts an indexed feature map with unique IDs and resolvable routes", () => {
	const fixture = writeFixture({
		features: {
			studio: feature(),
		},
	});
	try {
		const report = verifyFeatureMap(fixture);
		assert.equal(report.ok, true);
		assert.deepEqual(report.failures, []);
		assert.equal(report.featureCount, 1);
		assert.equal(report.subFeatureCount, 1);
		assert.deepEqual(report.entryRoutes, ["/studio"]);
	} finally {
		rmSync(fixture.root, { force: true, recursive: true });
	}
});

test("rejects missing, duplicate, and unindexed feature entries", () => {
	const fixture = writeFixture({
		features: {
			orphan: feature(),
		},
		indexEntries: ["missing", "missing"],
	});
	try {
		const report = verifyFeatureMap(fixture);
		assert.equal(report.ok, false);
		assert.deepEqual(
			new Set(report.failures.map((failure) => failure.type)),
			new Set(["feature-index-duplicate", "feature-index-missing-file", "feature-file-unindexed"]),
		);
	} finally {
		rmSync(fixture.root, { force: true, recursive: true });
	}
});

test("rejects malformed section order and duplicate sub-feature IDs", () => {
	const fixture = writeFixture({
		features: {
			alpha: feature({ id: "shared-id" }),
			beta: feature({
				id: "shared-id",
				sections: [
					"Sub-features",
					"Driving it with control-vpk",
					"How to get to it (user POV)",
					"Gotchas",
				],
			}),
		},
	});
	try {
		const report = verifyFeatureMap(fixture);
		assert.equal(report.ok, false);
		assert.deepEqual(
			new Set(report.failures.map((failure) => failure.type)),
			new Set(["feature-section-contract", "sub-feature-id-duplicate"]),
		);
	} finally {
		rmSync(fixture.root, { force: true, recursive: true });
	}
});

test("rejects a user-entry route that the generated repo map cannot resolve", () => {
	const fixture = writeFixture({
		features: {
			missing: feature({ route: "/not-a-vpk-route" }),
		},
	});
	try {
		const report = verifyFeatureMap(fixture);
		assert.equal(report.ok, false);
		assert.deepEqual(report.failures, [{
			file: "missing.md",
			message: "User-entry route is not present in the generated repo map: /not-a-vpk-route",
			type: "feature-entry-route-unresolved",
		}]);
	} finally {
		rmSync(fixture.root, { force: true, recursive: true });
	}
});

test("accepts concrete URLs matched by generated dynamic route patterns", () => {
	const fixture = writeFixture({
		features: {
			"skill-detail": feature({ id: "skill-detail", route: "/rovo/skills/app/my-skill" }),
			"studio-child": feature({ id: "studio-child", route: "/studio/foo" }),
		},
		routes: ["/studio/[[...id]]", "/rovo/skills/[category]/[name]"],
	});
	try {
		const report = verifyFeatureMap(fixture);
		assert.equal(report.ok, true);
		assert.deepEqual(report.failures, []);
	} finally {
		rmSync(fixture.root, { force: true, recursive: true });
	}
});

test("repository validation gates run the feature-map verifier", () => {
	const repoRoot = path.resolve(__dirname, "../../../..");
	const packageJson = require(path.join(repoRoot, "package.json"));
	assert.equal(
		packageJson.scripts["verify:vpk-feature-map"],
		"node .agents/skills/vpk-verify/scripts/verify-feature-map.js",
	);
	assert.match(packageJson.scripts["validate:local"], /verify:vpk-feature-map/u);
	assert.match(packageJson.scripts["ci:pr"], /verify:vpk-feature-map/u);
});
