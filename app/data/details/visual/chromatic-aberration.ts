import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CHROMATIC_ABERRATION_DETAIL: ComponentDetail = {
	description: "Current Framer Chromatic video shader with Radial, Uniform, and Edges modes, still-image pulse animation, video media, and mode-specific distortion controls.",
	importStatement: `import ChromaticAberration from "@/components/website/demos/visual/shaders/chromatic-aberration";`,
	usage: `<ChromaticAberration
	mediaSrc="/media/source.webm"
	mediaType="video"
	mode="radial"
	zoom={0.5}
	focusX={0.5}
	focusY={0.5}
	radius={60}
	animate="pulse"
	animationAmount={0.5}
	speed={1}
/>`,
	props: [
		{ name: "mediaSrc", type: "string", description: "Optional image or video source URL. When omitted, the shader uses Framer's current default image." },
		{ name: "mediaType", type: '"image" | "video"', default: '"image"', description: "Media decoder used for mediaSrc. Video sources loop silently while the shader is active." },
		{ name: "imageSrc", type: "string", description: "Compatibility alias for existing image-only consumers." },
		{ name: "mode", type: '"radial" | "uniform" | "edges"', default: '"radial"', description: "Selects the current Framer Chromatic distortion model." },
		{ name: "zoom", type: "number", default: "0.5", description: "Radial lens zoom amount." },
		{ name: "focusX", type: "number", default: "0.5", description: "Horizontal radial focus in normalized coordinates." },
		{ name: "focusY", type: "number", default: "0.5", description: "Vertical radial focus in normalized coordinates." },
		{ name: "radius", type: "number", default: "60", description: "Channel split radius for Radial and Uniform modes." },
		{ name: "angle", type: "number", default: "90", description: "Uniform channel split direction in degrees." },
		{ name: "symmetry", type: '"point" | "mirror"', default: '"point"', description: "Edges-mode point or mirrored distortion symmetry." },
		{ name: "edgeAmount", type: "number", default: "100", description: "Edges-mode bend amount." },
		{ name: "edges", type: "number", default: "1", description: "Edges-mode boundary shape." },
		{ name: "falloff", type: "number", default: "3", description: "Edges-mode distortion falloff." },
		{ name: "swirl", type: "number", default: "0", description: "Edges-mode rotational distortion." },
		{ name: "dispersion", type: "number", default: "0.5", description: "Edges-mode RGB dispersion strength." },
		{ name: "animate", type: '"off" | "pulse"', default: '"pulse"', description: "Pulses the shader distortion even when the source is a still image." },
		{ name: "animationAmount", type: "number", default: "0.5", description: "Pulse depth from 0 to 1." },
		{ name: "speed", type: "number", default: "1", description: "Pulse speed from 0.1 to 5." },
	],
};
