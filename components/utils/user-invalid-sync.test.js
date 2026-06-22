const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

class FakeControl {
	constructor({ attrs = {}, userInvalid = false } = {}) {
		this.attrs = new Map(Object.entries(attrs));
		this.userInvalid = userInvalid;
	}

	matches(selector) {
		if (selector !== ":user-invalid") {
			throw new Error(`Unexpected selector: ${selector}`);
		}
		return this.userInvalid;
	}

	hasAttribute(name) {
		return this.attrs.has(name);
	}

	getAttribute(name) {
		return this.attrs.get(name) ?? null;
	}

	setAttribute(name, value) {
		this.attrs.set(name, String(value));
	}

	removeAttribute(name) {
		this.attrs.delete(name);
	}
}

class FakeInputElement extends FakeControl {}
class FakeTextAreaElement extends FakeControl {}
class FakeSelectElement extends FakeControl {}
class FakeDivElement extends FakeControl {}

async function loadUserInvalidSyncHarness(t) {
	const previousGlobals = {
		HTMLInputElement: globalThis.HTMLInputElement,
		HTMLSelectElement: globalThis.HTMLSelectElement,
		HTMLTextAreaElement: globalThis.HTMLTextAreaElement,
	};

	globalThis.HTMLInputElement = FakeInputElement;
	globalThis.HTMLTextAreaElement = FakeTextAreaElement;
	globalThis.HTMLSelectElement = FakeSelectElement;

	t.after(() => {
		for (const [key, value] of Object.entries(previousGlobals)) {
			if (value === undefined) {
				delete globalThis[key];
				continue;
			}
			globalThis[key] = value;
		}
	});

	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					USER_INVALID_SYNC_ATTRIBUTE,
					isUserInvalidSyncControl,
					releaseUserInvalidBridgeOwnership,
					syncUserInvalidAriaState,
				} from "./components/utils/user-invalid-sync";
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "user-invalid-sync-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("UserInvalidSync leaves explicit aria-invalid state untouched", async (t) => {
	const harness = await loadUserInvalidSyncHarness(t);
	const input = new FakeInputElement({
		attrs: { "aria-invalid": "true" },
		userInvalid: false,
	});

	harness.syncUserInvalidAriaState(input);

	assert.equal(input.getAttribute("aria-invalid"), "true");
	assert.equal(input.hasAttribute(harness.USER_INVALID_SYNC_ATTRIBUTE), false);
});

test("UserInvalidSync does not add aria-invalid=false to untouched valid controls", async (t) => {
	const harness = await loadUserInvalidSyncHarness(t);
	const input = new FakeInputElement({ userInvalid: false });

	harness.syncUserInvalidAriaState(input);

	assert.equal(input.hasAttribute("aria-invalid"), false);
	assert.equal(input.hasAttribute(harness.USER_INVALID_SYNC_ATTRIBUTE), false);
});

test("UserInvalidSync sets and clears only bridge-owned invalid state", async (t) => {
	const harness = await loadUserInvalidSyncHarness(t);
	const textarea = new FakeTextAreaElement({ userInvalid: true });

	harness.syncUserInvalidAriaState(textarea);
	assert.equal(textarea.getAttribute("aria-invalid"), "true");
	assert.equal(textarea.getAttribute(harness.USER_INVALID_SYNC_ATTRIBUTE), "true");

	textarea.userInvalid = false;
	harness.syncUserInvalidAriaState(textarea);
	assert.equal(textarea.hasAttribute("aria-invalid"), false);
	assert.equal(textarea.hasAttribute(harness.USER_INVALID_SYNC_ATTRIBUTE), false);
});

test("UserInvalidSync lets explicit invalid state take over after bridge-owned state", async (t) => {
	const harness = await loadUserInvalidSyncHarness(t);
	const input = new FakeInputElement({ userInvalid: true });

	harness.syncUserInvalidAriaState(input);
	assert.equal(input.getAttribute("aria-invalid"), "true");
	assert.equal(input.getAttribute(harness.USER_INVALID_SYNC_ATTRIBUTE), "true");

	input.setAttribute("aria-invalid", "true");
	harness.releaseUserInvalidBridgeOwnership(input);
	input.userInvalid = false;
	harness.syncUserInvalidAriaState(input);

	assert.equal(input.getAttribute("aria-invalid"), "true");
	assert.equal(input.hasAttribute(harness.USER_INVALID_SYNC_ATTRIBUTE), false);
});

test("UserInvalidSync ignores non-native validation controls", async (t) => {
	const harness = await loadUserInvalidSyncHarness(t);
	const div = new FakeDivElement({ userInvalid: true });

	harness.syncUserInvalidAriaState(div);

	assert.equal(harness.isUserInvalidSyncControl(div), false);
	assert.equal(div.hasAttribute("aria-invalid"), false);
});
