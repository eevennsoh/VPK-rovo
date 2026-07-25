"use client";

import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { CURSOR_AGENTS } from "../cursor-agents";
import {
	BUBBLE_HOLD,
	buildFanAgents,
	type CursorFanOutBurst,
	ENTRANCE_STAGGER,
	fanAgentLaunchDirection,
	LAUNCH_DISTANCE,
	LAUNCH_FLIGHT,
	LAUNCH_STAGGER,
	SNAP_BACK_DISTANCE,
	SNAP_BACK_DURATION,
} from "../cursor-fan-math";
import { getCursorArrowGeometry, makeAgentMaterial } from "./cursor-arrow-geometry";

const FAN_MESH_SIZE = 18;
const ENTRANCE_DURATION = 0.4;
const REDUCED_MOTION_LAUNCH_FADE = 0.25;
const IDLE_FLOAT_AMPLITUDE = 3;
const IDLE_FLOAT_OMEGA = (2 * Math.PI) / 2.4; // matches the original 2.4s float loop period
const IDLE_FLOAT_PHASE_STEP = 0.9;
const LAUNCH_ROLL_TURNS = 1.25;

interface CursorSceneFanProps {
	burst: CursorFanOutBurst | null;
	/** When true, each agent snaps back then streaks off along its facing. */
	launching: boolean;
}

function easeOutCubic(t: number): number {
	const clamped = THREE.MathUtils.clamp(t, 0, 1);
	return 1 - (1 - clamped) ** 3;
}

function easeInCubic(t: number): number {
	const clamped = THREE.MathUtils.clamp(t, 0, 1);
	return clamped ** 3;
}

/** Quadratic bezier through a lifted midpoint — replaces Motion's `arc()`. */
function quadBezier(t: number, p0: number, p1: number, p2: number): number {
	const u = 1 - t;
	return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

/**
 * The fanned-out team of companion cursors: 4 agent-colored 3D meshes that
 * curve out from the burst origin, idle-float in formation, and — once
 * `launching` — wind up and streak off-screen one by one. Ported from the
 * (now-deleted) `cursor-fan-out.tsx`'s Motion choreography onto R3F; timing
 * constants come from `cursor-fan-math.ts` so the DOM launch tooltips stay
 * in lockstep. `index.tsx`'s `LAUNCH_SEQUENCE_MS` timer — not this
 * component — remains the source of truth for when the team enters
 * "working"; this only renders the visual.
 */
export function CursorSceneFan({ burst, launching }: Readonly<CursorSceneFanProps>) {
	const reducedMotion = useReducedMotion();
	const geometry = useMemo(() => getCursorArrowGeometry(), []);
	const materials = useMemo(() => CURSOR_AGENTS.map((agent) => makeAgentMaterial(agent.color)), []);
	const agents = useMemo(() => buildFanAgents(CURSOR_AGENTS.length), []);
	const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

	const burstIdRef = useRef<number | null>(null);
	const entranceStartRef = useRef(0);
	const launchStartRef = useRef<number | null>(null);
	const wasLaunchingRef = useRef(false);
	const scratchAxis = useMemo(() => new THREE.Vector3(), []);
	const scratchRollQuat = useMemo(() => new THREE.Quaternion(), []);
	const scratchBaseQuat = useMemo(() => new THREE.Quaternion(), []);

	useFrame((frameState) => {
		const t = frameState.clock.elapsedTime;

		if (burst && burstIdRef.current !== burst.id) {
			burstIdRef.current = burst.id;
			entranceStartRef.current = t;
			launchStartRef.current = null;
			wasLaunchingRef.current = false;
		}
		if (!burst) {
			burstIdRef.current = null;
		}
		if (launching && !wasLaunchingRef.current) {
			wasLaunchingRef.current = true;
			launchStartRef.current = t;
		}
		if (!launching) {
			wasLaunchingRef.current = false;
		}

		if (!burst) {
			for (const mesh of meshRefs.current) {
				if (mesh) {
					mesh.visible = false;
				}
			}
			return;
		}

		const originX = burst.x - window.innerWidth / 2;
		const originY = window.innerHeight / 2 - burst.y;

		for (let index = 0; index < agents.length; index += 1) {
			const mesh = meshRefs.current[index];
			if (!mesh) {
				continue;
			}
			mesh.visible = true;

			const agent = agents[index];
			// Screen-space fan offsets flip on Y to land in world (y-up) space.
			const targetX = originX + agent.dx;
			const targetY = originY - agent.dy;
			const idleFloatY =
				launching || reducedMotion
					? 0
					: Math.sin(t * IDLE_FLOAT_OMEGA + index * IDLE_FLOAT_PHASE_STEP) * IDLE_FLOAT_AMPLITUDE;

			let posX = targetX;
			let posY = targetY + idleFloatY;
			let scale = FAN_MESH_SIZE;
			let opacity = 1;
			let rollAngle = 0;

			const launchDelay = BUBBLE_HOLD + index * LAUNCH_STAGGER;
			const launchElapsed = launching && launchStartRef.current !== null ? t - launchStartRef.current - launchDelay : -Infinity;

			if (launching && reducedMotion) {
				const fadeT = THREE.MathUtils.clamp(Math.max(launchElapsed, 0) / REDUCED_MOTION_LAUNCH_FADE, 0, 1);
				opacity = launchElapsed >= 0 ? 1 - fadeT : 1;
			} else if (launching && launchElapsed >= 0) {
				const { ux, uy } = fanAgentLaunchDirection(agent);
				if (launchElapsed < SNAP_BACK_DURATION) {
					const snapT = easeOutCubic(launchElapsed / SNAP_BACK_DURATION);
					posX = targetX - ux * SNAP_BACK_DISTANCE * snapT;
					posY = targetY + uy * SNAP_BACK_DISTANCE * snapT;
					scale = FAN_MESH_SIZE * THREE.MathUtils.lerp(1, 1.1, snapT);
				} else {
					const flightT = THREE.MathUtils.clamp((launchElapsed - SNAP_BACK_DURATION) / LAUNCH_FLIGHT, 0, 1);
					const eased = easeInCubic(flightT);
					const snapBackX = targetX - ux * SNAP_BACK_DISTANCE;
					const snapBackY = targetY + uy * SNAP_BACK_DISTANCE;
					const launchX = targetX + ux * LAUNCH_DISTANCE;
					const launchY = targetY - uy * LAUNCH_DISTANCE;
					posX = THREE.MathUtils.lerp(snapBackX, launchX, eased);
					posY = THREE.MathUtils.lerp(snapBackY, launchY, eased);
					scale = FAN_MESH_SIZE * THREE.MathUtils.lerp(1.1, 0.78, flightT);
					opacity = 1 - flightT;
					rollAngle = flightT * LAUNCH_ROLL_TURNS * 2 * Math.PI;
				}
			} else if (!launching) {
				const entranceElapsed = t - entranceStartRef.current - index * ENTRANCE_STAGGER;
				if (reducedMotion) {
					posX = targetX;
					posY = targetY;
					opacity = 1;
					scale = FAN_MESH_SIZE;
				} else if (entranceElapsed < 0) {
					posX = originX;
					posY = originY;
					opacity = 0;
					scale = FAN_MESH_SIZE * 0.4;
				} else {
					const entranceT = THREE.MathUtils.clamp(entranceElapsed / ENTRANCE_DURATION, 0, 1);
					const eased = easeOutCubic(entranceT);
					const arcHeight = Math.min(Math.hypot(targetX - originX, targetY - originY) * 0.3, 60);
					const midX = (originX + targetX) / 2;
					const midY = (originY + targetY) / 2 + arcHeight;
					posX = quadBezier(eased, originX, midX, targetX);
					posY = quadBezier(eased, originY, midY, targetY) + idleFloatY * entranceT;
					opacity = entranceT;
					scale = FAN_MESH_SIZE * THREE.MathUtils.lerp(0.4, 1, eased);
				}
			}

			mesh.position.set(posX, posY, 0);
			mesh.scale.setScalar(scale);
			const material = mesh.material as THREE.MeshPhysicalMaterial;
			material.opacity = opacity;

			// Base 2D lean (screen-space clockwise rotation flips sign in world Z)
			// plus, mid-flight, a barrel roll around the launch direction.
			mesh.rotation.set(0, 0, THREE.MathUtils.degToRad(-agent.rotation));
			if (rollAngle !== 0) {
				const { ux, uy } = fanAgentLaunchDirection(agent);
				scratchAxis.set(ux, -uy, 0).normalize();
				scratchRollQuat.setFromAxisAngle(scratchAxis, rollAngle);
				scratchBaseQuat.setFromEuler(mesh.rotation);
				mesh.quaternion.copy(scratchRollQuat).multiply(scratchBaseQuat);
			}
		}
	});

	return (
		<>
			{agents.map((agent, index) => (
				<mesh
					key={agent.index}
					ref={(node) => {
						meshRefs.current[index] = node;
					}}
					geometry={geometry}
					material={materials[index]}
					visible={false}
				/>
			))}
		</>
	);
}
