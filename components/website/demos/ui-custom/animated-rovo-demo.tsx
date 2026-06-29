"use client";

import { useMemo, useState } from "react";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AnimatedRovo, type AnimatedRovoPreset, type AnimatedRovoShapeTransition } from "@/components/ui-custom/animated-rovo";
import { GUI } from "@/components/utils/gui";

const PRESET_OPTIONS = [
	{
		value: "full-cycle" as const,
		label: "Full cycle",
		description: "One expressive pass through all four colors.",
		meta: "2.5s",
	},
	{
		value: "short-cycle" as const,
		label: "Short cycle",
		description: "Brief feedback sweep across half of the gradient.",
		meta: "0.6s",
	},
	{
		value: "custom" as const,
		label: "Custom",
		description: "Original AnimatedRovo motion with configurable dance and wheel settings.",
		meta: "legacy",
	},
] as const;

const EASE_OPTIONS = [
	{ value: "linear" as const, label: "linear" },
	{ value: "easeInOut" as const, label: "easeInOut" },
	{ value: "circIn" as const, label: "circIn" },
	{ value: "circOut" as const, label: "circOut" },
] as const;

const TYPE_OPTIONS = [
	{ value: "tween" as const, label: "tween" },
	{ value: "spring" as const, label: "spring" },
] as const;

export default function AnimatedRovoDemo() {
	const [size, setSize] = useState(64);
	const [preset, setPreset] = useState<AnimatedRovoPreset>("full-cycle");
	const [cycleDurationS, setCycleDurationS] = useState(2.5);
	const [streaming, setStreaming] = useState(false);
	const [fullSpinProbability, setFullSpinProbability] = useState(0.35);
	const [danceDistancePercent, setDanceDistancePercent] = useState(8);
	const [type, setType] = useState<"spring" | "tween">("tween");
	const [duration, setDuration] = useState(2);
	const [ease, setEase] = useState<"linear" | "easeInOut" | "circIn" | "circOut">("linear");
	const [bounce, setBounce] = useState(0.3);
	const [replayKey, setReplayKey] = useState(0);

	const transition = useMemo<AnimatedRovoShapeTransition>(
		() =>
			type === "spring"
				? { type, duration, bounce }
				: { type, duration, ease },
		[type, duration, ease, bounce],
	);

	const config = useMemo(
		() => ({
			size,
			preset,
			...(preset === "full-cycle" ? { cycleDurationS } : {}),
			...(preset === "custom"
				? {
						streaming,
						...(streaming ? {} : { fullSpinProbability, danceDistancePercent }),
						transition,
					}
				: {}),
		}),
		[size, preset, cycleDurationS, streaming, fullSpinProbability, danceDistancePercent, transition],
	);

	return (
		<div className="grid h-full w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
			<div className="flex h-full min-h-[350px] w-full flex-col items-center justify-center gap-8 rounded-lg bg-surface p-12">
				<AnimatedRovo.Root
					key={`${preset}-${cycleDurationS}-${replayKey}`}
					size={size}
					preset={preset}
					cycleDurationS={cycleDurationS}
					streaming={streaming}
					fullSpinProbability={fullSpinProbability}
					danceDistancePercent={danceDistancePercent}
					transition={preset === "custom" ? transition : undefined}
				/>
				<Button
					type="button"
					variant="outline"
					size="default"
					className="gap-2"
					onClick={() => setReplayKey((current) => current + 1)}
				>
					<Icon render={<RefreshIcon label="" size="small" />} aria-hidden />
					Replay
				</Button>
			</div>
			<div className="pt-6 pr-6">
				<GUI.Panel title="Animated Rovo controls" values={config}>
					<GUI.Select
						id="rovo-preset"
						label="Preset"
						description="Choose the baked Rovo color-cycle animation."
						value={preset}
						defaultValue="full-cycle"
						options={PRESET_OPTIONS}
						onChange={setPreset}
					/>
					<GUI.Control
						id="rovo-size"
						label="Size"
						description="Width and height of the logo in pixels."
						value={size}
						defaultValue={64}
						min={16}
						max={192}
						step={1}
						unit="px"
						onChange={setSize}
					/>
					{preset === "full-cycle" ? (
						<GUI.Control
							id="rovo-cycle-duration"
							label="Full cycle duration"
							description="Optional full-cycle duration override."
							value={cycleDurationS}
							defaultValue={2.5}
							min={0.6}
							max={5}
							step={0.1}
							unit="s"
							onChange={setCycleDurationS}
						/>
					) : null}
					{preset === "custom" ? (
						<>
							<GUI.Toggle
								id="rovo-streaming"
								label="Streaming"
								description="Settles outer pendulum animations while the inner wheel keeps rotating."
								checked={streaming}
								onChange={setStreaming}
							/>
							{!streaming ? (
								<>
									<GUI.Control
										id="rovo-full-spin-probability"
										label="Full spin probability"
										description="Chance that the next sporadic spin is a full 360-degree rotation."
										value={fullSpinProbability}
										defaultValue={0.35}
										min={0}
										max={1}
										step={0.01}
										onChange={setFullSpinProbability}
									/>
									<GUI.Control
										id="rovo-dance-distance-percent"
										label="Dance distance"
										description="How far the logo dances vertically from its origin as a percentage of size."
										value={danceDistancePercent}
										defaultValue={8}
										min={0}
										max={100}
										step={1}
										unit="%"
										onChange={setDanceDistancePercent}
									/>
								</>
							) : null}
							<GUI.Select
								id="rovo-type"
								label="Transition type"
								description="Animation interpolation method for the original inner color wheel."
								value={type}
								options={TYPE_OPTIONS}
								onChange={setType}
							/>
							<GUI.Control
								id="rovo-duration"
								label="Duration"
								description="Visual duration per 360-degree wheel rotation in seconds."
								value={duration}
								defaultValue={2}
								min={0.3}
								max={6}
								step={0.1}
								unit="s"
								onChange={setDuration}
							/>
							{type === "tween" ? (
								<GUI.Select
									id="rovo-ease"
									label="Ease"
									description="Easing function applied to each wheel rotation step."
									value={ease}
									options={EASE_OPTIONS}
									onChange={setEase}
								/>
							) : (
								<GUI.Control
									id="rovo-bounce"
									label="Bounce"
									description="Spring bounce factor (0 = no bounce, 1 = max bounce)."
									value={bounce}
									defaultValue={0.3}
									min={0}
									max={1}
									step={0.01}
									onChange={setBounce}
								/>
							)}
						</>
					) : null}
				</GUI.Panel>
			</div>
		</div>
	);
}
