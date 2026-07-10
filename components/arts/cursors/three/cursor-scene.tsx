"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import type { ClickyState } from "@/components/projects/rovo-core/hooks/use-clicky";
import type { CursorFanOutBurst } from "../cursor-fan-math";
import { CursorSceneFan } from "./cursor-scene-fan";
import { CursorSceneFollower } from "./cursor-scene-follower";
import { CursorSceneOrbit } from "./cursor-scene-orbit";

const CAMERA_FOV = 40;

interface CursorSceneProps {
	/** Drives the pointer-following cursor's micro-animations. */
	followerState: ClickyState;
	/** The current fan-out burst, if any (spawns 4 companion cursors). */
	burst: CursorFanOutBurst | null;
	/** Whether the fanned-out team is mid send-off. */
	launching: boolean;
	/** Whether the team is now "working" (mounts the orbit). */
	working: boolean;
	/** Pauses the orbit clock (hovering a satellite proxy). */
	orbitPaused: boolean;
	/** Measured voice-button center (viewport px), updated by the parent. */
	orbitCenterRef: React.RefObject<{ x: number; y: number } | null>;
}

/**
 * The single full-viewport R3F canvas rendering every 3D cursor in the art:
 * the iridescent pointer follower, the agent-colored fan-out burst, and the
 * orbiting "working" satellites. `1 world unit = 1 CSS px` — the perspective
 * camera's distance is derived from the viewport height so screen-space math
 * (pointer position, measured DOM rects) maps directly onto mesh positions.
 */
export function CursorScene({
	followerState,
	burst,
	launching,
	working,
	orbitPaused,
	orbitCenterRef,
}: Readonly<CursorSceneProps>) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(true);
	const [tabVisible, setTabVisible] = useState(
		typeof document === "undefined" ? true : document.visibilityState === "visible",
	);

	useEffect(() => {
		const el = wrapperRef.current;
		if (!el) {
			return;
		}
		const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
			rootMargin: "200px",
		});
		observer.observe(el);
		const handleVisibility = () => setTabVisible(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			observer.disconnect();
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	// "Anything animating": no point running an `always` frameloop when the
	// follower is off-screen and no team is fanned out or working. Reduced
	// motion is intentionally NOT part of this gate — every child still needs
	// a per-frame tick to snap positions (pointer tracking, measured button
	// center) even when it skips easing/springs/roll; each child honors
	// `useReducedMotion()` itself for the actual visual motion.
	const hasAnimatingContent = followerState !== "off" || burst !== null || launching || working;
	const shouldAnimate = inView && tabVisible && hasAnimatingContent;

	return (
		<div ref={wrapperRef} className="pointer-events-none fixed inset-0 z-[9997]" aria-hidden="true">
			<Canvas
				frameloop={shouldAnimate ? "always" : "demand"}
				dpr={[1, 2]}
				gl={{ alpha: true, antialias: true, premultipliedAlpha: true }}
			>
				<CameraRig />
				<SceneEnvironment />
				<ambientLight intensity={0.6} />
				<directionalLight position={[2, 3, 4]} intensity={1.3} />
				{/* Rim light, from behind/below, to keep the metal reads from going flat. */}
				<directionalLight position={[-3, -2, -2]} intensity={0.4} color="#8ec8ff" />
				{/* Warm fill from the left so the pearl follower reads pastel two-tone. */}
				<directionalLight position={[-4, 2, 3]} intensity={0.5} color="#ffd2e8" />
				<CursorSceneFollower state={followerState} />
				<CursorSceneFan burst={burst} launching={launching} />
				{/* Always mounted (like the follower/fan) — self-gates visibility via
				    `working` so toggling it never touches the shared WebGL context. */}
				<CursorSceneOrbit working={working} paused={orbitPaused} centerRef={orbitCenterRef} />
			</Canvas>
		</div>
	);
}

/**
 * Positions the perspective camera so `1 world unit = 1 CSS px`:
 * `camera.position.z = (viewportHeight / 2) / tan(fov/2 in radians)`.
 * Re-derives on every resize so screen-space math stays exact.
 */
function CameraRig() {
	const { camera, size } = useThree();

	useEffect(() => {
		const perspective = camera as THREE.PerspectiveCamera;
		perspective.fov = CAMERA_FOV;
		perspective.near = 1;
		perspective.far = 5000;
		perspective.position.z = size.height / 2 / Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
		perspective.updateProjectionMatrix();
	}, [camera, size.height, size.width]);

	return null;
}

/**
 * Builds `scene.environment` from `RoomEnvironment` via `PMREMGenerator` (no
 * drei `Environment` — it fetches remote HDRs) so the metal/glass cursor
 * materials get believable reflections without a network request.
 */
function SceneEnvironment() {
	const { gl, scene } = useThree();

	useEffect(() => {
		const pmremGenerator = new THREE.PMREMGenerator(gl);
		pmremGenerator.compileEquirectangularShader();
		const room = new RoomEnvironment();
		const envMap = pmremGenerator.fromScene(room, 0.04).texture;
		scene.environment = envMap;

		return () => {
			scene.environment = null;
			envMap.dispose();
			pmremGenerator.dispose();
		};
	}, [gl, scene]);

	return null;
}
