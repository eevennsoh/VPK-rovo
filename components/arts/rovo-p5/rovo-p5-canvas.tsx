"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "motion/react";
import type p5 from "p5";

import type { RovoP5Backdrop } from "@/components/arts/rovo-p5/data/rovo-p5-backdrop";
import type { RovoP5Params } from "@/components/arts/rovo-p5/data/rovo-p5-params";
import {
	createRovoLogoCloud,
	ROVO_FACET_COUNT,
	type RovoLogoCloud,
} from "@/components/arts/rovo-p5/lib/rovo-logo-point-cloud";
import {
	createRovoSketch,
	type RovoSketchController,
} from "@/components/arts/rovo-p5/lib/rovo-p5-sketch";
import {
	directRovoP5,
	ROVO_P5_CYCLE_SECONDS,
	type RovoP5Direction,
} from "@/components/arts/rovo-p5/lib/rovo-p5-timeline";
import {
	createTeamworkGraph,
	type TeamworkGraph,
} from "@/components/arts/rovo-p5/lib/teamwork-graph";
import {
	assignParticlesToGraph,
	expandFacets,
	type GraphAssignment,
} from "@/components/arts/rovo-p5/lib/teamwork-graph-assignment";
import { cn } from "@/lib/utils";

/**
 * Ceiling on a single frame's contribution to the cycle clock. A backgrounded
 * tab can hand back a delta of many seconds; without this the choreography
 * would leap several stages the moment it is looked at again.
 */
const MAX_FRAME_SECONDS = 1 / 20;

/** Fixed so the layout is the same graph on every visit. */
const TEAMWORK_GRAPH_SEED = 0x70b17;

/** Radians of camera rotation per pixel dragged. */
const ORBIT_SENSITIVITY = 0.006;

/** Keep the camera from tumbling past straight up or straight down. */
const MAX_ORBIT_PITCH = Math.PI / 2;

interface RovoP5CanvasProps {
	readonly params: RovoP5Params;
	readonly backdrop: RovoP5Backdrop;
	/** Bumped by the panel's reset button to rewind the clock and camera. */
	readonly resetToken: number;
	/** Transport state; the cycle is driven by the director when playing. */
	readonly playing: boolean;
	/**
	 * Seeks the cycle when the visitor scrubs; null leaves the clock alone.
	 *
	 * A fresh object per request rather than a bare number, so repeating the
	 * same position still seeks — React bails out of an identical state value,
	 * which silently dropped a second scrub back to the same spot.
	 */
	readonly seekRequest: { readonly seconds: number } | null;
	/** Reports the cycle position back so the transport can render it. */
	readonly onProgress: (seconds: number, direction: RovoP5Direction) => void;
	readonly className?: string;
}

export default function RovoP5Canvas({
	params,
	backdrop,
	resetToken,
	playing,
	seekRequest,
	onProgress,
	className,
}: RovoP5CanvasProps) {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const instanceRef = useRef<p5 | null>(null);
	const controllerRef = useRef<RovoSketchController | null>(null);
	const paramsRef = useRef<RovoP5Params>(params);
	const backdropRef = useRef<RovoP5Backdrop>(backdrop);
	const cloudRef = useRef<RovoLogoCloud | null>(null);
	const graphRef = useRef<TeamworkGraph | null>(null);
	const assignmentRef = useRef<GraphAssignment | null>(null);
	const reducedMotionRef = useRef(false);
	const orbitRef = useRef({ yaw: 0, pitch: 0 });
	const elapsedRef = useRef(0);
	const lastFrameRef = useRef<number | null>(null);
	const playingRef = useRef(playing);
	const onProgressRef = useRef(onProgress);
	const [ready, setReady] = useState(false);

	const reducedMotion = Boolean(useReducedMotion());

	// The sketch reads live values through refs, so dragging a slider never
	// tears down and re-instantiates p5.
	useEffect(() => {
		paramsRef.current = params;
	}, [params]);

	// A paused sketch would keep the previous scheme's background, so a theme
	// flip has to repaint too.
	useEffect(() => {
		backdropRef.current = backdrop;
		if (reducedMotionRef.current) instanceRef.current?.redraw();
	}, [backdrop]);

	// Setup calls `noLoop()` when reduced motion is on, and nothing else ever
	// restarts it. Toggling the OS preference afterwards has to drive the loop
	// directly, or the art stays frozen after the preference is turned off and
	// keeps burning frames on a static frame after it is turned on.
	useEffect(() => {
		reducedMotionRef.current = reducedMotion;
		const instance = instanceRef.current;
		if (!instance) return;
		// The clock advances by measured deltas, so it must forget the timestamp
		// it stopped at or the first frame back jumps.
		lastFrameRef.current = null;
		if (reducedMotion) {
			instance.noLoop();
			instance.redraw();
		} else {
			instance.loop();
		}
	}, [reducedMotion]);

	useEffect(() => {
		onProgressRef.current = onProgress;
	}, [onProgress]);

	// Pausing must not make the next frame jump: the clock is advanced by
	// measured deltas, so it has to forget the timestamp it was paused at.
	useEffect(() => {
		playingRef.current = playing;
		lastFrameRef.current = null;
	}, [playing]);

	// Deliberately keyed on the request alone. Depending on `playing` too meant
	// every later play/pause toggle re-ran this and rewound the clock to a stale
	// seek — after Restart, pausing later jumped back to zero.
	useEffect(() => {
		if (seekRequest === null) return;
		elapsedRef.current = seekRequest.seconds;
		lastFrameRef.current = null;
		if (!playingRef.current) instanceRef.current?.redraw();
	}, [seekRequest]);

	useEffect(() => {
		cloudRef.current = createRovoLogoCloud(params.particles);
	}, [params.particles]);

	// The graph is rebuilt only when its topology changes, then relaxed in place
	// every frame — a rebuild on each render would restart the layout and lose
	// the settling motion that makes it feel alive.
	useEffect(() => {
		graphRef.current = createTeamworkGraph({
			nodeCount: params.graphNodes,
			communityCount: ROVO_FACET_COUNT,
			seed: TEAMWORK_GRAPH_SEED,
		});
		assignmentRef.current = null;
	}, [params.graphNodes]);

	// Particles are re-attached whenever either side changes, so the assignment
	// can never index a node the current graph does not have.
	useEffect(() => {
		const cloud = cloudRef.current;
		const graph = graphRef.current;
		if (!cloud || !graph) return;

		assignmentRef.current = assignParticlesToGraph({
			count: cloud.count,
			facets: expandFacets(cloud.count, cloud.buckets),
			communityEdges: graph.communityEdges,
			communityNodes: graph.communityNodes,
			edges: graph.edges,
		});
		if (reducedMotionRef.current) instanceRef.current?.redraw();
	}, [params.particles, params.graphNodes]);

	const handleReady = useCallback(() => {
		setReady(true);
	}, []);

	useEffect(() => {
		const container = hostRef.current;
		if (!container) return;

		let disposed = false;

		const controller = createRovoSketch({
			getParams: () => paramsRef.current,
			getCloud: () => cloudRef.current,
			isReducedMotion: () => reducedMotionRef.current,
			getSize: () => ({ width: container.clientWidth, height: container.clientHeight }),
			getOrbit: () => orbitRef.current,
			getBackdrop: () => backdropRef.current,
			getGraph: () => graphRef.current,
			getAssignment: () => assignmentRef.current,
			getDirection: () => {
				if (!paramsRef.current.timeline) return null;

				// Wall-clock deltas rather than a frame counter, so the choreography
				// keeps its timing if the tab throttles or a frame is dropped.
				const now = performance.now();
				const previous = lastFrameRef.current;
				lastFrameRef.current = now;

				if (playingRef.current && !reducedMotionRef.current && previous !== null) {
					const delta = Math.min(MAX_FRAME_SECONDS, (now - previous) / 1000);
					elapsedRef.current = (elapsedRef.current + delta) % ROVO_P5_CYCLE_SECONDS;
				}

				const direction = directRovoP5(elapsedRef.current);
				onProgressRef.current(elapsedRef.current, direction);
				return direction;
			},
			onReady: handleReady,
		});
		controllerRef.current = controller;

		// A failed chunk load would otherwise surface as an unhandled rejection
		// and leave the surface blank with nothing in the console to explain it.
		void import("p5")
			.then(({ default: P5 }) => {
				if (disposed) return;
				instanceRef.current = new P5(controller.sketch, container);
			})
			.catch((error: unknown) => {
				if (disposed) return;
				console.error("Rovo p5: the p5 runtime failed to load", error);
			});

		return () => {
			disposed = true;
			setReady(false);
			instanceRef.current?.remove();
			instanceRef.current = null;
			controllerRef.current = null;
		};
	}, [handleReady]);

	useEffect(() => {
		const container = hostRef.current;
		if (!container || !ready) return;

		const observer = new ResizeObserver(() => {
			const instance = instanceRef.current;
			if (!instance) return;
			instance.resizeCanvas(
				Math.max(1, container.clientWidth),
				Math.max(1, container.clientHeight),
			);
			if (reducedMotionRef.current) instance.redraw();
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [ready]);

	// Drag to orbit. Pointer capture keeps the gesture alive when the cursor
	// leaves the canvas, and the paused sketch is redrawn on every move.
	useEffect(() => {
		const container = hostRef.current;
		if (!container || !ready) return;

		let pointerId: number | null = null;
		let lastX = 0;
		let lastY = 0;

		const onPointerDown = (event: PointerEvent) => {
			if (pointerId !== null || event.button !== 0) return;
			pointerId = event.pointerId;
			lastX = event.clientX;
			lastY = event.clientY;
			container.setPointerCapture(event.pointerId);
		};

		const onPointerMove = (event: PointerEvent) => {
			if (event.pointerId !== pointerId) return;
			const orbit = orbitRef.current;
			orbit.yaw += (event.clientX - lastX) * ORBIT_SENSITIVITY;
			orbit.pitch = Math.min(
				MAX_ORBIT_PITCH,
				Math.max(-MAX_ORBIT_PITCH, orbit.pitch + (event.clientY - lastY) * ORBIT_SENSITIVITY),
			);
			lastX = event.clientX;
			lastY = event.clientY;
			if (reducedMotionRef.current) instanceRef.current?.redraw();
		};

		const endGesture = (event: PointerEvent) => {
			if (event.pointerId !== pointerId) return;
			if (container.hasPointerCapture(event.pointerId)) {
				container.releasePointerCapture(event.pointerId);
			}
			pointerId = null;
		};

		container.addEventListener("pointerdown", onPointerDown);
		container.addEventListener("pointermove", onPointerMove);
		container.addEventListener("pointerup", endGesture);
		container.addEventListener("pointercancel", endGesture);

		return () => {
			container.removeEventListener("pointerdown", onPointerDown);
			container.removeEventListener("pointermove", onPointerMove);
			container.removeEventListener("pointerup", endGesture);
			container.removeEventListener("pointercancel", endGesture);
		};
	}, [ready]);

	// With motion reduced the sketch is paused, so every parameter change has to
	// repaint the single static frame explicitly.
	useEffect(() => {
		if (!ready || !reducedMotion) return;
		instanceRef.current?.redraw();
	}, [ready, reducedMotion, params]);

	useEffect(() => {
		if (!ready) return;
		orbitRef.current = { yaw: 0, pitch: 0 };
		elapsedRef.current = 0;
		lastFrameRef.current = null;
		controllerRef.current?.resetTime();
		if (reducedMotionRef.current || !playingRef.current) instanceRef.current?.redraw();
	}, [ready, resetToken]);

	return (
		<div
			aria-label="Generative particle rendering of the Rovo logo. Drag to orbit the camera."
			className={cn(
				"size-full cursor-grab touch-none active:cursor-grabbing [&_canvas]:block [&_canvas]:size-full",
				className,
			)}
			ref={hostRef}
			role="img"
		/>
	);
}
