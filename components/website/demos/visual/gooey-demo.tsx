"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { GUI } from "@/components/utils/gui";
import {
	DISSOLVE_DEFAULTS,
	EVOLVE_DEFAULTS,
	GOOEY_DEFAULTS,
	Gooey,
	MORPH_DEFAULTS,
	MOVE_DEFAULTS,
	MOVE_TUNING_DEFAULTS,
	type CornerRadii,
	type Transition,
} from "@/components/visual/gooey";
import { cn } from "@/lib/utils";

import {
	GooeyMorphAvatarExample,
	GooeyBendCardExample,
	GooeyMeltCardsExample,
	GooeyMorphEmailExample,
	GooeyMorphMenuExample,
	GooeyMoveSliderExample,
	GooeyMoveTabsExample,
} from "./gooey-examples";
import { usePointerDrag } from "@/components/ui-custom/hooks/use-pointer-drag";

import { GOOEY_SOURCE_SHADOW } from "./gooey-demo-utils";

type NumberKey =
	| "blur" | "contrast" | "filterPadding" | "waviness" | "wavinessFreq"
	| "x" | "y" | "scale" | "delay"
	| "radius" | "radiusTL" | "radiusTR" | "radiusBR" | "radiusBL"
	| "transitionStiffness" | "transitionDamping" | "transitionMass" | "transitionDuration"
	| "morphSpeed" | "morphBounce" | "morphContentBlur" | "blobInset" | "bridgeGrow"
	| "massStiffness" | "massDamping" | "sizeStiffness" | "sizeDamping"
	| "radiusStiffness" | "radiusDamping" | "evolveContentBlur" | "roundness"
	| "cornerDuration" | "cornerDelay" | "anticipation" | "travel"
	| "moveSpringiness" | "moveWobble" | "moveStretch" | "moveTrail"
	| "moveStiffness" | "moveDamping" | "rawMoveStretch" | "moveTail"
	| "bendVertical" | "bendHorizontal"
	| "dissolveBlur" | "dissolveWarp" | "dissolvePull" | "dissolveRange"
	| "dissolveZone" | "dissolveMix" | "dissolveGravity" | "dissolveTaper"
	| "dissolveWarpFreq" | "dissolveFlowSpeed" | "dissolveDetail"
	| "dissolveReleaseMs" | "dissolveFadeMs" | "dissolveStrength" | "dissolveSink";

type BooleanKey = "observe" | "morphShape" | "dissolveEnabled" | "dissolveActive";
type StringKey = "fill" | "shadow" | "effect" | "radiusMode" | "transitionMode" | "transitionEase" | "cornerEase" | "warpStyle" | "itemClassName" | "itemStyle" | "childrenText";
type PlaygroundConfig = Record<NumberKey, number> & Record<BooleanKey, boolean> & Record<StringKey, string>;
type HeroBounds = Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;

const HERO_INITIAL_BOUNDS: HeroBounds = { minX: -112, maxX: 64, minY: -48, maxY: 40 };
const HERO_EDGE_PADDING = 12;
const HERO_ITEM_WIDTH = 128;
const HERO_ITEM_HEIGHT = 80;
const HERO_ITEM_LEFT_OFFSET = -20;

function getHeroBounds(width: number, height: number, scale: number): HeroBounds {
	const scaleDeltaX = HERO_ITEM_WIDTH * (scale - 1) / 2;
	const scaleDeltaY = HERO_ITEM_HEIGHT * (scale - 1) / 2;
	const rawMinX = HERO_EDGE_PADDING - (width / 2 + HERO_ITEM_LEFT_OFFSET - scaleDeltaX);
	const rawMaxX = width - HERO_EDGE_PADDING - (width / 2 + HERO_ITEM_LEFT_OFFSET + HERO_ITEM_WIDTH + scaleDeltaX);
	const rawMinY = HERO_EDGE_PADDING - (height / 2 - HERO_ITEM_HEIGHT / 2 - scaleDeltaY);
	const rawMaxY = height - HERO_EDGE_PADDING - (height / 2 + HERO_ITEM_HEIGHT / 2 + scaleDeltaY);
	const fallbackX = (rawMinX + rawMaxX) / 2;
	const fallbackY = (rawMinY + rawMaxY) / 2;

	return {
		minX: rawMinX <= rawMaxX ? rawMinX : fallbackX,
		maxX: rawMinX <= rawMaxX ? rawMaxX : fallbackX,
		minY: rawMinY <= rawMaxY ? rawMinY : fallbackY,
		maxY: rawMinY <= rawMaxY ? rawMaxY : fallbackY,
	};
}

function clampToRange(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

const DEFAULT_CONFIG: PlaygroundConfig = {
	blur: GOOEY_DEFAULTS.blur,
	contrast: GOOEY_DEFAULTS.contrast,
	fill: "var(--color-surface)",
	shadow: GOOEY_SOURCE_SHADOW,
	filterPadding: GOOEY_DEFAULTS.filterPadding,
	waviness: GOOEY_DEFAULTS.waviness,
	wavinessFreq: GOOEY_DEFAULTS.wavinessFreq,
	effect: "morph",
	x: 36,
	y: 0,
	scale: 1,
	delay: 0,
	observe: false,
	radiusMode: "uniform",
	radius: 24,
	radiusTL: 24,
	radiusTR: 24,
	radiusBR: 24,
	radiusBL: 24,
	itemClassName: "",
	itemStyle: "{}",
	childrenText: "Gooey",
	transitionMode: "smooth",
	transitionStiffness: 300,
	transitionDamping: 24,
	transitionMass: 1,
	transitionDuration: 360,
	transitionEase: "cubic-bezier(0.22, 1, 0.36, 1)",
	morphShape: MORPH_DEFAULTS.shape,
	morphSpeed: MORPH_DEFAULTS.speed,
	morphBounce: MORPH_DEFAULTS.bounce,
	morphContentBlur: MORPH_DEFAULTS.contentBlur,
	blobInset: 0,
	bridgeGrow: 0,
	massStiffness: EVOLVE_DEFAULTS.massStiffness,
	massDamping: EVOLVE_DEFAULTS.massDamping,
	sizeStiffness: EVOLVE_DEFAULTS.sizeStiffness,
	sizeDamping: EVOLVE_DEFAULTS.sizeDamping,
	radiusStiffness: EVOLVE_DEFAULTS.radiusStiffness,
	radiusDamping: EVOLVE_DEFAULTS.radiusDamping,
	evolveContentBlur: EVOLVE_DEFAULTS.contentBlur,
	roundness: EVOLVE_DEFAULTS.roundness,
	cornerDuration: EVOLVE_DEFAULTS.cornerDuration,
	cornerDelay: EVOLVE_DEFAULTS.cornerDelay,
	cornerEase: EVOLVE_DEFAULTS.cornerEase,
	anticipation: EVOLVE_DEFAULTS.anticipation,
	travel: EVOLVE_DEFAULTS.travel,
	moveSpringiness: MOVE_TUNING_DEFAULTS.springiness,
	moveWobble: MOVE_TUNING_DEFAULTS.wobble,
	moveStretch: MOVE_TUNING_DEFAULTS.stretch,
	moveTrail: MOVE_TUNING_DEFAULTS.trail,
	moveStiffness: MOVE_DEFAULTS.stiffness,
	moveDamping: MOVE_DEFAULTS.damping,
	rawMoveStretch: MOVE_DEFAULTS.stretch,
	moveTail: MOVE_DEFAULTS.tail,
	bendVertical: 0.6,
	bendHorizontal: 0.35,
	dissolveEnabled: false,
	dissolveBlur: DISSOLVE_DEFAULTS.blur,
	dissolveWarp: DISSOLVE_DEFAULTS.warp,
	dissolvePull: DISSOLVE_DEFAULTS.pull,
	dissolveRange: DISSOLVE_DEFAULTS.range,
	dissolveZone: DISSOLVE_DEFAULTS.zone,
	dissolveMix: DISSOLVE_DEFAULTS.mix,
	dissolveGravity: DISSOLVE_DEFAULTS.gravity,
	dissolveTaper: DISSOLVE_DEFAULTS.taper,
	dissolveWarpFreq: DISSOLVE_DEFAULTS.warpFreq,
	dissolveFlowSpeed: DISSOLVE_DEFAULTS.flowSpeed,
	warpStyle: DISSOLVE_DEFAULTS.warpStyle,
	dissolveDetail: DISSOLVE_DEFAULTS.detail,
	dissolveActive: DISSOLVE_DEFAULTS.active,
	dissolveReleaseMs: DISSOLVE_DEFAULTS.releaseMs,
	dissolveFadeMs: DISSOLVE_DEFAULTS.fadeMs,
	dissolveStrength: DISSOLVE_DEFAULTS.strength,
	dissolveSink: DISSOLVE_DEFAULTS.sink,
};

type NumberControlDefinition = Readonly<{ key: NumberKey; label: string; min: number; max: number; step: number; unit?: string }>;

const EVOLVE_CONTROLS: readonly NumberControlDefinition[] = [
	{ key: "massStiffness", label: "Mass stiffness", min: 20, max: 1200, step: 1 },
	{ key: "massDamping", label: "Mass damping", min: 1, max: 120, step: 0.5 },
	{ key: "sizeStiffness", label: "Size stiffness", min: 20, max: 1200, step: 1 },
	{ key: "sizeDamping", label: "Size damping", min: 1, max: 120, step: 0.5 },
	{ key: "radiusStiffness", label: "Radius stiffness", min: 20, max: 1600, step: 1 },
	{ key: "radiusDamping", label: "Radius damping", min: 1, max: 160, step: 0.5 },
	{ key: "evolveContentBlur", label: "Evolve content blur", min: 0, max: 24, step: 0.5, unit: "px" },
	{ key: "roundness", label: "Roundness", min: 0, max: 1, step: 0.01 },
	{ key: "cornerDuration", label: "Corner duration", min: 1, max: 2000, step: 1, unit: "ms" },
	{ key: "cornerDelay", label: "Corner delay", min: 0, max: 1000, step: 1, unit: "ms" },
	{ key: "anticipation", label: "Anticipation", min: 0, max: 800, step: 1, unit: "ms" },
	{ key: "travel", label: "Travel", min: 0, max: 160, step: 1, unit: "px" },
];

const MOVE_CONTROLS: readonly NumberControlDefinition[] = [
	{ key: "moveSpringiness", label: "Springiness", min: 0, max: 1, step: 0.01 },
	{ key: "moveWobble", label: "Wobble", min: 0, max: 1, step: 0.01 },
	{ key: "moveStretch", label: "Stretch", min: 0, max: 1, step: 0.01 },
	{ key: "moveTrail", label: "Trail", min: 0, max: 1, step: 0.01 },
	{ key: "moveStiffness", label: "Raw stiffness", min: 20, max: 1600, step: 1 },
	{ key: "moveDamping", label: "Raw damping", min: 1, max: 160, step: 0.5 },
	{ key: "rawMoveStretch", label: "Raw stretch", min: 0, max: 1, step: 0.01 },
	{ key: "moveTail", label: "Raw tail", min: 0, max: 1, step: 0.01 },
];

const DISSOLVE_CONTROLS: readonly NumberControlDefinition[] = [
	{ key: "dissolveBlur", label: "Dissolve blur", min: 0, max: 32, step: 0.5, unit: "px" },
	{ key: "dissolveWarp", label: "Warp", min: 0, max: 100, step: 1 },
	{ key: "dissolvePull", label: "Pull", min: 0, max: 40, step: 0.5, unit: "px" },
	{ key: "dissolveRange", label: "Range", min: 1, max: 160, step: 1, unit: "px" },
	{ key: "dissolveZone", label: "Zone", min: 1, max: 100, step: 1, unit: "px" },
	{ key: "dissolveMix", label: "Mix", min: 0, max: 1, step: 0.01 },
	{ key: "dissolveGravity", label: "Gravity", min: 0, max: 160, step: 1 },
	{ key: "dissolveTaper", label: "Taper", min: 0, max: 1, step: 0.01 },
	{ key: "dissolveWarpFreq", label: "Warp frequency", min: 0.2, max: 5, step: 0.05 },
	{ key: "dissolveFlowSpeed", label: "Flow speed", min: 0, max: 120, step: 1 },
	{ key: "dissolveDetail", label: "Detail", min: 1, max: 8, step: 1 },
	{ key: "dissolveReleaseMs", label: "Release", min: 0, max: 2000, step: 10, unit: "ms" },
	{ key: "dissolveFadeMs", label: "Fade", min: 0, max: 2000, step: 10, unit: "ms" },
	{ key: "dissolveStrength", label: "Strength", min: 0, max: 1, step: 0.01 },
	{ key: "dissolveSink", label: "Sink", min: 0.01, max: 1.5, step: 0.01 },
];

function parseStyle(value: string): CSSProperties {
	try {
		const parsed = JSON.parse(value) as unknown;
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as CSSProperties : {};
	} catch {
		return {};
	}
}

export default function GooeyDemo() {
	const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG);
	const [heroBounds, setHeroBounds] = useState<HeroBounds>(HERO_INITIAL_BOUNDS);
	const heroRootRef = useRef<HTMLDivElement>(null);
	const setNumber = (key: NumberKey) => (value: number) => setConfig((current) => ({ ...current, [key]: value }));
	const setBoolean = (key: BooleanKey) => (value: boolean) => setConfig((current) => ({ ...current, [key]: value }));
	const setString = (key: StringKey) => (value: string) => setConfig((current) => ({ ...current, [key]: value }));
	const heroDrag = usePointerDrag(
		{ x: config.x, y: config.y },
		(position) => setConfig((current) => ({ ...current, x: position.x, y: position.y })),
		heroBounds,
	);

	useEffect(() => {
		const root = heroRootRef.current;
		if (!root) return;

		const measure = () => {
			const width = root.clientWidth;
			const height = root.clientHeight;
			if (width === 0 || height === 0) return;
			const nextBounds = getHeroBounds(width, height, config.scale);
			setHeroBounds((current) => (
				current.minX === nextBounds.minX
				&& current.maxX === nextBounds.maxX
				&& current.minY === nextBounds.minY
				&& current.maxY === nextBounds.maxY
					? current
					: nextBounds
			));
			setConfig((current) => {
				const x = clampToRange(current.x, nextBounds.minX, nextBounds.maxX);
				const y = clampToRange(current.y, nextBounds.minY, nextBounds.maxY);
				return x === current.x && y === current.y ? current : { ...current, x, y };
			});
		};

		measure();
		const frame = requestAnimationFrame(measure);
		const observer = new ResizeObserver(measure);
		observer.observe(root);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [config.scale]);

	const transition = useMemo<Transition>(() => {
		if (config.transitionMode === "custom-spring") return { stiffness: config.transitionStiffness, damping: config.transitionDamping, mass: config.transitionMass };
		if (config.transitionMode === "duration") return { duration: config.transitionDuration, ease: config.transitionEase };
		return config.transitionMode as "snappy" | "smooth" | "bouncy";
	}, [config.transitionDamping, config.transitionDuration, config.transitionEase, config.transitionMass, config.transitionMode, config.transitionStiffness]);

	const radius: number | CornerRadii = config.radiusMode === "corners"
		? [config.radiusTL, config.radiusTR, config.radiusBR, config.radiusBL]
		: config.radius;
	const observed = config.observe || config.effect === "move" || config.effect === "bend" || config.morphShape || config.dissolveEnabled;
	const itemStyle = parseStyle(config.itemStyle);
	const dissolve = config.dissolveEnabled ? {
		blur: config.dissolveBlur, warp: config.dissolveWarp, pull: config.dissolvePull,
		range: config.dissolveRange, zone: config.dissolveZone, mix: config.dissolveMix,
		gravity: config.dissolveGravity, taper: config.dissolveTaper, warpFreq: config.dissolveWarpFreq,
		flowSpeed: config.dissolveFlowSpeed, warpStyle: config.warpStyle as "fractalNoise" | "turbulence",
		detail: config.dissolveDetail, active: config.dissolveActive, releaseMs: config.dissolveReleaseMs,
		fadeMs: config.dissolveFadeMs, strength: config.dissolveStrength, sink: config.dissolveSink,
	} : false;
	const morph = {
		shape: config.morphShape, speed: config.morphSpeed, bounce: config.morphBounce,
		contentBlur: config.morphContentBlur,
		advanced: {
			blobInset: config.blobInset, bridgeGrow: config.bridgeGrow,
			evolve: {
				massStiffness: config.massStiffness, massDamping: config.massDamping,
				sizeStiffness: config.sizeStiffness, sizeDamping: config.sizeDamping,
				radiusStiffness: config.radiusStiffness, radiusDamping: config.radiusDamping,
				contentBlur: config.evolveContentBlur, roundness: config.roundness,
				cornerDuration: config.cornerDuration, cornerDelay: config.cornerDelay,
				cornerEase: config.cornerEase, anticipation: config.anticipation, travel: config.travel,
			},
		},
	};
	const move = {
		springiness: config.moveSpringiness, wobble: config.moveWobble,
		stretch: config.moveStretch, trail: config.moveTrail,
		advanced: { stiffness: config.moveStiffness, damping: config.moveDamping, stretch: config.rawMoveStretch, tail: config.moveTail },
	};
	const bend = { vertical: config.bendVertical, horizontal: config.bendHorizontal };
	const copiedValues = { root: { blur: config.blur, contrast: config.contrast, fill: config.fill, shadow: config.shadow, filterPadding: config.filterPadding, waviness: config.waviness, wavinessFreq: config.wavinessFreq }, item: { effect: config.effect, morph, move, bend, dissolve, x: config.x, y: config.y, scale: config.scale, transition, delay: config.delay, observe: config.observe, radius, className: config.itemClassName, style: itemStyle, children: config.childrenText } };
	const activeTransition: Transition = heroDrag.dragging ? { duration: 0, ease: "linear" } : transition;

	function renderNumberControls(definitions: readonly NumberControlDefinition[]) {
		return definitions.map((control) => <GUI.Control key={control.key} id={`gooey-${control.key}`} label={control.label} value={config[control.key]} defaultValue={DEFAULT_CONFIG[control.key]} min={control.min} max={control.max} step={control.step} unit={control.unit} onChange={setNumber(control.key)} />);
	}

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			<div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
				<Gooey
					ref={heroRootRef}
					data-gooey-playground-root=""
					blur={config.blur}
					contrast={config.contrast}
					fill={config.fill}
					shadow={config.shadow}
					filterPadding={config.filterPadding}
					waviness={config.waviness}
					wavinessFreq={config.wavinessFreq}
					className="min-h-[360px] w-full overflow-visible rounded-xl bg-bg-neutral-subtle"
				>
						<Gooey.Item observe radius={radius}>
							<button
								type="button"
								aria-label="Reset Gooey item position"
								onClick={() => setConfig((current) => ({ ...current, x: DEFAULT_CONFIG.x, y: DEFAULT_CONFIG.y, scale: DEFAULT_CONFIG.scale }))}
								style={{ left: "calc(50% - 116px)", top: "calc(50% - 40px)" }}
								className="absolute flex size-20 items-center justify-center rounded-3xl text-xs font-medium text-text-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								Reset
							</button>
						</Gooey.Item>
						<Gooey.Item
							effect={config.effect as "morph" | "move" | "bend"}
							morph={morph}
							move={move}
							bend={bend}
							dissolve={dissolve}
							x={config.x}
							y={config.y}
							scale={config.scale}
							transition={activeTransition}
							delay={config.delay}
							observe={config.observe}
							radius={radius}
							className={config.itemClassName}
							style={{ position: "absolute", left: "calc(50% - 20px)", top: "calc(50% - 40px)", ...itemStyle }}
						>
							<button
								type="button"
								aria-label="Drag or activate Gooey item; arrow keys also move it"
								{...heroDrag.bind}
								style={observed ? { transform: `translate(${config.x}px, ${config.y}px) scale(${config.scale})` } : undefined}
								className={cn(
									"flex h-20 w-32 touch-none items-center gap-2 rounded-3xl p-3 text-sm font-semibold text-text outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
									heroDrag.dragging ? "cursor-grabbing" : "cursor-grab",
								)}
							>
								<Image src="/avatar-human/mia-mcdougall.png" alt="" width={40} height={40} draggable={false} className="pointer-events-none size-10 select-none rounded-full object-cover" />
								<span className="flex flex-col items-start leading-tight">
									<span>{config.childrenText}</span>
									<span className="text-[11px] font-normal text-text-subtle">Drag me</span>
								</span>
							</button>
						</Gooey.Item>
				</Gooey>

				<GUI.Panel title="Gooey controls" values={copiedValues}>
					<GUI.Section title="Root" borderTop={false}>
						<GUI.Control id="gooey-blur" label="Blur" value={config.blur} defaultValue={DEFAULT_CONFIG.blur} min={0} max={32} step={0.5} unit="px" onChange={setNumber("blur")} />
						<GUI.Control id="gooey-contrast" label="Contrast" value={config.contrast} defaultValue={DEFAULT_CONFIG.contrast} min={1} max={40} step={0.5} onChange={setNumber("contrast")} />
						<GUI.ColorInput id="gooey-fill" label="Fill" value={config.fill} defaultValue={DEFAULT_CONFIG.fill} format="css" onChange={setString("fill")} />
						<GUI.TextInput id="gooey-shadow" label="Shadow" value={config.shadow} onChange={setString("shadow")} />
						<GUI.Control id="gooey-filter-padding" label="Filter padding" value={config.filterPadding} defaultValue={DEFAULT_CONFIG.filterPadding} min={0} max={160} step={1} unit="px" onChange={setNumber("filterPadding")} />
						<GUI.Control id="gooey-waviness" label="Waviness" value={config.waviness} defaultValue={DEFAULT_CONFIG.waviness} min={0} max={24} step={0.5} unit="px" onChange={setNumber("waviness")} />
						<GUI.Control id="gooey-waviness-frequency" label="Wave frequency" value={config.wavinessFreq} defaultValue={DEFAULT_CONFIG.wavinessFreq} min={0.002} max={0.08} step={0.001} onChange={setNumber("wavinessFreq")} />
					</GUI.Section>
					<GUI.Section title="Item">
						<GUI.Select id="gooey-effect" label="Effect" value={config.effect} defaultValue="morph" options={[{ label: "Morph", value: "morph" }, { label: "Move", value: "move" }, { label: "Bend", value: "bend" }]} onChange={setString("effect")} />
						{renderNumberControls([{ key: "x", label: "X", min: heroBounds.minX, max: heroBounds.maxX, step: 1, unit: "px" }, { key: "y", label: "Y", min: heroBounds.minY, max: heroBounds.maxY, step: 1, unit: "px" }, { key: "scale", label: "Scale", min: 0.1, max: 2, step: 0.01 }, { key: "delay", label: "Delay", min: 0, max: 2000, step: 10, unit: "ms" }])}
						<GUI.Toggle id="gooey-observe" label="Observe" checked={config.observe} onChange={setBoolean("observe")} />
						<GUI.Select id="gooey-radius-mode" label="Radius mode" value={config.radiusMode} defaultValue="uniform" options={[{ label: "Uniform", value: "uniform" }, { label: "Corners", value: "corners" }]} onChange={setString("radiusMode")} />
						{config.radiusMode === "uniform" ? renderNumberControls([{ key: "radius", label: "Radius", min: 0, max: 100, step: 1, unit: "px" }]) : renderNumberControls([{ key: "radiusTL", label: "Top left radius", min: 0, max: 100, step: 1 }, { key: "radiusTR", label: "Top right radius", min: 0, max: 100, step: 1 }, { key: "radiusBR", label: "Bottom right radius", min: 0, max: 100, step: 1 }, { key: "radiusBL", label: "Bottom left radius", min: 0, max: 100, step: 1 }])}
						<GUI.TextInput id="gooey-item-class" label="Item className" value={config.itemClassName} onChange={setString("itemClassName")} />
						<GUI.TextInput id="gooey-item-style" label="Item style JSON" value={config.itemStyle} onChange={setString("itemStyle")} />
						<GUI.TextInput id="gooey-item-children" label="Children text" value={config.childrenText} onChange={setString("childrenText")} />
					</GUI.Section>
					<GUI.Section title="Transition" defaultOpen={false}>
						<GUI.Select id="gooey-transition" label="Transition" value={config.transitionMode} defaultValue="smooth" options={[{ label: "Snappy", value: "snappy" }, { label: "Smooth", value: "smooth" }, { label: "Bouncy", value: "bouncy" }, { label: "Custom spring", value: "custom-spring" }, { label: "Duration", value: "duration" }]} onChange={setString("transitionMode")} />
						{config.transitionMode === "custom-spring" ? renderNumberControls([{ key: "transitionStiffness", label: "Spring stiffness", min: 1, max: 1600, step: 1 }, { key: "transitionDamping", label: "Spring damping", min: 0, max: 160, step: 0.5 }, { key: "transitionMass", label: "Spring mass", min: 0.1, max: 10, step: 0.1 }]) : null}
						{config.transitionMode === "duration" ? <>{renderNumberControls([{ key: "transitionDuration", label: "Duration", min: 0, max: 4000, step: 10, unit: "ms" }])}<GUI.TextInput id="gooey-transition-ease" label="Easing" value={config.transitionEase} onChange={setString("transitionEase")} /></> : null}
					</GUI.Section>
					<GUI.Section title="Morph" defaultOpen={false}>
						<GUI.Toggle id="gooey-morph-shape" label="Shape" checked={config.morphShape} onChange={setBoolean("morphShape")} />
						{renderNumberControls([{ key: "morphSpeed", label: "Speed", min: 0.25, max: 4, step: 0.05 }, { key: "morphBounce", label: "Bounce", min: 0, max: 1, step: 0.01 }, { key: "morphContentBlur", label: "Content blur", min: 0, max: 24, step: 0.5, unit: "px" }, { key: "blobInset", label: "Blob inset", min: 0, max: 32, step: 0.5, unit: "px" }, { key: "bridgeGrow", label: "Bridge grow", min: 0, max: 32, step: 0.5, unit: "px" }])}
					</GUI.Section>
					<GUI.Section title="Evolve" defaultOpen={false}>
						{renderNumberControls(EVOLVE_CONTROLS)}
						<GUI.TextInput id="gooey-corner-ease" label="Corner ease" value={config.cornerEase} onChange={setString("cornerEase")} />
					</GUI.Section>
					<GUI.Section title="Move" defaultOpen={false}>{renderNumberControls(MOVE_CONTROLS)}</GUI.Section>
					<GUI.Section title="Bend" defaultOpen={false}>{renderNumberControls([{ key: "bendVertical", label: "Vertical bow", min: 0, max: 1, step: 0.01 }, { key: "bendHorizontal", label: "Horizontal caps", min: 0, max: 1, step: 0.01 }])}</GUI.Section>
					<GUI.Section title="Dissolve" defaultOpen={false}>
						<GUI.Toggle id="gooey-dissolve-enabled" label="Dissolve" checked={config.dissolveEnabled} onChange={setBoolean("dissolveEnabled")} />
						<GUI.Toggle id="gooey-dissolve-active" label="Active" checked={config.dissolveActive} onChange={setBoolean("dissolveActive")} />
						<GUI.Select id="gooey-warp-style" label="Warp style" value={config.warpStyle} defaultValue="fractalNoise" options={[{ label: "Fractal noise", value: "fractalNoise" }, { label: "Turbulence", value: "turbulence" }]} onChange={setString("warpStyle")} />
						{renderNumberControls(DISSOLVE_CONTROLS)}
					</GUI.Section>
				</GUI.Panel>
			</div>
		</div>
	);
}

export {
	GooeyMorphMenuExample,
	GooeyMorphEmailExample,
	GooeyMorphAvatarExample,
	GooeyMeltCardsExample,
	GooeyBendCardExample,
	GooeyMoveTabsExample,
	GooeyMoveSliderExample,
};
