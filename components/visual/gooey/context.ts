import { createContext, use } from "react";

import type { ObserveEngine } from "./observer";

export interface GooeyContextValue {
	portal: SVGGElement | null;
	meltPortal: SVGGElement | null;
	fill: string;
	getGroup: () => HTMLDivElement | null;
	engine: ObserveEngine;
}

export const GooeyContext = createContext<GooeyContextValue | null>(null);

export function useGooeyContext(): GooeyContextValue {
	const context = use(GooeyContext);
	if (!context) {
		throw new Error("<Gooey.Item> must be rendered inside a <Gooey> group.");
	}
	return context;
}
