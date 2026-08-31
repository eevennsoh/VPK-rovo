import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SCRUBBER_DETAIL: ComponentDetail = {
	description:
		"A scrubbable notch rail plus the prompt-input mode that hosts it. Two ranks of marks — long majors, short minors subdividing each major's slice — swell around the pointer with a pixel-distance falloff, and one pill slides to name where you are. The `⌛ Timeline` pill in the composer's leading slot swaps the editor row for the rail in place; it stays pressed while scrubbing, the send control becomes a close, and the typed draft comes back untouched.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { ScrubberComposer, ScrubberRail } from "@/components/blocks/scrubber";`,
	usage: `import { ScrubberComposer, buildScrubberEntries } from "@/components/blocks/scrubber";

const entries = buildScrubberEntries([
	{ id: "scope", heading: "Scope agreed", label: "Scope agreed, Mon 17 Aug" },
	{
		id: "cut",
		heading: "Wallet cut",
		label: "Wallet cut, Wed 19 Aug",
		children: [{ id: "cut-artifacts", heading: "Artifacts", label: "Wallet cut — artifacts" }],
	},
]);

<ScrubberComposer entries={entries} onSubmit={(prompt) => console.log(prompt)} />`,
	examples: [
		{
			title: "Timeline mode",
			description:
				"The composer with the rail already up. The pill reads as pressed, the rail takes the full-width row the editor had, and the trailing control is an exit rather than a send.",
			demoSlug: "scrubber-demo-timeline",
		},
	],
	props: [
		{
			name: "entries",
			type: "readonly ScrubberEntry[]",
			default: "SCRUBBER_DEMO_ENTRIES",
			description:
				"The rail, ascending by offset. Build it with `buildScrubberEntries(groups)`, which spaces majors evenly and subdivides each major's slice for its minors — spacing counts entries, not elapsed time, so a busy morning cannot bunch four marks onto one pixel.",
		},
		{
			name: "activeIndex",
			type: "number",
			description:
				"Index of the committed entry. Supply it to drive the rail from outside; omit it and the composer keeps its own index.",
		},
		{
			name: "onActiveIndexChange",
			type: "(index: number) => void",
			description: "Fires whenever a mark is committed, in both the controlled and uncontrolled shapes.",
		},
		{
			name: "onSubmit",
			type: "(prompt: string) => void",
			description: "Fired with the trimmed draft when the composer is submitted in idle mode. Clears the editor.",
		},
		{
			name: "placeholder",
			type: "string",
			default: '"Ask, @mention, or / for actions"',
			description: "Placeholder for the editor row in idle mode.",
		},
		{
			name: "defaultMode",
			type: '"idle" | "timeline"',
			default: '"idle"',
			description: "Seeds the initial mode, for catalog variants that show the rail directly.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the wrapper around the composer shell.",
		},
	],
	subComponents: [
		{
			name: "ScrubberRail",
			description:
				"The rail on its own, for surfaces that are not a composer. It is a `role=\"listbox\"` of `role=\"option\"` marks with a roving tabindex, and takes `axis=\"x\" | \"y\"`. Its marks deliberately overflow the rail — a major swells to 46px above a 14px track — so no ancestor between the rail and roughly 36px of headroom may clip.",
			props: [
				{
					name: "entries",
					type: "readonly ScrubberEntry[]",
					description: "The rail, ascending by offset.",
				},
				{
					name: "activeIndex",
					type: "number",
					description: "Index of the committed entry. Out-of-range is tolerated.",
				},
				{
					name: "onSelect",
					type: "(id: string) => void",
					description: "Fires on click, keyboard commit, and — outside reduced motion — on scrubbing past a mark.",
				},
				{
					name: "ariaLabel",
					type: "string",
					description: "Accessible name for the listbox.",
				},
				{
					name: "axis",
					type: '"x" | "y"',
					default: '"x"',
					description: "Horizontal rails draw vertical ticks and animate height; vertical rails do the reverse.",
				},
				{
					name: "showPill",
					type: "boolean",
					default: "true",
					description:
						"The sliding label naming the active entry. It occupies a reserved row rather than an overlay, so its width changing can never reflow the host.",
				},
			],
		},
	],
};
