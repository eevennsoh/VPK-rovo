// The Rovo p5 sketch: a 3D morph between the Rovo mark, reconstructed as the
// isometric cube it depicts, and a temporal force-directed teamwork graph.
//
// Unpacked from the golfed original, with every magic number promoted to a
// parameter. The flow field's own `c = d - t` rotation is what fakes its torus;
// on top of that the whole scene sits in a real 3D camera (yaw/pitch, orbitable
// by dragging), so the logo state resolves to a solid you can turn.
//
// Three deliberate departures from a naive port:
//
//   1. The original couples particle *count* to the parametric domain, because
//      `i` is both the loop counter and the coordinate (`y = i / 235`). Feeding
//      the formula a virtual index `u = i * (10000 / count)` decouples them, so
//      the particle slider changes density without reshaping the form.
//
//   2. Drawing goes through `p.drawingContext` rather than `p.point()`. In
//      p5 2.x `point()` allocates a `p5.Shape` and a `p5.Vector` per call and
//      runs the generic shape pipeline — 1.2M allocations/second at 10k points
//      and 60fps. A `fillRect` per particle is one allocation-free native call,
//      and because the cloud is pre-sorted by facet we assign `fillStyle` once
//      per colour run (4 assignments per frame) instead of once per particle.
//      Per-particle fills also let alpha accumulate where points overlap, which
//      is what gives the dense regions their glow.
//
//   3. Depth fades and shrinks points rather than sorting them. Painter's-order
//      sorting would cost an O(n log n) pass per frame and break the contiguous
//      colour runs; for a translucent point cloud, attenuation reads as depth
//      just as well.

import type p5 from "p5";

import type { RovoP5Backdrop } from "@/components/arts/rovo-p5/data/rovo-p5-backdrop";
import type { RovoP5Params } from "@/components/arts/rovo-p5/data/rovo-p5-params";
import {
	HOME_PITCH,
	HOME_YAW,
	unprojectFacetPoint,
	type Vec3,
} from "@/components/arts/rovo-p5/lib/rovo-logo-3d";
import {
	ROVO_FACET_COLORS,
	type RovoLogoCloud,
} from "@/components/arts/rovo-p5/lib/rovo-logo-point-cloud";
import type { RovoP5Direction } from "@/components/arts/rovo-p5/lib/rovo-p5-timeline";
import type { GraphAssignment } from "@/components/arts/rovo-p5/lib/teamwork-graph-assignment";
import {
	relaxTeamworkGraph,
	type TeamworkGraph,
} from "@/components/arts/rovo-p5/lib/teamwork-graph";

/** Coordinate space the original sketch was tuned in. */
const DESIGN_SIZE = 400;

/** Width of the logo state, in design units. */
const LOGO_SPAN = 0.62 * DESIGN_SIZE;

/** Design-unit amplitude of the idle drift shown while the logo is held. */
const IDLE_WOBBLE = 3;

/** Spatial frequency of that drift; low enough to stay a wave, not noise. */
const IDLE_WAVELENGTH = 0.05;

/**
 * Share of the morph spent staggering particle departures. Without it every
 * particle leaves and arrives together, which reads as a rigid contraction
 * rather than a cloud finding its shape.
 */
const MORPH_STAGGER = 0.55;

/** Design-unit bow on each particle's path, so the collapse spirals in. */
const MORPH_SWIRL = 46;

/** Camera distance in design units at perspective strength 1. */
const FOCAL_LENGTH = 520;

/** How much nearer points grow relative to the raw perspective scale. */
const DEPTH_GAIN = 2.2;

const TAU = Math.PI * 2;

// Brightness tiers. A uniform alpha reads as flat dust; the reference sketches
// get their star-field depth from a faint majority punctuated by a bright few.
//
// Rejection sampling already randomises order *within* a facet run, so slicing
// that run by position is a random assignment that happens to be contiguous —
// which keeps the "no canvas state changes per particle" contract intact. Dust
// and the brighter tiers differ only in alpha, so it costs two `fillStyle`
// assignments per facet rather than ten thousand.
const DUST_SHARE = 0.72;
const MID_SHARE = 0.23;
const DUST_ALPHA = 0.42;
const DUST_SIZE = 0.85;
const MID_SIZE = 1.15;

/**
 * Ceiling on the drawn rect size. Points are axis-aligned rects, so past a few
 * pixels a bright one stops reading as a star and starts reading as a square.
 */
const MAX_POINT_SIZE = 3.2;

const WHITE: readonly [number, number, number] = [255, 255, 255];

/** Neutral tint for link lines: brand colour belongs to the packets. */
const LINK_TINT: readonly [number, number, number] = [148, 158, 178];

/** Repulsion budget shared across the node set, so density stays stable. */
const GRAPH_REPULSION = 1.1;

/** Converts the traffic slider into a fraction of a link per unit time. */
const GRAPH_TRAVEL_SCALE = 0.06;

/** Scatter around a resolved node or link point, in normalised graph units. */
const NODE_SCATTER = 0.06;

/** Fraction of the growth cycle a single node or link takes to fade in. */
const BIRTH_FADE = 0.12;

/** Nominal frame rate, for turning the growth cycle into seconds. */
const FRAMES_PER_SECOND = 60;

/**
 * Alpha steps the link fade-in is quantised into. Enough that a link visibly
 * eases in rather than popping, few enough that the cost stays a fixed handful
 * of `strokeStyle` assignments per frame.
 */
const LINK_FADE_TIERS = 6;

const EMPTY_POSITIONS = new Float32Array(0);

export interface RovoSketchHost {
	getParams(): RovoP5Params;
	getCloud(): RovoLogoCloud | null;
	isReducedMotion(): boolean;
	getSize(): { readonly width: number; readonly height: number };
	/** Extra yaw/pitch contributed by pointer orbiting, in radians. */
	getOrbit(): { readonly yaw: number; readonly pitch: number };
	/** Canvas clear colour, so the art follows the OS colour scheme. */
	getBackdrop(): RovoP5Backdrop;
	/** Live graph layout, or null before the first build. */
	getGraph(): TeamworkGraph | null;
	/** Per-particle graph placement, aligned to the current cloud. */
	getAssignment(): GraphAssignment | null;
	/**
	 * The choreographed channels for this frame, or null when the transport is
	 * stopped and the panel is driving everything by hand.
	 */
	getDirection(): RovoP5Direction | null;
	/**
	 * p5 2.x always runs setup asynchronously (`#_start` awaits `#_setup`), so
	 * the constructor returns before the canvas exists. This fires once the
	 * canvas is live and safe to resize.
	 */
	onReady(): void;
}

export interface RovoSketchController {
	readonly sketch: (instance: p5) => void;
	resetTime(): void;
}

export function createRovoSketch(host: RovoSketchHost): RovoSketchController {
	let time = 0;
	let spin = 0;
	const world: Vec3 = { x: 0, y: 0, z: 0 };
	const screen = { x: 0, y: 0 };
	// Built once per cloud, not per frame: the diagonal order is static.
	let facetOf = new Uint8Array(0);

	const sketch = (instance: p5) => {
		instance.setup = () => {
			const { width, height } = host.getSize();
			instance.createCanvas(Math.max(1, width), Math.max(1, height));
			instance.pixelDensity(Math.min(2, instance.displayDensity()));
			instance.noStroke();
			instance.clear();
			if (host.isReducedMotion()) instance.noLoop();
			host.onReady();
		};

		instance.draw = () => {
			const params = host.getParams();
			const cloud = host.getCloud();
			const reduced = host.isReducedMotion();
			const backdrop = host.getBackdrop();
			const context = instance.drawingContext as CanvasRenderingContext2D;

			if (!reduced) {
				time += params.speed;
				spin += params.spin;
			}

			if (params.trails && !reduced) {
				// `destination-out` scales the canvas *alpha* rather than blending
				// its colour toward the backdrop. Blending cannot converge: canvas
				// compositing is 8-bit, so once a lit pixel is within `0.5/fade` of
				// the backdrop the rounding makes it a fixed point and the trail
				// burns in permanently — a grey disc wherever particles have been.
				// Scaling alpha bottoms out at 1/255 instead, which is invisible,
				// and the shell paints the real backdrop behind the canvas.
				context.globalCompositeOperation = "destination-out";
				context.fillStyle = `rgba(0, 0, 0, ${params.trailFade})`;
				context.fillRect(0, 0, instance.width, instance.height);
				context.globalCompositeOperation = "source-over";
			} else {
				instance.clear();
			}

			if (!cloud || cloud.count === 0) return;

			if (facetOf.length !== cloud.count) {
				facetOf = new Uint8Array(cloud.count);
				for (const bucket of cloud.buckets) {
					facetOf.fill(bucket.facet, bucket.start, bucket.end);
				}
			}

			// Optional call, not because the contract is optional, but because Fast
			// Refresh can leave a live p5 instance holding a host from before this
			// module reloaded. Throwing here becomes an unhandled rejection every
			// frame, which takes the dev server down with it.
			const direction = host.getDirection?.() ?? null;
			const form = direction ? direction.form : params.form;
			const cubeSize = direction ? direction.extrude : params.extrude;
			const facetLift = direction ? direction.lift : null;
			const facetEmphasis = direction ? direction.emphasis : null;
			const cycleOpacity = direction ? direction.opacity : 1;

			const orbit = host.getOrbit();
			const yaw = HOME_YAW + (direction ? direction.spin : spin) + orbit.yaw;
			const pitch = HOME_PITCH + (direction ? direction.tilt : params.tilt) + orbit.pitch;
			const cosYaw = Math.cos(yaw);
			const sinYaw = Math.sin(yaw);
			const cosPitch = Math.cos(pitch);
			const sinPitch = Math.sin(pitch);

			const scale = (Math.min(instance.width, instance.height) / DESIGN_SIZE) * params.zoom;
			const centerX = instance.width / 2;
			const centerY = instance.height / 2;
			const alpha = Math.min(1, (params.alpha / 255) * backdrop.alphaScale) * cycleOpacity;
			const wobble = reduced ? 0 : (1 - form) * IDLE_WOBBLE;
			// A frozen clock would turn the orbits into a fixed scatter, so the
			// paused frame keeps particles on their home positions. Twinkle stays
			// on: with `t` frozen it becomes a static size variance, which reads as
			// star-field texture rather than motion.
			const shimmerAmp = reduced ? 0 : params.shimmer;
			const t = time;

			// The layout is nudged one step a frame rather than run to convergence:
			// a graph still easing toward its answer is what makes the form feel
			// live. It only runs once the morph is actually showing the graph.
			const graph = host.getGraph();
			const assignment = host.getAssignment();
			if (graph && form > 0.01 && !reduced) {
				relaxTeamworkGraph(graph, {
					repulsion: GRAPH_REPULSION / Math.max(1, graph.nodeCount),
					linkDistance: params.graphLink,
				});
			}
			const nodes = graph?.positions ?? EMPTY_POSITIONS;
			const graphSpan = params.graphSpread;
			const travelRate = reduced ? 0 : params.graphTravel * GRAPH_TRAVEL_SCALE;

			// Growth cycle. A zero-length cycle means "already complete", which is
			// also what a paused sketch shows — a half-built graph would read as a
			// rendering bug rather than a deliberate still.
			const cycle = params.graphGrowth;
			const phase = direction
				? direction.growth
				: reduced || cycle <= 0
					? 1
					: (t / (cycle * FRAMES_PER_SECOND * params.speed || 1)) % 1;
			const born = (birth: number) => {
				if (phase >= 1) return 1;
				const progress = (phase - birth) / BIRTH_FADE;
				return progress <= 0 ? 0 : progress >= 1 ? 1 : progress;
			};
			const shimmerSpeed = params.shimmerSpeed;
			const twinkleAmp = params.twinkle;
			const starSize = MID_SIZE + params.starlight * 1.6;
			const focal =
				FOCAL_LENGTH / Math.max(0.001, direction ? direction.perspective : params.perspective);
			// The un-projection works in normalised mark units, the renderer in
			// design units; the camera distance has to be expressed in both.
			const normalisedFocal = focal / LOGO_SPAN;

			const project = (x: number, y: number, z: number, out: { x: number; y: number }) => {
				const x1 = x * cosYaw + z * sinYaw;
				const z1 = -x * sinYaw + z * cosYaw;
				const viewY = y * cosPitch - z1 * sinPitch;
				const viewZ = y * sinPitch + z1 * cosPitch;
				const projection = focal / Math.max(1, focal - viewZ);
				out.x = centerX + x1 * projection * scale;
				out.y = centerY + viewY * projection * scale;
			};

			// Link lines go down first so the travelling packets read as riding on
			// top of them. A few hundred strokes is negligible next to the particle
			// loop, and they are what make the structure legible as a graph.
			//
			// Each link fades in over its own birth ramp rather than popping in at
			// full strength. Alpha is quantised into a handful of tiers so that
			// costs a fixed number of `strokeStyle` assignments per frame instead
			// of one per edge.
			const linkOpacity = params.graphLinkOpacity * (direction ? direction.linkOpacity : 1);
			if (graph && form > 0.02 && linkOpacity > 0) {
				const channels = params.brandColor ? LINK_TINT : WHITE;
				const baseAlpha = alpha * linkOpacity * form;
				context.lineWidth = 1;

				for (let tier = 1; tier <= LINK_FADE_TIERS; tier++) {
					const low = (tier - 1) / LINK_FADE_TIERS;
					const high = tier / LINK_FADE_TIERS;
					let opened = false;

					for (let edge = 0; edge < graph.edgeCount; edge++) {
						const life = born(graph.edgeBirth[edge]);
						if (life <= low || life > high) continue;

						if (!opened) {
							context.strokeStyle = `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${baseAlpha * high})`;
							context.beginPath();
							opened = true;
						}

						const a = graph.edges[edge * 2] * 3;
						const b = graph.edges[edge * 2 + 1] * 3;
						project(nodes[a] * graphSpan * form, nodes[a + 1] * graphSpan * form, nodes[a + 2] * graphSpan * form, screen);
						context.moveTo(screen.x, screen.y);
						project(nodes[b] * graphSpan * form, nodes[b + 1] * graphSpan * form, nodes[b + 2] * graphSpan * form, screen);
						context.lineTo(screen.x, screen.y);
					}

					if (opened) context.stroke();
				}
			}

			// One closure per frame, not per particle, so the tier loops below stay
			// free of any canvas state assignment.
			const plot = (index: number, facet: number, tierSize: number) => {
				// Where this particle sits in the graph: on a node, or partway along
				// a link it is travelling. Both ends of the morph are real 3D points,
				// so z interpolates alongside x and y.
				let graphX = 0;
				let graphY = 0;
				let graphZ = 0;
				let bornScale = 1;

				if (graph && assignment && index < assignment.count) {
					const edge = assignment.edgeIndex[index];
					const jitterBase = index * 3;

					if (edge >= 0 && edge < graph.edgeCount) {
						const a = graph.edges[edge * 2] * 3;
						const b = graph.edges[edge * 2 + 1] * 3;
						// Packets loop along the link rather than easing to a stop, so
						// the graph keeps reading as live traffic.
						const along = (assignment.travel[index] + t * travelRate) % 1;
						graphX = nodes[a] + (nodes[b] - nodes[a]) * along;
						graphY = nodes[a + 1] + (nodes[b + 1] - nodes[a + 1]) * along;
						graphZ = nodes[a + 2] + (nodes[b + 2] - nodes[a + 2]) * along;
						bornScale = born(graph.edgeBirth[edge]);
					} else {
						const node = assignment.nodeIndex[index] * 3;
						graphX = nodes[node];
						graphY = nodes[node + 1];
						graphZ = nodes[node + 2];
						bornScale = born(graph.nodeBirth[assignment.nodeIndex[index]]);
					}

					graphX = (graphX + assignment.jitter[jitterBase] * NODE_SCATTER) * graphSpan;
					graphY = (graphY + assignment.jitter[jitterBase + 1] * NODE_SCATTER) * graphSpan;
					graphZ = (graphZ + assignment.jitter[jitterBase + 2] * NODE_SCATTER) * graphSpan;
				}

				unprojectFacetPoint(
					cloud.positions[index * 2],
					cloud.positions[index * 2 + 1],
					facet,
					cubeSize,
					// Per facet while the director runs, so the mark's faces can lift
					// one after another; nothing lifts under manual control.
					facetLift ? (facetLift[facet] ?? 0) : 0,
					params.thickness,
					normalisedFocal,
					index,
					world,
				);
				const logoX = world.x * LOGO_SPAN;
				const logoY = world.y * LOGO_SPAN;
				const logoZ = world.z * LOGO_SPAN;

				// One integer hash per particle, sliced into independent fields:
				// morph delay, orbit phase, orbit rate, orbit radius, twinkle phase.
				const hash = Math.imul(index + 1, 2246822519) >>> 0;

				// A straight lerp moves every particle in lockstep along a chord,
				// which reads as a rigid contraction. Two things make it organic:
				// each particle starts at its own moment, and it travels a curve.
				const travel = 1 - form;
				const delay = ((hash >>> 3) & 0xff) / 255;
				const scheduled = (travel - delay * MORPH_STAGGER) / (1 - MORPH_STAGGER);
				const staged = scheduled < 0 ? 0 : scheduled > 1 ? 1 : scheduled;
				const morph = staged * staged * (3 - 2 * staged);
				const blend = 1 - morph;

				let worldX = logoX + (graphX - logoX) * blend;
				let worldY = logoY + (graphY - logoY) * blend;
				let worldZ = logoZ + (graphZ - logoZ) * blend;

				// Bow the path out along the globe's tangent so particles spiral in
				// rather than falling straight through the middle. The bow peaks at
				// the halfway point and is zero at both ends, so neither form moves.
				if (morph > 0 && morph < 1) {
					const tangentX = -graphZ;
					const tangentZ = graphX;
					const length = Math.hypot(tangentX, tangentZ);
					if (length > 1e-3) {
						const bow =
							Math.sin(Math.PI * morph) *
							MORPH_SWIRL *
							(0.45 + ((hash >>> 11) & 0x3f) / 63);
						worldX += (tangentX / length) * bow;
						worldZ += (tangentZ / length) * bow;
						worldY += Math.sin(Math.PI * morph) * bow * 0.35;
					}
				}

				if (shimmerAmp > 0) {
					// Each particle circles its own home position. The orbits are what
					// the trails smear into arcs and rings — the filament structure of
					// the reference sketches — while the radius stays small enough
					// that the mark still reads.
					const phase = (hash & 0x3ff) * (TAU / 1024);
					const rate = shimmerSpeed * (0.55 + ((hash >>> 10) & 0x7f) / 127);
					const orbitRadius = shimmerAmp * (0.3 + ((hash >>> 17) & 0x7f) / 127);
					const angle = phase + t * rate;
					worldX += orbitRadius * Math.cos(angle);
					worldY += orbitRadius * Math.sin(angle);
					worldZ += orbitRadius * Math.cos(angle * 0.7 + phase);
				}

				if (wobble > 0) {
					// Driven by position, not particle index: neighbouring points
					// share an offset, so the mark breathes as a whole instead of
					// dissolving into per-particle noise.
					worldX += wobble * Math.sin(logoY * IDLE_WAVELENGTH + t * 1.3);
					worldY += wobble * Math.cos(logoX * IDLE_WAVELENGTH + t * 1.1);
				}

				const x1 = worldX * cosYaw + worldZ * sinYaw;
				const z1 = -worldX * sinYaw + worldZ * cosYaw;
				const viewY = worldY * cosPitch - z1 * sinPitch;
				const viewZ = worldY * sinPitch + z1 * cosPitch;

				const projection = focal / Math.max(1, focal - viewZ);
				// Twinkle rides on the size, which is a `fillRect` argument, so the
				// brightness variation costs no canvas state changes.
				const twinklePhase = ((hash >>> 24) & 0xff) * (TAU / 256);
				const twinkleMul = 1 + twinkleAmp * Math.sin(t * 2.1 + twinklePhase);
				// Unborn parts of the graph scale to nothing rather than being
				// branched around, keeping the accretion free of canvas state churn.
				const size = Math.min(
					MAX_POINT_SIZE,
					params.pointSize *
						tierSize *
						twinkleMul *
						(1 + DEPTH_GAIN * (projection - 1)) *
						(1 - form + form * bornScale),
				);
				if (size <= 0.02) return;
				const half = size / 2;

				context.fillRect(
					centerX + x1 * projection * scale - half,
					centerY + viewY * projection * scale - half,
					size,
					size,
				);
			};

			for (const bucket of cloud.buckets) {
				const color = ROVO_FACET_COLORS[bucket.facet] ?? ROVO_FACET_COLORS[0];
				const channels = params.brandColor ? color : WHITE;
				const rgb = `${channels[0]}, ${channels[1]}, ${channels[2]}`;

				const facetAlpha = alpha * (facetEmphasis ? facetEmphasis[bucket.facet] ?? 1 : 1);
				const runLength = bucket.end - bucket.start;
				const dustEnd = bucket.start + ((runLength * DUST_SHARE) | 0);
				const brightEnd = bucket.start + ((runLength * (DUST_SHARE + MID_SHARE)) | 0);

				// Two `fillStyle` assignments per facet — the bright and star tiers
				// share a colour and differ only in size.
				context.fillStyle = `rgba(${rgb}, ${facetAlpha * DUST_ALPHA})`;
				for (let index = bucket.start; index < dustEnd; index++) {
					plot(index, bucket.facet, DUST_SIZE);
				}

				context.fillStyle = `rgba(${rgb}, ${facetAlpha})`;
				for (let index = dustEnd; index < brightEnd; index++) {
					plot(index, bucket.facet, MID_SIZE);
				}
				for (let index = brightEnd; index < bucket.end; index++) {
					plot(index, bucket.facet, starSize);
				}
			}
		};
	};

	return {
		sketch,
		resetTime: () => {
			time = 0;
			spin = 0;
		},
	};
}
