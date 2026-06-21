"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import FlutedGlass from "./shaders/fluted-glass";

export default function FlutedGlassDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [lensMode, setLensMode] = useState<"0" | "1">("0");
	const [fluteShape, setFluteShape] = useState<"0" | "1" | "2" | "3">("0");
	const [shapeFrequency, setShapeFrequency] = useState(1);
	const [fluteCount, setFluteCount] = useState(16);
	const [flutePower, setFlutePower] = useState(1.4);
	const [distortion, setDistortion] = useState(0.11);
	const [dispersion, setDispersion] = useState(1.54);
	const [blurSize, setBlurSize] = useState(0);
	const [frostAmount, setFrostAmount] = useState(0);

	const config = useMemo(
		() => ({ lensMode: Number(lensMode), fluteShape: Number(fluteShape), shapeFrequency, fluteCount, flutePower, distortion, dispersion, blurSize, frostAmount }),
		[lensMode, fluteShape, shapeFrequency, fluteCount, flutePower, distortion, dispersion, blurSize, frostAmount],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="aspect-video w-full overflow-hidden rounded-lg border border-border"
			>
				<FlutedGlass
					imageSrc={imageSrc}
					lensMode={Number(lensMode)}
					fluteShape={Number(fluteShape)}
					shapeFrequency={shapeFrequency}
					fluteCount={fluteCount}
					flutePower={flutePower}
					distortion={distortion}
					dispersion={dispersion}
					blurSize={blurSize}
					frostAmount={frostAmount}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<GUI.ImageInput
					id="fg-image"
					label="Image"
					value={imageSrc}
					onChange={setImageSrc}
				/>
				<GUI.Select
					id="fg-lens"
					label="Lens Mode"
					value={lensMode}
					options={[
						{ value: "0", label: "Curved" },
						{ value: "1", label: "Cosine" },
					]}
					onChange={setLensMode}
				/>
				<GUI.Select
					id="fg-shape"
					label="Flute Shape"
					value={fluteShape}
					options={[
						{ value: "0", label: "Bars" },
						{ value: "1", label: "Waves" },
						{ value: "2", label: "Zigzag" },
						{ value: "3", label: "Seigaiha" },
					]}
					onChange={setFluteShape}
				/>
				{Number(fluteShape) !== 0 ? (
					<GUI.Control
						id="fg-freq"
						label="Frequency"
						value={shapeFrequency}
						defaultValue={1}
						min={0.5}
						max={3}
						step={0.5}
						onChange={setShapeFrequency}
					/>
				) : null}
				<GUI.Control
					id="fg-size"
					label="Size"
					value={fluteCount}
					defaultValue={16}
					min={4}
					max={60}
					step={1}
					onChange={setFluteCount}
				/>
				{Number(lensMode) === 0 ? (
					<GUI.Control
						id="fg-curvature"
						label="Curvature"
						value={flutePower}
						defaultValue={1.4}
						min={0.5}
						max={6}
						step={0.1}
						onChange={setFlutePower}
					/>
				) : null}
				<GUI.Control
					id="fg-distortion"
					label="Distortion"
					value={distortion}
					defaultValue={0.11}
					min={0}
					max={0.3}
					step={0.001}
					onChange={setDistortion}
				/>
				<GUI.Control
					id="fg-dispersion"
					label="Dispersion"
					value={dispersion}
					defaultValue={1.54}
					min={0}
					max={2}
					step={0.01}
					onChange={setDispersion}
				/>
				<GUI.Control
					id="fg-blur"
					label="Blur"
					value={blurSize}
					defaultValue={0}
					min={0}
					max={100}
					step={1}
					onChange={setBlurSize}
				/>
				<GUI.Control
					id="fg-frost"
					label="Frost"
					value={frostAmount}
					defaultValue={0}
					min={0}
					max={100}
					step={1}
					onChange={setFrostAmount}
				/>
			</GUI.Panel>
		</div>
	);
}
