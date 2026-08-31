import type { ComponentDetail } from "@/app/data/component-detail-types";

export const OMNIBAR_DETAIL: ComponentDetail = {
	description:
		"A persistent bottom-center AI bar with three geometries. At rest it is a black lozenge holding the Rovo sparkle. Hovering morphs it into a compact prompt bar — `+`, customize, editor, side-panel, and send — and pressing inside the bar pins it open so a draft survives the pointer leaving. The side-panel button docks a chat surface on the right. Pill and bar are a single `layout` element on `background.neutral.bold`, the same black the floating Rovo button uses.",
	demoLayout: { previewHeight: "fixed" },
	importStatement: `import { Omnibar } from "@/components/blocks/omnibar";`,
	usage: `import { Omnibar } from "@/components/blocks/omnibar";

// The default positioning is "container", so give it a relative ancestor.
<div className="relative h-[560px]">
	<Omnibar onSubmit={(prompt) => console.log(prompt)} />
</div>`,
	examples: [
		{
			title: "Expanded bar",
			description:
				"The hover state, shown pinned. `FloatingComposer` owns the row, so a draft long enough to wrap moves the editor onto its own line and the controls below it.",
			demoSlug: "omnibar-demo-expanded",
		},
		{
			title: "Docked panel",
			description:
				"The side-panel button swaps the bar for a right-docked conversation. The block contributes only placement and motion — the panel node keeps its own chrome and close control.",
			demoSlug: "omnibar-demo-docked",
		},
	],
	props: [
		{
			name: "placeholder",
			type: "string",
			default: '"Describe any changes you want to make..."',
			description: "Placeholder shown in the expanded bar's editor.",
		},
		{
			name: "positioning",
			type: '"container" | "viewport"',
			default: '"container"',
			description:
				'"container" anchors to the nearest positioned ancestor so previews stay inside their frame; "viewport" pins to the window for full-screen prototypes.',
		},
		{
			name: "sidePanel",
			type: "ReactNode",
			default: "the self-contained ChatPanel block",
			description:
				"Body of the docked state. Pass a real surface — for example the Rovo sidebar chat — to swap it without this block taking on that surface's providers.",
		},
		{
			name: "defaultState",
			type: '"collapsed" | "expanded" | "docked"',
			default: '"collapsed"',
			description: "Seeds the initial geometry, for catalog variants that show one state.",
		},
		{
			name: "onSubmit",
			type: "(prompt: string) => void",
			description: "Fired with the trimmed draft when the bar is submitted. Clears the editor.",
		},
		{
			name: "onStateChange",
			type: "(state: OmnibarState) => void",
			description: "Fired whenever the geometry changes, so a host can react to docking.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the bottom rail that centers the surface.",
		},
	],
};
