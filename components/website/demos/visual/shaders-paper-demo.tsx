"use client";

import { createElement, type ElementType } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "motion/react";
import {
	ColorPanels,
	Dithering,
	DotGrid,
	DotOrbit,
	FlutedGlass,
	GemSmoke,
	GodRays,
	GrainGradient,
	HalftoneCmyk,
	HalftoneDots,
	Heatmap,
	ImageDithering,
	LiquidMetal,
	MeshGradient,
	Metaballs,
	NeuroNoise,
	PaperTexture,
	PerlinNoise,
	PulsingBorder,
	SimplexNoise,
	SmokeRing,
	Spiral,
	StaticMeshGradient,
	StaticRadialGradient,
	Swirl,
	Voronoi,
	Warp,
	Water,
	Waves,
	colorPanelsPresets,
	ditheringPresets,
	dotGridPresets,
	dotOrbitPresets,
	flutedGlassPresets,
	gemSmokePresets,
	godRaysPresets,
	grainGradientPresets,
	halftoneCmykPresets,
	halftoneDotsPresets,
	heatmapPresets,
	imageDitheringPresets,
	liquidMetalPresets,
	meshGradientPresets,
	metaballsPresets,
	neuroNoisePresets,
	paperTexturePresets,
	perlinNoisePresets,
	pulsingBorderPresets,
	simplexNoisePresets,
	smokeRingPresets,
	spiralPresets,
	staticMeshGradientPresets,
	staticRadialGradientPresets,
	swirlPresets,
	voronoiPresets,
	warpPresets,
	waterPresets,
	wavesPresets,
} from "@paper-design/shaders-react";

import { token } from "@/lib/tokens";

const DEFAULT_SLUG = "paper-mesh-gradient";
const DEMO_IMAGE = "/ambient/ado/combo/primary/blue.svg";

type PaperShaderSlug =
	| "paper-color-panels"
	| "paper-dithering"
	| "paper-dot-grid"
	| "paper-dot-orbit"
	| "paper-fluted-glass"
	| "paper-gem-smoke"
	| "paper-god-rays"
	| "paper-grain-gradient"
	| "paper-halftone-cmyk"
	| "paper-halftone-dots"
	| "paper-heatmap"
	| "paper-image-dithering"
	| "paper-liquid-metal"
	| "paper-mesh-gradient"
	| "paper-metaballs"
	| "paper-neuro-noise"
	| "paper-paper-texture"
	| "paper-perlin-noise"
	| "paper-pulsing-border"
	| "paper-simplex-noise"
	| "paper-smoke-ring"
	| "paper-spiral"
	| "paper-static-mesh-gradient"
	| "paper-static-radial-gradient"
	| "paper-swirl"
	| "paper-voronoi"
	| "paper-warp"
	| "paper-water"
	| "paper-waves";

type PaperShaderParams = object & {
	image?: string;
	speed?: number;
};

type PaperShaderPreset = {
	name: string;
	params: object & {
		image?: string;
		speed?: number;
	};
};

type PaperShaderDefinition = {
	name: string;
	component: ElementType;
	preset: PaperShaderPreset;
	image?: string;
};

const PAPER_SHADER_DEMOS: Record<PaperShaderSlug, PaperShaderDefinition> = {
	"paper-color-panels": {
		name: "Color Panels",
		component: ColorPanels,
		preset: colorPanelsPresets[0],
	},
	"paper-dithering": {
		name: "Dithering",
		component: Dithering,
		preset: ditheringPresets[0],
	},
	"paper-dot-grid": {
		name: "Dot Grid",
		component: DotGrid,
		preset: dotGridPresets[0],
	},
	"paper-dot-orbit": {
		name: "Dot Orbit",
		component: DotOrbit,
		preset: dotOrbitPresets[0],
	},
	"paper-fluted-glass": {
		name: "Fluted Glass",
		component: FlutedGlass,
		preset: flutedGlassPresets[0],
		image: DEMO_IMAGE,
	},
	"paper-gem-smoke": {
		name: "Gem Smoke",
		component: GemSmoke,
		preset: gemSmokePresets[0],
		image: DEMO_IMAGE,
	},
	"paper-god-rays": {
		name: "God Rays",
		component: GodRays,
		preset: godRaysPresets[0],
	},
	"paper-grain-gradient": {
		name: "Grain Gradient",
		component: GrainGradient,
		preset: grainGradientPresets[0],
	},
	"paper-halftone-cmyk": {
		name: "Halftone CMYK",
		component: HalftoneCmyk,
		preset: halftoneCmykPresets[0],
		image: DEMO_IMAGE,
	},
	"paper-halftone-dots": {
		name: "Halftone Dots",
		component: HalftoneDots,
		preset: halftoneDotsPresets[0],
		image: DEMO_IMAGE,
	},
	"paper-heatmap": {
		name: "Heatmap",
		component: Heatmap,
		preset: heatmapPresets[0],
		image: DEMO_IMAGE,
	},
	"paper-image-dithering": {
		name: "Image Dithering",
		component: ImageDithering,
		preset: imageDitheringPresets[0],
		image: DEMO_IMAGE,
	},
	"paper-liquid-metal": {
		name: "Liquid Metal",
		component: LiquidMetal,
		preset: liquidMetalPresets[0],
		image: DEMO_IMAGE,
	},
	"paper-mesh-gradient": {
		name: "Mesh Gradient",
		component: MeshGradient,
		preset: meshGradientPresets[0],
	},
	"paper-metaballs": {
		name: "Metaballs",
		component: Metaballs,
		preset: metaballsPresets[0],
	},
	"paper-neuro-noise": {
		name: "Neuro Noise",
		component: NeuroNoise,
		preset: neuroNoisePresets[0],
	},
	"paper-paper-texture": {
		name: "Paper Texture",
		component: PaperTexture,
		preset: paperTexturePresets[0],
		image: DEMO_IMAGE,
	},
	"paper-perlin-noise": {
		name: "Perlin Noise",
		component: PerlinNoise,
		preset: perlinNoisePresets[0],
	},
	"paper-pulsing-border": {
		name: "Pulsing Border",
		component: PulsingBorder,
		preset: pulsingBorderPresets[0],
	},
	"paper-simplex-noise": {
		name: "Simplex Noise",
		component: SimplexNoise,
		preset: simplexNoisePresets[0],
	},
	"paper-smoke-ring": {
		name: "Smoke Ring",
		component: SmokeRing,
		preset: smokeRingPresets[0],
	},
	"paper-spiral": {
		name: "Spiral",
		component: Spiral,
		preset: spiralPresets[0],
	},
	"paper-static-mesh-gradient": {
		name: "Static Mesh Gradient",
		component: StaticMeshGradient,
		preset: staticMeshGradientPresets[0],
	},
	"paper-static-radial-gradient": {
		name: "Static Radial Gradient",
		component: StaticRadialGradient,
		preset: staticRadialGradientPresets[0],
	},
	"paper-swirl": {
		name: "Swirl",
		component: Swirl,
		preset: swirlPresets[0],
	},
	"paper-voronoi": {
		name: "Voronoi",
		component: Voronoi,
		preset: voronoiPresets[0],
	},
	"paper-warp": {
		name: "Warp",
		component: Warp,
		preset: warpPresets[0],
	},
	"paper-water": {
		name: "Water",
		component: Water,
		preset: waterPresets[0],
		image: DEMO_IMAGE,
	},
	"paper-waves": {
		name: "Waves",
		component: Waves,
		preset: wavesPresets[0],
	},
};

function getSlugFromPathname(pathname: string | null): PaperShaderSlug {
	const slug = pathname?.split("/").filter(Boolean).at(-1);

	if (slug && slug in PAPER_SHADER_DEMOS) {
		return slug as PaperShaderSlug;
	}

	return DEFAULT_SLUG;
}

function getShaderProps(
	definition: PaperShaderDefinition,
	shouldReduceMotion: boolean,
): PaperShaderParams {
	const params = { ...definition.preset.params };

	if (definition.image) {
		params.image = definition.image;
	}

	if (shouldReduceMotion && typeof params.speed === "number") {
		params.speed = 0;
	}

	return params;
}

export default function PaperShadersDemo() {
	const pathname = usePathname();
	const shouldReduceMotion = useReducedMotion() ?? false;
	const slug = getSlugFromPathname(pathname);
	const definition = PAPER_SHADER_DEMOS[slug];
	const shaderProps = getShaderProps(definition, shouldReduceMotion);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.200") }}>
			<div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface">
				{createElement(definition.component, {
					...shaderProps,
					className: "size-full",
					width: "100%",
					height: "100%",
				})}
			</div>
			<p className="text-sm text-text-subtle">
				{definition.name} from @paper-design/shaders-react, rendered with the first {definition.preset.name} preset.
			</p>
		</div>
	);
}
