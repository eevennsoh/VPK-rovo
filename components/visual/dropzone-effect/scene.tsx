"use client";

/**
 * Scene graph and render loop for the Dropzone effect.
 *
 * This component owns rendering outright (a `useFrame` at priority 1 stops
 * React Three Fiber's own render call) because the effect needs the scene in a
 * linear HDR target with MSAA before the composite pass: the sticker material
 * relies on alpha-to-coverage for its die-cut edges, and the depth-of-field
 * pass needs the resolved depth buffer.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { buildStickerAtlas } from "./atlas";
import { createOrbMaterial } from "./orb-material";
import { createDropzonePost } from "./post-pass";
import { createStarfield } from "./starfield";
import { createStickerField } from "./sticker-field";
import {
	CAMERA_FOV,
	DROPZONE_TUNING_DEFAULTS,
	FEED_DECAY,
	FEED_MAX_GLOW,
	ORB_HALO_REACH,
	resolveLayout,
	type DropzoneTuning,
} from "./tuning";

/** Atlas cell resolution. 320 px covers the largest sticker at 2x DPR. */
const ATLAS_CELL = 320;

/**
 * The frozen instant shown under Reduce Motion. Picked because the field is
 * evenly distributed and one sticker is mid-swallow, so the still frame still
 * reads as the effect rather than as an empty backdrop.
 */
const STATIC_TIME = 8.4;

/** Longest frame the simulation will honour, so a stall does not jump the feed. */
const MAX_DELTA = 1 / 20;

export interface DropzoneSceneProps {
	reducedMotion: boolean;
	tuning?: Partial<DropzoneTuning>;
}

export function DropzoneScene({ reducedMotion, tuning }: Readonly<DropzoneSceneProps>) {
	const gl = useThree((state) => state.gl);
	const scene = useThree((state) => state.scene);
	const camera = useThree((state) => state.camera);
	const size = useThree((state) => state.size);
	const dpr = useThree((state) => state.viewport.dpr);

	const settings = useMemo(() => ({ ...DROPZONE_TUNING_DEFAULTS, ...tuning }), [tuning]);

	const layout = useMemo(
		() => resolveLayout(size.width, size.height, settings),
		[size.width, size.height, settings],
	);

	// The atlas is viewport-independent, so it survives every resize. Baking it
	// costs a few milliseconds of canvas work and must not repeat on a drag.
	const atlas = useMemo(() => buildStickerAtlas(ATLAS_CELL), []);
	useEffect(() => () => atlas.dispose(), [atlas]);

	const field = useMemo(() => createStickerField(layout, atlas), [layout, atlas]);
	useEffect(() => () => field.dispose(), [field]);

	const stars = useMemo(() => createStarfield(layout), [layout]);
	useEffect(() => () => stars.dispose(), [stars]);

	const orb = useMemo(() => createOrbMaterial(layout.orbRadius), [layout.orbRadius]);
	useEffect(() => () => orb.material.dispose(), [orb]);

	// Built once at a placeholder size, with no dependency on the viewport at
	// all — the layout effect below sizes it before the first frame and on every
	// resize after. Depending on `size` here would tear down and reallocate
	// several float render targets on every pixel of a window drag.
	const post = useMemo(() => createDropzonePost(1, 1, 1), []);
	useEffect(() => () => post.dispose(), [post]);

	// Layout effect, not a passive one: this has to land before the render loop
	// draws its first frame, or that frame goes to the 1x1 placeholder targets.
	useLayoutEffect(() => {
		post.setSize(size.width, size.height, dpr);
		stars.setPixelRatio(dpr);
	}, [post, stars, size.width, size.height, dpr]);

	// Live knobs. These are plain uniform writes, so turning them never rebuilds
	// the atlas or the field.
	useEffect(() => {
		const uniforms = field.material.uniforms;
		uniforms.uCatchStrength.value = settings.catchLight;
		uniforms.uFilmScale.value = settings.filmScale;
		uniforms.uDome.value = settings.dome;
		uniforms.uExposure.value = settings.exposure;
		post.setTuning({
			bloom: settings.bloom,
			defocus: settings.defocus,
			grain: settings.grain,
		});
	}, [field, post, settings]);

	// `1 world unit = 1 CSS px`: put the camera where the frustum is exactly the
	// viewport at z = 0, so every measured pixel value in `tuning.ts` is literal.
	useEffect(() => {
		const perspective = camera as THREE.PerspectiveCamera;
		perspective.fov = CAMERA_FOV;
		perspective.near = 1;
		perspective.far = layout.cameraDistance * 6;
		perspective.position.set(0, 0, layout.cameraDistance);
		perspective.lookAt(0, 0, 0);
		perspective.updateProjectionMatrix();
	}, [camera, layout.cameraDistance]);

	const orbSpan = layout.orbRadius * ORB_HALO_REACH * 2;

	const feedRef = useRef(0);
	const orbViewRef = useRef(new THREE.Vector3());

	useFrame((state, delta) => {
		const step = Math.min(delta, MAX_DELTA);
		const time = reducedMotion ? STATIC_TIME : state.clock.elapsedTime * settings.speed;

		const swallowed = field.update(time);
		// The feed decays geometrically per second, so the flare fades at the
		// same rate no matter the frame rate.
		feedRef.current = Math.min(FEED_MAX_GLOW, feedRef.current * FEED_DECAY ** step + swallowed);

		orb.uniforms.uTime.value = time;
		orb.uniforms.uFeed.value = feedRef.current;
		stars.update(time);

		camera.updateMatrixWorld();
		const orbView = orbViewRef.current;
		orbView.set(layout.orbX, layout.orbY, 0).applyMatrix4(camera.matrixWorldInverse);
		field.material.uniforms.uOrbViewPos.value.copy(orbView);

		gl.setRenderTarget(post.sceneTarget);
		gl.setClearColor(0x000000, 1);
		gl.clear(true, true, true);
		gl.render(scene, camera);
		post.render(gl, camera as THREE.PerspectiveCamera, time);
	}, 1);

	return (
		<>
			<primitive object={stars.object} />
			<primitive object={field.object} />
			{/* Drawn last: the orb is premultiplied-alpha over everything, and
			    its halo must add on top of the stickers already in the frame. */}
			<mesh position={[layout.orbX, layout.orbY, 0]} renderOrder={10}>
				<planeGeometry args={[orbSpan, orbSpan]} />
				<primitive object={orb.material} attach="material" />
			</mesh>
		</>
	);
}
