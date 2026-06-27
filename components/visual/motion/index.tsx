"use client";

import { useState, type CSSProperties } from "react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

import {
	DURATIONS,
	EASINGS,
	POPUP_DIRECTIONS,
	SEMANTIC_RECIPES,
	type EasingToken,
	type MotionRecipe,
	type MotionRecipeState,
} from "./data";

// --- SVG curve geometry (pure) -------------------------------------------------
// viewBox is 0 0 100 100 with y inverted (progress 0→1 left→right, value 0→1
// bottom→top). Spring overshoots past 1.0, drawn above the box via overflow.

const round = (n: number) => Math.round(n * 100) / 100;

function cubicCurvePath([x1, y1, x2, y2]: readonly [number, number, number, number]): string {
	return `M 0 100 C ${round(x1 * 100)} ${round(100 - y1 * 100)} ${round(x2 * 100)} ${round(100 - y2 * 100)} 100 0`;
}

function springPolylinePoints(samples: readonly number[]): string {
	const last = samples.length - 1;
	return samples.map((v, i) => `${round((i / last) * 100)} ${round(100 - v * 100)}`).join(" ");
}

function EasingCurve({ easing }: Readonly<{ easing: EasingToken }>) {
	return (
		<svg
			viewBox="0 0 100 100"
			className="size-full overflow-visible"
			aria-hidden="true"
			focusable="false"
		>
			{/* resting-value (1.0) guide + baseline (0) */}
			<line x1="0" y1="0" x2="100" y2="0" className="stroke-border" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
			<line x1="0" y1="100" x2="100" y2="100" className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
			{easing.points ? (
				<path
					d={cubicCurvePath(easing.points)}
					fill="none"
					className="stroke-text"
					strokeWidth="2"
					strokeLinecap="round"
					vectorEffect="non-scaling-stroke"
				/>
			) : easing.spring ? (
				<polyline
					points={springPolylinePoints(easing.spring)}
					fill="none"
					className="stroke-text"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					vectorEffect="non-scaling-stroke"
				/>
			) : null}
		</svg>
	);
}

// --- Scoped animation CSS ------------------------------------------------------
// One class reads per-element CSS vars so each shape animates with the real
// var(--ease-*)/var(--duration-*) token (the only way to render --ease-spring's
// linear() overshoot). The reduced-motion media query is an unlayered !important
// escape hatch per .agents/rules/token-priority.md.

const MOTION_DEMO_CSS = `
@keyframes motion-demo-slide { from { transform: translateX(0); } to { transform: translateX(calc(100cqw - 100%)); } }
@keyframes motion-demo-scale { from { transform: scale(0.35); } to { transform: scale(1); } }
@keyframes motion-demo-fade { from { opacity: 0.12; } to { opacity: 1; } }
@keyframes recipe-scale-md-fade { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes recipe-scale-hover { from { transform: scale(1); } to { transform: scale(1.12); } }
@keyframes recipe-scale-sm { from { transform: scale(0.95); } to { transform: scale(1); } }
@keyframes recipe-scale-sm-fade { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes recipe-popup { from { opacity: 0; transform: translate(var(--popup-tx, 0px), var(--popup-ty, 8px)); } to { opacity: 1; transform: translate(0px, 0px); } }
@keyframes recipe-flag-enter { from { opacity: 0; transform: translateX(-50%); } to { opacity: 1; transform: translateX(0); } }
@keyframes recipe-flag-exit { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-15%); } }
@keyframes recipe-reposition { from { transform: translateX(0); } to { transform: translateX(40%); } }
.motion-demo-anim { animation: var(--demo-keyframes) var(--demo-duration) var(--demo-ease, linear) infinite alternate; }
@media (prefers-reduced-motion: reduce) { .motion-demo-anim { animation: none !important; } }
`;

const TRACK_CLASS = "relative flex h-8 items-center overflow-hidden rounded-md bg-bg-neutral [container-type:inline-size]";
const DOT_CLASS = "motion-demo-anim block size-5 shrink-0 rounded-full bg-primary";

function easeVars(keyframes: string, durationVar: string, easeVar?: string): CSSProperties {
	return {
		"--demo-keyframes": keyframes,
		"--demo-duration": `var(${durationVar})`,
		...(easeVar ? { "--demo-ease": `var(${easeVar})` } : {}),
	} as CSSProperties;
}

// --- Sections ------------------------------------------------------------------

function SectionHeader({ title, description }: Readonly<{ title: string; description: string }>) {
	return (
		<header className="flex flex-col gap-1">
			<h3 className="text-sm font-semibold text-text">{title}</h3>
			<p className="text-xs text-text-subtle">{description}</p>
		</header>
	);
}

function EasingCard({ easing }: Readonly<{ easing: EasingToken }>) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4">
			<span className="font-mono text-xs font-semibold text-text">{easing.name}</span>
			<div className="h-20 w-full px-1 pt-2">
				<EasingCurve easing={easing} />
			</div>
			<div className={TRACK_CLASS}>
				<span className={DOT_CLASS} style={easeVars("motion-demo-slide", "--duration-slowest", easing.cssVar)} />
			</div>
			<div className="flex flex-col gap-0.5">
				<span className="font-mono text-[11px] text-text-subtle">{easing.value}</span>
				{easing.note ? <span className="text-[11px] text-text-subtlest">{easing.note}</span> : null}
			</div>
		</div>
	);
}

const PROPERTY_DEMOS = [
	{ key: "position", label: "Position", hint: "translate", keyframes: "motion-demo-slide", justify: "" },
	{ key: "transform", label: "Transform", hint: "scale", keyframes: "motion-demo-scale", justify: "justify-center" },
	{ key: "opacity", label: "Opacity", hint: "fade", keyframes: "motion-demo-fade", justify: "justify-center" },
] as const;

function PropertyCard({ demo }: Readonly<{ demo: (typeof PROPERTY_DEMOS)[number] }>) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4">
			<div className="flex items-baseline justify-between gap-2">
				<span className="text-sm font-semibold text-text">{demo.label}</span>
				<span className="font-mono text-[11px] text-text-subtle">{demo.hint}</span>
			</div>
			<div className={cn(TRACK_CLASS, demo.justify)}>
				<span className={DOT_CLASS} style={easeVars(demo.keyframes, "--duration-slow", "--ease-out-practical")} />
			</div>
		</div>
	);
}

function DurationCard({ name, cssVar, ms }: Readonly<{ name: string; cssVar: string; ms: number }>) {
	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3">
			<div className="flex items-baseline justify-between gap-2">
				<span className="font-mono text-[11px] font-semibold text-text">{name}</span>
				<span className="font-mono text-[11px] text-text-subtle">{ms}ms</span>
			</div>
			<div className={TRACK_CLASS}>
				<span className={DOT_CLASS} style={easeVars("motion-demo-slide", cssVar, "--ease-linear")} />
			</div>
		</div>
	);
}

const tokenLabel = (cssVar: string) => cssVar.replace(/^--/, "");

function RecipeRow({ state, popupVars }: Readonly<{ state: MotionRecipeState; popupVars?: CSSProperties }>) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-baseline justify-between gap-2">
				<span className="text-xs font-semibold text-text">{state.state}</span>
				<span className="font-mono text-[11px] text-text-subtle">{state.adsName}</span>
			</div>
			<div className={cn(TRACK_CLASS, "justify-center")}>
				<span
					className={DOT_CLASS}
					style={{ ...easeVars(state.keyframe, state.durationVar, state.easeVar), ...popupVars }}
				/>
			</div>
			<span className="font-mono text-[11px] text-text-subtlest">
				{state.property} · {tokenLabel(state.durationVar)} · {tokenLabel(state.easeVar)}
			</span>
		</div>
	);
}

function RoleCard({ recipe }: Readonly<{ recipe: MotionRecipe }>) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4">
			<div className="flex flex-col gap-1">
				<span className="text-sm font-semibold text-text">{recipe.role}</span>
				<span className="text-[11px] text-text-subtle">{recipe.blurb}</span>
			</div>
			<div className="flex flex-col gap-3">
				{recipe.states.map((state) => (
					<RecipeRow key={state.adsName} state={state} />
				))}
			</div>
		</div>
	);
}

function PopupRoleCard({ recipe }: Readonly<{ recipe: MotionRecipe }>) {
	const [direction, setDirection] = useState(POPUP_DIRECTIONS[0].name);
	const dir = POPUP_DIRECTIONS.find((entry) => entry.name === direction) ?? POPUP_DIRECTIONS[0];
	const popupVars = { "--popup-tx": dir.tx, "--popup-ty": dir.ty } as CSSProperties;

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4">
			<div className="flex flex-col gap-1">
				<div className="flex items-center justify-between gap-2">
					<span className="text-sm font-semibold text-text">{recipe.role}</span>
					<NativeSelect
						aria-label="Popup slide direction"
						value={direction}
						onChange={(event) => setDirection(event.target.value)}
						className="w-auto"
					>
						{POPUP_DIRECTIONS.map((entry) => (
							<NativeSelectOption key={entry.name} value={entry.name}>
								{entry.name}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</div>
				<span className="text-[11px] text-text-subtle">{recipe.blurb}</span>
			</div>
			<div className="flex flex-col gap-3">
				{recipe.states.map((state) => (
					// Key by direction so the looping animation restarts cleanly with the new offset.
					<RecipeRow key={`${state.adsName}-${direction}`} state={state} popupVars={popupVars} />
				))}
			</div>
		</div>
	);
}

export function MotionTokens() {
	return (
		<div className="flex w-full flex-col gap-8">
			<style>{MOTION_DEMO_CSS}</style>

			<section className="flex flex-col gap-3">
				<SectionHeader
					title="Easing curves"
					description="Every --ease-* token: the curve (progress → value) and a shape sliding with it at duration-slowest. Spring overshoots past the resting line."
				/>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{EASINGS.map((easing) => (
						<EasingCard key={easing.name} easing={easing} />
					))}
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<SectionHeader
					title="Property types"
					description="The same easing (ease-out-practical) applied to the three animatable property kinds."
				/>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{PROPERTY_DEMOS.map((demo) => (
						<PropertyCard key={demo.key} demo={demo} />
					))}
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<SectionHeader
					title="Durations"
					description="Every --duration-* token at ease-linear, so only the time differs — 50ms vs 600ms side by side."
				/>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{DURATIONS.map((duration) => (
						<DurationCard key={duration.name} name={duration.name} cssVar={duration.cssVar} ms={duration.ms} />
					))}
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<SectionHeader
					title="Component recipes"
					description="ADS role tokens (motion.popup.*, motion.avatar.*, motion.modal.*, …) composed from the base tokens above — vpk ships no --ds-motion-* tokens. Each row pairs the ADS name with the vpk recipe."
				/>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{SEMANTIC_RECIPES.map((recipe) =>
						recipe.directional ? (
							<PopupRoleCard key={recipe.role} recipe={recipe} />
						) : (
							<RoleCard key={recipe.role} recipe={recipe} />
						)
					)}
				</div>
			</section>
		</div>
	);
}
