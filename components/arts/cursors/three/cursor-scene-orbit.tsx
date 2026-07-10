"use client";

import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { CURSOR_AGENTS } from "../cursor-agents";
import {
	anchorAngles,
	dampTo,
	depthOpacity,
	ORBIT_DEFAULT_A,
	ORBIT_DEFAULT_B,
	ORBIT_DEFAULT_SPEED,
	ORBIT_DEFAULT_TILT_FACTOR,
	ORBIT_DEFAULT_Z,
} from "../cursor-orbit-math";
import { getCursorArrowGeometry, makeAgentMaterial } from "./cursor-arrow-geometry";

const ORBIT_MESH_SIZE = 11;
const ENTRANCE_DURATION = 0.35;
const ENTRANCE_STAGGER = 0.08;
const CENTER_DAMP_LAMBDA = 10;
const AGENT_COUNT = CURSOR_AGENTS.length;

interface CursorSceneOrbitProps {
	/** Self-gates visibility/animation — hidden and reset when false. */
	working: boolean;
	/** Freezes the orbit's own accumulated clock (not the raw elapsed time). */
	paused: boolean;
	/** Measured voice-button center (viewport px), read every frame. */
	centerRef: React.RefObject<{ x: number; y: number } | null>;
}

/**
 * The 4 companion cursors "at work": mini meshes orbiting the measured
 * liquid-metal voice button in a shallow 3D ellipse (`cursor-orbit-math.ts`).
 * The back half dims via `depthOpacity` — perspective alone already shrinks
 * it, this just sells the "behind the button" read on a single canvas.
 * `paused` freezes an *accumulated* clock (own time accumulator) so resuming
 * continues smoothly instead of jumping. Reduced motion parks every agent at
 * its static `anchorAngles` position with no rotation. The ellipse formula is
 * inlined (rather than calling `orbitPoint`, which returns a fresh object)
 * to keep this hot loop allocation-free.
 */
export function CursorSceneOrbit({ working, paused, centerRef }: Readonly<CursorSceneOrbitProps>) {
	const reducedMotion = useReducedMotion();
	const geometry = useMemo(() => getCursorArrowGeometry(), []);
	const materials = useMemo(() => CURSOR_AGENTS.map((agent) => makeAgentMaterial(agent.color)), []);
	const angles = useMemo(() => anchorAngles(AGENT_COUNT), []);
	const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

	const accumulatedRef = useRef(0);
	const mountTimeRef = useRef<number | null>(null);
	const centerWorldRef = useRef({ x: 0, y: 0 });
	const scratchCenter = useRef(new THREE.Vector3()).current;

	useFrame((frameState, delta) => {
		if (!working) {
			for (const mesh of meshRefs.current) {
				if (mesh) {
					mesh.visible = false;
				}
			}
			mountTimeRef.current = null;
			accumulatedRef.current = 0;
			return;
		}

		const nowSec = frameState.clock.getElapsedTime();
		if (mountTimeRef.current === null) {
			mountTimeRef.current = nowSec;
			accumulatedRef.current = 0;
		}
		if (!paused && !reducedMotion) {
			accumulatedRef.current += delta;
		}
		const t = accumulatedRef.current;
		const sinceMount = nowSec - mountTimeRef.current;

		const center = centerRef.current;
		if (center) {
			const worldX = center.x - window.innerWidth / 2;
			const worldY = window.innerHeight / 2 - center.y;
			if (reducedMotion) {
				centerWorldRef.current.x = worldX;
				centerWorldRef.current.y = worldY;
			} else {
				centerWorldRef.current.x = dampTo(centerWorldRef.current.x, worldX, CENTER_DAMP_LAMBDA, delta);
				centerWorldRef.current.y = dampTo(centerWorldRef.current.y, worldY, CENTER_DAMP_LAMBDA, delta);
			}
		}
		scratchCenter.set(centerWorldRef.current.x, centerWorldRef.current.y, 0);

		for (let index = 0; index < AGENT_COUNT; index += 1) {
			const mesh = meshRefs.current[index];
			if (!mesh) {
				continue;
			}
			mesh.visible = true;
			const material = mesh.material as THREE.MeshPhysicalMaterial;

			if (reducedMotion) {
				const angle = angles[index];
				const dx = ORBIT_DEFAULT_A * Math.cos(angle);
				const dy = ORBIT_DEFAULT_B * Math.sin(angle) * ORBIT_DEFAULT_TILT_FACTOR;
				const dz = ORBIT_DEFAULT_Z * Math.sin(angle);
				mesh.position.set(scratchCenter.x + dx, scratchCenter.y + dy, dz);
				mesh.rotation.set(0, 0, 0);
				mesh.scale.setScalar(ORBIT_MESH_SIZE);
				material.opacity = depthOpacity(dz, ORBIT_DEFAULT_Z);
				continue;
			}

			const entranceDelay = index * ENTRANCE_STAGGER;
			const entranceT = THREE.MathUtils.clamp((sinceMount - entranceDelay) / ENTRANCE_DURATION, 0, 1);

			const theta = t * ORBIT_DEFAULT_SPEED + (index * 2 * Math.PI) / AGENT_COUNT;
			const dx = ORBIT_DEFAULT_A * Math.cos(theta);
			const dy = ORBIT_DEFAULT_B * Math.sin(theta) * ORBIT_DEFAULT_TILT_FACTOR;
			const dz = ORBIT_DEFAULT_Z * Math.sin(theta);

			mesh.position.set(scratchCenter.x + dx, scratchCenter.y + dy, dz);
			mesh.scale.setScalar(ORBIT_MESH_SIZE * entranceT);
			material.opacity = depthOpacity(dz, ORBIT_DEFAULT_Z) * entranceT;
		}
	});

	return (
		<>
			{CURSOR_AGENTS.map((agent, index) => (
				<mesh
					key={agent.name}
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
