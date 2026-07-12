import type { HtmlSelectorBridge } from "./types";

export const HTML_SELECTOR_STYLE_ID = "vpk-html-selector-core-style";
export const HTML_SELECTOR_UTILS_SCRIPT_ID = "vpk-html-selector-core-utils";
export const HTML_SELECTOR_INSPECT_SCRIPT_ID = "vpk-html-selector-core-inspect";
export const HTML_SELECTOR_UI_SCRIPT_ID = "vpk-html-selector-core-ui";
export const HTML_SELECTOR_SCRIPT_ID = "vpk-html-selector-core";

const HTML_SELECTOR_STYLE_HREF = "/html-selector/core.css";
const HTML_SELECTOR_UTILS_SRC = "/html-selector/core-utils.js";
const HTML_SELECTOR_INSPECT_SRC = "/html-selector/core-inspect.js";
const HTML_SELECTOR_UI_SRC = "/html-selector/core-ui.js";
const HTML_SELECTOR_SRC = "/html-selector/core.js";

type HtmlSelectorFrameWindow = Window & {
	__VPK_HTML_SELECTOR__?: HtmlSelectorBridge;
};

function getIframeDocument(iframe: HTMLIFrameElement): Document | null {
	try {
		return iframe.contentDocument;
	} catch {
		return null;
	}
}

function ensureIframeStyle(documentRef: Document): void {
	if (documentRef.getElementById(HTML_SELECTOR_STYLE_ID)) {
		return;
	}

	const link = documentRef.createElement("link");
	link.id = HTML_SELECTOR_STYLE_ID;
	link.rel = "stylesheet";
	link.href = HTML_SELECTOR_STYLE_HREF;
	documentRef.head.appendChild(link);
}

type TrackedScript = HTMLScriptElement & { __vpkhsLoaded?: Promise<void> };

function ensureIframeScript({
	documentRef,
	id,
	src,
}: Readonly<{
	documentRef: Document;
	id: string;
	src: string;
}>): Promise<void> {
	const existingScript = documentRef.getElementById(id) as TrackedScript | null;
	if (existingScript) {
		// A concurrent mount may have appended the element moments ago; wait
		// for its load instead of assuming it already executed.
		return existingScript.__vpkhsLoaded ?? Promise.resolve();
	}

	const script = documentRef.createElement("script") as TrackedScript;
	script.id = id;
	script.src = src;
	// In-order execution: core.js reads the utils global at eval time, so it
	// must never execute before core-utils.js.
	script.async = false;
	script.__vpkhsLoaded = new Promise((resolve, reject) => {
		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
	});
	documentRef.head.appendChild(script);
	return script.__vpkhsLoaded;
}

export async function injectSelectorCore(
	iframe: HTMLIFrameElement,
): Promise<HtmlSelectorBridge | null> {
	const documentRef = getIframeDocument(iframe);
	if (!documentRef || !iframe.contentWindow) {
		return null;
	}

	ensureIframeStyle(documentRef);
	await ensureIframeScript({
		documentRef,
		id: HTML_SELECTOR_UTILS_SCRIPT_ID,
		src: HTML_SELECTOR_UTILS_SRC,
	});
	await ensureIframeScript({
		documentRef,
		id: HTML_SELECTOR_INSPECT_SCRIPT_ID,
		src: HTML_SELECTOR_INSPECT_SRC,
	});
	await ensureIframeScript({
		documentRef,
		id: HTML_SELECTOR_UI_SCRIPT_ID,
		src: HTML_SELECTOR_UI_SRC,
	});
	await ensureIframeScript({
		documentRef,
		id: HTML_SELECTOR_SCRIPT_ID,
		src: HTML_SELECTOR_SRC,
	});

	return getBridge(iframe);
}

export function getBridge(iframe: HTMLIFrameElement | null): HtmlSelectorBridge | null {
	if (!iframe) {
		return null;
	}

	try {
		return (iframe.contentWindow as HtmlSelectorFrameWindow | null)?.__VPK_HTML_SELECTOR__ ?? null;
	} catch {
		return null;
	}
}
