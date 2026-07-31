// Maps each sampled mark particle onto the teamwork graph.
//
// The mark's facet buckets and the graph's communities are the same four
// groups, so a particle keeps its brand colour across the whole morph: an
// orange facet point becomes an orange node cluster or a packet travelling an
// orange link.
//
// Most particles ride links rather than sit on nodes — that is what makes the
// form read as a network of connections rather than a scatter of dots.
//
// Dependency-free so it runs under Node's strip-types test runner.

export interface GraphAssignment {
	readonly count: number;
	/** Edge index per particle, or -1 when the particle sits on a node. */
	readonly edgeIndex: Int32Array;
	/** Node index per particle; the anchor when `edgeIndex` is -1. */
	readonly nodeIndex: Int32Array;
	/** Starting position along the link, 0..1. */
	readonly travel: Float32Array;
	/** Interleaved x,y,z scatter around the resolved point. */
	readonly jitter: Float32Array;
}

export interface AssignParticlesOptions {
	readonly count: number;
	/** Facet index per particle, aligned to the cloud's bucket ordering. */
	readonly facets: Uint8Array;
	readonly communityEdges: readonly Int32Array[];
	readonly communityNodes: readonly Int32Array[];
	readonly edges: Int32Array;
	/** Share of particles that cluster on nodes instead of riding links. */
	readonly nodeShare?: number;
	readonly seed?: number;
}

const DEFAULT_NODE_SHARE = 0.34;

function hash(value: number): number {
	let h = Math.imul(value, 2246822519) >>> 0;
	h ^= h >>> 13;
	h = Math.imul(h, 3266489917) >>> 0;
	return (h ^ (h >>> 16)) >>> 0;
}

export function assignParticlesToGraph({
	count,
	facets,
	communityEdges,
	communityNodes,
	edges,
	nodeShare = DEFAULT_NODE_SHARE,
	seed = 0x7a11,
}: AssignParticlesOptions): GraphAssignment {
	const total = Math.max(0, Math.floor(count));
	const edgeIndex = new Int32Array(total);
	const nodeIndex = new Int32Array(total);
	const travel = new Float32Array(total);
	const jitter = new Float32Array(total * 3);

	for (let index = 0; index < total; index++) {
		const facet = facets[index] ?? 0;
		const edgeList = communityEdges[facet] ?? communityEdges[0];
		const nodeList = communityNodes[facet] ?? communityNodes[0];

		const base = hash(index ^ seed);
		const roll = (base & 0xffff) / 0xffff;

		if (nodeList && nodeList.length > 0 && (roll < nodeShare || !edgeList || edgeList.length === 0)) {
			edgeIndex[index] = -1;
			nodeIndex[index] = nodeList[(base >>> 16) % nodeList.length];
		} else if (edgeList && edgeList.length > 0) {
			const chosen = edgeList[(base >>> 16) % edgeList.length];
			edgeIndex[index] = chosen;
			// Anchor to an endpoint too, so a particle still has a home if the
			// caller needs one before the link is born.
			nodeIndex[index] = edges[chosen * 2];
		} else {
			edgeIndex[index] = -1;
			nodeIndex[index] = 0;
		}

		const spread = hash(base);
		travel[index] = (spread & 0xffff) / 0xffff;
		jitter[index * 3] = (((spread >>> 16) & 0xff) / 255 - 0.5);
		jitter[index * 3 + 1] = (((spread >>> 24) & 0xff) / 255 - 0.5);
		jitter[index * 3 + 2] = ((hash(spread) & 0xff) / 255 - 0.5);
	}

	return { count: total, edgeIndex, nodeIndex, travel, jitter };
}

/**
 * Expands a cloud's contiguous facet runs into a per-particle facet lookup.
 * The buckets are the compact form the draw loop wants; the assignment needs
 * random access.
 */
export function expandFacets(
	count: number,
	buckets: readonly { readonly facet: number; readonly start: number; readonly end: number }[],
): Uint8Array {
	const facets = new Uint8Array(Math.max(0, Math.floor(count)));
	for (const bucket of buckets) {
		for (let index = bucket.start; index < bucket.end && index < facets.length; index++) {
			facets[index] = bucket.facet;
		}
	}
	return facets;
}
