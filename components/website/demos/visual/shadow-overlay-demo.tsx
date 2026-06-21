"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import ShadowOverlay, {
	SHADOW_OVERLAY_PRESET_IDS,
	type ShadowOverlaySizing,
	type ShadowOverlayType,
} from "./shadow-overlay";

const DEFAULT_TYPE: ShadowOverlayType = "preset";
const DEFAULT_PRESET_INDEX = 1;
const DEFAULT_SIZING: ShadowOverlaySizing = "fill";
const DEFAULT_COLOR = "#424240";
const DEFAULT_ANIMATION_ENABLED = true;
const DEFAULT_ANIMATION_SCALE = 50;
const DEFAULT_ANIMATION_SPEED = 30;
const DEFAULT_NOISE_ENABLED = false;
const DEFAULT_NOISE_OPACITY = 0.5;
const DEFAULT_NOISE_SCALE = 1;

export default function ShadowOverlayDemo() {
	const [type, setType] = useState<ShadowOverlayType>(DEFAULT_TYPE);
	const [presetIndex, setPresetIndex] = useState(DEFAULT_PRESET_INDEX);
	const [customImageSrc, setCustomImageSrc] = useState<string | undefined>(undefined);
	const [sizing, setSizing] = useState<ShadowOverlaySizing>(DEFAULT_SIZING);
	const [color, setColor] = useState(DEFAULT_COLOR);
	const [animationEnabled, setAnimationEnabled] = useState(DEFAULT_ANIMATION_ENABLED);
	const [animationScale, setAnimationScale] = useState(DEFAULT_ANIMATION_SCALE);
	const [animationSpeed, setAnimationSpeed] = useState(DEFAULT_ANIMATION_SPEED);
	const [noiseEnabled, setNoiseEnabled] = useState(DEFAULT_NOISE_ENABLED);
	const [noiseOpacity, setNoiseOpacity] = useState(DEFAULT_NOISE_OPACITY);
	const [noiseScale, setNoiseScale] = useState(DEFAULT_NOISE_SCALE);

	const config = useMemo(
		() => ({
			type,
			presetIndex,
			sizing,
			color,
			animation: {
				enabled: animationEnabled,
				scale: animationScale,
				speed: animationSpeed,
			},
			noise: {
				enabled: noiseEnabled,
				opacity: noiseOpacity,
				scale: noiseScale,
			},
		}),
		[
			animationEnabled,
			animationScale,
			animationSpeed,
			color,
			noiseEnabled,
			noiseOpacity,
			noiseScale,
			presetIndex,
			sizing,
			type,
		],
	);

	return (
			<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
				<div
					className="relative overflow-hidden rounded-lg border border-border bg-surface"
					style={{
						boxShadow: token("elevation.shadow.raised"),
					}}
				>
					<div
						className="relative min-h-[28rem] overflow-hidden rounded-lg"
						style={{
							height: "min(72vh, 560px)",
							backgroundColor: "#ffffff",
					}}
				>
					<ShadowOverlay
						className="pointer-events-none absolute inset-0"
						type={type}
						presetIndex={presetIndex}
						customImageSrc={customImageSrc}
						customImageAlt="Custom shadow overlay"
						sizing={sizing}
						color={color}
						animation={{
							enabled: animationEnabled,
							scale: animationScale,
							speed: animationSpeed,
						}}
						noise={{
							enabled: noiseEnabled,
							opacity: noiseOpacity,
							scale: noiseScale,
						}}
					/>
				</div>
			</div>

			<GUI.Panel title="Overlay controls" values={config}>
				<div className="space-y-4">
					<GUI.Select
						id="shadow-overlay-type"
						label="Source"
						value={type}
						options={[
							{ value: "preset", label: "Preset" },
							{ value: "custom", label: "Custom" },
						]}
						onChange={setType}
					/>
					{type === "preset" ? (
						<GUI.Control
							id="shadow-overlay-preset"
							label="Preset"
							value={presetIndex}
							defaultValue={DEFAULT_PRESET_INDEX}
							min={1}
							max={SHADOW_OVERLAY_PRESET_IDS.length}
							step={1}
							onChange={setPresetIndex}
						/>
					) : (
						<GUI.ImageInput
							id="shadow-overlay-custom-mask"
							label="Custom mask"
							description="Transparent PNG or SVG works best."
							value={customImageSrc}
							previewAlt="Custom shadow mask"
							previewClassName="bg-bg-neutral"
							onChange={setCustomImageSrc}
						/>
					)}
					<GUI.Select
						id="shadow-overlay-sizing"
						label="Sizing"
						value={sizing}
						options={[
							{ value: "fill", label: "Fill" },
							{ value: "stretch", label: "Stretch" },
						]}
						onChange={setSizing}
					/>
					<GUI.ColorInput
						id="shadow-overlay-color"
						label="Color"
						format="css"
						value={color}
						onChange={setColor}
					/>
					<GUI.Section title="Animation">
						<GUI.Toggle
							id="shadow-overlay-animation-enabled"
							label="Enabled"
							checked={animationEnabled}
							onChange={setAnimationEnabled}
						/>
						<GUI.Control
							id="shadow-overlay-animation-scale"
							label="Scale"
							value={animationScale}
							defaultValue={DEFAULT_ANIMATION_SCALE}
							min={1}
							max={100}
							step={1}
							onChange={setAnimationScale}
						/>
						<GUI.Control
							id="shadow-overlay-animation-speed"
							label="Speed"
							value={animationSpeed}
							defaultValue={DEFAULT_ANIMATION_SPEED}
							min={1}
							max={100}
							step={1}
							onChange={setAnimationSpeed}
						/>
					</GUI.Section>
					<GUI.Section title="Noise">
						<GUI.Toggle
							id="shadow-overlay-noise-enabled"
							label="Enabled"
							checked={noiseEnabled}
							onChange={setNoiseEnabled}
						/>
						<GUI.Control
							id="shadow-overlay-noise-opacity"
							label="Opacity"
							value={noiseOpacity}
							defaultValue={DEFAULT_NOISE_OPACITY}
							min={0}
							max={1}
							step={0.01}
							onChange={setNoiseOpacity}
						/>
						<GUI.Control
							id="shadow-overlay-noise-scale"
							label="Scale"
							value={noiseScale}
							defaultValue={DEFAULT_NOISE_SCALE}
							min={0.2}
							max={2}
							step={0.1}
							onChange={setNoiseScale}
						/>
					</GUI.Section>
				</div>
			</GUI.Panel>
		</div>
	);
}
