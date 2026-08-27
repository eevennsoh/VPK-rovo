import type { ReactNode } from "react";
import type {
	FloatingRovoButtonPlacement,
	FloatingRovoButtonPositioning,
} from "@/components/projects/shared/components/floating-rovo-button";

export interface RovoButtonDemoVariantRenderContext {
	placement: FloatingRovoButtonPlacement;
	positioning: FloatingRovoButtonPositioning;
}

/**
 * One entry on the showcase row. `render` returns the button itself; the caption
 * above it is drawn by the page from `title`/`detail`, so a variant never has to
 * repeat its own placement.
 */
export interface RovoButtonDemoVariant {
	id: string;
	title: string;
	detail: string;
	placement: FloatingRovoButtonPlacement;
	/** Gap between the caption and the button. Raise it to clear a persistent bar. */
	captionLiftPx?: number;
	render: (context: RovoButtonDemoVariantRenderContext) => ReactNode;
}
