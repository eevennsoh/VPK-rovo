// Binds the generic point-cloud sampler to the Rovo brand mark.
//
// `ROVO_LOGO_PATHS` is rasterised once into a facet lookup table, then sampled
// on demand. Rasterising up front matters: hit-testing every candidate against
// all six `Path2D` objects would cost ~100k `isPointInPath` calls per resample
// and visibly stall the particle-count slider, whereas a mask lookup is a
// single array read.

import { ROVO_LOGO_PATHS, ROVO_LOGO_VIEWBOX } from "@/components/ui/data/rovo-logo";

import { samplePointCloud, type PointCloud } from "@/components/arts/rovo-p5/lib/point-cloud-sampling";

export type RovoLogoCloud = PointCloud;

/** Distinct facet colours, in painter order of first appearance. */
const FACET_HEX: readonly string[] = Array.from(new Set(ROVO_LOGO_PATHS.map((path) => path.fill)));

function hexToRgb(hex: string): readonly [number, number, number] {
	const value = Number.parseInt(hex.slice(1), 16);
	return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff] as const;
}

export const ROVO_FACET_COLORS: readonly (readonly [number, number, number])[] = FACET_HEX.map(hexToRgb);

export const ROVO_FACET_COUNT = ROVO_FACET_COLORS.length;

export const ROVO_MASK_SIZE = 512;

export const ROVO_CLOUD_SEED = 0x5f0b0;

const [, , VIEWBOX_WIDTH, VIEWBOX_HEIGHT] = ROVO_LOGO_VIEWBOX.split(" ").map(Number);

// Facets are rasterised as widely spaced red-channel sentinels. Anti-aliased
// pixels straddling two facets land midway between two sentinels and fall
// outside the tolerance, so they are dropped rather than mis-coloured.
const RED_STEP = 50;
const RED_TOLERANCE = 12;
const ALPHA_FLOOR = 250;

/**
 * Rasterises the mark into a `size * size` lookup where 0 means "outside the
 * logo" and any other value is `facetIndex + 1`. Browser-only.
 */
export function buildRovoFacetMask(size: number = ROVO_MASK_SIZE): Uint8Array {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;

	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) {
		throw new Error("Rovo p5: 2D canvas context unavailable for logo sampling.");
	}

	context.setTransform(size / VIEWBOX_WIDTH, 0, 0, size / VIEWBOX_HEIGHT, 0, 0);
	for (const path of ROVO_LOGO_PATHS) {
		const facet = FACET_HEX.indexOf(path.fill);
		context.fillStyle = `rgb(${(facet + 1) * RED_STEP}, 0, 0)`;
		context.fill(new Path2D(path.d), path.evenOdd ? "evenodd" : "nonzero");
	}

	const { data } = context.getImageData(0, 0, size, size);
	const mask = new Uint8Array(size * size);
	for (let index = 0; index < mask.length; index++) {
		const offset = index * 4;
		if (data[offset + 3] < ALPHA_FLOOR) continue;

		const red = data[offset];
		const facet = Math.round(red / RED_STEP) - 1;
		if (facet < 0 || facet >= ROVO_FACET_COUNT) continue;
		if (Math.abs(red - (facet + 1) * RED_STEP) > RED_TOLERANCE) continue;

		mask[index] = facet + 1;
	}

	return mask;
}

let cachedMask: Uint8Array | null = null;

/**
 * Browser entry point. The rasterised mask is independent of particle count, so
 * it is built once and reused across every resample.
 */
export function createRovoLogoCloud(count: number, seed: number = ROVO_CLOUD_SEED): RovoLogoCloud {
	cachedMask ??= buildRovoFacetMask(ROVO_MASK_SIZE);
	return samplePointCloud({
		count,
		mask: cachedMask,
		size: ROVO_MASK_SIZE,
		facetCount: ROVO_FACET_COUNT,
		seed,
	});
}
