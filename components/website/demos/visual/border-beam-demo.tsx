"use client";

import { useMemo, useState } from "react";
import AddIcon from "@atlaskit/icon/core/add";
import AiSparkleIcon from "@atlaskit/icon/core/ai-sparkle";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import SearchIcon from "@atlaskit/icon/core/search";

import BorderBeam, {
	BORDER_BEAM_COLOR_VARIANT_OPTIONS,
	BORDER_BEAM_CONTROL_RANGES,
	BORDER_BEAM_DEFAULTS,
	BORDER_BEAM_FAMILY_OPTIONS,
	BORDER_BEAM_THEME_OPTIONS,
	getBorderBeamDefaultsForSize,
	getBorderBeamSizeOptions,
	type BorderBeamDemoConfig,
	type BorderBeamFamily,
	type BorderBeamSize,
} from "@/components/visual/border-beam";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { GUI } from "@/components/utils/gui";
import { cn } from "@/lib/utils";

type MockTheme = "dark" | "light";

const TASKS = [
	"Generate color palettes",
	"Recommend font pairings",
	"Create layout templates",
	"Build section engine",
] as const;

function getMockTheme(theme: BorderBeamDemoConfig["theme"]): MockTheme {
	return theme === "light" ? "light" : "dark";
}

function getMockShellClassName(theme: MockTheme): string {
	return theme === "light"
		? "border-border bg-white text-[#172B4D] shadow-sm"
		: "border-white/10 bg-[#161A22] text-white shadow-[0_24px_80px_rgb(0_0_0/0.38)]";
}

function renderBeamConfig(config: BorderBeamDemoConfig) {
	return {
		size: config.size,
		colorVariant: config.colorVariant,
		theme: config.theme,
		staticColors: config.staticColors,
		duration: config.duration,
		active: config.active,
		borderRadius: config.autoBorderRadius ? undefined : config.borderRadius,
		brightness: config.brightness,
		saturation: config.saturation,
		hueRange: config.hueRange,
		strength: config.strength,
	};
}

function MockChatInput({ theme = "dark" }: Readonly<{ theme?: MockTheme }>) {
	const isLight = theme === "light";
	return (
		<div
			role="img"
			aria-label="Chat input example with border beam effect"
			className={cn(
				"flex h-14 w-full min-w-0 items-center gap-3 rounded-2xl border px-4",
				isLight
					? "border-border bg-white text-[#172B4D]"
					: "border-white/10 bg-[#1D1D1D] text-white",
			)}
		>
			<span
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full border",
					isLight ? "border-border bg-surface-raised" : "border-white/10 bg-white/8",
				)}
			>
				<Icon render={<AddIcon label="" size="small" />} aria-hidden />
			</span>
			<span className={cn("min-w-0 flex-1 text-sm", isLight ? "text-text-subtle" : "text-white/62")}>
				Ask anything...
			</span>
			<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
				<Icon render={<AiSparkleIcon label="" size="small" />} aria-hidden />
			</span>
		</div>
	);
}

function MockIconButton({ theme = "dark" }: Readonly<{ theme?: MockTheme }>) {
	const isLight = theme === "light";
	return (
		<button
			type="button"
			aria-label="Generate"
			className={cn(
				"flex size-12 items-center justify-center rounded-full border",
				isLight
					? "border-border bg-white text-icon"
					: "border-white/10 bg-[#1D1D1D] text-white",
			)}
		>
			<Icon render={<AiSparkleIcon label="" size="small" />} aria-hidden />
		</button>
	);
}

function MockSearchBar({ theme = "dark" }: Readonly<{ theme?: MockTheme }>) {
	const isLight = theme === "light";
	return (
		<div
			role="img"
			aria-label="Search input example with border beam effect"
			className={cn(
				"flex h-11 w-72 items-center gap-2 rounded-full border px-4 text-sm",
				isLight
					? "border-border bg-white text-text-subtle"
					: "border-white/10 bg-[#1D1D1D] text-white/62",
			)}
		>
			<Icon render={<SearchIcon label="" size="small" />} aria-hidden />
			<span>Search or ask</span>
		</div>
	);
}

function MockSubscribeButton({ theme = "dark" }: Readonly<{ theme?: MockTheme }>) {
	const isLight = theme === "light";
	return (
		<button
			type="button"
			className={cn(
				"h-11 rounded-full border px-5 text-sm font-semibold",
				isLight
					? "border-border bg-white text-text"
					: "border-white/10 bg-[#1D1D1D] text-white",
			)}
		>
			Use template
		</button>
	);
}

function MockWorkingCard({ theme = "dark" }: Readonly<{ theme?: MockTheme }>) {
	const isLight = theme === "light";
	return (
		<div
			role="img"
			aria-label="Working task list example with border beam effect"
			className={cn(
				"w-full rounded-2xl border p-4",
				getMockShellClassName(theme),
			)}
		>
			<div className="mb-3 flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold">Working...</p>
					<p className={cn("text-xs", isLight ? "text-text-subtle" : "text-white/55")}>
						Composing agent output
					</p>
				</div>
				<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-discovery text-icon-discovery">
					<Icon render={<AiSparkleIcon label="" size="small" />} aria-hidden />
				</span>
			</div>
			<div className="space-y-2">
				{TASKS.map((task) => (
					<div
						key={task}
						className={cn(
							"flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
							isLight ? "border-border bg-surface" : "border-white/8 bg-white/5",
						)}
					>
						<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-icon-inverse">
							<Icon render={<CheckMarkIcon label="" size="small" />} aria-hidden />
						</span>
						<span className="min-w-0 truncate">{task}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function MockCard({ theme = "dark", compact = false }: Readonly<{ theme?: MockTheme; compact?: boolean }>) {
	const isLight = theme === "light";
	return (
		<div
			role="img"
			aria-label="Card example with border beam effect"
			className={cn(
				"rounded-2xl border p-5",
				compact ? "w-56" : "w-full",
				getMockShellClassName(theme),
			)}
		>
			<div className="mb-5 flex items-center gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
					<Icon render={<AiSparkleIcon label="" size="small" />} aria-hidden />
				</span>
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold">Build anything...</p>
					<p className={cn("truncate text-xs", isLight ? "text-text-subtle" : "text-white/55")}>
						Design system motion surface
					</p>
				</div>
			</div>
			<div className="grid gap-2">
				<div className={cn("h-2 rounded-full", isLight ? "bg-bg-neutral" : "bg-white/12")} />
				<div className={cn("h-2 w-4/5 rounded-full", isLight ? "bg-bg-neutral" : "bg-white/12")} />
				<div className={cn("h-2 w-2/3 rounded-full", isLight ? "bg-bg-neutral" : "bg-white/12")} />
			</div>
		</div>
	);
}

function BorderBeamPreview({
	config,
	children,
	className,
}: Readonly<{
	config: BorderBeamDemoConfig;
	children: React.ReactNode;
	className?: string;
}>) {
	return (
		<div className={cn("min-w-0 p-8", className)} data-border-beam-preview="true">
			<BorderBeam
				className={config.size === "sm" || config.size === "line" ? "mx-auto w-fit" : "w-full"}
				{...renderBeamConfig(config)}
			>
				{children}
			</BorderBeam>
		</div>
	);
}

function BorderBeamMiniDemo({
	config,
	children,
	className,
}: Readonly<{
	config: BorderBeamDemoConfig;
	children: React.ReactNode;
	className?: string;
}>) {
	return (
		<div className={cn("flex min-h-40 w-full items-center justify-center rounded-lg bg-[#0C0D12] p-8", className)}>
			<BorderBeam {...renderBeamConfig(config)}>
				{children}
			</BorderBeam>
		</div>
	);
}

function getNextSizeForFamily(family: BorderBeamFamily): BorderBeamSize {
	return family === "pulse" ? "pulse-inner" : "md";
}

export default function BorderBeamDemo() {
	const [config, setConfig] = useState<BorderBeamDemoConfig>(BORDER_BEAM_DEFAULTS);
	const mockTheme = getMockTheme(config.theme);
	const sizeOptions = useMemo(() => getBorderBeamSizeOptions(config.family), [config.family]);
	const values = useMemo(() => ({
		...config,
		borderRadius: config.autoBorderRadius ? "auto" : config.borderRadius,
	}), [config]);

	const updateConfig = <K extends keyof BorderBeamDemoConfig>(
		key: K,
		value: BorderBeamDemoConfig[K],
	) => {
		setConfig((current) => ({ ...current, [key]: value }));
	};

	const applyFamily = (family: BorderBeamFamily) => {
		const nextSize = getNextSizeForFamily(family);
		setConfig((current) => ({
			...current,
			...getBorderBeamDefaultsForSize(nextSize),
			family,
			size: nextSize,
		}));
	};

	const applySize = (size: BorderBeamSize) => {
		setConfig((current) => ({
			...current,
			...getBorderBeamDefaultsForSize(size),
			colorVariant: current.colorVariant,
			theme: current.theme,
			staticColors: current.staticColors,
			active: current.active,
			autoBorderRadius: current.autoBorderRadius,
			hueRange: current.hueRange,
			strength: current.strength,
			size,
		}));
	};

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
			<div className="overflow-hidden rounded-lg border border-border bg-[#0C0D12]">
				<BorderBeamPreview config={config} className="mx-auto max-w-2xl">
					{config.size === "sm" ? (
						<MockIconButton theme={mockTheme} />
					) : config.size === "line" ? (
						<MockSearchBar theme={mockTheme} />
					) : config.size === "pulse-inner" ? (
						<MockWorkingCard theme={mockTheme} />
					) : config.size === "pulse-outside" ? (
						<MockChatInput theme={mockTheme} />
					) : (
						<MockCard theme={mockTheme} />
					)}
				</BorderBeamPreview>
			</div>

			<GUI.Panel title="Border Beam controls" values={values}>
				<GUI.Section title="Playback" borderTop={false}>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="secondary"
							aria-pressed={config.active}
							onClick={() => updateConfig("active", !config.active)}
						>
							{config.active ? "Pause" : "Play"}
						</Button>
					</div>
					<GUI.Select
						id="border-beam-family"
						label="Family"
						value={config.family}
						options={BORDER_BEAM_FAMILY_OPTIONS}
						onChange={applyFamily}
						valueKeys="family"
					/>
					<GUI.Select
						id="border-beam-size"
						label="Size"
						value={config.size}
						options={sizeOptions}
						onChange={applySize}
						valueKeys="size"
					/>
					<GUI.Select
						id="border-beam-theme"
						label="Theme"
						value={config.theme}
						options={BORDER_BEAM_THEME_OPTIONS}
						onChange={(theme) => updateConfig("theme", theme)}
						valueKeys="theme"
					/>
					<GUI.Control
						id="border-beam-duration"
						label="Duration"
						value={config.duration}
						defaultValue={getBorderBeamDefaultsForSize(config.size).duration}
						{...BORDER_BEAM_CONTROL_RANGES.duration}
						onChange={(duration) => updateConfig("duration", duration)}
						valueKeys="duration"
					/>
					<GUI.Toggle
						id="border-beam-active"
						label="Active"
						checked={config.active}
						onChange={(active) => updateConfig("active", active)}
						valueKeys="active"
					/>
				</GUI.Section>

				<GUI.Section title="Color">
					<GUI.Select
						id="border-beam-color-variant"
						label="Variant"
						value={config.colorVariant}
						options={BORDER_BEAM_COLOR_VARIANT_OPTIONS}
						onChange={(colorVariant) => updateConfig("colorVariant", colorVariant)}
						valueKeys="colorVariant"
					/>
					<GUI.Toggle
						id="border-beam-static-colors"
						label="Static colors"
						checked={config.staticColors}
						onChange={(staticColors) => updateConfig("staticColors", staticColors)}
						valueKeys="staticColors"
					/>
					<GUI.Control
						id="border-beam-brightness"
						label="Brightness"
						value={config.brightness}
						defaultValue={getBorderBeamDefaultsForSize(config.size).brightness}
						{...BORDER_BEAM_CONTROL_RANGES.brightness}
						onChange={(brightness) => updateConfig("brightness", brightness)}
						valueKeys="brightness"
					/>
					<GUI.Control
						id="border-beam-saturation"
						label="Saturation"
						value={config.saturation}
						defaultValue={getBorderBeamDefaultsForSize(config.size).saturation}
						{...BORDER_BEAM_CONTROL_RANGES.saturation}
						onChange={(saturation) => updateConfig("saturation", saturation)}
						valueKeys="saturation"
					/>
					<GUI.Control
						id="border-beam-hue-range"
						label="Hue range"
						value={config.hueRange}
						defaultValue={30}
						{...BORDER_BEAM_CONTROL_RANGES.hueRange}
						onChange={(hueRange) => updateConfig("hueRange", hueRange)}
						valueKeys="hueRange"
					/>
				</GUI.Section>

				<GUI.Section title="Geometry">
					<GUI.Toggle
						id="border-beam-auto-radius"
						label="Auto radius"
						checked={config.autoBorderRadius}
						onChange={(autoBorderRadius) => updateConfig("autoBorderRadius", autoBorderRadius)}
						valueKeys="autoBorderRadius"
					/>
					<GUI.Control
						id="border-beam-border-radius"
						label="Border radius"
						value={config.borderRadius}
						defaultValue={getBorderBeamDefaultsForSize(config.size).borderRadius}
						disabled={config.autoBorderRadius}
						{...BORDER_BEAM_CONTROL_RANGES.borderRadius}
						onChange={(borderRadius) => updateConfig("borderRadius", borderRadius)}
						valueKeys="borderRadius"
					/>
					<GUI.Control
						id="border-beam-strength"
						label="Strength"
						value={config.strength}
						defaultValue={BORDER_BEAM_DEFAULTS.strength}
						{...BORDER_BEAM_CONTROL_RANGES.strength}
						onChange={(strength) => updateConfig("strength", strength)}
						valueKeys="strength"
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}

export function BorderBeamDemoRotateLarge() {
	const config = getBorderBeamDefaultsForSize("md");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.8 }}>
			<MockChatInput />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoRotateSmall() {
	const config = getBorderBeamDefaultsForSize("sm");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.9 }}>
			<MockIconButton />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoLineSearch() {
	const config = getBorderBeamDefaultsForSize("line");
	return (
		<BorderBeamMiniDemo config={{ ...config, borderRadius: 20, autoBorderRadius: false, strength: 0.95 }}>
			<MockSearchBar />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoPulseInnerWorking() {
	const config = getBorderBeamDefaultsForSize("pulse-inner");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.76 }}>
			<MockWorkingCard />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoPulsePill() {
	const config = getBorderBeamDefaultsForSize("pulse-inner");
	return (
		<BorderBeamMiniDemo config={{ ...config, borderRadius: 22, autoBorderRadius: false, strength: 0.82 }}>
			<MockSubscribeButton />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoPulseOutside() {
	const config = getBorderBeamDefaultsForSize("pulse-outside");
	return (
		<BorderBeamMiniDemo config={{ ...config, strength: 0.8 }}>
			<MockChatInput />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoMonoPulseSearch() {
	const config = getBorderBeamDefaultsForSize("pulse-inner");
	return (
		<BorderBeamMiniDemo config={{ ...config, colorVariant: "mono", borderRadius: 22, autoBorderRadius: false, strength: 0.9 }}>
			<MockSearchBar />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoCompactGallery() {
	const rotate = getBorderBeamDefaultsForSize("md");
	const pulse = getBorderBeamDefaultsForSize("pulse-inner");
	const outside = getBorderBeamDefaultsForSize("pulse-outside");

	return (
		<div className="grid w-full gap-3 bg-[#0C0D12] p-6 md:grid-cols-3">
			<BorderBeamMiniDemo config={{ ...rotate, colorVariant: "ocean", strength: 0.8 }} className="min-h-36 p-5">
				<MockCard compact />
			</BorderBeamMiniDemo>
			<BorderBeamMiniDemo config={{ ...pulse, colorVariant: "sunset", strength: 0.85 }} className="min-h-36 p-5">
				<MockSubscribeButton />
			</BorderBeamMiniDemo>
			<BorderBeamMiniDemo config={{ ...outside, colorVariant: "colorful", strength: 0.78 }} className="min-h-36 p-5">
				<MockIconButton />
			</BorderBeamMiniDemo>
		</div>
	);
}

export function BorderBeamDemoRovoBrand() {
	const config = getBorderBeamDefaultsForSize("md");
	return (
		<BorderBeamMiniDemo config={{ ...config, colorVariant: "rovo", strength: 0.85 }}>
			<MockChatInput />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoLightTheme() {
	const config = getBorderBeamDefaultsForSize("md");
	return (
		<BorderBeamMiniDemo
			config={{ ...config, theme: "light", strength: 0.9 }}
			className="bg-[#F7F8F9]"
		>
			<MockCard theme="light" compact />
		</BorderBeamMiniDemo>
	);
}

export function BorderBeamDemoPlayPause() {
	const config = getBorderBeamDefaultsForSize("md");
	const [active, setActive] = useState(true);
	return (
		<div className="flex min-h-40 w-full flex-col items-center justify-center gap-4 rounded-lg bg-[#0C0D12] p-8">
			<BorderBeam {...renderBeamConfig({ ...config, strength: 0.85, active })}>
				<MockCard compact />
			</BorderBeam>
			<Button
				type="button"
				variant="secondary"
				aria-pressed={active}
				onClick={() => setActive((prev) => !prev)}
			>
				{active ? "Pause beam" : "Play beam"}
			</Button>
		</div>
	);
}

export function BorderBeamDemoStrengthLadder() {
	const config = getBorderBeamDefaultsForSize("md");
	const strengths = [0.35, 0.65, 1] as const;
	return (
		<div className="grid w-full gap-3 bg-[#0C0D12] p-6 md:grid-cols-3">
			{strengths.map((strength) => (
				<BorderBeamMiniDemo key={strength} config={{ ...config, strength }} className="min-h-36 p-5">
					<MockCard compact />
				</BorderBeamMiniDemo>
			))}
		</div>
	);
}
