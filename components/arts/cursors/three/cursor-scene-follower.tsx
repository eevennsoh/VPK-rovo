"use client";

import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { ClickyState } from "@/components/projects/rovo-core/hooks/use-clicky";
import { dampTo } from "../cursor-orbit-math";
import { getCursorArrowGeometry, makeIridescentMaterial } from "./cursor-arrow-geometry";

// Mirrors the tracking feel of `ClickyOverlay`'s TRACKING_OFFSET_X/Y — the
// glyph trails a little down-right of the real pointer.
const TRACKING_OFFSET_X = 35;
const TRACKING_OFFSET_Y = 25;
const FOLLOWER_SIZE = 18; // 1 world unit = 1 CSS px (see cursor-scene.tsx camera).
const POSITION_DAMP_LAMBDA = 18;
const BANK_DAMP_LAMBDA = 10;
const MAX_BANK_ROTATE_DEG = 16;
const MAX_BANK_TILT_DEG = 12;
const BANK_VELOCITY_DEADZONE = 1;

interface CursorSceneFollowerProps {
	/** Drives micro-animations; hidden entirely when "off". */
	state: ClickyState;
}

/**
 * The iridescent, pointer-following 3D cursor. Damps toward the (offset)
 * pointer position every frame and banks/tilts toward the motion tangent —
 * the "whitespace cursor-nav" feel. Adds a state-driven micro-animation on
 * top: gentle scale pulse (listening), slow spin (processing), subtle wobble
 * (speaking). Reduced motion snaps straight to the pointer with no banking.
 */
export function CursorSceneFollower({ state }: Readonly<CursorSceneFollowerProps>) {
	const reducedMotion = useReducedMotion();
	const meshRef = useRef<THREE.Mesh>(null);
	const geometry = useMemo(() => getCursorArrowGeometry(), []);
	const material = useMemo(() => makeIridescentMaterial(), []);

	const targetRef = useRef({ x: 0, y: 0 });
	const currentRef = useRef({ x: 0, y: 0 });
	const velocityRef = useRef({ x: 0, y: 0 });
	const bankRef = useRef({ tiltX: 0, tiltY: 0, rotateZ: 0 });
	const clockRef = useRef(0);
	const seededRef = useRef(false);

	useEffect(() => {
		const toWorldTarget = (clientX: number, clientY: number) => ({
			x: clientX + TRACKING_OFFSET_X - window.innerWidth / 2,
			y: window.innerHeight / 2 - (clientY + TRACKING_OFFSET_Y),
		});

		if (!seededRef.current) {
			const seeded = toWorldTarget(window.innerWidth / 2, window.innerHeight * 0.55);
			targetRef.current = seeded;
			currentRef.current = seeded;
			seededRef.current = true;
		}

		const handlePointerMove = (event: PointerEvent) => {
			targetRef.current = toWorldTarget(event.clientX, event.clientY);
		};
		window.addEventListener("pointermove", handlePointerMove, { passive: true });
		return () => window.removeEventListener("pointermove", handlePointerMove);
	}, []);

	useFrame((_, delta) => {
		const mesh = meshRef.current;
		if (!mesh) {
			return;
		}

		mesh.visible = state !== "off";
		if (!mesh.visible) {
			return;
		}

		clockRef.current += delta;
		const target = targetRef.current;

		if (reducedMotion) {
			currentRef.current.x = target.x;
			currentRef.current.y = target.y;
			mesh.position.set(target.x, target.y, 0);
			mesh.rotation.set(0, 0, 0);
			mesh.scale.setScalar(FOLLOWER_SIZE);
			return;
		}

		const prevX = currentRef.current.x;
		const prevY = currentRef.current.y;
		currentRef.current.x = dampTo(prevX, target.x, POSITION_DAMP_LAMBDA, delta);
		currentRef.current.y = dampTo(prevY, target.y, POSITION_DAMP_LAMBDA, delta);
		if (delta > 0) {
			velocityRef.current.x = (currentRef.current.x - prevX) / delta;
			velocityRef.current.y = (currentRef.current.y - prevY) / delta;
		}
		mesh.position.set(currentRef.current.x, currentRef.current.y, 0);

		// Bank toward the motion tangent + a small forward tilt proportional to speed.
		const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
		const active = speed > BANK_VELOCITY_DEADZONE;
		const targetRotateZ = active
			? THREE.MathUtils.clamp(-velocityRef.current.x * 0.02, -MAX_BANK_ROTATE_DEG, MAX_BANK_ROTATE_DEG)
			: 0;
		const targetTiltX = active
			? THREE.MathUtils.clamp(velocityRef.current.y * 0.015, -MAX_BANK_TILT_DEG, MAX_BANK_TILT_DEG)
			: 0;
		const targetTiltY = active
			? THREE.MathUtils.clamp(-velocityRef.current.x * 0.015, -MAX_BANK_TILT_DEG, MAX_BANK_TILT_DEG)
			: 0;

		bankRef.current.rotateZ = dampTo(bankRef.current.rotateZ, targetRotateZ, BANK_DAMP_LAMBDA, delta);
		bankRef.current.tiltX = dampTo(bankRef.current.tiltX, targetTiltX, BANK_DAMP_LAMBDA, delta);
		bankRef.current.tiltY = dampTo(bankRef.current.tiltY, targetTiltY, BANK_DAMP_LAMBDA, delta);

		let rotateZDeg = bankRef.current.rotateZ;
		let scale = FOLLOWER_SIZE;
		if (state === "listening") {
			scale = FOLLOWER_SIZE * (1 + Math.sin(clockRef.current * 4) * 0.06);
		} else if (state === "processing") {
			rotateZDeg += THREE.MathUtils.radToDeg(clockRef.current * 1.4);
		} else if (state === "speaking") {
			rotateZDeg += Math.sin(clockRef.current * 6) * 4;
		}

		mesh.rotation.z = THREE.MathUtils.degToRad(rotateZDeg);
		mesh.rotation.x = THREE.MathUtils.degToRad(bankRef.current.tiltX);
		mesh.rotation.y = THREE.MathUtils.degToRad(bankRef.current.tiltY);
		mesh.scale.setScalar(scale);
	});

	return <mesh ref={meshRef} geometry={geometry} material={material} />;
}
