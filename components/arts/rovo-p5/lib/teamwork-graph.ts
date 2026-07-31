// A temporal force-directed graph: the second form the Rovo mark morphs into.
//
// The mark's four facets become four communities, so the morph reads as the
// logo unfolding into the teamwork context it represents — dense clusters for
// each surface, sparse bridges between them.
//
// "Temporal" is two things here: the layout never fully settles (it is relaxed
// a little every frame), and nodes and links are born over a repeating cycle so
// the graph visibly accretes rather than appearing whole.
//
// Deliberately dependency-free (no `@/` aliases, no DOM) so it runs directly
// under Node's strip-types test runner.

// Self-contained PRNG: keeping this module free of imports is what lets it run
// directly under Node's strip-types test runner, which cannot resolve the `@/`
// alias. It is a counter-fed integer hash rather than a copy of the sampler's
// `mulberry32`, so there is no duplicated primitive to drift.
function createRandom(seed: number): () => number {
	let counter = 0;
	return () => {
		let hash = Math.imul(seed ^ counter++, 2246822519) >>> 0;
		hash ^= hash >>> 13;
		hash = Math.imul(hash, 3266489917) >>> 0;
		// `^` yields a *signed* 32-bit int, so the final mix has to be coerced
		// back to unsigned — otherwise this returns negatives and every index
		// derived from it lands out of bounds.
		return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
	};
}

export interface TeamworkGraph {
	readonly nodeCount: number;
	/** Interleaved x,y,z per node, in normalised units (roughly a unit ball). */
	readonly positions: Float32Array;
	readonly velocities: Float32Array;
	readonly community: Uint8Array;
	/** Cycle fraction at which each node appears, 0..1. */
	readonly nodeBirth: Float32Array;
	readonly edgeCount: number;
	/** Interleaved node index pairs. */
	readonly edges: Int32Array;
	readonly edgeBirth: Float32Array;
	/** Edge indices each community can route particles along, including bridges. */
	readonly communityEdges: readonly Int32Array[];
	/** Node indices belonging to each community. */
	readonly communityNodes: readonly Int32Array[];
	/** Interleaved x,y,z pull target per community, on the unit sphere. */
	readonly anchors: Float32Array;
}

export interface TeamworkGraphOptions {
	readonly nodeCount: number;
	readonly communityCount: number;
	readonly seed: number;
	/** Intra-community links attempted per node. */
	readonly degree?: number;
	/** Fraction of node count added as cross-community bridges. */
	readonly bridgeRatio?: number;
}

/** Births finish comfortably before the cycle ends so the graph reads complete. */
const BIRTH_WINDOW = 0.7;

/** Links appear a beat after both endpoints exist. */
const EDGE_BIRTH_LAG = 0.04;

/**
 * Pull targets, one per community. Four communities get the vertices of a
 * tetrahedron — the most separated four directions there are, which is what
 * keeps the mark's facets legible as distinct clusters instead of collapsing
 * into one ball. Any other count falls back to a ring.
 */
function buildAnchors(communityCount: number): Float32Array {
	const anchors = new Float32Array(communityCount * 3);

	if (communityCount === 4) {
		const vertices = [
			[1, 1, 1],
			[1, -1, -1],
			[-1, 1, -1],
			[-1, -1, 1],
		];
		const norm = 1 / Math.sqrt(3);
		for (let index = 0; index < 4; index++) {
			anchors[index * 3] = vertices[index][0] * norm;
			anchors[index * 3 + 1] = vertices[index][1] * norm;
			anchors[index * 3 + 2] = vertices[index][2] * norm;
		}
		return anchors;
	}

	for (let index = 0; index < communityCount; index++) {
		const angle = (index / communityCount) * Math.PI * 2;
		anchors[index * 3] = Math.cos(angle);
		anchors[index * 3 + 1] = Math.sin(angle) * 0.55;
		anchors[index * 3 + 2] = Math.sin(angle * 1.7) * 0.6;
	}
	return anchors;
}

function edgeKey(a: number, b: number): number {
	return a < b ? a * 100000 + b : b * 100000 + a;
}

export function createTeamworkGraph({
	nodeCount,
	communityCount,
	seed,
	degree = 3,
	bridgeRatio = 0.18,
}: TeamworkGraphOptions): TeamworkGraph {
	const total = Math.max(communityCount, Math.floor(nodeCount));
	const random = createRandom(seed);

	const positions = new Float32Array(total * 3);
	const velocities = new Float32Array(total * 3);
	const community = new Uint8Array(total);
	const nodeBirth = new Float32Array(total);

	// Anchor each community in its own direction so the sim starts near its
	// answer; a cold random start takes far longer to separate the clusters.
	const anchors = buildAnchors(communityCount);

	const buckets: number[][] = Array.from({ length: communityCount }, () => []);
	for (let index = 0; index < total; index++) {
		const group = index % communityCount;
		community[index] = group;
		buckets[group].push(index);
		nodeBirth[index] = random() * BIRTH_WINDOW;

		positions[index * 3] = anchors[group * 3] * 0.7 + (random() - 0.5) * 0.4;
		positions[index * 3 + 1] = anchors[group * 3 + 1] * 0.7 + (random() - 0.5) * 0.4;
		positions[index * 3 + 2] = anchors[group * 3 + 2] * 0.7 + (random() - 0.5) * 0.4;
	}

	const pairs: number[] = [];
	const seen = new Set<number>();
	const addEdge = (a: number, b: number) => {
		if (a === b) return;
		const key = edgeKey(a, b);
		if (seen.has(key)) return;
		seen.add(key);
		pairs.push(a, b);
	};

	for (const members of buckets) {
		// A ring first, so no community can fragment, then random chords for the
		// uneven density a real graph has.
		for (let index = 0; index < members.length; index++) {
			addEdge(members[index], members[(index + 1) % members.length]);
		}
		for (const node of members) {
			for (let attempt = 0; attempt < degree; attempt++) {
				addEdge(node, members[(random() * members.length) | 0]);
			}
		}
	}

	const bridgeCount = Math.max(1, Math.round(total * bridgeRatio));
	for (let index = 0; index < bridgeCount; index++) {
		const from = (random() * total) | 0;
		let to = (random() * total) | 0;
		if (community[from] === community[to]) to = (to + 1 + ((random() * (total - 1)) | 0)) % total;
		addEdge(from, to);
	}

	const edges = Int32Array.from(pairs);
	const edgeCount = edges.length / 2;
	const edgeBirth = new Float32Array(edgeCount);
	const communityEdgeLists: number[][] = Array.from({ length: communityCount }, () => []);

	for (let index = 0; index < edgeCount; index++) {
		const a = edges[index * 2];
		const b = edges[index * 2 + 1];
		edgeBirth[index] = Math.min(1, Math.max(nodeBirth[a], nodeBirth[b]) + EDGE_BIRTH_LAG);
		communityEdgeLists[community[a]].push(index);
		if (community[a] !== community[b]) communityEdgeLists[community[b]].push(index);
	}

	return {
		nodeCount: total,
		positions,
		velocities,
		community,
		nodeBirth,
		edgeCount,
		edges,
		edgeBirth,
		communityEdges: communityEdgeLists.map((list) => Int32Array.from(list)),
		communityNodes: buckets.map((list) => Int32Array.from(list)),
		anchors,
	};
}

export interface RelaxOptions {
	readonly repulsion: number;
	readonly linkDistance: number;
	readonly stiffness?: number;
	readonly centering?: number;
	readonly damping?: number;
	readonly step?: number;
	/** Pull toward the node's community anchor; 0 gives one undifferentiated ball. */
	readonly cohesion?: number;
	/** Distance from the origin the anchors sit at. */
	readonly cohesionRadius?: number;
	/**
	 * Pull toward a spherical shell. Without it the layout fills a ball and
	 * reads as a formless cloud when spun; on a shell it reads as a globe with
	 * four coloured regions, which is the whole point of the form.
	 */
	readonly shell?: number;
	readonly shellRadius?: number;
	/** Hard cap on distance from the origin, so the layout stays framed. */
	readonly radius?: number;
}

/**
 * Advances the layout by one step. Called every frame rather than run to
 * convergence: a graph that keeps easing toward its answer is what makes the
 * form feel alive instead of staged.
 *
 * Repulsion is all-pairs O(n²), which is the right trade at this scale — a
 * hundred-odd nodes is ~5k pairs a frame, far cheaper than the particle loop it
 * feeds, and it avoids a spatial index that would need rebuilding every frame.
 */
export function relaxTeamworkGraph(graph: TeamworkGraph, options: RelaxOptions): void {
	const {
		repulsion,
		linkDistance,
		stiffness = 0.08,
		centering = 0.003,
		damping = 0.82,
		step = 1,
		radius = 1.25,
		cohesion = 0.05,
		cohesionRadius = 0.92,
		shell = 0.09,
		shellRadius = 1,
	} = options;

	const { nodeCount, positions, velocities, edges, edgeCount, community, anchors } = graph;

	for (let a = 0; a < nodeCount; a++) {
		const ax = positions[a * 3];
		const ay = positions[a * 3 + 1];
		const az = positions[a * 3 + 2];

		for (let b = a + 1; b < nodeCount; b++) {
			let dx = ax - positions[b * 3];
			let dy = ay - positions[b * 3 + 1];
			let dz = az - positions[b * 3 + 2];
			let distanceSquared = dx * dx + dy * dy + dz * dz;

			if (distanceSquared < 1e-6) {
				// Coincident nodes have no direction to separate along; nudge them
				// apart deterministically rather than dividing by ~zero.
				dx = (a % 3) * 1e-3 + 1e-4;
				dy = (b % 3) * 1e-3 + 1e-4;
				dz = 1e-4;
				distanceSquared = dx * dx + dy * dy + dz * dz;
			}

			const force = repulsion / distanceSquared;
			const distance = Math.sqrt(distanceSquared);
			const fx = (dx / distance) * force;
			const fy = (dy / distance) * force;
			const fz = (dz / distance) * force;

			velocities[a * 3] += fx;
			velocities[a * 3 + 1] += fy;
			velocities[a * 3 + 2] += fz;
			velocities[b * 3] -= fx;
			velocities[b * 3 + 1] -= fy;
			velocities[b * 3 + 2] -= fz;
		}
	}

	for (let index = 0; index < edgeCount; index++) {
		const a = edges[index * 2];
		const b = edges[index * 2 + 1];
		const dx = positions[b * 3] - positions[a * 3];
		const dy = positions[b * 3 + 1] - positions[a * 3 + 1];
		const dz = positions[b * 3 + 2] - positions[a * 3 + 2];
		const distance = Math.hypot(dx, dy, dz) || 1e-4;

		const pull = (distance - linkDistance) * stiffness;
		const fx = (dx / distance) * pull;
		const fy = (dy / distance) * pull;
		const fz = (dz / distance) * pull;

		velocities[a * 3] += fx;
		velocities[a * 3 + 1] += fy;
		velocities[a * 3 + 2] += fz;
		velocities[b * 3] -= fx;
		velocities[b * 3 + 1] -= fy;
		velocities[b * 3 + 2] -= fz;
	}

	if (cohesion > 0) {
		for (let index = 0; index < nodeCount; index++) {
			const base = index * 3;
			const anchor = community[index] * 3;
			velocities[base] += (anchors[anchor] * cohesionRadius - positions[base]) * cohesion;
			velocities[base + 1] += (anchors[anchor + 1] * cohesionRadius - positions[base + 1]) * cohesion;
			velocities[base + 2] += (anchors[anchor + 2] * cohesionRadius - positions[base + 2]) * cohesion;
		}
	}

	// Push each node out onto the shell. Applied along its own radius, so it
	// shapes the surface without disturbing where a node sits on it.
	if (shell > 0) {
		for (let index = 0; index < nodeCount; index++) {
			const base = index * 3;
			const distance = Math.hypot(positions[base], positions[base + 1], positions[base + 2]);
			if (distance < 1e-4) {
				// A node exactly at the centre has no radius to push along; nudge it
				// toward its community anchor instead.
				const anchor = community[index] * 3;
				velocities[base] += anchors[anchor] * shell;
				velocities[base + 1] += anchors[anchor + 1] * shell;
				velocities[base + 2] += anchors[anchor + 2] * shell;
				continue;
			}
			const push = ((shellRadius - distance) / distance) * shell;
			velocities[base] += positions[base] * push;
			velocities[base + 1] += positions[base + 1] * push;
			velocities[base + 2] += positions[base + 2] * push;
		}
	}

	for (let index = 0; index < nodeCount; index++) {
		const base = index * 3;
		velocities[base] = (velocities[base] - positions[base] * centering) * damping;
		velocities[base + 1] = (velocities[base + 1] - positions[base + 1] * centering) * damping;
		velocities[base + 2] = (velocities[base + 2] - positions[base + 2] * centering) * damping;

		positions[base] += velocities[base] * step;
		positions[base + 1] += velocities[base + 1] * step;
		positions[base + 2] += velocities[base + 2] * step;

		const distance = Math.hypot(positions[base], positions[base + 1], positions[base + 2]);
		if (distance > radius) {
			const scale = radius / distance;
			positions[base] *= scale;
			positions[base + 1] *= scale;
			positions[base + 2] *= scale;
		}
	}
}
