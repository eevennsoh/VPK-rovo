const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

const { loadCjsModuleFromText } = require(
	path.join(process.cwd(), "scripts", "lib", "esbuild-cjs-loader.js"),
);

let modulePromise;
function loadDispatchError() {
	modulePromise ??= esbuild
		.build({
			entryPoints: [path.join(process.cwd(), "components/blocks/html-selector/lib/dispatch-error.ts")],
			bundle: true,
			format: "cjs",
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			write: false,
		})
		.then((result) => loadCjsModuleFromText(result.outputFiles[0].text));
	return modulePromise;
}

test("parseDispatchResponseBody returns valid dispatch payloads", async () => {
	const { parseDispatchResponseBody } = await loadDispatchError();

	assert.deepEqual(
		parseDispatchResponseBody(JSON.stringify({
			sessionName: "vpk-dev",
			windowName: "codex-html-selector",
		})),
		{
			error: undefined,
			sessionName: "vpk-dev",
			windowName: "codex-html-selector",
		},
	);
});

test("parseDispatchResponseBody maps non-JSON responses to the endpoint guidance", async () => {
	const {
		DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE,
		parseDispatchResponseBody,
	} = await loadDispatchError();

	assert.throws(
		() => parseDispatchResponseBody("<!DOCTYPE html><html><body>Cannot POST /api/html-selector/dispatch</body></html>"),
		{ message: DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE },
	);
});

test("parseDispatchResponseBody maps HTML error payloads to the endpoint guidance", async () => {
	const {
		DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE,
		parseDispatchResponseBody,
	} = await loadDispatchError();

	assert.throws(
		() => parseDispatchResponseBody(JSON.stringify({
			error: "<!DOCTYPE html><html><body>Cannot POST /api/html-selector/dispatch</body></html>",
		})),
		{ message: DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE },
	);
});

test("getDispatchErrorMessage preserves ordinary API errors", async () => {
	const { getDispatchErrorMessage } = await loadDispatchError();

	assert.equal(getDispatchErrorMessage("Unknown agent"), "Unknown agent");
	assert.equal(getDispatchErrorMessage("Prompt is required"), "Prompt is required");
});
