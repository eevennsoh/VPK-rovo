"use client";

import {
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type RefObject,
	type SetStateAction,
} from "react";
import DownloadIcon from "@atlaskit/icon/core/download";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	InkWash,
	INK_WASH_CONTROL_RANGES,
	INK_WASH_MODE_OPTIONS,
	INK_WASH_PRESET_OPTIONS,
	INK_WASH_QUALITY_OPTIONS,
	INK_WASH_VIEW_OPTIONS,
	type InkWashConfig,
	type InkWashHandle,
	type InkWashPresetId,
	getInkWashPreset,
	mergeInkWashConfig,
} from "@/components/visual/ink-wash";
import { GUI } from "@/components/utils/gui";

import { ShaderColorInput } from "./shader-color-controls";

type InkWashConfigKey = keyof InkWashConfig;

function setInkWashValue<K extends InkWashConfigKey>(
	setConfig: Dispatch<SetStateAction<InkWashConfig>>,
	key: K,
	value: InkWashConfig[K],
) {
	setConfig((current) => mergeInkWashConfig(current, { [key]: value } as Partial<InkWashConfig>));
}

function presetConfig(presetId: InkWashPresetId): InkWashConfig {
	return mergeInkWashConfig(getInkWashPreset(presetId).config);
}

function InkWashActionButtons({
	engineRef,
	playing,
	onPlayingChange,
}: Readonly<{
	engineRef: RefObject<InkWashHandle | null>;
	playing?: boolean;
	onPlayingChange?: (playing: boolean) => void;
}>) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{onPlayingChange ? (
				<Button
					type="button"
					variant="secondary"
					aria-pressed={playing}
					onClick={() => onPlayingChange(!playing)}
				>
					{playing ? "Pause" : "Play"}
				</Button>
			) : null}
			<Button type="button" variant="ghost" onClick={() => engineRef.current?.replay()}>
				<Icon render={<RefreshIcon label="" size="small" />} aria-hidden />
				Replay
			</Button>
			<Button type="button" variant="ghost" onClick={() => engineRef.current?.fix()}>
				Fix
			</Button>
			<Button type="button" variant="ghost" onClick={() => engineRef.current?.clear()}>
				Clear
			</Button>
			<Button type="button" variant="ghost" onClick={() => engineRef.current?.savePNG()}>
				<Icon render={<DownloadIcon label="" size="small" />} aria-hidden />
				Save
			</Button>
		</div>
	);
}

function InkWashMiniDemo({
	presetId,
	height = 260,
	config,
}: Readonly<{
	presetId: InkWashPresetId;
	height?: number;
	config?: Partial<InkWashConfig>;
}>) {
	const engineRef = useRef<InkWashHandle | null>(null);
	return (
		<div className="flex w-full flex-col gap-2">
			<InkWash
				ref={engineRef}
				presetId={presetId}
				config={{ interactive: true, quality: "low", ...config }}
				height={height}
			/>
			<InkWashActionButtons engineRef={engineRef} />
		</div>
	);
}

export default function InkWashDemo() {
	const initialPresetId = "landscape" satisfies InkWashPresetId;
	const engineRef = useRef<InkWashHandle | null>(null);
	const [presetId, setPresetId] = useState<InkWashPresetId>(initialPresetId);
	const [config, setConfig] = useState<InkWashConfig>(() => presetConfig(initialPresetId));
	const values = useMemo(() => ({ presetId, ...config }), [config, presetId]);

	const applyPreset = (nextPresetId: InkWashPresetId) => {
		setPresetId(nextPresetId);
		setConfig(presetConfig(nextPresetId));
	};

	return (
		<div className="flex w-full max-w-5xl flex-col gap-4">
			<InkWash
				ref={engineRef}
				presetId={presetId}
				config={config}
				height="min(62svh, 620px)"
			/>

			<GUI.Panel title="Ink Wash controls" values={values}>
				<GUI.Section title="Playback" borderTop={false}>
					<InkWashActionButtons
						engineRef={engineRef}
						playing={config.playing}
						onPlayingChange={(playing) => setInkWashValue(setConfig, "playing", playing)}
					/>
					<GUI.Select
						id="ink-wash-preset"
						label="Preset"
						value={presetId}
						options={INK_WASH_PRESET_OPTIONS}
						onChange={applyPreset}
						valueKeys="presetId"
					/>
					<GUI.Select
						id="ink-wash-quality"
						label="Quality"
						value={config.quality}
						options={INK_WASH_QUALITY_OPTIONS}
						onChange={(quality) => setInkWashValue(setConfig, "quality", quality)}
					/>
					<GUI.Toggle
						id="ink-wash-interactive"
						label="Interactive"
						checked={config.interactive}
						onChange={(interactive) => setInkWashValue(setConfig, "interactive", interactive)}
					/>
				</GUI.Section>

				<GUI.Section title="Drawing">
					<GUI.Select
						id="ink-wash-mode"
						label="Mode"
						value={config.mode}
						options={INK_WASH_MODE_OPTIONS}
						onChange={(mode) => setInkWashValue(setConfig, "mode", mode)}
					/>
					<ShaderColorInput
						id="ink-wash-ink-color"
						label="Ink hue"
						value={config.inkColor}
						defaultValue="#16161e"
						onChange={(inkColor) => setInkWashValue(setConfig, "inkColor", inkColor)}
					/>
					<GUI.Control
						id="ink-wash-size"
						label="Size"
						value={config.size}
						defaultValue={presetConfig(presetId).size}
						{...INK_WASH_CONTROL_RANGES.size}
						onChange={(size) => setInkWashValue(setConfig, "size", size)}
					/>
					<GUI.Control
						id="ink-wash-brush-ink"
						label="Brush ink"
						value={config.brushInk}
						defaultValue={presetConfig(presetId).brushInk}
						{...INK_WASH_CONTROL_RANGES.brushInk}
						onChange={(brushInk) => setInkWashValue(setConfig, "brushInk", brushInk)}
					/>
				</GUI.Section>

				<GUI.Section title="Simulation">
					<GUI.Control
						id="ink-wash-flow"
						label="Flow"
						value={config.flow}
						defaultValue={presetConfig(presetId).flow}
						{...INK_WASH_CONTROL_RANGES.flow}
						onChange={(flow) => setInkWashValue(setConfig, "flow", flow)}
					/>
					<GUI.Control
						id="ink-wash-bleed"
						label="Bleed"
						value={config.bleed}
						defaultValue={presetConfig(presetId).bleed}
						{...INK_WASH_CONTROL_RANGES.bleed}
						onChange={(bleed) => setInkWashValue(setConfig, "bleed", bleed)}
					/>
					<GUI.Control
						id="ink-wash-dry"
						label="Dry"
						value={config.dry}
						defaultValue={presetConfig(presetId).dry}
						{...INK_WASH_CONTROL_RANGES.dry}
						onChange={(dry) => setInkWashValue(setConfig, "dry", dry)}
					/>
					<GUI.Control
						id="ink-wash-color"
						label="Color split"
						value={config.color}
						defaultValue={presetConfig(presetId).color}
						{...INK_WASH_CONTROL_RANGES.color}
						onChange={(color) => setInkWashValue(setConfig, "color", color)}
					/>
				</GUI.Section>

				<GUI.Section title="Display">
					<GUI.Select
						id="ink-wash-view"
						label="View"
						value={config.view}
						options={INK_WASH_VIEW_OPTIONS}
						onChange={(view) => setInkWashValue(setConfig, "view", view)}
					/>
					<GUI.Control
						id="ink-wash-ink-strength"
						label="Ink strength"
						value={config.inkStrength}
						defaultValue={presetConfig(presetId).inkStrength}
						{...INK_WASH_CONTROL_RANGES.inkStrength}
						onChange={(inkStrength) => setInkWashValue(setConfig, "inkStrength", inkStrength)}
					/>
					<GUI.Control
						id="ink-wash-edge-strength"
						label="Edges"
						value={config.edgeStrength}
						defaultValue={presetConfig(presetId).edgeStrength}
						{...INK_WASH_CONTROL_RANGES.edgeStrength}
						onChange={(edgeStrength) => setInkWashValue(setConfig, "edgeStrength", edgeStrength)}
					/>
					<GUI.Control
						id="ink-wash-grain-strength"
						label="Grain"
						value={config.grainStrength}
						defaultValue={presetConfig(presetId).grainStrength}
						{...INK_WASH_CONTROL_RANGES.grainStrength}
						onChange={(grainStrength) => setInkWashValue(setConfig, "grainStrength", grainStrength)}
					/>
					<GUI.Toggle
						id="ink-wash-paper"
						label="Paper"
						checked={config.paper}
						onChange={(paper) => setInkWashValue(setConfig, "paper", paper)}
					/>
					<GUI.Toggle
						id="ink-wash-wet-sheen"
						label="Wet sheen"
						checked={config.wetSheen}
						onChange={(wetSheen) => setInkWashValue(setConfig, "wetSheen", wetSheen)}
					/>
					<GUI.Toggle
						id="ink-wash-vignette"
						label="Vignette"
						checked={config.vignette}
						onChange={(vignette) => setInkWashValue(setConfig, "vignette", vignette)}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}

export function InkWashDemoLandscapeWash() {
	return <InkWashMiniDemo presetId="landscape" height={360} config={{ quality: "medium" }} />;
}

export function InkWashDemoFlowComparison() {
	return (
		<div className="grid w-full gap-3 md:grid-cols-2">
			<div className="space-y-2">
				<InkWashMiniDemo presetId="flow-low" height={260} />
				<p className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-subtlest">
					Flow low
				</p>
			</div>
			<div className="space-y-2">
				<InkWashMiniDemo presetId="flow-high" height={260} />
				<p className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-subtlest">
					Flow high
				</p>
			</div>
		</div>
	);
}

export function InkWashDemoDryingWindow() {
	return <InkWashMiniDemo presetId="dry-window" height={300} />;
}

export function InkWashDemoBleedChroma() {
	return <InkWashMiniDemo presetId="bleed-chroma" height={300} />;
}

export function InkWashDemoLayeredWhiteInk() {
	return <InkWashMiniDemo presetId="layered-white" height={300} />;
}

export function InkWashDemoGallery() {
	return (
		<div className="grid w-full gap-3 md:grid-cols-3">
			<InkWashMiniDemo presetId="leaf" height={220} />
			<InkWashMiniDemo presetId="bloom" height={220} />
			<InkWashMiniDemo presetId="night" height={220} />
		</div>
	);
}
