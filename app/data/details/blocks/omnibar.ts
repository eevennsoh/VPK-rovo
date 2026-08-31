import type { ComponentDetail } from "@/app/data/component-detail-types";

export const OMNIBAR_DETAIL: ComponentDetail = {
	description:
		"A persistent bottom-center AI bar with three geometries. At rest it is a black lozenge holding the Rovo sparkle. Hovering morphs it into a compact prompt bar — `+`, editor, side-panel, and send — and pressing inside the bar pins it open so a draft survives the pointer leaving. The side-panel button docks a chat surface on the right. Pass `timelineEntries` and a Timeline context pill sits above the composer, scrubbing the Scrubber block's notch rail horizontally in the bar or vertically at the screen edge. Pill and bar share one surface whose width and height animate on `background.neutral.bold`, the same black the floating Rovo button uses — never `layout` scale, which would enlarge the prompt text.",
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
		{
			title: "Timeline — horizontal",
			description:
				"`timelineEntries` adds a Timeline context pill above the composer. On the default `x` axis it swaps the editor cell for the Scrubber's notch rail and turns send into a close; the shell never moves under the click, and the draft comes back when you leave.",
			demoSlug: "omnibar-demo-timeline",
		},
		{
			title: "Timeline — vertical",
			description:
				"`timelineAxis=\"y\"` docks a full-height rail to the right edge instead, leaving the editor in place so a draft and the timeline are usable at once. Scrubbing the rail does not count as an outside click, so the bar stays open.",
			demoSlug: "omnibar-demo-timeline-vertical",
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
			name: "timelineEntries",
			type: "readonly ScrubberEntry[]",
			description:
				"Supplying a timeline is what adds the Timeline context pill above the composer. Omit it and the bar has no pill at all. Build entries with buildScrubberEntries() from the Scrubber block.",
		},
		{
			name: "timelineAxis",
			type: '"x" | "y"',
			default: '"x"',
			description:
				'"x" swaps the bar\'s editor cell for a horizontal rail; "y" leaves the bar alone and docks a full-height rail to the right edge.',
		},
		{
			name: "timelineActiveIndex",
			type: "number",
			description:
				"Committed rail index. Supply it to control the rail from outside; omit to let the block own it.",
		},
		{
			name: "onTimelineActiveIndexChange",
			type: "(index: number) => void",
			description:
				"Fires whenever scrubbing commits a new entry, whether or not the index is controlled.",
		},
		{
			name: "defaultTimelineOpen",
			type: "boolean",
			default: "false",
			description:
				'Opens the bar straight into Timeline. Only meaningful with timelineEntries and defaultState="expanded".',
		},
		{
			name: "tone",
			type: '"inverse" | "default"',
			default: '"default"',
			description:
				'"default" (the default) gives the expanded bar the standard light PromptInput variant="floating" chrome. "inverse" re-skins it onto a black surface.',
		},
		{
			name: "onOpenPanel",
			type: "() => void",
			description:
				"Host-owned panel. When set, the side-panel control calls this and collapses the bar instead of docking the block's own ChatPanel.",
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
