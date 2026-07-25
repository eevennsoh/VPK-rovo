"use client";

import { useEffect, type RefObject } from "react";
import { useLatestRef } from "@/lib/use-latest-ref";
import { getBridge, injectSelectorCore } from "../lib/bridge";
import { resolveIframePage } from "../lib/page-path";
import { HTML_SELECTOR_SHORTCUTS } from "../lib/shortcuts";
import type {
	AgentId,
	ElementContextPayload,
	HtmlSelectorBridge,
	HtmlSelectorBridgeState,
	SelectorPin,
	SelectorPinsMeta,
	SelectorPinSavePayload,
} from "../lib/types";

interface SelectorBridgeCallbacks {
	onAgentChange: (payload: { agent: AgentId }) => void;
	onCopyAllRequested: () => void;
	onElementContextCopied: (payload: ElementContextPayload) => void;
	onPageChange: (page: { diskPath?: string; pagePath: string; url: string }) => void;
	onPinSaved: (payload: SelectorPinSavePayload) => SelectorPin | void;
	onPinRemoved: (payload: { id: string }) => void;
	onSendRequested: () => void;
	onStaleSelectorsChange: (pagePath: string, selectors: string[]) => void;
	onStateChange: (payload: HtmlSelectorBridgeState) => void;
}

function getPinsForPage(pins: ReadonlyArray<SelectorPin>, pagePath: string): SelectorPin[] {
	return pins.filter((pin) => pin.pagePath === pagePath);
}

function getStaleSelectors(bridge: HtmlSelectorBridge, pins: ReadonlyArray<SelectorPin>): string[] {
	return pins
		.filter((pin) => !bridge.inspect(pin.id))
		.map((pin) => pin.selector);
}

export function useSelectorBridge({
	agent,
	callbacks,
	enabled = true,
	iframeRef,
	pinMeta,
	pagePins,
}: Readonly<{
	agent: AgentId;
	callbacks: SelectorBridgeCallbacks;
	enabled?: boolean;
	iframeRef: RefObject<HTMLIFrameElement | null>;
	pinMeta: SelectorPinsMeta;
	pagePins: SelectorPin[];
}>) {
	// Latest-value refs keep the mount effect below independent of
	// pins/meta/agent/callbacks identity. Re-running the mount effect calls
	// bridge.deactivate() in its cleanup, which closes the in-iframe overlay
	// UI (popovers, inspect mode) mid-interaction — every pin save would
	// otherwise kick the user out of the tool.
	const callbacksRef = useLatestRef(callbacks);
	const pagePinsRef = useLatestRef(pagePins);
	const pinMetaRef = useLatestRef(pinMeta);
	const agentRef = useLatestRef(agent);

	useEffect(() => {
		if (!enabled) {
			return () => {};
		}

		const iframe = iframeRef.current;
		if (!iframe) {
			return () => {};
		}

		let cancelled = false;

		const stableCallbacks = {
			onAgentChange: (payload: { agent: AgentId }) => callbacksRef.current.onAgentChange(payload),
			onCopyAllRequested: () => callbacksRef.current.onCopyAllRequested(),
			onElementContextCopied: (payload: ElementContextPayload) => callbacksRef.current.onElementContextCopied(payload),
			onPinRemoved: (payload: { id: string }) => callbacksRef.current.onPinRemoved(payload),
			onPinSaved: (payload: SelectorPinSavePayload) => callbacksRef.current.onPinSaved(payload),
			onSendRequested: () => callbacksRef.current.onSendRequested(),
			onStateChange: (payload: HtmlSelectorBridgeState) => callbacksRef.current.onStateChange(payload),
		};

		const mountIntoIframe = async () => {
			const page = resolveIframePage(iframe);
			callbacksRef.current.onPageChange(page);

			try {
				const bridge = await injectSelectorCore(iframe);
				if (cancelled || !bridge) {
					return;
				}

				bridge.configure({
					agent: agentRef.current,
					pagePath: page.pagePath,
					shortcuts: HTML_SELECTOR_SHORTCUTS,
					callbacks: stableCallbacks,
				});
				bridge.setEnabled(true);
				const activePagePins = getPinsForPage(pagePinsRef.current, page.pagePath);
				bridge.setPins(activePagePins, pinMetaRef.current);

				callbacksRef.current.onStaleSelectorsChange(
					page.pagePath,
					getStaleSelectors(bridge, activePagePins),
				);
			} catch {
				// Same-origin iframe injection is best-effort for local tooling.
			}
		};

		function handleLoad() {
			void mountIntoIframe();
		}

		const frameWindow = iframe.contentWindow;
		iframe.addEventListener("load", handleLoad);
		frameWindow?.addEventListener("pageshow", handleLoad);
		void mountIntoIframe();

		return () => {
			cancelled = true;
			iframe.removeEventListener("load", handleLoad);
			frameWindow?.removeEventListener("pageshow", handleLoad);
			try {
				const bridge = getBridge(iframe);
				bridge?.deactivate();
				bridge?.setEnabled(false);
			} catch {
				// Ignore cross-origin cleanup failures.
			}
		};
	}, [agentRef, callbacksRef, enabled, iframeRef, pagePinsRef, pinMetaRef]);

	// Data sync: push pin/meta/agent updates through the live bridge without
	// reconfiguring — setPins re-renders markers and lists but never touches
	// inspect mode or open popovers.
	useEffect(() => {
		if (!enabled) {
			return;
		}
		const iframe = iframeRef.current;
		const bridge = getBridge(iframe);
		if (!iframe || !bridge) {
			return;
		}
		const page = resolveIframePage(iframe);
		const activePagePins = getPinsForPage(pagePins, page.pagePath);
		bridge.setPins(activePagePins, pinMeta);
		callbacksRef.current.onStaleSelectorsChange(
			page.pagePath,
			getStaleSelectors(bridge, activePagePins),
		);
	}, [callbacksRef, enabled, iframeRef, pagePins, pinMeta]);
}
