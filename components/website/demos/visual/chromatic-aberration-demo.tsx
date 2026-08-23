"use client";

import { useEffect, useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import {
	CHROMATIC_DEFAULTS,
	type ChromaticAnimation,
	type ChromaticMode,
	type ChromaticSymmetry,
} from "./shaders/chromatic-aberration-config";
import ChromaticAberration from "./shaders/chromatic-aberration";

export default function ChromaticAberrationDemo() {
	const [mediaSrc, setMediaSrc] = useState<string | undefined>(undefined);
	const [mediaType, setMediaType] = useState<"image" | "video">("image");
	const [mode, setMode] = useState<ChromaticMode>(CHROMATIC_DEFAULTS.mode);
	const [zoom, setZoom] = useState<number>(CHROMATIC_DEFAULTS.zoom);
	const [focusX, setFocusX] = useState<number>(CHROMATIC_DEFAULTS.focusX);
	const [focusY, setFocusY] = useState<number>(CHROMATIC_DEFAULTS.focusY);
	const [radius, setRadius] = useState<number>(CHROMATIC_DEFAULTS.radius);
	const [angle, setAngle] = useState<number>(CHROMATIC_DEFAULTS.angle);
	const [symmetry, setSymmetry] = useState<ChromaticSymmetry>(CHROMATIC_DEFAULTS.symmetry);
	const [edgeAmount, setEdgeAmount] = useState<number>(CHROMATIC_DEFAULTS.edgeAmount);
	const [edges, setEdges] = useState<number>(CHROMATIC_DEFAULTS.edges);
	const [falloff, setFalloff] = useState<number>(CHROMATIC_DEFAULTS.falloff);
	const [swirl, setSwirl] = useState<number>(CHROMATIC_DEFAULTS.swirl);
	const [dispersion, setDispersion] = useState<number>(CHROMATIC_DEFAULTS.dispersion);
	const [animate, setAnimate] = useState<ChromaticAnimation>(CHROMATIC_DEFAULTS.animate);
	const [animationAmount, setAnimationAmount] = useState<number>(CHROMATIC_DEFAULTS.animationAmount);
	const [speed, setSpeed] = useState<number>(CHROMATIC_DEFAULTS.speed);

	const config = useMemo(
		() => ({
			mediaType,
			mode,
			zoom,
			focusX,
			focusY,
			radius,
			angle,
			symmetry,
			edgeAmount,
			edges,
			falloff,
			swirl,
			dispersion,
			animate,
			animationAmount,
			speed,
		}),
		[
			mediaType,
			mode,
			zoom,
			focusX,
			focusY,
			radius,
			angle,
			symmetry,
			edgeAmount,
			edges,
			falloff,
			swirl,
			dispersion,
			animate,
			animationAmount,
			speed,
		],
	);

	useEffect(() => {
		return () => {
			if (mediaSrc?.startsWith("blob:")) URL.revokeObjectURL(mediaSrc);
		};
	}, [mediaSrc]);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="aspect-video w-full overflow-hidden rounded-lg border border-border"
			>
				<ChromaticAberration
					mediaSrc={mediaSrc}
					mediaType={mediaType}
					mode={mode}
					zoom={zoom}
					focusX={focusX}
					focusY={focusY}
					radius={radius}
					angle={angle}
					symmetry={symmetry}
					edgeAmount={edgeAmount}
					edges={edges}
					falloff={falloff}
					swirl={swirl}
					dispersion={dispersion}
					animate={animate}
					animationAmount={animationAmount}
					speed={speed}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<GUI.ImageInput
					id="ca-media"
					label="Media"
					value={mediaSrc}
					accept="image/*,video/*"
					placeholder="Framer default media"
					previewType={mediaType}
					previewAlt="Uploaded shader media"
					onFile={(file) => {
						setMediaType(file.type.startsWith("video/") ? "video" : "image");
						setMediaSrc(URL.createObjectURL(file));
					}}
					onClear={() => {
						setMediaSrc(undefined);
						setMediaType("image");
					}}
				/>
				<GUI.Select
					id="ca-mode"
					label="Mode"
					value={mode}
					options={[
						{ value: "radial", label: "Radial" },
						{ value: "uniform", label: "Uniform" },
						{ value: "edges", label: "Edges" },
					]}
					onChange={setMode}
				/>
				{mode === "radial" ? (
					<>
						<GUI.Control
							id="ca-zoom"
							label="Zoom"
							value={zoom}
							defaultValue={0.5}
							min={0.25}
							max={1.5}
							step={0.01}
							onChange={setZoom}
						/>
						<GUI.Control
							id="ca-focus-x"
							label="Focus X"
							value={focusX}
							defaultValue={0.5}
							min={0}
							max={1}
							step={0.01}
							onChange={setFocusX}
						/>
						<GUI.Control
							id="ca-focus-y"
							label="Focus Y"
							value={focusY}
							defaultValue={0.5}
							min={0}
							max={1}
							step={0.01}
							onChange={setFocusY}
						/>
					</>
				) : null}
				{mode === "radial" || mode === "uniform" ? (
					<GUI.Control
						id="ca-radius"
						label="Radius"
						value={radius}
						defaultValue={60}
						min={0}
						max={180}
						step={0.5}
						onChange={setRadius}
					/>
				) : null}
				{mode === "uniform" ? (
					<GUI.Control
						id="ca-angle"
						label="Angle"
						value={angle}
						defaultValue={90}
						min={0}
						max={360}
						step={1}
						onChange={setAngle}
					/>
				) : null}
				{mode === "edges" ? (
					<>
						<GUI.SegmentedControl
							id="ca-symmetry"
							label="Symmetry"
							value={symmetry}
							options={[
								{ value: "point", label: "Point" },
								{ value: "mirror", label: "Mirror" },
							]}
							onChange={setSymmetry}
						/>
						<GUI.Control
							id="ca-edge-amount"
							label="Amount"
							value={edgeAmount}
							defaultValue={100}
							min={0}
							max={200}
							step={1}
							onChange={setEdgeAmount}
						/>
						<GUI.Control
							id="ca-edges"
							label="Edges"
							value={edges}
							defaultValue={1}
							min={0}
							max={2}
							step={0.01}
							onChange={setEdges}
						/>
						<GUI.Control
							id="ca-falloff"
							label="Falloff"
							value={falloff}
							defaultValue={3}
							min={0}
							max={6}
							step={0.1}
							onChange={setFalloff}
						/>
						<GUI.Control
							id="ca-swirl"
							label="Swirl"
							value={swirl}
							defaultValue={0}
							min={-10}
							max={10}
							step={0.1}
							onChange={setSwirl}
						/>
						<GUI.Control
							id="ca-dispersion"
							label="Dispersion"
							value={dispersion}
							defaultValue={0.5}
							min={0}
							max={1}
							step={0.01}
							onChange={setDispersion}
						/>
					</>
				) : null}
				<GUI.SegmentedControl
					id="ca-animate"
					label="Animate"
					value={animate}
					options={[
						{ value: "off", label: "Off" },
						{ value: "pulse", label: "Pulse" },
					]}
					onChange={setAnimate}
				/>
				{animate === "pulse" ? (
					<>
						<GUI.PercentControl
							id="ca-animation-amount"
							label="Amount"
							value={animationAmount}
							defaultValue={0.5}
							min={0}
							max={1}
							step={0.01}
							onChange={setAnimationAmount}
						/>
						<GUI.Control
							id="ca-speed"
							label="Speed"
							value={speed}
							defaultValue={1}
							min={0.1}
							max={5}
							step={0.01}
							onChange={setSpeed}
						/>
					</>
				) : null}
			</GUI.Panel>
		</div>
	);
}
