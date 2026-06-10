"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

import TextMorphing from "@/components/visual/text-morphing";
import {
	DEFAULT_DRIFT_X,
	VALUE_SETS,
	defaultAnimationForVariant,
	type MorphAnimation,
	type MorphVariant,
	type TextMorphConfig,
} from "@/components/visual/text-morphing/data";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

// The morph only fires when the value changes, so the demo advances through the
// editable value set on a timer. Holds steady under reduced motion.
const CYCLE_MS = 2200;

const VARIANT_OPTIONS: readonly { value: MorphVariant; label: string }[] = [
	{ value: "text", label: "Text" },
	{ value: "number", label: "Number" },
	{ value: "slots", label: "Slots" },
];

const ANIMATION_OPTIONS: readonly { value: MorphAnimation; label: string }[] = [
	{ value: "default", label: "Default" },
	{ value: "smooth", label: "Smooth" },
	{ value: "snappy", label: "Snappy" },
	{ value: "bouncy", label: "Bouncy" },
];

type TrendOption = "up" | "none" | "down";
const TREND_OPTIONS: readonly { value: TrendOption; label: string }[] = [
	{ value: "up", label: "Up" },
	{ value: "none", label: "None" },
	{ value: "down", label: "Down" },
];
const TREND_TO_NUMBER: Record<TrendOption, -1 | 0 | 1> = { up: 1, none: 0, down: -1 };

export default function TextMorphingDemo() {
	const reduced = useReducedMotion();

	const [variant, setVariant] = useState<MorphVariant>("text");
	const [animation, setAnimation] = useState<MorphAnimation>("default");
	const [valuesList, setValuesList] = useState<string[]>(() => [...VALUE_SETS.text]);
	const [stagger, setStagger] = useState(0.02);
	const [driftX, setDriftX] = useState(DEFAULT_DRIFT_X);
	const [trend, setTrend] = useState<TrendOption>("none");
	const [autoSize, setAutoSize] = useState(true);
	const [animateInitial, setAnimateInitial] = useState(false);
	const [valueIndex, setValueIndex] = useState(0);

	// Cycle through the non-empty entries; keep all fields editable regardless.
	const values = useMemo(() => {
		const parsed = valuesList.map((value) => value.trim()).filter(Boolean);
		return parsed.length > 0 ? parsed : [" "];
	}, [valuesList]);
	const current = values[valueIndex % values.length];

	// Edit a single value field by index.
	const setValueAt = (index: number, next: string) => {
		setValuesList((list) => list.map((value, i) => (i === index ? next : value)));
	};

	// Drift and trend only apply to the per-character text variant.
	const isText = variant === "text";

	// Switching variant reseeds the matching default preset and value set.
	const changeVariant = (next: MorphVariant) => {
		setVariant(next);
		setAnimation(defaultAnimationForVariant(next));
		setValuesList([...VALUE_SETS[next]]);
		setValueIndex(0);
	};

	useEffect(() => {
		if (reduced) return;
		const timer = setInterval(() => setValueIndex((index) => index + 1), CYCLE_MS);
		return () => clearInterval(timer);
	}, [reduced]);

	const config = useMemo<TextMorphConfig>(
		() => ({
			variant,
			animation,
			driftX: isText ? driftX : 0,
			driftY: 0,
			trend: TREND_TO_NUMBER[trend],
			stagger,
			initial: animateInitial,
			autoSize,
		}),
		[variant, animation, isText, driftX, trend, stagger, animateInitial, autoSize],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="flex w-full items-center justify-center bg-surface-sunken px-8 py-16"
				style={{ borderRadius: 16, minHeight: 220 }}
			>
				<span className="text-5xl font-bold tracking-tight text-text sm:text-6xl">
					<TextMorphing text={current} config={config} />
				</span>
			</div>

			<GUI.Panel title="Text morphing controls" values={{ ...config, values: valuesList }}>
				<GUI.Section title="Content" borderTop={false}>
					<GUI.Select
						id="tm-variant"
						label="Variant"
						description="Text morphs per character; number rolls each digit; slots spins digit columns."
						value={variant}
						options={VARIANT_OPTIONS}
						onChange={changeVariant}
					/>
					{valuesList.map((value, index) => (
						<GUI.TextInput
							key={index}
							id={`tm-value-${index}`}
							label={`Value ${index + 1}`}
							description={
								index === 0
									? "The preview cycles through these values. Use numeric strings (e.g. $35.99) for number and slots."
									: undefined
							}
							value={value}
							onChange={(next) => setValueAt(index, next)}
						/>
					))}
				</GUI.Section>

				<GUI.Section title="Animation">
					<GUI.Select
						id="tm-animation"
						label="Animation"
						description="Transition preset applied to every glyph."
						value={animation}
						options={ANIMATION_OPTIONS}
						onChange={setAnimation}
					/>
					<GUI.Control
						id="tm-stagger"
						label="Stagger"
						description="Delay step between consecutive glyphs."
						value={stagger}
						defaultValue={0.02}
						min={0}
						max={0.1}
						step={0.005}
						unit="s"
						onChange={setStagger}
					/>
					<GUI.Control
						id="tm-drift"
						label="Drift"
						description="Horizontal swirl of entering/leaving characters, scaled by how much changed (text variant)."
						value={driftX}
						defaultValue={DEFAULT_DRIFT_X}
						min={0}
						max={60}
						step={1}
						unit="px"
						disabled={!isText}
						onChange={setDriftX}
					/>
					<GUI.Select
						id="tm-trend"
						label="Trend"
						description="Directional bias for entering/leaving characters (text variant)."
						value={trend}
						options={TREND_OPTIONS}
						onChange={setTrend}
					/>
					<GUI.Toggle
						id="tm-autosize"
						label="Auto-size"
						description="Animate the container width as the value grows or shrinks."
						checked={autoSize}
						onChange={setAutoSize}
					/>
					<GUI.Toggle
						id="tm-initial"
						label="Animate on mount"
						description="Play the morph the first time the component appears."
						checked={animateInitial}
						onChange={setAnimateInitial}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
