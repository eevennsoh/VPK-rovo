import type { ComponentDetail } from "@/app/data/component-detail-types";

export const GOOEY_DETAIL: ComponentDetail = {
	description:
		"A compound liquid UI component adapted from Jakub Antalik's MIT-licensed liquid-gooey 0.1.0. Gooey keeps interactive content as crisp DOM while an SVG silhouette layer merges, morphs, trails, shadows, and dissolves around it.",
	importStatement: `import {
	Gooey,
	type GooeyProps,
	type GooeyItemProps,
} from "@/components/visual/gooey";`,
	usage: `<Gooey
	blur={6}
	contrast={18}
	fill="var(--color-primary)"
	shadow="0 8px 24px rgba(9, 30, 66, 0.2)"
>
	<Gooey.Item
		effect="morph"
		morph={{ shape: true, speed: 1, bounce: 0.5 }}
	>
		<button type="button">Gooey</button>
	</Gooey.Item>
</Gooey>`,
	demoLayout: {
		previewContentWidth: "full",
		previewHeight: "fit",
		examplesContentWidth: "full",
	},
	adsLinks: [
		{ label: "Original demo", url: "https://gooey.jakubantalik.com/" },
		{
			label: "Source and MIT license",
			url: "https://github.com/Jakubantalik/Libraries/tree/cfa51e10f4bc581445248b75c3e9e81c9afac0ef/packages/liquid-gooey",
		},
	],
	examples: [
		{ title: "Morph plus menu", description: "A staggered radial menu whose actions bridge into the central plus button.", demoSlug: "gooey-morph-menu" },
		{ title: "Morph email input", description: "A compact email action evolves into a full form while the content stays crisp and focusable.", demoSlug: "gooey-morph-email" },
		{ title: "Morph avatar group with dissolve", description: "Drag the first avatar into its neighbours to mix imagery at the liquid contact seam.", demoSlug: "gooey-morph-avatars" },
		{ title: "Morph melting cards", description: "A draggable image card warps and dissolves as its surface meets a second card.", demoSlug: "gooey-morph-cards" },
		{ title: "Move gooey tabs", description: "The selected tab surface lags, stretches, and settles with a liquid-rubber tail.", demoSlug: "gooey-move-tabs" },
		{ title: "Move liquid-rubber slider", description: "A native range input drives a springy liquid thumb and trailing droplet.", demoSlug: "gooey-move-slider" },
	],
	props: [
		{ name: "blur", type: "number", default: "6", description: "SVG goo blur sigma in pixels; controls where nearby silhouettes begin bridging." },
		{ name: "contrast", type: "number", default: "18", description: "Alpha contrast slope used to sharpen the merged liquid edge." },
		{ name: "fill", type: "string", default: '"#fff"', description: "Any CSS color used to paint the merged silhouette, including var() values." },
		{ name: "shadow", type: "string", description: "CSS box-shadow syntax rendered against the merged silhouette. Supports multiple outer and inset layers." },
		{ name: "filterPadding", type: "number", default: "24", description: "Extra user-space filter region around the group for travelling blobs and shadows." },
		{ name: "ref", type: "React.Ref<HTMLDivElement>", description: "React 19 regular ref assigned to the root div." },
		{ name: "...div props", type: "React.HTMLAttributes<HTMLDivElement>", description: "All standard div attributes and DOM event handlers are forwarded to the root." },
	],
	subComponents: [
		{
			name: "Gooey.Item",
			description: "Mirrors or observes one real-DOM child and contributes its geometry to the liquid silhouette.",
			props: [
				{ name: "effect", type: '"morph" | "move"', default: '"morph"', description: "Selects merged/morphing liquid or movement-lag liquid rubber." },
				{ name: "morph", type: "MorphTuning", description: "Simple shape, speed, bounce, and contentBlur controls plus advanced evolve/blobInset/bridgeGrow options." },
				{ name: "morph.advanced.evolve", type: "EvolveOptions", description: "Raw mass, size, radius, content-blur, roundness, corner-timeline, anticipation, and travel tuning." },
				{ name: "move", type: "MoveTuning", description: "Normalized springiness, wobble, stretch, and trail controls plus raw stiffness, damping, stretch, and tail." },
				{ name: "dissolve", type: "boolean | number | DissolveOptions", description: "Enables contact-image melting or configures blur, warp, pull, range, zone, mix, gravity, taper, noise, timing, strength, and sink." },
				{ name: "x / y / scale", type: "number", default: "0 / 0 / 1", description: "Component-driven mirrored transform. Observed modes instead follow the child element's rendered geometry." },
				{ name: "transition", type: '"snappy" | "smooth" | "bouncy" | SpringConfig | { duration; ease }', default: '"smooth"', description: "Preset spring, raw spring physics, or duration/easing transition for mirrored transforms." },
				{ name: "delay", type: "number", default: "0", description: "Mirrored transition delay in milliseconds for staggered groups." },
				{ name: "observe", type: "boolean", default: "false", description: "Measures child-authored CSS, Motion, GSAP, or WAAPI transforms. Implied by morph.shape, dissolve, and move." },
				{ name: "radius", type: "number | CornerRadii", description: "Overrides measured liquid radius uniformly or per corner." },
				{ name: "className", type: "string", description: "Classes applied to the item's DOM wrapper." },
				{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the item's DOM wrapper." },
				{ name: "children", type: "React.ReactNode", description: "Real interactive DOM content kept above the hidden, non-interactive SVG layers." },
			],
		},
	],
};
