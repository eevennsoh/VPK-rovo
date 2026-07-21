import type { ComponentDetail } from "@/app/data/component-detail-types";

export const THINKING_ORBS_DETAIL: ComponentDetail = {
	description:
		"Dotted canvas indicators for AI and agent activity, adapted from Jakub Antalik's MIT-licensed Thinking Orbs. Six hand-tuned states ship at two independently tuned sizes, with automatic theme detection, reduced-motion static frames, and offscreen pausing.",
	importStatement: `import {
	ThinkingOrb,
	type ThinkingOrbProps,
} from "@/components/visual/thinking-orbs";`,
	usage: `<ThinkingOrb state="listening" size={64} speed={1.25} />`,
	demoLayout: {
		previewContentWidth: "full",
		previewHeight: "fit",
		examplesContentWidth: "full",
	},
	adsLinks: [
		{ label: "Original demo", url: "https://orbs.jakubantalik.com/" },
		{
			label: "Source and MIT license",
			url: "https://github.com/JakubAntalik/thinking-orbs",
		},
	],
	examples: [
		{
			title: "Working",
			description: "Particles travel along several tilted orbital paths.",
			demoSlug: "thinking-orbs-demo-working",
		},
		{
			title: "Searching",
			description: "A scan meridian sweeps across a dotted globe.",
			demoSlug: "thinking-orbs-demo-searching",
		},
		{
			title: "Solving",
			description: "Dotted bands scramble and click back into alignment.",
			demoSlug: "thinking-orbs-demo-solving",
		},
		{
			title: "Listening",
			description: "A waveform rolls through the orb's latitude rings.",
			demoSlug: "thinking-orbs-demo-listening",
		},
		{
			title: "Composing",
			description: "An undulating multi-band sash wraps around the orb.",
			demoSlug: "thinking-orbs-demo-composing",
		},
		{
			title: "Shaping",
			description:
				"A dotted outline morphs between a circle, triangle, and square.",
			demoSlug: "thinking-orbs-demo-shaping",
		},
	],
	props: [
		{
			name: "state",
			type: '"working" | "searching" | "solving" | "listening" | "composing" | "shaping"',
			default: '"working"',
			description:
				"Selects one of the six hand-tuned agent activity animations.",
		},
		{
			name: "size",
			type: "64 | 20",
			default: "64",
			description:
				"Selects the large or inline preset. Dot count, dot size, and speed are tuned independently for each size.",
		},
		{
			name: "theme",
			type: '"auto" | "dark" | "light"',
			default: '"auto"',
			description:
				"Uses light ink on dark surfaces or dark ink on light surfaces. Auto follows an ancestor theme marker or the OS preference.",
		},
		{
			name: "speed",
			type: "number",
			default: "1",
			description:
				"Multiplier applied to the state's tuned base animation speed.",
		},
		{
			name: "paused",
			type: "boolean",
			default: "false",
			description: "Freezes the orb while preserving its current visual state.",
		},
		{
			name: "aria-label",
			type: "string",
			description: "Overrides the built-in state-specific accessible label.",
		},
		{
			name: "className / style",
			type: "string / React.CSSProperties",
			description:
				"Standard canvas styling props. Remaining canvas attributes and data attributes are forwarded.",
		},
	],
};
