const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const esbuild = require("esbuild");
const React = require("react");
const { parseHTML } = require("linkedom");
const { createRoot } = require("react-dom/client");

const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const { getResistedMinimumWidth } = loadRovoCoreModule("hooks/use-sidebar-resize.ts");

function loadUseSidebarResize() {
	const entryPoint = path.join(
		process.cwd(),
		"components/projects/rovo-core/hooks/use-sidebar-resize.ts",
	);
	const result = esbuild.buildSync({
		entryPoints: [entryPoint],
		bundle: true,
		external: ["react"],
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "use-sidebar-resize-test-harness.cjs")
		.useSidebarResize;
}

function createPointerEvent(window, type, clientX) {
	const event = new window.Event(type, { bubbles: true });
	Object.defineProperty(event, "clientX", { value: clientX });
	return event;
}

test("minimum-width resistance becomes progressively firmer without crossing the cutoff", () => {
	const minWidth = 440;
	const startWidth = 720;
	const firstWidth = getResistedMinimumWidth(470, startWidth, minWidth);
	const secondWidth = getResistedMinimumWidth(450, startWidth, minWidth);
	const thirdWidth = getResistedMinimumWidth(430, startWidth, minWidth);

	assert.ok(firstWidth > secondWidth);
	assert.ok(secondWidth > thirdWidth);
	assert.ok(thirdWidth > minWidth);
	assert.ok(firstWidth - secondWidth > secondWidth - thirdWidth);
	assert.equal(getResistedMinimumWidth(600, startWidth, minWidth), 600);
	assert.equal(getResistedMinimumWidth(400, minWidth, minWidth), minWidth);
});

test("pointer cancellation restores the committed width and ends the resize", async () => {
	const { window } = parseHTML("<!doctype html><html><body><div id='app'></div></body></html>");
	const originalGlobals = {
		document: globalThis.document,
		Event: globalThis.Event,
		HTMLElement: globalThis.HTMLElement,
		Node: globalThis.Node,
		window: globalThis.window,
		actEnvironment: globalThis.IS_REACT_ACT_ENVIRONMENT,
	};
	Object.assign(globalThis, {
		document: window.document,
		Event: window.Event,
		HTMLElement: window.HTMLElement,
		Node: window.Node,
		window,
		IS_REACT_ACT_ENVIRONMENT: true,
	});

	const useSidebarResize = loadUseSidebarResize();
	let resize = null;
	function Probe() {
		resize = useSidebarResize({ defaultWidth: 440, maxWidth: 720, minWidth: 440 });
		return null;
	}

	const root = createRoot(window.document.getElementById("app"));
	try {
		await React.act(async () => {
			root.render(React.createElement(Probe));
		});
		await React.act(async () => {
			resize.onResizeHandlePointerDown({
				clientX: 500,
				pointerId: 1,
				preventDefault() {},
				target: { setPointerCapture() {} },
			});
		});
		await React.act(async () => {
			window.document.dispatchEvent(createPointerEvent(window, "pointermove", 550));
		});
		assert.equal(resize.sidebarWidth, 490);
		assert.equal(resize.isResizing, true);

		await React.act(async () => {
			window.document.dispatchEvent(createPointerEvent(window, "pointercancel", 550));
		});
		assert.equal(resize.sidebarWidth, 440);
		assert.equal(resize.isResizing, false);
	} finally {
		await React.act(async () => {
			root.unmount();
		});
		Object.assign(globalThis, originalGlobals);
	}
});
