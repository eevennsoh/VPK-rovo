import {
	RovoGenerationHighlight,
	RovoGenerationRoot,
} from "@/components/ui-custom/rovo-generation-components";

export type {
	RovoGenerationHighlightProps,
	RovoGenerationRootProps,
} from "@/components/ui-custom/rovo-generation-components";

export const RovoGeneration = {
	/** Tile surface with optional animated rainbow glow and border. */
	Root: RovoGenerationRoot,
	/** Wraps arbitrary UI and traces one rainbow lap around its perimeter to highlight it. */
	Highlight: RovoGenerationHighlight,
} as const;
