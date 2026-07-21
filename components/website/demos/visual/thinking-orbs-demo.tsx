"use client";

import { useMemo, useState } from "react";

import {
	ThinkingOrb,
	type OrbSize,
	type OrbState,
	type OrbTheme,
} from "@/components/visual/thinking-orbs";
import { GUI } from "@/components/utils/gui";
import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";

const ORB_STATES: readonly OrbState[] = [
	"working",
	"searching",
	"solving",
	"listening",
	"composing",
	"shaping",
];

const ORB_SIZES: readonly OrbSize[] = [64, 20];

const STATE_OPTIONS = ORB_STATES.map((state) => ({
	value: state,
	label: state.charAt(0).toUpperCase() + state.slice(1),
}));

const SIZE_OPTIONS = ORB_SIZES.map((size) => ({
	value: String(size),
	label: `${size}px`,
}));

const THEME_OPTIONS: readonly { value: OrbTheme; label: string }[] = [
	{ value: "auto", label: "Auto" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

function formatState(state: OrbState): string {
	return state.charAt(0).toUpperCase() + state.slice(1);
}

function ThinkingOrbsStateDemo({ state }: Readonly<{ state: OrbState }>) {
	const { actualTheme } = useTheme();

	return (
		<div
			data-testid={`thinking-orbs-${state}-example`}
			className={cn(
				"flex min-h-48 w-full flex-col items-center justify-center gap-6 rounded-xl border px-0 py-6 sm:flex-row sm:gap-12 sm:p-8",
				actualTheme === "dark"
					? "border-white/10 bg-[#0C0D12]"
					: "border-black/10 bg-[#F7F8F9]",
			)}
		>
			{ORB_SIZES.map((size) => (
				<div key={size} className="flex flex-col items-center gap-3">
					<ThinkingOrb state={state} size={size} theme={actualTheme} />
					<span
						className={cn(
							"text-xs",
							actualTheme === "dark" ? "text-white/60" : "text-black/60",
						)}
					>
						{size}px
					</span>
				</div>
			))}
		</div>
	);
}

export function ThinkingOrbsDemoWorking() {
	return <ThinkingOrbsStateDemo state="working" />;
}

export function ThinkingOrbsDemoSearching() {
	return <ThinkingOrbsStateDemo state="searching" />;
}

export function ThinkingOrbsDemoSolving() {
	return <ThinkingOrbsStateDemo state="solving" />;
}

export function ThinkingOrbsDemoListening() {
	return <ThinkingOrbsStateDemo state="listening" />;
}

export function ThinkingOrbsDemoComposing() {
	return <ThinkingOrbsStateDemo state="composing" />;
}

export function ThinkingOrbsDemoShaping() {
	return <ThinkingOrbsStateDemo state="shaping" />;
}

export default function ThinkingOrbsDemo() {
	const { actualTheme } = useTheme();
	const [state, setState] = useState<OrbState>("listening");
	const [size, setSize] = useState<OrbSize>(64);
	const [theme, setTheme] = useState<OrbTheme>("auto");
	const [speed, setSpeed] = useState(1);
	const [paused, setPaused] = useState(false);
	const [ariaLabel, setAriaLabel] = useState("Agent is listening");
	const resolvedTheme = theme === "auto" ? actualTheme : theme;
	const values = useMemo(
		() => ({ state, size, theme, speed, paused, ariaLabel }),
		[state, size, theme, speed, paused, ariaLabel],
	);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
			<div
				data-testid="thinking-orbs-preview"
				data-state={state}
				data-size={size}
				data-speed={speed}
				data-paused={paused}
				data-theme={theme}
				className={cn(
					"flex min-h-72 items-center justify-center rounded-xl border p-8 transition-colors duration-medium motion-reduce:transition-none",
					resolvedTheme === "dark"
						? "border-white/10 bg-[#0C0D12]"
						: "border-black/10 bg-[#F7F8F9]",
				)}
			>
				<ThinkingOrb
					state={state}
					size={size}
					theme={theme === "auto" ? actualTheme : theme}
					speed={speed}
					paused={paused}
					aria-label={ariaLabel || undefined}
				/>
			</div>

			<GUI.Panel title="Thinking Orbs controls" values={values}>
				<GUI.Section title="Variant" borderTop={false}>
					<GUI.Select
						id="thinking-orbs-state"
						label="State"
						value={state}
						defaultValue="listening"
						options={STATE_OPTIONS}
						onChange={setState}
					/>
					<GUI.SegmentedControl
						id="thinking-orbs-size"
						label="Size"
						value={String(size)}
						options={SIZE_OPTIONS}
						onChange={(next) => setSize(Number(next) as OrbSize)}
						valueKeys="size"
					/>
					<GUI.SegmentedControl
						id="thinking-orbs-theme"
						label="Theme"
						description="Auto follows the active VPK light or dark theme."
						value={theme}
						options={THEME_OPTIONS}
						onChange={setTheme}
					/>
				</GUI.Section>

				<GUI.Section title="Animation">
					<GUI.Control
						id="thinking-orbs-speed"
						label="Speed"
						description="Multiplier applied to the selected state's tuned base speed."
						value={speed}
						defaultValue={1}
						min={0.25}
						max={3}
						step={0.05}
						unit="×"
						onChange={setSpeed}
					/>
					<GUI.Toggle
						id="thinking-orbs-paused"
						label="Paused"
						description="Freezes every orb on its current representative frame."
						checked={paused}
						onChange={setPaused}
					/>
				</GUI.Section>

				<GUI.Section title="Accessibility">
					<GUI.TextInput
						id="thinking-orbs-label"
						label="Accessible label"
						description="Leave empty to use the component's state-specific default."
						value={ariaLabel}
						placeholder={`${formatState(state)}…`}
						onChange={setAriaLabel}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
