// Generic seeded point-cloud sampler over a facet mask.
//
// Deliberately dependency-free (no `@/` aliases, no DOM) so it runs directly
// under Node's strip-types test runner. The Rovo-specific binding — rasterising
// the brand mark into a mask — lives in `rovo-logo-point-cloud.ts`.

export interface PointCloudBucket {
	/** Facet index the run belongs to. */
	readonly facet: number;
	/** Inclusive particle index. */
	readonly start: number;
	/** Exclusive particle index. */
	readonly end: number;
}

export interface PointCloud {
	readonly count: number;
	/** Interleaved x,y pairs normalised to -0.5..0.5. */
	readonly positions: Float32Array;
	/** Contiguous single-facet runs, so a draw loop sets its colour once per run. */
	readonly buckets: readonly PointCloudBucket[];
}

export interface SamplePointCloudOptions {
	readonly count: number;
	/** `size * size` lookup where 0 is empty and any other value is `facet + 1`. */
	readonly mask: Uint8Array;
	readonly size: number;
	readonly facetCount: number;
	readonly seed: number;
}

export function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Rejection-samples `count` points from a facet mask, sorted so every facet
 * occupies one contiguous run. Deterministic for a given `seed`.
 */
export function samplePointCloud({
	count,
	mask,
	size,
	facetCount,
	seed,
}: SamplePointCloudOptions): PointCloud {
	const total = Math.max(0, Math.floor(count));
	const random = mulberry32(seed);
	const xs = new Float32Array(total);
	const ys = new Float32Array(total);
	const facets = new Uint8Array(total);

	const maxAttempts = total * 40 + 1000;
	let found = 0;
	for (let attempt = 0; attempt < maxAttempts && found < total; attempt++) {
		const u = random();
		const v = random();
		const column = Math.min(size - 1, (u * size) | 0);
		const row = Math.min(size - 1, (v * size) | 0);

		const facet = mask[row * size + column];
		if (facet === 0) continue;

		xs[found] = u - 0.5;
		ys[found] = v - 0.5;
		facets[found] = facet - 1;
		found++;
	}

	// An empty mask or an exhausted attempt budget must still yield a
	// full-length cloud, because the draw loop pairs particle i with sample i.
	for (let index = found; index < total; index++) {
		const source = found > 0 ? index % found : 0;
		xs[index] = found > 0 ? xs[source] : 0;
		ys[index] = found > 0 ? ys[source] : 0;
		facets[index] = found > 0 ? facets[source] : 0;
	}

	return packCloud(xs, ys, facets, total, facetCount);
}

function packCloud(
	xs: Float32Array,
	ys: Float32Array,
	facets: Uint8Array,
	total: number,
	facetCount: number,
): PointCloud {
	const counts = new Int32Array(facetCount);
	for (let index = 0; index < total; index++) {
		counts[facets[index]]++;
	}

	const offsets = new Int32Array(facetCount);
	for (let facet = 1; facet < facetCount; facet++) {
		offsets[facet] = offsets[facet - 1] + counts[facet - 1];
	}

	const cursor = Int32Array.from(offsets);
	const positions = new Float32Array(total * 2);
	for (let index = 0; index < total; index++) {
		const slot = cursor[facets[index]]++;
		positions[slot * 2] = xs[index];
		positions[slot * 2 + 1] = ys[index];
	}

	const buckets: PointCloudBucket[] = [];
	for (let facet = 0; facet < facetCount; facet++) {
		if (counts[facet] === 0) continue;
		buckets.push({ facet, start: offsets[facet], end: offsets[facet] + counts[facet] });
	}

	return { count: total, positions, buckets };
}
