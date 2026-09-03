const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

class FakeLocalStorage {
	constructor({ throwOnAccess = false } = {}) {
		this.entries = new Map();
		this.throwOnAccess = throwOnAccess;
	}

	getItem(key) {
		if (this.throwOnAccess) {
			throw new Error("storage disabled");
		}
		return this.entries.has(key) ? this.entries.get(key) : null;
	}

	setItem(key, value) {
		if (this.throwOnAccess) {
			throw new Error("storage disabled");
		}
		this.entries.set(key, String(value));
	}
}

function createFakeDocument() {
	return { documentElement: { dataset: {} } };
}

async function loadDesignVariationHarness(t, { localStorage, document } = {}) {
	const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
	const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: localStorage ?? new FakeLocalStorage(),
		writable: true,
	});
	Object.defineProperty(globalThis, "document", {
		configurable: true,
		value: document ?? createFakeDocument(),
		writable: true,
	});

	t.after(() => {
		for (const [key, descriptor] of [
			["localStorage", previousLocalStorage],
			["document", previousDocument],
		]) {
			if (descriptor) {
				Object.defineProperty(globalThis, key, descriptor);
				continue;
			}
			delete globalThis[key];
		}
	});

	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					DEFAULT_DESIGN_VARIATION,
					DESIGN_VARIATIONS,
					DESIGN_VARIATION_STORAGE_KEY,
					getDesignVariation,
					hydrateDesignVariation,
					isDesignVariationId,
					readStoredDesignVariation,
					resetDesignVariationForTests,
					setDesignVariation,
					subscribeToDesignVariation,
				} from "./components/utils/design-variation";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "design-variation-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	const harness = loadCjsModuleFromText(result.outputFiles[0].text, "design-variation-harness.cjs");
	t.after(() => {
		harness.resetDesignVariationForTests();
	});
	return harness;
}

test("exposes exactly the Team EU and 2000 years later variations", async (t) => {
	const harness = await loadDesignVariationHarness(t);

	assert.deepEqual(
		harness.DESIGN_VARIATIONS.map((variation) => [variation.id, variation.label]),
		[
			["team-eu", "Team EU"],
			["2000-years-later", "2000 years later"],
		],
	);
	assert.equal(harness.DEFAULT_DESIGN_VARIATION, "team-eu");
	assert.equal(harness.getDesignVariation(), "team-eu");
});

test("selecting a variation persists it and mirrors it onto the document root", async (t) => {
	const localStorage = new FakeLocalStorage();
	const document = createFakeDocument();
	const harness = await loadDesignVariationHarness(t, { localStorage, document });

	const seen = [];
	harness.subscribeToDesignVariation(() => {
		seen.push(harness.getDesignVariation());
	});

	harness.setDesignVariation("2000-years-later");

	assert.equal(harness.getDesignVariation(), "2000-years-later");
	assert.deepEqual(seen, ["2000-years-later"]);
	assert.equal(
		localStorage.getItem(harness.DESIGN_VARIATION_STORAGE_KEY),
		"2000-years-later",
	);
	assert.equal(document.documentElement.dataset.designVariation, "2000-years-later");

	// Re-selecting the active variation is a no-op for subscribers but still
	// (re)asserts the document attribute.
	document.documentElement.dataset.designVariation = "";
	harness.setDesignVariation("2000-years-later");
	assert.deepEqual(seen, ["2000-years-later"]);
	assert.equal(document.documentElement.dataset.designVariation, "2000-years-later");
});

test("hydration adopts a stored variation without rewriting storage", async (t) => {
	const localStorage = new FakeLocalStorage();
	localStorage.setItem("ui-design-variation", "2000-years-later");
	const harness = await loadDesignVariationHarness(t, { localStorage });

	assert.equal(harness.readStoredDesignVariation(), "2000-years-later");

	localStorage.entries.clear();
	harness.hydrateDesignVariation("2000-years-later");

	assert.equal(harness.getDesignVariation(), "2000-years-later");
	assert.equal(localStorage.getItem("ui-design-variation"), null);
});

test("rejects unknown stored values and unavailable storage", async (t) => {
	const localStorage = new FakeLocalStorage();
	localStorage.setItem("ui-design-variation", "team-usa");
	const harness = await loadDesignVariationHarness(t, { localStorage });

	assert.equal(harness.isDesignVariationId("team-usa"), false);
	assert.equal(harness.isDesignVariationId("2000-years-later"), true);
	assert.equal(harness.readStoredDesignVariation(), null);
});

test("a throwing localStorage never breaks selection", async (t) => {
	const document = createFakeDocument();
	const harness = await loadDesignVariationHarness(t, {
		document,
		localStorage: new FakeLocalStorage({ throwOnAccess: true }),
	});

	assert.equal(harness.readStoredDesignVariation(), null);
	harness.setDesignVariation("2000-years-later");
	assert.equal(harness.getDesignVariation(), "2000-years-later");
	assert.equal(document.documentElement.dataset.designVariation, "2000-years-later");
});
