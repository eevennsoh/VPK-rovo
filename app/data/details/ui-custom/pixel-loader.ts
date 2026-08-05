import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PIXEL_LOADER_DETAIL: ComponentDetail = {
	description:
		"A 3x3 grid of pulsing cells for long-running work. Fifty-one stagger patterns make the grid read as a wavefront growing in a direction — sweeps, diagonals, ripples, spirals, snakes, lines and frames — plus the original chevron. Cells can be hard pixels or soft dots, and the whole loader inherits its colour from the surrounding text so it is theme-correct by default. Optional Rovo mode paints the wavefront in the four Rovo spot colours, identical in light and dark. Pairs with a shimmering label and a live elapsed timer. All motion is CSS keyframes plus per-cell animation-delay — no JS frame loop — and reduced motion freezes the grid to its dim state while the timer keeps counting.",
	usage: `import { PixelLoader } from "@/components/ui-custom/pixel-loader";

<PixelLoader />
<PixelLoader pattern="wave-left-to-right" shape="dot" size="large" />
<PixelLoader pattern="spiral-clockwise" color="rovo" label="Churning" showElapsed />`,
	props: [
		{
			name: "pattern",
			type: "PixelLoaderPattern",
			default: '"chevron"',
			description:
				"Which of the 51 stagger patterns to run. Import PIXEL_LOADER_PATTERNS for the full set, or PIXEL_LOADER_PATTERN_FAMILIES for them grouped by motion family.",
		},
		{
			name: "shape",
			type: '"square" | "dot"',
			default: '"square"',
			description: "Cell geometry — hard pixels or soft dots.",
		},
		{
			name: "size",
			type: '"small" | "medium" | "large" | "xlarge"',
			default: '"medium"',
			description: "Visual size (3 / 4 / 6 / 9px cells). Mirrors @atlaskit/spinner.",
		},
		{
			name: "color",
			type: '"default" | "rovo"',
			default: '"default"',
			description:
				'"default" inherits the surrounding text colour and flips with the theme. "rovo" paints the wavefront in the four Rovo spot colours, identical in light and dark.',
		},
		{
			name: "label",
			type: "string",
			description:
				"Optional shimmering caption rendered beside the grid. Also becomes the accessible name; falls back to \"Loading\".",
		},
		{
			name: "showElapsed",
			type: "boolean",
			default: "false",
			description:
				"Show a live elapsed timer in mono tabular figures. Keeps ticking under reduced motion, and is hidden from assistive technology so a 10Hz readout cannot flood the live region.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the wrapping element.",
		},
		{
			name: "testId",
			type: "string",
			description: "Optional test id applied to the wrapping element.",
		},
	],
	examples: [
		{
			title: "All 51 patterns",
			description:
				"Every pattern grouped by motion family, with live shape, size and Rovo colour controls.",
			demoSlug: "pixel-loader-playground-demo",
		},
		{
			title: "Directions",
			description: "The eight directional sweeps — the grid growing at different angles.",
			demoSlug: "pixel-loader-demo-directions",
		},
		{
			title: "Shapes and sizes",
			description: "Square cells and dots across the four preset sizes.",
			demoSlug: "pixel-loader-demo-shapes",
		},
		{
			title: "Rovo spot colours",
			description:
				"Default versus Rovo colour on opposite surfaces. The default mode inherits and stays legible on either; the Rovo hexes are identical in both.",
			demoSlug: "pixel-loader-demo-rovo",
		},
		{
			title: "In context",
			description: "Inline beside copy, and the full label-plus-timer experience.",
			demoSlug: "pixel-loader-demo-inline",
		},
	],
};
